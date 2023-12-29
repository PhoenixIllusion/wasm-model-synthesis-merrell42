import { readXML } from "@phoenixillusion/wasm-model-synthesis-merrell42"

const url = new URL(location.href);
export const query = (key: string) => {
  const val = url.searchParams.get(key);
  if (val) { return parseInt(val); }
  return 0;
}


export async function populateDropdown(selectElement: HTMLSelectElement): Promise<Element> {
  const sampleIndex = query('sample') || 0;
  const sRandSeed = query('seed') || 0;
  const info = await readXML(`samples.xml`);
  const entries = [...info.children];

  const sampleSelect: HTMLSelectElement = document.querySelector('#sample-select')!;
  entries.forEach((entry: Element, i: number) => {
    const option = document.createElement('option') as HTMLOptionElement;
    option.value = '' + i;
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
    if (entry.tagName === 'tiledmodel') {
      const [width, length, height, blockWidth, blockLength] = ['width', 'length', 'height', 'blockWidth', 'blockLength'].map(a);
      option.innerText = `${entry.tagName} - ${name} - ${width}x${length}x${height} ${blockWidth? `b:${blockWidth}x${blockLength}`: ''}`;
    }
    if (i == sampleIndex) {
      option.selected = true;
      document.title += ': ' + option.innerText;
    }
    sampleSelect.appendChild(option);
  });
  const changeLoc = (value: string|number) => location.href = window.location.pathname+'?sample=' + value + '&seed=' + sRandSeed + (query('loop')?'&loop=1':'');
  sampleSelect.onchange = () => changeLoc(sampleSelect.value)
  document.querySelector('#next')!.addEventListener('click', () => {changeLoc(parseInt(sampleSelect.value,10) + 1);})
  document.querySelector('#prev')!.addEventListener('click', () => {changeLoc(parseInt(sampleSelect.value,10) - 1);})
  return entries[sampleIndex];
}

type TestHash = { model: string, transition: string  };
type TestDataStore = { [seed: number]: {[testNum: number]: { model: string, transition: string  }}};

export function loadTestHashes(seed: number, testID: number): TestHash {
  const store = JSON.parse(localStorage.getItem('Merrel42ModelSynth')||'{}') as TestDataStore;
  store[seed] = store[seed]||{};
  return store[seed][testID]
}

export function saveTestHashes(seed: number, testID: number, hashData: TestHash) {
  const store = JSON.parse(localStorage.getItem('Merrel42ModelSynth')||'{}') as TestDataStore;
  store[seed] = store[seed]||{};
  store[seed][testID] = hashData;
  localStorage.setItem('Merrel42ModelSynth', JSON.stringify(store));
}