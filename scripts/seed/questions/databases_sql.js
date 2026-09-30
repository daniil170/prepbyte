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
  {
    id: 'sql-q-004',
    topic: 'sql_queries',
    questionText:
      'Что вернет следующий SQL-запрос при наличии дублирующихся городов в таблице Users?\n```sql\nSELECT DISTINCT city\nFROM Users\nORDER BY city ASC\nLIMIT 3;\n```',
    options: [
      'Три первых уникальных города в алфавитном порядке',
      'Три случайные записи из таблицы пользователей',
      'Все города, кроме первых трех в списке',
      'Количество уникальных городов в каждом регионе',
    ],
    correctAnswers: [0],
    explanation:
      'Ключевое слово DISTINCT исключает дублирующиеся значения, ORDER BY city ASC сортирует уникальные города по возрастанию (в алфавитном порядке), а LIMIT 3 ограничивает вывод первыми тремя строками.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'sql-q-005',
    topic: 'sql_queries',
    questionText:
      'Какой шаблон в операторе LIKE найдет все строки, начинающиеся с буквы "K", состоящие ровно из 4 символов и оканчивающиеся на "T"?',
    options: ["'K%T'", "'K__T'", "'K.*T'", "'K?T'"],
    correctAnswers: [1],
    explanation:
      'В стандарте SQL символ подчеркивания "_" обозначает строго один любой символ, а знак процента "%" — ноль или более любых символов. Шаблон "K__T" задает букву K, ровно два любых символа и букву T, то есть ровно 4 символа.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'sql-q-006',
    topic: 'sql_queries',
    questionText:
      'Какое условие в предложении WHERE корректно выбирает строки, в которых значение столбца email не задано (содержит NULL)?',
    options: [
      'WHERE email = NULL',
      'WHERE email == NULL',
      'WHERE email IS NULL',
      'WHERE email IN (NULL)',
    ],
    correctAnswers: [2],
    explanation:
      'Значение NULL обозначает отсутствие данных. Поскольку NULL не равен ничему, даже самому себе, проверка через операторы сравнения (=, !=) всегда возвращает UNKNOWN (ложь). Для проверки используется специальный предикат IS NULL.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'sql-q-007',
    topic: 'sql_queries',
    questionText:
      'В таблице Products есть строки: (1, "Books", 400), (2, "Books", 600) и (3, "Pen", 200). Что произойдет после запроса?\n```sql\nUPDATE Products\nSET price = price * 1.1\nWHERE category = "Books" AND price < 500;\n```',
    options: [
      'Цены всех товаров категории Books увеличатся на 10%',
      'Цена товара с id=2 станет 660, а id=1 станет 440',
      'Цены всех товаров в таблице умножатся на 1.1',
      'Цена товара с id=1 станет 440, остальные цены не изменятся',
    ],
    correctAnswers: [3],
    explanation:
      'Условию category = "Books" AND price < 500 удовлетворяет только товар с id=1 (категория "Books", цена 400 < 500). Его новая цена: 400 * 1.1 = 440. Товар с id=2 отсекается по цене (600 не меньше 500), а id=3 — по категории.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'sql-q-008',
    topic: 'sql_queries',
    questionText:
      'Какие из приведенных SQL-команд относятся к подмножеству языка DML (Data Manipulation Language)?',
    options: [
      'INSERT (добавление строк)',
      'UPDATE (модификация данных)',
      'CREATE TABLE (создание таблицы)',
      'DROP DATABASE (удаление базы данных)',
      'ALTER TABLE (изменение структуры таблицы)',
    ],
    correctAnswers: [0, 1],
    explanation:
      'Команды манипулирования данными (DML) работают с содержимым таблиц: SELECT, INSERT, UPDATE, DELETE. Команды CREATE, ALTER, DROP относятся к языку определения данных (DDL — Data Definition Language).',
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
  {
    id: 'sql-j-004',
    topic: 'sql_joins',
    questionText:
      'Какую главную функцию выполняет внешний ключ (Foreign Key) в реляционной базе данных?',
    options: [
      'Ускорение поиска и сортировки текстовых данных',
      'Обеспечение ссылочной целостности путем связывания записей двух таблиц',
      'Шифрование конфиденциальных полей в столбце',
      'Автоматическое удаление всей таблицы при завершении сеанса',
    ],
    correctAnswers: [1],
    explanation:
      'Внешний ключ (Foreign Key) ссылается на первичный ключ (Primary Key) другой таблицы, обеспечивая ссылочную целостность связей и предотвращая появление «висячих» записей.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'sql-j-005',
    topic: 'sql_joins',
    questionText:
      'В таблице Employees отдел 1 имеет 3 сотрудников, отдел 2 — 2 сотрудников, отдел 3 — 1 сотрудника. Что выведет следующий запрос?\n```sql\nSELECT department_id, COUNT(*) AS cnt\nFROM Employees\nGROUP BY department_id\nHAVING COUNT(*) > 2;\n```',
    options: [
      'Все три отдела и число сотрудников в каждом',
      'Отделы 1 и 2, так как в них более одного сотрудника',
      'Ошибку выполнения, так как фильтрация должна выполняться только в WHERE',
      'Только одну строку: department_id = 1 и cnt = 3',
    ],
    correctAnswers: [3],
    explanation:
      'Предложение GROUP BY группирует строки по department_id, а HAVING фильтрует сформированные группы по условию COUNT(*) > 2. Этому условию удовлетворяет только отдел 1, у которого 3 сотрудника (3 > 2).',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'sql-j-006',
    topic: 'sql_joins',
    questionText:
      'В таблице Students есть оценки трех студентов: Али (70), Берик (90), Дана (80). Кто будет выведен следующим запросом?\n```sql\nSELECT name\nFROM Students\nWHERE score > (SELECT AVG(score) FROM Students);\n```',
    options: [
      'Али и Дана',
      'Али, Берик и Дана',
      'Только Берик',
      'Берик и Дана',
    ],
    correctAnswers: [2],
    explanation:
      'Подзапрос (SELECT AVG(score) FROM Students) вычисляет средний балл: (70 + 90 + 80) / 3 = 80. Основной запрос отбирает студентов со строгим условием score > 80. Оценка Даны (80) не строго больше 80, поэтому в результат попадает только Берик (90 > 80).',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'sql-j-007',
    topic: 'sql_joins',
    questionText:
      'Какое соединение следует использовать, если нужно гарантированно включить все записи из правой таблицы B, даже если для них нет соответствий в левой таблице A?',
    options: [
      'RIGHT JOIN (RIGHT OUTER JOIN)',
      'INNER JOIN',
      'CROSS JOIN',
      'NATURAL JOIN',
    ],
    correctAnswers: [0],
    explanation:
      'RIGHT OUTER JOIN возвращает все строки из правой таблицы, дополняя несовпадающие поля левой таблицы значениями NULL. INNER JOIN отбросил бы строки без совпадений.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'sql-j-008',
    topic: 'sql_joins',
    questionText:
      'Какие из приведенных утверждений о группировке и фильтрации данных в SQL верны?',
    options: [
      'Предложение HAVING фильтрует сгруппированные результаты после агрегации',
      'В предложении WHERE запрещено использовать вызовы агрегатных функций (например, SUM или AVG)',
      'Столбцы выборки SELECT, не обернутые в агрегатные функции, должны перечисляться в GROUP BY',
      'Предложение GROUP BY в запросе выполняется строго перед WHERE',
      'Агрегатная функция COUNT(*) не подсчитывает строки, в которых есть хотя бы один NULL',
      'Предложение HAVING может применяться только совместно с оператором LIMIT',
    ],
    correctAnswers: [0, 1, 2],
    explanation:
      'Предложение WHERE фильтрует строки до агрегации, поэтому агрегатные функции в нем недопустимы; HAVING фильтрует группы уже после агрегации; неагрегированные поля в SELECT обязаны присутствовать в GROUP BY. WHERE выполняется до GROUP BY, а COUNT(*) считает все строки группы независимо от NULL в полях.',
    difficulty: 'hard',
    version: 1,
  },
];
