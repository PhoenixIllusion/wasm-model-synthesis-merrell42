@unmanaged
export class ArrBoolean {
  [key: number]: boolean;

  @inline
  static new(size: u32): ArrBoolean {
      return changetype<ArrBoolean>(heap.alloc(size));
  }

  @inline
  @operator('[]')
  getI(index: u32): boolean {
    const ptr = changetype<usize>(this);
    return load<boolean>(ptr + index);
  }
  @inline
  @operator('[]=')
  setI(index: u32, value: boolean): void {
    const ptr = changetype<usize>(this);
    store<boolean>(ptr + index, value);
  }

  @inline
  fill(val: u8, count: usize): void {
    const ptr = changetype<usize>(this);
    memory.fill(ptr, val, count)
  }
  
  free(): void {
    heap.free(changetype<usize>(this));
  }
}