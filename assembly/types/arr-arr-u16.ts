import { ArrU16 } from "./arr-u16";

/*
Restructuring to be from a real 2D array into a single block of memory with a lookup table.
Expected that the lookup table is first, and true data is second.
The value stored in the table is just the offset from data-block 0 to the first record in the U16 array.
This allows for easier construction on the JS side by not needing to know if the ASM is 32 or 64 bit,
since we are restricting just this data self stand-alone to 32 bit, even if it is stored on a 64 bit WASM.
*/

@unmanaged
export class ArrArrU16 {
  [key: number]: ArrU16;

  @inline
  static new(bytes: u32): ArrArrU16 {
    const ref = heap.alloc(bytes + 8);
    memory.fill(ref, 255, bytes + 4); //debug markers, data structure post-run should have 4 bytes of 0xFF and 4 bytes of 0x00 at end if not overrun
    return changetype<ArrArrU16>(ref);
  }

  //@inline
  @operator('[]')
  getI(index: u32): ArrU16 {
    const ptr = changetype<usize>(this);
    return changetype<ArrU16>(ptr + load<u32>(ptr + index * 4));
  }
  
  free(): void {
    heap.free(changetype<usize>(this));
  }
}