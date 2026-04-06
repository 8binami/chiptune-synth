/**
 * ChiptuneSynth — Ultimate 8-Bit Chiptune Synthesizer
 * A standalone Web Audio API synthesizer for retro 8-bit sound generation.
 *
 * @author 8Binami / 8BitForge
 * @license SEE LICENSE IN LICENSE
 * @version 3.0.0
 * @see https://8bitforge.com
 *
 * Features:
 *   - 8 tracks (Lead, Harmony, Bass, Arp, Kick, Snare, Hi-hat, FX)
 *   - 5 waveforms: Square (PWM), Triangle, Sawtooth, Sine, Noise
 *   - Per-track ADSR envelope, vibrato, filter, 3 LFOs, pitch envelope, glide
 *   - Unison voices (1-16) with detune & stereo spread
 *   - Per-track effects chain: Distortion, Chorus, Delay, Reverb, Bitcrusher
 *   - Mixer console: Pan, 3-band EQ, Compressor, Solo/Mute per track
 *   - Master limiter (brick-wall)
 *   - Arpeggiator (up/down/updown/random, BPM-synced, octave spanning)
 *   - Pitch bend & modulation wheel
 *   - Built-in game audio SFX presets
 *   - Waveform analyser for visualization
 *   - Web MIDI support with velocity, CC, pitch bend
 *   - Zero dependencies — pure Web Audio API
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) module.exports = factory();
    else if (typeof define === 'function' && define.amd) define(factory);
    else root.ChiptuneSynth = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ── Default modulation parameters ─────────────────────────────────────
    var DEFAULT_MOD = {
        filterCutoff: 20000, filterQ: 0.1, filterEnabled: false,
        filterType: 'lowpass', filterKeyTrack: 0,
        filterLfoRate: 0, filterLfoDepth: 0,
        lfoFilterRate: 0, lfoFilterDepth: 0,
        tremoloRate: 0, tremoloDepth: 0,
        filterEnvAmount: 0, filterEnvAttack: 0.01, filterEnvRelease: 0.2,
        unisonVoices: 1, unisonDetune: 0, unisonSpread: 0,
        octaveOffset: 0, semitoneOffset: 0, phase: 0,
        lfo1Wave: 'sine', lfo1Sync: false, lfo1Delay: 0,
        lfo2Wave: 'sine', lfo2Sync: false, lfo2Delay: 0,
        lfo3Wave: 'sine', lfo3Sync: false, lfo3Delay: 0
    };

    // Volume rebalanced for proper gain staging (sum ~ 2.06 x masterGain 0.5 ~ 0 dBFS)
    var DEFAULT_TRACKS = [
        { type: 'square',   volume: 0.20, dutyCycle: 0.5,   detune: 0, pitchEnv: 0,  glide: 0   }, // 0: Lead
        { type: 'square',   volume: 0.15, dutyCycle: 0.25,  detune: 0, pitchEnv: 0,  glide: 0   }, // 1: Harmony
        { type: 'triangle', volume: 0.25, dutyCycle: 0.5,   detune: 0, pitchEnv: 0,  glide: 0.1 }, // 2: Bass
        { type: 'sawtooth', volume: 0.18, dutyCycle: 0.5,   detune: 0, pitchEnv: 0,  glide: 0   }, // 3: Arp
        { type: 'sine',     volume: 0.50, dutyCycle: 0.5,   detune: 0, pitchEnv: 36, glide: 0   }, // 4: Kick
        { type: 'noise',    volume: 0.35, dutyCycle: 0.5,   detune: 0, pitchEnv: 0,  glide: 0   }, // 5: Snare
        { type: 'noise',    volume: 0.25, dutyCycle: 0.5,   detune: 0, pitchEnv: 0,  glide: 0   }, // 6: Hi-hat
        { type: 'square',   volume: 0.18, dutyCycle: 0.125, detune: 0, pitchEnv: 0,  glide: 0   }  // 7: FX
    ];

    var DEFAULT_ENVELOPES = [
        { attack: 0.01,  decay: 0.10,  sustain: 0.7, release: 0.20 }, // Lead
        { attack: 0.02,  decay: 0.15,  sustain: 0.6, release: 0.30 }, // Harmony
        { attack: 0.01,  decay: 0.20,  sustain: 0.8, release: 0.15 }, // Bass
        { attack: 0.001, decay: 0.05,  sustain: 0.5, release: 0.10 }, // Arp
        { attack: 0.001, decay: 0.30,  sustain: 0.0, release: 0.02 }, // Kick
        { attack: 0.001, decay: 0.10,  sustain: 0.0, release: 0.05 }, // Snare
        { attack: 0.001, decay: 0.06,  sustain: 0.0, release: 0.01 }, // Hi-hat
        { attack: 0.005, decay: 0.30,  sustain: 0.0, release: 0.20 }  // FX
    ];

    var TRACK_NAMES = ['Lead', 'Harmony', 'Bass', 'Arp', 'Kick', 'Snare', 'Hi-hat', 'FX'];
    var NUM_TRACKS = 8;

    var NOTE_MAP = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };

    // ── SFX Presets (game audio one-shots) ───────────────────────────────
    var PRESETS = {
        laser:     { track:7, freq:880,    dur:0.25, type:'square',   vol:0.35, duty:0.25,  env:{attack:0.001,decay:0.20,sustain:0.00,release:0.02}, pitchEnv:-24, mod:{} },
        coin:      { track:0, freq:1318.5, dur:0.12, type:'square',   vol:0.30, duty:0.50,  env:{attack:0.001,decay:0.08,sustain:0.00,release:0.02}, pitchEnv:5,   mod:{} },
        jump:      { track:4, freq:200,    dur:0.20, type:'sine',     vol:0.50, duty:0.50,  env:{attack:0.001,decay:0.15,sustain:0.00,release:0.02}, pitchEnv:12,  mod:{} },
        explosion: { track:5, freq:100,    dur:0.50, type:'noise',    vol:0.55, duty:0.50,  env:{attack:0.001,decay:0.40,sustain:0.00,release:0.05}, pitchEnv:0,   mod:{} },
        powerup:   { track:7, freq:440,    dur:0.60, type:'square',   vol:0.30, duty:0.50,  env:{attack:0.01, decay:0.50,sustain:0.00,release:0.05}, pitchEnv:24,  mod:{}, vib:{rate:6,depth:8} },
        hit:       { track:5, freq:150,    dur:0.15, type:'noise',    vol:0.60, duty:0.50,  env:{attack:0.001,decay:0.10,sustain:0.00,release:0.02}, pitchEnv:0,   mod:{} },
        blip:      { track:0, freq:1046.5, dur:0.06, type:'square',   vol:0.25, duty:0.50,  env:{attack:0.001,decay:0.04,sustain:0.00,release:0.01}, pitchEnv:0,   mod:{} },
        bass:      { track:2, freq:65.41,  dur:0.30, type:'triangle', vol:0.45, duty:0.50,  env:{attack:0.005,decay:0.20,sustain:0.00,release:0.05}, pitchEnv:0,   mod:{} },
        shoot:     { track:7, freq:1200,   dur:0.15, type:'square',   vol:0.30, duty:0.125, env:{attack:0.001,decay:0.12,sustain:0.00,release:0.01}, pitchEnv:-36, mod:{} },
        '1up':     { track:0, freq:659.25, dur:0.08, type:'square',   vol:0.28, duty:0.50,  env:{attack:0.001,decay:0.06,sustain:0.00,release:0.01}, pitchEnv:7,   mod:{} }
    };

    // ── Instrument Presets (configures a track to sound like an instrument) ─
    var INSTRUMENTS = {
        piano: {
            label: 'Piano', icon: 'piano',
            type: 'triangle', duty: 0.5, vol: 0.35, pitchEnv: 0, glide: 0,
            env: { attack: 0.005, decay: 0.4, sustain: 0.15, release: 0.3 },
            vib: { rate: 0, depth: 0 },
            mod: { unisonVoices: 2, unisonDetune: 3, unisonSpread: 30, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 6000, filterQ: 1, filterKeyTrack: 50,
                   filterEnvAmount: 24, filterEnvAttack: 0.005, filterEnvRelease: 0.5,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        violin: {
            label: 'Violin', icon: 'music-note',
            type: 'sawtooth', duty: 0.5, vol: 0.28, pitchEnv: 0, glide: 0.04,
            env: { attack: 0.08, decay: 0.2, sustain: 0.85, release: 0.25 },
            vib: { rate: 5.5, depth: 10 },
            mod: { unisonVoices: 2, unisonDetune: 5, unisonSpread: 40, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 5000, filterQ: 1.5, filterKeyTrack: 40,
                   filterEnvAmount: 12, filterEnvAttack: 0.08, filterEnvRelease: 0.3,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        cello: {
            label: 'Cello', icon: 'music-note-beamed',
            type: 'sawtooth', duty: 0.5, vol: 0.32, pitchEnv: 0, glide: 0.06,
            env: { attack: 0.12, decay: 0.3, sustain: 0.8, release: 0.4 },
            vib: { rate: 4.5, depth: 8 },
            mod: { unisonVoices: 2, unisonDetune: 4, unisonSpread: 35, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 3000, filterQ: 1.2, filterKeyTrack: 30,
                   filterEnvAmount: 8, filterEnvAttack: 0.12, filterEnvRelease: 0.4,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        flute: {
            label: 'Flute', icon: 'wind',
            type: 'sine', duty: 0.5, vol: 0.30, pitchEnv: 0, glide: 0.02,
            env: { attack: 0.06, decay: 0.1, sustain: 0.9, release: 0.15 },
            vib: { rate: 5, depth: 6 },
            mod: { unisonVoices: 1, unisonDetune: 0, unisonSpread: 0, filterEnabled: false,
                   filterType: 'lowpass', filterCutoff: 20000, filterQ: 0.1, filterKeyTrack: 0,
                   filterEnvAmount: 0, filterEnvAttack: 0.01, filterEnvRelease: 0.2,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 2.5, tremoloDepth: 8 }
        },
        organ: {
            label: 'Organ', icon: 'grid-3x3',
            type: 'square', duty: 0.5, vol: 0.25, pitchEnv: 0, glide: 0,
            env: { attack: 0.01, decay: 0.05, sustain: 1.0, release: 0.08 },
            vib: { rate: 6, depth: 5 },
            mod: { unisonVoices: 3, unisonDetune: 2, unisonSpread: 50, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 8000, filterQ: 0.5, filterKeyTrack: 20,
                   filterEnvAmount: 0, filterEnvAttack: 0.01, filterEnvRelease: 0.2,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        brass: {
            label: 'Brass', icon: 'megaphone',
            type: 'sawtooth', duty: 0.5, vol: 0.30, pitchEnv: 0, glide: 0.02,
            env: { attack: 0.04, decay: 0.15, sustain: 0.75, release: 0.12 },
            vib: { rate: 4, depth: 6 },
            mod: { unisonVoices: 2, unisonDetune: 6, unisonSpread: 25, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 2500, filterQ: 2, filterKeyTrack: 60,
                   filterEnvAmount: 48, filterEnvAttack: 0.04, filterEnvRelease: 0.2,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        harmonica: {
            label: 'Harmonica', icon: 'badge-hd',
            type: 'square', duty: 0.3, vol: 0.22, pitchEnv: 0, glide: 0.03,
            env: { attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.1 },
            vib: { rate: 6, depth: 12 },
            mod: { unisonVoices: 1, unisonDetune: 0, unisonSpread: 0, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 4000, filterQ: 2, filterKeyTrack: 30,
                   filterEnvAmount: 8, filterEnvAttack: 0.03, filterEnvRelease: 0.2,
                   lfoFilterRate: 3, lfoFilterDepth: 500, tremoloRate: 5, tremoloDepth: 15 }
        },
        synthLead: {
            label: 'Synth Lead', icon: 'lightning-charge',
            type: 'square', duty: 0.25, vol: 0.28, pitchEnv: 0, glide: 0.03,
            env: { attack: 0.01, decay: 0.12, sustain: 0.7, release: 0.2 },
            vib: { rate: 5, depth: 8 },
            mod: { unisonVoices: 4, unisonDetune: 12, unisonSpread: 60, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 4000, filterQ: 4, filterKeyTrack: 50,
                   filterEnvAmount: 24, filterEnvAttack: 0.01, filterEnvRelease: 0.3,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        synthPad: {
            label: 'Synth Pad', icon: 'clouds',
            type: 'sawtooth', duty: 0.5, vol: 0.18, pitchEnv: 0, glide: 0,
            env: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2.0 },
            vib: { rate: 2.5, depth: 5 },
            mod: { unisonVoices: 8, unisonDetune: 18, unisonSpread: 90, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 3500, filterQ: 2, filterKeyTrack: 20,
                   filterEnvAmount: 12, filterEnvAttack: 0.8, filterEnvRelease: 1.0,
                   lfoFilterRate: 0.3, lfoFilterDepth: 1500, tremoloRate: 0.15, tremoloDepth: 12 }
        },
        synthBass: {
            label: 'Synth Bass', icon: 'speaker',
            type: 'sawtooth', duty: 0.5, vol: 0.38, pitchEnv: 0, glide: 0.04,
            env: { attack: 0.005, decay: 0.25, sustain: 0.3, release: 0.08 },
            vib: { rate: 0, depth: 0 },
            mod: { unisonVoices: 2, unisonDetune: 8, unisonSpread: 20, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 1200, filterQ: 6, filterKeyTrack: 40,
                   filterEnvAmount: 48, filterEnvAttack: 0.005, filterEnvRelease: 0.25,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        },
        marimba: {
            label: 'Marimba', icon: 'grid',
            type: 'sine', duty: 0.5, vol: 0.35, pitchEnv: 2, glide: 0,
            env: { attack: 0.001, decay: 0.35, sustain: 0.0, release: 0.15 },
            vib: { rate: 0, depth: 0 },
            mod: { unisonVoices: 1, unisonDetune: 0, unisonSpread: 0, filterEnabled: false,
                   filterType: 'lowpass', filterCutoff: 20000, filterQ: 0.1, filterKeyTrack: 0,
                   filterEnvAmount: 0, filterEnvAttack: 0.01, filterEnvRelease: 0.2,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 8, tremoloDepth: 20 }
        },
        electricGuitar: {
            label: 'Elec. Guitar', icon: 'lightning',
            type: 'square', duty: 0.35, vol: 0.28, pitchEnv: 0, glide: 0.02,
            env: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.3 },
            vib: { rate: 5, depth: 6 },
            mod: { unisonVoices: 3, unisonDetune: 8, unisonSpread: 50, filterEnabled: true,
                   filterType: 'lowpass', filterCutoff: 3500, filterQ: 3, filterKeyTrack: 40,
                   filterEnvAmount: 18, filterEnvAttack: 0.005, filterEnvRelease: 0.4,
                   lfoFilterRate: 0, lfoFilterDepth: 0, tremoloRate: 0, tremoloDepth: 0 }
        }
    };

    // ── Effects Presets ──────────────────────────────────────────────────
    var FX_PRESETS = {
        clean:  { distortion: 0, delayTime: 0.25, delayFeedback: 0, delayMix: 0, reverbMix: 0, chorusRate: 1, chorusDepth: 0, chorusMix: 0, crushBits: 16, crushRate: 1 },
        space:  { distortion: 0, delayTime: 0.5, delayFeedback: 0.4, delayMix: 0.3, reverbMix: 0.5, chorusRate: 2, chorusDepth: 0.3, chorusMix: 0.2, crushBits: 16, crushRate: 1 },
        echo:   { distortion: 0, delayTime: 0.375, delayFeedback: 0.6, delayMix: 0.5, reverbMix: 0.2, chorusRate: 1, chorusDepth: 0, chorusMix: 0, crushBits: 16, crushRate: 1 },
        dirty:  { distortion: 0.7, delayTime: 0.25, delayFeedback: 0, delayMix: 0, reverbMix: 0.1, chorusRate: 1, chorusDepth: 0, chorusMix: 0, crushBits: 12, crushRate: 0.8 },
        crush:  { distortion: 1, delayTime: 0.1, delayFeedback: 0.5, delayMix: 0.3, reverbMix: 0, chorusRate: 1, chorusDepth: 0, chorusMix: 0, crushBits: 4, crushRate: 0.2 }
    };

    // ── Helpers ────────────────────────────────────────────────────────────
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function assign(t, s) { for (var k in s) if (s.hasOwnProperty(k)) t[k] = s[k]; return t; }
    function buildTrack(base) { return assign(assign({}, base), DEFAULT_MOD); }

    // ══════════════════════════════════════════════════════════════════════
    // ── Constructor ───────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    function ChiptuneSynth() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.limiter = null;
        this.initialized = false;

        this.bpm = 120;
        this.pitchBend = 0;    // -1 to +1 (+-200 cents)
        this.modulation = 0;   // 0 to 1 (adds vibrato depth)

        this.tracks = [];
        this.envelopes = [];
        this.vibrato = [];
        this.channelStrips = [];
        this.mixerSettings = [];
        this._trackEffects = [];

        for (var i = 0; i < NUM_TRACKS; i++) {
            this.tracks.push(buildTrack(DEFAULT_TRACKS[i]));
            this.envelopes.push(clone(DEFAULT_ENVELOPES[i]));
            this.vibrato.push({ rate: 0, depth: 0 });
            this.mixerSettings.push({
                volume: 1.0, pan: 0,
                eqLow: 0, eqMid: 0, eqHigh: 0,
                solo: false, mute: false,
                compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 }
            });
        }

        // Arpeggiator settings per track
        this._arpSettings = [];
        this._arpStates = new Map();
        for (var a = 0; a < NUM_TRACKS; a++) {
            this._arpSettings.push({ mode: 'off', rate: '1/8', octaves: 1, gate: 0.5 });
        }

        this.activeNotes = new Map();
        this._noteIdCounter = 0;
        this._noiseBuffer = null;
        this._periodicWaveCache = {};
        this._analyserTimeData = null;
        this._analyserFreqData = null;
        this._masterLevelData = null;
        this._trackLevelData = [];
    }

    // ── Static ────────────────────────────────────────────────────────────
    ChiptuneSynth.TRACK_NAMES = TRACK_NAMES;
    ChiptuneSynth.NUM_TRACKS = NUM_TRACKS;

    ChiptuneSynth.noteToFrequency = function (note, octave) {
        if (octave === undefined) octave = 4;
        var idx = NOTE_MAP[note];
        if (idx === undefined) return 440;
        var steps = (octave - 4) * 12 + (idx - 9);
        return 440 * Math.pow(2, steps / 12);
    };

    ChiptuneSynth.midiToFrequency = function (midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    };

    ChiptuneSynth.frequencyToMidi = function (freq) {
        return Math.round(12 * Math.log2(freq / 440) + 69);
    };

    ChiptuneSynth.getPresetNames = function () { return Object.keys(PRESETS); };
    ChiptuneSynth.getInstrumentNames = function () { return Object.keys(INSTRUMENTS); };
    ChiptuneSynth.getFxPresetNames = function () { return Object.keys(FX_PRESETS); };

    ChiptuneSynth.getInstruments = function () {
        var out = {};
        for (var k in INSTRUMENTS) if (INSTRUMENTS.hasOwnProperty(k)) {
            var ins = INSTRUMENTS[k];
            out[k] = {
                name: k, label: ins.label, icon: ins.icon,
                type: ins.type || 'square',
                duty: ins.duty, vol: ins.vol, pitchEnv: ins.pitchEnv, glide: ins.glide,
                env: ins.env ? clone(ins.env) : null,
                vib: ins.vib ? clone(ins.vib) : null,
                mod: ins.mod ? clone(ins.mod) : null
            };
        }
        return out;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Init ──────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.init = async function () {
        if (this.initialized) return;

        var AC = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AC();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;

        // Analyser for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // ── Master limiter (brick-wall) ──
        this.limiter = this.audioContext.createDynamicsCompressor();
        this.limiter.threshold.value = -3;
        this.limiter.knee.value = 0;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.01;

        // Master chain: masterGain -> analyser -> limiter -> destination
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.limiter);
        this.limiter.connect(this.audioContext.destination);

        // ── Per-track channel strips ──
        // Chain: gain -> pan -> eqLow -> eqMid -> eqHigh -> compressor -> analyser -> masterGain
        this.channelStrips = [];
        var ctx = this.audioContext;
        for (var i = 0; i < NUM_TRACKS; i++) {
            var strip = {};
            var ms = this.mixerSettings[i];

            strip.gain = ctx.createGain();
            strip.gain.gain.value = ms.volume;

            strip.pan = ctx.createStereoPanner();
            strip.pan.pan.value = ms.pan;

            strip.eqLow = ctx.createBiquadFilter();
            strip.eqLow.type = 'lowshelf';
            strip.eqLow.frequency.value = 320;
            strip.eqLow.gain.value = ms.eqLow;

            strip.eqMid = ctx.createBiquadFilter();
            strip.eqMid.type = 'peaking';
            strip.eqMid.frequency.value = 1000;
            strip.eqMid.Q.value = 0.7;
            strip.eqMid.gain.value = ms.eqMid;

            strip.eqHigh = ctx.createBiquadFilter();
            strip.eqHigh.type = 'highshelf';
            strip.eqHigh.frequency.value = 3200;
            strip.eqHigh.gain.value = ms.eqHigh;

            strip.compressor = ctx.createDynamicsCompressor();
            strip.compressor.threshold.value = 0;
            strip.compressor.knee.value = 6;
            strip.compressor.ratio.value = 1;
            strip.compressor.attack.value = 0.003;
            strip.compressor.release.value = 0.25;

            strip.analyser = ctx.createAnalyser();
            strip.analyser.fftSize = 256;
            strip.analyser.smoothingTimeConstant = 0.8;

            strip.gain.connect(strip.pan);
            strip.pan.connect(strip.eqLow);
            strip.eqLow.connect(strip.eqMid);
            strip.eqMid.connect(strip.eqHigh);
            strip.eqHigh.connect(strip.compressor);
            strip.compressor.connect(strip.analyser);
            strip.analyser.connect(this.masterGain);

            this.channelStrips.push(strip);
        }

        // ── Per-track effects chains ──
        this._trackEffects = [];
        for (var t = 0; t < NUM_TRACKS; t++) {
            this._trackEffects.push(this._createEffectsChain());
        }

        // ── Noise buffer (2 seconds, smoothed) ──
        var sr = ctx.sampleRate;
        var len = sr * 2;
        this._noiseBuffer = ctx.createBuffer(1, len, sr);
        var data = this._noiseBuffer.getChannelData(0);
        for (var n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * 0.6;
        for (var n = 1; n < len; n++) data[n] = data[n] * 0.8 + data[n - 1] * 0.2;

        // ── Pre-allocate analyser buffers ──
        this._analyserTimeData = new Uint8Array(this.analyser.frequencyBinCount);
        this._analyserTimeData.fill(128);
        this._analyserFreqData = new Uint8Array(this.analyser.frequencyBinCount);
        this._masterLevelData = new Uint8Array(this.analyser.frequencyBinCount);
        this._masterLevelData.fill(128);
        this._trackLevelData = [];
        for (var ti = 0; ti < NUM_TRACKS; ti++) {
            var buf = new Uint8Array(this.channelStrips[ti].analyser.frequencyBinCount);
            buf.fill(128);
            this._trackLevelData.push(buf);
        }

        this.initialized = true;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Effects Chain (per-track) ─────────────────────────────────────────
    // Signal: input -> distortion -> chorus -> delay -> reverb -> bitcrusher -> output
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype._createEffectsChain = function () {
        var ctx = this.audioContext;
        var chain = {
            input: ctx.createGain(),
            // Distortion (waveshaper)
            distortion: ctx.createWaveShaper(),
            distortionGain: ctx.createGain(),
            distortionDry: ctx.createGain(),
            distortionMix: ctx.createGain(),
            // Chorus (modulated delay)
            chorusDelay: ctx.createDelay(0.1),
            chorusLfo: ctx.createOscillator(),
            chorusLfoGain: ctx.createGain(),
            chorusWet: ctx.createGain(),
            chorusDry: ctx.createGain(),
            chorusMix: ctx.createGain(),
            // Delay (feedback)
            delay: ctx.createDelay(2.0),
            delayFeedback: ctx.createGain(),
            delayWet: ctx.createGain(),
            delayDry: ctx.createGain(),
            delayMix: ctx.createGain(),
            // Reverb (convolution)
            reverb: ctx.createConvolver(),
            reverbWet: ctx.createGain(),
            reverbDry: ctx.createGain(),
            reverbMix: ctx.createGain(),
            // Bitcrusher (ScriptProcessor fallback)
            crusher: ctx.createScriptProcessor(4096, 1, 1),
            crusherBits: 16,
            crusherRate: 1,
            crusherWet: ctx.createGain(),
            crusherDry: ctx.createGain(),
            crusherMix: ctx.createGain(),
            // Output
            output: ctx.createGain()
        };

        // Defaults: all effects bypassed
        chain.input.gain.value = 1;
        chain.distortionGain.gain.value = 0;
        chain.distortionDry.gain.value = 1;
        chain.chorusDelay.delayTime.value = 0.005;
        chain.chorusLfo.frequency.value = 1;
        chain.chorusLfoGain.gain.value = 0;
        chain.chorusWet.gain.value = 0;
        chain.chorusDry.gain.value = 1;
        chain.delay.delayTime.value = 0.25;
        chain.delayFeedback.gain.value = 0.3;
        chain.delayWet.gain.value = 0;
        chain.delayDry.gain.value = 1;
        chain.reverbWet.gain.value = 0;
        chain.reverbDry.gain.value = 1;
        chain.crusherWet.gain.value = 0;
        chain.crusherDry.gain.value = 1;

        // Chorus LFO -> delay time modulation
        chain.chorusLfo.connect(chain.chorusLfoGain);
        chain.chorusLfoGain.connect(chain.chorusDelay.delayTime);
        chain.chorusLfo.start();

        // Bitcrusher processor
        chain.crusher.onaudioprocess = function (e) {
            var inp = e.inputBuffer.getChannelData(0);
            var out = e.outputBuffer.getChannelData(0);
            var step = Math.pow(0.5, chain.crusherBits);
            var srFactor = Math.max(1, Math.round(1 / Math.max(0.01, chain.crusherRate)));
            var last = 0;
            for (var s = 0; s < inp.length; s++) {
                if (s % srFactor === 0) last = Math.floor(inp[s] / step) * step;
                out[s] = last;
            }
        };

        // Reverb impulse response
        this._createReverbImpulse(chain.reverb, 2, 0.5);

        // Wire serial chain
        // Stage 1: Distortion
        chain.input.connect(chain.distortion);
        chain.distortion.connect(chain.distortionGain);
        chain.distortionGain.connect(chain.distortionMix);
        chain.input.connect(chain.distortionDry);
        chain.distortionDry.connect(chain.distortionMix);
        // Stage 2: Chorus
        chain.distortionMix.connect(chain.chorusDelay);
        chain.chorusDelay.connect(chain.chorusWet);
        chain.chorusWet.connect(chain.chorusMix);
        chain.distortionMix.connect(chain.chorusDry);
        chain.chorusDry.connect(chain.chorusMix);
        // Stage 3: Delay
        chain.chorusMix.connect(chain.delay);
        chain.delay.connect(chain.delayFeedback);
        chain.delayFeedback.connect(chain.delay);
        chain.delay.connect(chain.delayWet);
        chain.delayWet.connect(chain.delayMix);
        chain.chorusMix.connect(chain.delayDry);
        chain.delayDry.connect(chain.delayMix);
        // Stage 4: Reverb
        chain.delayMix.connect(chain.reverb);
        chain.reverb.connect(chain.reverbWet);
        chain.reverbWet.connect(chain.reverbMix);
        chain.delayMix.connect(chain.reverbDry);
        chain.reverbDry.connect(chain.reverbMix);
        // Stage 5: Bitcrusher
        chain.reverbMix.connect(chain.crusher);
        chain.crusher.connect(chain.crusherWet);
        chain.crusherWet.connect(chain.crusherMix);
        chain.reverbMix.connect(chain.crusherDry);
        chain.crusherDry.connect(chain.crusherMix);
        // Final
        chain.crusherMix.connect(chain.output);

        return chain;
    };

    ChiptuneSynth.prototype._createReverbImpulse = function (convolver, duration, decay) {
        var ctx = this.audioContext;
        var sr = ctx.sampleRate;
        var length = sr * duration;
        var impulse = ctx.createBuffer(2, length, sr);
        for (var ch = 0; ch < 2; ch++) {
            var chData = impulse.getChannelData(ch);
            for (var s = 0; s < length; s++) {
                chData[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / length, decay);
            }
        }
        convolver.buffer = impulse;
    };

    ChiptuneSynth.prototype._makeDistortionCurve = function (waveshaper, amount) {
        var samples = 44100;
        var curve = new Float32Array(samples);
        var deg = Math.PI / 180;
        for (var s = 0; s < samples; s++) {
            var x = (s * 2) / samples - 1;
            curve[s] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Oscillator creation ───────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype._createOscillator = function (frequency, waveform, dutyCycle) {
        if (waveform === 'noise') {
            var noise = this.audioContext.createBufferSource();
            noise.buffer = this._noiseBuffer;
            noise.loop = true;
            return noise;
        }
        var osc = this.audioContext.createOscillator();
        if (waveform === 'square') {
            var key = dutyCycle.toFixed(4);
            if (!this._periodicWaveCache[key]) {
                var real = new Float32Array(32), imag = new Float32Array(32);
                for (var h = 1; h < 32; h++) imag[h] = (4 / (Math.PI * h)) * Math.sin(h * Math.PI * dutyCycle);
                this._periodicWaveCache[key] = this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
            }
            osc.setPeriodicWave(this._periodicWaveCache[key]);
        } else {
            osc.type = waveform;
        }
        osc.frequency.value = frequency;
        return osc;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Play Note ─────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.playNote = function (frequency, trackIndex, duration, startTime) {
        if (!this.initialized) return null;
        if (trackIndex === undefined) trackIndex = 0;
        if (trackIndex < 0 || trackIndex >= NUM_TRACKS) return null;
        if (duration === undefined) duration = 10;

        var now = startTime != null ? startTime : this.audioContext.currentTime;
        var track = this.tracks[trackIndex];
        var envelope = this.envelopes[trackIndex];
        var vib = this.vibrato[trackIndex];
        var self = this;

        // Apply detune + octave/semitone offsets
        var finalFreq = frequency * Math.pow(2, track.detune / 1200);
        finalFreq *= Math.pow(2, track.octaveOffset || 0);
        finalFreq *= Math.pow(2, (track.semitoneOffset || 0) / 12);

        // Envelope gain
        var gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0;

        // Unison voices
        var voices = track.unisonVoices || 1;
        var oscillators = [];
        var unisonGain = this.audioContext.createGain();
        unisonGain.gain.value = 1 / Math.sqrt(voices);

        for (var v = 0; v < voices; v++) {
            var spreadPos = voices === 1 ? 0 : (v / (voices - 1)) * 2 - 1;
            var voiceDetune = spreadPos * (track.unisonDetune || 0);
            var voiceFreq = finalFreq * Math.pow(2, voiceDetune / 1200);
            var vosc = this._createOscillator(voiceFreq, track.type, track.dutyCycle);

            // Pitch envelope
            if (track.pitchEnv !== 0 && vosc.frequency) {
                var pitchTarget = voiceFreq * Math.pow(2, track.pitchEnv / 12);
                var pitchTime = envelope.attack + envelope.decay * 0.5;
                vosc.frequency.setValueAtTime(pitchTarget, now);
                vosc.frequency.exponentialRampToValueAtTime(Math.max(voiceFreq, 20), now + pitchTime);
            }
            // Glide
            if (track.glide > 0 && vosc.frequency) {
                var gt = track.glide * 0.2;
                vosc.frequency.setValueAtTime(voiceFreq * 0.8, now);
                vosc.frequency.exponentialRampToValueAtTime(voiceFreq, now + gt);
            }
            // Stereo spread
            if (voices > 1 && spreadPos !== 0) {
                var panner = this.audioContext.createStereoPanner();
                panner.pan.value = spreadPos * ((track.unisonSpread || 0) / 100);
                vosc.connect(panner);
                panner.connect(unisonGain);
            } else {
                vosc.connect(unisonGain);
            }
            oscillators.push(vosc);
        }
        unisonGain.connect(gainNode);

        var osc = oscillators[0];
        var lfo = null, lfoGain = null;
        var extraLfos = [];

        // ── LFO 1: Vibrato (pitch modulation) ──
        if (osc.frequency) {
            lfo = this.audioContext.createOscillator();
            lfo.type = track.lfo1Wave || 'sine';
            lfo.frequency.value = vib.rate || 0;
            lfoGain = this.audioContext.createGain();
            var lfoTarget = (vib.rate > 0 && vib.depth > 0) ? vib.depth : 0;
            if (this.modulation > 0) {
                lfoTarget = Math.max(lfoTarget, this.modulation * 15);
                if (lfo.frequency.value < 0.5) lfo.frequency.value = 5;
            }
            if ((track.lfo1Delay || 0) > 0 && lfoTarget > 0) {
                lfoGain.gain.setValueAtTime(0, now);
                lfoGain.gain.linearRampToValueAtTime(lfoTarget, now + track.lfo1Delay);
            } else {
                lfoGain.gain.value = lfoTarget;
            }
            lfo.connect(lfoGain);
            for (var vi = 0; vi < oscillators.length; vi++) {
                if (oscillators[vi].frequency) lfoGain.connect(oscillators[vi].frequency);
            }
            lfo.start(now);

            // Pitch bend
            if (this.pitchBend !== 0) {
                var cents = this.pitchBend * 200;
                for (var vi = 0; vi < oscillators.length; vi++) {
                    if (oscillators[vi].detune) oscillators[vi].detune.value = cents;
                }
            }
        }

        var outputNode = gainNode;

        // ── Per-track filter ──
        var trackFilter = this.audioContext.createBiquadFilter();
        trackFilter.type = track.filterType || 'lowpass';
        var cutoff = (track.filterEnabled && track.filterCutoff < 19999) ? track.filterCutoff : 20000;
        if ((track.filterKeyTrack || 0) > 0 && track.filterEnabled) {
            var kt = track.filterKeyTrack / 100;
            cutoff *= Math.pow(2, Math.log2(finalFreq / 261.63) * kt);
            cutoff = Math.max(20, Math.min(20000, cutoff));
        }
        trackFilter.frequency.value = cutoff;
        trackFilter.Q.value = track.filterEnabled ? track.filterQ : 0.1;
        outputNode.connect(trackFilter);
        outputNode = trackFilter;

        // ── LFO 3: Tremolo ──
        var tremoloLfo = this.audioContext.createOscillator();
        tremoloLfo.type = track.lfo3Wave || 'sine';
        tremoloLfo.frequency.value = track.tremoloRate || 0.01;
        var tremoloGain = this.audioContext.createGain();
        var tremTarget = (track.tremoloRate > 0 && track.tremoloDepth > 0) ? (track.tremoloDepth / 100) * 0.5 : 0;
        if ((track.lfo3Delay || 0) > 0 && tremTarget > 0) {
            tremoloGain.gain.setValueAtTime(0, now);
            tremoloGain.gain.linearRampToValueAtTime(tremTarget, now + track.lfo3Delay);
        } else {
            tremoloGain.gain.value = tremTarget;
        }
        tremoloLfo.connect(tremoloGain);
        tremoloGain.connect(gainNode.gain);
        tremoloLfo.start(now);
        extraLfos.push(tremoloLfo);

        // ── LFO 2: Filter modulation ──
        var filtLfo = this.audioContext.createOscillator();
        filtLfo.type = track.lfo2Wave || 'sine';
        filtLfo.frequency.value = track.filterLfoRate || 0.01;
        var filtLfoGain = this.audioContext.createGain();
        filtLfoGain.gain.value = (track.filterLfoRate > 0 && track.filterLfoDepth > 0) ? (track.filterLfoDepth / 100) * track.filterCutoff * 0.5 : 0;
        if ((track.lfo2Delay || 0) > 0 && filtLfoGain.gain.value > 0) {
            var fv = filtLfoGain.gain.value;
            filtLfoGain.gain.setValueAtTime(0, now);
            filtLfoGain.gain.linearRampToValueAtTime(fv, now + track.lfo2Delay);
        }
        filtLfo.connect(filtLfoGain);
        filtLfoGain.connect(trackFilter.frequency);
        filtLfo.start(now);
        extraLfos.push(filtLfo);

        // ── LFO 2b: Alternative filter modulation ──
        var lfoFilt = this.audioContext.createOscillator();
        lfoFilt.type = track.lfo2Wave || 'sine';
        lfoFilt.frequency.value = track.lfoFilterRate || 0.01;
        var lfoFiltGain = this.audioContext.createGain();
        lfoFiltGain.gain.value = (track.lfoFilterRate > 0 && track.lfoFilterDepth > 0) ? (track.lfoFilterDepth / 100) * 5000 : 0;
        lfoFilt.connect(lfoFiltGain);
        lfoFiltGain.connect(trackFilter.frequency);
        lfoFilt.start(now);
        extraLfos.push(lfoFilt);

        // ── Filter envelope ──
        if (track.filterEnabled && track.filterEnvAmount !== 0) {
            var baseCut = track.filterCutoff;
            var envTarget = baseCut * Math.pow(2, track.filterEnvAmount / 12);
            trackFilter.frequency.setValueAtTime(envTarget, now);
            trackFilter.frequency.exponentialRampToValueAtTime(Math.max(20, baseCut), now + Math.max(0.001, track.filterEnvAttack || 0.01));
        }

        // ── Route through per-track FX chain -> channel strip -> master ──
        var fxChain = this._trackEffects[trackIndex];
        if (fxChain) {
            outputNode.connect(fxChain.input);
            fxChain.output.connect(this.channelStrips[trackIndex].gain);
        } else {
            outputNode.connect(this.channelStrips[trackIndex].gain);
        }

        // ── ADSR (normalized 0->1->sustain, volume handled by channel strip) ──
        var trackVol = track.volume;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(trackVol, now + envelope.attack);
        gainNode.gain.linearRampToValueAtTime(envelope.sustain * trackVol, now + envelope.attack + envelope.decay);

        for (var oi = 0; oi < oscillators.length; oi++) oscillators[oi].start(now);

        var sustained = duration >= 10;
        if (!sustained) {
            var rs = now + duration;
            gainNode.gain.setValueAtTime(envelope.sustain * trackVol, rs);
            gainNode.gain.linearRampToValueAtTime(0, rs + envelope.release);
            var stopTime = rs + envelope.release + 0.1;
            for (var si = 0; si < oscillators.length; si++) oscillators[si].stop(stopTime);
            if (lfo) lfo.stop(stopTime);
            extraLfos.forEach(function (l) { l.stop(stopTime); });
        }

        var noteId = 'note-' + (++this._noteIdCounter);
        this.activeNotes.set(noteId, {
            osc: osc, oscillators: oscillators, gainNode: gainNode,
            lfo: lfo, lfoGain: lfoGain, extraLfos: extraLfos, trackIndex: trackIndex,
            trackFilter: trackFilter, tremoloLfo: tremoloLfo, tremoloGain: tremoloGain,
            filtLfo: filtLfo, filtLfoGain: filtLfoGain, lfoFilt: lfoFilt, lfoFiltGain: lfoFiltGain,
            sustained: sustained, frequency: finalFreq
        });

        if (!sustained) {
            oscillators[0].onended = function () {
                self.activeNotes.delete(noteId);
                self._disconnectNote({
                    oscillators: oscillators, gainNode: gainNode, lfo: lfo, lfoGain: lfoGain,
                    trackFilter: trackFilter, tremoloLfo: tremoloLfo, tremoloGain: tremoloGain,
                    filtLfo: filtLfo, filtLfoGain: filtLfoGain, lfoFilt: lfoFilt, lfoFiltGain: lfoFiltGain
                });
            };
        }

        return noteId;
    };

    ChiptuneSynth.prototype.playNoteByName = function (note, octave, trackIndex, duration) {
        return this.playNote(ChiptuneSynth.noteToFrequency(note, octave === undefined ? 4 : octave), trackIndex || 0, duration === undefined ? 0.5 : duration);
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Stop Note ─────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.stopNote = function (noteId) {
        if (!this.activeNotes.has(noteId)) return;
        var nd = this.activeNotes.get(noteId);
        var now = this.audioContext.currentTime;
        var release = (nd.trackIndex !== undefined && this.envelopes[nd.trackIndex]) ? Math.max(0.02, this.envelopes[nd.trackIndex].release) : 0.1;
        var self = this;
        try {
            nd.gainNode.gain.cancelScheduledValues(now);
            nd.gainNode.gain.setValueAtTime(nd.gainNode.gain.value, now);
            nd.gainNode.gain.linearRampToValueAtTime(0, now + release);
            var stopTime = now + release + 0.1;
            if (nd.oscillators) nd.oscillators.forEach(function (v) { try { v.stop(stopTime); } catch (e) {} });
            if (nd.lfo) nd.lfo.stop(stopTime);
            if (nd.extraLfos) nd.extraLfos.forEach(function (l) { try { l.stop(stopTime); } catch (e) {} });
        } catch (e) {}
        this.activeNotes.delete(noteId);
    };

    ChiptuneSynth.prototype.stopAllNotes = function () {
        var keys = [];
        this.activeNotes.forEach(function (v, k) { keys.push(k); });
        for (var i = 0; i < keys.length; i++) this.stopNote(keys[i]);
        this.arpStopAll();
    };

    ChiptuneSynth.prototype._disconnectNote = function (nd) {
        var nodes = ['oscillators','gainNode','lfo','lfoGain','trackFilter','tremoloLfo','tremoloGain','filtLfo','filtLfoGain','lfoFilt','lfoFiltGain'];
        for (var i = 0; i < nodes.length; i++) {
            var n = nd[nodes[i]];
            if (!n) continue;
            try {
                if (Array.isArray(n)) n.forEach(function (x) { try { x.disconnect(); } catch (e) {} });
                else n.disconnect();
            } catch (e) {}
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Live Parameter Updates ────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.updateLiveNotes = function (trackIndex) {
        var track = this.tracks[trackIndex];
        var envelope = this.envelopes[trackIndex];
        var vib = this.vibrato[trackIndex];
        var self = this;
        var now = this.audioContext ? this.audioContext.currentTime : 0;

        this.activeNotes.forEach(function (nd) {
            if (nd.trackIndex !== trackIndex) return;

            // Sustain level
            if (nd.sustained && nd.gainNode) {
                var cur = nd.gainNode.gain.value;
                var target = envelope.sustain * track.volume;
                if (Math.abs(cur - target) > 0.001) {
                    nd.gainNode.gain.setTargetAtTime(target, now, 0.015);
                }
            }

            // Waveform type + duty cycle
            if (nd.oscillators) {
                for (var vi = 0; vi < nd.oscillators.length; vi++) {
                    var vosc = nd.oscillators[vi];
                    if (track.type === 'square') {
                        var dc = track.dutyCycle || 0.5;
                        var key = dc.toFixed(4);
                        if (!self._periodicWaveCache[key]) {
                            var real = new Float32Array(32), imag = new Float32Array(32);
                            for (var h = 1; h < 32; h++) imag[h] = (4 / (Math.PI * h)) * Math.sin(h * Math.PI * dc);
                            self._periodicWaveCache[key] = self.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
                        }
                        try { vosc.setPeriodicWave(self._periodicWaveCache[key]); } catch (e) {}
                    } else if (track.type !== 'noise' && vosc.type !== undefined) {
                        try { vosc.type = track.type; } catch (e) {}
                    }
                }
            }

            // Detune + octave/semitone offsets
            if (nd.oscillators && nd.frequency) {
                var baseCents = (track.detune || 0) + self.pitchBend * 200;
                var freqMult = Math.pow(2, (track.octaveOffset || 0)) * Math.pow(2, (track.semitoneOffset || 0) / 12);
                var newFreq = nd.frequency * freqMult;
                for (var vi = 0; vi < nd.oscillators.length; vi++) {
                    var vosc = nd.oscillators[vi];
                    if (vosc.frequency) vosc.frequency.setTargetAtTime(newFreq, now, 0.01);
                    if (vosc.detune) vosc.detune.setTargetAtTime(baseCents, now, 0.01);
                }
            }

            // Filter
            if (nd.trackFilter) {
                var cutoff = (track.filterEnabled && track.filterCutoff < 19999) ? track.filterCutoff : 20000;
                if ((track.filterKeyTrack || 0) > 0 && track.filterEnabled && nd.frequency) {
                    var kt = track.filterKeyTrack / 100;
                    cutoff *= Math.pow(2, Math.log2(nd.frequency / 261.63) * kt);
                    cutoff = Math.max(20, Math.min(20000, cutoff));
                }
                nd.trackFilter.frequency.setTargetAtTime(cutoff, now, 0.01);
                nd.trackFilter.Q.setTargetAtTime(track.filterEnabled ? track.filterQ : 0.1, now, 0.01);
                nd.trackFilter.type = track.filterType || 'lowpass';
            }
            // LFO 1 - Vibrato
            if (nd.lfo && nd.lfoGain) {
                nd.lfo.frequency.value = vib.rate || 0;
                var t = (vib.rate > 0 && vib.depth > 0) ? vib.depth : 0;
                if (self.modulation > 0) { t = Math.max(t, self.modulation * 15); if (nd.lfo.frequency.value < 0.5) nd.lfo.frequency.value = 5; }
                nd.lfoGain.gain.value = t;
            }
            // LFO 3 - Tremolo
            if (nd.tremoloLfo && nd.tremoloGain) {
                nd.tremoloLfo.frequency.value = track.tremoloRate || 0.01;
                nd.tremoloGain.gain.value = (track.tremoloRate > 0 && track.tremoloDepth > 0) ? (track.tremoloDepth / 100) * 0.5 : 0;
            }
            // LFO 2 - Filter modulation
            if (nd.filtLfo && nd.filtLfoGain) {
                nd.filtLfo.frequency.value = track.filterLfoRate || 0.01;
                nd.filtLfoGain.gain.value = (track.filterLfoRate > 0 && track.filterLfoDepth > 0) ? (track.filterLfoDepth / 100) * track.filterCutoff * 0.5 : 0;
            }
            if (nd.lfoFilt && nd.lfoFiltGain) {
                nd.lfoFilt.frequency.value = track.lfoFilterRate || 0.01;
                nd.lfoFiltGain.gain.value = (track.lfoFilterRate > 0 && track.lfoFilterDepth > 0) ? (track.lfoFilterDepth / 100) * 5000 : 0;
            }
        });
    };

    ChiptuneSynth.prototype.updatePitchBend = function () {
        var cents = this.pitchBend * 200;
        this.activeNotes.forEach(function (nd) {
            if (nd.oscillators) for (var vi = 0; vi < nd.oscillators.length; vi++) { if (nd.oscillators[vi].detune) nd.oscillators[vi].detune.value = cents; }
        });
    };

    ChiptuneSynth.prototype.updateModulation = function () {
        var self = this;
        this.activeNotes.forEach(function (nd) {
            if (nd.lfo && nd.lfoGain && nd.trackIndex !== undefined) {
                var vib = self.vibrato[nd.trackIndex];
                var t = (vib.rate > 0 && vib.depth > 0) ? vib.depth : 0;
                if (self.modulation > 0) { t = Math.max(t, self.modulation * 15); if (nd.lfo.frequency.value < 0.5) nd.lfo.frequency.value = 5; }
                nd.lfoGain.gain.value = t;
            }
        });
    };

    // ── Track / Envelope / Vibrato updates ────────────────────────────────
    ChiptuneSynth.prototype.updateTrack = function (trackIndex, settings) { assign(this.tracks[trackIndex], settings); };
    ChiptuneSynth.prototype.updateEnvelope = function (trackIndex, env) { assign(this.envelopes[trackIndex], env); };
    ChiptuneSynth.prototype.updateVibrato = function (trackIndex, vib) { assign(this.vibrato[trackIndex], vib); };

    // ══════════════════════════════════════════════════════════════════════
    // ── Presets ────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.loadPreset = function (name) {
        var p = PRESETS[name];
        if (!p) return;
        var i = p.track;
        this.tracks[i].type = p.type;
        this.tracks[i].volume = p.vol;
        this.tracks[i].dutyCycle = p.duty;
        this.tracks[i].pitchEnv = p.pitchEnv;
        this.envelopes[i] = clone(p.env);
        if (p.vib) this.vibrato[i] = clone(p.vib);
        else this.vibrato[i] = { rate: 0, depth: 0 };
        if (p.mod) assign(this.tracks[i], p.mod);
    };

    ChiptuneSynth.prototype.playPreset = function (name) {
        var p = PRESETS[name];
        if (!p) return null;
        this.loadPreset(name);
        if (name === '1up') {
            var t = this.audioContext.currentTime;
            this.playNote(p.freq, p.track, p.dur, t);
            this.playNote(p.freq * 1.26, p.track, p.dur, t + 0.08);
            return this.playNote(p.freq * 1.5, p.track, p.dur, t + 0.16);
        }
        return this.playNote(p.freq, p.track, p.dur);
    };

    // ── Instrument presets (configure a track to emulate an instrument) ──
    ChiptuneSynth.prototype.loadInstrument = function (name, trackIndex) {
        var inst = INSTRUMENTS[name];
        if (!inst) return false;
        if (trackIndex === undefined) trackIndex = 0;
        var t = this.tracks[trackIndex];
        t.type = inst.type;
        t.dutyCycle = inst.duty;
        t.volume = inst.vol;
        t.pitchEnv = inst.pitchEnv;
        t.glide = inst.glide;
        this.envelopes[trackIndex] = clone(inst.env);
        this.vibrato[trackIndex] = inst.vib ? clone(inst.vib) : { rate: 0, depth: 0 };
        if (inst.mod) assign(t, inst.mod);
        return true;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Master Volume ─────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.setMasterVolume = function (v) { if (this.masterGain) this.masterGain.gain.value = v; };
    ChiptuneSynth.prototype.getMasterVolume = function () { return this.masterGain ? this.masterGain.gain.value : 0; };

    // ══════════════════════════════════════════════════════════════════════
    // ── Mixer Console ─────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.setTrackFaderVolume = function (trackIndex, volume) {
        this.mixerSettings[trackIndex].volume = volume;
        if (this.channelStrips[trackIndex]) this.channelStrips[trackIndex].gain.gain.value = volume;
    };

    ChiptuneSynth.prototype.setTrackPan = function (trackIndex, pan) {
        this.mixerSettings[trackIndex].pan = pan;
        if (this.channelStrips[trackIndex]) this.channelStrips[trackIndex].pan.pan.value = pan;
    };

    ChiptuneSynth.prototype.setTrackEQ = function (trackIndex, band, gainDb) {
        this.mixerSettings[trackIndex][band] = gainDb;
        if (this.channelStrips[trackIndex]) {
            var strip = this.channelStrips[trackIndex];
            if (band === 'eqLow') strip.eqLow.gain.value = gainDb;
            else if (band === 'eqMid') strip.eqMid.gain.value = gainDb;
            else if (band === 'eqHigh') strip.eqHigh.gain.value = gainDb;
        }
    };

    ChiptuneSynth.prototype.setTrackSolo = function (trackIndex, solo) {
        this.mixerSettings[trackIndex].solo = solo;
    };

    ChiptuneSynth.prototype.setTrackMute = function (trackIndex, mute) {
        this.mixerSettings[trackIndex].mute = mute;
        if (this.channelStrips[trackIndex]) {
            this.channelStrips[trackIndex].gain.gain.value = mute ? 0 : this.mixerSettings[trackIndex].volume;
        }
    };

    // ── Per-track compressor ──
    ChiptuneSynth.prototype.setTrackCompressorEnabled = function (trackIndex, enabled) {
        var ms = this.mixerSettings[trackIndex];
        var strip = this.channelStrips[trackIndex];
        if (!ms || !strip) return;
        ms.compressor.enabled = enabled;
        if (enabled) {
            strip.compressor.threshold.value = ms.compressor.threshold;
            strip.compressor.ratio.value = ms.compressor.ratio;
        } else {
            strip.compressor.threshold.value = 0;
            strip.compressor.ratio.value = 1;
        }
    };

    ChiptuneSynth.prototype.setTrackCompressorThreshold = function (trackIndex, val) {
        var ms = this.mixerSettings[trackIndex]; var strip = this.channelStrips[trackIndex];
        if (!ms || !strip) return;
        ms.compressor.threshold = val;
        if (ms.compressor.enabled) strip.compressor.threshold.value = val;
    };

    ChiptuneSynth.prototype.setTrackCompressorRatio = function (trackIndex, val) {
        var ms = this.mixerSettings[trackIndex]; var strip = this.channelStrips[trackIndex];
        if (!ms || !strip) return;
        ms.compressor.ratio = val;
        if (ms.compressor.enabled) strip.compressor.ratio.value = val;
    };

    ChiptuneSynth.prototype.setTrackCompressorAttack = function (trackIndex, val) {
        var ms = this.mixerSettings[trackIndex]; var strip = this.channelStrips[trackIndex];
        if (!ms || !strip) return;
        ms.compressor.attack = val;
        strip.compressor.attack.value = val;
    };

    ChiptuneSynth.prototype.setTrackCompressorRelease = function (trackIndex, val) {
        var ms = this.mixerSettings[trackIndex]; var strip = this.channelStrips[trackIndex];
        if (!ms || !strip) return;
        ms.compressor.release = val;
        strip.compressor.release.value = val;
    };

    ChiptuneSynth.prototype.getTrackCompressorReduction = function (trackIndex) {
        var strip = this.channelStrips[trackIndex];
        return strip && strip.compressor ? strip.compressor.reduction : 0;
    };

    // ── Metering ──
    ChiptuneSynth.prototype.getTrackLevel = function (trackIndex) {
        if (!this.channelStrips[trackIndex]) return 0;
        if (this.audioContext && this.audioContext.state !== 'running') return 0;
        var analyser = this.channelStrips[trackIndex].analyser;
        var data = this._trackLevelData[trackIndex];
        if (!data) return 0;
        analyser.getByteTimeDomainData(data);
        var sum = 0;
        for (var s = 0; s < data.length; s++) {
            var val = (data[s] - 128) / 128;
            sum += val * val;
        }
        return Math.sqrt(sum / data.length);
    };

    ChiptuneSynth.prototype.getMasterLevel = function () {
        if (!this.analyser) return 0;
        if (this.audioContext && this.audioContext.state !== 'running') return 0;
        var data = this._masterLevelData;
        if (!data) return 0;
        this.analyser.getByteTimeDomainData(data);
        var sum = 0;
        for (var s = 0; s < data.length; s++) {
            var val = (data[s] - 128) / 128;
            sum += val * val;
        }
        return Math.sqrt(sum / data.length);
    };

    ChiptuneSynth.prototype.resetMixerToDefaults = function () {
        for (var i = 0; i < NUM_TRACKS; i++) {
            this.mixerSettings[i] = {
                volume: 1.0, pan: 0, eqLow: 0, eqMid: 0, eqHigh: 0,
                solo: false, mute: false,
                compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 }
            };
            if (this.channelStrips[i]) {
                this.channelStrips[i].gain.gain.value = 1.0;
                this.channelStrips[i].pan.pan.value = 0;
                this.channelStrips[i].eqLow.gain.value = 0;
                this.channelStrips[i].eqMid.gain.value = 0;
                this.channelStrips[i].eqHigh.gain.value = 0;
                this.channelStrips[i].compressor.threshold.value = 0;
                this.channelStrips[i].compressor.ratio.value = 1;
                this.channelStrips[i].compressor.attack.value = 0.003;
                this.channelStrips[i].compressor.release.value = 0.25;
            }
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Per-Track Effects API ─────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════

    // ── Distortion ──
    ChiptuneSynth.prototype.setDistortion = function (trackIndex, amount) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        if (amount === 0) {
            chain.distortionGain.gain.value = 0;
            chain.distortionDry.gain.value = 1;
        } else {
            chain.distortionGain.gain.value = 1;
            chain.distortionDry.gain.value = 0;
            this._makeDistortionCurve(chain.distortion, amount * 100);
        }
    };

    // ── Delay ──
    ChiptuneSynth.prototype.setDelayTime = function (trackIndex, time) {
        var chain = this._trackEffects[trackIndex];
        if (chain) chain.delay.delayTime.value = Math.max(0, Math.min(2, time));
    };

    ChiptuneSynth.prototype.setDelayFeedback = function (trackIndex, feedback) {
        var chain = this._trackEffects[trackIndex];
        if (chain) chain.delayFeedback.gain.value = Math.max(0, Math.min(0.9, feedback));
    };

    ChiptuneSynth.prototype.setDelayMix = function (trackIndex, mix) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        chain.delayWet.gain.value = mix;
        chain.delayDry.gain.value = 1 - mix;
    };

    // ── Reverb ──
    ChiptuneSynth.prototype.setReverbMix = function (trackIndex, mix) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        chain.reverbWet.gain.value = mix;
        chain.reverbDry.gain.value = 1 - mix;
    };

    ChiptuneSynth.prototype.setReverbDecay = function (trackIndex, decay) {
        var chain = this._trackEffects[trackIndex];
        if (chain) this._createReverbImpulse(chain.reverb, 2, decay);
    };

    // ── Chorus ──
    ChiptuneSynth.prototype.setChorusRate = function (trackIndex, rate) {
        var chain = this._trackEffects[trackIndex];
        if (chain) chain.chorusLfo.frequency.value = Math.max(0.1, Math.min(10, rate));
    };

    ChiptuneSynth.prototype.setChorusDepth = function (trackIndex, depth) {
        var chain = this._trackEffects[trackIndex];
        if (chain) chain.chorusLfoGain.gain.value = depth * 0.003;
    };

    ChiptuneSynth.prototype.setChorusMix = function (trackIndex, mix) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        chain.chorusWet.gain.value = mix;
        chain.chorusDry.gain.value = 1 - mix;
    };

    // ── Bitcrusher ──
    ChiptuneSynth.prototype.setBitcrusherBits = function (trackIndex, bits) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        chain.crusherBits = Math.max(1, Math.min(16, Math.round(bits)));
        if (chain.crusherBits < 16 || chain.crusherRate < 1) {
            chain.crusherWet.gain.value = 1;
            chain.crusherDry.gain.value = 0;
        } else {
            chain.crusherWet.gain.value = 0;
            chain.crusherDry.gain.value = 1;
        }
    };

    ChiptuneSynth.prototype.setBitcrusherRate = function (trackIndex, rate) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return;
        chain.crusherRate = Math.max(0.01, Math.min(1, rate));
        if (chain.crusherBits < 16 || chain.crusherRate < 1) {
            chain.crusherWet.gain.value = 1;
            chain.crusherDry.gain.value = 0;
        } else {
            chain.crusherWet.gain.value = 0;
            chain.crusherDry.gain.value = 1;
        }
    };

    // ── Get all FX params for a track ──
    ChiptuneSynth.prototype.getTrackFxParams = function (trackIndex) {
        var chain = this._trackEffects[trackIndex];
        if (!chain) return null;
        return {
            distortion: chain.distortionGain.gain.value > 0 ? 1 : 0,
            delayTime: chain.delay.delayTime.value,
            delayFeedback: chain.delayFeedback.gain.value,
            delayMix: chain.delayWet.gain.value,
            reverbMix: chain.reverbWet.gain.value,
            chorusRate: chain.chorusLfo.frequency.value,
            chorusDepth: chain.chorusLfoGain.gain.value / 0.003,
            chorusMix: chain.chorusWet.gain.value,
            crushBits: chain.crusherBits,
            crushRate: chain.crusherRate
        };
    };

    // ── Load FX preset ──
    ChiptuneSynth.prototype.loadFxPreset = function (trackIndex, presetName) {
        var preset = FX_PRESETS[presetName];
        if (!preset) return false;
        this.setDistortion(trackIndex, preset.distortion);
        this.setDelayTime(trackIndex, preset.delayTime);
        this.setDelayFeedback(trackIndex, preset.delayFeedback);
        this.setDelayMix(trackIndex, preset.delayMix);
        this.setReverbMix(trackIndex, preset.reverbMix);
        this.setChorusRate(trackIndex, preset.chorusRate);
        this.setChorusDepth(trackIndex, preset.chorusDepth);
        this.setChorusMix(trackIndex, preset.chorusMix);
        this.setBitcrusherBits(trackIndex, preset.crushBits);
        this.setBitcrusherRate(trackIndex, preset.crushRate);
        return true;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Arpeggiator ───────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.setArpeggiator = function (trackIndex, settings) {
        assign(this._arpSettings[trackIndex], settings);
    };

    ChiptuneSynth.prototype.getArpeggiator = function (trackIndex) {
        return clone(this._arpSettings[trackIndex]);
    };

    ChiptuneSynth.prototype.arpNoteOn = function (trackIndex, frequency) {
        var s = this._arpSettings[trackIndex];
        if (s.mode === 'off') return null;

        if (!this._arpStates.has(trackIndex)) {
            this._arpStates.set(trackIndex, {
                heldNotes: [], currentIndex: 0, direction: 1, activeNoteId: null, timerId: null
            });
        }

        var arp = this._arpStates.get(trackIndex);
        arp.heldNotes.push(frequency);
        arp.heldNotes.sort(function (a, b) { return a - b; });

        if (arp.heldNotes.length === 1) {
            this._arpStart(trackIndex);
        }
        return 'arp';
    };

    ChiptuneSynth.prototype.arpNoteOff = function (trackIndex, frequency) {
        var arp = this._arpStates.get(trackIndex);
        if (!arp) return;
        arp.heldNotes = arp.heldNotes.filter(function (f) { return Math.abs(f - frequency) > 0.01; });
        if (arp.heldNotes.length === 0) this._arpStop(trackIndex);
    };

    ChiptuneSynth.prototype._arpStart = function (trackIndex) {
        var arp = this._arpStates.get(trackIndex);
        if (!arp) return;
        arp.currentIndex = 0;
        arp.direction = 1;
        this._arpScheduleNext(trackIndex);
    };

    ChiptuneSynth.prototype._arpStop = function (trackIndex) {
        var arp = this._arpStates.get(trackIndex);
        if (!arp) return;
        if (arp.timerId) { clearTimeout(arp.timerId); arp.timerId = null; }
        if (arp.activeNoteId) { this.stopNote(arp.activeNoteId); arp.activeNoteId = null; }
        this._arpStates.delete(trackIndex);
    };

    ChiptuneSynth.prototype._arpScheduleNext = function (trackIndex) {
        var arp = this._arpStates.get(trackIndex);
        if (!arp || arp.heldNotes.length === 0) return;

        var s = this._arpSettings[trackIndex];
        var intervalMs = this._arpRateToMs(s.rate);
        var sequence = this._arpBuildSequence(arp.heldNotes, s);
        if (sequence.length === 0) return;

        var idx = arp.currentIndex % sequence.length;
        var freq = sequence[idx];

        if (arp.activeNoteId) this.stopNote(arp.activeNoteId);

        var noteDuration = (intervalMs / 1000) * s.gate;
        arp.activeNoteId = this.playNote(freq, trackIndex, noteDuration);

        // Advance
        if (s.mode === 'updown') {
            arp.currentIndex += arp.direction;
            if (arp.currentIndex >= sequence.length - 1) arp.direction = -1;
            if (arp.currentIndex <= 0) arp.direction = 1;
        } else if (s.mode === 'random') {
            arp.currentIndex = Math.floor(Math.random() * sequence.length);
        } else {
            arp.currentIndex++;
        }

        var self = this;
        arp.timerId = setTimeout(function () { self._arpScheduleNext(trackIndex); }, intervalMs);
    };

    ChiptuneSynth.prototype._arpBuildSequence = function (heldNotes, settings) {
        var notes = [];
        for (var oct = 0; oct < settings.octaves; oct++) {
            for (var n = 0; n < heldNotes.length; n++) {
                notes.push(heldNotes[n] * Math.pow(2, oct));
            }
        }
        if (settings.mode === 'down') notes.reverse();
        return notes;
    };

    ChiptuneSynth.prototype._arpRateToMs = function (rate) {
        var beatMs = 60000 / (this.bpm || 120);
        var divisions = { '1/4': 1, '1/8': 0.5, '1/8T': 1/3, '1/16': 0.25, '1/16T': 1/6, '1/32': 0.125 };
        return beatMs * (divisions[rate] || 0.5);
    };

    ChiptuneSynth.prototype.arpStopAll = function () {
        var self = this;
        var tracks = [];
        this._arpStates.forEach(function (v, k) { tracks.push(k); });
        for (var i = 0; i < tracks.length; i++) self._arpStop(tracks[i]);
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Analyser ──────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.getAnalyserData = function () {
        if (!this.analyser) return null;
        this.analyser.getByteTimeDomainData(this._analyserTimeData);
        return this._analyserTimeData;
    };
    ChiptuneSynth.prototype.getFrequencyData = function () {
        if (!this.analyser) return null;
        this.analyser.getByteFrequencyData(this._analyserFreqData);
        return this._analyserFreqData;
    };
    ChiptuneSynth.prototype.getWaveformData = ChiptuneSynth.prototype.getAnalyserData;

    // ══════════════════════════════════════════════════════════════════════
    // ── Reset ─────────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.resetToDefaults = function () {
        for (var i = 0; i < NUM_TRACKS; i++) {
            this.tracks[i] = buildTrack(DEFAULT_TRACKS[i]);
            this.envelopes[i] = clone(DEFAULT_ENVELOPES[i]);
            this.vibrato[i] = { rate: 0, depth: 0 };
            this._arpSettings[i] = { mode: 'off', rate: '1/8', octaves: 1, gate: 0.5 };
        }
        this.pitchBend = 0;
        this.modulation = 0;
        this.bpm = 120;
        this.resetMixerToDefaults();
        // Reset all FX to clean
        for (var t = 0; t < NUM_TRACKS; t++) {
            this.loadFxPreset(t, 'clean');
        }
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── Dispose ───────────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.dispose = function () {
        this.disableMIDI();
        this.stopAllNotes();
        if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
        this.initialized = false;
    };

    // ══════════════════════════════════════════════════════════════════════
    // ── MIDI Support ─────────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.prototype.enableMIDI = function (options) {
        if (!navigator.requestMIDIAccess) return Promise.reject(new Error('Web MIDI not supported'));
        var self = this;
        var opts = options || {};
        var targetTrack = opts.track !== undefined ? opts.track : 0;
        var filterChannel = opts.channel !== undefined ? opts.channel : 0;
        this._midiTrack = targetTrack;
        this._midiChannel = filterChannel;
        this._midiNotes = {};
        this._midiCallbacks = {
            onConnect: opts.onConnect || null,
            onDisconnect: opts.onDisconnect || null,
            onNoteOn: opts.onNoteOn || null,
            onNoteOff: opts.onNoteOff || null,
            onCC: opts.onCC || null
        };

        return navigator.requestMIDIAccess({ sysex: false }).then(function (midiAccess) {
            self._midiAccess = midiAccess;
            var inputNames = [];
            self._midiMessageHandler = function (e) { self._handleMIDIMessage(e); };
            self._midiStateHandler = function (e) { self._handleMIDIStateChange(e); };

            midiAccess.inputs.forEach(function (input) {
                input.addEventListener('midimessage', self._midiMessageHandler);
                inputNames.push(input.name);
                if (self._midiCallbacks.onConnect) self._midiCallbacks.onConnect(input.name);
            });
            midiAccess.addEventListener('statechange', self._midiStateHandler);
            self._midiEnabled = true;
            return inputNames;
        });
    };

    ChiptuneSynth.prototype.disableMIDI = function () {
        if (!this._midiAccess) return;
        var self = this;
        this._midiAccess.inputs.forEach(function (input) {
            input.removeEventListener('midimessage', self._midiMessageHandler);
        });
        this._midiAccess.removeEventListener('statechange', self._midiStateHandler);
        for (var k in this._midiNotes) {
            if (this._midiNotes[k]) this.stopNote(this._midiNotes[k]);
        }
        this._midiNotes = {};
        this._midiAccess = null;
        this._midiEnabled = false;
    };

    ChiptuneSynth.prototype._handleMIDIStateChange = function (e) {
        var port = e.port;
        if (port.type !== 'input') return;
        if (port.state === 'connected') {
            port.addEventListener('midimessage', this._midiMessageHandler);
            if (this._midiCallbacks.onConnect) this._midiCallbacks.onConnect(port.name);
        } else if (port.state === 'disconnected') {
            port.removeEventListener('midimessage', this._midiMessageHandler);
            if (this._midiCallbacks.onDisconnect) this._midiCallbacks.onDisconnect(port.name);
        }
    };

    ChiptuneSynth.prototype._handleMIDIMessage = function (e) {
        var data = e.data;
        if (!data || data.length < 2) return;

        var status = data[0];
        var channel = (status & 0x0F) + 1;
        var msgType = status & 0xF0;

        if (this._midiChannel > 0 && channel !== this._midiChannel) return;

        switch (msgType) {
            case 0x90:
                if (data[2] === 0) { this._midiNoteOff(data[1], channel); return; }
                this._midiNoteOn(data[1], data[2], channel);
                break;
            case 0x80:
                this._midiNoteOff(data[1], channel);
                break;
            case 0xB0:
                this._midiCC(data[1], data[2], channel);
                break;
            case 0xE0:
                var bendValue = ((data[2] << 7) | data[1]) - 8192;
                this.pitchBend = bendValue / 8192;
                this.updatePitchBend();
                break;
        }
    };

    ChiptuneSynth.prototype._midiNoteOn = function (note, velocity, channel) {
        var self = this;
        function doNoteOn() {
            if (self._midiNotes[note]) {
                self.stopNote(self._midiNotes[note]);
                delete self._midiNotes[note];
            }
            var freq = 440 * Math.pow(2, (note - 69) / 12);

            // Check arpeggiator
            var arpResult = self.arpNoteOn(self._midiTrack, freq);
            if (arpResult === 'arp') {
                self._midiNotes[note] = 'arp-' + freq;
                if (self._midiCallbacks.onNoteOn) self._midiCallbacks.onNoteOn(note, velocity, channel);
                return;
            }

            var noteId = self.playNote(freq, self._midiTrack);

            // Velocity scaling
            var nd = self.activeNotes.get(noteId);
            if (nd && nd.gainNode && velocity < 127) {
                var velScale = velocity / 127;
                var now = self.audioContext.currentTime;
                nd.gainNode.gain.cancelScheduledValues(now);
                nd.gainNode.gain.setValueAtTime(nd.gainNode.gain.value, now);
                var env = self.envelopes[self._midiTrack];
                var vol = self.tracks[self._midiTrack].volume;
                nd.gainNode.gain.linearRampToValueAtTime(velScale * vol, now + (env.attack || 0.01));
                nd.gainNode.gain.linearRampToValueAtTime(env.sustain * velScale * vol, now + (env.attack || 0.01) + (env.decay || 0.1));
            }

            self._midiNotes[note] = noteId;
            if (self._midiCallbacks.onNoteOn) self._midiCallbacks.onNoteOn(note, velocity, channel);
        }

        if (!this.initialized) {
            this.init().then(doNoteOn);
        } else {
            doNoteOn();
        }
    };

    ChiptuneSynth.prototype._midiNoteOff = function (note, channel) {
        var noteId = this._midiNotes[note];
        if (noteId) {
            if (typeof noteId === 'string' && noteId.indexOf('arp-') === 0) {
                var freq = parseFloat(noteId.substring(4));
                this.arpNoteOff(this._midiTrack, freq);
            } else {
                this.stopNote(noteId);
            }
            delete this._midiNotes[note];
        }
        if (this._midiCallbacks.onNoteOff) this._midiCallbacks.onNoteOff(note, channel);
    };

    ChiptuneSynth.prototype._midiCC = function (cc, value, channel) {
        switch (cc) {
            case 1:
                this.modulation = value / 127;
                this.updateModulation();
                break;
            case 7:
                this.tracks[this._midiTrack].volume = value / 127;
                break;
            case 64:
                this._midiSustain = value >= 64;
                break;
            case 120:
            case 123:
                for (var k in this._midiNotes) {
                    if (this._midiNotes[k]) this.stopNote(this._midiNotes[k]);
                }
                this._midiNotes = {};
                break;
        }
        if (this._midiCallbacks.onCC) this._midiCallbacks.onCC(cc, value, channel);
    };

    ChiptuneSynth.prototype.setMIDITrack = function (trackIndex) { this._midiTrack = trackIndex; };
    ChiptuneSynth.prototype.setMIDIChannel = function (ch) { this._midiChannel = ch; };
    ChiptuneSynth.prototype.isMIDIEnabled = function () { return !!this._midiEnabled; };

    // ══════════════════════════════════════════════════════════════════════
    // ── SoundFont Registration ────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════════
    ChiptuneSynth.registerSoundFont = function (soundFont) {
        if (!soundFont || !soundFont.categories) return;

        for (var cat in soundFont.categories) {
            if (!soundFont.categories.hasOwnProperty(cat)) continue;
            var items = soundFont.categories[cat];
            for (var key in items) {
                if (!items.hasOwnProperty(key)) continue;
                var src = items[key];
                INSTRUMENTS[key] = {
                    label: src.name || key,
                    icon: src.icon || 'music-note',
                    category: cat,
                    type: src.type || 'square',
                    duty: src.dutyCycle !== undefined ? src.dutyCycle : 0.5,
                    vol: src.volume !== undefined ? src.volume : 0.25,
                    pitchEnv: src.pitchEnv || 0,
                    glide: src.glide || 0,
                    env: src.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 },
                    vib: src.vibrato || { rate: 0, depth: 0 },
                    mod: {}
                };
                var mod = INSTRUMENTS[key].mod;
                if (src.filterEnabled !== undefined) mod.filterEnabled = src.filterEnabled;
                if (src.filterType)      mod.filterType = src.filterType;
                if (src.filterCutoff !== undefined) mod.filterCutoff = src.filterCutoff;
                if (src.filterQ !== undefined)     mod.filterQ = src.filterQ;
                if (src.filterKeyTrack !== undefined) mod.filterKeyTrack = src.filterKeyTrack;
                if (src.filterEnvAmount !== undefined) mod.filterEnvAmount = src.filterEnvAmount;
                if (src.filterEnvAttack !== undefined) mod.filterEnvAttack = src.filterEnvAttack;
                if (src.filterEnvRelease !== undefined) mod.filterEnvRelease = src.filterEnvRelease;
                if (src.filterLfoRate !== undefined)  mod.filterLfoRate = src.filterLfoRate;
                if (src.filterLfoDepth !== undefined) mod.filterLfoDepth = src.filterLfoDepth;
                if (src.lfoFilterRate !== undefined)  mod.lfoFilterRate = src.lfoFilterRate;
                if (src.lfoFilterDepth !== undefined) mod.lfoFilterDepth = src.lfoFilterDepth;
                if (src.tremoloRate !== undefined)  mod.tremoloRate = src.tremoloRate;
                if (src.tremoloDepth !== undefined) mod.tremoloDepth = src.tremoloDepth;
                if (src.unisonVoices !== undefined) mod.unisonVoices = src.unisonVoices;
                if (src.unisonDetune !== undefined) mod.unisonDetune = src.unisonDetune;
                if (src.unisonSpread !== undefined) mod.unisonSpread = src.unisonSpread;
                if (src.lfo1Wave) mod.lfo1Wave = src.lfo1Wave;
                if (src.lfo2Wave) mod.lfo2Wave = src.lfo2Wave;
                if (src.lfo3Wave) mod.lfo3Wave = src.lfo3Wave;
                if (src.lfo1Delay !== undefined) mod.lfo1Delay = src.lfo1Delay;
                if (src.lfo2Delay !== undefined) mod.lfo2Delay = src.lfo2Delay;
                if (src.lfo3Delay !== undefined) mod.lfo3Delay = src.lfo3Delay;
                if (src.octaveOffset !== undefined)   mod.octaveOffset = src.octaveOffset;
                if (src.semitoneOffset !== undefined)  mod.semitoneOffset = src.semitoneOffset;
                if (src.detune !== undefined) INSTRUMENTS[key].detune = src.detune;
            }
        }

        if (soundFont.kits) {
            if (!ChiptuneSynth._soundFontKits) ChiptuneSynth._soundFontKits = {};
            for (var k in soundFont.kits) {
                if (soundFont.kits.hasOwnProperty(k)) {
                    ChiptuneSynth._soundFontKits[k] = soundFont.kits[k];
                }
            }
        }

        if (!ChiptuneSynth._soundFonts) ChiptuneSynth._soundFonts = [];
        ChiptuneSynth._soundFonts.push({
            name: soundFont.name || 'unknown',
            version: soundFont.version || '0.0.0',
            count: Object.keys(soundFont.categories).reduce(function (sum, cat) {
                return sum + Object.keys(soundFont.categories[cat]).length;
            }, 0)
        });
    };

    ChiptuneSynth.getSoundFonts = function () { return ChiptuneSynth._soundFonts || []; };
    ChiptuneSynth.getKits = function () { return ChiptuneSynth._soundFontKits || {}; };

    ChiptuneSynth.getInstrumentsByCategory = function () {
        var result = {};
        for (var key in INSTRUMENTS) {
            if (!INSTRUMENTS.hasOwnProperty(key)) continue;
            var cat = INSTRUMENTS[key].category || 'other';
            if (!result[cat]) result[cat] = [];
            result[cat].push(key);
        }
        return result;
    };

    return ChiptuneSynth;
}));
