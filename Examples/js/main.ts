import { readXML } from '../../src/xml-util';
import { getTileForLabel } from '../../src/parse-simpletiled';
import { parseInput } from '../../src/parse-input';
import { getOverlapTileForLabel } from '../../src/parse-overlapping';

import SynthesizerWorker from './synthesizer.worker?worker';
import { ModelType, OverlappingRender, SimpleTileRender, TiledModelRender } from './render';
import { populateDropdown, query } from './setup';

const sRandSeed = query('seed') || 0;
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
  settings.seed = sRandSeed;

  const worker = new SynthesizerWorker();
  worker.postMessage(settings);
  const data = await new Promise(resolve => {
    worker.onmessage = (ev) => {
      resolve(ev.data);
    }
  });
  const { width, height, depth, output } = data as { width: number, height: number, depth: number, output: ArrayBuffer };
  const model = new Uint32Array(output);
  const getLabel = (x,y,z) => model[x + y * width + z * width * height];;

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
      TiledModelRender(renderGrid, size, getLabel, (label)=> '');
      break;
  }

  const logDiv = document.createElement('div');
  const log = `sRand SEED: ${sRandSeed}\nPropagator - ${settings.useAc4 ? 'AC4' : 'AC3'}\n
        SampleName: ${sampleName}\nSize: ${width}x${height}x${depth}\n\n
        TileCount: ${settings.numLabels} `;
  logDiv.innerText = log;
  document.body.appendChild(logDiv);
}

run();