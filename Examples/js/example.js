window.module = undefined;

const decoder = new TextDecoder();
function getStrW(idx) {
  let start = idx;
  const str = [];
  let char;
  while((char = module.HEAP8[idx]) != 0 && idx-start < 1024) {str.push(char); idx+=4;};
  return decoder.decode(new Uint8Array(str));
}

function makeCString(str) {
  return module.getPointer(new module.CString(str, str.length));
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