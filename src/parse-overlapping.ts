import { ParsedInputBase, ParsedInputHead, createTransition, findInitialLabel } from "./parse-input";

export interface OverlappingConfig {
  name: string;
  N: number,
  periodicInput: boolean,
  symmetry: number
}

let canvas: OffscreenCanvas;
let offscreenCanvas2D: OffscreenCanvasRenderingContext2D;

// Return the index for an RGBA image.
function rgba(x: number, y: number, N: number): number {
	return 4 * (x + y * N);
}

// Get the patch at the given position.
function getPatch(x0: number, y0: number, w: number, h: number, N: number, image: Uint8ClampedArray) {
	const patch: Uint8ClampedArray = new Uint8ClampedArray(N * N * 4);
  let i = 0;
	for (let dy = 0; dy < N; dy++) {
		const y = (y0 + dy) % h;
		for (let dx = 0; dx < N; dx++) {
			const x = (x0 + dx) % w;
			const xy = rgba(x, y, w);
			for (let k = 0; k < 3; k++) {
				patch[i++] = (image[xy + k]);
			}
      patch[i++] = 255;
		}
	}
	return patch;
}


// Reflect a patch horizontally.
function reflectPatch(patch: Uint8ClampedArray, N: number): Uint8ClampedArray {
	const newPatch: Uint8ClampedArray = new Uint8ClampedArray(patch.length);
  let i = 0;
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const xy = rgba(N - 1 - x, y, N);
			for (let k = 0; k < 4; k++) {
				newPatch[i++] = (patch[xy + k]);
			}
		}
	}
	return newPatch;
}

// Rotate a patch 90 degrees.
function rotatePatch(patch: Uint8ClampedArray, N: number): Uint8ClampedArray {
	const newPatch: Uint8ClampedArray = new Uint8ClampedArray(patch.length);
  let i = 0;
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const xy = rgba(N - 1 - y, x, N);
			for (let k = 0; k < 4; k++) {
				newPatch[i++] = (patch[xy + k]);
			}
		}
	}
	return newPatch;
}

// Returns true if patch B is matches patch A shifted horizontally one pixel.
function patchesMatchX(a: Uint8ClampedArray, b: Uint8ClampedArray, N: number): boolean {
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N - 1; x++) {
			const xyA = rgba(x + 1, y, N);
			const xyB = rgba(x, y, N);
			for (let k = 0; k < 3; k++) {
				if (a[xyA + k] != b[xyB + k]) {
					return false;
				}
			}
		}
	}
	return true;
}

// Returns true if patch B is matches patch A shifted vertically one pixel.
function patchesMatchY(a: Uint8ClampedArray, b: Uint8ClampedArray, N: number): boolean {
	for (let y = 0; y < N - 1; y++) {
		for (let x = 0; x < N; x++) {
			const xyA = rgba(x, y + 1, N);
			const xyB = rgba(x, y, N);
			for (let k = 0; k < 3; k++) {
				if (a[xyA + k] != b[xyB + k]) {
					return false;
				}
			}
		}
	}
	return true;
}

export const readImage = (path: string): ImageData|Promise<ImageData> => {
  return new Promise<ImageData>(resolve => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      if(!canvas) {
        canvas = new OffscreenCanvas(img.width, img.height);
        offscreenCanvas2D = canvas.getContext('2d')!;
      }
      const ctx = offscreenCanvas2D!;
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0,0,img.width, img.height));
    };
  })
}

const tileLookup: { [label: number]: ImageData } = {};
export function getOverlapTileForLabel(label: number): ImageData {
  return tileLookup[label];
}
function addTileForLabel(label: number, data: Uint8ClampedArray, w: number, h: number): void {
  tileLookup[label] = new ImageData(data, w, h)
}

function hashPatch(data: Uint8ClampedArray): string {
  return [... data].map((x,i) => ((i+1)%4 > 0)?('00'+x.toString(16)).substr(-2):'').join('');
}

export async function parseOverlapping(node: Element, settings: ParsedInputHead, config: OverlappingConfig): Promise<ParsedInputBase> {
   const image = await readImage(`samples/${config.name}.png`);

	// Default size is 48 x 48.
	if (settings.size[0] == 0) {
		settings.size[0] = 48;
		settings.size[1] = 48;
	}
	const N = config.N;
	// Resize block if needed.
	if (settings.blockSize[0] == 0 || settings.blockSize[0] > settings.size[0]) {
		settings.blockSize[0] = settings.size[0];
		settings.blockSize[1] = settings.size[1];
	}

  	// Maps from a N x N RGB patch to the number of times the patch appears.
	const patches: Map<string, number> = new Map();
  const patchesData: Map<string, Uint8ClampedArray> = new Map();

	// Indicates if a patch could be the ground patch.
	const possiblyGround: Map<string, boolean> = new Map();

  const hasGround = (settings.ground > 0);

  const w = image.width;
  const h = image.height;
	// If the input is periodic, wrap the tiles around the input.
	const w0 = w - (config.periodicInput ? 0 : N - 1);
	const h0 = h - (config.periodicInput ? 0 : N - 1);

  for (let y = 0; y < h0; y++) {
		for (let x = 0; x < w0; x++) {
			const data: Uint8ClampedArray = getPatch(x, y, w, h, N, image.data);
      const hash: string = hashPatch(data);
      const incPatch = (hash: string, data: Uint8ClampedArray) => {
        patches.set(hash, (patches.get(hash)||0)+1);
        patchesData.set(hash, data);
      }
			if (hasGround && y == h - 1) {
				// Ground tiles are at the bottom.
				possiblyGround.set(hash, true);
			}
			incPatch(hash, data);
			// Reflect and rotate the patches depending on the symmetry.
			for (let i = 1; i < config.symmetry; i++) {
        let transform: (data: Uint8ClampedArray, dir: number)=>Uint8ClampedArray;
				if (i % 2 == 1) {
          transform = reflectPatch;
				} else {
          transform = rotatePatch;
				}
        const patch = transform(data, N);
        const hash = hashPatch(patch);
        incPatch(hash, patch);
			}
		}
	}
  const ordredMap: Map<string, number> = new Map();
  [...patches.keys()].sort().forEach((key) => {
    ordredMap.set(key, patches.get(key)!);
  })


	// Save images and weights.
  const weights: number[] = [];
  let label = 0;
	ordredMap.forEach((count, hash) => {
		weights.push(count);
    addTileForLabel(label++, patchesData.get(hash)!, N, N);
	});
	const numLabels = weights.length;
	// Compute the transitions.
  let aIndex = 0;
	const transition = createTransition(numLabels);
	ordredMap.forEach((_aCount, aHash) => {
		let bIndex = 0;
		const aData = patchesData.get(aHash)!;
    ordredMap.forEach((_bCount, bHash) => {
			const bData = patchesData.get(bHash)!;
			transition[0][aIndex][bIndex] = patchesMatchX(aData, bData, N);
			transition[1][aIndex][bIndex] = patchesMatchY(aData, bData, N);
			bIndex++;
		});
		aIndex++;
	});

	if (hasGround) {
		let g = 0;
		let groundFound = false;
    ordredMap.forEach((_count, hash) => {
			if (possiblyGround.get(hash) && transition[0][g][g]) {
				settings.ground = g;
				groundFound = true;
				return;
			}
			g++;
		});
		if (!groundFound) {
			throw new Error("Ground label not found.");
		}
	}

	const initialLabels = findInitialLabel(transition, numLabels, settings.size, settings.blockSize);
  return {
    weights,
    transition,
    numLabels,
    initialLabels
  }
}