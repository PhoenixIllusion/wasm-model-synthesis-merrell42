import Merrel42ModelSynth from '../../dist/Merrel42ModelSynth.wasm'
let module!: typeof Merrel42ModelSynth;

export function setWASM(_module: typeof Merrel42ModelSynth) {
  module = _module;
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();
function getStrW(idx: number) {
  const start = idx;
  const str: number[] = [];
  let char: number;
  while((char = module.HEAP8[idx]) != 0 && idx-start < 1024) {str.push(char); idx+=4;};
  return decoder.decode(new Uint8Array(str));
}
function getStr(idx: number): string {
  let start = idx;
  const str: number[] = [];
  let char: number;
  while((char = module.HEAPU8[idx]) != 0 && idx-start < 1024) {str.push(char); idx++;};
  return decoder.decode(new Uint8Array(str));
}
function makeCString(str: string): number {
  return module.getPointer(new module.CString(str, str.length));
}

export function makeStrW(str: string): number {
  const bytes = encoder.encode(str);
  const ref = module['_webidl_malloc'](bytes.length * 4 + 1);
  const arr = module.HEAPU8.subarray(ref, ref+bytes.length*4);
  for(let i=0;i<str.length;i++){
    arr[i*4] = bytes[i];
  }
  return ref;
}
function makeRawString(str: string): number {
  return module.getPointer(new module.CString(str, str.length).c_str());
}

function createU32(size: number, value: number[]): number {
  const ref = module['_webidl_malloc'](size * 4);
  module.HEAPU32.set(value, ref/4);
  return ref;
}

function setU32(ref: number|any, value: number[]): void {
  if(typeof ref == 'object') {
    ref = module.getPointer(ref);
  }
  module.HEAPU32.set(value, ref/4);
}
export function getU32(ref: number|any, len: number): Uint32Array {
  if(typeof ref == 'object') {
    ref = module.getPointer(ref);
  }
  return module.HEAPU32.subarray(ref/4, ref/4 + len);
}


const parser = new DOMParser();
const docCache: {
  [key: string]: Element
} = {}
export const readXML = (path: string): Promise<Element>|Element => {
  if(docCache[path]) {
    return docCache[path];
  }
  return fetch(path).then(res => res.text()).then(text => parser.parseFromString(text,'text/xml')).then(doc => {
    const ret = doc.children[0];
    docCache[path] = ret;
    return ret;
  });
}

const xmlNodeLookup: {
  [key: number]: {
    node: Element;
    nodeId: number;
    path?: string;
    element?: string;
  }
} = {};
let xmlNodeId = 1;
const addNode = (node: Element): number => {
  if(!node) {
    throw Error('Failed to find node');
  }
  const ref = { node, nodeId: xmlNodeId++ };
  xmlNodeLookup[ref.nodeId] = ref;
  return ref.nodeId;
}
export const XMLReader = {
    openFileHelper: (path: string, element: string) => {
      path = path && getStrW(path as any as number);
      element = element && getStrW(element as any as number);
      const node = {path, element, nodeId: xmlNodeId++, node: readXML(path) as Element};
      xmlNodeLookup[node.nodeId] = node;
      return node.nodeId;
    },
    getChildNodeN: (id: number, index: number) => {
      const node = xmlNodeLookup[id].node;
      if(node.children[index]) {
        return addNode(node.children[index]);
      }
    },
    getChildNodeC: (id: number, name: string, index: number) => {
      name = getStrW(name as any as number);
      const node = xmlNodeLookup[id].node;
      const children = node.querySelectorAll(name);
      if(children[index]) {
        return addNode(children[index]);
      }
      debugger;
      return 0;
    },
    getChildNodeCR: (id: number, name: string, ref: number) => {
      const tag = getStrW(name as any as number);
      const node = xmlNodeLookup[id].node;
      if(ref == 0) {
        return addNode(node.querySelector(tag)!);
      }
      debugger;

    },
    getChildNodeWithAttribute: (id: number, tagName: string, attributeN: string, attributeV?: string) => {
      tagName = getStrW(tagName as any as number);
      attributeN = getStrW(attributeN as any as number);
      attributeV = attributeV && getStrW(attributeV as any as number);
      const node = xmlNodeLookup[id].node;
      let query = `${tagName}[${attributeN}${attributeV?'="'+attributeV+'"':''}]`;
      return addNode(node.querySelector(query)!);
    },
    getAttributeStr: (id: number, name: string): number => {
      name = getStrW(name as any as number);
      const node = xmlNodeLookup[id].node;
      const val = node.getAttribute(name);
      if(val) {
        return makeCString(val);
      }
      return makeCString('');
    },
    nChildNode: (id: number, name: string): number => {
      name = getStrW(name as any as number);
      const node = xmlNodeLookup[id].node;
      const count = node.querySelectorAll(name).length;
      return count;
    },
    getNameStr: (id: number): number => {
      const node = xmlNodeLookup[id].node;
      const val = node.tagName;
      if(val) {
        return makeCString(val);
      }
      return makeCString('');
    }
  }

  const streamLookup = {};
  let streamId = 1;
export const IFStream = {
    constructor: (url: string, _flag: number) => {
      url = getStr(url as any as number);
      debugger;
    },
    exists: (url: string): boolean => {
      url = getStr(url as any as number);
      return true;
    },
    getline: (_id: number, _buffer: Merrel42ModelSynth.CharRef, _len: number) => {
      debugger;
    },
    rdbuf: (_id: number) => {
      debugger;
    }
  }

  let LoadPngId = 0;
  export const LoadPngLookupR: { [key: number]: string} = {

  }
  const LoadPngLookup: { [key: string]: number} = {

  }
  const LoadPngData: { [key: string]: ImageData } = {

  }
  let SavePngId = 0;
  export const SavePngData: { [key: number]: { path: string, data: ImageData }} = {

  }

  const tmpCanvas = document.createElement('canvas');
  export const readImage = (path: string): ImageData|Promise<ImageData> => {
    if(LoadPngData[path]) {
      return LoadPngData[path];
    }
    return new Promise<ImageData>(resolve => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        tmpCanvas.width = img.width;
        tmpCanvas.height = img.height;
        const ctx = tmpCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        LoadPngData[path] = ctx.getImageData(0,0,img.width, img.height);
        resolve(LoadPngData[path]);
      };
    })
  }

export const LodePNG = {
    error_text: (code: number): number => {
      return makeRawString('Error '+code);
    },
    load_file: (buffer: Merrel42ModelSynth.VectorChar, path: string): number => {
      path = module.wrapPointer(path as any as number, module.CString).c_str();

      buffer = module.wrapPointer(buffer as any as number, module.VectorChar);
      buffer.resize(4);
      const rawData = module.HEAPU32[module.getPointer(buffer.data())/4];
      module.HEAPU32.subarray(rawData, rawData + 1)[0] = LoadPngId;
      if(!LoadPngLookup[path]) {
        LoadPngLookup[path] = LoadPngId;
        LoadPngLookupR[LoadPngId++] = path;
      }

      return 0;
    },
    decode: (outVecC: Merrel42ModelSynth.VectorChar, wRef: number, hRef: number, _stateRef: number, inVecC: Merrel42ModelSynth.VectorChar): number => {
      outVecC = module.wrapPointer(outVecC as any as number, module.VectorChar);
      inVecC = module.wrapPointer(inVecC as any as number, module.VectorChar);
      const rawInData = module.HEAPU32[module.getPointer(inVecC.data())/4];
      const inImageId = module.HEAPU32.subarray(rawInData, rawInData + 1)[0];
      const imgPath = LoadPngLookupR[inImageId];

      const imgData = LoadPngData[imgPath];
      if(imgData) {
        const imgLen = imgData.data.length;
        outVecC.resize(imgLen)
        const rawOutData = module.HEAPU32[module.getPointer(outVecC.data())/4];
        module.HEAPU8.subarray(rawOutData, rawOutData+imgLen).set(imgData.data);
        module.HEAPU32[wRef/4] = imgData.width;
        module.HEAPU32[hRef/4] = imgData.height;
      } else {
        outVecC.resize(4);
        for(let i=0;i<inVecC.size();i++) {
          outVecC.push_back(inVecC.get(i));
        }
        module.HEAPU32[wRef/4] = 1;
        module.HEAPU32[hRef/4] = 1;
      }

      return 0;
    },
    encode: (path: string, inVecC: Merrel42ModelSynth.VectorChar, w: number, h: number): number => {
      path = module.wrapPointer(path as any as number, module.CString).c_str();
      inVecC = module.wrapPointer(inVecC as any as number, module.VectorChar);
      const inSize = inVecC.size();
      const rawInData = module.HEAPU32[module.getPointer(inVecC.data())/4];
      const saveId = SavePngId++;
      SavePngData[saveId] = {
        path,
        data: new ImageData(new Uint8ClampedArray(module.HEAPU8.subarray(rawInData, rawInData+inSize)), w, h)
      }
      return 0;
    }
  }