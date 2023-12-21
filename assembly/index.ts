
let seed: u64;

export function srand(s: u32): void {
  seed = (s - 1) as u64;
}
const RAND_MAX: f32 = 2.14748365e+09;
export function rand(): i32 {
  let _seed = seed;
  _seed = (6364136223846793005 * _seed) + 1;
  seed = _seed;
  return (_seed >> 33) as u32;
}

@unmanaged
class ArrBoolean {
  [key: number]: boolean;
  //@inline
  @operator('[]')
  getI(index: u32): boolean {
    const ptr = changetype<usize>(this);
    return load<boolean>(ptr + index);
  }
  //@inline
  @operator('[]=')
  setI(index: u32, value: boolean): void {
    const ptr = changetype<usize>(this);
    store<boolean>(ptr + index, value);
  }
  //@inline
  fill(val: u8, count: usize): void {
    const ptr = changetype<usize>(this);
    memory.fill(ptr, val, count)
  }
}

@unmanaged
class ArrU16 {
  [key: number]: u16;
  //@inline
  @operator('[]')
  get(index: u32): u16 {
    const ptr = changetype<usize>(this);
    return load<u16>(ptr + index * 2);
  }
  //@inline
  @operator('[]=')
  set(index: u32, value: u16): void {
    const ptr = changetype<usize>(this);
    store<u16>(ptr + index * 2, value);
  }
  //@inline
  fill(val: u8, count: usize): void {
    const ptr = changetype<usize>(this);
    memory.fill(ptr, val, count * 2)
  }
}
@unmanaged
class ArrF32 {
  [key: number]: f32;
  //@inline
  @operator('[]')
  get(index: u32): f32 {
    const ptr = changetype<usize>(this);
    return load<f32>(ptr + index * 4);
  }
  //@inline
  @operator('[]=')
  set(index: u32, value: f32): void {
    const ptr = changetype<usize>(this);
    store<f32>(ptr + index * 4, value);
  }
}

enum AXIS {
  X = 0, Y = 1, Z = 2
}

@unmanaged
class Size {
  [key: number]: i32;
  public xy: i32;
  public xyz: i32;
  constructor(public x: i32, public y: i32, public z: i32) {
    this.xy = x * y;
    this.xyz = x * y * z;
  }
  set(x: i32, y: i32, z: i32): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.xy = x * y;
    this.xyz = x * y * z;
  }
  get_xyz(x: i32, y: i32, z: i32): i32 {
    return x + y * this.x + z * this.xy;
  }
  get_xyzw(x: i32, y: i32, z: i32, w: i32): i32 {
    return x + y * this.x + z * this.xy + w * this.xyz;
  }

  @inline
  @operator('[]')
  get(index: AXIS): i32 {
    return index == 0 ? this.x : index == 1 ? this.y : this.z;
  }
}

@unmanaged
class Dequeu64 {
  private first: usize;
  private last: usize;
  private _end: usize;
  private _ref: usize;
  constructor(size: u32) {
    const ref = heap.alloc(size * 8);
    this._ref = this.first = this.last = ref;
    this._end = ref + size * 8;

  }
  push_backXYZ(x: u16, y: u16, z: u16): void {
    let last = this.last;
    store<u16>(last, x);
    store<u16>(last, y, 2);
    store<u16>(last, z, 4);
    last += 6;
    if (last > this._end) {
      last = this._ref;
    }
    if (last == this.first) {
      throw new Error('Queue Overflow');
    }
    this.last = last;
  }
  front(): ArrU16 {
    let first = this.first;
    if (first == this.last) {
      throw new Error('Queue Underflow');
    }
    return changetype<ArrU16>(first);
  }
  pop_frontXYZ(): u64 {
    let first = this.first;
    if (first == this.last) {
      throw new Error('Queue Underflow');
    }
    const ret = load<u64>(first);
    first += 6;
    if (first > this._end) {
      first = this._ref;
    }
    this.first = first;
    return ret;
  }
  reset(): void {
    this.first = this.last = this._ref;
  }
  empty(): boolean {
    return this.first == this.last;
  }
}

@unmanaged
class PropagatorConfig {
  public transition: ArrBoolean;
  public weights: ArrF32;
  constructor(
    public size: Size, public possibilitySize: Size, public offset: Size,
    public numLabels: i32, public numDims: u8 = 0, public periodic: boolean = false) {
    this.transition = changetype<ArrBoolean>(heap.alloc(numLabels * numLabels * 3));
    this.weights = changetype<ArrF32>(heap.alloc(numLabels * 4));
  }

}

@unmanaged
abstract class Propagator {

  protected size: Size;
  protected possibilitySize: Size;
  protected transitionSize: Size;
  protected offset: Size;
  protected numLabels: i32;
  protected numDims: u8;
  protected transition: ArrBoolean;
  protected periodic: boolean;

  protected _weights: ArrF32;
  protected weights: ArrF32;

  protected cumulativeSums: ArrF32;

  constructor(config: PropagatorConfig) {
    this.size = config.size;
    this.possibilitySize = config.possibilitySize;
    this.offset = config.offset;
    const numLabels = this.numLabels = config.numLabels;
    this.numDims = config.numDims;
    this.transition = config.transition;
    this.periodic = config.periodic;

    this._weights = config.weights;
    this.weights = changetype<ArrF32>(heap.alloc(numLabels * 4));
    this.cumulativeSums = changetype<ArrF32>(heap.alloc(numLabels * 4));

    this.transitionSize = new Size(config.numLabels, config.numLabels, 6);
  }

  abstract isPossible(x: i32, y: i32, z: i32, label: i32): boolean;
  abstract setBlockLabel(label: i32, x: i32, y: i32, z: i32): boolean;
}

@inline
function pack64(a: u64, b: u64, c: u64, d: u64): u64 {
  b <<= 16;
  c <<= 32;
  d <<= 48;
  return a + b + c + d;
}

@unmanaged
class PropagatorAc3 extends Propagator {
  private possibleLabels: ArrBoolean;
  private inQueue: ArrBoolean;
  private updateQueue: Dequeu64;

  constructor(config: PropagatorConfig) {
    super(config);
    this.inQueue = changetype<ArrBoolean>(heap.alloc(config.possibilitySize.xyz));
    this.possibleLabels = changetype<ArrBoolean>(heap.alloc(config.possibilitySize.xyz * config.numLabels));
    this.updateQueue = new Dequeu64(1 << 12)//TODO - calc good size queue

  }

  // Pick a random value given the weights. Higher weight means higher probability.
  pickFromWeights(n: i32): i32 {
    let sum: f32 = 0;
    const weights = this.weights;
    const cumulativeSums = this.cumulativeSums;
    for (let i: i32 = 0; i < n; i++) {
      sum += weights[i];
      cumulativeSums[i] = sum;
    }
    if (sum == 0) {
      return -1;
    }

    const randomValue = sum  * (rand() as f32)/RAND_MAX;
    for (let i: i32 = 0; i < n; i++) {
      const sumVal = cumulativeSums[i];
      if (randomValue < sumVal) {
        return i;
      }
    }
    return -1;
  }

  pickLabel(x: i32, y: i32, z: i32): i32 {
    const _weights = this._weights;
    const weights = this.weights;
    const numLabels = this.numLabels;

    for (let i: i32 = 0; i < numLabels; i++) {
      if (this.isPossible(x, y, z, i)) {
        weights[i] = _weights[i];
      } else {
        weights[i] = 0.0;
      }
    }
    const label = this.pickFromWeights(numLabels);
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
    const xyzLabel = possibilitySize.get_xyzw(x, y, z, label);

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
    this.possibleLabels.fill(0xFF, possibilitySize.xyz * this.numLabels);
  }

  // Set a label in the block at the given position.
  isPossible(x: i32, y: i32, z: i32, label: i32): boolean {
    const possibilitySize = this.possibilitySize;
    const possibleLabels = this.possibleLabels;
    return possibleLabels[possibilitySize.get_xyzw(x, y, z, label)];
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

    const size_0 = size.x;
    const size_1 = size.y;
    const size_2 = size.z;

    const offset_0 = offset.x;
    const offset_1 = offset.y;
    const offset_2 = offset.z;
    
    const possibilitySize_0 = possibilitySize.x;
    const possibilitySize_1 = possibilitySize.y;
    const possibilitySize_2 = possibilitySize.z;


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
        case 0: if (xA < offset_0) { xA += size_0; } break;
        case 2: if (yA < offset_1) { yA += size_1; } break;
        case 4: if (zA <= offset_2) { return; } break;
        case 1: if (xA > possibilitySize_0 - offset_0 - 1) { xA -= size_0; } break;
        case 3: if (yA > possibilitySize_1 - offset_1 - 1) { yA -= size_1; } break;
        case 5: if (zA > possibilitySize_2 - offset_2 - 1) { return; } break;
      }
    }
    else {
      switch (dir) {
        case 0: if (xB <= offset_0) { return; } break;
        case 2: if (yB <= offset_1) { return; } break;
        case 4: if (zB <= offset_2) { return; } break;
        case 1: if (xB >= possibilitySize_0 - offset_0 - 1) { return; } break;
        case 3: if (yB >= possibilitySize_1 - offset_1 - 1) { return; } break;
        case 5: if (zB >= possibilitySize_2 - offset_2 - 1) { return; } break;
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


export function create_PropagatorAc3(config: usize): usize {
  return changetype<usize>(new PropagatorAc3(changetype<PropagatorConfig>(config)));
}

// Set a label in the block at the given position.
export function setBlockLabel_PropagatorAc3(ac3: usize, label: i32, x: i32, y: i32, z: i32): boolean {
  return changetype<PropagatorAc3>(ac3).setBlockLabel(label, x, y, z);
}

// Remove a label from the given position.
export function removeLabel_PropagatorAc3(ac3: usize, label: i32, x: i32, y: i32, z: i32): boolean {
  return changetype<PropagatorAc3>(ac3).removeLabel(label, x, y, z);
}

// Reset the block to include all possible labels.
export function resetBlock_PropagatorAc3(ac3: usize): void {
  return changetype<PropagatorAc3>(ac3).resetBlock();
}

// Returns true if the label at this location is possible.
export function isPossible_PropagatorAc3(ac3: usize, x: i32, y: i32, z: i32, label: i32): boolean {
  return changetype<PropagatorAc3>(ac3).isPossible(x, y, z, label);
}

export function pickLabel_PropagatorAc3(ac3: usize,x: i32, y: i32, z: i32): i32 {
  return changetype<PropagatorAc3>(ac3).pickLabel(x, y, z);
}

export function set_random_seed(s: u32): void {
  srand(s);
}

export function create_PropagatorConfig(
  size_x: i32, size_y: i32, size_z: i32,
  possibilitySize_x: i32, possibilitySize_y: i32, possibilitySize_z: i32,
  offset_x: i32, offset_y: i32, offset_z: i32,
  numLabels: i32, numDims: u8, periodic: boolean
): usize {
  return changetype<usize>(new PropagatorConfig(
    new Size(size_x, size_y, size_z),
    new Size(possibilitySize_x, possibilitySize_y, possibilitySize_z),
    new Size(offset_x, offset_y, offset_z),
    numLabels, numDims, periodic
  ));
}
export function transition_PropagatorConfig(config: usize): usize {
  return changetype<usize>(changetype<PropagatorConfig>(config).transition)
}
export function weights_PropagatorConfig(config: usize): usize {
  return changetype<usize>(changetype<PropagatorConfig>(config).weights)
}