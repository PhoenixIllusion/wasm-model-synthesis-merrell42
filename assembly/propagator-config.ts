import { ArrBoolean, ArrF32, ArrU16, Size } from "./types";
import { ArrArrU16 } from "./types";

@unmanaged
export class PropagatorConfig {
  public transition: ArrBoolean;
  public transitionSize: Size;
  public weights: ArrF32;

  public supporting!: ArrArrU16;
  public supportCount!: ArrU16;

  constructor(
    public size: Size, public possibilitySize: Size, public offset: Size,
    public numLabels: i32, public numDims: u8 = 0, public periodic: boolean = false) {
    this.transition = ArrBoolean.new(numLabels * numLabels * 3);
    this.weights = ArrF32.new(numLabels);
    this.transitionSize = new Size(numLabels, numLabels, 6);
  }
}

export function create(
  size_x: i32, size_y: i32, size_z: i32,
  possibilitySize_x: i32, possibilitySize_y: i32, possibilitySize_z: i32,
  offset_x: i32, offset_y: i32, offset_z: i32,
  numLabels: i32, numDims: u8, periodic: boolean
): PropagatorConfig {
  return new PropagatorConfig(
    new Size(size_x, size_y, size_z),
    new Size(possibilitySize_x, possibilitySize_y, possibilitySize_z),
    new Size(offset_x, offset_y, offset_z),
    numLabels, numDims, periodic
  );
}
export function transition(config: PropagatorConfig): usize {
  return changetype<usize>(config.transition)
}
export function weights(config: PropagatorConfig): usize {
  return changetype<usize>(config.weights)
}

export function computeSupport(config: PropagatorConfig): void {
  if(!config.supporting) {
    const numLabels = config.numLabels as u16;
    const numDirections = 2 * config.numDims as u8;
    const transition = config.transition;
    const transitionSize = config.transitionSize;
    const tmpU16 = ArrU16.new(numLabels);
    const supportingCount = config.supportCount = ArrU16.new(numLabels * numDirections);
    const supporting = config.supporting = ArrArrU16.new(numLabels * numDirections);
	  for (let c: u16 = 0; c < numLabels; c++) {
		  for (let dir: u8 = 0; dir < numDirections; dir++) {
        let dim: u8 = dir / 2;
        let sign: boolean = dir % 2 == 0;
        let idx: u16 = 0;
        if (sign) {
          for (let b: u16 = 0; b < numLabels; b++) {
            if (transition[transitionSize.get_xyz(b,c,dim)]) {
              // b supports c in direction dir.
              tmpU16[idx++] = b;
            }
          }
        }
        else {
          for (let b: u16 = 0; b < numLabels; b++) {
            if (transitionSize.get_xyz(c,b,dim)) {
              // b supports c in direction dir.
              tmpU16[idx++] = b;
            }
          }
        }
        const newArr = supporting[c * numDirections + dir] = ArrU16.new(idx);
        memory.copy(changetype<usize>(newArr),changetype<usize>(tmpU16), idx * 2);
        supportingCount[c * numDirections + (dir^1)] = idx;
      }
    }
    tmpU16.free();
  }
}