export interface InputSetting {
  seed: number;
  size: [number, number, number];
  blockSize: [number, number, number];
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
