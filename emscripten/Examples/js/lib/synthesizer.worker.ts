import { Synthesizer } from '@phoenixillusion/wasm-model-synthesis-merrell42/synthesizer'
//import { CppPropagator } from './propagator-cpp';
import type { WorkerRequest, WorkerResponse } from '@phoenixillusion/wasm-model-synthesis-merrell42/worker'

self.onmessage = async (e) => {
  const { settings, wasmURL} = e.data as WorkerRequest;
  const synth = new Synthesizer(settings, wasmURL);
  //const synth = new Synthesizer(settings, wasmURL, CppPropagator.create);

  const _startTime = performance.now();
  await synth.synthesize();
  const time = performance.now() - _startTime;
  
  const output = synth.getModel();
  const hashes = await synth.getSHA();

  const response: WorkerResponse = { output: output.buffer, hashes, time };
  postMessage(response, { transfer: [output.buffer] });
}
