@unmanaged
export class ArrF32 {
  [key: number]: f32;

  @inline
  static new(size: u32): ArrF32 {
    return changetype<ArrF32>(heap.alloc(size * 4));
  }

  @inline
  @operator('[]')
  get(index: u32): f32 {
    const ptr = changetype<usize>(this);
    return load<f32>(ptr + index * 4);
  }
  @inline
  @operator('[]=')
  set(index: u32, value: f32): void {
    const ptr = changetype<usize>(this);
    store<f32>(ptr + index * 4, value);
  }
  
  free() {
    heap.free(changetype<usize>(this));
  }
}
