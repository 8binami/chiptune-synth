#!/usr/bin/env node
/**
 * Builds a release of ChiptuneSynth: src/ → dist/<version>/.  Usage:
 *
 *     npm run build
 *
 * The version is the one of package.json. A built version is frozen: once
 * dist/<version>/ exists it is never rewritten (the CDN caches it for a year),
 * so a change to src/ means a new version number in package.json first.
 *
 * Output, next to each other, as the CDN serves them:
 *     chiptune-synth.min.js         the engine
 *     chiptune-sound-font.min.js    the 170+ instruments and kits
 *     bitcrusher-worklet.js         the AudioWorklet, loaded by the engine from its own folder
 *     checksums-<version>.json      SHA-256 of the three, same format as the 8BitForge downloads
 *
 * Copyright (C) 2026 8Binami SAS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');

const ROOT = path.join(__dirname, '..');
const { version } = require(path.join(ROOT, 'package.json'));
const OUT = path.join(ROOT, 'dist', version);

const FILES = [
    ['chiptune-synth.js', 'chiptune-synth.min.js'],
    ['chiptune-sound-font.js', 'chiptune-sound-font.min.js'],
    ['bitcrusher-worklet.js', 'bitcrusher-worklet.js'],
];

const banner = (what) => `/*! ChiptuneSynth ${version}${what} | (C) 2026 8Binami SAS | GNU AGPL-3.0-or-later | https://github.com/8binami/chiptune-synth */\n`;

async function main() {
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`package.json version "${version}" is not x.y.z`);
    if (fs.existsSync(OUT)) {
        console.error(`dist/${version}/ already exists: a published version never changes.`);
        console.error('Bump "version" in package.json, then build again.');
        process.exit(1);
    }

    // The engine states its own version in its header: it must be this one.
    const engine = fs.readFileSync(path.join(ROOT, 'src', 'chiptune-synth.js'), 'utf8');
    const stated = (engine.match(/@version\s+(\S+)/) || [])[1];
    if (stated !== version) throw new Error(`src/chiptune-synth.js says @version ${stated}, package.json says ${version}`);

    const built = {};
    for (const [src, out] of FILES) {
        const code = fs.readFileSync(path.join(ROOT, 'src', src), 'utf8');
        const result = await minify(code, {
            compress: { passes: 2 },
            mangle: true,
            // registerProcessor('bitcrusher-processor', …) must keep its class and name
            keep_classnames: src === 'bitcrusher-worklet.js',
            format: { comments: false },
        });
        const label = src === 'chiptune-sound-font.js' ? ' sound font' : src === 'bitcrusher-worklet.js' ? ' bitcrusher worklet' : '';
        built[out] = banner(label) + result.code + '\n';
    }

    fs.mkdirSync(OUT, { recursive: true });
    const files = {};
    for (const [name, content] of Object.entries(built)) {
        fs.writeFileSync(path.join(OUT, name), content);
        files[name] = crypto.createHash('sha256').update(content).digest('hex');
        console.log(`${files[name]}  dist/${version}/${name}  (${(content.length / 1024).toFixed(1)} KB)`);
    }
    const manifest = { version, algorithm: 'sha256', generated: new Date().toISOString().replace(/\.\d+Z$/, '+00:00'), files };
    fs.writeFileSync(path.join(OUT, `checksums-${version}.json`), JSON.stringify(manifest, null, 4) + '\n');
    console.log(`dist/${version}/checksums-${version}.json written`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
