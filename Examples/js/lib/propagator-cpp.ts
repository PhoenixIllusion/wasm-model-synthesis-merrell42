
import type Merrel42ModelSynth from './wasm/Merrel42ModelSynth.wasm'
import { NativeInputSetting, createInputSettings, setWASM as setInputWasm } from './native-input';
import { Propagator } from './propagator';

type Int3 = [number, number, number];

export class CppPropagator implements Propagator {

  private propagator: Merrel42ModelSynth.Propagator;
  private _tmpInt3: Uint32Array;
  private _tmpSizeRef: Merrel42ModelSynth.SizeRef;

  constructor(
      private module: typeof Merrel42ModelSynth,
      private settings: NativeInputSetting,
      offset: Int3,
      private possibilitySize: Int3) {
    setInputWasm(module);

    module.Random.setRandomSeed(settings.seed)

    const newSettings = createInputSettings(settings);
    const _possibilitySize = module.wrapPointer(this.createU32(3, possibilitySize), module.SizeRef);
    const _offset = module.wrapPointer(this.createU32(3, offset), module.SizeRef); 
    if (settings.useAc4) {
      this.propagator = new module.PropagatorAc4(newSettings, _possibilitySize, _offset);
    } else {
      this.propagator = new module.PropagatorAc3(newSettings, _possibilitySize, _offset);
      this.updatePossibleLabels(0x10f8f8);
    }
    const ptr = this.createU32(3, possibilitySize);
    this._tmpInt3 = this.getU32(ptr, 3);
    this._tmpSizeRef = module.wrapPointer(ptr, module.SizeRef);
  }
  static async create(settings: NativeInputSetting, offset: Int3, possibilitySize: Int3): Promise<CppPropagator> {
    const module = await import('./wasm/Merrel42ModelSynth.wasm');
    return new CppPropagator(await module.default(), settings, offset, possibilitySize);
  }

  setBlockLabel(label: number, pos: [number, number, number]) {
    this._tmpInt3.set(pos);
    this.propagator.setBlockLabel(label, this._tmpSizeRef);
  }
  isPossible(x: number, y: number, z: number, val: number): boolean {
    return this.propagator.isPossible(x, y, z, z);
  }

  removeLabel(label: number, pos: [number, number, number]) {
    this._tmpInt3.set(pos);
    this.propagator.removeLabel(label, this._tmpSizeRef);
  }
  pickLabel(x: number, y: number, z: number): number {
    return this.propagator.pickLabel(x, y, z);
  }

  resetBlock() {
    this.propagator.resetBlock();
  }

  possibleLabels: Uint8Array[][][] = []
  updatePossibleLabels(address: number) {
    this.possibleLabels = [];
    const xPtrs = this.module.HEAPU32.subarray(address/4, address/4+this.possibilitySize[0]);
    xPtrs.forEach((addrX,x) => {
      this.possibleLabels[x] = [];
      const yPtrs = this.module.HEAPU32.subarray(addrX/4, addrX/4 + this.possibilitySize[1]);
      yPtrs.forEach((addrY,y) => {
        this.possibleLabels[x][y] = [];
        const zPtrs = this.module.HEAPU32.subarray(addrY/4, addrY/4 + this.possibilitySize[2]);
        zPtrs.forEach((addrZ,z) => {
          this.possibleLabels[x][y][z] = this.module.HEAPU8.subarray(addrZ, addrZ + this.settings.numLabels);
        })
      })
    });
  }

  private createU32(size: number, value: number[]): number {
    const ref = (this.module as any)['_webidl_malloc'](size * 4);
    this.module.HEAPU32.set(value, ref / 4);
    return ref;
  }
  private getU32(ref: number | any, len: number): Uint32Array {
    if (typeof ref == 'object') {
      ref = this.module.getPointer(ref);
    }
    return this.module.HEAPU32.subarray(ref / 4, ref / 4 + len);
  }
}