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
    this.numDirections = 2 * config.numDims;
    this.supporting = config.supporting;
    this.supportCount = config.supportCount;

    const possibilitySize = config.possibilitySize;
    const supportSize = this.supportSize = new Size6d(possibilitySize[0], possibilitySize[1], possibilitySize[2], this.numLabels, this.numDirections);
    this.support = ArrU16.new(supportSize.xyzw * this.numDirections);
  }

  addToQueue(x: u16, y: u16, z: u16, label: u16) {
    this.updateQueue.push_backXYZW(x,y,z, label);
  }


  propagate(): void {
    const updateQueue = this.updateQueue;
    while (!updateQueue.empty()) {
      const update = updateQueue.front();
      const xC = update[0];
      const yC = update[1];
      const zC = update[2];
      const labelC = update[3];

      const offset = this.offset;
      const size = this.size;
      const possibilitySize = this.possibilitySize;

      const numDirections = this.numDirections;
      const supportOffset = labelC * numDirections;

      const supporting = this.supporting;
      const supportCount = this.supportCount;


      for (let dir = 0; dir < numDirections; dir++) {
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
        const _poss_xyz = possibilitySize.xyz;
        const possibleLabels = this.possibleLabels;
        const xyzB = possibilitySize.get_xyz(xB, yB, zB);
    
        const supportSize = this.supportSize;
        const _support_xyzw = supportSize.xyzw;

        const dirSupporting = supporting[supportOffset + dir];
        const dirSupportingSize = supportCount[supportOffset + dir];

        const support = this.support;

        for (let i = 0; i < dirSupportingSize; i++) {
          let b: u16 = dirSupporting[i];
          const xyzBb = (xyzB + _poss_xyz * b) as u32;
          const xyzBbDir = xyzBb + _support_xyzw * dir;
          support[xyzBbDir] = support[xyzBbDir] - 1;
          if (support[xyzBbDir] == 0 && possibleLabels[xyzBb]) {
            possibleLabels[xyzBb] = false;
            this.addToQueue(xB, yB, zB, b);
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

    for (let x = 0; x < possibilitySize[0]; x++) {
      for (let y = 0; y < possibilitySize[1]; y++) {
        for (let z = 0; z < possibilitySize[2]; z++) {
          for (let label = 0; label < numLabels; label++) {
            for (let dir = 0; dir < numDirections; dir++) {
              support[supportSize.get_xyzwd(x,y,z,label,dir)] = supportCount[label * numDirections + dir];
            }
          }
        }
      }
    }
  }
}