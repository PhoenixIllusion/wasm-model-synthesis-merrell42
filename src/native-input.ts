import Merrel42ModelSynth from '../dist/Merrel42ModelSynth.wasm'
let module!: typeof Merrel42ModelSynth;

export function setWASM(_module: typeof Merrel42ModelSynth) {
  module = _module;
}

export function createU32(size: number, value: number[]): number {
  const ref = module['_webidl_malloc'](size * 4);
  module.HEAPU32.set(value, ref/4);
  return ref;
}

export function setU32(ref: number|any, value: number[]): void {
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


export interface NativeInputSetting {
  size: [number,number,number];
  blockSize: [number,number,number];
  numDims: number;
  numLabels: number;
  useAc4: boolean;
  initialLabels: number[];
  ground: number;

  periodic: boolean;
  transition: boolean[][][];
  supporting: number[][][];
  supportCount: number[][];
  weights: number[];
}

export function createInputSettings(settings: NativeInputSetting): Merrel42ModelSynth.InputSettings {
  const inputSettings = new module.InputSettings();
  settings.size.forEach((v,i) => 
    inputSettings.size.set(v,i)
  );
  settings.blockSize.forEach((v,i) => 
    inputSettings.blockSize.set(v,i)
  );
  inputSettings.numDims = settings.numDims;
  inputSettings.numLabels = settings.numLabels;
  inputSettings.useAc4 = settings.useAc4;
  inputSettings.initialLabels = createU32(settings.initialLabels.length, settings.initialLabels);
  inputSettings.ground = settings.ground;

  inputSettings.periodic = settings.periodic;
  const transition  = new module.Transition(settings.numLabels);
  settings.transition.forEach( (aLayer,layer) =>
    aLayer.forEach((arrA, aIndex) => 
      arrA.forEach((value, bIndex) => 
        transition.set(layer, aIndex, bIndex, value)
  )));
  inputSettings.transition = transition.ref();

  inputSettings.supporting.resize(0);
  settings.supporting.forEach( i2 => {
    const _vec2 = new module.Vector2Int();
    i2.forEach(i1 => {
      const _vec1 = new module.VectorInt();
      i1.forEach(i => {
        _vec1.push_back(i);
      });
      _vec2.push_back(_vec1);
    });
    inputSettings.supporting.push_back(_vec2);
  });

  inputSettings.supportCount.resize(0);
  settings.supportCount.forEach( i1 => {
      const _vec1 = new module.VectorInt();
      i1.forEach(i => {
        _vec1.push_back(i);
      });
      inputSettings.supportCount.push_back(_vec1);
  });

  inputSettings.weights.resize(0);
  settings.weights.forEach(v => 
    inputSettings.weights.push_back(v)
  );

  return inputSettings;
}