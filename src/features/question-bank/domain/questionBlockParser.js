const HOMOGLYPH_MAP = {
  А: 'A',
  В: 'B',
  С: 'C',
  Е: 'E',
  К: 'K',
  Н: 'H',
  О: 'O',
  Р: 'P',
  Х: 'X',
  М: 'M',
  Т: 'T',
};

export function normalizeLabel(label) {
  if (!label || typeof label !== 'string') return '';
  const trimmed = label.trim().toUpperCase();
  return HOMOGLYPH_MAP[trimmed] || trimmed;
}

const QUESTION_START_REGEX =
  /^(?:(?:№|задание|вопрос)\s*)?(\d+)[.):-](?:\s+(.*)|$)/i;

const OPTION_PREFIX_REGEX =
  /^(?:\(([A-Fa-fА-Еа-е])\)|\[([A-Fa-fА-Еа-е])\]|([A-Fa-fА-Еа-е])[.):-])\s*(.*)$/;

const MULTI_OPTION_LINE_REGEX =
  /(?:^|\s{2,}|\t+)(?:\(([A-Fa-fА-Еа-е])\)|\[([A-Fa-fА-Еа-е])\]|([A-Fa-fА-Еа-е])[.):-])\s+([^\t\n\r]*?)(?=(?:\s{2,}|\t+)(?:\([A-Fa-fА-Еа-е]\)|\[[A-Fa-fА-Еа-е]\]|[A-Fa-fА-Еа-е][.):-])|$)/g;

const ANSWER_MARKER_REGEX =
  /^(?:правильный\s+)?(?:ответ(?:ы)?|ключ(?:и)?|answers?|key)\s*[:.-]\s*(.*)$/i;

const EXPLANATION_MARKER_REGEX =
  /^(?:пояснение|решение|объяснение|explanation)\s*[:.-]\s*(.*)$/i;

const KEY_SECTION_HEADER_REGEX =
  /^(?:правильные\s+)?(?:ответы(?:\s+к\s+тесту|\s+к\s+заданиям)?|ключи(?:\s+к\s+тесту)?|answers?|keys?)\s*[:.-]?$/i;

/**
 * Checks if question text describes an unsupported format (matching task or image/table).
 *
 * @param {string} text
 * @returns {string|null} Reason if skipped, or null if supported.
 */
export function checkSkippedReason(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (
    lower.includes('установите соответствие') ||
    lower.includes('установить соответствие') ||
    lower.includes('соответствие между') ||
    lower.includes('сәйкестендіріңіз')
  ) {
    return 'Задание на установление соответствия не поддерживается';
  }

  if (
    lower.includes('на рисунке') ||
    lower.includes('на картинке') ||
    lower.includes('на изображении') ||
    lower.includes('см. рисунок') ||
    lower.includes('приведенном рисунке') ||
    lower.includes('изображен на рисунке') ||
    lower.includes('суретте') ||
    lower.includes('суретке')
  ) {
    return 'Задание ссылается на изображение или схему';
  }

  if (
    lower.includes('в таблице') ||
    lower.includes('из таблицы') ||
    lower.includes('приведенной таблиц') ||
    lower.includes('кестеде')
  ) {
    return 'Задание ссылается на внешнюю таблицу';
  }

  return null;
}

/**
 * Parses raw answer string into an array of clean answer labels.
 * Handles "A, C", "A; C", "A и C", "AC", "1B", etc.
 *
 * @param {string} raw
 * @returns {string[]}
 */
export function parseAnswerLabels(raw) {
  if (!raw || typeof raw !== 'string') return [];

  let cleaned = raw
    .replace(
      /^(?:правильный\s+)?(?:ответ(?:ы)?|ключ(?:и)?|answers?|key)\s*[:.-]?\s*/i,
      ''
    )
    .replace(/\s+(?:и|and)\s+/gi, ',')
    .trim();

  // If format is like "A, B, C", "A; B", "A B"
  let parts = cleaned
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && s.toLowerCase() !== 'и' && s.toLowerCase() !== 'and');

  // If it's a single part with multiple concatenated letters like "AC" or "BCD"
  if (parts.length === 1 && /^[A-Fa-fА-Еа-е]{2,6}$/.test(parts[0])) {
    parts = parts[0].split('');
  }

  return parts;
}

/**
 * Extracts external answer keys from an answer key section text.
 * Supports "1. B", "1) B", "1-B", "1: B", "1B 2C 3A", compact tables.
 *
 * @param {string} keysText
 * @returns {Map<number, string[]>} Map of question number to answer labels.
 */
export function parseAnswerKeySection(keysText) {
  const keysMap = new Map();
  if (!keysText || typeof keysText !== 'string') return keysMap;

  const lines = keysText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // 1. Try single line: "1. A, C", "1) B", "1-B", "1: B"
    const singleMatch = line.match(
      /^(\d+)[\s.):-]+([A-Fa-fА-Еа-е\s,;иand]+)$/i
    );
    if (singleMatch) {
      const qNum = parseInt(singleMatch[1], 10);
      const labels = parseAnswerLabels(singleMatch[2]);
      if (labels.length > 0) {
        keysMap.set(qNum, labels);
        continue;
      }
    }

    // 2. Try compact format on one line: "1. B 2. C 3. A" or "1B 2C 3A" or "1-A, 2-B"
    const compactMatches = [
      ...line.matchAll(
        /(?:^|[\s,;]+)(\d+)(?:[.):\-\s]*)([A-Fa-fА-Еа-е]+)(?=[\s,;]+|$)/gi
      ),
    ];
    if (compactMatches.length > 0) {
      for (const m of compactMatches) {
        const qNum = parseInt(m[1], 10);
        const rawLabel = m[2];
        const labels = parseAnswerLabels(rawLabel);
        if (labels.length > 0) {
          keysMap.set(qNum, labels);
        }
      }
    }
  }

  return keysMap;
}

/**
 * Resolves answer labels to zero-based option indices for a question.
 *
 * @param {string[]} answerLabels
 * @param {Array<{ label: string, text: string }>} options
 * @returns {{ indices: number[], isValid: boolean }}
 */
export function resolveAnswerIndices(answerLabels, options) {
  if (
    !answerLabels ||
    answerLabels.length === 0 ||
    !options ||
    options.length === 0
  ) {
    return { indices: [], isValid: false };
  }

  const normalizedOptionLabels = options.map((opt, idx) => {
    return normalizeLabel(opt.label) || String.fromCharCode(65 + idx);
  });

  const indices = [];

  for (const rawLabel of answerLabels) {
    const norm = normalizeLabel(rawLabel);
    let foundIndex = normalizedOptionLabels.indexOf(norm);

    // Fallback: Latin / Cyrillic alphabetical position
    if (foundIndex === -1) {
      const charCode = norm.charCodeAt(0);
      if (charCode >= 65 && charCode <= 70) {
        // A=65 -> 0, B=66 -> 1, ...
        const candidate = charCode - 65;
        if (candidate < options.length) {
          foundIndex = candidate;
        }
      }
    }

    if (foundIndex !== -1 && !indices.includes(foundIndex)) {
      indices.push(foundIndex);
    }
  }

  return {
    indices: indices.sort((a, b) => a - b),
    isValid: indices.length === answerLabels.length && indices.length > 0,
  };
}

/**
 * Parses normalized document text into structured question blocks.
 *
 * @param {string} text - Normalized document text.
 * @returns {{
 *   items: Array<{
 *     number: number,
 *     questionText: string,
 *     options: string[],
 *     rawOptions: Array<{ label: string, text: string }>,
 *     answerLabels: string[],
 *     correctAnswers: number[],
 *     explanation: string,
 *     status: 'ok' | 'warning' | 'error',
 *     issues: string[]
 *   }>,
 *   warnings: string[]
 * }}
 */
export function parseQuestionBlocks(text) {
  const items = [];
  const warnings = [];

  if (!text || typeof text !== 'string' || !text.trim()) {
    return { items, warnings };
  }

  // 1. Separate questions body from trailing answer key section if present
  const lines = text.split('\n');
  let keySectionIndex = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (KEY_SECTION_HEADER_REGEX.test(lines[i].trim())) {
      keySectionIndex = i;
      break;
    }
  }

  let bodyLines = lines;
  let externalKeys = new Map();

  if (keySectionIndex !== -1) {
    bodyLines = lines.slice(0, keySectionIndex);
    const keyLines = lines.slice(keySectionIndex + 1);
    externalKeys = parseAnswerKeySection(keyLines.join('\n'));
  }

  // 2. Parse questions from body lines
  let current = null;
  let currentSection = 'question'; // 'question' | 'option' | 'explanation'

  function finalizeCurrentQuestion() {
    if (!current) return;

    // Check external answer keys if inline key not found
    if (current.answerLabels.length === 0 && externalKeys.has(current.number)) {
      current.answerLabels = externalKeys.get(current.number);
    }

    const skippedReason = checkSkippedReason(current.questionText);
    if (skippedReason) {
      current.status = 'error';
      current.issues.push(skippedReason);
      warnings.push(`Задание №${current.number} пропущено: ${skippedReason}`);
    }

    // Validate options count
    if (current.options.length < 2) {
      current.status = 'error';
      current.issues.push('Менее 2 вариантов ответа');
    } else if (current.options.length > 6) {
      current.status = 'error';
      current.issues.push('Более 6 вариантов ответа');
    }

    // Validate answer keys
    if (current.answerLabels.length === 0 && !skippedReason) {
      current.status = 'error';
      current.issues.push('Отсутствует правильный ответ в тексте или ключе');
    } else if (current.options.length >= 2) {
      const resolved = resolveAnswerIndices(
        current.answerLabels,
        current.rawOptions
      );
      current.correctAnswers = resolved.indices;
      if (!resolved.isValid && !skippedReason) {
        current.status = 'error';
        current.issues.push('Ключ ответа указывает на несуществующий вариант');
      }
    }

    items.push({
      number: current.number,
      questionText: current.questionText.trim(),
      options: current.options,
      rawOptions: current.rawOptions,
      answerLabels: current.answerLabels,
      correctAnswers: current.correctAnswers,
      explanation: current.explanation.trim(),
      status: current.status,
      issues: current.issues,
    });

    current = null;
  }

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) continue;

    // Check for start of new question
    const qMatch = line.match(QUESTION_START_REGEX);
    if (qMatch) {
      finalizeCurrentQuestion();

      const qNum = parseInt(qMatch[1], 10);
      const remainingText = qMatch[2] || '';

      current = {
        number: qNum,
        questionText: remainingText,
        options: [],
        rawOptions: [],
        answerLabels: [],
        correctAnswers: [],
        explanation: '',
        status: 'ok',
        issues: [],
      };
      currentSection = 'question';
      continue;
    }

    if (!current) {
      continue;
    }

    // Check for inline answer marker ("Ответ: B")
    const ansMatch = line.match(ANSWER_MARKER_REGEX);
    if (ansMatch) {
      current.answerLabels = parseAnswerLabels(ansMatch[1]);
      currentSection = 'answer';
      continue;
    }

    // Check for explanation marker ("Пояснение: ...")
    const expMatch = line.match(EXPLANATION_MARKER_REGEX);
    if (expMatch) {
      current.explanation = expMatch[1] || '';
      currentSection = 'explanation';
      continue;
    }

    // Check for multiple options on a single line (e.g. "A) 1   B) 2   C) 3   D) 4")
    const multiMatches = [...line.matchAll(MULTI_OPTION_LINE_REGEX)];
    if (multiMatches.length >= 2) {
      for (const m of multiMatches) {
        const label = m[1] || m[2] || m[3];
        const optText = (m[4] || '').trim();
        current.rawOptions.push({ label, text: optText });
        current.options.push(optText);
      }
      currentSection = 'option';
      continue;
    }

    // Check for single option start ("A. Option text")
    const optMatch = line.match(OPTION_PREFIX_REGEX);
    if (optMatch) {
      const label = optMatch[1] || optMatch[2] || optMatch[3];
      const optText = (optMatch[4] || '').trim();
      current.rawOptions.push({ label, text: optText });
      current.options.push(optText);
      currentSection = 'option';
      continue;
    }

    // Continuation of current section
    if (currentSection === 'question') {
      current.questionText = current.questionText
        ? `${current.questionText}\n${line}`
        : line;
    } else if (currentSection === 'option' && current.options.length > 0) {
      const lastIdx = current.options.length - 1;
      current.options[lastIdx] = `${current.options[lastIdx]} ${line}`;
      current.rawOptions[lastIdx].text =
        `${current.rawOptions[lastIdx].text} ${line}`;
    } else if (currentSection === 'explanation') {
      current.explanation = current.explanation
        ? `${current.explanation}\n${line}`
        : line;
    }
  }

  finalizeCurrentQuestion();

  return { items, warnings };
}
