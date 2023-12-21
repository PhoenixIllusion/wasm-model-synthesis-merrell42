import { NativeInputSetting } from "./native-input";
import { Propagator } from "./propagator";
import { AsmPropagator } from "./propagator-asm";
import { CppPropagator } from "./propagator-cpp";

const numAttempts = 20;

type Int3 = [number,number,number];
type Bool6 = [boolean,boolean,boolean,boolean,boolean,boolean];

export class Synthesizer {

  private model: Uint32Array;
  private savedBlock: Uint32Array;

  private size: Int3;
  private sizeX: number;
  private sizeXY: number;
  private possibilitySizeX: number;
  private possibilitySizeXY: number;
  private blockSize: Int3;
  private offset: Int3;
  private numLabels: number;

  private _propagator: Promise<Propagator>;
  private propagator!: Propagator;

  constructor(private settings: NativeInputSetting) {
    const size = this.size = settings.size;
    const blockSize = this.blockSize = settings.blockSize;
    this.numLabels = settings.numLabels;

    const offset: Int3 = this.offset = [0,0,0];
    const possibilitySize: Int3 = [0,0,0];

    for (let dim = 0; dim < 3; dim++) {
      // If we are shifting the block along this dimension, we need to leave room for a boundary
      // cell and so the block is offset from the model.
      // NOTE: It perhaps would have been better not to conditionally shift the cells. This saves
      // some memory, but complicates the code.
      if (size[dim] > blockSize[dim]) {
        offset[dim] = 1;
      } else {
        offset[dim] = 0;
      }
    }

    for (let dim = 0; dim < 3; dim++) {
      if (blockSize[dim] == size[dim]) {
        possibilitySize[dim] = size[dim];
      } else {
        // Add one cell border to each side of the block if we are modifying in blocks.
        possibilitySize[dim] = blockSize[dim] + 2;
      }
    }

    this.model = new Uint32Array(size[0]*size[1]*size[2]);
    this.savedBlock = new Uint32Array(possibilitySize[0]*possibilitySize[1]*possibilitySize[2]);

    this.sizeX = size[0];
    this.sizeXY = size[0]*size[1];
    this.possibilitySizeX = possibilitySize[0];
    this.possibilitySizeXY = possibilitySize[0] * possibilitySize[1];

    this._propagator = AsmPropagator.create(settings, offset, possibilitySize);
    //this._propagator = CppPropagator.create(settings, offset, possibilitySize);
  }

  getModel() {
    return this.model;
  }

  getIndex(x: number, y: number, z: number): number {
    return x + y*this.sizeX + z*this.sizeXY;
  }
  getPIndex(x: number, y: number, z: number): number {
    return x + y*this.possibilitySizeX + z*this.possibilitySizeXY;
  }

  setupStepValues(dim: number, step: number, shifts: Int3, maxBlockStart: Int3, hasBoundary: Bool6): number {
    let value = step * shifts[dim];
    hasBoundary[2 * dim] = (step > 0);
    if (value >= maxBlockStart[dim]) {
      value = maxBlockStart[dim];
      hasBoundary[2 * dim + 1] = false;
    }
    else {
      hasBoundary[2 * dim + 1] = true;
    }
    return value;
  }

  async synthesize() {
    this.propagator = await this._propagator;
    const size = this.size;
    const blockSize = this.blockSize;

    // Set the initial labels.
    for (let x = 0; x < size[0]; x++) {
      for (let y = 0; y < size[1]; y++) {
        for (let z = 0; z < size[2]; z++) {
          const idx = this.getIndex(x,y,z);
          this.model[idx] = this.settings.initialLabels[z];
        }
      }
    }

    const shifts: Int3 = [0,0,0];
    const numSteps: Int3 = [0,0,0];
    const maxBlockStart: Int3 = [0,0,0];
    const blockStart: Int3 = [0,0,0];
    for (let dim = 0; dim < 3; dim++) {
      shifts[dim] = Math.max(blockSize[dim] / 2, 1);
      numSteps[dim] = Math.ceil((size[dim] - blockSize[dim]) / shifts[dim]) + 1;
      maxBlockStart[dim] = size[dim] - blockSize[dim];
    }

    let modifyInBlocks = false;
    for (let dim = 0; dim < 3; dim++) {
      if (numSteps[dim] > 1) {
        modifyInBlocks = true;
      }
    }

    const hasBoundary: Bool6 = [false,false,false,false,false,false];
    for (let xStep = 0; xStep < numSteps[0]; xStep++) {
      blockStart[0] = this.setupStepValues(0, xStep, shifts, maxBlockStart, hasBoundary);
      for (let yStep = 0; yStep < numSteps[1]; yStep++) {
        blockStart[1] = this.setupStepValues(1, yStep, shifts, maxBlockStart, hasBoundary);
        for (let zStep = 0; zStep < numSteps[2]; zStep++) {
          blockStart[2] = this.setupStepValues(2, zStep, shifts, maxBlockStart, hasBoundary);
          // If the model is in 3D we also include a boundary for z-values to force a
          // ground plane to appear.
          if (size[2] > 1) {
            hasBoundary[4] = true;
            hasBoundary[5] = true;
          }
          let success = false;
          let attempts = 0;
          if (modifyInBlocks) {
            this.saveBlock(blockStart);
          }
          while (!success && attempts < numAttempts) {
            success = this.synthesizeBlock(blockStart, hasBoundary);
            attempts++;
            if (!success) {
              if (attempts < numAttempts) {
                if (!modifyInBlocks) {
                  console.log("  Failed. Retrying...");
                }
              } else {
                if (modifyInBlocks) {
                  this.restoreBlock(blockStart);
                }
                console.log("  Failed. Max Attempts.");
              }
            }
          }
        }
      }
    }
  }

  getLabel(position: Int3) {
    return this.model[this.getIndex(...position)];
  }

  addBoundary(blockStart: Int3, dir: number) {
    const offset = this.offset;
    const blockSize = this.blockSize;
    // dim1 and dim2 are the two other dimensions.
    const dim0 = Math.floor(dir / 2);
    let dim1 = -1;
    let dim2 = -1;
    switch (dim0) {
      case 0: dim1 = 1; dim2 = 2; break;
      case 1: dim1 = 0; dim2 = 2; break;
      case 2: dim1 = 0; dim2 = 1; break;
    }
  
    const blockPos: Int3 = [0,0,0];
    const modelPos: Int3 = [0,0,0];
    if (dir % 2) {
      blockPos[dim0] = blockSize[dim0] - 1 + offset[dim0];
    } else {
      blockPos[dim0] = 0;
    }
    modelPos[dim0] = blockPos[dim0] + blockStart[dim0] - offset[dim0];
    for (let i = offset[dim1]; i < blockSize[dim1] + offset[dim1]; i++) {
      blockPos[dim1] = i;
      modelPos[dim1] = i + blockStart[dim1] - offset[dim1];
      for (let j = offset[dim2]; j < blockSize[dim2] + offset[dim2]; j++) {
        blockPos[dim2] = j;
        modelPos[dim2] = j + blockStart[dim2] - offset[dim2];
        this.propagator.setBlockLabel(this.getLabel(modelPos), blockPos);
      }
    }
  }


  // Set the labels to create a ground plane.
  addGround(blockStart: Int3): void {
    const size = this.size;
    const offset = this.offset;
    const blockSize = this.blockSize;
    const position: Int3 = [0,0,0];
    if (blockSize[1] - offset[1] + blockStart[1] + offset[1] == size[1]) {
      position[2] = 0;
      for (let x = offset[0]; x < blockSize[0] + offset[0]; x++) {
        position[0] = x;
        for (let y = offset[1]; y < blockSize[1] + offset[1]; y++) {
          position[1] = y;
          if (y == blockSize[1] - 1) {
            this.propagator.setBlockLabel(this.settings.ground, position);
          } else if (this.propagator.isPossible(x, y, 0, this.settings.ground)) {
            this.propagator.removeLabel(this.settings.ground, position);
          }
        }
      }
    }
  }

  // Remove labels with no support in any particular direction. Those labels
  // can only be on the boundary of the model.
  removeNoSupport(blockStart: Int3): void {
    const size = this.size;
    const offset = this.offset;
    const blockSize = this.blockSize;
    const numDirections = 2 * this.settings.numDims;
    
    const position: Int3 = [0,0,0];
    for (let i = 0; i < this.numLabels; i++) {
      for (let dir = 0; dir < numDirections; dir++) {
        if (this.settings.supportCount[i][dir] == 0) {
          for (let x = offset[0]; x < blockSize[0] + offset[0]; x++) {
            position[0] = x;
            for (let y = offset[1]; y < blockSize[1] + offset[1]; y++) {
              position[1] = y;
              for (let z = offset[2]; z < blockSize[2] + offset[2]; z++) {
                position[2] = z;
                let remove = false;
                switch (dir) {
                  case 0: remove = x + blockStart[0] - offset[0] != size[0] - 1; break;
                  case 1: remove = x + blockStart[0] - offset[0] != 0; break;
                  case 2: remove = y + blockStart[1] - offset[1] != size[1] - 1; break;
                  case 3: remove = y + blockStart[1] - offset[1] != 0; break;
                  case 4: remove = z + blockStart[2] - offset[2] != size[2] - 1; break;
                  case 5: remove = z + blockStart[2] - offset[2] != 0; break;
                }
                if (remove && this.propagator.isPossible(x, y, z, i)) {
                  this.propagator.removeLabel(i, position);
                }
              }
            }
          }
        }
      }
    }
  }

  saveBlock(blockStart: Int3): void {
    const offset = this.offset;
    const blockSize = this.blockSize;
    for (let x = offset[0]; x < blockSize[0] + offset[0]; x++) {
      for (let y = offset[1]; y < blockSize[1] + offset[1]; y++) {
        for (let z = offset[2]; z < blockSize[2] + offset[2]; z++) {
          const ox = x + blockStart[0] - offset[0];
          const oy = y + blockStart[1] - offset[1];
          const oz = z + blockStart[2] - offset[2];

          this.savedBlock[this.getPIndex(x,y,z)] = this.model[this.getIndex(ox,oy,oz)];
        }
      }
    }
  }
  restoreBlock(blockStart: Int3): void {
    const offset = this.offset;
    const blockSize = this.blockSize;
    for (let x = offset[0]; x < blockSize[0] + offset[0]; x++) {
      for (let y = offset[1]; y < blockSize[1] + offset[1]; y++) {
        for (let z = offset[2]; z < blockSize[2] + offset[2]; z++) {
          const ox = x + blockStart[0] - offset[0];
          const oy = y + blockStart[1] - offset[1];
          const oz = z + blockStart[2] - offset[2];
          this.model[this.getIndex(ox,oy,oz)] = this.savedBlock[this.getPIndex(x,y,z)];
        }
      }
    }
  }

  synthesizeBlock(blockStart: Int3, hasBoundary: Bool6): boolean {
    const offset = this.offset;
    const blockSize = this.blockSize;
    this.propagator.resetBlock();
    for (let dir = 0; dir < 6; dir++) {
      if (hasBoundary[dir]) {
        this.addBoundary(blockStart, dir);
      }
    }
    if (this.settings.ground >= 0) {
      this.addGround(blockStart);
    }
    if (this.settings.useAc4) {
      // removeNoSupport is only necessary for AC-4.
      // In AC-3 theses labels are removed during propagation.
      this.removeNoSupport(blockStart);
    }
  
    for (let x = offset[0]; x < blockSize[0] + offset[0]; x++) {
      for (let y = offset[1]; y < blockSize[1] + offset[1]; y++) {
        for (let z = offset[2]; z < blockSize[2] + offset[2]; z++) {
          const label = this.propagator.pickLabel(x, y, z);
          if (label == -1) {
            return false;
          }
          const ox = x + blockStart[0] - offset[0];
          const oy = y + blockStart[1] - offset[1];
          const oz = z + blockStart[2] - offset[2];
          this.model[this.getIndex(ox,oy,oz)] = label;
        }
      }
    }
    return true;
  }
}