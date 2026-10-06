import { describe, expect, it } from 'vitest';
import {
  generateMatchingOptions,
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
    // Cyrillic В is the 3rd option in [А, Б, В, Г] (index 2)
    expect(q.correctAnswers).toEqual([2]);
    expect(q.status).toBe('ok');
  });

  it('maps Latin key B to option index 1 when options are Russian А, Б, В, Г', () => {
    const text = `
6. Защищённый удалённый терминальный доступ
А) Telnet
Б) SSH
В) FTP
Г) RDP
Ответ: B
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    const q = items[0];
    expect(q.options[1]).toBe('SSH');
    expect(q.correctAnswers).toEqual([1]);
    expect(q.status).toBe('ok');
  });

  it('correctly parses bracketed answer keys like (B) or [B]', () => {
    expect(parseAnswerLabels('(B)')).toEqual(['B']);
    expect(parseAnswerLabels('[B]')).toEqual(['B']);
    expect(parseAnswerLabels('(A), (C)')).toEqual(['A', 'C']);
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

  it('parses bulleted options and Cyrillic С correctly', () => {
    const text = `
1. Какая шина связывает процессор с оперативной памятью?
○ А) Южный мост
○ В) Северный мост
○ С) SATA
○ D) USB

Ключи правильных ответов (Вариант 8)
1 - В
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].options).toEqual([
      'Южный мост',
      'Северный мост',
      'SATA',
      'USB',
    ]);
    expect(items[0].correctAnswers).toEqual([1]);
    expect(items[0].status).toBe('ok');
  });

  it('parses pipe-separated multi-answer keys across table lines', () => {
    const text = `
36. Вопрос 36
A) Вариант 1
B) Вариант 2
C) Вариант 3
D) Вариант 4

37. Вопрос 37
A) Вариант 1
B) Вариант 2
C) Вариант 3
D) Вариант 4

Ключи правильных ответов:
36 - 40
36: A, B, D | 37: A, B, D
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(2);
    expect(items[0].correctAnswers).toEqual([0, 1, 3]);
    expect(items[1].correctAnswers).toEqual([0, 1, 3]);
  });

  it('does not skip SQL questions containing "из таблицы" as visual tables', () => {
    const text = `
17. Какой оператор SQL удаляет строки из таблицы с сохранением структуры?
A) DROP
B) DELETE
C) REMOVE
D) TRUNCATE
Ответ: B
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('ok');
    expect(items[0].issues).toHaveLength(0);
  });

  it('skips "Соотнесите" matching tasks with descriptive reason', () => {
    const text = `
31. Соотнесите логические операции с их элементами:
A) И
B) НЕ
Ответ: A
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].issues).toContain(
      'Задание на установление соответствия не поддерживается'
    );
  });

  it('correctly parses multi-column exam tables and multiple choice keys without false positives', () => {
    const keysText = `
Часть 1. Одиночный выбор
№   Ответ   №   Ответ   №   Ответ
1   C   11   A   21   B
2   B   12   B   22   A
Часть 2. Задания на соответствие
№   Ответ 31   A-2, B-1 32   A-1, B-2
Часть 3. Множественный выбор
№   Правильные варианты
36   A, C, D
37   A, C, E
`;
    const keysMap = parseAnswerKeySection(keysText);
    expect(keysMap.get(1)).toEqual(['C']);
    expect(keysMap.get(11)).toEqual(['A']);
    expect(keysMap.get(21)).toEqual(['B']);
    expect(keysMap.get(2)).toEqual(['B']);
    expect(keysMap.get(31)).toEqual(['A-2, B-1']);
    expect(keysMap.get(36)).toEqual(['A', 'C', 'D']);
    expect(keysMap.get(37)).toEqual(['A', 'C', 'E']);
  });

  it('does not create phantom questions from numbered sub-lists inside questions or matching tasks', () => {
    const text = `
30. Что выведет код?
nums = (10, 20)
A) (10, 20)
B) [10, 20]
Ответ: A

Часть 2. Задания на соответствие (Вопросы 31–35)

31. Установите соответствие между уровнями OSI и функциями:
Уровни OSI:
А) Транспортный уровень
В) Сетевой уровень
Функции:
1. Маршрутизация пакетов
2. Обеспечение сквозной передачи
3. Передача потока битов

Часть 3. Несколько правильных ответов

36. Устройства ввода:
A) Сканер
B) Клавиатура
C) Монитор
Ответ: A, B
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(3);
    expect(items[0].number).toBe(30);
    expect(items[0].options).toEqual(['(10, 20)', '[10, 20]']);
    expect(items[0].status).toBe('ok');

    expect(items[1].number).toBe(31);
    expect(items[1].issues).toContain(
      'Задание на установление соответствия не поддерживается'
    );

    expect(items[2].number).toBe(36);
    expect(items[2].options).toEqual(['Сканер', 'Клавиатура', 'Монитор']);
    expect(items[2].correctAnswers).toEqual([0, 1]);
    expect(items[2].status).toBe('ok');
  });

  it('generates 4 valid multiple choice combinations for matching key', () => {
    const res = generateMatchingOptions('A-2, B-1', 31);
    expect(res).not.toBeNull();
    expect(res.options).toHaveLength(4);
    expect(res.correctAnswers).toHaveLength(1);
    const correctOpt = res.options[res.correctAnswers[0]];
    expect(correctOpt).toBe('А-2, В-1');
  });

  it('converts matching question into fully supported multiple choice when pair key is provided', () => {
    const text = `
31. Установите соответствие между уровнями OSI и функциями:
Уровни OSI:
А) Транспортный уровень
В) Сетевой уровень
Функции:
1. Маршрутизация пакетов
2. Обеспечение сквозной передачи
3. Передача потока битов

Ответы:
31 A-2, B-1
`;
    const { items } = parseQuestionBlocks(text);
    expect(items).toHaveLength(1);
    expect(items[0].number).toBe(31);
    expect(items[0].status).toBe('ok');
    expect(items[0].issues).toHaveLength(0);
    expect(items[0].options).toHaveLength(4);
    expect(items[0].correctAnswers).toEqual([2]);
    expect(items[0].options[2]).toBe('А-2, В-1');
    expect(items[0].questionText).toContain('Уровни OSI:');
    expect(items[0].questionText).toContain('Функции:');
  });
});
