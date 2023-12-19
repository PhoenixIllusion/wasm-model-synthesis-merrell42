import Merrel42ModelSynth from './Merrel42ModelSynth.wasm'
import { NativeInputSetting, createInputSettings, getU32, setWASM } from '../../src/native-input'



self.onmessage = async (e) => {
  const settings = e.data as NativeInputSetting;
  const module = await Merrel42ModelSynth();
  setWASM(module);
  module.Random.setRandomSeed(settings.seed);
  const timer = new module.Microseconds();

  const inputSettings = createInputSettings(settings);

  const synth = new module.Synthesizer(inputSettings, timer);

  synth.synthesize(timer);

  const model = new module.Model(synth.getModel());
  const [width, height, depth] = getU32(inputSettings.size, 3);

  const output = new Uint32Array(width * height * depth);
  for (let z = 0; z < depth; z++)
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        output[x + y * width + z * width * height] = model.get(x, y, z);

  postMessage({ width, height, depth, output: output.buffer }, { transfer: [output.buffer] });
}
