import { NativeInputSetting } from './lib/native-input'
import { Synthesizer } from './lib/synthesizer';


self.onmessage = async (e) => {
  const settings = e.data as NativeInputSetting;
  const synth = new Synthesizer(settings);

  const _startTime = performance.now();
  await synth.synthesize();
  const time = performance.now() - _startTime;
  
  const [width, height, depth] = settings.size;
  const output = synth.getModel();
  const hashes = await synth.getSHA();

  postMessage({ width, height, depth, output: output.buffer, hashes, time }, { transfer: [output.buffer] });
}
