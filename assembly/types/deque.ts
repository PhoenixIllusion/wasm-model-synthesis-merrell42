import { ArrU16 } from "./arr-u16";

@unmanaged
export class Dequeu64 {
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

  push_backXYZW(x: u16, y: u16, z: u16, w: u16): void {
    let last = this.last;
    store<u16>(last, x);
    store<u16>(last, y, 2);
    store<u16>(last, z, 4);
    store<u16>(last, w, 6);
    last += 8;
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
  pop_frontXYZ(): void {
    let first = this.first;
    if (first == this.last) {
      throw new Error('Queue Underflow');
    }
    first += 6;
    if (first > this._end) {
      first = this._ref;
    }
    this.first = first;
    return;
  }
  pop_frontXYZW(): void {
    let first = this.first;
    if (first == this.last) {
      throw new Error('Queue Underflow');
    }
    first += 8;
    if (first > this._end) {
      first = this._ref;
    }
    this.first = first;
    return;
  }

  reset(): void {
    this.first = this.last = this._ref;
  }
  empty(): boolean {
    return this.first == this.last;
  }
}