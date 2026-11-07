/**
 * Unbiased Fisher-Yates (Knuth) array shuffle with optional deterministic PRNG seed (Mulberry32).
 * Returns a new shuffled array without mutating the input array.
 * 
 * @template T
 * @param {T[]} array - The array to shuffle
 * @param {number|null} [seed=null] - Optional numeric seed (e.g. timestamp) for controlled permutations
 * @returns {T[]} A new shuffled copy of the array
 */
export function shuffleArray(array, seed = null) {
  if (!Array.isArray(array) || array.length <= 1) {
    return [...(array || [])];
  }

  const result = [...array];
  let random = Math.random;

  // Use Mulberry32 pseudo-random generator if a valid numeric seed is provided
  if (typeof seed === 'number' && Number.isFinite(seed) && seed !== 0) {
    let s = Math.abs(Math.floor(seed)) >>> 0;
    random = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
