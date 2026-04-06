# ChiptuneSynth

**The ultimate 8-bit audio engine for the browser.**

[![npm](https://img.shields.io/npm/v/@8bitforge/chiptune-synth?color=00f0ff&style=flat-square)](https://www.npmjs.com/package/@8bitforge/chiptune-synth)
[![version](https://img.shields.io/badge/version-3.0.0-00f0ff?style=flat-square)](#)
[![license](https://img.shields.io/badge/license-proprietary-a855f7?style=flat-square)](#license)
[![size](https://img.shields.io/badge/size-~43KB_min-green?style=flat-square)](#)
[![deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](#)

8 tracks. 170+ instruments. Full effects chain. Mixer. Arpeggiator. Master limiter. MIDI. Zero dependencies. Pure Web Audio API.

```js
const synth = new ChiptuneSynth();
await synth.init();
synth.playPreset('coin');  // ding!
```

---

## Features

### Synthesis Engine
- **8 Tracks** — Lead, Harmony, Bass, Arp, Kick, Snare, Hi-hat, FX
- **5 Waveforms** — Square (PWM), Triangle, Sawtooth, Sine, Noise
- **ADSR Envelopes** — Per-track attack, decay, sustain, release
- **Unison Voices** — 1–16 voices per track with detune & stereo spread
- **3 LFOs per Track** — Vibrato (pitch), tremolo (amplitude), filter modulation
- **Per-track Filters** — Lowpass / Highpass / Bandpass with cutoff, resonance, key tracking, filter envelope
- **Pitch Envelope & Glide** — Per-voice pitch sweep and portamento
- **Pitch Bend & Mod Wheel** — Real-time performance controls

### Effects Chain (per track)
Signal path: `input → distortion → chorus → delay → reverb → bitcrusher → output`

- **Distortion** — WaveShaper with 4x oversampling, variable drive
- **Chorus** — Modulated delay with LFO rate and depth
- **Delay** — Feedback delay up to 2 seconds with wet/dry mix
- **Reverb** — Convolution reverb with variable decay
- **Bitcrusher** — Bit depth (1–16 bits) and sample rate reduction

### Mixer Console (per track)
- **Fader** — Independent channel volume
- **Pan** — StereoPanner with full left/right range
- **3-band EQ** — Low shelf (320 Hz), Peaking mid (1 kHz), High shelf (3.2 kHz)
- **Compressor** — Threshold, ratio, attack, release per track
- **Solo / Mute** — Non-destructive per-track control
- **VU Metering** — RMS level per track and master

### Master Bus
- **Brick-wall Limiter** — -3 dB threshold, 20:1 ratio, 1 ms attack
- **Master Gain** — Global output volume
- **FFT Analyser** — Waveform and frequency data for visualization

### Arpeggiator
- **Modes** — off, up, down, updown, random
- **BPM-synced rates** — 1/4, 1/8, 1/8T, 1/16, 1/16T, 1/32
- **Multi-octave** — Span 1–N octaves
- **Gate** — Note length as fraction of step

### Sound Library
- **170+ Instrument Presets** via ChiptuneSoundFont — leads, bass, chords, arps, pads, synths, acoustic, retro, drums, FX
- **15 Drum Kits**
- **10 Game SFX Presets** — laser, coin, jump, explosion, powerup, hit, blip, bass, shoot, 1up
- **Community Presets** — user-contributed via API

### Integration
- **MIDI Controller Support** — Velocity, CC, pitch bend, mod wheel, sustain pedal (Web MIDI API)
- **SoundFont API** — Register external instrument libraries at runtime
- **UMD Module** — Works in Node.js (CommonJS), AMD, and browser global

---

## Install

**npm:**
```bash
npm install @8bitforge/chiptune-synth
```

**CDN (recommended for browsers):**
```html
<!-- Engine -->
<script src="https://cdn.chiptune-synth.8binami.com/3.0.0/chiptune-synth.min.js"></script>
<!-- Sound library (170+ instruments) -->
<script src="https://cdn.chiptune-synth.8binami.com/3.0.0/chiptune-sound-font.min.js"></script>
```

**unpkg:**
```html
<script src="https://unpkg.com/@8bitforge/chiptune-synth@3"></script>
```

**ES Module / CommonJS:**
```js
import ChiptuneSynth from '@8bitforge/chiptune-synth';
// or
const ChiptuneSynth = require('@8bitforge/chiptune-synth');
```

---

## Quick Start

### Play a game SFX
```js
const synth = new ChiptuneSynth();
await synth.init();
synth.playPreset('laser');
```

### Load an instrument and play a note
```js
await synth.init();
synth.loadInstrument('synthLead', 0);
synth.playNoteByName('C', 4, 0, 1.0);
```

### Enable MIDI controller
```js
const devices = await synth.enableMIDI({
    track: 0,
    onConnect: (name) => console.log('Connected:', name),
    onNoteOn:  (note, vel, ch) => console.log('Note on:', note, vel)
});
```

### Add reverb + delay to a track
```js
synth.setReverbMix(0, 0.3);      // 30% reverb
synth.setDelayTime(0, 0.375);    // dotted-8th delay
synth.setDelayFeedback(0, 0.5);
synth.setDelayMix(0, 0.25);
```

### Set up the arpeggiator
```js
synth.setArpeggiator(0, { mode: 'up', rate: '1/16', octaves: 2, gate: 0.6 });
const noteId = synth.arpNoteOn(0, 261.63); // C4 — arp starts
// later:
synth.arpNoteOff(0, 261.63);
```

### Mixer: pan and EQ a track
```js
synth.setTrackPan(1, -0.5);           // Bass: left
synth.setTrackEQ(0, 'eqHigh', 4);     // Lead: +4dB highs
synth.setTrackFaderVolume(4, 0.8);    // Kick: fader at 80%
synth.setTrackMute(6, true);          // Hi-hat: muted
```

### Bitcrusher — retro lo-fi effect
```js
synth.setBitcrusherBits(3, 6);    // FX track: 6-bit
synth.setBitcrusherRate(3, 0.3);  // Low sample rate
```

---

## API Reference

### Lifecycle

| Method | Description |
|--------|-------------|
| `new ChiptuneSynth()` | Create a synth instance |
| `synth.init()` | Initialize audio engine (async, requires user gesture) |
| `synth.dispose()` | Release all audio resources |
| `synth.resetToDefaults()` | Reset all tracks, mixer, and FX to factory settings |
| `synth.bpm` | BPM used by arpeggiator (default: 120) |

### Playing Notes

| Method | Description |
|--------|-------------|
| `synth.playNote(freq, track, duration?, startTime?)` | Play by frequency (Hz). Returns `noteId` |
| `synth.playNoteByName(note, octave, track, duration?)` | Play by name e.g. `'C#', 5`. Returns `noteId` |
| `synth.stopNote(noteId)` | Stop a sustained note with ADSR release |
| `synth.stopAllNotes()` | Emergency stop — all notes + all arps |

> **Sustained notes:** `duration >= 10` holds indefinitely. Call `stopNote(id)` to release.

### SFX Presets

| Method | Description |
|--------|-------------|
| `synth.playPreset(name)` | Load preset config + play immediately |
| `synth.loadPreset(name)` | Load preset config without playing |
| `ChiptuneSynth.getPresetNames()` | Array of all SFX preset names |

### Instrument Presets

| Method | Description |
|--------|-------------|
| `synth.loadInstrument(name, trackIndex)` | Load an instrument onto a track |
| `ChiptuneSynth.getInstrumentNames()` | Array of all instrument keys |
| `ChiptuneSynth.getInstruments()` | Full instrument definitions object |
| `ChiptuneSynth.getInstrumentsByCategory()` | Instruments grouped by category |

### Configuration

| Method | Description |
|--------|-------------|
| `synth.updateTrack(i, settings)` | Merge partial settings into track config |
| `synth.updateEnvelope(i, env)` | Merge partial ADSR |
| `synth.updateVibrato(i, vib)` | Update vibrato `{ rate, depth }` |
| `synth.updateLiveNotes(i)` | Apply track changes to currently playing notes |
| `synth.updatePitchBend()` | Push `synth.pitchBend` to active notes |
| `synth.updateModulation()` | Push `synth.modulation` to active notes |

**Track properties:** `type`, `volume`, `dutyCycle`, `pitchEnv`, `glide`, `detune`

**Modulation properties (via `updateTrack`):**
- `unisonVoices`, `unisonDetune`, `unisonSpread`
- `filterEnabled`, `filterType`, `filterCutoff`, `filterQ`, `filterKeyTrack`
- `filterEnvAmount`, `filterEnvAttack`, `filterEnvRelease`
- `filterLfoRate`, `filterLfoDepth`, `lfoFilterRate`, `lfoFilterDepth`
- `tremoloRate`, `tremoloDepth`
- `octaveOffset`, `semitoneOffset`

**Envelope properties:** `attack`, `decay`, `sustain`, `release`

### Mixer Console

| Method | Description |
|--------|-------------|
| `synth.setTrackFaderVolume(i, vol)` | Channel fader 0–1.5 (1.0 = unity) |
| `synth.setTrackPan(i, pan)` | Stereo pan -1 (left) to +1 (right) |
| `synth.setTrackEQ(i, band, gainDb)` | `band`: `'eqLow'`, `'eqMid'`, `'eqHigh'` (±12 dB) |
| `synth.setTrackSolo(i, bool)` | Solo a track |
| `synth.setTrackMute(i, bool)` | Mute a track |
| `synth.resetMixerToDefaults()` | Reset all mixer settings |
| `synth.setTrackCompressorEnabled(i, bool)` | Enable/disable per-track compressor |
| `synth.setTrackCompressorThreshold(i, dB)` | Threshold in dB |
| `synth.setTrackCompressorRatio(i, ratio)` | Ratio e.g. 4 = 4:1 |
| `synth.setTrackCompressorAttack(i, s)` | Attack in seconds |
| `synth.setTrackCompressorRelease(i, s)` | Release in seconds |
| `synth.getTrackCompressorReduction(i)` | Current gain reduction (dB) |
| `synth.setMasterVolume(vol)` | Master output gain |
| `synth.getMasterVolume()` | Current master volume |

### Metering & Visualization

| Method | Description |
|--------|-------------|
| `synth.getAnalyserData()` | `Uint8Array` — waveform time-domain data |
| `synth.getFrequencyData()` | `Uint8Array` — FFT frequency data |
| `synth.getWaveformData()` | Alias for `getAnalyserData()` |
| `synth.getTrackLevel(i)` | RMS level for track i (0–1) |
| `synth.getMasterLevel()` | RMS level at master bus (0–1) |

### Per-Track Effects

| Method | Description |
|--------|-------------|
| `synth.setDistortion(i, amount)` | Drive 0–1. 0 = bypass |
| `synth.setDelayTime(i, seconds)` | Delay time 0–2s |
| `synth.setDelayFeedback(i, amount)` | Feedback 0–0.9 |
| `synth.setDelayMix(i, mix)` | Wet/dry 0–1 |
| `synth.setReverbMix(i, mix)` | Wet/dry 0–1 |
| `synth.setReverbDecay(i, decay)` | Reverb tail length |
| `synth.setChorusRate(i, hz)` | LFO rate 0.1–10 Hz |
| `synth.setChorusDepth(i, depth)` | Modulation depth 0–1 |
| `synth.setChorusMix(i, mix)` | Wet/dry 0–1 |
| `synth.setBitcrusherBits(i, bits)` | Bit depth 1–16. 16 = bypass |
| `synth.setBitcrusherRate(i, rate)` | Sample rate ratio 0.01–1 |
| `synth.getTrackFxParams(i)` | Get all FX params for a track |
| `synth.loadFxPreset(i, name)` | Load FX preset: `'clean'` `'space'` `'echo'` `'dirty'` `'crush'` |
| `ChiptuneSynth.getFxPresetNames()` | Array of FX preset names |

### Arpeggiator

| Method | Description |
|--------|-------------|
| `synth.setArpeggiator(i, settings)` | Configure arp for track i |
| `synth.getArpeggiator(i)` | Get current arp settings |
| `synth.arpNoteOn(i, frequency)` | Trigger arp on a frequency. Returns `'arp'` if active |
| `synth.arpNoteOff(i, frequency)` | Release a held note from the arp |
| `synth.arpStopAll()` | Stop all active arpeggiatorsators |

**Arp settings:**
```js
{
    mode:   'up',   // 'off' | 'up' | 'down' | 'updown' | 'random'
    rate:   '1/8',  // '1/4' | '1/8' | '1/8T' | '1/16' | '1/16T' | '1/32'
    octaves: 2,     // 1–4 octave span
    gate:    0.6    // Note length 0.0–1.0 (fraction of step)
}
```

### MIDI

| Method | Description |
|--------|-------------|
| `synth.enableMIDI(options?)` | Enable MIDI. Returns `Promise<string[]>` (device names) |
| `synth.disableMIDI()` | Disconnect all MIDI |
| `synth.setMIDITrack(i)` | Change target track |
| `synth.setMIDIChannel(ch)` | Channel filter 0-15 (0 = all) |
| `synth.isMIDIEnabled()` | Boolean |

**`enableMIDI` options:**
```js
synth.enableMIDI({
    track: 0,
    channel: 0,
    onConnect:    (name) => {},
    onDisconnect: (name) => {},
    onNoteOn:     (note, velocity, channel) => {},
    onNoteOff:    (note, channel) => {},
    onCC:         (cc, value, channel) => {}
});
```

**Supported MIDI messages:** Note On/Off (velocity), CC1 (mod wheel), CC7 (volume), CC64 (sustain), CC120/123 (all notes off), Pitch Bend

### Static Utilities

| Method | Description |
|--------|-------------|
| `ChiptuneSynth.noteToFrequency(note, octave)` | `'A', 4` → `440` |
| `ChiptuneSynth.midiToFrequency(midi)` | `69` → `440` |
| `ChiptuneSynth.frequencyToMidi(freq)` | `440` → `69` |
| `ChiptuneSynth.TRACK_NAMES` | `['Lead','Harmony','Bass','Arp','Kick','Snare','Hi-hat','FX']` |
| `ChiptuneSynth.NUM_TRACKS` | `8` |

### SoundFont API

```js
// Register an external sound library at runtime
ChiptuneSynth.registerSoundFont({
    name: 'My Library',
    version: '1.0.0',
    categories: {
        leads: {
            'my-lead': {
                name: 'My Lead',
                type: 'square', dutyCycle: 0.25, volume: 0.3,
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 },
                vibrato:  { rate: 5, depth: 8 }
            }
        }
    }
});

ChiptuneSynth.getSoundFonts();           // Registered font metadata
ChiptuneSynth.getKits();                 // All registered drum kits
ChiptuneSynth.getInstrumentsByCategory(); // Instruments grouped by category
```

---

## Tracks

| # | Name | Default Waveform | Envelope Character |
|---|------|-----------------|-------------------|
| 0 | Lead | Square 50% PWM | Attack 10ms, sustain |
| 1 | Harmony | Square 25% PWM | Softer attack |
| 2 | Bass | Triangle | Slow attack, long sustain |
| 3 | Arp | Sawtooth | Very fast — tight arp steps |
| 4 | Kick | Sine + pitch env | Punch, no sustain |
| 5 | Snare | Noise | Short burst |
| 6 | Hi-hat | Noise | Very short — tick |
| 7 | FX | Square 12.5% PWM | Sweep, no sustain |

---

## Instrument Presets (built-in)

| Key | Label | Waveform | Unison | Filter | Character |
|-----|-------|----------|--------|--------|-----------|
| `piano` | Piano | Triangle | 2v | LP 6kHz | Bright percussive keys |
| `violin` | Violin | Sawtooth | 2v | LP 5kHz | Expressive bowed strings |
| `cello` | Cello | Sawtooth | 2v | LP 3kHz | Deep warm strings |
| `flute` | Flute | Sine | 1v | Off | Airy with tremolo |
| `organ` | Organ | Square | 3v | LP 8kHz | Full drawbar |
| `brass` | Brass | Sawtooth | 2v | LP 2.5kHz | Punchy with filter sweep |
| `harmonica` | Harmonica | Square | 1v | LP 4kHz | Reedy with vibrato |
| `synthLead` | Synth Lead | Square | 4v | LP 4kHz | Fat detuned lead |
| `synthPad` | Synth Pad | Sawtooth | 8v | LP 3.5kHz | Lush evolving pad |
| `synthBass` | Synth Bass | Sawtooth | 2v | LP 1.2kHz | Squelchy acid bass |
| `marimba` | Marimba | Sine | 1v | Off | Woody mallet |
| `electricGuitar` | Elec. Guitar | Square | 3v | LP 3.5kHz | Overdriven crunch |

> Load the `ChiptuneSoundFont` library for 170+ additional presets across 10 categories.

---

## FX Presets

| Name | Distortion | Delay | Reverb | Chorus | Crush |
|------|-----------|-------|--------|--------|-------|
| `clean` | 0% | 0% | 0% | 0% | 16-bit |
| `space` | 0% | 30% | 50% | 20% | 16-bit |
| `echo` | 0% | 50% | 20% | 0% | 16-bit |
| `dirty` | 70% | 0% | 10% | 0% | 12-bit |
| `crush` | 100% | 30% | 0% | 0% | 4-bit |

---

## Game SFX Presets

| Preset | Track | Description |
|--------|-------|-------------|
| `laser` | FX | Fast descending square zap |
| `coin` | Lead | Classic collect-item ding |
| `jump` | Kick | Short pitch-up bloop |
| `explosion` | Snare | Noise burst with slow decay |
| `powerup` | FX | Rising sweep with vibrato |
| `hit` | Snare | Quick damage impact |
| `blip` | Lead | Tiny menu select beep |
| `bass` | Bass | Deep triangle thump |
| `shoot` | FX | Descending pew-pew |
| `1up` | Lead | 3-note extra life arpeggio |

---

## Examples & Demo

- **[Live Demo](https://chiptune-synth.8binami.com/)** — Full synth with keyboard, instruments, MIDI, and visualizer
- **[Getting Started](https://chiptune-synth.8binami.com/examples/getting-started)**
- **[Game SFX](https://chiptune-synth.8binami.com/examples/game-sfx)**
- **[Melodies](https://chiptune-synth.8binami.com/examples/melody)**
- **[Instruments](https://chiptune-synth.8binami.com/examples/instruments)**
- **[Mini Game: Catcher](https://chiptune-synth.8binami.com/examples/mini-game)**
- **[Mini Game: Platformer](https://chiptune-synth.8binami.com/examples/platformer)**
- **[Soundboard](https://chiptune-synth.8binami.com/examples/soundboard)**
- **[Sound Design](https://chiptune-synth.8binami.com/examples/sound-design)**

---

## License

ChiptuneSynth is **proprietary software** developed by [8Binami](https://8binami.com).

| Tier | Revenue | Price |
|------|---------|-------|
| **Free** | Non-commercial + < $25K/year | $0 |
| **Indie Pro** | Up to $100K/year | $149/yr or $299 one-time |
| **Studio** | Up to $1M/year | $499/yr or $999 one-time |
| **Enterprise** | Unlimited | $1,499/yr or custom |

All paid tiers include: attribution removal, unlimited projects, email support, all updates within major version, and full CDN access.

**Free use requires attribution:** `"Audio powered by ChiptuneSynth — 8Binami.com"`

See [LICENSE](LICENSE) for full terms.
Purchase at [8binami.com/pricing](https://8binami.com/pricing) — licensing@8binami.com

---

Built with care by [8Binami](https://8binami.com) · [8BitForge](https://8bitforge.com)
