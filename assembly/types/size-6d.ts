enum AXIS {
  x = 0,
  y = 1,
  z = 2,
  w = 3,
  d = 4
}

@unmanaged
export class Size6d {
  [key: number]: i32;

  public xy: i32;
  public xyz: i32;
  public xyzw: i32;

  constructor(public x: i32, public y: i32, public z: i32, public w: i32, public dir: u8) {
    this.xy = x * y;
    this.xyz = x * y * z;
    this.xyzw = x * y * z * w;
  }

  get_xyz(x: i32, y: i32, z: i32): i32 {
    return x + y * this.x + z * this.xy;
  }
  get_xyzw(x: i32, y: i32, z: i32, w: i32): i32 {
    return x + y * this.x + z * this.xy + w * this.xyz;
  }
  get_xyzwd(x: i32, y: i32, z: i32, w: i32, d: i32): i32 {
    return x + y * this.x + z * this.xy + w * this.xyz + d * this.xyzw;
  }

  @operator('[]')
  get(index: AXIS): i32 {
    return index == 0 ? this.x : index == 1 ? this.y : this.z;
  }
}