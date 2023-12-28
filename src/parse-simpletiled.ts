import { ParsedInputBase, ParsedInputHead, createTransition, findInitialLabel } from "./parse-input";
import { _parseFloat, readXML, xml_getChildNodeWithAttribute } from "./xml-util";

export interface SimpleTiledConfig {
  name: string;
  subset: string | null;
}

function remove0(x: string | null): string {
  if (!x) { throw new Error(`Neighbor found with missing left/right element`); }
  return x.replace(/ 0$/, '');
}

const tileLookup: { [label: number]: { path: string, version: number } } = {};
export function getTileForLabel(label: number): { path: string, version: number } {
  return tileLookup[label];
}
function addTileForLabel(label: number, path: string, version: number): void {
  tileLookup[label] = { path, version }
}

export async function parseSimpleTiled(_node: Element, settings: ParsedInputHead, config: SimpleTiledConfig): Promise<ParsedInputBase> {
  const path = `samples/${config.name}/data.xml`;
  const xDataNode = await readXML(path);
  const xTilesNode = xDataNode.querySelector(':scope > tiles');
  if (!xTilesNode) { throw new Error(`No tiles available in ${path}.`); }
  const xNeighborsNode = xDataNode.querySelector('neighbors');
  if (!xNeighborsNode) { throw new Error(`No neighbors defined in ${path}.`); }

  const subset: string[] = [];
  if (config.subset) {
    const subsetsNode = xDataNode.querySelector("subsets");
    if (!subsetsNode) { throw new Error(`Requested subset ${config.subset}, but no subsets available.`); }
    const subsetNode = xml_getChildNodeWithAttribute(subsetsNode, "subset", "name", config.subset);
    if (!subsetNode) { throw new Error(`Requested subset ${config.subset} not found in file by that name.`); }
    const tiles = subsetNode.querySelectorAll('tile');
    if (tiles.length == 0) {
      throw new Error(`No tiles available in subset ${config.subset}`);
    }
    tiles.forEach(ele => subset.push(ele.getAttribute('name')!));
  }

  const names: string[] = [];
  const versionNums: number[] = [];
  const rotation: number[] = [];
  const reflection: number[] = [];

  const weights: number[] = [];

  const tiles = xTilesNode.querySelectorAll("tile");
  tiles.forEach(tileNode => {
    const weight = _parseFloat(tileNode, "weight", 1.0);
    const symmetry = tileNode.getAttribute("symmetry");
    const name = tileNode.getAttribute("name")!;
    if (subset.length > 0 && subset.indexOf(name!) == -1) {
      return;
    }
    const makeName = (name: string, j: number) => (j > 0) ? `${name} ${j}` : name;
    let versions = 1;
    const n = names.length;
    if (symmetry == "X") {
      versions = 1;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n);
        reflection.push(n);
      }
    } else if (symmetry == "I") {
      versions = 2;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n + 1 - j);
        reflection.push(n + j);
      }
    } else if (symmetry == "\\") {
      versions = 2;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n + 1 - j);
        reflection.push(n + 1 - j);
      }
    } else if (symmetry == "L") {
      versions = 4;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n + (j + 1) % 4);
        reflection.push(n + (j ^ 1));
      }
    }
    else if (symmetry == "T") {
      versions = 4;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n + (j + 1) % 4);
        reflection.push(n + (j % 2 == 0 ? j : 4 - j));
      }
    }
    else if (symmetry == "F") {
      versions = 8;
      for (let j = 0; j < versions; j++) {
        addTileForLabel(names.length, name, j);
        names.push(makeName(name, j));
        weights.push(weight);
        versionNums.push(j);
        rotation.push(n + (j + 1) % 4 + (j & 4));
        if (j == 0) {
          reflection.push(n + 4);
        } else if (j == 4) {
          reflection.push(n);
        } else {
          reflection.push(n + (8 - j));
        }
      }
    }
    else {
      throw new Error("File: " + path + ": Symmetry " + symmetry + " not supported.");
    }
  });

  const numLabels = names.length;
  const transition: boolean[][][] = createTransition(numLabels);

  const r = rotation;
  const f = reflection;

  const neighbors = xNeighborsNode.querySelectorAll("neighbor");
  if (!neighbors) { throw new Error(`No Neighbors founds under element neighbors in ${path}.`) }
  neighbors.forEach(neighborNode => {

    const left = remove0(neighborNode.getAttribute("left"));
    const right = remove0(neighborNode.getAttribute("right"));

    const a = names.indexOf(left);
    const b = names.indexOf(right);

    // One of the labels may be missing if we are using a subset.
    // In that case, ignore this pair of neighbors.
    if (a == -1 || b == -1) {
      return;
    }

    // Rotate the neighbors 90 degrees.
    transition[0][a][b] = true;
    transition[1][r[b]][r[a]] = true;
    transition[0][r[r[b]]][r[r[a]]] = true;
    transition[1][r[r[r[a]]]][r[r[r[b]]]] = true;

    // Reflect and rotate.
    transition[0][f[b]][f[a]] = true;
    transition[1][f[r[b]]][f[r[a]]] = true;
    transition[0][f[r[r[a]]]][f[r[r[b]]]] = true;
    transition[1][f[r[r[r[a]]]]][f[r[r[r[b]]]]] = true;
  });

  const initialLabels = findInitialLabel(transition, numLabels, settings.size, settings.blockSize);
  return {
    weights,
    transition,
    numLabels,
    initialLabels
  }
}