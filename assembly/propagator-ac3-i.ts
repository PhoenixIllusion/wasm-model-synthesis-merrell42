import { PropagatorAc3 } from "./propagator-ac3";
import { PropagatorConfig } from "./propagator-config";

export function create(config: PropagatorConfig): PropagatorAc3 {
  return new PropagatorAc3(config);
}

// Set a label in the block at the given position.
export function setBlockLabel(ac3: PropagatorAc3, label: i32, x: i32, y: i32, z: i32): boolean {
  return ac3.setBlockLabel(label, x, y, z);
}

// Remove a label from the given position.
export function removeLabel(ac3: PropagatorAc3, label: i32, x: i32, y: i32, z: i32): boolean {
  return ac3.removeLabel(label, x, y, z);
}

// Reset the block to include all possible labels.
export function resetBlock(ac3: PropagatorAc3): void {
  return ac3.resetBlock();
}

// Returns true if the label at this location is possible.
export function isPossible(ac3: PropagatorAc3, x: i32, y: i32, z: i32, label: i32): boolean {
  return ac3.isPossible(x, y, z, label);
}

export function pickLabel(ac3: PropagatorAc3,x: i32, y: i32, z: i32): i32 {
  return ac3.pickLabel(x, y, z);
}

export function free(ac3: PropagatorAc3): void {
  ac3.free();
}