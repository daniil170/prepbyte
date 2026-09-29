/**
 * Resolves characters from left to right based on progress (0..1).
 * Unresolved characters display as binary digits ('0' or '1') while spaces are preserved.
 *
 * @param {string} targetText - The final text to reveal
 * @param {number} progress - Progress value between 0 and 1
 * @param {() => number} [randomFn=Math.random] - Injectable random generator
 * @returns {string} The scrambled or partially resolved string
 */
export function scrambleText(targetText, progress, randomFn = Math.random) {
  if (!targetText || typeof targetText !== 'string') {
    return '';
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const totalLength = targetText.length;

  if (clampedProgress >= 1) {
    return targetText;
  }

  const resolvedCount = Math.floor(clampedProgress * totalLength);

  let result = '';
  for (let i = 0; i < totalLength; i += 1) {
    const char = targetText[i];
    if (i < resolvedCount) {
      result += char;
    } else if (char === ' ') {
      result += ' ';
    } else {
      result += randomFn() < 0.5 ? '0' : '1';
    }
  }

  return result;
}
