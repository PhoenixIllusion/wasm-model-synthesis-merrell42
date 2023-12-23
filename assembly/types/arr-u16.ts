@unmanaged
export class ArrU16 {
  [key: number]: u16;

  @inline
  static new(size: u32): ArrU16 {
      return changetype<ArrU16>(heap.alloc(size * 2));
  }

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
  free(): void {
    heap.free(changetype<usize>(this));
  }
}