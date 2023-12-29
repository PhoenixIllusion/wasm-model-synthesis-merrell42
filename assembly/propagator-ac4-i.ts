import { PropagatorAc4 } from "./propagator-ac4";
import { PropagatorConfig } from "./propagator-config";

export function create(config: PropagatorConfig): PropagatorAc4 {
  return new PropagatorAc4(config);
}

// Set a label in the block at the given position.
export function setBlockLabel(ac4: PropagatorAc4, label: i32, x: i32, y: i32, z: i32): boolean {
  return ac4.setBlockLabel(label, x, y, z);
}

// Remove a label from the given position.
export function removeLabel(ac4: PropagatorAc4, label: i32, x: i32, y: i32, z: i32): boolean {
  return ac4.removeLabel(label, x, y, z);
}

// Reset the block to include all possible labels.
export function resetBlock(ac4: PropagatorAc4): void {
  return ac4.resetBlock();
}

// Returns true if the label at this location is possible.
export function isPossible(ac4: PropagatorAc4, x: i32, y: i32, z: i32, label: i32): boolean {
  return ac4.isPossible(x, y, z, label);
}

export function pickLabel(ac4: PropagatorAc4,x: i32, y: i32, z: i32): i32 {
  return ac4.pickLabel(x, y, z);
}

export function free(ac3: PropagatorAc4): void {
  ac3.free();
}