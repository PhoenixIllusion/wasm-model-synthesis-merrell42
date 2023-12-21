import { Propagator } from './propagator';
import type CSP from './wasm/csp-ac-debug'
import { NativeInputSetting } from './native-input';

type Int3 = [number, number, number];

export class AsmPropagator implements Propagator {

  private propagator: number;

  constructor(
    private module: typeof CSP,
    settings: NativeInputSetting,
    offset: Int3,
    possibilitySize: Int3) {
      const config = module.create_PropagatorConfig(
        ... settings.size,
        ... possibilitySize,
        ... offset,
        settings.numLabels, settings.numDims, settings.periodic
      );
      const transitionRef = module.transition_PropagatorConfig(config);
      const weightRef = module.weights_PropagatorConfig(config);

      const numLabels = settings.numLabels;
      const transition = new Uint8Array(module.memory.buffer, transitionRef, numLabels * numLabels * 3);
      
      let i = 0;
      for(let z = 0; z < 3; z++)
      for(let b = 0; b < numLabels; b++)
      for(let a = 0; a < numLabels; a++)
        transition[i++] = settings.transition[z][a][b]? 1 : 0;

      const weights = new Float32Array(module.memory.buffer, weightRef, numLabels);
      weights.set(settings.weights);
      module.set_random_seed(settings.seed);
      this.propagator = module.create_PropagatorAc3(config);
  }

  static async create(settings: NativeInputSetting, offset: Int3, possibilitySize: Int3): Promise<AsmPropagator> {
    const module = await import('./wasm/csp-ac-debug');
    return new AsmPropagator(module, settings, offset, possibilitySize);
  }

  setBlockLabel(label: number, pos: [number, number, number]): void {
    this.module.setBlockLabel_PropagatorAc3(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  isPossible(x: number, y: number, z: number, val: number): boolean {
    return this.module.isPossible_PropagatorAc3(this.propagator, x, y, z, val);
  }
  removeLabel(label: number, pos: [number, number, number]): void {
    this.module.removeLabel_PropagatorAc3(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  pickLabel(x: number, y: number, z: number): number {
    return this.module.pickLabel_PropagatorAc3(this.propagator, x, y, z);
  }
  resetBlock(): void {
    this.module.resetBlock_PropagatorAc3(this.propagator);
  }

}