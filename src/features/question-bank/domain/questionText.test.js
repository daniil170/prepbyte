import { describe, expect, it } from 'vitest';
import { parseQuestionText } from './questionText';

describe('parseQuestionText', () => {
  it('returns an empty array for empty string or invalid input', () => {
    expect(parseQuestionText('')).toEqual([]);
    expect(parseQuestionText(null)).toEqual([]);
    expect(parseQuestionText(undefined)).toEqual([]);
  });

  it('returns a single text segment when there is no code', () => {
    const input = 'Какая шина в архитектуре компьютера отвечает за адресацию?';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'text',
        content: 'Какая шина в архитектуре компьютера отвечает за адресацию?',
      },
    ]);
  });

  it('parses one block with language', () => {
    const input = '```python\nfor i in range(5):\n    print(i)\n```';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'code',
        content: 'for i in range(5):\n    print(i)',
        language: 'python',
      },
    ]);
  });

  it('parses one block without language', () => {
    const input = '```\nSELECT * FROM users;\n```';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'code',
        content: 'SELECT * FROM users;',
        language: '',
      },
    ]);
  });

  it('parses text between blocks and preserves line breaks', () => {
    const input =
      'Что выведет код:\n```python\nx = [1, 2]\nprint(len(x))\n```\nПосле выполнения программы?';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'text',
        content: 'Что выведет код:\n',
      },
      {
        type: 'code',
        content: 'x = [1, 2]\nprint(len(x))',
        language: 'python',
      },
      {
        type: 'text',
        content: '\nПосле выполнения программы?',
      },
    ]);
  });

  it('parses several code blocks with text between them', () => {
    const input =
      'Блок 1:\n```python\na = 1\n```\nИ блок 2:\n```sql\nSELECT 1;\n```\nКонец.';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'text',
        content: 'Блок 1:\n',
      },
      {
        type: 'code',
        content: 'a = 1',
        language: 'python',
      },
      {
        type: 'text',
        content: '\nИ блок 2:\n',
      },
      {
        type: 'code',
        content: 'SELECT 1;',
        language: 'sql',
      },
      {
        type: 'text',
        content: '\nКонец.',
      },
    ]);
  });

  it('treats an unclosed fence as plain text and does not swallow remainder', () => {
    const input = 'Код ниже не закрыт:\n```python\nprint("hello")';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'text',
        content: 'Код ниже не закрыт:\n```python\nprint("hello")',
      },
    ]);
  });

  it('handles CRLF line breaks correctly', () => {
    const input = '```python\r\nx = 10\r\ny = 20\r\n```';
    expect(parseQuestionText(input)).toEqual([
      {
        type: 'code',
        content: 'x = 10\r\ny = 20',
        language: 'python',
      },
    ]);
  });
});
