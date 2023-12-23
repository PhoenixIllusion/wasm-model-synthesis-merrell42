import { Propagator } from "./propagator";
import { PropagatorConfig } from "./propagator-config";
import { ArrBoolean, Dequeu64 } from "./types";

@unmanaged
export class PropagatorAc3 extends Propagator {
  private inQueue: ArrBoolean;

  constructor(config: PropagatorConfig) {
    super(config);
    this.inQueue = changetype<ArrBoolean>(heap.alloc(config.possibilitySize.xyz));
    this.possibleLabels = changetype<ArrBoolean>(heap.alloc(config.possibilitySize.xyz * config.numLabels));

  }

  pickLabel(x: i32, y: i32, z: i32): i32 {
    const label = this.pickFromWeights( x, y, z);
    if (label == -1) {
      return -1;
    }

    const success = this.setBlockLabel(label, x, y, z);
    if (success) {
      return label;
    } else {
      return -1;
    }
  }

  // Remove a label in the block at the given position.
  removeLabel(label: i32, x: i32, y: i32, z: i32): boolean {
    const possibilitySize = this.possibilitySize;
    const possibleLabels = this.possibleLabels;
    const numLabels = this.numLabels;
    const _poss_xyz = possibilitySize.xyz;
    const xyzLabel = possibilitySize.get_xyzw(x, y, z, label);
    if (!possibleLabels[xyzLabel]) {
      return true;
    }

    const xyz = possibilitySize.get_xyz(x, y, z);
    const inQueue = this.inQueue;
    possibleLabels[xyzLabel] = false;
    inQueue[xyz] = true;

    // ***************************
    // TODO: Combine this with setBlockLabel.
    // ***************************
    const updateQueue = this.updateQueue;
    updateQueue.reset();
    updateQueue.push_backXYZ(x as u16, y as u16, z as u16);
    inQueue[xyz] = true;

    while (!updateQueue.empty()) {
      const update = updateQueue.front();
      const x = update[0];
      const y = update[1];
      const z = update[2];
      const xyz = possibilitySize.get_xyz(x, y, z);

      // TODO: Check if this makes things faster or not.
      // Check if any possible labels are still left.
      // If not we have failed.
      let isPossible = false;
      for (let i: i32 = 0; i < numLabels; i++) {
        const xyzi = (xyz + _poss_xyz * i) as u32;
        if (possibleLabels[xyzi]) {
          isPossible = true;
          break;
        }
      }
      if (!isPossible) {
        return false;
      }
      for (let dir: u8 = 0; dir < 6; dir++) {
        this.propagate(x, y, z, dir);
      }
      inQueue[xyz] = false;
      updateQueue.pop_frontXYZ();
    }
    return true;
  }


  // Set a label in the block at the given position.
  setBlockLabel(label: i32, x: i32, y: i32, z: i32): boolean {
    const possibilitySize = this.possibilitySize;
    const possibleLabels = this.possibleLabels;
    const updateQueue = this.updateQueue;
    const inQueue = this.inQueue;

    const xyz = possibilitySize.get_xyz(x, y, z);

    const numLabels = this.numLabels;
    const _poss_xyz = possibilitySize.xyz;
    for (let i: i32 = 0; i < numLabels; i++) {
      const xyzi = (xyz + _poss_xyz * i) as u32;
      possibleLabels[xyzi] = (i == label);
    }

    updateQueue.reset();
    updateQueue.push_backXYZ(x as u16, y as u16, z as u16);
    inQueue[xyz] = true;

    while (!updateQueue.empty()) {
      const update = updateQueue.front();
      const x = update[0];
      const y = update[1];
      const z = update[2];
      const xyz = possibilitySize.get_xyz(x, y, z);

      // TODO: Check if this makes things faster or not.
      // Check if any possible labels are still left.
      // If not we have failed.
      let isPossible = false;
      for (let i: i32 = 0; i < numLabels; i++) {
        const xyzi = (xyz + _poss_xyz * i) as u32;
        if (possibleLabels[xyzi]) {
          isPossible = true;
          break;
        }
      }
      if (!isPossible) {
        return false;
      }
      for (let dir: u8 = 0; dir < 6; dir++) {
        this.propagate(x, y, z, dir);
      }
      inQueue[xyz] = false;
      updateQueue.pop_frontXYZ();
    }
    return true;
  }

  // Set a label in the block at the given position.
  resetBlock(): void {
    const possibilitySize = this.possibilitySize;
    this.inQueue.fill(0, possibilitySize.xyz);
    this.possibleLabels.fill(1, possibilitySize.xyz * this.numLabels);
  }

  propagate(xB: i32, yB: i32, zB: i32, dir: u8): void {
    const updateQueue = this.updateQueue;
    const transitionSize = this.transitionSize;

    const offset = this.offset;
    const size = this.size;
    const possibilitySize = this.possibilitySize;
    const numLabels = this.numLabels;

    const transition = this.transition;
    const possibleLabels = this.possibleLabels;
    const inQueue = this.inQueue;

    let xA: i32 = xB;
    let yA: i32 = yB;
    let zA: i32 = zB;
    switch (dir) {
      case 0: xA--; break;
      case 1: xA++; break;
      case 2: yA--; break;
      case 3: yA++; break;
      case 4: zA--; break;
      case 5: zA++; break;
    }
    // Do not propagate if this goes outside the bounds of the block.
    if (this.periodic) {
      switch (dir) {
        case 0: if (xA < offset[0]) { xA += size[0]; } break;
        case 2: if (yA < offset[1]) { yA += size[1]; } break;
        case 4: if (zA <= offset[2]) { return; } break;
        case 1: if (xA > possibilitySize[0] - offset[0] - 1) { xA -= size[0]; } break;
        case 3: if (yA > possibilitySize[1] - offset[1] - 1) { yA -= size[1]; } break;
        case 5: if (zA > possibilitySize[2] - offset[2] - 1) { return; } break;
      }
    }
    else {
      switch (dir) {
        case 0: if (xB <= offset[0]) { return; } break;
        case 2: if (yB <= offset[1]) { return; } break;
        case 4: if (zB <= offset[2]) { return; } break;
        case 1: if (xB >= possibilitySize[0] - offset[0] - 1) { return; } break;
        case 3: if (yB >= possibilitySize[1] - offset[1] - 1) { return; } break;
        case 5: if (zB >= possibilitySize[2] - offset[2] - 1) { return; } break;
      }
    }
    const _poss_xyz = possibilitySize.xyz;
    const xyzA = possibilitySize.get_xyz(xA, yA, zA);
    const xyzB = possibilitySize.get_xyz(xB, yB, zB);

    const dim: u8 = dir / 2;
    const positive: boolean = (dir % 2 == 1);
    for (let a: i32 = 0; a < numLabels; a++) {
      const xyzAa = (xyzA + _poss_xyz * a) as u32;
      if (possibleLabels[xyzAa]) {
        let acceptable = false;
        for (let b: i32 = 0; b < numLabels; b++) {
          const xyzBb = (xyzB + _poss_xyz * b) as u32;
          const validTransition = positive ? transition[transitionSize.get_xyz(b, a, dim)] : transition[transitionSize.get_xyz(a, b, dim)];
          if (validTransition && possibleLabels[xyzBb]) {
            acceptable = true;
            break;
          }
        }
        if (!acceptable) {
          possibleLabels[xyzAa] = false;
          if (!inQueue[xyzA]) {
            updateQueue.push_backXYZ(xA as u16, yA as u16, zA as u16);
            inQueue[xyzA] = true;
          }
        }
      }
    }
  }
}