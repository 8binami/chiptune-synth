/**
 * ChiptuneSynth — Build Pipeline
 * Minify + Obfuscate for proprietary distribution
 *
 * Usage:  node build.js
 * Output: dist/chiptune-synth.min.js  (obfuscated, for npm + CDN)
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

// ── Config ───────────────────────────────────────────────────────────────

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = pkg.version;  // e.g. "3.0.0"

const SRC       = path.join(__dirname, 'src', 'chiptune-synth.js');
const DIST_DIR  = path.join(__dirname, 'dist');
const DIST_VER  = path.join(DIST_DIR, VERSION);                        // dist/3.0.0/
const OUT       = path.join(DIST_VER, 'chiptune-synth.min.js');        // dist/3.0.0/chiptune-synth.min.js
const OUT_ROOT  = path.join(DIST_DIR, 'chiptune-synth.min.js');        // dist/chiptune-synth.min.js (npm alias)
const CDN_DIR   = path.join(__dirname, '..', 'cdn.chiptune-synth.8binami.com', VERSION);
const CDN_OUT   = path.join(CDN_DIR, 'chiptune-synth.min.js');

// Public API names that must NOT be mangled/renamed
const RESERVED = [
    // Constructor + class name
    'ChiptuneSynth',

    // Static methods
    'noteToFrequency', 'midiToFrequency', 'frequencyToMidi',
    'getPresetNames', 'getInstrumentNames', 'getInstruments',
    'getFxPresetNames',
    'TRACK_NAMES', 'NUM_TRACKS',

    // Lifecycle
    'init', 'dispose', 'resetToDefaults',

    // Notes
    'playNote', 'playNoteByName', 'stopNote', 'stopAllNotes',

    // Presets & Instruments
    'playPreset', 'loadPreset', 'loadInstrument',

    // Configuration
    'updateTrack', 'updateEnvelope', 'updateVibrato',
    'setMasterVolume', 'getMasterVolume',
    'updateLiveNotes', 'updatePitchBend', 'updateModulation',

    // Analyser
    'getWaveformData', 'getAnalyserData', 'getFrequencyData',
    'getTrackLevel', 'getMasterLevel',

    // MIDI
    'enableMIDI', 'disableMIDI', 'setMIDITrack', 'setMIDIChannel', 'isMIDIEnabled',

    // Mixer Console
    'setTrackFaderVolume', 'setTrackPan', 'setTrackEQ',
    'setTrackSolo', 'setTrackMute', 'resetMixerToDefaults',
    'setTrackCompressorEnabled', 'setTrackCompressorThreshold',
    'setTrackCompressorRatio', 'setTrackCompressorAttack', 'setTrackCompressorRelease',
    'getTrackCompressorReduction',

    // Per-Track Effects
    'setDistortion', 'setDelayTime', 'setDelayFeedback', 'setDelayMix',
    'setReverbMix', 'setReverbDecay',
    'setChorusRate', 'setChorusDepth', 'setChorusMix',
    'setBitcrusherBits', 'setBitcrusherRate',
    'getTrackFxParams', 'loadFxPreset',

    // Arpeggiator
    'setArpeggiator', 'getArpeggiator',
    'arpNoteOn', 'arpNoteOff', 'arpStopAll',

    // Public properties (accessed by users)
    'audioContext', 'masterGain', 'analyser', 'limiter', 'initialized',
    'pitchBend', 'modulation', 'bpm',
    'tracks', 'envelopes', 'vibrato', 'activeNotes',
    'channelStrips', 'mixerSettings',

    // Track property names (used in updateTrack)
    'type', 'volume', 'dutyCycle', 'pitchEnv', 'glide', 'detune',
    'unisonVoices', 'unisonDetune', 'unisonSpread',
    'filterEnabled', 'filterType', 'filterCutoff', 'filterQ', 'filterKeyTrack',
    'filterEnvAmount', 'filterEnvAttack', 'filterEnvRelease',
    'lfoFilterRate', 'lfoFilterDepth', 'tremoloRate', 'tremoloDepth',
    'filterLfoRate', 'filterLfoDepth',
    'octaveOffset', 'semitoneOffset',

    // Envelope property names
    'attack', 'decay', 'sustain', 'release',

    // Vibrato property names
    'rate', 'depth',

    // Arpeggiator property names
    'mode', 'octaves', 'gate',

    // Mixer settings property names
    'eqLow', 'eqMid', 'eqHigh', 'solo', 'mute', 'compressor',
    'threshold', 'ratio',

    // MIDI callback options
    'track', 'channel', 'onConnect', 'onDisconnect',
    'onNoteOn', 'onNoteOff', 'onCC',

    // Instrument definition properties (returned by getInstruments)
    'name', 'label', 'icon', 'env', 'vib', 'mod',
    'duty', 'vol', 'category',

    // Preset property names
    'freq', 'dur',

    // Web Audio API (must not be mangled)
    'AudioContext', 'webkitAudioContext',
    'createGain', 'createOscillator', 'createAnalyser',
    'createBiquadFilter', 'createBufferSource', 'createBuffer',
    'createPeriodicWave', 'createStereoPanner', 'createConvolver',
    'createDelay', 'createWaveShaper', 'createDynamicsCompressor',
    'createScriptProcessor',
    'connect', 'disconnect', 'start', 'stop', 'close',
    'destination', 'currentTime', 'sampleRate',
    'frequency', 'gain', 'value', 'pan', 'Q', 'knee',
    'reduction', 'delayTime', 'buffer', 'loop', 'curve', 'oversample',
    'getChannelData', 'fftSize', 'frequencyBinCount',
    'smoothingTimeConstant',
    'getByteTimeDomainData', 'getByteFrequencyData',
    'setValueAtTime', 'linearRampToValueAtTime',
    'exponentialRampToValueAtTime', 'setTargetAtTime',
    'cancelScheduledValues', 'setPeriodicWave',
    'inputBuffer', 'outputBuffer', 'onaudioprocess',

    // UMD / Module
    'module', 'exports', 'define', 'amd', 'globalThis',

    // MIDI API
    'requestMIDIAccess', 'navigator', 'inputs', 'sysex',
    'addEventListener', 'removeEventListener',
    'state', 'port', 'data',

    // Standard JS
    'prototype', 'hasOwnProperty', 'Math', 'JSON',
    'parse', 'stringify', 'pow', 'log2', 'random', 'round', 'abs', 'max', 'min', 'sqrt', 'floor',
    'Array', 'isArray', 'Map', 'Uint8Array', 'Float32Array',
    'Promise', 'reject', 'resolve', 'then',
    'Error', 'setTimeout', 'clearTimeout', 'forEach', 'push', 'keys', 'filter', 'reverse', 'sort',
    'set', 'get', 'has', 'delete', 'fill', 'length', 'indexOf', 'substring',
    'window', 'console', 'log', 'warn',
    'toFixed', 'parseFloat',

    // SoundFont API
    'registerSoundFont', 'getSoundFonts', 'getKits', 'getInstrumentsByCategory',
    'categories', 'kits', 'version',
    'envelope',
    'lfo1Wave', 'lfo2Wave', 'lfo3Wave',
    'lfo1Delay', 'lfo2Delay', 'lfo3Delay',
    'presetKey', 'presetType', 'cover', 'designer', 'tags',
];

// ── Banner ───────────────────────────────────────────────────────────────

const BANNER = `/**
 * ChiptuneSynth v${pkg.version}
 * (c) ${new Date().getFullYear()} 8Binami / 8BitForge
 * https://8bitforge.com
 *
 * This software is proprietary. Unauthorized copying, modification,
 * reverse engineering, or distribution is strictly prohibited.
 * See LICENSE for terms.
 */`;

// ── Build ────────────────────────────────────────────────────────────────

async function build() {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║   ChiptuneSynth — Proprietary Build      ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');

    // 1. Read source
    const source = fs.readFileSync(SRC, 'utf8');
    const srcSize = Buffer.byteLength(source);
    console.log(`  [1/3] Source:      ${SRC}`);
    console.log(`         Size:       ${(srcSize / 1024).toFixed(1)} KB (${source.split('\n').length} lines)`);

    // 2. Minify with Terser (strip comments, whitespace, shorten internals)
    console.log('  [2/3] Minifying with Terser...');
    const terserResult = await minify(source, {
        compress: {
            dead_code: true,
            drop_console: false, // keep console for MIDI debug
            passes: 2,
            pure_getters: true,
            unsafe_math: true,
        },
        mangle: {
            reserved: RESERVED,
            properties: false, // don't mangle properties (safety)
        },
        format: {
            comments: false,
            preamble: BANNER,
        },
    });

    if (terserResult.error) {
        console.error('  ✗ Terser error:', terserResult.error);
        process.exit(1);
    }

    const minSize = Buffer.byteLength(terserResult.code);
    console.log(`         Minified:   ${(minSize / 1024).toFixed(1)} KB (${((1 - minSize / srcSize) * 100).toFixed(0)}% reduction)`);

    // 3. Obfuscate with javascript-obfuscator (anti reverse-engineering)
    console.log('  [3/3] Obfuscating...');
    const obfuscated = JavaScriptObfuscator.obfuscate(terserResult.code, {
        // ── Target ──
        target: 'browser',

        // ── Identifier renaming ──
        identifierNamesGenerator: 'hexadecimal',
        reservedNames: RESERVED,
        reservedStrings: [],

        // ── String protection ──
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

        // ── Control flow ──
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,

        // ── Code transforms ──
        transformObjectKeys: true,
        numbersToExpressions: true,
        renameGlobals: false,       // keep ChiptuneSynth accessible
        renameProperties: false,    // safety: don't rename obj props

        // ── Dead code (moderate — not too bloated) ──
        deadCodeInjection: false,   // disabled to keep size reasonable

        // ── Self-defending (anti-debug) ──
        selfDefending: false,       // can cause issues, keep off
        debugProtection: false,

        // ── Source map ──
        sourceMap: false,

        // ── Unicode escapes ──
        unicodeEscapeSequence: true,

        // ── Compact ──
        compact: true,

        // ── Seed (reproducible builds) ──
        seed: 8,
    });

    const obfCode = BANNER + '\n' + obfuscated.getObfuscatedCode();
    const obfSize = Buffer.byteLength(obfCode);
    console.log(`         Obfuscated: ${(obfSize / 1024).toFixed(1)} KB`);

    // 4. Write dist/v{major}/ + dist/ root alias
    if (!fs.existsSync(DIST_VER)) fs.mkdirSync(DIST_VER, { recursive: true });
    fs.writeFileSync(OUT, obfCode, 'utf8');
    console.log(`         → ${OUT}`);

    if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(OUT_ROOT, obfCode, 'utf8');
    console.log(`         → ${OUT_ROOT}  (npm alias)`);

    // 5. Copy to CDN
    if (!fs.existsSync(CDN_DIR)) fs.mkdirSync(CDN_DIR, { recursive: true });
    fs.writeFileSync(CDN_OUT, obfCode, 'utf8');
    console.log(`         → ${CDN_OUT}`);

    // 6. Summary
    console.log('');
    console.log('  ┌──────────────────────────────────────────┐');
    console.log(`  │  Source:     ${(srcSize / 1024).toFixed(1).padStart(7)} KB                  │`);
    console.log(`  │  Minified:   ${(minSize / 1024).toFixed(1).padStart(7)} KB  (${((1 - minSize / srcSize) * 100).toFixed(0)}% smaller)       │`);
    console.log(`  │  Obfuscated: ${(obfSize / 1024).toFixed(1).padStart(7)} KB  (proprietary)    │`);
    console.log('  │                                          │');
    console.log(`  │  dist/${VERSION}/chiptune-synth.min.js ✓  │`);
    console.log(`  │  dist/chiptune-synth.min.js       ✓    │`);
    console.log(`  │  cdn.chiptune-synth.8binami.com/${VERSION}/  ✓  │`);
    console.log('  └──────────────────────────────────────────┘');
    console.log('');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
