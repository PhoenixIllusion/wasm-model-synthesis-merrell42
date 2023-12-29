import { Propagator } from "./propagator";
import { PropagatorConfig } from "./propagator-config";
import { ArrArrU16, ArrU16 } from "./types";
import { Size6d } from "./types/size-6d";

@unmanaged
export class PropagatorAc4 extends Propagator {

  private support: ArrU16;
  private supportSize: Size6d;


  private supporting: ArrArrU16;
  private supportCount: ArrU16;


  private numDirections: u8;
  constructor(config: PropagatorConfig) {
    super(config);
    const numDirections = this.numDirections = 2 * config.numDims;
    this.supporting = config.supporting;
    this.supportCount = config.supportCount;

    const possibilitySize = config.possibilitySize;
    const supportSize = this.supportSize = new Size6d(possibilitySize[0], possibilitySize[1], possibilitySize[2], config.numLabels, numDirections);
    this.support = ArrU16.new(supportSize.xyzw * numDirections);
  }

  free(): void {
    super.free();
    this.support.free();
    heap.free(changetype<usize>(this.supportSize));
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

  addToQueue(x: u16, y: u16, z: u16, label: u16): void {
    this.updateQueue.push_backXYZW(x,y,z, label);
  }


  propagate(): void {
    const updateQueue = this.updateQueue;
    while (!updateQueue.empty()) {
      const update = updateQueue.front();
      const xC:i32 = update[0];
      const yC:i32 = update[1];
      const zC:i32 = update[2];
      const labelC = update[3];

      const offset = this.offset;
      const size = this.size;
      const possibilitySize = this.possibilitySize;

      const numDirections = this.numDirections;

      const supporting = this.supporting;
      const supportCount = this.supportCount;
      const supportOffset = labelC * numDirections;

      const _poss_xyz = possibilitySize.xyz;
      const possibleLabels = this.possibleLabels;
      const supportSize = this.supportSize;
      const _support_xyzw = supportSize.xyzw;
      const support = this.support;

      for (let dir: u8 = 0; dir < numDirections; dir++) {
        let xB:i32 = xC;
        let yB:i32 = yC;
        let zB:i32 = zC;
        switch (dir) {
        case 0: xB--; break;
        case 1: xB++; break;
        case 2: yB--; break;
        case 3: yB++; break;
        case 4: zB--; break;
        case 5: zB++; break;
        }
        // Do not propagate if this goes outside the bounds of the block.
        if (this.periodic) {
          switch (dir) {
          case 0: if (xB < offset[0]) { xB += size[0]; } break;
          case 2: if (yB < offset[1]) { yB += size[1]; } break;
          case 4: if (zB <= offset[2]) { continue; } break;
          case 1: if (xB > possibilitySize[0] - offset[0] - 1) { xB -= size[0]; } break;
          case 3: if (yB > possibilitySize[1] - offset[1] - 1) { yB -= size[1]; } break;
          case 5: if (zB > possibilitySize[2] - offset[2] - 1) { continue; } break;
          }
        }
        else {
          switch (dir) {
          case 0: if (xC <= offset[0]) { continue; } break;
          case 2: if (yC <= offset[1]) { continue; } break;
          case 4: if (zC <= offset[2]) { continue; } break;
          case 1: if (xC >= possibilitySize[0] - offset[0] - 1) { continue; } break;
          case 3: if (yC >= possibilitySize[1] - offset[1] - 1) { continue; } break;
          case 5: if (zC >= possibilitySize[2] - offset[2] - 1) { continue; } break;
          }
        }

        const xyzB = possibilitySize.get_xyz(xB, yB, zB);
        const dirSupporting = supporting[supportOffset + dir];
        const dirSupportingSize = supportCount[supportOffset + dir^1];

        for (let i: u16 = 0; i < dirSupportingSize; i++) {
          let b: u16 = dirSupporting[i];
          const xyzBb = (xyzB + _poss_xyz * b) as u32;
          const xyzBbDir = xyzBb + _support_xyzw * dir;
          const newSupport = support[xyzBbDir] - 1;
          support[xyzBbDir] = newSupport;
          const possibleValue = possibleLabels[xyzBb];
          if (newSupport == 0 && possibleValue) {
            possibleLabels[xyzBb] = false;
            this.addToQueue(xB as u16, yB as u16, zB as u16, b as u16);
          }
        }
      }

		  updateQueue.pop_frontXYZW();
    }

  }

  setBlockLabel(label:  i32, x:  i32, y:  i32, z:  i32): boolean {
    const numLabels = this.numLabels;
    const possibilitySize = this.possibilitySize;
    const possibleLabels = this.possibleLabels;

    const _poss_xyz = possibilitySize.xyz;
    const xyz = possibilitySize.get_xyz(x, y, z);

    this.updateQueue.reset();
    for (let i = 0; i < numLabels; i++) {
      const xyzi = (xyz + _poss_xyz * i) as u32;
      if (i != label && possibleLabels[xyzi]) {
        possibleLabels[xyzi] = false;
        this.addToQueue(x as u16, y as u16, z as u16, i as u16)
      }
    }
    this.propagate();
    return true;
  }

  removeLabel(label:  i32, x:  i32, y:  i32, z:  i32): boolean {
    const possibleLabels = this.possibleLabels;
    const xyzLabel = this.possibilitySize.get_xyzw(x, y, z, label);
    if (!possibleLabels[xyzLabel]) {
      return true;
    }
    this.possibleLabels[xyzLabel] = false;
    this.updateQueue.reset();
    this.addToQueue(x as u16, y as u16, z as u16,label as u16)
    this.propagate();
    return true;
  }
  
  resetBlock(): void {
    const numLabels = this.numLabels;
    const possibilitySize = this.possibilitySize;
    const numDirections = this.numDirections;
    this.possibleLabels.fill(1, possibilitySize.xyz * this.numLabels);
    
    const supportSize = this.supportSize;
    const supportCount = this.supportCount;
    const support = this.support;

    const _pos_xyz = supportSize.xyz;

    for (let label = 0; label < numLabels; label++) {
      for (let dir: u8 = 0; dir < numDirections; dir++) {
        const count = supportCount[label * numDirections + dir];
        const _xyz_offset = supportSize.get_xyzwd(0,0,0,label,dir);
        /*
        Equivalent to for z=0-to-depth,y=0-to-height,x=0-to-width, [x][y][z][label][dir] = count;
        */
        for(let i=0;i<_pos_xyz;i++) {
          support[_xyz_offset + i] = count;
        }
      }
    }
    return;
  }
}