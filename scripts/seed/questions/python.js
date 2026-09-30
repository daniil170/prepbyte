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
  {
    id: 'py-loop-004',
    topic: 'python_loops',
    questionText:
      'Что выведет следующий фрагмент программы на Python?\n```python\ns = 0\nfor i in range(10, 0, -2):\n    s += i\nprint(s)\n```',
    options: ['20', '25', '30', '40'],
    correctAnswers: [2],
    explanation:
      'Функция range(10, 0, -2) генерирует последовательность с шагом -2: 10, 8, 6, 4, 2 (число 0 не включается). Сумма элементов: 10 + 8 + 6 + 4 + 2 = 30.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'py-loop-005',
    topic: 'python_loops',
    questionText:
      'Какое значение будет выведено на экран после выполнения следующего кода?\n```python\nword = "informatika"\ncount = 0\nfor ch in word:\n    if ch in "aeiou":\n        continue\n    count += 1\nprint(count)\n```',
    options: ['5', '6', '11', '7'],
    correctAnswers: [1],
    explanation:
      'В слове "informatika" 11 букв. Гласные буквы: i, o, a, i, a (всего 5 штук). Для них срабатывает оператор continue, пропуская увеличение счетчика. Счетчик count увеличивается только для согласных букв (n, f, r, m, t, k), которых ровно 6.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-loop-006',
    topic: 'python_loops',
    questionText:
      'Что будет выведено в результате работы вложенных циклов?\n```python\nres = 0\nfor i in range(1, 4):\n    for j in range(i):\n        res += 1\nprint(res)\n```',
    options: ['9', '3', '12', '6'],
    correctAnswers: [3],
    explanation:
      'Внешний цикл принимает значения i = 1, 2, 3. При i=1 внутренний цикл выполняется 1 раз (j in range(1)); при i=2 — 2 раза; при i=3 — 3 раза. Общее число увеличений переменной res: 1 + 2 + 3 = 6.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-loop-007',
    topic: 'python_loops',
    questionText:
      'Какое значение переменной x будет напечатано после выполнения цикла?\n```python\nx = 15\nwhile x > 0:\n    x -= 4\n    if x == 7:\n        break\nprint(x)\n```',
    options: ['7', '3', '-1', '0'],
    correctAnswers: [0],
    explanation:
      'Пошаговое выполнение: 1) x = 15 > 0, x становится 15 - 4 = 11, условие 11 == 7 ложно; 2) x = 11 > 0, x становится 11 - 4 = 7, условие 7 == 7 истинно, срабатывает break. Цикл прерывается, x равен 7.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'py-loop-008',
    topic: 'python_loops',
    questionText:
      'Какие из приведенных утверждений о циклах в языке Python являются верными?',
    options: [
      'Блок else у цикла for выполняется, если цикл завершился без вызова оператора break',
      'Функция range(5) генерирует последовательность целых чисел от 1 до 5 включительно',
      'Оператор continue немедленно прерывает текущую итерацию и переходит к следующей',
      'Тело цикла while выполняется до тех пор, пока проверяемое условие остается ложным',
      'В теле цикла for запрещено использовать условия ветвления if',
    ],
    correctAnswers: [0, 2],
    explanation:
      'Верные утверждения: блок else после цикла выполняется, только если выход произошел естественным путем без break; continue пропускает остаток текущей итерации. range(5) возвращает числа от 0 до 4; цикл while работает, пока условие истинно; ветвление if разрешено внутри циклов.',
    difficulty: 'medium',
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
  {
    id: 'py-func-004',
    topic: 'python_functions',
    questionText:
      'Что выведет данный срез строки в Python?\n```python\ns = "PrepByte"\nprint(s[1:6:2])\n```',
    options: ['rpy', 'rep', 'rpB', 'reBy'],
    correctAnswers: [0],
    explanation:
      'Синтаксис среза s[start:stop:step]: start=1 (буква "r"), stop=6 (до индекса 6 не включая), step=2. Выбираются символы с индексами 1, 3, 5: s[1]="r", s[3]="p", s[5]="y". Итоговая строка: "rpy".',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'py-func-005',
    topic: 'python_functions',
    questionText:
      'Что выведет рекурсивная функция при вызове f(5)?\n```python\ndef f(n):\n    if n <= 1:\n        return 1\n    return n + f(n - 2)\n\nprint(f(5))\n```',
    options: ['15', '9', '8', '12'],
    correctAnswers: [1],
    explanation:
      'Развертка рекурсии: f(5) = 5 + f(3); f(3) = 3 + f(1); базовый случай f(1) = 1. Подставляем снизу вверх: f(3) = 3 + 1 = 4; f(5) = 5 + 4 = 9.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-func-006',
    topic: 'python_functions',
    questionText:
      'Каков будет результат выполнения следующего фрагмента кода с оператором global?\n```python\nx = 10\n\ndef modify():\n    global x\n    x = 20\n    y = 5\n    return x + y\n\nres = modify()\nprint(x, res)\n```',
    options: ['10 25', '20 15', '20 25', '10 15'],
    correctAnswers: [2],
    explanation:
      'Ключевое слово global указывает, что функция изменяет глобальную переменную x. Внутри modify() значение x становится 20, возвращается 20 + 5 = 25. При выводе x равен 20, а res равен 25.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'py-func-007',
    topic: 'python_functions',
    questionText:
      'Что выведет следующий фрагмент работы со словарем (dict)?\n```python\ndata = {"a": 1, "b": 2, "c": 3}\nval = data.get("d", 0) + data.pop("b")\nprint(val)\n```',
    options: ['0', '3', '5', '2'],
    correctAnswers: [3],
    explanation:
      'Метод data.get("d", 0) ищет ключ "d", и так как его нет, возвращает значение по умолчанию 0. Метод data.pop("b") удаляет ключ "b" и возвращает ассоциированное значение 2. Сумма: 0 + 2 = 2.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'py-func-008',
    topic: 'python_functions',
    questionText:
      'Какие из перечисленных методов изменяют исходный объект списка (list in-place), а не возвращают новый?',
    options: [
      'append() — добавляет элемент в конец списка',
      'sort() — сортирует элементы списка на месте',
      'sorted() — возвращает отсортированную последовательность',
      'extend() — расширяет список элементами коллекции',
      'count() — подсчитывает количество указанных элементов',
      'split() — разбивает строку по разделителю',
    ],
    correctAnswers: [0, 1, 3],
    explanation:
      'Методы append(), sort() и extend() мутируют исходный список на месте. Функция sorted() возвращает новый список, count() возвращает целое число, а split() — строковый метод.',
    difficulty: 'hard',
    version: 1,
  },
];
