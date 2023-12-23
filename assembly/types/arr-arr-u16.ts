import { ArrU16 } from "./arr-u16";

@unmanaged
export class ArrArrU16 {
  [key: number]: ArrU16;

  @inline
  static new(size: u32): ArrArrU16 {
      return changetype<ArrArrU16>(heap.alloc(size * sizeof<usize>()));
  }

  //@inline
  @operator('[]')
  getI(index: u32): ArrU16 {
    const ptr = changetype<usize>(this);
    return changetype<ArrU16>(load<usize>(ptr + index * sizeof<usize>()));
  }
  //@inline
  @operator('[]=')
  setI(index: u32, value: ArrU16): void {
    const ptr = changetype<usize>(this);
    store<usize>(ptr + index * sizeof<usize>(), changetype<usize>(value));
  }
  
  free(): void {
    heap.free(changetype<usize>(this));
  }
}