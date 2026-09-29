/**
 * Reorders retrieved questions according to requested IDs.
 * Throws a descriptive error listing any IDs that were not found.
 *
 * @template {{ id: string }} T
 * @param {T[]} questions - List of questions retrieved from storage.
 * @param {string[]} requestedIds - Array of requested question IDs.
 * @returns {T[]} - Questions sorted according to requestedIds order.
 * @throws {Error} If one or more requested IDs are missing from the questions list.
 */
export function orderQuestionsByIds(questions, requestedIds) {
  if (!Array.isArray(requestedIds) || requestedIds.length === 0) {
    return [];
  }

  const map = new Map();
  if (Array.isArray(questions)) {
    for (const q of questions) {
      if (q && q.id) {
        map.set(q.id, q);
      }
    }
  }

  const missingIds = [];
  const ordered = [];

  for (const id of requestedIds) {
    const question = map.get(id);
    if (!question) {
      missingIds.push(id);
    } else {
      ordered.push(question);
    }
  }

  if (missingIds.length > 0) {
    throw new Error(
      `Вопросы со следующими ID не найдены: ${missingIds.join(', ')}`
    );
  }

  return ordered;
}
