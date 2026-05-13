/**
 * BitcrusherProcessor — AudioWorklet
 * ChiptuneSynth v3.1.0
 * Replaces deprecated ScriptProcessorNode
 *
 * Parameters:
 *   bits      — bit depth (4–16), default 8
 *   normFreq  — normalized downsample frequency (0–1), default 1 (no reduction)
 */
class BitcrusherProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'bits',     defaultValue: 8,   minValue: 1,  maxValue: 16, automationRate: 'k-rate' },
            { name: 'normFreq', defaultValue: 1.0, minValue: 0.001, maxValue: 1.0, automationRate: 'k-rate' }
        ];
    }

    constructor() {
        super();
        this._phase = 0;
        this._lastSampleL = 0;
        this._lastSampleR = 0;
    }

    process(inputs, outputs, parameters) {
        const input  = inputs[0];
        const output = outputs[0];
        if (!input || !input[0]) return true;

        const bits     = parameters['bits'][0];
        const normFreq = parameters['normFreq'][0];
        const step     = Math.pow(0.5, bits - 1);   // quantization step size
        const phaseInc = normFreq;                   // phase increment per sample

        const inL  = input[0];
        const inR  = input.length > 1 ? input[1] : input[0];
        const outL = output[0];
        const outR = output.length > 1 ? output[1] : output[0];

        for (let i = 0; i < inL.length; i++) {
            this._phase += phaseInc;
            if (this._phase >= 1.0) {
                this._phase -= 1.0;
                // Quantize: floor to nearest step
                this._lastSampleL = step * Math.floor(inL[i] / step + 0.5);
                this._lastSampleR = step * Math.floor(inR[i] / step + 0.5);
            }
            outL[i] = this._lastSampleL;
            if (outR) outR[i] = this._lastSampleR;
        }

        return true;
    }
}

registerProcessor('bitcrusher-processor', BitcrusherProcessor);
