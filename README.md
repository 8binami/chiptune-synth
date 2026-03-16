# ChiptuneSynth

**Retro game audio in 3 lines of code.**

[![npm](https://img.shields.io/npm/v/@8bitforge/chiptune-synth?color=00f0ff&style=flat-square)](https://www.npmjs.com/package/@8bitforge/chiptune-synth)
[![license](https://img.shields.io/badge/license-dual-a855f7?style=flat-square)](#license)
[![size](https://img.shields.io/badge/size-~15KB-green?style=flat-square)](#)
[![deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](#)

A zero-dependency Web Audio synthesizer with serious chiptune capabilities. 4 tracks, 12 instrument presets, 10 game SFX presets, unison voices, 3 LFOs, per-track filters, pitch bend, glide, and full MIDI controller support. Works in any browser.

```js
const synth = new ChiptuneSynth();
await synth.init();
synth.playPreset('coin');  // ding!
```

## Features

- **4 Tracks** — Lead (square), Bass (triangle), Drums (noise/sine), FX (sawtooth)
- **12 Instrument Presets** — Piano, Violin, Cello, Flute, Organ, Brass, Harmonica, Synth Lead, Synth Pad, Synth Bass, Marimba, Electric Guitar
- **10 Game SFX Presets** — laser, coin, jump, explosion, powerup, hit, blip, bass, shoot, 1up
- **5 Waveforms** — Square (PWM), Triangle, Sawtooth, Sine, Noise
- **ADSR Envelopes** — Per-track attack, decay, sustain, release
- **Unison Voices** — 1-16 voices per track with detune & stereo spread
- **3 LFOs per Track** — Filter LFO, tremolo LFO, vibrato
- **Per-track Filters** — Lowpass/highpass/bandpass with cutoff, resonance, key tracking, and filter envelope
- **Glide / Portamento** — Smooth pitch transitions between notes
- **Pitch Bend & Mod Wheel** — Real-time performance controls
- **MIDI Controller Support** — Plug in your MIDI keyboard and play (Web MIDI API)
- **Waveform Visualization** — Analyser data for canvas rendering
- **Zero Dependencies** — Pure Web Audio API, ~15KB
- **Universal** — UMD module (Node.js, AMD, browser global)

## Install

**npm:**
```bash
npm install @8bitforge/chiptune-synth
```

**CDN:**
```html
<script src="https://unpkg.com/@8bitforge/chiptune-synth"></script>
```

**Direct:**
```html
<script src="path/to/chiptune-synth.js"></script>
```

**ES Module / CommonJS:**
```js
import ChiptuneSynth from '@8bitforge/chiptune-synth';
// or
const ChiptuneSynth = require('@8bitforge/chiptune-synth');
```

## Quick Start

### Play a game SFX
```js
const synth = new ChiptuneSynth();
await synth.init();
synth.playPreset('laser');
```

### Load an instrument and play notes
```js
synth.loadInstrument('violin', 0);  // Load violin on track 0
synth.playNoteByName('A', 4, 0, 1.5);  // Play A4 for 1.5s
```

### Enable MIDI controller
```js
const devices = await synth.enableMIDI({
    track: 0,
    onConnect: (name) => console.log('Connected:', name),
    onNoteOn: (note, vel) => console.log('Note on:', note)
});
```

## API Reference

### Lifecycle

| Method | Description |
|--------|-------------|
| `new ChiptuneSynth()` | Create a synth instance |
| `synth.init()` | Initialize audio engine (async, call after user gesture) |
| `synth.dispose()` | Release all audio resources |
| `synth.resetToDefaults()` | Reset all tracks to factory settings |

### Playing Notes

| Method | Description |
|--------|-------------|
| `synth.playNote(freq, track, duration?, startTime?)` | Play a note by frequency (Hz). Returns `noteId` |
| `synth.playNoteByName(note, octave, track, duration?)` | Play by name (e.g. `'C#'`, `5`). Returns `noteId` |
| `synth.stopNote(noteId)` | Stop a sustained note |
| `synth.stopAllNotes()` | Emergency stop |

> **Sustained notes:** Pass `duration >= 10` to hold a note indefinitely. Stop it later with `stopNote(noteId)`.

### SFX Presets

| Method | Description |
|--------|-------------|
| `synth.playPreset(name)` | Load preset + play it in one call |
| `synth.loadPreset(name)` | Load preset config without playing |
| `ChiptuneSynth.getPresetNames()` | Get array of all preset names |

### Instrument Presets

| Method | Description |
|--------|-------------|
| `synth.loadInstrument(name, trackIndex)` | Load an instrument preset onto a track |
| `ChiptuneSynth.getInstrumentNames()` | Get array of all instrument names |
| `ChiptuneSynth.getInstruments()` | Get full instrument definitions object |

### MIDI

| Method | Description |
|--------|-------------|
| `synth.enableMIDI(options?)` | Enable MIDI input. Returns `Promise<string[]>` (device names) |
| `synth.disableMIDI()` | Disconnect all MIDI inputs |
| `synth.setMIDITrack(trackIndex)` | Change which track MIDI controls |
| `synth.setMIDIChannel(ch)` | Set MIDI channel filter (0-15, default 0) |
| `synth.isMIDIEnabled()` | Check if MIDI is active |

**`enableMIDI` options:**

```js
synth.enableMIDI({
    track: 0,         // Target track index (default: 0)
    channel: 0,       // MIDI channel 0-15 (default: 0)
    onConnect: (name) => {},     // Device connected
    onDisconnect: (name) => {},  // Device disconnected
    onNoteOn: (note, velocity, channel) => {},
    onNoteOff: (note, channel) => {},
    onCC: (cc, value, channel) => {}
});
```

**Supported MIDI messages:**
- Note On / Note Off (velocity-sensitive)
- CC1 — Mod Wheel (adds vibrato depth)
- CC7 — Volume
- CC64 — Sustain pedal
- CC120 — All Sound Off
- CC123 — All Notes Off
- Pitch Bend (±1 semitone range)

> **Auto-init:** The AudioContext initializes automatically on the first MIDI note, no need to call `init()` separately when using MIDI.

### Configuration

| Method | Description |
|--------|-------------|
| `synth.updateTrack(i, settings)` | Merge partial settings into track config |
| `synth.updateEnvelope(i, env)` | Merge partial ADSR into envelope |
| `synth.updateVibrato(i, vib)` | Update vibrato `{ rate, depth }` |
| `synth.setMasterVolume(vol)` | Set master volume (0-1) |
| `synth.getMasterVolume()` | Get current master volume |
| `synth.getWaveformData()` | Get `Uint8Array` waveform for visualization |

**Track properties:** `type`, `volume`, `dutyCycle`, `pitchEnv`, `glide`, `detune`

**Modulation properties (via `updateTrack`):**
- `unisonVoices`, `unisonDetune`, `unisonSpread`
- `filterEnabled`, `filterType`, `filterCutoff`, `filterQ`, `filterKeyTrack`
- `filterEnvAmount`, `filterEnvAttack`, `filterEnvRelease`
- `lfoFilterRate`, `lfoFilterDepth`, `tremoloRate`, `tremoloDepth`

**Envelope properties:** `attack`, `decay`, `sustain`, `release`

### Static Utilities

| Method | Description |
|--------|-------------|
| `ChiptuneSynth.noteToFrequency(note, octave)` | `'A', 4` &rarr; `440` |
| `ChiptuneSynth.midiToFrequency(midi)` | `69` &rarr; `440` |
| `ChiptuneSynth.frequencyToMidi(freq)` | `440` &rarr; `69` |
| `ChiptuneSynth.TRACK_NAMES` | `['Lead', 'Bass', 'Drums', 'FX']` |

## Tracks

| # | Name | Default Waveform | Default Volume |
|---|------|-----------------|----------------|
| 0 | Lead | Square (50% duty) | 0.30 |
| 1 | Bass | Triangle | 0.40 |
| 2 | Drums | Noise | 0.50 |
| 3 | FX | Sawtooth | 0.25 |

## Instrument Presets

| Instrument | Waveform | Unison | Filter | Character |
|------------|----------|--------|--------|-----------|
| `piano` | Triangle | 2 voices | LP 6kHz | Bright percussive keys |
| `violin` | Sawtooth | 2 voices | LP 5kHz | Expressive bowed strings |
| `cello` | Sawtooth | 2 voices | LP 3kHz | Deep warm strings |
| `flute` | Sine | 1 voice | Off | Airy with tremolo |
| `organ` | Square | 3 voices | LP 8kHz | Full drawbar sound |
| `brass` | Sawtooth | 2 voices | LP 2.5kHz | Punchy with filter sweep |
| `harmonica` | Square | 1 voice | LP 4kHz | Reedy vibrato tone |
| `synthLead` | Square | 4 voices | LP 4kHz | Fat detuned lead |
| `synthPad` | Sawtooth | 8 voices | LP 3.5kHz | Lush evolving pad |
| `synthBass` | Sawtooth | 2 voices | LP 1.2kHz | Squelchy acid bass |
| `marimba` | Sine | 1 voice | Off | Woody percussive mallet |
| `electricGuitar` | Square | 3 voices | LP 3.5kHz | Overdriven crunch |

## Game SFX Presets

| Preset | Track | Description |
|--------|-------|-------------|
| `laser` | FX | Fast descending square zap |
| `coin` | Lead | Classic collect-item ding |
| `jump` | Drums | Short pitch-up bloop |
| `explosion` | Drums | Noise burst with slow decay |
| `powerup` | FX | Rising sweep with vibrato |
| `hit` | Drums | Quick damage impact |
| `blip` | Lead | Tiny menu select beep |
| `bass` | Bass | Deep triangle thump |
| `shoot` | FX | Pew-pew descending shot |
| `1up` | Lead | 3-note extra life arpeggio |

## Examples

- **[Interactive Demo](https://chiptune-synth.8binami.com/)** — Full synth with piano keyboard, instruments, MIDI, and waveform visualizer
- **[Getting Started](https://chiptune-synth.8binami.com/examples/getting-started)** — Step-by-step tutorial with runnable code snippets
- **[Basic](https://chiptune-synth.8binami.com/examples/basic)** — Waveforms, chords, unison voices, and LFOs
- **[Game SFX](https://chiptune-synth.8binami.com/examples/game-sfx)** — All 10 SFX presets as clickable cards
- **[Melodies](https://chiptune-synth.8binami.com/examples/melody)** — 4 playable songs with multi-track arrangements
- **[Instruments](https://chiptune-synth.8binami.com/examples/instruments)** — 12 instrument presets with keyboard, MIDI, and musical demos
- **[Mini Game: Catcher](https://chiptune-synth.8binami.com/examples/mini-game)** — Coin-catcher game with real-time SFX
- **[Mini Game: Platformer](https://chiptune-synth.8binami.com/examples/platformer)** — Mario-style platformer with jump, coins, enemies
- **[Soundboard](https://chiptune-synth.8binami.com/examples/soundboard)** — Tap pads with keyboard shortcuts + build custom sounds
- **[Sound Design](https://chiptune-synth.8binami.com/examples/sound-design)** — Real-time parameter tweaking with waveform + FFT visualization
- **[API Docs](https://chiptune-synth.8binami.com/examples/docs)** — Full technical documentation

## Want More?

ChiptuneSynth Free is great for games, prototypes, and creative projects. Need a full DAW-grade audio engine?

| Feature | Free | 8BitForge Pro |
|---------|:----:|:-------------:|
| Tracks | 4 | 8 |
| Instrument Presets | 12 | Unlimited |
| SFX Presets | 10 | Unlimited |
| Unison Voices (1-16) | &check; | &check; |
| Per-track Filters & LFOs | &check; | &check; |
| Glide / Portamento | &check; | &check; |
| Pitch Bend / Mod Wheel | &check; | &check; |
| MIDI Controller Support | &check; | &check; |
| Mixer (EQ, Pan, Solo/Mute) | &mdash; | &check; |
| Effects (Delay, Reverb, Chorus) | &mdash; | &check; |
| FFT Analyser / Per-track Metering | &mdash; | &check; |
| Mastering Engine (Compressor, Limiter) | &mdash; | &check; |
| Export (WAV, MP3, OGG) | &mdash; | &check; |

**[Get 8BitForge Pro &rarr;](https://8bitforge.com)**

## License

ChiptuneSynth uses a **dual license**:

- **Non-Commercial** — Free for personal projects, education, open-source, and game jams. Attribution required.
- **Commercial** — Any project generating revenue requires a [commercial license](https://8bitforge.com/pricing).

See [LICENSE](LICENSE) for full terms.

---

Built with care by [8Binami](https://8binami.com)
