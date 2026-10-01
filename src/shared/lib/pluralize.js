/**
 * Pure helper for Russian pluralization.
 * Selects the grammatically correct word form according to Slavic plural rules.
 *
 * Rules:
 * - 1, 21, 101, ... -> 'one' (вопрос)
 * - 2-4, 22-24, 102-104, ... -> 'few' (вопроса)
 * - 5-20, 11-14, 25-30, ... -> 'many' (вопросов)
 * - Zero and negative numbers are handled via their absolute value.
 *
 * @param {number} count - Quantity to determine word form for.
 * @param {[string, string, string]} forms - Array of [one, few, many] forms (e.g. ['вопрос', 'вопроса', 'вопросов']).
 * @returns {string} The appropriate word form.
 */
export function pluralize(count, forms, maybeFew, maybeMany) {
  let one = '';
  let few = '';
  let many = '';

  if (Array.isArray(forms)) {
    [one, few, many] = forms;
  } else if (typeof forms === 'string') {
    one = forms;
    few = maybeFew ?? forms;
    many = maybeMany ?? few;
  }

  const num = Math.abs(Math.floor(Number(count) || 0));
  const mod100 = num % 100;
  const mod10 = num % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
}
