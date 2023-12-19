import { ParsedInputBase, ParsedInputHead, createTransition } from "./parse-input";

export interface TiledModelConfig {
  name: string;
}
export async function parseTiledModel(node: Element, settings: ParsedInputHead, config: TiledModelConfig): Promise<ParsedInputBase> {
  const doc = await fetch('samples/' + config.name).then(res => res.text())
  const lines = doc.split('\n');

  lines.shift();
  lines.shift();
  lines.shift();


  const trim = (str) => str.replace(/^\s+/, '').replace(/\s+$/, '');
  const toInts = (str) => trim(str).split(/\s+/).map(x => parseInt(x, 10));

  const sizeLine = lines.shift()!;
  const [xSize, ySize, zSize] = toInts(sizeLine);

  const example: number[][][] = [];

  // Read in the size and create the example model.
  for (let x = 0; x < xSize; x++) {
    example[x] = [];
    for (let y = 0; y < ySize; y++) {
      example[x][y] = [];
    }
  }

  // Read in the labels in the example model.
  for (let z = 0; z < zSize; z++) {
    lines.shift();
    for (let x = 0; x < xSize; x++) {
      toInts(lines.shift()!).forEach((val, y) => {
        example[x][y][z] = val;
      });
    }
  }

  // Find the number of labels in the model.
  let numLabels = 0;
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        numLabels = Math.max(numLabels, example[x][y][z]);
      }
    }
  }
  numLabels++;

  // The transition describes which labels can be next to each other.
  // When transition[direction][labelA][labelB] is true that means labelA
  // can be just below labelB in the specified direction where x = 0, y = 1, z = 2.
  const transition = createTransition(numLabels);


  // Compute the transition.
  for (let x = 0; x < xSize - 1; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        const labelA = example[x][y][z];
        const labelB = example[x + 1][y][z];
        transition[0][labelA][labelB] = true;
      }
    }
  }
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize - 1; y++) {
      for (let z = 0; z < zSize; z++) {
        const labelA = example[x][y][z];
        const labelB = example[x][y + 1][z];
        transition[1][labelA][labelB] = true;
      }
    }
  }
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize - 1; z++) {
        const labelA = example[x][y][z];
        const labelB = example[x][y][z + 1];
        transition[2][labelA][labelB] = true;
      }
    }
  }

  // The number of labels of each type in the model.
  const labelCount: number[] = [];
  for (let i = 0; i < numLabels; i++) {
    labelCount[i] = 0;
  }
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      for (let z = 0; z < zSize; z++) {
        labelCount[example[x][y][z]]++;
      }
    }
  }

  // We could use the label count, but equal weight also works.
  const weights: number[] = [];
  for (let i = 0; i < numLabels; i++) {
    weights.push(1.0);
  }

  // Find the label that should initially appear at the very bottom.
  // And find the ground plane label.
  let bottomLabel = -1;
  let groundLabel = -1;

  const onBottom: number[] = [];
  for (let i = 0; i < numLabels; i++) {
    onBottom[i] = 0;
  }
  for (let x = 0; x < xSize; x++) {
    for (let y = 0; y < ySize; y++) {
      onBottom[example[x][y][0]]++;
    }
  }
  // The bottom and ground labels should be tileable and appear frequently.
  let bottomCount = 0;
  for (let i = 0; i < numLabels; i++) {
    if (transition[0][i][i] && transition[1][i][i] && (onBottom[i] > bottomCount)) {
      bottomLabel = i;
      bottomCount = onBottom[i];
    }
  }
  if (bottomLabel != -1) {
    let groundCount = 0;
    for (let i = 0; i < numLabels; i++) {
      if (transition[0][i][i] && transition[1][i][i] && transition[2][bottomLabel][i] &&
        transition[2][i][0] && (labelCount[i] > groundCount)) {
        groundLabel = i;
        groundCount = labelCount[i];
      }
    }
  }
  if (groundLabel == -1 || bottomLabel == -1) {
    const modifyInBlocks = (settings.blockSize[0] < settings.size[0] || settings.blockSize[1] < settings.size[1]);
    if (modifyInBlocks) {
      throw new Error("The example model has no tileable ground plane. The new model can not be modified in blocks.");
    }
  }
  const initialLabels: number[] = new Array(settings.size[2]);
  initialLabels[0] = bottomLabel;
  initialLabels[1] = groundLabel;

  for (let z = 0; z < settings.size[2]; z++) {
    if (z < zSize) {
      initialLabels[z] = example[0][0][z];
    } else {
      initialLabels[z] = 0;
    }
  }

  return {
    weights,
    transition,
    numLabels,
    initialLabels
  }
}