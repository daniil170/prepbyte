export const pythonQuestions = [
  // --- PYTHON: python_loops ---
  {
    id: 'py-loop-001',
    topic: 'python_loops',
    questionText:
      'Что выведет данный фрагмент кода на Python?\n```python\ns = 0\nfor i in range(1, 6):\n    if i % 2 == 0:\n        s += i\nprint(s)\n```',
    options: ['6', '15', '9', '4'],
    correctAnswers: [0],
    explanation:
      'Функция range(1, 6) генерирует числа 1, 2, 3, 4, 5. Условию четности (i % 2 == 0) удовлетворяют числа 2 и 4. Их сумма: 2 + 4 = 6.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'py-loop-002',
    topic: 'python_loops',
    questionText:
      'Какое значение примет переменная n после выполнения следующего цикла?\n```python\nn = 1\nwhile n < 20:\n    n *= 3\n```',
    options: ['18', '27', '9', '81'],
    correctAnswers: [1],
    explanation:
      'Итерации цикла: n=1 (<20) -> n=3; n=3 (<20) -> n=9; n=9 (<20) -> n=27; условие 27 < 20 ложно, цикл завершается. Итоговое значение n равно 27.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-loop-003',
    topic: 'python_loops',
    questionText:
      'Какие операторы в языке Python используются для непосредственного управления ходом выполнения циклов?',
    options: [
      'break (досрочное завершение цикла)',
      'continue (переход к следующей итерации)',
      'stop (остановка цикла)',
      'exit (выход из цикла)',
    ],
    correctAnswers: [0, 1],
    explanation:
      'В Python оператор break служит для немедленного выхода из цикла, а continue пропускает остаток тела цикла и переходит к следующей итерации. stop и exit не являются операторами циклов.',
    difficulty: 'easy',
    version: 1,
  },

  // --- PYTHON: python_functions ---
  {
    id: 'py-func-001',
    topic: 'python_functions',
    questionText:
      'Что выведет данный фрагмент программы?\n```python\ndef calc(a, b=5):\n    return a * b + 2\n\nprint(calc(3))\n```',
    options: ['17', '15', '21', '10'],
    correctAnswers: [0],
    explanation:
      'Параметр b имеет значение по умолчанию 5. При вызове calc(3) значение a=3, а b=5. Результат: 3 * 5 + 2 = 17.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'py-func-002',
    topic: 'python_functions',
    questionText:
      'Что будет выведено на экран в результате выполнения следующего генератора списка?\n```python\nlst = [1, 2, 3, 4, 5]\nres = [x**2 for x in lst if x % 2 != 0]\nprint(res)\n```',
    options: ['[1, 9, 25]', '[4, 16]', '[1, 4, 9, 16, 25]', '[1, 3, 5]'],
    correctAnswers: [0],
    explanation:
      'Условие x % 2 != 0 отбирает нечетные числа: 1, 3, 5. Каждый элемент возводится в квадрат (x**2): 1, 9, 25.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-func-003',
    topic: 'python_functions',
    questionText:
      'Какие из приведенных встроенных типов данных в Python относятся к неизменяемым (immutable)?',
    options: [
      'tuple (кортеж)',
      'str (строка)',
      'list (список)',
      'set (множество)',
      'int (целое число)',
    ],
    correctAnswers: [0, 1, 4],
    explanation:
      'В Python неизменяемыми являются числа (int, float), строки (str), кортежи (tuple) и frozenset. Списки (list) и множества (set) являются изменяемыми объектами.',
    difficulty: 'hard',
    version: 1,
  },
];
