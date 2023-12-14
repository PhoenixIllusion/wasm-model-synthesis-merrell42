window.module = undefined;

const decoder = new TextDecoder();
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
  while((char = module.HEAP8[idx]) != 0 && idx-start < 1024) {str.push(char); idx++;};
  return decoder.decode(new Uint8Array(str));
}

function makeCString(str) {
  return module.getPointer(new module.CString(str, str.length));
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
  const ref = { node, nodeId: xmlNodeId++ };
  xmlNodeLookup[ref.nodeId] = ref;
  return ref.nodeId;
}
const XMLReader = {
    openFileHelper: (path, element) => {
      path = path && getStrW(path);
      element = element && getStrW(element);
      let url = (path == 0)? 'data/samples.xml' : path.replace('samples','data');
      const node = {path, element, nodeId: xmlNodeId++, node: readXML(url)};
      xmlNodeLookup[node.nodeId] = node;
      return node.nodeId;
    },
    getChildNodeN: (id, index) => {
      const node = xmlNodeLookup[id].node;
      debugger;
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
      debugger;
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

  const LodePNG = {
    error_text: (code) => {
      debugger;
      return makeRawString('Error '+code);
    },
    load_file: (buffer, path) => {
      path = module.wrapPointer(path, module.CString).c_str();
      if(!LoadPngLookup[path]) {
        LoadPngLookup[path] = LoadPngId;
        LoadPngLookupR[LoadPngId++] = path;
      }
      buffer = module.wrapPointer(buffer, module.VectorChar);
      buffer.resize(0);
      for(let i=0;i<4;i++) {
        buffer.push_back(i+1);
      }
      return 0;
    },
    decode: (outVecC, wRef, hRef, stateRef, inVecC) => {
      outVecC = module.wrapPointer(outVecC, module.VectorChar);
      inVecC = module.wrapPointer(inVecC, module.VectorChar);
      for(let i=0;i<4;i++) {
        outVecC.push_back(i+1);
      }
      module.HEAPU32[wRef/4] = 1;
      module.HEAPU32[hRef/4] = 1;
      return 0;
    },
    encode: (path, inVecC, w, h) => {
      path = module.wrapPointer(path, module.CString).c_str();
      inVecC = module.wrapPointer(inVecC, module.VectorChar);
      debugger;
      return 0;
    }
  }