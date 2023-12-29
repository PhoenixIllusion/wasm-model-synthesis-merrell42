import type { InputSetting } from './input-settings'
import { Synthesizer } from './synthesizer';

export interface WorkerRequest {
  settings: InputSetting;
  wasmURL: string;
}; 
export interface WorkerResponse {
  output: ArrayBuffer;
  hashes: { model: string, transition: string};
  time: number;
};

export interface WorkerEvent {
  data: WorkerResponse;
}


self.onmessage = async (e) => {
  const { settings, wasmURL } = e.data as WorkerRequest;
  const synth = new Synthesizer(settings, wasmURL);

  const _startTime = performance.now();
  await synth.synthesize();
  const time = performance.now() - _startTime;
  
  const output = synth.getModel();
  const hashes = await synth.getSHA();

  const response: WorkerResponse = { output: output.buffer, hashes, time };
  postMessage(response, { transfer: [output.buffer] });
}
