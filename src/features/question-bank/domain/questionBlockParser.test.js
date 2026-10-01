import { describe, expect, it } from 'vitest';
import {
  normalizeLabel,
  parseAnswerKeySection,
  parseAnswerLabels,
  parseQuestionBlocks,
  resolveAnswerIndices,
} from './questionBlockParser';

describe('questionBlockParser', () => {
  it('normalizes homoglyph labels between Cyrillic and Latin', () => {
    expect(normalizeLabel('А')).toBe('A');
    expect(normalizeLabel('В')).toBe('B');
    expect(normalizeLabel('С')).toBe('C');
    expect(normalizeLabel('Е')).toBe('E');
    expect(normalizeLabel('Б')).toBe('Б'); // Unique Cyrillic
    expect(normalizeLabel('Г')).toBe('Г'); // Unique Cyrillic
  });

  it('parses multi-answer keys in various formats', () => {
    expect(parseAnswerLabels('A, C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('A,C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('A; C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('A и C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('A and C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('AC')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('A C')).toEqual(['A', 'C']);
    expect(parseAnswerLabels('Правильный ответ: A, C')).toEqual(['A', 'C']);
  });

  it('parses question block with Latin option labels and inline answer', () => {
    const text = `
1. Какая структура данных работает по принципу LIFO?
A. Очередь
B. Стек
C. Дерево
D. Граф
Ответ: B
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    const q = items[0];
    expect(q.number).toBe(1);
    expect(q.questionText).toBe(
      'Какая структура данных работает по принципу LIFO?'
    );
    expect(q.options).toEqual(['Очередь', 'Стек', 'Дерево', 'Граф']);
    expect(q.correctAnswers).toEqual([1]);
    expect(q.status).toBe('ok');
    expect(q.issues).toHaveLength(0);
  });

  it('parses question block with Cyrillic option labels and homoglyph В/B case', () => {
    const text = `
1. Выберите третий вариант в русском алфавитном списке.
А. Первый вариант
Б. Второй вариант
В. Третий вариант
Г. Четвертый вариант
Ответ: В
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    const q = items[0];
    expect(q.options).toHaveLength(4);
    // Cyrillic В is the 3rd option (index 2)
    expect(q.correctAnswers).toEqual([2]);
    expect(q.status).toBe('ok');
  });

  it('parses multi-answer question with multiple correct indices', () => {
    const text = `
1. Выберите языки со статической типизацией.
A. Python
B. C++
C. Java
D. JavaScript
Ответ: B, C
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].correctAnswers).toEqual([1, 2]);
    expect(items[0].status).toBe('ok');
  });

  it('parses answer key section at the end in different formats', () => {
    const text = `
1. Вопрос один
A. Вариант 1
B. Вариант 2
C. Вариант 3
D. Вариант 4

2. Вопрос два
A. Вариант 1
B. Вариант 2
C. Вариант 3
D. Вариант 4

3. Вопрос три
A. Вариант 1
B. Вариант 2
C. Вариант 3
D. Вариант 4

Ответы:
1. B
2) C, D
3-A
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(3);
    expect(items[0].correctAnswers).toEqual([1]);
    expect(items[1].correctAnswers).toEqual([2, 3]);
    expect(items[2].correctAnswers).toEqual([0]);
  });

  it('parses compact answer key format (e.g. 1B 2C 3A)', () => {
    const keysText = '1B 2C 3A';
    const keysMap = parseAnswerKeySection(keysText);
    expect(keysMap.get(1)).toEqual(['B']);
    expect(keysMap.get(2)).toEqual(['C']);
    expect(keysMap.get(3)).toEqual(['A']);
  });

  it('flags missing key as status error without crashing', () => {
    const text = `
1. Вопрос без ответа
A. Вариант 1
B. Вариант 2
C. Вариант 3
D. Вариант 4
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('error');
    expect(items[0].issues).toContain(
      'Отсутствует правильный ответ в тексте или ключе'
    );
  });

  it('flags out-of-range key label as error', () => {
    const text = `
1. Вопрос с некорректным ключом
A. Вариант 1
B. Вариант 2
Ответ: Z
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('error');
    expect(items[0].issues).toContain(
      'Ключ ответа указывает на несуществующий вариант'
    );
  });

  it('flags question with fewer than 2 options as error', () => {
    const text = `
1. Неполный вопрос
A. Единственный вариант
Ответ: A
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('error');
    expect(items[0].issues).toContain('Менее 2 вариантов ответа');
  });

  it('handles wrapped multi-line options and explanations', () => {
    const text = `
1. Что такое рекурсия?
A. Функция, которая
вызывает саму себя
в процессе работы
B. Обычный цикл
C. Переменная
D. Константа
Ответ: A
Пояснение: Рекурсия — это метод решения задачи,
когда функция вызывает саму себя.
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].options[0]).toBe(
      'Функция, которая вызывает саму себя в процессе работы'
    );
    expect(items[0].explanation).toBe(
      'Рекурсия — это метод решения задачи,\nкогда функция вызывает саму себя.'
    );
  });

  it('skips matching tasks and flags them with Russian reason', () => {
    const text = `
1. Установите соответствие между протоколами и уровнями модели OSI.
A. Вариант 1
B. Вариант 2
C. Вариант 3
D. Вариант 4
Ответ: A
`;
    const { items, warnings } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('error');
    expect(items[0].issues).toContain(
      'Задание на установление соответствия не поддерживается'
    );
    expect(warnings).toHaveLength(1);
  });

  it('skips questions referencing images or tables', () => {
    const text = `
1. Определите топологию сети, изображенную на рисунке.
A. Звезда
B. Кольцо
C. Шина
D. Сетка
Ответ: A
`;
    const { items, warnings } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('error');
    expect(items[0].issues).toContain(
      'Задание ссылается на изображение или схему'
    );
    expect(warnings).toHaveLength(1);
  });

  it('preserves code snippets inside question text', () => {
    const text = `
1. Что выведет код на Python?
\`\`\`python
x = 5
print(x * 2)
\`\`\`
A. 5
B. 10
C. 20
D. Ошибка
Ответ: B
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].questionText).toContain(
      '```python\nx = 5\nprint(x * 2)\n```'
    );
    expect(items[0].status).toBe('ok');
  });

  it('resolves answer indices correctly even when fallback to letter index is needed', () => {
    const options = [
      { label: 'A', text: 'Opt 1' },
      { label: 'B', text: 'Opt 2' },
      { label: 'C', text: 'Opt 3' },
    ];
    const res = resolveAnswerIndices(['B'], options);
    expect(res.isValid).toBe(true);
    expect(res.indices).toEqual([1]);
  });
});
