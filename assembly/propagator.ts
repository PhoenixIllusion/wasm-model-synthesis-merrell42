import { PropagatorConfig } from "./propagator-config";
import { rand, RAND_MAX } from "./rand";
import { ArrBoolean, ArrF32, Dequeu64, Size } from "./types";

@unmanaged
export abstract class Propagator {

  protected size: Size;
  protected possibilitySize: Size;
  protected transitionSize: Size;
  protected offset: Size;
  protected numLabels: i32;
  protected numDims: u8;
  protected transition: ArrBoolean;
  protected possibleLabels: ArrBoolean;
  protected periodic: boolean;

  protected _weights: ArrF32;
  protected weights: ArrF32;

  protected cumulativeSums: ArrF32;

  protected updateQueue: Dequeu64;

  constructor(config: PropagatorConfig) {
    this.size = config.size;
    this.possibilitySize = config.possibilitySize;
    this.offset = config.offset;
    const numLabels = this.numLabels = config.numLabels;
    this.numDims = config.numDims;
    this.transition = config.transition;
    this.periodic = config.periodic;

    this._weights = config.weights;
    this.weights = ArrF32.new(numLabels * 4);
    this.cumulativeSums = ArrF32.new(numLabels);

    this.transitionSize = config.transitionSize;
    this.possibleLabels = ArrBoolean.new(config.possibilitySize.xyz * config.numLabels);

    this.updateQueue = new Dequeu64(12 << 10)//TODO - calc good size queue
  }


  // Pick a random value given the weights. Higher weight means higher probability.
  pickFromWeights(x: i32, y: i32, z: i32): i32 {
    const _weights = this._weights;
    const weights = this.weights;
    const numLabels = this.numLabels;
    const cumulativeSums = this.cumulativeSums;

    for (let i: i32 = 0; i < numLabels; i++) {
      if (this.isPossible(x, y, z, i)) {
        weights[i] = _weights[i];
      } else {
        weights[i] = 0.0;
      }
    }


    let sum: f32 = 0;
    for (let i: i32 = 0; i < numLabels; i++) {
      sum += weights[i];
      cumulativeSums[i] = sum;
    }
    if (sum == 0) {
      return -1;
    }

    const randomValue = sum  * (rand() as f32)/RAND_MAX;
    for (let i: i32 = 0; i < numLabels; i++) {
      const sumVal = cumulativeSums[i];
      if (randomValue < sumVal) {
        return i;
      }
    }
    return -1;
  }

  // Set a label in the block at the given position.
  isPossible(x: i32, y: i32, z: i32, label: i32): boolean {
    const possibilitySize = this.possibilitySize;
    const possibleLabels = this.possibleLabels;
    return possibleLabels[possibilitySize.get_xyzw(x, y, z, label)];
  }

  abstract pickLabel(x: i32, y: i32, z: i32): i32;
  abstract setBlockLabel(label: i32, x: i32, y: i32, z: i32): boolean;
  abstract removeLabel(label: i32, x: i32, y: i32, z: i32): boolean;
  abstract resetBlock(): void;
}
