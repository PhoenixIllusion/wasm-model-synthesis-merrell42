import { NativeInputSetting } from "./native-input";
import { parseOverlapping } from "./parse-overlapping";
import { parseSimpleTiled } from "./parse-simpletiled";
import { parseTiledModel } from "./parse-tiled-model";
import { _parseBool, _parseInt } from "./xml-util";

export interface ParsedInputHead {
	name: string;
	type: string;
	size: [number, number, number];
	blockSize: [number, number, number];
	periodic: boolean;
	numDims: number;
	ground: number;
}

export interface ParsedInputBase {
	weights: number[];
	numLabels: number;
	transition: boolean[][][];
	initialLabels: number[];
}

export const parseInputHead = (node: Element): ParsedInputHead => {
	const name = node.getAttribute("name")!;
	const size: [number, number, number] = [0, 0, 0];
	size[0] = _parseInt(node, "width", 0);
	size[1] = _parseInt(node, "length", 0);
	size[2] = _parseInt(node, "height", 0);
	const blockSize: [number, number, number] = [0, 0, 0];
	blockSize[0] = _parseInt(node, "blockWidth", 0);
	blockSize[1] = _parseInt(node, "blockLength", 0);
	blockSize[2] = _parseInt(node, "blockHeight", 0);

	// Switch length and height if length is 0.
	if (size[1] == 0) {
		const temp = size[2];
		size[2] = size[1];
		size[1] = temp;
	}
	size[2] = Math.max(size[2], 1);	// Compute the block size if not given or if too large.

	for (let dim = 0; dim < 3; dim++) {
		if (blockSize[dim] > size[dim]) {
			console.error("ERROR: The block size cannot be larger than the output size.");
			blockSize[dim] = size[dim];
		}
		if (blockSize[dim] == 0) {
			blockSize[dim] = size[dim];
		}
	}
	const periodic = _parseBool(node, "periodic", false);
	if (periodic && (blockSize[0] < size[0] || blockSize[1] < size[1])) {
		console.error("Periodic not implemented when modifying in blocks.");
	}
	const type = node.tagName;
	const numDims = (type === 'tiledmodel') ? 3 : 2;
	let ground = -1;
	if (type === 'overlapping') {
		const hasGround = _parseInt(node, 'ground', 1234) !== 1234;
		ground = (hasGround) ? 1 : -1;
	}

	return { name, type, size, blockSize, periodic, numDims, ground };
}

export function findInitialLabel(transition: boolean[][][], numLabels: number, size: [number, number, number], blockSize: [number, number, number]): number[] {
	const initialLabels = [0];
	let groundFound = false;
	for (let i = 0; i < numLabels; i++) {
		if (transition[0][i][i] && transition[1][i][i]) {
			initialLabels[0] = i;
			groundFound = true;
			break;
		}
	}
	const modifyInBlocks = (blockSize[0] < size[0] || blockSize[1] < size[1]);
	if (modifyInBlocks && !groundFound) {
		throw new Error("The example model has no tileable ground plane. The new model can not be modified in blocks.");
	}
	return initialLabels;
}
export function createTransition(numLabels: number): boolean[][][] {
	const transition: boolean[][][] = [];
	for (let dir = 0; dir < 3; dir++) {
		transition[dir] = []
		for (let i = 0; i < numLabels; i++) {
			transition[dir][i] = []
			for (let j = 0; j < numLabels; j++) {
				transition[dir][i][j] = false;
			}
		}
	}
	return transition;
}


function computeSupport(transition: boolean[][][], numLabels: number, numDims: number): {
	supporting: number[][][],
	supportCount: number[][]
} {
	const N = numLabels;
	const supporting: number[][][] = [];
	const supportCount: number[][] = [];
	const numDirections = 2 * numDims;
	for (let c = 0; c < N; c++) {
		const supportingC: number[][] = [];
		const supportCountC: number[] = [];
		for (let dir = 0; dir < numDirections; dir++) {
			const supportingDir: number[] = [];
			const dim = Math.floor(dir / 2);
			const sign = dir % 2 == 0;
			if (sign) {
				for (let b = 0; b < N; b++) {
					if (transition[dim][b][c]) {
						// b supports c in direction dir.
						supportingDir.push(b);
					}
				}
			}
			else {
				for (let b = 0; b < N; b++) {
					if (transition[dim][c][b]) {
						// b supports c in direction dir.
						supportingDir.push(b);
					}
				}
			}
			supportingC[dir] = supportingDir;
			supportCountC[dir ^ 1] = supportingDir.length;
		}
		supporting[c] = supportingC;
		supportCount[c] = supportCountC;
	}

	return { supporting, supportCount };
}

export const parseInput = async (node: Element, useAc4: boolean): Promise<NativeInputSetting> => {
	const head = parseInputHead(node);
	const name = head.name;
	if (head.type === 'simpletiled') {
		const subset = node.getAttribute("subset");
		const base = await parseSimpleTiled(node, head, { name, subset });
		return {
			...head, ...base, ...computeSupport(base.transition, base.numLabels, head.numDims), useAc4
		}
	} else if (head.type === 'overlapping') {
		const N = _parseInt(node, "N", 0);
		const periodicInput = _parseBool(node, "periodicInput", true);
		const symmetry = _parseInt(node, "symmetry", 8);
		const base = await parseOverlapping(node, head, { name, N, periodicInput, symmetry });
		return {
			...head, ...base, ...computeSupport(base.transition, base.numLabels, head.numDims), useAc4
		}
	} else if (head.type === 'tiledmodel') {
		const base = await parseTiledModel(node, head, { name });
		return {
			...head, ...base, ...computeSupport(base.transition, base.numLabels, head.numDims), useAc4
		}
	}
	throw new Error('Unable to handle type: ' + head.type)
}