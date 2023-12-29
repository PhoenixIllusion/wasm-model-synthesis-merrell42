
import { parseInput, getOverlapTileForLabel, getTileForLabel } from '@phoenixillusion/wasm-model-synthesis-merrell42';
import type { WorkerEvent } from '@phoenixillusion/wasm-model-synthesis-merrell42/worker';
import WasmURL from '@phoenixillusion/wasm-model-synthesis-merrell42/wasm?url'
import SynthesizerWorker from './lib/synthesizer.worker?worker';
import { ModelType, OverlappingRender, RenderOverlappingTileset, SimpleTileRender, TiledModelRender } from './render';
import { loadTestHashes, populateDropdown, query } from './setup';

const sRandSeed = query('seed') || 0;
const sampleId = query('sample') || 0;
const sample = await populateDropdown(document.querySelector('select#sample-select')!);
const sampleName = sample.getAttribute('name')!;

const getUrlForLabel = (label: number): {url: string, class: string} => {
  const tile = getTileForLabel(label);
  const url = `samples/${sampleName}/${tile.path}.png`;
  const className = 'tile version-' + tile.version;
  return {url, class: className};
}
const getImageDataForLabel = (label: number): ImageData => {
  return getOverlapTileForLabel(label);
}

const run = async () => {

  const settings = await parseInput(sample, true);
  settings.useAc4 = true;
  settings.seed = sRandSeed;
  const [ width, height, depth ] = settings.size;

  const worker = new SynthesizerWorker();
  worker.postMessage({ settings, wasmURL: WasmURL });
  const data = await new Promise(resolve => {
    worker.onmessage = (ev: WorkerEvent) => {
      resolve(ev.data);
    }
  });
  const { output, hashes, time } = data as {
    width: number, height: number, depth: number,
    output: ArrayBuffer, time: number,
    hashes: { transition: string, model: string  } };
  const model = new Uint32Array(output);
  const getLabel = (x: number,y: number,z: number) => model[x + y * width + z * width * height];;

  const size = { width, height, depth};
  const renderGrid = document.getElementById('container') as HTMLDivElement;

  
  switch(sample.tagName as ModelType) {
    case 'simpletiled':
      SimpleTileRender(renderGrid, size, getLabel, getUrlForLabel)
      break;
    case 'overlapping':
      OverlappingRender(renderGrid, size, getLabel, getImageDataForLabel )
      break;
    case 'tiledmodel':
      TiledModelRender(renderGrid, size, getLabel, (_label: number)=> '');
      break;
  }

  const logDiv = document.createElement('div');
  const log = `sRand SEED: ${sRandSeed}\nPropagator - ${settings.useAc4 ? 'AC4' : 'AC3'}\n
        Time: ${time.toFixed(2)} ms
        SampleName: ${sampleName}\nSize: ${width}x${height}x${depth}\n
        TileCount: ${settings.numLabels}
        transition: ${hashes.transition}
        model: ${hashes.model}`;
  logDiv.innerText = log;
  document.body.appendChild(logDiv);

  const testHashes = loadTestHashes(sRandSeed, sampleId);
  if(testHashes) {
    const hashTestOutput = document.createElement('div');
    hashTestOutput.innerText = `
      Ground Truth Hash:
      transition: ${testHashes.transition}
      model: ${testHashes.model}`;
    document.body.appendChild(hashTestOutput);
    hashTestOutput.style.color = (testHashes.model == hashes.model && testHashes.transition == hashes.transition)? 'darkgreen': 'red';
    hashTestOutput.style.fontWeight = 'bold';
  }

  if(sample.tagName === 'overlapping') {
    RenderOverlappingTileset(document.body, settings.numLabels, getImageDataForLabel);
  }
}

run();