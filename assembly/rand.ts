let seed: u64;

export function srand(s: u32): void {
  seed = (s - 1) as u64;
}
export const RAND_MAX: f32 = 2.14748365e+09;
export function rand(): i32 {
  let _seed = seed;
  _seed = (6364136223846793005 * _seed) + 1;
  seed = _seed;
  return (_seed >> 33) as u32;
}