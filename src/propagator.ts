import type { InputSetting } from ".";

export interface Propagator {
  setBlockLabel(label: number, pos: [number, number, number]): void;
  isPossible(x: number, y: number, z: number, val: number): boolean;
  removeLabel(label: number, pos: [number, number, number]): void;
  pickLabel(x: number, y: number, z: number): number;
  resetBlock(): void;
}
type Int3 = [number,number,number];

export type PropagatorCreator = (setting: InputSetting, offset: Int3, possibilitySize: Int3, wasmUrl: string)=>Promise<Propagator>;