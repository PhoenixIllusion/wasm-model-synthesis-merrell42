import Merrel42ModelSynth from './Merrel42ModelSynth.wasm'
import { NativeInputSetting, createInputSettings, getU32 } from '../../src/native-input'
import { Synthesizer, setWASM } from '../../src/synthesizer';



self.onmessage = async (e) => {
  const settings = e.data as NativeInputSetting;
  const module = await Merrel42ModelSynth();
  setWASM(module);
  module.Random.setRandomSeed(settings.seed);

  const synth = new Synthesizer(settings);

  synth.synthesize();
  
  const [width, height, depth] = settings.size;
  const output = synth.getModel();

  postMessage({ width, height, depth, output: output.buffer }, { transfer: [output.buffer] });
}
