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
  /^(?:[○●•*▪▫◦–—\s-]*)?(?:(?:№|задание|вопрос)\s*)?(\d+)[.):-](?:\s+(.*)|$)/i;

const OPTION_PREFIX_REGEX =
  /^(?:[○●•*▪▫◦–—\s-]*)?(?:\(\s*([A-Za-zА-Яа-я])\s*\)|\[\s*([A-Za-zА-Яа-я])\s*\]|([A-Za-zА-Яа-я])\s*[.):-])(?:\s+(.*)|$)/;

const MULTI_OPTION_LINE_REGEX =
  /(?:^|\s{2,}|\t+)(?:[○●•*▪▫◦–—\s-]*)?(?:\(\s*([A-Za-zА-Яа-я])\s*\)|\[\s*([A-Za-zА-Яа-я])\s*\]|([A-Za-zА-Яа-я])\s*[.):-])\s+([^\t\n\r]*?)(?=(?:\s{2,}|\t+)(?:[○●•*▪▫◦–—\s-]*)?(?:\([A-Za-zА-Яа-я]\)|\[[A-Za-zА-Яа-я]\]|[A-Za-zА-Яа-я][.):-])|$)/g;

const ANSWER_MARKER_REGEX =
  /^(?:правильный\s+)?(?:ответ(?:ы)?|ключ(?:и)?|answers?|key)\s*[:.-]\s*(.*)$/i;

const EXPLANATION_MARKER_REGEX =
  /^(?:пояснение|решение|объяснение|explanation)\s*[:.-]\s*(.*)$/i;

const KEY_SECTION_HEADER_REGEX =
  /^(?:правильные\s+ответы|ключи\s+правильных\s+ответов|ответы(?:\s+к\s+тесту|\s+к\s+заданиям)?|ключи(?:\s+к\s+тесту|\s+ответов)?|answers?|keys?)(?:\s*\([^)]*\))?(?:\s+задания|\s+правильные\s+ответы)?\s*[:.-]?$/i;

const HOMOGLYPH_CYR = {
  A: 'А',
  B: 'В',
  C: 'С',
  E: 'Е',
  K: 'К',
  M: 'М',
  H: 'Н',
  O: 'О',
  P: 'Р',
  T: 'Т',
  X: 'Х',
};

/**
 * Checks if text indicates a matching task (соответствие).
 * @param {string} text
 * @returns {boolean}
 */
export function isMatchingTaskPrompt(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('соотнесите') ||
    lower.includes('установите соответствие') ||
    lower.includes('установить соответствие') ||
    lower.includes('соответствие между') ||
    lower.includes('сәйкестендіріңіз')
  );
}

/**
 * Generates 4 clean multiple-choice options from a matching task answer key (e.g. "A-2, B-1").
 * Places the correct combination at index `(qNum - 1) % 4` and creates 3 logical distractors.
 *
 * @param {string} rawKey - Matching key string like "A-2, B-1" or "А-1, В-2"
 * @param {number} [qNum=1] - Question number to determine deterministic option slot.
 * @returns {{ options: string[], correctAnswers: number[] } | null}
 */
export function generateMatchingOptions(rawKey, qNum = 1) {
  if (!rawKey || typeof rawKey !== 'string') return null;

  const pairs = rawKey
    .split(/[,;\s]+/)
    .filter((s) => /[A-Za-zА-Яа-я]-\d+/.test(s));
  if (pairs.length === 0) return null;

  const parsedPairs = pairs.map((p) => {
    const [l, d] = p.split('-');
    const normLetter = l.trim().toUpperCase();
    const letter = HOMOGLYPH_CYR[normLetter] || normLetter;
    return { letter, digit: parseInt(d, 10) };
  });

  const correctStr = parsedPairs
    .map((p) => `${p.letter}-${p.digit}`)
    .join(', ');
  const usedDigits = parsedPairs.map((p) => p.digit);
  const maxDigit = Math.max(...usedDigits, 3);
  const allDigits = [];
  for (let d = 1; d <= Math.max(maxDigit, 3); d++) allDigits.push(d);

  const letters = parsedPairs.map((p) => p.letter);
  const combinations = new Set();
  combinations.add(correctStr);

  // Distractor 1: swap digits between pairs
  if (letters.length >= 2) {
    const swapped = `${letters[0]}-${parsedPairs[1].digit}, ${letters[1]}-${parsedPairs[0].digit}`;
    if (swapped !== correctStr) combinations.add(swapped);
  }

  // Distractors 2 & 3: variations with other digits
  for (const d1 of allDigits) {
    for (const d2 of allDigits) {
      if (d1 === d2 && letters.length >= 2) continue;
      const candidate = `${letters[0]}-${d1}, ${letters[1]}-${d2}`;
      if (combinations.size < 4) {
        combinations.add(candidate);
      }
    }
  }

  const combArray = Array.from(combinations);
  while (combArray.length < 4) {
    combArray.push(`${letters[0]}-${combArray.length + 1}, ${letters[1]}-1`);
  }

  const distractors = combArray.filter((s) => s !== correctStr).slice(0, 3);
  const correctIdx = Math.abs(qNum - 1) % 4;
  const options = [];
  let distractorIdx = 0;

  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) {
      options.push(correctStr);
    } else {
      options.push(distractors[distractorIdx++]);
    }
  }

  return {
    options,
    correctAnswers: [correctIdx],
  };
}

/**
 * Checks if question text describes an unsupported format (image/table).
 *
 * @param {string} text
 * @returns {string|null} Reason if skipped, or null if supported.
 */
export function checkSkippedReason(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (
    lower.includes('на рисунке') ||
    lower.includes('на картинке') ||
    lower.includes('на изображении') ||
    lower.includes('см. рисунок') ||
    lower.includes('приведенном рисунке') ||
    lower.includes('приведённом рисунке') ||
    lower.includes('изображен на рисунке') ||
    lower.includes('изображён на рисунке') ||
    lower.includes('суретте') ||
    lower.includes('суретке') ||
    lower.includes('сурет бойынша')
  ) {
    return 'Задание ссылается на изображение или схему';
  }

  if (
    lower.includes('в приведенной таблиц') ||
    lower.includes('в приведённой таблиц') ||
    lower.includes('согласно таблице') ||
    lower.includes('по таблице') ||
    lower.includes('рассмотрите таблицу') ||
    lower.includes('по данным таблицы') ||
    lower.includes('в таблице ниже') ||
    lower.includes('кесте бойынша') ||
    lower.includes('төмендегі кесте')
  ) {
    return 'Задание ссылается на внешнюю таблицу';
  }

  return null;
}

const RUS_ALPHABET = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'];
const LAT_ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Parses raw answer string into an array of clean answer labels.
 * Handles "A, C", "A; C", "A и C", "AC", "1B", "(B)", "[B]", etc.
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

  // If matching pair key format like "A-2, B-1" or "А-1, В-2"
  if (/[A-Za-zА-Яа-я]-\d+/.test(cleaned)) {
    return [cleaned];
  }

  // Strip wrapping parentheses or brackets like "(B)", "[B]" while preserving content
  cleaned = cleaned.replace(/[()[\]{}]/g, ' ').trim();

  // If format is like "A, B, C", "A; B", "A B"
  let parts = cleaned
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(
      (s) => Boolean(s) && s.toLowerCase() !== 'и' && s.toLowerCase() !== 'and'
    );

  // If it's a single part with multiple concatenated letters like "AC" or "BCD"
  if (parts.length === 1 && /^[A-Za-zА-Яа-я]{2,6}$/.test(parts[0])) {
    parts = parts[0].split('');
  }

  // Filter to valid answer labels only (single letters A-Z, А-Я)
  return parts.filter((s) => s.length === 1 && /^[A-Za-zА-Яа-я]$/.test(s));
}

/**
 * Extracts external answer keys from an answer key section text.
 * Supports "1. B", "1) B", "1-B", "1: B", "36: A, B, D | 37: A, B, D", "1B 2C 3A",
 * multi-column tables like "1 C 11 A 21 B", and multiple choice lists like "36 A, C, D".
 *
 * @param {string} keysText
 * @returns {Map<number, string[]>} Map of question number to answer labels.
 */
export function parseAnswerKeySection(keysText) {
  const keysMap = new Map();
  if (!keysText || typeof keysText !== 'string') return keysMap;

  // Clean lines: strip range headers like "1 - 10", "36 - 40"
  const lines = keysText
    .split('\n')
    .map((l) => l.replace(/\b\d+\s*[-–—]\s*\d+\b/g, ' ').trim())
    .filter(Boolean);

  for (let line of lines) {
    // Skip part/variant headers
    if (/^(?:часть|раздел|блок|вариант|тест)\s+\d+/i.test(line)) continue;
    // Skip lines that are purely table column headers like "№ Ответ № Ответ"
    if (/^(?:№\s+(?:ответ(?:ы)?|правильные\s+варианты)\s*)+$/i.test(line)) {
      continue;
    }
    // If line starts with "№ Ответ" followed by question number, strip the header prefix
    line = line
      .replace(/^(?:№\s+(?:ответ(?:ы)?|правильные\s+варианты)\s*)+/i, '')
      .trim();
    if (!line) continue;

    // Match question entries: (\d+) followed by answer text until pipe or next question entry
    const entryRegex =
      /(?:^|[|;\s]+)(\d+)\s*[:.)-]?\s*([A-Za-zА-Яа-я0-9\s,;иand()-]+?)(?=(?:[|;\s]+\d+\s*[:.)-]?\s*[A-Za-zА-Яа-я])|$)/g;
    let match;
    while ((match = entryRegex.exec(line)) !== null) {
      const qNum = parseInt(match[1], 10);
      const rawAns = match[2].trim();

      // If matching format like "A-2, B-1"
      if (/[A-Za-zА-Яа-я]-\d+/.test(rawAns)) {
        keysMap.set(qNum, [rawAns]);
        continue;
      }

      const labels = parseAnswerLabels(rawAns);
      if (labels.length > 0) {
        keysMap.set(qNum, labels);
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

  const rawOptionLabels = options.map((opt, idx) => {
    return (
      (opt?.label || '').trim().toUpperCase() ||
      String.fromCharCode(65 + idx)
    );
  });

  // Check if option labels follow the Cyrillic sequence А, Б, В, Г (detected by presence of 'Б')
  const hasCyrillicBe = rawOptionLabels.some((l) => l === 'Б');

  const normalizedOptionLabels = rawOptionLabels.map((l) => {
    if (hasCyrillicBe) {
      const cyrIdx = RUS_ALPHABET.indexOf(l);
      if (cyrIdx !== -1) {
        return LAT_ALPHABET[cyrIdx];
      }
    }
    return normalizeLabel(l);
  });

  const indices = [];

  for (const rawLabel of answerLabels) {
    const trimmed = (rawLabel || '').trim().toUpperCase();
    let norm = trimmed;

    if (hasCyrillicBe) {
      const cyrIdx = RUS_ALPHABET.indexOf(trimmed);
      if (cyrIdx !== -1) {
        norm = LAT_ALPHABET[cyrIdx];
      }
    }
    norm = normalizeLabel(norm);

    let foundIndex = normalizedOptionLabels.indexOf(norm);

    // Fallback: Latin / Cyrillic alphabetical position
    if (foundIndex === -1) {
      const charCode = norm.charCodeAt(0);
      if (charCode >= 65 && charCode <= 72) {
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

    if (current.isMatching) {
      const rawMatchingKey =
        current.answerLabels.find((s) => /[A-Za-zА-Яа-я]-\d+/.test(s)) ||
        (externalKeys.get(current.number) || []).find((s) =>
          /[A-Za-zА-Яа-я]-\d+/.test(s)
        );

      if (rawMatchingKey) {
        const generated = generateMatchingOptions(
          rawMatchingKey,
          current.number
        );
        if (generated) {
          current.options = generated.options;
          current.rawOptions = generated.options.map((t, idx) => ({
            label: String.fromCharCode(65 + idx),
            text: t,
          }));
          current.correctAnswers = generated.correctAnswers;
          current.status = 'ok';
          current.issues = [];
        }
      } else {
        const reason = 'Задание на установление соответствия не поддерживается';
        current.status = 'error';
        current.issues.push(reason);
        warnings.push(`Задание №${current.number} пропущено: ${reason}`);
      }
    } else {
      // Validate options count
      if (current.options.length < 2) {
        if (!skippedReason) {
          current.status = 'error';
          current.issues.push('Менее 2 вариантов ответа');
        }
      } else if (current.options.length > 6) {
        if (!skippedReason) {
          current.status = 'error';
          current.issues.push('Более 6 вариантов ответа');
        }
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

  const SECTION_HEADER_REGEX =
    /^(?:(?:часть|раздел|блок|вариант|тест)\s+\d+|структура\s+варианта)/i;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim();
    if (!line) continue;

    // Check for explicit section/variant headers (e.g. "Часть 2. Задания на соответствие")
    if (SECTION_HEADER_REGEX.test(line)) {
      finalizeCurrentQuestion();
      continue;
    }

    // Check for start of new question
    const qMatch = line.match(QUESTION_START_REGEX);
    let isNewQuestion = false;

    if (qMatch) {
      const nextNum = parseInt(qMatch[1], 10);
      if (!current) {
        isNewQuestion = true;
      } else if (nextNum > current.number) {
        const isExplicitHeader = /(?:№|задание|вопрос)\s*\d+/i.test(line);
        const isNextSequential = nextNum === current.number + 1;
        const hasOptions = current.options.length >= 2;
        const hasAnswers = current.answerLabels.length > 0;
        const isMatching = Boolean(current.isMatching);
        const isSkipped = Boolean(checkSkippedReason(current.questionText));

        if (isExplicitHeader || isNextSequential) {
          isNewQuestion = true;
        } else if (
          currentSection !== 'explanation' &&
          nextNum <= 100 &&
          (hasOptions || hasAnswers || isMatching || isSkipped)
        ) {
          isNewQuestion = true;
        }
      }
    }

    if (isNewQuestion) {
      finalizeCurrentQuestion();

      const qNum = parseInt(qMatch[1], 10);
      const remainingText = qMatch[2] || '';
      const isMatching = isMatchingTaskPrompt(remainingText);

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
        isMatching,
      };
      currentSection = 'question';
      continue;
    }

    if (!current) {
      continue;
    }

    if (!current.isMatching && isMatchingTaskPrompt(line)) {
      current.isMatching = true;
    }

    if (current.isMatching) {
      // Inline answer marker
      const ansMatch = line.match(ANSWER_MARKER_REGEX);
      if (ansMatch) {
        current.answerLabels = parseAnswerLabels(ansMatch[1]);
        currentSection = 'answer';
        continue;
      }

      // Inline explanation marker
      const expMatch = line.match(EXPLANATION_MARKER_REGEX);
      if (expMatch) {
        current.explanation = expMatch[1] || '';
        currentSection = 'explanation';
        continue;
      }

      if (currentSection === 'explanation') {
        current.explanation = current.explanation
          ? `${current.explanation}\n${line}`
          : line;
      } else {
        current.questionText = current.questionText
          ? `${current.questionText}\n${line}`
          : line;
      }
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

    // Options can only be parsed before the explanation section
    if (currentSection !== 'explanation') {
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
