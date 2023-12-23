import { Propagator } from './propagator';
import type CSP from './wasm/csp-ac-release'
import { NativeInputSetting } from './native-input';

type Int3 = [number, number, number];

type PropagatorRef = CSP.__Internref0;
type ConfigRef = CSP.__Internref0;

export async function create(settings: NativeInputSetting, offset: Int3, possibilitySize: Int3): Promise<Propagator> {
  const module = await import('./wasm/csp-ac-release');

  const config = module.PropagatorConfig_create(
    ... settings.size,
    ... possibilitySize,
    ... offset,
    settings.numLabels, settings.numDims, settings.periodic
  );
  const transitionRef = module.PropagatorConfig_ptr_transition(config);
  const weightRef = module.PropagatorConfig_ptr_weights(config);

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

  if(settings.useAc4) {
    const supportCount: number[] = [];
    const supportOffsets: number[] = [];
    const supportValues: number[] = [];
    
    settings.supportCount.forEach(dirCount => {
      supportCount.push( ... dirCount);
    })

    let offset = 0;
    settings.supporting.forEach(dirSupporting => {
      dirSupporting.forEach(supporting => {
        supportOffsets.push(offset);
        supportValues.push(... supporting);
        offset = supportValues.length * 2;
      })
    })
    supportOffsets.forEach((x,i) => { supportOffsets[i] = x + supportOffsets.length * 4; })

    const ptrCount = module.PropagatorConfig_ptr_supportingCount(config);
    const ptrSupporting = module.PropagatorConfig_ptr_supporting(config, supportOffsets.length * 4 + supportValues.length * 2);
    
    const supportingCountMem = new Uint16Array(module.memory.buffer, ptrCount, supportCount.length);
    supportingCountMem.set(supportCount);
    const supportingMemLookup = new Uint32Array(module.memory.buffer, ptrSupporting, supportOffsets.length);
    supportingMemLookup.set(supportOffsets);
    const supportingMemValues = new Uint16Array(module.memory.buffer, ptrSupporting + supportOffsets.length * 4, supportValues.length);
    supportingMemValues.set(supportValues);
    return new AsmPropagatorAc4(module, config);
  } else {
    return new AsmPropagatorAc3(module, config);
  }
}

export class AsmPropagatorAc4 implements Propagator {

  private propagator: PropagatorRef;

  constructor(
    private module: typeof CSP,
    config: ConfigRef) {
    this.propagator = module.PropagatorAc4_create(config);
  }

  setBlockLabel(label: number, pos: [number, number, number]): void {
    this.module.PropagatorAc4_setBlockLabel(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  isPossible(x: number, y: number, z: number, val: number): boolean {
    return this.module.PropagatorAc4_isPossible(this.propagator, x, y, z, val);
  }
  removeLabel(label: number, pos: [number, number, number]): void {
    this.module.PropagatorAc4_removeLabel(this.propagator, label, pos[0], pos[1],pos[2]);
  }
  pickLabel(x: number, y: number, z: number): number {
    return this.module.PropagatorAc4_pickLabel(this.propagator, x, y, z);
  }
  resetBlock(): void {
    this.module.PropagatorAc4_resetBlock(this.propagator);
  }
}


export class AsmPropagatorAc3 implements Propagator {

  private propagator: PropagatorRef;

  constructor(
    private module: typeof CSP,
    config: ConfigRef) {

    this.propagator = module.PropagatorAc3_create(config);
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