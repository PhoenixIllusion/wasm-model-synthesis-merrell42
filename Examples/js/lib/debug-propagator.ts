
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

  Propagator_onDebug(logAddr: number, settingsAddr: number, possibleLabelsAddr: number, possibilitySizeAddr: number,
    sizeAddr: number, offsetAddr: number, numLabels: number): void {
      if(this.possibleLabels.length == 0) {
        this.numLabels = numLabels;
        this.possibilitySize = this.getInt32Size(possibilitySizeAddr);
        this.size = this.getInt32Size(sizeAddr);
        this.offset = this.getInt32Size(offsetAddr);
        this.updatePossibleLabels(possibleLabelsAddr);
        this.updateTransition(this.HEAPU32[settingsAddr/4 + 60/4]);

        //this.logTransition();
      }
      //console.log(this.getStr(logAddr));
      //this.logPossibleLabels();
  }

  updateTransition(address: number) {
    this.transition = [];
    const perDir = this.getPointerArray(address, 3);
    perDir.forEach((aLabel,a) => {
      this.transition[a] = [];
      const aPtrs = this.getPointerArray(aLabel, this.numLabels);
      aPtrs.forEach((bPtr,b) => {
        this.transition[a][b] = this.HEAPU8.subarray(bPtr, bPtr + this.numLabels);
      })
    });
  }
  
  updatePossibleLabels(address: number) {
    this.possibleLabels = [];
    const xPtrs = this.getPointerArray(address, this.possibilitySize[0]);
    xPtrs.forEach((addrX,x) => {
      this.possibleLabels[x] = [];
      const yPtrs = this.getPointerArray(addrX, this.possibilitySize[1]);
      yPtrs.forEach((addrY,y) => {
        this.possibleLabels[x][y] = [];
        const zPtrs = this.getPointerArray(addrY, this.possibilitySize[2]);
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


  getPointerArray(addr: number, len) {
    return this.HEAPU32.subarray(addr/4, addr/4 + len);
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

  async getSHA(): Promise<{ possible: string, transition: string  }> {
    const hashHex = (array: Uint8Array) => [...array]
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(""); // convert bytes to hex string
    const hashBuffer = async (buffer: Uint8Array[][][]|Uint8Array[][]) => {
      const data = buffer.flat(2);
      const singleBuffer = combineArrayBufferView(data);
      const hash = await crypto.subtle.digest('SHA-1', singleBuffer);
      return hashHex(new Uint8Array(hash));
    }
    const possible = await hashBuffer(this.possibleLabels);
    const transition = await hashBuffer(this.transition);
    return { possible, transition};
  }
}
const decoder = new TextDecoder();

function combineArrayBufferView (views: ArrayBufferView[]) {
  let length = 0
  for (const v of views)
      length += v.byteLength
      
  let buf = new Uint8Array(length)
  let offset = 0
  for (const v of views) {
      const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
      buf.set(uint8view, offset)
      offset += uint8view.byteLength
  }
  
  return buf
}