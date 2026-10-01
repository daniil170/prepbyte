import { describe, expect, it } from 'vitest';
import {
  isStructuralStart,
  normalizeDocumentText,
} from './documentNormalization';

describe('documentNormalization', () => {
  it('handles empty or non-string input gracefully', () => {
    expect(normalizeDocumentText('')).toBe('');
    expect(normalizeDocumentText(null)).toBe('');
    expect(normalizeDocumentText(undefined)).toBe('');
    expect(normalizeDocumentText('   \n  \t  ')).toBe('');
  });

  it('unifies CRLF, CR and cleans non-breaking spaces and zero-width characters', () => {
    const raw = 'Line 1\r\nLine\u00A02\rLine\u200B 3';
    expect(normalizeDocumentText(raw)).toBe('Line 1 Line 2 Line 3');
  });

  it('drops bare page numbers in various formats', () => {
    const raw = `
1. Первый вопрос
A. Вариант 1
B. Вариант 2
42
- 5 -
Стр. 6
Страница 7 из 20
2. Второй вопрос
A. Вариант A
B. Вариант B
`;
    const normalized = normalizeDocumentText(raw);
    expect(normalized).not.toMatch(/^42$/m);
    expect(normalized).not.toMatch(/^- 5 -$/m);
    expect(normalized).not.toMatch(/^Стр\. 6$/m);
    expect(normalized).not.toMatch(/^Страница 7 из 20$/m);
    expect(normalized).toContain('1. Первый вопрос');
    expect(normalized).toContain('2. Второй вопрос');
  });

  it('drops repetitive running headers and footers appearing 3+ times', () => {
    const header = 'ЕНТ 2026 Информатика Тестовый Вариант';
    const raw = `
${header}
1. Вопрос один
A. Ответ один
${header}
2. Вопрос два
A. Ответ два
${header}
3. Вопрос три
A. Ответ три
`;
    const normalized = normalizeDocumentText(raw);
    expect(normalized).not.toContain(header);
    expect(normalized).toContain('1. Вопрос один');
    expect(normalized).toContain('2. Вопрос два');
    expect(normalized).toContain('3. Вопрос три');
  });

  it('joins lines broken mid-sentence and handles hyphenated word breaks', () => {
    const raw = `
1. В архитектуре персональных
компьютеров оперативная память
используется для быстрой обра-
ботки данных.
A. Первый вариант
ответа
B. Второй вариант
`;
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toContain(
      '1. В архитектуре персональных компьютеров оперативная память используется для быстрой обработки данных.'
    );
    expect(normalized).toContain('A. Первый вариант ответа');
    expect(normalized).toContain('B. Второй вариант');
  });

  it('preserves code blocks without joining internal lines', () => {
    const raw = `
1. Что выведет фрагмент кода?
\`\`\`python
a = 10
b = 20
print(a + b)
\`\`\`
A. 10
B. 30
`;
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toContain(
      '```python\na = 10\nb = 20\nprint(a + b)\n```'
    );
    expect(normalized).toContain('A. 10');
    expect(normalized).toContain('B. 30');
  });

  it('isStructuralStart correctly detects questions, options, and answer keys', () => {
    expect(isStructuralStart('1. Вопрос')).toBe(true);
    expect(isStructuralStart('1) Вопрос')).toBe(true);
    expect(isStructuralStart('№1. Вопрос')).toBe(true);
    expect(isStructuralStart('Задание 5:')).toBe(true);
    expect(isStructuralStart('A. Вариант')).toBe(true);
    expect(isStructuralStart('А) Вариант')).toBe(true);
    expect(isStructuralStart('С) Вариант')).toBe(true);
    expect(isStructuralStart('○ А) Вариант')).toBe(true);
    expect(isStructuralStart('● B. Вариант')).toBe(true);
    expect(isStructuralStart('* C) Вариант')).toBe(true);
    expect(isStructuralStart('(B) Вариант')).toBe(true);
    expect(isStructuralStart('[C] Вариант')).toBe(true);
    expect(isStructuralStart('Ответ: A')).toBe(true);
    expect(isStructuralStart('Правильный ответ: B, C')).toBe(true);
    expect(isStructuralStart('Ключи правильных ответов (Вариант 8)')).toBe(
      true
    );
    expect(isStructuralStart('Часть 1. Одиночный выбор')).toBe(true);
    expect(isStructuralStart('1. A')).toBe(true);
    expect(isStructuralStart('1) B')).toBe(true);
    expect(isStructuralStart('1-C')).toBe(true);
    expect(isStructuralStart('Обычная строка продолжения текста')).toBe(false);
  });

  it('unifies private-use PDF characters for brackets, colons, and dashes', () => {
    const raw =
      '1. Вопрос\n○ А \uE082 Текст\nКлючи правильных ответов \uE081 Вариант 8 \uE082\n36 \uE092 A, B | 1 \uE088 B';
    const normalized = normalizeDocumentText(raw);
    expect(normalized).toContain('○ А ) Текст');
    expect(normalized).toContain('Ключи правильных ответов ( Вариант 8 )');
    expect(normalized).toContain('36 : A, B | 1 - B');
  });
});
