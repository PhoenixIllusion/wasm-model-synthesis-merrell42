window.module = undefined;

const decoder = new TextDecoder();
const encoder = new TextEncoder();
function getStrW(idx) {
  let start = idx;
  const str = [];
  let char;
  while((char = module.HEAP8[idx]) != 0 && idx-start < 1024) {str.push(char); idx+=4;};
  return decoder.decode(new Uint8Array(str));
}
function getStr(idx) {
  let start = idx;
  const str = [];
  let char;
  while((char = module.HEAPU8[idx]) != 0 && idx-start < 1024) {str.push(char); idx++;};
  return decoder.decode(new Uint8Array(str));
}
function makeCString(str) {
  return module.getPointer(new module.CString(str, str.length));
}

function makeStrW(str) {
  const bytes = encoder.encode(str);
  const ref = module._webidl_malloc(bytes.length * 4 + 1);
  const arr = module.HEAPU8.subarray(ref, ref+bytes.length*4);
  for(let i=0;i<str.length;i++){
    arr[i*4] = bytes[i];
  }
  return ref;
}
function makeRawString(str) {
  return module.getPointer(new module.CString(str, str.length).c_str());
}

function createU32(size, value) {
  const ref = module._webidl_malloc(size * 4);
  module.HEAPU32.set(value, ref/4);
  return ref;
}

function setU32(ref, value) {
  if(typeof ref == 'object') {
    ref = module.getPointer(ref);
  }
  module.HEAPU32.set(value, ref/4);
}
function getU32(ref, len) {
  if(typeof ref == 'object') {
    ref = module.getPointer(ref);
  }
  return module.HEAPU32.subarray(ref/4, ref/4 + len);
}


const parser = new DOMParser();
const docCache = {}
const readXML = (path) => {
  if(docCache[path]) {
    return docCache[path];
  }
  return fetch(path).then(res => res.text()).then(text => parser.parseFromString(text,'text/xml')).then(doc => {
    const ret = doc.children[0];
    docCache[path] = ret;
    return ret;
  });
}

const xmlNodeLookup = {};
let xmlNodeId = 1;
const addNode = (node) => {
  if(!node) {
    throw Error('Failed to find node');
  }
  const ref = { node, nodeId: xmlNodeId++ };
  xmlNodeLookup[ref.nodeId] = ref;
  return ref.nodeId;
}
const XMLReader = {
    openFileHelper: (path, element) => {
      path = path && getStrW(path);
      element = element && getStrW(element);
      const node = {path, element, nodeId: xmlNodeId++, node: readXML(path)};
      xmlNodeLookup[node.nodeId] = node;
      return node.nodeId;
    },
    getChildNodeN: (id, index) => {
      const node = xmlNodeLookup[id].node;
      if(node.children[index]) {
        return addNode(node.children[index]);
      }
    },
    getChildNodeC: (id, name, index) => {
      name = getStrW(name);
      const node = xmlNodeLookup[id].node;
      const children = node.querySelectorAll(name);
      if(children[index]) {
        return addNode(children[index]);
      }
      debugger;
      return 0;
    },
    getChildNodeCR: (id, name, ref) => {
      const tag = getStrW(name);
      const node = xmlNodeLookup[id].node;
      if(ref == 0) {
        return addNode(node.querySelector(tag));
      }
      debugger;

    },
    getChildNodeWithAttribute: (id, tagName, attributeN, attributeV) => {
      tagName = getStrW(tagName);
      attributeN = getStrW(attributeN);
      attributeV = attributeV && getStrW(attributeV);
      const node = xmlNodeLookup[id].node;
      let query = `${tagName}[${attributeN}${attributeV?'="'+attributeV+'"':''}]`;
      return addNode(node.querySelector(query));
    },
    getAttributeStr: (id, name) => {
      name = getStrW(name);
      const node = xmlNodeLookup[id].node;
      const val = node.getAttribute(name);
      if(val) {
        return makeCString(val);
      }
      return makeCString('');
    },
    nChildNode: (id, name) => {
      name = getStrW(name);
      const node = xmlNodeLookup[id].node;
      const count = node.querySelectorAll(name).length;
      return count;
    },
    getNameStr: (id) => {
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
  const IFStream = {
    constructor: (url, flag) => {
      url = getStr(url);
      debugger;
    },
    exists: (url) => {
      url = getStr(url);
      return true;
    },
    getline: (id, buffer, len) => {
      debugger;
    },
    rdbuf: (id) => {
      debugger;
    }
  }

  let LoadPngId = 0;
  const LoadPngLookupR = {

  }
  const LoadPngLookup = {

  }
  const LoadPngData = {

  }
  let SavePngId = 0;
  const SavePngData = {

  }

  const tmpCanvas = document.createElement('canvas');
  const readImage = (path) => {
    if(LoadPngData[path]) {
      return LoadPngData[path];
    }
    return new Promise(resolve => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        tmpCanvas.width = img.width;
        tmpCanvas.height = img.height;
        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        LoadPngData[path] = ctx.getImageData(0,0,img.width, img.height);
        resolve(LoadPngData[path]);
      };
    })
  }

  const LodePNG = {
    error_text: (code) => {
      debugger;
      return makeRawString('Error '+code);
    },
    load_file: (buffer, path) => {
      path = module.wrapPointer(path, module.CString).c_str();

      buffer = module.wrapPointer(buffer, module.VectorChar);
      buffer.resize(4);
      const rawData = module.HEAPU32[module.getPointer(buffer.data())/4];
      module.HEAPU32.subarray(rawData, rawData + 1)[0] = LoadPngId;
      if(!LoadPngLookup[path]) {
        LoadPngLookup[path] = LoadPngId;
        LoadPngLookupR[LoadPngId++] = path;
      }

      return 0;
    },
    decode: (outVecC, wRef, hRef, stateRef, inVecC) => {
      outVecC = module.wrapPointer(outVecC, module.VectorChar);
      inVecC = module.wrapPointer(inVecC, module.VectorChar);
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
    encode: (path, inVecC, w, h) => {
      path = module.wrapPointer(path, module.CString).c_str();
      inVecC = module.wrapPointer(inVecC, module.VectorChar);
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