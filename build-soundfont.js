/**
 * ChiptuneSynth — SoundFont Build Pipeline
 * Fetches instruments from 8BitForge API, generates chiptune-sound-font.min.js
 *
 * Usage:  node build-soundfont.js
 * Source: http://localhost/8b/com.8binami.api/soundfont/export
 * Output: dist/chiptune-sound-font.min.js  +  cdn copy
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// ── Config ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost/8b/com.8binami.api/soundfont/export';
const COMMUNITY_URL = 'http://localhost/8b/com.8binami.api/soundfont/community';
const pkg      = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION  = pkg.version;  // e.g. "3.0.0"

const DIST_DIR  = path.join(__dirname, 'dist');
const DIST_VER  = path.join(DIST_DIR, VERSION);                              // dist/3.0.0/
const SRC_DIR   = path.join(__dirname, 'src');
const SRC_OUT   = path.join(SRC_DIR, 'chiptune-sound-font.js');
const DIST_OUT  = path.join(DIST_VER, 'chiptune-sound-font.min.js');         // dist/3.0.0/chiptune-sound-font.min.js
const DIST_ROOT = path.join(DIST_DIR, 'chiptune-sound-font.min.js');         // dist/chiptune-sound-font.min.js (alias)
const CDN_DIR   = path.join(__dirname, '..', 'cdn.chiptune-synth.8binami.com', VERSION);
const CDN_OUT   = path.join(CDN_DIR, 'chiptune-sound-font.min.js');

// Reserved names (public API — must not be mangled)
const RESERVED = [
    'ChiptuneSynth', 'registerSoundFont', 'getSoundFonts', 'getKits',
    'getInstrumentNames', 'getInstrumentsByCategory',
    'name', 'version', 'categories', 'kits',
    'label', 'icon', 'category', 'type', 'dutyCycle', 'volume', 'detune',
    'pitchEnv', 'glide', 'octaveOffset', 'semitoneOffset',
    'envelope', 'attack', 'decay', 'sustain', 'release',
    'vibrato', 'rate', 'depth',
    'filterEnabled', 'filterType', 'filterCutoff', 'filterQ', 'filterKeyTrack',
    'filterEnvAmount', 'filterEnvAttack', 'filterEnvRelease',
    'filterLfoRate', 'filterLfoDepth', 'lfoFilterRate', 'lfoFilterDepth',
    'tremoloRate', 'tremoloDepth',
    'unisonVoices', 'unisonDetune', 'unisonSpread',
    'lfo1Wave', 'lfo2Wave', 'lfo3Wave', 'lfo1Delay', 'lfo2Delay', 'lfo3Delay',
    'presetKey', 'presetType', 'tracks', 'cover',
    'module', 'exports', 'define', 'amd', 'globalThis',
];

// ── Build ────────────────────────────────────────────────────────────────

async function build() {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   ChiptuneSynth — SoundFont Build        ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');

    // 1. Fetch from API
    console.log('  [1/5] Fetching from API...');
    console.log('         ' + API_URL);

    const response = await fetch(API_URL);
    if (!response.ok) {
        console.error('  ✗ API error:', response.status, response.statusText);
        process.exit(1);
    }
    const data = await response.json();
    if (!data.success) {
        console.error('  ✗ API returned error:', data.error);
        process.exit(1);
    }

    const { version, hash, categories, kits, total } = data;
    console.log(`         Version:    ${version}`);
    console.log(`         Hash:       ${hash}`);
    console.log(`         Presets:    ${total}`);
    console.log(`         Kits:       ${Object.keys(kits).length}`);
    console.log(`         Categories: ${Object.keys(categories).join(', ')}`);

    // 1b. Fetch community presets
    console.log('         Fetching community presets...');
    let communityPresets = [];
    try {
        const commResp = await fetch(COMMUNITY_URL);
        if (commResp.ok) {
            const commData = await commResp.json();
            if (commData.success && commData.presets) {
                communityPresets = commData.presets;
                console.log(`         Community:  ${communityPresets.length} presets`);
            }
        }
    } catch (e) {
        console.log('         Community:  0 (API unavailable, skipping)');
    }

    // Merge community presets into categories under "community"
    if (communityPresets.length > 0) {
        if (!categories.community) categories.community = {};
        communityPresets.forEach(function (cp) {
            // Build a safe key from designer + name
            var safeKey = 'community-' + (cp.designer || 'anon') + '-' + (cp.name || 'preset')
                .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            // Merge the preset data with metadata
            var preset = Object.assign({}, cp.data || {});
            preset.name = cp.name;
            preset.designer = cp.designer;
            categories.community[safeKey] = preset;
        });
        console.log(`         Total:     ${total + communityPresets.length} (${total} builtin + ${communityPresets.length} community)`);
    }

    var grandTotal = total + communityPresets.length;

    // 2. Generate source JS
    console.log('  [2/5] Generating source...');

    const sourceJs = generateSource(version, hash, categories, kits, grandTotal);
    const srcSize = Buffer.byteLength(sourceJs);
    console.log(`         Source:     ${(srcSize / 1024).toFixed(1)} KB`);

    // Write readable source (for reference, not published)
    fs.writeFileSync(SRC_OUT, sourceJs, 'utf8');
    console.log(`         → ${SRC_OUT}`);

    // 3. Minify
    console.log('  [3/5] Minifying...');

    const banner = `/**
 * ChiptuneSynth SoundFont v${version}
 * (c) ${new Date().getFullYear()} 8Binami / 8BitForge
 * https://8bitforge.com
 * ${total} instruments | ${Object.keys(kits).length} kits
 * Proprietary — See LICENSE
 */`;

    const terserResult = await minify(sourceJs, {
        compress: { dead_code: true, passes: 2 },
        mangle: { reserved: RESERVED, properties: false },
        format: { comments: false, preamble: banner },
    });

    if (terserResult.error) {
        console.error('  ✗ Terser error:', terserResult.error);
        process.exit(1);
    }

    const minSize = Buffer.byteLength(terserResult.code);
    console.log(`         Minified:   ${(minSize / 1024).toFixed(1)} KB`);

    // 4. Obfuscate
    console.log('  [4/5] Obfuscating...');

    const obfuscated = JavaScriptObfuscator.obfuscate(terserResult.code, {
        target: 'browser',
        identifierNamesGenerator: 'hexadecimal',
        reservedNames: RESERVED,
        stringArray: true,
        stringArrayThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersType: 'function',
        splitStrings: true,
        splitStringsChunkLength: 5,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.4,
        transformObjectKeys: true,
        numbersToExpressions: true,
        renameGlobals: false,
        renameProperties: false,
        deadCodeInjection: false,
        selfDefending: false,
        debugProtection: false,
        sourceMap: false,
        unicodeEscapeSequence: true,
        compact: true,
        seed: 88,
    });

    const obfCode = banner + '\n' + obfuscated.getObfuscatedCode();
    const obfSize = Buffer.byteLength(obfCode);
    console.log(`         Obfuscated: ${(obfSize / 1024).toFixed(1)} KB`);

    // 5. Write outputs
    console.log('  [5/5] Writing files...');

    // dist/v{major}/
    if (!fs.existsSync(DIST_VER)) fs.mkdirSync(DIST_VER, { recursive: true });
    fs.writeFileSync(DIST_OUT, obfCode, 'utf8');
    console.log(`         → ${DIST_OUT}`);

    // dist/ root alias (for npm + index.php)
    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(DIST_ROOT, obfCode, 'utf8');
    console.log(`         → ${DIST_ROOT}  (npm alias)`);

    // CDN
    if (!fs.existsSync(CDN_DIR)) fs.mkdirSync(CDN_DIR, { recursive: true });
    fs.writeFileSync(CDN_OUT, obfCode, 'utf8');
    console.log(`         → ${CDN_OUT}`);

    // Summary
    console.log('');
    console.log('  ┌──────────────────────────────────────────────┐');
    console.log(`  │  SoundFont v${version.padEnd(30)}│`);
    console.log(`  │  ${String(total).padStart(3)} instruments | ${String(Object.keys(kits).length).padStart(2)} kits${' '.repeat(19)}│`);
    console.log(`  │  Source:     ${(srcSize / 1024).toFixed(1).padStart(7)} KB                     │`);
    console.log(`  │  Minified:   ${(minSize / 1024).toFixed(1).padStart(7)} KB                     │`);
    console.log(`  │  Obfuscated: ${(obfSize / 1024).toFixed(1).padStart(7)} KB                     │`);
    console.log('  │                                              │');
    console.log(`  │  dist/${VERSION}/chiptune-sound-font.min.js ✓  │`);
    console.log(`  │  dist/chiptune-sound-font.min.js         ✓  │`);
    console.log(`  │  cdn.chiptune-synth.8binami.com/${VERSION}/  ✓  │`);
    console.log('  └──────────────────────────────────────────────┘');
    console.log('');
}

// ── Source Generator ─────────────────────────────────────────────────────

function generateSource(version, hash, categories, kits, total) {
    const lines = [];

    lines.push('/**');
    lines.push(` * ChiptuneSynth SoundFont v${version}`);
    lines.push(` * ${total} instruments | ${Object.keys(kits).length} kits`);
    lines.push(' * Auto-generated by build-soundfont.js — DO NOT EDIT');
    lines.push(` * Source hash: ${hash}`);
    lines.push(' */');
    lines.push('(function () {');
    lines.push('    "use strict";');
    lines.push('');
    lines.push('    if (typeof ChiptuneSynth === "undefined" || !ChiptuneSynth.registerSoundFont) {');
    lines.push('        console.warn("[ChiptuneSynth SoundFont] ChiptuneSynth not found. Load chiptune-synth.js first.");');
    lines.push('        return;');
    lines.push('    }');
    lines.push('');
    lines.push('    ChiptuneSynth.registerSoundFont({');
    lines.push(`        name: "8BitForge Default",`);
    lines.push(`        version: "${version}",`);
    lines.push('');

    // ── Categories ──
    lines.push('        categories: {');

    const catKeys = Object.keys(categories);
    catKeys.forEach(function (cat, ci) {
        const presets = categories[cat];
        const presetKeys = Object.keys(presets);
        lines.push('');
        lines.push(`            // ═══ ${cat.toUpperCase()} (${presetKeys.length}) ═══`);
        lines.push(`            ${JSON.stringify(cat)}: {`);

        presetKeys.forEach(function (key, pi) {
            const preset = presets[key];
            const json = JSON.stringify(preset);
            const comma = pi < presetKeys.length - 1 ? ',' : '';
            lines.push(`                ${JSON.stringify(key)}: ${json}${comma}`);
        });

        const catComma = ci < catKeys.length - 1 ? ',' : '';
        lines.push(`            }${catComma}`);
    });

    lines.push('        },');
    lines.push('');

    // ── Kits ──
    lines.push('        kits: {');
    const kitKeys = Object.keys(kits);
    kitKeys.forEach(function (key, ki) {
        const kit = kits[key];
        const json = JSON.stringify(kit);
        const comma = ki < kitKeys.length - 1 ? ',' : '';
        lines.push(`            ${JSON.stringify(key)}: ${json}${comma}`);
    });
    lines.push('        }');

    lines.push('    });');
    lines.push('');
    lines.push('})();');

    return lines.join('\n');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
