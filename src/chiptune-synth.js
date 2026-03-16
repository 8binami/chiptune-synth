/**
 * ChiptuneSynth — 8-Bit Chiptune Synthesizer (Free Edition)
 * A standalone Web Audio API synthesizer for retro 8-bit sound generation.
 *
 * @author 8Binami / 8BitForge
 * @license SEE LICENSE IN LICENSE
 * @version 2.0.0
 * @see https://8bitforge.com
 *
 * Features:
 *   - 4 tracks (Lead, Bass, Drums, FX)
 *   - 5 waveforms: Square (PWM), Triangle, Sawtooth, Sine, Noise
 *   - Per-track ADSR envelope, vibrato, filter, 3 LFOs, pitch envelope, glide
 *   - Unison voices (1-16) with detune & stereo spread
 *   - Pitch bend & modulation wheel
 *   - 10 built-in game audio presets
 *   - Waveform analyser for visualization
 *   - Zero dependencies — pure Web Audio API
 *
 * Want 8 tracks, mixer, effects, mastering & more? → https://8bitforge.com
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

    var DEFAULT_TRACKS = [
        { type: 'square',   volume: 0.30, dutyCycle: 0.5,  detune: 0, pitchEnv: 0,  glide: 0   }, // 0: Lead
        { type: 'triangle', volume: 0.40, dutyCycle: 0.5,  detune: 0, pitchEnv: 0,  glide: 0.1 }, // 1: Bass
        { type: 'noise',    volume: 0.50, dutyCycle: 0.5,  detune: 0, pitchEnv: 0,  glide: 0   }, // 2: Drums
        { type: 'sawtooth', volume: 0.25, dutyCycle: 0.5,  detune: 0, pitchEnv: 0,  glide: 0   }  // 3: FX
    ];

    var DEFAULT_ENVELOPES = [
        { attack: 0.01,  decay: 0.10, sustain: 0.7, release: 0.20 }, // Lead
        { attack: 0.01,  decay: 0.20, sustain: 0.8, release: 0.15 }, // Bass
        { attack: 0.001, decay: 0.10, sustain: 0.0, release: 0.05 }, // Drums
        { attack: 0.005, decay: 0.30, sustain: 0.0, release: 0.20 }  // FX
    ];

    var TRACK_NAMES = ['Lead', 'Bass', 'Drums', 'FX'];
    var NUM_TRACKS = 4;

    var NOTE_MAP = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };

    // ── SFX Presets (game audio one-shots) ───────────────────────────────
    var PRESETS = {
        laser:     { track:3, freq:880,    dur:0.25, type:'square',   vol:0.35, duty:0.25,  env:{attack:0.001,decay:0.20,sustain:0.00,release:0.02}, pitchEnv:-24, mod:{} },
        coin:      { track:0, freq:1318.5, dur:0.12, type:'square',   vol:0.30, duty:0.50,  env:{attack:0.001,decay:0.08,sustain:0.00,release:0.02}, pitchEnv:5,   mod:{} },
        jump:      { track:2, freq:200,    dur:0.20, type:'sine',     vol:0.50, duty:0.50,  env:{attack:0.001,decay:0.15,sustain:0.00,release:0.02}, pitchEnv:12,  mod:{} },
        explosion: { track:2, freq:100,    dur:0.50, type:'noise',    vol:0.55, duty:0.50,  env:{attack:0.001,decay:0.40,sustain:0.00,release:0.05}, pitchEnv:0,   mod:{} },
        powerup:   { track:3, freq:440,    dur:0.60, type:'square',   vol:0.30, duty:0.50,  env:{attack:0.01, decay:0.50,sustain:0.00,release:0.05}, pitchEnv:24,  mod:{}, vib:{rate:6,depth:8} },
        hit:       { track:2, freq:150,    dur:0.15, type:'noise',    vol:0.60, duty:0.50,  env:{attack:0.001,decay:0.10,sustain:0.00,release:0.02}, pitchEnv:0,   mod:{} },
        blip:      { track:0, freq:1046.5, dur:0.06, type:'square',   vol:0.25, duty:0.50,  env:{attack:0.001,decay:0.04,sustain:0.00,release:0.01}, pitchEnv:0,   mod:{} },
        bass:      { track:1, freq:65.41,  dur:0.30, type:'triangle', vol:0.45, duty:0.50,  env:{attack:0.005,decay:0.20,sustain:0.00,release:0.05}, pitchEnv:0,   mod:{} },
        shoot:     { track:3, freq:1200,   dur:0.15, type:'square',   vol:0.30, duty:0.125, env:{attack:0.001,decay:0.12,sustain:0.00,release:0.01}, pitchEnv:-36, mod:{} },
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

    // ── Helpers ────────────────────────────────────────────────────────────
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function assign(t, s) { for (var k in s) if (s.hasOwnProperty(k)) t[k] = s[k]; return t; }
    function buildTrack(base) { return assign(assign({}, base), DEFAULT_MOD); }

    // ── Constructor ───────────────────────────────────────────────────────
    function ChiptuneSynth() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.initialized = false;

        this.pitchBend = 0;    // -1 to +1 (±200 cents)
        this.modulation = 0;   // 0 to 1 (adds vibrato depth)

        this.tracks = [];
        this.envelopes = [];
        this.vibrato = [];
        this._trackGains = [];

        for (var i = 0; i < NUM_TRACKS; i++) {
            this.tracks.push(buildTrack(DEFAULT_TRACKS[i]));
            this.envelopes.push(clone(DEFAULT_ENVELOPES[i]));
            this.vibrato.push({ rate: 0, depth: 0 });
        }

        this.activeNotes = new Map();
        this._noteIdCounter = 0;
        this._noiseBuffer = null;
        this._periodicWaveCache = {};
        this._analyserTimeData = null;
        this._analyserFreqData = null;
    }

    // ── Static ────────────────────────────────────────────────────────────
    ChiptuneSynth.TRACK_NAMES = TRACK_NAMES;

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

    ChiptuneSynth.getPresetNames = function () {
        return Object.keys(PRESETS);
    };

    ChiptuneSynth.getInstrumentNames = function () {
        return Object.keys(INSTRUMENTS);
    };

    ChiptuneSynth.getInstruments = function () {
        var out = {};
        for (var k in INSTRUMENTS) if (INSTRUMENTS.hasOwnProperty(k)) {
            var ins = INSTRUMENTS[k];
            out[k] = {
                name: k, label: ins.label, icon: ins.icon,
                type: ins.type || 'square',
                duty: ins.duty, vol: ins.vol, pitchEnv: ins.pitchEnv, glide: ins.glide,
                env: ins.env ? { attack: ins.env.attack, decay: ins.env.decay, sustain: ins.env.sustain, release: ins.env.release } : null,
                vib: ins.vib ? { rate: ins.vib.rate, depth: ins.vib.depth } : null,
                mod: ins.mod ? {
                    unisonVoices: ins.mod.unisonVoices, unisonDetune: ins.mod.unisonDetune, unisonSpread: ins.mod.unisonSpread,
                    filterEnabled: ins.mod.filterEnabled, filterType: ins.mod.filterType,
                    filterCutoff: ins.mod.filterCutoff, filterQ: ins.mod.filterQ, filterKeyTrack: ins.mod.filterKeyTrack,
                    filterEnvAmount: ins.mod.filterEnvAmount, filterEnvAttack: ins.mod.filterEnvAttack, filterEnvRelease: ins.mod.filterEnvRelease,
                    lfoFilterRate: ins.mod.lfoFilterRate, lfoFilterDepth: ins.mod.lfoFilterDepth,
                    tremoloRate: ins.mod.tremoloRate, tremoloDepth: ins.mod.tremoloDepth
                } : null
            };
        }
        return out;
    };

    // ── Init ──────────────────────────────────────────────────────────────
    ChiptuneSynth.prototype.init = async function () {
        if (this.initialized) return;

        var AC = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AC();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;

        // Analyser for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // Master chain: masterGain → analyser → destination
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Per-track gain nodes → master
        this._trackGains = [];
        for (var i = 0; i < NUM_TRACKS; i++) {
            var g = this.audioContext.createGain();
            g.gain.value = 1.0;
            g.connect(this.masterGain);
            this._trackGains.push(g);
        }

        // Pre-generate noise buffer (2 seconds, smoothed)
        var sr = this.audioContext.sampleRate;
        var len = sr * 2;
        this._noiseBuffer = this.audioContext.createBuffer(1, len, sr);
        var data = this._noiseBuffer.getChannelData(0);
        for (var n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * 0.8;
        for (var n = 1; n < len; n++) data[n] = data[n] * 0.8 + data[n - 1] * 0.2;

        // Pre-allocate analyser buffers
        this._analyserTimeData = new Uint8Array(this.analyser.frequencyBinCount);
        this._analyserTimeData.fill(128);
        this._analyserFreqData = new Uint8Array(this.analyser.frequencyBinCount);

        this.initialized = true;
    };

    // ── Oscillator creation ───────────────────────────────────────────────
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

    // ── Play Note ─────────────────────────────────────────────────────────
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

        // LFO 1 — Vibrato (pitch modulation)
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

        // Per-track filter
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

        // LFO 3 — Tremolo
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

        // LFO 2 — Filter modulation
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

        // LFO 2b — Alternative filter modulation
        var lfoFilt = this.audioContext.createOscillator();
        lfoFilt.type = track.lfo2Wave || 'sine';
        lfoFilt.frequency.value = track.lfoFilterRate || 0.01;
        var lfoFiltGain = this.audioContext.createGain();
        lfoFiltGain.gain.value = (track.lfoFilterRate > 0 && track.lfoFilterDepth > 0) ? (track.lfoFilterDepth / 100) * 5000 : 0;
        lfoFilt.connect(lfoFiltGain);
        lfoFiltGain.connect(trackFilter.frequency);
        lfoFilt.start(now);
        extraLfos.push(lfoFilt);

        // Filter envelope
        if (track.filterEnabled && track.filterEnvAmount !== 0) {
            var baseCut = track.filterCutoff;
            var envTarget = baseCut * Math.pow(2, track.filterEnvAmount / 12);
            trackFilter.frequency.setValueAtTime(envTarget, now);
            trackFilter.frequency.exponentialRampToValueAtTime(Math.max(20, baseCut), now + Math.max(0.001, track.filterEnvAttack || 0.01));
        }

        // Route to track gain → master
        // Track gain controls volume in real-time; note gain controls ADSR only
        this._trackGains[trackIndex].gain.value = track.volume;
        outputNode.connect(this._trackGains[trackIndex]);

        // ADSR (normalized 0→1→sustain, volume handled by _trackGains)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1.0, now + envelope.attack);
        gainNode.gain.linearRampToValueAtTime(envelope.sustain, now + envelope.attack + envelope.decay);

        for (var oi = 0; oi < oscillators.length; oi++) oscillators[oi].start(now);

        var sustained = duration >= 10;
        if (!sustained) {
            var rs = now + duration;
            gainNode.gain.setValueAtTime(envelope.sustain, rs);
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
            setTimeout(function () {
                self.activeNotes.delete(noteId);
                self._disconnectNote({
                    oscillators: oscillators, gainNode: gainNode, lfo: lfo, lfoGain: lfoGain,
                    trackFilter: trackFilter, tremoloLfo: tremoloLfo, tremoloGain: tremoloGain,
                    filtLfo: filtLfo, filtLfoGain: filtLfoGain, lfoFilt: lfoFilt, lfoFiltGain: lfoFiltGain
                });
            }, (duration + envelope.release + 0.2) * 1000);
        }

        return noteId;
    };

    ChiptuneSynth.prototype.playNoteByName = function (note, octave, trackIndex, duration) {
        return this.playNote(ChiptuneSynth.noteToFrequency(note, octave === undefined ? 4 : octave), trackIndex || 0, duration === undefined ? 0.5 : duration);
    };

    // ── Stop ──────────────────────────────────────────────────────────────
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
            setTimeout(function () { self._disconnectNote(nd); }, (release + 0.15) * 1000);
        } catch (e) {}
        this.activeNotes.delete(noteId);
    };

    ChiptuneSynth.prototype.stopAllNotes = function () {
        var keys = [];
        this.activeNotes.forEach(function (v, k) { keys.push(k); });
        for (var i = 0; i < keys.length; i++) this.stopNote(keys[i]);
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

    // ── Live parameter updates (real-time, no clicks, no cut) ──────────────
    ChiptuneSynth.prototype.updateLiveNotes = function (trackIndex) {
        var track = this.tracks[trackIndex];
        var envelope = this.envelopes[trackIndex];
        var vib = this.vibrato[trackIndex];
        var self = this;
        var now = this.audioContext ? this.audioContext.currentTime : 0;

        // Volume — update track gain node (never touch per-note ADSR gainNode!)
        if (this._trackGains[trackIndex]) {
            this._trackGains[trackIndex].gain.value = track.volume;
        }

        this.activeNotes.forEach(function (nd) {
            if (nd.trackIndex !== trackIndex) return;

            // Sustain level — smoothly ramp held notes to new sustain (ADSR normalized)
            if (nd.sustained && nd.gainNode) {
                var cur = nd.gainNode.gain.value;
                var target = envelope.sustain;
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
                        // Build PeriodicWave if not cached yet
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

            // Detune + octave/semitone offsets on held notes
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
                // Apply key tracking
                if ((track.filterKeyTrack || 0) > 0 && track.filterEnabled && nd.frequency) {
                    var kt = track.filterKeyTrack / 100;
                    cutoff *= Math.pow(2, Math.log2(nd.frequency / 261.63) * kt);
                    cutoff = Math.max(20, Math.min(20000, cutoff));
                }
                nd.trackFilter.frequency.setTargetAtTime(cutoff, now, 0.01);
                nd.trackFilter.Q.setTargetAtTime(track.filterEnabled ? track.filterQ : 0.1, now, 0.01);
                nd.trackFilter.type = track.filterType || 'lowpass';
            }
            // LFO 1 — Vibrato
            if (nd.lfo && nd.lfoGain) {
                nd.lfo.frequency.value = vib.rate || 0;
                var t = (vib.rate > 0 && vib.depth > 0) ? vib.depth : 0;
                if (self.modulation > 0) { t = Math.max(t, self.modulation * 15); if (nd.lfo.frequency.value < 0.5) nd.lfo.frequency.value = 5; }
                nd.lfoGain.gain.value = t;
            }
            // LFO 3 — Tremolo
            if (nd.tremoloLfo && nd.tremoloGain) {
                nd.tremoloLfo.frequency.value = track.tremoloRate || 0.01;
                nd.tremoloGain.gain.value = (track.tremoloRate > 0 && track.tremoloDepth > 0) ? (track.tremoloDepth / 100) * 0.5 : 0;
            }
            // LFO 2 — Filter modulation
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

    // ── Presets ────────────────────────────────────────────────────────────
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

    // ── Master volume ─────────────────────────────────────────────────────
    ChiptuneSynth.prototype.setMasterVolume = function (v) { if (this.masterGain) this.masterGain.gain.value = v; };
    ChiptuneSynth.prototype.getMasterVolume = function () { return this.masterGain ? this.masterGain.gain.value : 0; };

    // ── Analyser ──────────────────────────────────────────────────────────
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
    // Alias for compat
    ChiptuneSynth.prototype.getWaveformData = ChiptuneSynth.prototype.getAnalyserData;

    // ── Reset ─────────────────────────────────────────────────────────────
    ChiptuneSynth.prototype.resetToDefaults = function () {
        for (var i = 0; i < NUM_TRACKS; i++) {
            this.tracks[i] = buildTrack(DEFAULT_TRACKS[i]);
            this.envelopes[i] = clone(DEFAULT_ENVELOPES[i]);
            this.vibrato[i] = { rate: 0, depth: 0 };
        }
        this.pitchBend = 0;
        this.modulation = 0;
    };

    // ── Dispose ───────────────────────────────────────────────────────────
    ChiptuneSynth.prototype.dispose = function () {
        this.disableMIDI();
        this.stopAllNotes();
        if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
        this.initialized = false;
    };

    // ── MIDI Support ─────────────────────────────────────────────────────
    /**
     * enableMIDI(options)
     *   options.track      — target track index (default: 0)
     *   options.channel     — MIDI channel 1-16, 0 = all (default: 0)
     *   options.onConnect   — callback(deviceName) when input connected
     *   options.onDisconnect— callback(deviceName) when input disconnected
     *   options.onNoteOn    — callback(note, velocity, channel)
     *   options.onNoteOff   — callback(note, channel)
     *   options.onCC        — callback(cc, value, channel)
     * Returns a Promise that resolves to an array of MIDI input names.
     */
    ChiptuneSynth.prototype.enableMIDI = function (options) {
        if (!navigator.requestMIDIAccess) return Promise.reject(new Error('Web MIDI not supported'));
        var self = this;
        var opts = options || {};
        var targetTrack = opts.track !== undefined ? opts.track : 0;
        var filterChannel = opts.channel !== undefined ? opts.channel : 0; // 0 = all
        this._midiTrack = targetTrack;
        this._midiChannel = filterChannel;
        this._midiNotes = {};   // midi note number → noteId
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

            // Bind message handler to all inputs
            self._midiMessageHandler = function (e) { self._handleMIDIMessage(e); };
            self._midiStateHandler = function (e) { self._handleMIDIStateChange(e); };

            midiAccess.inputs.forEach(function (input) {
                input.addEventListener('midimessage', self._midiMessageHandler);
                inputNames.push(input.name);
                if (self._midiCallbacks.onConnect) self._midiCallbacks.onConnect(input.name);
            });

            // Watch for hot-plug
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
        // Stop all MIDI-held notes
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
        var channel = (status & 0x0F) + 1;  // MIDI channels 1-16
        var msgType = status & 0xF0;

        // Channel filter (0 = all)
        if (this._midiChannel > 0 && channel !== this._midiChannel) return;

        var note, velocity, cc, value;

        switch (msgType) {
            case 0x90: // Note On
                note = data[1];
                velocity = data[2];
                if (velocity === 0) {
                    // velocity 0 = Note Off
                    this._midiNoteOff(note, channel);
                    return;
                }
                this._midiNoteOn(note, velocity, channel);
                break;

            case 0x80: // Note Off
                note = data[1];
                this._midiNoteOff(note, channel);
                break;

            case 0xB0: // Control Change
                cc = data[1];
                value = data[2];
                this._midiCC(cc, value, channel);
                break;

            case 0xE0: // Pitch Bend
                var lsb = data[1], msb = data[2];
                var bendValue = ((msb << 7) | lsb) - 8192;
                this.pitchBend = bendValue / 8192; // -1 to +1
                this.updatePitchBend();
                break;
        }
    };

    ChiptuneSynth.prototype._midiNoteOn = function (note, velocity, channel) {
        var self = this;

        function doNoteOn() {
            // Stop existing note on same key (retrigger)
            if (self._midiNotes[note]) {
                self.stopNote(self._midiNotes[note]);
                delete self._midiNotes[note];
            }

            var freq = 440 * Math.pow(2, (note - 69) / 12);
            var noteId = self.playNote(freq, self._midiTrack);

            // Apply velocity scaling to the note's own gain (ADSR peak = velocity/127)
            var nd = self.activeNotes.get(noteId);
            if (nd && nd.gainNode && velocity < 127) {
                var velScale = velocity / 127;
                var now = self.audioContext.currentTime;
                nd.gainNode.gain.cancelScheduledValues(now);
                nd.gainNode.gain.setValueAtTime(nd.gainNode.gain.value, now);
                var env = self.envelopes[self._midiTrack];
                nd.gainNode.gain.linearRampToValueAtTime(velScale, now + (env.attack || 0.01));
                nd.gainNode.gain.linearRampToValueAtTime(env.sustain * velScale, now + (env.attack || 0.01) + (env.decay || 0.1));
            }

            self._midiNotes[note] = noteId;
            if (self._midiCallbacks.onNoteOn) self._midiCallbacks.onNoteOn(note, velocity, channel);
        }

        // Auto-init AudioContext on first MIDI note (counts as user gesture)
        if (!this.initialized) {
            this.init().then(doNoteOn);
        } else {
            doNoteOn();
        }
    };

    ChiptuneSynth.prototype._midiNoteOff = function (note, channel) {
        var noteId = this._midiNotes[note];
        if (noteId) {
            this.stopNote(noteId);
            delete this._midiNotes[note];
        }
        if (this._midiCallbacks.onNoteOff) this._midiCallbacks.onNoteOff(note, channel);
    };

    ChiptuneSynth.prototype._midiCC = function (cc, value, channel) {
        switch (cc) {
            case 1:  // Mod Wheel
                this.modulation = value / 127;
                this.updateModulation();
                break;
            case 7:  // Channel Volume
                this.tracks[this._midiTrack].volume = value / 127;
                if (this._trackGains[this._midiTrack]) this._trackGains[this._midiTrack].gain.value = value / 127;
                break;
            case 10: // Pan (mapped to stereo spread hint)
                break;
            case 64: // Sustain Pedal
                this._midiSustain = value >= 64;
                if (!this._midiSustain) {
                    // Release all sustained notes (future enhancement)
                }
                break;
            case 120: // All Sound Off
            case 123: // All Notes Off
                for (var k in this._midiNotes) {
                    if (this._midiNotes[k]) this.stopNote(this._midiNotes[k]);
                }
                this._midiNotes = {};
                break;
        }
        if (this._midiCallbacks.onCC) this._midiCallbacks.onCC(cc, value, channel);
    };

    ChiptuneSynth.prototype.setMIDITrack = function (trackIndex) {
        this._midiTrack = trackIndex;
    };

    ChiptuneSynth.prototype.setMIDIChannel = function (ch) {
        this._midiChannel = ch;
    };

    ChiptuneSynth.prototype.isMIDIEnabled = function () {
        return !!this._midiEnabled;
    };

    return ChiptuneSynth;
}));
