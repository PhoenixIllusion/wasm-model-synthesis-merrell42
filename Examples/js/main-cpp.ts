import initWASM from './Merrel42ModelSynth.wasm.js';
import Merrel42ModelSynth from './Merrel42ModelSynth.wasm.js';
import { readXML, SavePngData, LoadPngLookupR, makeStrW, XMLReader, LodePNG, IFStream, getU32, readImage, setWASM } from './example.js';

const url = new URL(location.href);
const query = (key) => {
  const val = url.searchParams.get(key);
  if (val) { return parseInt(val); }
  return 0;
}

//Pre-load files since not yet using Asyncify
const sampleIndex = query('sample') || 0;
const sRandSeed = query('seed') || 0;
const info = await readXML(`samples.xml`);
const entries = [...info.children];
const sample = entries[sampleIndex];

const sampleSelect: HTMLSelectElement = document.querySelector('#sample-select')!;
entries.forEach((entry: Element, i: number) => {
  const option = document.createElement('option') as HTMLOptionElement;
  option.value = ''+i;
  const a = x => entry.getAttribute(x);
  const [name, subset, width, height, periodic] = [
    'name', 'subset', 'width', 'height', 'periodic'
  ].map(a);
  if (entry.tagName === 'simpletiled') {
    option.innerText = `${entry.tagName} - ${name}${subset ? `[${subset}]` : ''} - ${width}x${height} ${periodic ? '- per' : ''}`;
  }
  if (entry.tagName === 'overlapping') {
    const [N, symmetry, periodicInput] = ['N', 'symmetry', 'periodicInput'].map(a);
    option.innerText = `${entry.tagName} - ${name} - N${N} ${symmetry ? ' - sym:' + symmetry : ''} - ${width || 48}x${height || 48} ${periodicInput ? '- perI ' : ''} ${periodic ? '- per ' : ''}`;
  }
  if (i == sampleIndex) {
    option.selected = true;
    document.title += ': ' + option.innerText;
  }
  sampleSelect.appendChild(option);
});
sampleSelect.onchange = () => location.href = 'index.html?sample=' + sampleSelect.value + '&seed=' + sRandSeed;
if (sample.tagName === 'simpletiled') {
  await readXML(`samples/${entries[sampleIndex].getAttribute('name')}/data.xml`);
}
if (sample.tagName === 'overlapping') {
  await readImage(`samples/${entries[sampleIndex].getAttribute('name')}.png`)
}

const createTile = (label: number): HTMLImageElement => {
  const img = new Image();
  const test = / ?(\d)?\./.exec(LoadPngLookupR[label]!);
  const version = (test && test[1]) || '0';
  const url = LoadPngLookupR[label].replace(/ \d\./g, '.');
  img.src = url;
  img.className += ' tile version-' + version;
  return img;
}
const drawTile = (ctx: CanvasRenderingContext2D, label: number, x: number, y: number): void => {
  const imgData = SavePngData[label].data;
  ctx.putImageData(imgData, x, y);
}

initWASM({ XMLReader, IFStream, lodepng: LodePNG }).then(async function (module: typeof Merrel42ModelSynth) {
  setWASM(module);

  module.Parser.prototype.readXML(makeStrW('samples.xml'));
  const timer = new module.Microseconds();

  const settings = module.Parser.prototype.parse(new module.XMLNode(XMLReader.getChildNodeN(1, sampleIndex)!), timer);

  module.Parser.prototype.setRandomSeed(sRandSeed);
  settings.useAc4 = true;
  const synth = new module.Synthesizer(settings, timer);

  synth.synthesize(timer);

  const model = new module.Model(synth.getModel());
  const [width, height, depth] = getU32(settings.size, 3);

  const renderGrid = document.getElementById('container') as HTMLDivElement;
  renderGrid.innerHTML = '';
  if (sample.tagName === 'simpletiled') {
    renderGrid.style.gridTemplateColumns = `repeat(${width},1fr)`;
  }
  let ctx: CanvasRenderingContext2D|undefined = undefined;
  if (sample.tagName === 'overlapping') {
    const canvas = document.createElement('canvas');
    renderGrid.appendChild(canvas);
    canvas.className = 'overlapping';
    canvas.style.width = 16 * width + 'px';
    canvas.style.width = 16 * height + 'px';
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d')!;
  }
  for (let z = 0; z < depth; z++)
    for (let y = 0; y < height; y++) {
      let line = [];
      for (let x = 0; x < width; x++) {
        const label = model.get(x, y, z);
        if (sample.tagName === 'simpletiled') {
          renderGrid.appendChild(createTile(label));
        }
        if (sample.tagName === 'overlapping' && ctx) {
          drawTile(ctx, label, x, y);
        }
      }
    }
  const logDiv = document.createElement('div');
  const log = `sRand SEED: ${sRandSeed}\nPropagator - ${settings.useAc4 ? 'AC4' : 'AC3'}\n
        SampleName: ${settings.name.c_str()}\nSize: ${width}x${height}x${depth}\n\n
        TileCount: ${settings.numLabels}`;
  logDiv.innerText = log;
  document.body.appendChild(logDiv);
  console.log(settings.size.get(0), settings.size.get(1), settings.size.get(2))
});