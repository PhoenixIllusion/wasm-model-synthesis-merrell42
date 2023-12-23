import { Propagator } from './propagator';
import type CSP from './wasm/csp-ac-release'
import { NativeInputSetting } from './native-input';

type Int3 = [number, number, number];

type PropagatorRef = CSP.__Internref0;

export class AsmPropagator implements Propagator {

  private propagator: PropagatorRef;

  constructor(
    private module: typeof CSP,
    settings: NativeInputSetting,
    offset: Int3,
    possibilitySize: Int3) {
      const config = module.PropagatorConfig_create(
        ... settings.size,
        ... possibilitySize,
        ... offset,
        settings.numLabels, settings.numDims, settings.periodic
      );
      const transitionRef = module.PropagatorConfig_transition(config);
      const weightRef = module.PropagatorConfig_weights(config);

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
      this.propagator = module.PropagatorAc3_create(config);
  }

  static async create(settings: NativeInputSetting, offset: Int3, possibilitySize: Int3): Promise<AsmPropagator> {
    const module = await import('./wasm/csp-ac-release');
    return new AsmPropagator(module, settings, offset, possibilitySize);
  }

  setBlockLabel(label: number, pos: [number, number, number]): void {
    this.module.PropagatorAc3_setBlockLabel(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  isPossible(x: number, y: number, z: number, val: number): boolean {
    return this.module.PropagatorAc3_isPossible(this.propagator, x, y, z, val);
  }
  removeLabel(label: number, pos: [number, number, number]): void {
    this.module.PropagatorAc3_removeLabel(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  pickLabel(x: number, y: number, z: number): number {
    return this.module.PropagatorAc3_pickLabel(this.propagator, x, y, z);
  }
  resetBlock(): void {
    this.module.PropagatorAc3_resetBlock(this.propagator);
  }
}