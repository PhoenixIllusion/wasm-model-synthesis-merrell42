interface HasHeaps {
  HEAPU32: Uint32Array,
  HEAP32: Int32Array,
  HEAPU8: Uint8Array
}

export class Debug {
  private HEAPU32!: Uint32Array
  private HEAP32!: Int32Array
  private HEAPU8!: Uint8Array

  possibleLabels: Uint8Array[][][] = []
  possibilitySize!: Int32Array;
  size!: Int32Array;
  offset!: Int32Array;
  numLabels!: number;

  transition: Uint8Array[][] = [];

  constructor() {
    this.Propagator_onDebug = this.Propagator_onDebug.bind(this);
  }

  setHeaps(hasHeaps: HasHeaps) {
    this.HEAP32 = hasHeaps.HEAP32;
    this.HEAPU32 = hasHeaps.HEAPU32;
    this.HEAPU8 = hasHeaps.HEAPU8;
  }

  Propagator_onDebug(_logAddr: number, settingsAddr: number, possibleLabelsAddr: number, possibilitySizeAddr: number,
    sizeAddr: number, offsetAddr: number, numLabels: number): void {
      if(this.possibleLabels.length == 0) {
        this.numLabels = numLabels;
        this.possibilitySize = this.getInt32Size(possibilitySizeAddr);
        this.size = this.getInt32Size(sizeAddr);
        this.offset = this.getInt32Size(offsetAddr);
        this.updatePossibleLabels(possibleLabelsAddr);
        this.transition = Debug.decodeTransition(this.HEAPU32[settingsAddr/4 + 60/4], numLabels, this.HEAPU32, this.HEAPU8);

        //this.logTransition();
      }
      //console.log(this.getStr(logAddr));
      //this.logPossibleLabels();
  }

  static decodeTransition(address: number, numLabels: number, HEAPU32: Uint32Array, HEAPU8: Uint8Array ): Uint8Array[][]  {
    const transition: Uint8Array[][] = [];
    const perDir = getPointerArray(address, 3, HEAPU32);
    perDir.forEach((dirAddr,dir) => {
      transition[dir] = [];
      const aPtrs = getPointerArray(dirAddr, numLabels, HEAPU32);
      aPtrs.forEach((bPtr,a) => {
        transition[dir][a] = HEAPU8.subarray(bPtr, bPtr + numLabels);
      })
    });
    return transition;
  }
  
  updatePossibleLabels(address: number) {
    this.possibleLabels = [];
    const xPtrs = getPointerArray(address, this.possibilitySize[0], this.HEAPU32);
    xPtrs.forEach((addrX,x) => {
      this.possibleLabels[x] = [];
      const yPtrs = getPointerArray(addrX, this.possibilitySize[1], this.HEAPU32);
      yPtrs.forEach((addrY,y) => {
        this.possibleLabels[x][y] = [];
        const zPtrs = getPointerArray(addrY, this.possibilitySize[2], this.HEAPU32);
        zPtrs.forEach((addrZ,z) => {
          this.possibleLabels[x][y][z] = this.HEAPU8.subarray(addrZ, addrZ + this.numLabels);
        })
      })
    });
  }
  private logTransition() {
    const xBuff: string[] = [];
    this.transition.forEach( x => {
      const yBuff: string[] = [];
      x.forEach(y => {
        yBuff.push(y.join(''));
      })
      xBuff.push(yBuff.join('\n'))
    });
    console.log('Transition:\n'+xBuff.join('\n\n'));
  }

  count = 0;
  private logPossibleLabels() {
    const xBuff: string[] = [];
    this.possibleLabels.forEach( x => {
      const yBuff: string[] = [];
      x.forEach(y => {
        const zBuff: string[] = [];
        y.forEach( z => {
          zBuff.push(z.join(''));
        })
        yBuff.push(zBuff.join(''));
      })
      xBuff.push(yBuff.join('\n'))
    });
    console.log('Count '+(this.count++)+':\n'+xBuff.join('\n\n'));
  }

  getInt32Size(addr: number) {
    return this.HEAP32.subarray(addr/4, addr/4+3)
  }

  getStr(idx: number): string {
    let start = idx;
    const str: number[] = [];
    let char: number;
    while ((char = this.HEAPU8[idx]) != 0 && idx - start < 1024) { str.push(char); idx++; };
    return decoder.decode(new Uint8Array(str));
  }
}
const decoder = new TextDecoder();

function getU16Array(addr: number, len: number, HEAPU32: Uint16Array) {
  return HEAPU32.subarray(addr/2, addr/2 + len);
}
function getPointerArray(addr: number, len: number, HEAPU32: Uint32Array) {
  return HEAPU32.subarray(addr/4, addr/4 + len);
}