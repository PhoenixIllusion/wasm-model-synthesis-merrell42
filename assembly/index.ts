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
  pickLabel as PropagatorAc3_pickLabel,
  free as PropagatorAc3_free
} from './propagator-ac3-i'

export {
  create as PropagatorAc4_create,
  setBlockLabel as PropagatorAc4_setBlockLabel,
  removeLabel as PropagatorAc4_removeLabel,
  resetBlock as PropagatorAc4_resetBlock,
  isPossible as PropagatorAc4_isPossible,
  pickLabel as PropagatorAc4_pickLabel,
  free as PropagatorAc4_free
} from './propagator-ac4-i'

export {
  create as PropagatorConfig_create,
  ptr_transition as PropagatorConfig_ptr_transition,
  ptr_weights as PropagatorConfig_ptr_weights, 
  ptr_supporting as PropagatorConfig_ptr_supporting,
  ptr_supportingCount as PropagatorConfig_ptr_supportingCount,
  free as PropagatorConfig_free
} from './propagator-config'