/**
 * Pure domain utilities for normalizing raw extracted text from DOCX and PDF documents.
 */

const BARE_PAGE_NUM_REGEX =
  /^(?:стр\.?|страница|page)?\s*[-–—]?\s*\d+\s*(?:(?:из|of|\/)\s*\d+)?\s*[-–—]?$/i;

// Matches question starts like "1.", "1)", "№1", "№ 1.", "Вопрос 1.", "Задание 1:"
const QUESTION_START_REGEX =
  /^(?:[○●•*▪▫◦–—\s-]*)?(?:(?:№|задание|вопрос)\s*)?\d+[.):-](?:\s+|$)/i;

// Matches option starts like "A.", "A)", "(A)", "[A]", "А.", "Б)", "В.", "Г)", "○ А)", "● B."
const OPTION_START_REGEX =
  /^(?:[○●•*▪▫◦–—\s-]*)?(?:\(\s*[A-Za-zА-Яа-я]\s*\)|\[\s*[A-Za-zА-Яа-я]\s*\]|[A-Za-zА-Яа-я]\s*[.):-])(?:\s+|$)/;

// Matches inline answer markers like "Ответ:", "Правильный ответ:", "Ответы:"
const ANSWER_MARKER_REGEX =
  /^(?:правильный\s+)?(?:ответ(?:ы)?|ключ(?:и)?|answers?|key)\s*[:.-]/i;

// Matches answer key section headers like "Ключи правильных ответов (Вариант 8)", "Ответы:"
const KEY_SECTION_HEADER_REGEX =
  /^(?:правильные\s+ответы|ключи\s+правильных\s+ответов|ответы(?:\s+к\s+тесту|\s+к\s+заданиям)?|ключи(?:\s+к\s+тесту|\s+ответов)?|answers?|keys?)(?:\s*\([^)]*\))?(?:\s+задания|\s+правильные\s+ответы)?\s*[:.-]?$/i;

// Matches section headers like "Часть 1. Одиночный выбор", "Раздел 2"
const SECTION_HEADER_REGEX = /^(?:часть\s+\d+|раздел\s+\d+)/i;

// Matches answer key line starts like "1. A", "1) B", "1-C", "1: D"
const KEY_LINE_REGEX = /^\d+[.):\-\s]+[A-Za-zА-Яа-я](?:[\s,;иA-Za-zА-Яа-я]|$)/;

/**
 * Checks if a line initiates a new structural block in an ENT question document.
 *
 * @param {string} line
 * @returns {boolean}
 */
export function isStructuralStart(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('```')) return true;
  if (KEY_SECTION_HEADER_REGEX.test(trimmed)) return true;
  if (SECTION_HEADER_REGEX.test(trimmed)) return true;
  if (QUESTION_START_REGEX.test(trimmed)) return true;
  if (OPTION_START_REGEX.test(trimmed)) return true;
  if (ANSWER_MARKER_REGEX.test(trimmed)) return true;
  if (KEY_LINE_REGEX.test(trimmed)) return true;
  return false;
}

/**
 * Normalizes raw text extracted from documents:
 * 1. Unifies line endings (\r\n -> \n)
 * 2. Replaces non-breaking and special spaces, strips zero-width chars
 * 3. Removes form feed page breaks (\f)
 * 4. Filters out bare page numbers and repeating running headers/footers
 * 5. Joins lines broken mid-sentence
 * 6. Collapses redundant blank lines
 *
 * @param {string} raw - Raw text from DOCX or PDF extraction.
 * @returns {string} Normalized text.
 */
export function normalizeDocumentText(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return '';
  }

  // 1. Unify line endings, spaces, zero-width chars, form feeds, and private-use symbols from PDF fonts
  const sanitized = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u202F\u1680\u2000-\u200A\u205F\u3000]/g, ' ')
    .replace(/\uE081/g, '(')
    .replace(/\uE082/g, ')')
    .replace(/[\uE088\uE089]/g, '-')
    .replace(/\uE092/g, ':')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\f/g, '\n');

  const initialLines = sanitized.split('\n').map((l) => l.trim());

  // 2. Identify repeating running headers / footers (lines repeating 3+ times that are not structural)
  const lineCounts = new Map();
  for (const line of initialLines) {
    if (
      line.length > 5 &&
      !isStructuralStart(line) &&
      !BARE_PAGE_NUM_REGEX.test(line)
    ) {
      lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
    }
  }

  const repetitiveHeaders = new Set();
  for (const [line, count] of lineCounts.entries()) {
    if (count >= 3) {
      repetitiveHeaders.add(line);
    }
  }

  // 3. Filter out headers/footers and bare page numbers
  const filteredLines = [];
  for (const line of initialLines) {
    if (!line) {
      filteredLines.push('');
      continue;
    }
    if (BARE_PAGE_NUM_REGEX.test(line)) {
      continue;
    }
    if (repetitiveHeaders.has(line)) {
      continue;
    }
    filteredLines.push(line);
  }

  // 4. Join lines broken mid-sentence while respecting code blocks and structural starts
  const processedLines = [];
  let inCodeBlock = false;

  for (let i = 0; i < filteredLines.length; i++) {
    const current = filteredLines[i];

    if (current.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(current);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(current);
      continue;
    }

    if (!current) {
      // Don't add consecutive empty lines
      if (
        processedLines.length > 0 &&
        processedLines[processedLines.length - 1] !== ''
      ) {
        processedLines.push('');
      }
      continue;
    }

    // Check if this line is a continuation of previous line
    if (processedLines.length === 0) {
      processedLines.push(current);
      continue;
    }

    const prevIndex = processedLines.length - 1;
    const prev = processedLines[prevIndex];
    const prevIsHeader =
      KEY_SECTION_HEADER_REGEX.test(prev) || SECTION_HEADER_REGEX.test(prev);

    if (prev === '' || isStructuralStart(current) || prevIsHeader) {
      processedLines.push(current);
    } else {
      // Continuation line: join with previous line
      // Check if previous line ended with soft hyphen or dash at word break
      if (/[a-zA-Zа-яА-ЯёЁ]-$/.test(prev)) {
        processedLines[prevIndex] = prev.slice(0, -1) + current;
      } else {
        processedLines[prevIndex] = `${prev} ${current}`;
      }
    }
  }

  // 5. Final cleanup: collapse blank lines and trim
  return processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
