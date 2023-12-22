export interface Propagator {
  setBlockLabel(label: number, pos: [number, number, number]): void;
  isPossible(x: number, y: number, z: number, val: number): boolean;
  removeLabel(label: number, pos: [number, number, number]): void;
  pickLabel(x: number, y: number, z: number): number;
  resetBlock(): void;
  getSHA(): Promise<{ possible: string, transition: string  }>;
}
