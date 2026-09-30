/**
 * Factory for creating immutable chat messages for the AI study tutor.
 *
 * @param {object} params
 * @param {'user'|'assistant'|'system'} params.role
 * @param {string} params.content
 * @param {object} [params.meta={}]
 * @param {string} [params.id]
 * @param {number} [params.timestamp]
 * @returns {{ id: string, role: string, content: string, meta: object, timestamp: number }}
 */
export function createTutorMessage({
  role,
  content,
  meta = {},
  id,
  timestamp = Date.now(),
}) {
  if (!role || !['user', 'assistant', 'system'].includes(role)) {
    throw new Error(`Недопустимая роль сообщения тьютора: "${role}".`);
  }

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Текст сообщения не должен быть пустым.');
  }

  const generatedId =
    id ||
    `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  return Object.freeze({
    id: generatedId,
    role,
    content: content.trim(),
    meta: Object.freeze({ ...meta }),
    timestamp,
  });
}

/**
 * Formats a message history list for the Gemini/AI API content structure.
 *
 * @param {Array<object>} messages - List of tutor messages.
 * @returns {Array<{ role: string, parts: Array<{ text: string }> }>}
 */
export function formatMessagesForAi(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (m) => m && m.content && (m.role === 'user' || m.role === 'assistant')
    )
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}
