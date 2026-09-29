/**
 * Parses question text into alternating plain text and fenced code segments.
 *
 * Fenced code blocks are marked by triple backticks:
 * ```[language]
 * code line
 * ```
 *
 * Rules:
 * - Recognizes triple-backtick fences with optional language identifier.
 * - Keeps interior line breaks intact.
 * - Trims the single newline adjacent to opening and closing fences.
 * - Unclosed code fences are treated as plain text (never swallows remainder).
 * - Empty string or non-string input returns an empty array.
 *
 * @param {string} text - Raw markdown/question text.
 * @returns {Array<{ type: 'text'|'code', content: string, language?: string }>}
 */
export function parseQuestionText(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  const segments = [];
  const regex = /```([^\n\r`]*)(?:\r?\n)?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, matchStart),
      });
    }

    const fenceHeader = match[1];
    let body = match[2];

    let language = '';
    let content = body;

    const fullMatch = match[0];
    const hasNewline = /\r?\n/.test(fullMatch);

    if (hasNewline) {
      language = fenceHeader.trim();
      if (content.endsWith('\r\n')) {
        content = content.slice(0, -2);
      } else if (content.endsWith('\n')) {
        content = content.slice(0, -1);
      }
    } else {
      content = (fenceHeader + body).trim();
      language = '';
    }

    segments.push({
      type: 'code',
      content,
      language,
    });

    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}
