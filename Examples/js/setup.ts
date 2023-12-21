import { readXML } from "./lib/xml-util";

const url = new URL(location.href);
export const query = (key) => {
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
  sampleSelect.onchange = () => location.href = window.location.pathname+'?sample=' + sampleSelect.value + '&seed=' + sRandSeed;
  return entries[sampleIndex];
}