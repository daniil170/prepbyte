export const databasesSqlQuestions = [
  // --- DATABASES & SQL: sql_queries ---
  {
    id: 'sql-q-001',
    topic: 'sql_queries',
    questionText:
      'Какая команда в SQL используется для вставки новой строки данных в таблицу?',
    options: ['INSERT INTO', 'UPDATE', 'ADD ROW', 'CREATE RECORD'],
    correctAnswers: [0],
    explanation:
      'Команда INSERT INTO предназначена для добавления новых записей (строк) в таблицу базы данных.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'sql-q-002',
    topic: 'sql_queries',
    questionText:
      'Что возвращает следующий запрос к базе данных?\n```sql\nSELECT COUNT(*)\nFROM Students\nWHERE score >= 80 AND score <= 90;\n```',
    options: [
      'Количество студентов с баллами от 80 до 90 включительно',
      'Сумму баллов всех студентов в диапазоне от 80 до 90',
      'Список записей студентов с указанными баллами',
      'Средний балл студентов из выборки',
    ],
    correctAnswers: [0],
    explanation:
      'Агрегатная функция COUNT(*) вычисляет общее количество строк, удовлетворяющих предикату WHERE score >= 80 AND score <= 90.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'sql-q-003',
    topic: 'sql_queries',
    questionText:
      'Какие предложения SQL применяются для фильтрации и упорядочивания данных в запросе?',
    options: [
      'WHERE (фильтрация строк)',
      'ORDER BY (сортировка результата)',
      'HAVING (фильтрация агрегированных групп)',
      'SORT ASC (сортировка по возрастанию)',
    ],
    correctAnswers: [0, 1, 2],
    explanation:
      'WHERE фильтрует исходные строки, HAVING фильтрует сгруппированные результаты (после GROUP BY), а ORDER BY задает порядок сортировки. Конструкции SORT ASC в стандарте SQL нет.',
    difficulty: 'medium',
    version: 1,
  },

  // --- DATABASES & SQL: sql_joins ---
  {
    id: 'sql-j-001',
    topic: 'sql_joins',
    questionText:
      'Какой тип соединения таблиц в SQL возвращает только те строки, у которых есть совпадающие значения ключа в обеих таблицах?',
    options: [
      'INNER JOIN',
      'LEFT OUTER JOIN',
      'RIGHT OUTER JOIN',
      'CROSS JOIN',
    ],
    correctAnswers: [0],
    explanation:
      'INNER JOIN (внутреннее объединение) отбирает только те строки, для которых условие соединения (ON) истинно для обеих связываемых таблиц.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'sql-j-002',
    topic: 'sql_joins',
    questionText:
      'Что произойдет при выполнении данного SQL-запроса?\n```sql\nSELECT d.name, COUNT(e.id)\nFROM Departments d\nLEFT JOIN Employees e ON d.id = e.dept_id\nGROUP BY d.name;\n```',
    options: [
      'В результат попадут все отделы, включая отделы без сотрудников (со значением 0)',
      'В результат попадут только отделы, в которых есть хотя бы один сотрудник',
      'Запрос вызовет синтаксическую ошибку отсутствия HAVING',
      'Выведутся только те сотрудники, которые не прикреплены к отделам',
    ],
    correctAnswers: [0],
    explanation:
      'LEFT JOIN гарантирует сохранение всех строк из левой таблицы (Departments). Для отделов без сотрудников поля Employees будут NULL, а COUNT(e.id) вернет 0.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'sql-j-003',
    topic: 'sql_joins',
    questionText:
      'Какие из перечисленных функций являются стандартными агрегатными функциями SQL, используемыми с предложением GROUP BY?',
    options: [
      'AVG() — среднее арифметическое',
      'SUM() — сумма значений',
      'MAX() — максимальное значение',
      'ROUND() — округление числа',
    ],
    correctAnswers: [0, 1, 2],
    explanation:
      'AVG(), SUM(), MAX(), MIN(), COUNT() — это агрегатные функции, обрабатывающие набор строк группы. ROUND() — скалярная математическая функция.',
    difficulty: 'medium',
    version: 1,
  },
];
