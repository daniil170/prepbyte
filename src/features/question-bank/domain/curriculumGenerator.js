import { TOPICS } from './topics';

const TOPIC_TEMPLATES = {
  python_loops: [
    {
      text: (seed) =>
        `Что выведет данный фрагмент кода на Python?\n\`\`\`python\ns = 0\nfor x in range(1, ${seed}):\n    if x % 2 == 0:\n        s += x\nprint(s)\n\`\`\``,
      options: (seed) => {
        let sum = 0;
        for (let i = 1; i < seed; i++) {
          if (i % 2 === 0) sum += i;
        }
        return [
          `${sum}`,
          `${sum + 2}`,
          `${sum - 2 > 0 ? sum - 2 : sum + 4}`,
          `${sum * 2}`,
        ];
      },
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Функция range генерирует последовательность, оператор % проверяет четность, а аккумулятор s суммирует четные числа.',
    },
    {
      text: (seed) =>
        `Какое значение примет переменная count после выполнения цикла?\n\`\`\`python\ncount = 0\ni = ${seed}\nwhile i > 0:\n    count += 1\n    i //= 2\nprint(count)\n\`\`\``,
      options: (seed) => {
        let c = 0;
        let v = seed;
        while (v > 0) {
          c++;
          v = Math.floor(v / 2);
        }
        return [`${c}`, `${c + 1}`, `${Math.max(1, c - 1)}`, `${c * 2}`];
      },
      correctAnswers: [0],
      difficulty: 'medium',
      explanation:
        'На каждой итерации значение переменной делится нацело на 2. Количество делений до 0 равно количеству разрядов в двоичном представлении.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие операторы в языке Python предназначены для изменения порядка выполнения итераций цикла?',
      options: () => [
        'break (немедленный выход из цикла)',
        'continue (пропуск оставшейся части текущей итерации)',
        'pass (синтаксическая заглушка, ничего не делает)',
        'stop (остановка цикла)',
        'exit (завершение всего интерпретатора)',
      ],
      correctAnswers: [0, 1],
      difficulty: 'medium',
      explanation:
        'В Python только break и continue управляют ходом выполнения цикла. pass — пустая инструкция, stop не существует в синтаксисе.',
    },
  ],

  python_functions: [
    {
      text: () =>
        'Что возвращает вызов функции `dict.get(key, default)` в Python, если указанный ключ отсутствует в словаре?',
      options: () => [
        'Значение по умолчанию default (или None, если не задано)',
        'Вызывает исключение KeyError',
        'Возвращает пустую строку ""',
        'Добавляет этот ключ в словарь со значением default',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Метод get безопасен — в отличие от обращения по квадратным скобкам, он возвращает переданный default без возбуждения ошибки KeyError.',
    },
    {
      text: () =>
        'Какой тип данных в Python является изменяемым (mutable) и поддерживает метод `.append()`?',
      options: () => [
        'list (список)',
        'tuple (кортеж)',
        'str (строка)',
        'int (целое число)',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Списки (list) — изменяемые структуры данных. Кортежи, строки и числа являются неизменяемыми.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие из перечисленных структур данных в Python гарантируют уникальность хранящихся элементов?',
      options: () => [
        'set (множество)',
        'frozenset (неизменяемое множество)',
        'dict.keys() (множество ключей словаря)',
        'list (список)',
        'tuple (кортеж)',
      ],
      correctAnswers: [0, 1, 2],
      difficulty: 'medium',
      explanation:
        'Множества set и frozenset, а также ключи словарей базируются на хэш-таблицах и не могут содержать дубликатов.',
    },
  ],

  sql_queries: [
    {
      text: () =>
        'Какой оператор в SQL используется для сортировки результатов запроса по возрастанию?',
      options: () => [
        'ORDER BY column_name ASC',
        'SORT BY column_name',
        'GROUP BY column_name',
        'ORDER BY column_name DESC',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Предложение ORDER BY с модификатором ASC (по умолчанию) сортирует строки в порядке возрастания.',
    },
    {
      text: () =>
        'Для фильтрации записей по шаблону строки в предложении WHERE используется ключевое слово:',
      options: () => ['LIKE', 'MATCH', 'CONTAINS', 'SEARCH'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Оператор LIKE в паре с подстановочными знаками % и _ выполняет поиск по строковым шаблонам.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие из перечисленных ключевых слов SQL используются в предложении SELECT для ограничения выборки и группировки?',
      options: () => ['DISTINCT', 'GROUP BY', 'HAVING', 'MODIFY', 'CHANGE'],
      correctAnswers: [0, 1, 2],
      difficulty: 'medium',
      explanation:
        'DISTINCT устраняет дубликаты, GROUP BY объединяет строки по признаку, HAVING фильтрует сгруппированные данные.',
    },
  ],

  sql_joins: [
    {
      text: () =>
        'Какое соединение вернет только те строки, для которых найдено совпадение в обеих объединяемых таблицах?',
      options: () => [
        'INNER JOIN',
        'LEFT OUTER JOIN',
        'RIGHT OUTER JOIN',
        'FULL OUTER JOIN',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'INNER JOIN оставляет в выборке только строки, удовлетворяющие условию ON в обеих таблицах.',
    },
    {
      text: () =>
        'Какая агрегатная функция SQL подсчитывает общее число строк в выборке?',
      options: () => ['COUNT(*)', 'SUM(*)', 'TOTAL(*)', 'LENGTH(*)'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'COUNT(*) подсчитывает количество строк в результирующей таблице, включая строки с NULL-значениями.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие из перечисленных утверждений верны для предложения HAVING в SQL?',
      options: () => [
        'Применяется после группировки строк предложением GROUP BY',
        'Может содержать условия с агрегатными функциями (например, HAVING COUNT(*) > 5)',
        'Выполняется раньше, чем условие WHERE',
        'Может использоваться только для таблиц без первичного ключа',
        'Служит для фильтрации сгруппированных данных',
      ],
      correctAnswers: [0, 1, 4],
      difficulty: 'medium',
      explanation:
        'HAVING фильтрует группы уже после GROUP BY и агрегации, в отличие от WHERE, фильтрующего исходные строки до группировки.',
    },
  ],

  network_protocols: [
    {
      text: () =>
        'По какому порту по умолчанию работает защищенный протокол передачи гипертекста HTTPS?',
      options: () => ['443', '80', '22', '21'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Порт 443 зарезервирован для протокола HTTPS. Порт 80 используется незашифрованным HTTP.',
    },
    {
      text: () =>
        'Какой сетевой протокол сопоставляет доменные имена (например, `prepbyte.kz`) с соответствующими IP-адресами?',
      options: () => ['DNS', 'DHCP', 'ARP', 'ICMP'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'DNS (Domain Name System) выполняет преобразование символьных доменных имен в цифровые IP-адреса.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие протоколы функционируют на прикладном (Application) уровне модели OSI?',
      options: () => ['HTTP', 'FTP', 'DNS', 'TCP', 'IP'],
      correctAnswers: [0, 1, 2],
      difficulty: 'easy',
      explanation:
        'HTTP, FTP и DNS — протоколы прикладного уровня. TCP относится к транспортному, а IP к сетевому уровню.',
    },
  ],

  network_addressing: [
    {
      text: (seed) =>
        `Сколько бит отведено под адрес сети при маске подсети /${seed === 1 ? 24 : 26}?`,
      options: (seed) =>
        seed === 1
          ? ['24 бита', '8 бит', '32 бита', '16 бит']
          : ['26 бит', '6 бит', '32 бита', '18 бит'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'В префиксной нотации CIDR число после дроби прямо обозначает количество бит сетевой части адреса.',
    },
    {
      text: () =>
        'Какой класс IPv4 адресов согласно исторической классовой классификации выделен для адресов с первым октетом 192–223?',
      options: () => ['Класс C', 'Класс A', 'Класс B', 'Класс D'],
      correctAnswers: [0],
      difficulty: 'medium',
      explanation:
        'Диапазон 192.0.0.0 – 223.255.255.255 принадлежит классу C (маска по умолчанию 255.255.255.0).',
    },
    {
      isMulti: true,
      text: () =>
        'Какие адреса в любой IPv4-подсети являются служебными и не могут быть назначены отдельному сетевому интерфейсу хоста?',
      options: () => [
        'Адрес сети (первый адрес диапазона)',
        'Широковещательный адрес Broadcast (последний адрес диапазона)',
        'Адрес шлюза по умолчанию',
        'DNS-сервер провайдера',
        'Петлевой адрес 127.0.0.1',
      ],
      correctAnswers: [0, 1],
      difficulty: 'medium',
      explanation:
        'Адрес сети и broadcast зарезервированы протоколом IP и не назначаются конечным устройствам в качестве хостовых адресов.',
    },
  ],

  cpu_memory: [
    {
      text: () =>
        'Какой принцип фон Неймана гласит, что программы и данные хранятся в одной и той же памяти в виде чисел?',
      options: () => [
        'Принцип однородности памяти',
        'Принцип адресности',
        'Принцип программного управления',
        'Принцип иерархии памяти',
      ],
      correctAnswers: [0],
      difficulty: 'medium',
      explanation:
        'Принцип однородности памяти утверждает отсутствие различий между командами программы и данными с точки зрения формата хранения.',
    },
    {
      text: () =>
        'Какая внутренняя память процессора синхронизируется непосредственно с тактовым генератором и хранит текущие операнды операций?',
      options: () => [
        'Регистры',
        'Оперативная память',
        'Постоянная память (ROM)',
        'Флэш-память',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Регистры процессора — сверхбыстрая энергозависимая память объемом в несколько машинных слов, работающая на частоте ядра.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие уровни кэш-памяти процессора обычно являются индивидуальными для каждого отдельного вычислительного ядра в современных многоядерных CPU?',
      options: () => [
        'L1 кэш инструкций и данных',
        'L2 кэш',
        'L3 общий разделяемый кэш',
        'Оперативная память (RAM)',
        'Видеопамять (VRAM)',
      ],
      correctAnswers: [0, 1],
      difficulty: 'hard',
      explanation:
        'Кэш L1 и L2 в подавляющем большинстве архитектур являются выделенными (персональными) для каждого ядра, а L3 разделяется между ядрами.',
    },
  ],

  number_systems: [
    {
      text: () =>
        'Чему равно число 1011 в двоичной системе счисления при переводе в десятичную?',
      options: () => ['11', '13', '9', '15'],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        '1011_2 = 1*2^3 + 0*2^2 + 1*2^1 + 1*2^0 = 8 + 0 + 2 + 1 = 11_10.',
    },
    {
      text: () =>
        'Какая логическая операция истинна тогда и только тогда, когда значения операндов различны?',
      options: () => [
        'Исключающее ИЛИ (XOR / сложение по модулю 2)',
        'Конъюнкция (AND)',
        'Дизъюнкция (OR)',
        'Эквиваленция (XNOR)',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'XOR возвращает 1, когда один операнд равен 1, а второй 0. При одинаковых операндах возвращает 0.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие из перечисленных оснований систем счисления являются степенями двойки и применяются в компьютерной схемотехнике и низкоуровневом коде?',
      options: () => [
        '2 (двоичная)',
        '8 (восьмеричная)',
        '16 (шестнадцатеричная)',
        '10 (десятичная)',
        '12 (двенадцатеричная)',
      ],
      correctAnswers: [0, 1, 2],
      difficulty: 'easy',
      explanation:
        '2^1 = 2, 2^3 = 8, 2^4 = 16. Именно поэтому восьмеричная и шестнадцатеричная системы удобны для компактной записи битов.',
    },
  ],

  spreadsheet_formulas: [
    {
      text: () =>
        'В ячейке записана формула `=B$2*2`. Как изменится формула при копировании ячейки на 2 строки вниз и 1 столбец вправо?',
      options: () => ['=C$2*2', '=B$4*2', '=C$4*2', '=B$2*2'],
      correctAnswers: [0],
      difficulty: 'medium',
      explanation:
        'Знак $ перед номером строки 2 фиксирует строку (абсолютная по строке). Столбец B смещается на 1 вправо до C. Результат: =C$2*2.',
    },
    {
      text: () =>
        'Какая функция в электронных таблицах позволяет вычислить сумму диапазона ячеек только при выполнении определенного условия?',
      options: () => [
        'СУММЕСЛИ (SUMIF)',
        'СУММ (SUM)',
        'СЧЁТЕСЛИ (COUNTIF)',
        'ЕСЛИ (IF)',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'СУММЕСЛИ суммирует значения ячеек, удовлетворяющих заданному критерию фильтрации.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие функции в электронных таблицах относятся к математическим и статистическим агрегатным операциям?',
      options: () => [
        'СУММ (SUM)',
        'СРЗНАЧ (AVERAGE)',
        'МАКС (MAX)',
        'СЦЕПИТЬ (CONCATENATE)',
        'ПРАВСИМВ (RIGHT)',
      ],
      correctAnswers: [0, 1, 2],
      difficulty: 'easy',
      explanation:
        'СУММ, СРЗНАЧ и МАКС работают с числовыми рядами данных. СЦЕПИТЬ и ПРАВСИМВ являются строковыми функциями.',
    },
  ],

  spreadsheet_charts: [
    {
      text: () =>
        'Какой инструмент табличного процессора автоматически выделяет цветом ячейки со значениями ниже порогового уровня?',
      options: () => [
        'Условное форматирование',
        'Автофильтр',
        'Сводная таблица',
        'Специальная вставка',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Условное форматирование (Conditional Formatting) меняет стили отображения ячеек на основе выполнения логических правил.',
    },
    {
      text: () =>
        'Для непрерывного отслеживания тенденций и динамики изменения числовых показателей во времени лучше всего подходит:',
      options: () => [
        'График (линейная диаграмма)',
        'Круговая диаграмма',
        'Лепестковая диаграмма',
        'Кольцевая диаграмма',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Графики и линейные диаграммы наглядно визуализируют временные тренды и непрерывные функции.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие типы диаграмм наиболее эффективны для визуального сравнения независимых категорий данных между собой?',
      options: () => [
        'Гистограмма (столбчатая диаграмма)',
        'Линейчатая диаграмма',
        'Круговая диаграмма для 50 категорий',
        'Точечная диаграмма без линий тренда',
        'График с накоплением по категориям',
      ],
      correctAnswers: [0, 1],
      difficulty: 'medium',
      explanation:
        'Столбчатые и линейчатые диаграммы идеальны для дискретного сравнения величин различных категорий.',
    },
  ],

  security_basics: [
    {
      text: () =>
        'Какое свойство информации в классической модели CIA гарантирует защиту от несанкционированного изменения или уничтожения данных?',
      options: () => [
        'Целостность (Integrity)',
        'Конфиденциальность (Confidentiality)',
        'Доступность (Availability)',
        'Аутентичность',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Целостность гарантирует сохранность данных в исходном достоверном виде и защиту от подделки или искажения.',
    },
    {
      text: () =>
        'Вредоносная программа, маскирующаяся под полезное или легитимное программное обеспечение, называется:',
      options: () => [
        'Троянский конь (Троян)',
        'Сетевой червь',
        'Руткит',
        'Бэкдор',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Троянские программы маскируются под полезный софт для обмана пользователя и внедрения вредоносной нагрузки.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие факторы аутентификации пользователя относятся к категории "то, чем пользователь обладает" (владение)?',
      options: () => [
        'Аппаратный USB-токен безопасности',
        'Одноразовый SMS-код на телефон',
        'Пароль учетной записи',
        'Отпечаток пальца',
        'Радужная оболочка глаза',
      ],
      correctAnswers: [0, 1],
      difficulty: 'medium',
      explanation:
        'Токен и телефон — фактор владения. Пароль — фактор знания. Отпечаток пальца и сетчатка — фактор биометрического свойства.',
    },
  ],

  cryptography_basics: [
    {
      text: () =>
        'В чем ключевое отличие симметричного шифрования от асимметричного?',
      options: () => [
        'В симметричном один и тот же ключ используется для шифрования и расшифровки',
        'Симметричное шифрование невозможно расшифровать',
        'В асимметричном шифровании ключи не используются',
        'Симметричное шифрование используется только для ЭЦП',
      ],
      correctAnswers: [0],
      difficulty: 'easy',
      explanation:
        'Симметричные шифры (AES, DES) используют одинаковый секретный ключ на обоих концах канала передачи.',
    },
    {
      text: () =>
        'Какое из следующих свойств не относится к математическим криптографическим хэш-функциям?',
      options: () => [
        'Возможность однозначного восстановления исходного текста по значению хэша',
        'Фиксированная длина хэш-кода независимо от размера исходного сообщения',
        'Лавинный эффект (малое изменение входа кардинально меняет хэш)',
        'Высокая скорость прямого вычисления',
      ],
      correctAnswers: [0],
      difficulty: 'medium',
      explanation:
        'Хэш-функции являются однонаправленными: восстановить исходное сообщение по значению хэша вычислительно невозможно.',
    },
    {
      isMulti: true,
      text: () =>
        'Какие алгоритмы относятся к современным стандартам криптографической защиты данных?',
      options: () => [
        'AES (Advanced Encryption Standard)',
        'RSA (Rivest-Shamir-Adleman)',
        'SHA-256 (Secure Hash Algorithm)',
        'Шифр Цезаря со сдвигом 3',
        'Base64 кодирование',
      ],
      correctAnswers: [0, 1, 2],
      difficulty: 'medium',
      explanation:
        'AES — симметричный шифр, RSA — асимметричный шифр, SHA-256 — хэш-функция. Шифр Цезаря тривиально ломается, Base64 — это кодирование, а не шифрование.',
    },
  ],
};

/**
 * Generates an array of curriculum-accurate UNT questions.
 *
 * @param {object} options
 * @param {'full_exam'|'topic_deep_dive'} [options.mode='full_exam']
 * @param {string} [options.topicId='python_loops']
 * @param {number} [options.count=40]
 * @param {string} [options.difficulty='balanced']
 * @returns {Array<object>}
 */
export function generateCurriculumQuestions({
  mode = 'full_exam',
  topicId = 'python_loops',
  count = 40,
  difficulty = 'balanced',
} = {}) {
  const generated = [];
  const timestamp = Date.now().toString(36);

  if (mode === 'topic_deep_dive') {
    const templates = TOPIC_TEMPLATES[topicId] || TOPIC_TEMPLATES.python_loops;
    const targetCount = Math.max(1, Math.min(count, 40));

    for (let i = 0; i < targetCount; i++) {
      const template = templates[i % templates.length];
      const isMulti = i >= targetCount - 3 || template.isMulti;
      const seed = (((i + 1) * 3) % 15) + 4;
      const qOptions = template.options(seed);
      const qText =
        typeof template.text === 'function'
          ? template.text(seed)
          : template.text;

      let qCorrect = template.correctAnswers;
      if (!isMulti && qCorrect.length > 1) {
        qCorrect = [qCorrect[0]];
      }

      generated.push({
        id: `gen-${topicId}-${timestamp}-${String(i + 1).padStart(3, '0')}`,
        topic: topicId,
        questionText: qText,
        options: qOptions,
        correctAnswers: qCorrect,
        explanation: template.explanation,
        difficulty:
          difficulty === 'balanced' ? template.difficulty : difficulty,
        version: 1,
      });
    }

    return generated;
  }

  // mode === 'full_exam': 40 questions (30 single-choice, 10 multi-choice)
  // Evenly distributed across all 12 topics
  for (let i = 0; i < 40; i++) {
    const topicObj = TOPICS[i % TOPICS.length];
    const templates =
      TOPIC_TEMPLATES[topicObj.id] || TOPIC_TEMPLATES.python_loops;
    const isMulti = i >= 30; // 31-40 are multi-choice
    const template =
      templates.find((t) => (isMulti ? t.isMulti : !t.isMulti)) ||
      templates[i % templates.length];

    const seed = (((i + 2) * 5) % 17) + 5;
    const qOptions = template.options(seed);
    const qText =
      typeof template.text === 'function' ? template.text(seed) : template.text;

    let qCorrect = template.correctAnswers;
    if (isMulti && qCorrect.length === 1 && qOptions.length >= 5) {
      qCorrect = [0, 1];
    } else if (!isMulti && qCorrect.length > 1) {
      qCorrect = [qCorrect[0]];
    }

    generated.push({
      id: `gen-unt-${timestamp}-${String(i + 1).padStart(3, '0')}`,
      topic: topicObj.id,
      questionText: qText,
      options: qOptions,
      correctAnswers: qCorrect,
      explanation: template.explanation,
      difficulty: i % 4 === 3 ? 'hard' : i % 2 === 0 ? 'easy' : 'medium',
      version: 1,
    });
  }

  return generated;
}
