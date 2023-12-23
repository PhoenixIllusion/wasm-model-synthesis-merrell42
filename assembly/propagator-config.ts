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
export function ptr_transition(config: PropagatorConfig): usize {
  return changetype<usize>(config.transition)
}
export function ptr_weights(config: PropagatorConfig): usize {
  return changetype<usize>(config.weights)
}
export function ptr_supportingCount(config: PropagatorConfig): usize {
  const numLabels = config.numLabels as u16;
  const numDirections = 2 * config.numDims as u8;
  const supportingCount = config.supportCount = ArrU16.new(numLabels * numDirections);
  return changetype<usize>(supportingCount);

}
export function ptr_supporting(config: PropagatorConfig, size: u32): usize {
  const supporting = config.supporting = ArrArrU16.new(size);
  return changetype<usize>(supporting);
}