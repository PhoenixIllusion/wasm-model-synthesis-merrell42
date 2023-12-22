import initWASM from './lib/wasm/Merrel42ModelSynth.wasm.js';
import Merrel42ModelSynth from './lib/wasm/Merrel42ModelSynth.wasm.js';
import { readXML, SavePngData, LoadPngLookupR, makeStrW, XMLReader, LodePNG, IFStream, getU32, readImage, setWASM, readText, registerXMLDoc } from './example.js';
import { ModelType, OverlappingRender, RenderOverlappingTileset, SimpleTileRender, TiledModelRender } from './render.js';
import { populateDropdown, query } from './setup.js';
import { Debug } from './lib/debug-propagator.js';

const sRandSeed = query('seed') || 0;
const sample = await populateDropdown(document.querySelector('select#sample-select')!);
const sampleName = sample.getAttribute('name')!;


//Pre-load files since not yet using Asyncify
if (sample.tagName === 'simpletiled') {
  await readXML(`samples/${sampleName}/data.xml`);
}
if (sample.tagName === 'overlapping') {
  await readImage(`samples/${sampleName}.png`)
}
if (sample.tagName === 'tiledmodel') {
  await readText(`samples/${sampleName}`)
}

const getUrlForLabel = (label: number): {url: string, class: string} => {
  const test = / ?(\d)?\./.exec(LoadPngLookupR[label]!);
  const version = (test && test[1]) || '0';
  const url = LoadPngLookupR[label].replace(/ \d\./g, '.');
  const className = ' tile version-' + version;
  return {url, class: className};
}

const getImageDataForLabel = (label: number): ImageData => {
  return SavePngData[label].data;
}

const debug = new Debug();

initWASM({ XMLReader, IFStream, lodepng: LodePNG, Debug: debug }).then(async function (module: typeof Merrel42ModelSynth) {
  setWASM(module);
  debug.setHeaps(module);

  const timer = new module.Microseconds();
  const sampleEntry = registerXMLDoc(sample);
  const settings = module.Parser.prototype.parse(new module.XMLNode(sampleEntry), timer);

  module.Random.setRandomSeed(sRandSeed);
  settings.useAc4 = false;
  const synth = new module.Synthesizer(settings, timer);

  synth.synthesize(timer);

  const model = new module.Model(synth.getModel());
  const getLabel = (x,y,z) => model.get(x, y, z);

  const [width, height, depth] = getU32(settings.size, 3);
  const size = { width, height, depth};

  const renderGrid = document.getElementById('container') as HTMLDivElement;

  switch(sample.tagName as ModelType) {
    case 'simpletiled':
      SimpleTileRender(renderGrid, size, getLabel, getUrlForLabel);
      break;
    case 'overlapping':
      OverlappingRender(renderGrid, size, getLabel, getImageDataForLabel );
      break;
    case 'tiledmodel':
      TiledModelRender(renderGrid, size, getLabel, (label)=> '');
      break;
  }

  const logDiv = document.createElement('div');
  const hashData = await getSHA(settings, model, [width, height, depth], module);
  const log = `sRand SEED: ${sRandSeed}\nPropagator - ${settings.useAc4 ? 'AC4' : 'AC3'}\n
        SampleName: ${settings.name.c_str()}\nSize: ${width}x${height}x${depth}\n\n
        TileCount: ${settings.numLabels}
        transition: ${hashData.transition}
        model: ${hashData.model}`;

  logDiv.innerText = log;
  document.body.appendChild(logDiv);
  console.log(settings.size.get(0), settings.size.get(1), settings.size.get(2));
  if(sample.tagName === 'overlapping') {
    RenderOverlappingTileset(document.body, settings.numLabels, getImageDataForLabel);
  }
});

function getModelData(model: Merrel42ModelSynth.Model, size: [number, number, number]): Uint32Array {
  const [width, height, depth] = size;
  
  const modelData = new Uint32Array( width * height * depth);
  const xy = width * height;
  for (let z = 0; z < depth; z++)
  for (let y = 0; y < height; y++) {
    let line = [];
    for (let x = 0; x < width; x++) {
      const index = x + width * y + xy * z;
      modelData[index] = model.get(x, y, z);
    }
  }
  return modelData;
}

function getTransitionByteData(numLabels: number, transition: Uint8Array[][]): Uint8Array {
  const transitionData = new Uint8Array( numLabels * numLabels * 3);
    
  let i = 0;
  for(let z = 0; z < 3; z++)
  for(let b = 0; b < numLabels; b++)
  for(let a = 0; a < numLabels; a++)
  transitionData[i++] = transition[z][a][b]? 1 : 0;

  return transitionData;
}

async function getSHA(settings: Merrel42ModelSynth.InputSettings, model: Merrel42ModelSynth.Model, 
        size: [ number, number, number],
        module: typeof Merrel42ModelSynth): Promise<{ model: string, transition: string  }> {
  const hashHex = (array: Uint8Array) => [...array]
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(""); // convert bytes to hex string
  const hashBuffer = async (buffer: ArrayBufferView) => {
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return hashHex(new Uint8Array(hash));
  }
  const decodedTransition = Debug.decodeTransition(module.getPointer(settings.transition), settings. numLabels, module.HEAPU32, module.HEAPU8);
  const transitionHash = await hashBuffer(getTransitionByteData(settings.numLabels, decodedTransition));
  const modelHash = await hashBuffer(getModelData(model, size));
  return { transition: transitionHash, model: modelHash }
}