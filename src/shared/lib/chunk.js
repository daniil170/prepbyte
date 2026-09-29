/**
 * Splits an array into chunks of the specified maximum size.
 *
 * @template T
 * @param {T[]} array - The array to split.
 * @param {number} size - Maximum size of each chunk.
 * @returns {T[][]}
 */
export function chunk(array, size) {
  if (!Array.isArray(array) || typeof size !== 'number' || size <= 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
