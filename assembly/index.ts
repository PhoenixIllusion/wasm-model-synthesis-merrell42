import { srand } from "./rand";

export function set_random_seed(s: u32): void {
  srand(s);
}

export {
  create as PropagatorAc3_create,
  setBlockLabel as PropagatorAc3_setBlockLabel,
  removeLabel as PropagatorAc3_removeLabel,
  resetBlock as PropagatorAc3_resetBlock,
  isPossible as PropagatorAc3_isPossible,
  pickLabel as PropagatorAc3_pickLabel
} from './propagator-ac3-i'


export {
  create as PropagatorConfig_create,
  transition as PropagatorConfig_transition,
  weights as PropagatorConfig_weights
} from './propagator-config'