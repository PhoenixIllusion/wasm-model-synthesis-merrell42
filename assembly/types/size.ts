enum AXIS {
  X = 0, Y = 1, Z = 2
}

@unmanaged
export class Size {
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