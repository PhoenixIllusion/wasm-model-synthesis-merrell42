import { InputSetting } from './input-settings'
import { Synthesizer } from './synthesizer';


self.onmessage = async (e) => {
  const settings = e.data as InputSetting;
  const synth = new Synthesizer(settings);

  const _startTime = performance.now();
  await synth.synthesize();
  const time = performance.now() - _startTime;
  
  const output = synth.getModel();
  const hashes = await synth.getSHA();

  postMessage({ output: output.buffer, hashes, time }, { transfer: [output.buffer] });
}
