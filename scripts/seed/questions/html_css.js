export const htmlCssQuestions = Object.freeze([
  {
    id: 'web-html-001',
    topic: 'html_css',
    questionText:
      'Какой тег в HTML используется для создания текста в верхнем индексе (например, степени числа X²)?',
    options: ['<sub>', '<sup>', '<upper>', '<high>'],
    correctAnswers: [1],
    explanation:
      'Тег <sup> (superscript) отображает текст в виде верхнего индекса. Тег <sub> используется для нижнего индекса.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-002',
    topic: 'html_css',
    questionText:
      'Какой тег в HTML используется для создания текста в нижнем индексе (например, химических формул H₂O)?',
    options: ['<sub>', '<sup>', '<lower>', '<base>'],
    correctAnswers: [0],
    explanation:
      'Тег <sub> (subscript) отображает текст в виде нижнего индекса (химические формулы, индексы массивов).',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-003',
    topic: 'html_css',
    questionText:
      'Какой HTML-тег используется для создания гиперссылок и какой атрибут задает адрес перехода?',
    options: [
      '<link href="...">',
      '<a href="...">',
      '<url src="...">',
      '<href link="...">',
    ],
    correctAnswers: [1],
    explanation:
      'Тег <a> (anchor) с обязательным атрибутом href (hypertext reference) задает адрес целевой страницы.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-css-004',
    topic: 'html_css',
    questionText:
      'Какое свойство в CSS используется для изменения цвета фона HTML-элемента?',
    options: ['color', 'background-color', 'border-color', 'bgcolor'],
    correctAnswers: [1],
    explanation:
      'Свойство background-color определяет цвет заднего фона элемента. Свойство color задает цвет текста.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-005',
    topic: 'html_css',
    questionText:
      'Какой тег используется для создания маркированного (ненумерованного) списка в HTML?',
    options: ['<ol>', '<ul>', '<li>', '<list>'],
    correctAnswers: [1],
    explanation:
      'Тег <ul> (unordered list) создает маркированный список, а <ol> (ordered list) — нумерованный.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-006',
    topic: 'html_css',
    questionText:
      'Какой тег HTML используется для вставки изображения на веб-страницу и какой атрибут указывает путь к файлу?',
    options: [
      '<image src="...">',
      '<picture href="...">',
      '<img src="...">',
      '<img href="...">',
    ],
    correctAnswers: [2],
    explanation:
      'Тег <img> является одиночным тегом, а путь к графическому файлу указывается через атрибут src (source).',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-007',
    topic: 'html_css',
    questionText:
      'Какой тег HTML используется для создания выпадающего списка выбора в веб-формах?',
    options: ['<input type="dropdown">', '<select>', '<list>', '<optiongroup>'],
    correctAnswers: [1],
    explanation:
      'Элемент <select> в сочетании с дочерними тегами <option> формирует раскрывающийся список выбора.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'web-css-008',
    topic: 'html_css',
    questionText:
      'Какое свойство CSS определяет насыщенность (толщину) шрифта текста?',
    options: ['font-style', 'font-weight', 'text-transform', 'font-size'],
    correctAnswers: [1],
    explanation:
      'Свойство font-weight задает насыщенность начертания (normal, bold или числовые значения 100-900).',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-css-009',
    topic: 'html_css',
    questionText:
      'В блочной модели CSS (Box Model), какое свойство отвечает за внутренний отступ между содержимым и границей элемента?',
    options: ['margin', 'padding', 'border', 'outline'],
    correctAnswers: [1],
    explanation:
      'padding — внутренний отступ (от контента до рамки border). margin — внешний отступ (вокруг рамки border).',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'web-css-010',
    topic: 'html_css',
    questionText:
      'Какой селектор в CSS применяется для стилизации элемента с уникальным идентификатором id="header"?',
    options: ['.header', '#header', '*header', '&header'],
    correctAnswers: [1],
    explanation:
      'Символ решетки # используется для обращения к элементам по id (#header). Точка . используется для классов (.header).',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-css-011',
    topic: 'html_css',
    questionText:
      'Какое свойство CSS задает горизонтальное выравнивание текста внутри блочного контейнера?',
    options: ['align-content', 'text-align', 'vertical-align', 'justify-items'],
    correctAnswers: [1],
    explanation:
      'text-align управляет горизонтальным выравниванием строчного контента (left, center, right, justify).',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-012',
    topic: 'web_technologies',
    questionText:
      'Какой тег HTML5 является семантическим контейнером для размещения основных навигационных ссылок сайта?',
    options: ['<header>', '<nav>', '<section>', '<menu>'],
    correctAnswers: [1],
    explanation:
      'Тег <nav> предназначен специально для навигационных разделов, содержащих ссылки на другие страницы или части страницы.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-html-013',
    topic: 'web_technologies',
    questionText:
      'Какой тег HTML используется для принудительного переноса строки внутри текста без создания нового абзаца?',
    options: ['<hr>', '<break>', '<br>', '<lb>'],
    correctAnswers: [2],
    explanation:
      'Тег <br> (break) осуществляет перевод строки в месте своего нахождения. Тег <hr> создает горизонтальную линию.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-css-014',
    topic: 'html_css',
    questionText:
      'Какое значение свойства display в CSS преобразует контейнер в одномерную гибкую сетку для выравнивания элементов?',
    options: ['grid', 'flex', 'block', 'inline-block'],
    correctAnswers: [1],
    explanation:
      'Значение display: flex активирует Flexbox-модель, обеспечивая гибкое позиционирование и выравнивание элементов по главной и поперечной осям.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'web-html-015',
    topic: 'web_technologies',
    questionText:
      'Какой HTTP-метод обычно используется в HTML-формах при передаче конфиденциальных данных (например, паролей)?',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    correctAnswers: [1],
    explanation:
      'Метод POST передает данные в теле (body) HTTP-запроса, скрывая их из адресной строки браузера, в отличие от GET.',
    difficulty: 'medium',
    version: 1,
  },

  // Multiple-choice questions (2 points each in UNT)
  {
    id: 'web-multi-016',
    topic: 'web_technologies',
    questionText:
      'Какие из перечисленных технологий составляют основу классического стека frontend-разработки клиентской части веб-приложений?',
    options: ['HTML', 'CSS', 'JavaScript', 'SQL', 'Python', 'C++'],
    correctAnswers: [0, 1, 2],
    explanation:
      '«Золотая тройка» веб-разработки на стороне браузера (клиент): HTML отвечает за структуру, CSS за визуальное оформление, JavaScript за интерактивность и логику.',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'web-multi-017',
    topic: 'html_css',
    questionText:
      'Какие из перечисленных HTML-тегов по умолчанию являются блочными элементами (display: block)?',
    options: ['<div>', '<span>', '<p>', '<h1>', '<a>', '<img>'],
    correctAnswers: [0, 2, 3],
    explanation:
      '<div>, <p> и <h1> являются блочными элементами, занимающими всю доступную ширину строки. <span>, <a> и <img> — строчные (inline/inline-block).',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'web-multi-018',
    topic: 'web_technologies',
    questionText:
      'Какие семантические теги были официально внедрены в спецификацию HTML5 для разметки структуры страницы?',
    options: ['<header>', '<footer>', '<main>', '<font>', '<center>', '<article>'],
    correctAnswers: [0, 1, 2, 5],
    explanation:
      '<header>, <footer>, <main> и <article> — ключевые структурные семантические теги HTML5. Теги <font> и <center> являются устаревшими (deprecated).',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'web-multi-019',
    topic: 'html_css',
    questionText:
      'Какие допустимые значения может принимать CSS-свойство position для управления позиционированием элементов?',
    options: ['static', 'relative', 'absolute', 'fixed', 'centered', 'floating'],
    correctAnswers: [0, 1, 2, 3],
    explanation:
      'CSS position принимает значения: static (по умолчанию), relative, absolute, fixed, sticky. Значений centered и floating в спецификации не существует.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'web-multi-020',
    topic: 'html_css',
    questionText:
      'Какие свойства CSS используются для настройки распределения и выравнивания элементов внутри Flexbox-контейнера?',
    options: [
      'justify-content',
      'align-items',
      'flex-direction',
      'grid-template-columns',
      'float',
      'clear',
    ],
    correctAnswers: [0, 1, 2],
    explanation:
      'justify-content, align-items и flex-direction — базовые управляющие свойства Flexbox. grid-template-columns относится к CSS Grid.',
    difficulty: 'hard',
    version: 1,
  },
  {
    id: 'web-html-021',
    topic: 'web_technologies',
    questionText:
      'Какой сетевой протокол обеспечивает защищенную передачу гипертекстовых веб-страниц с использованием SSL/TLS шифрования?',
    options: ['HTTP', 'HTTPS', 'FTP', 'SMTP'],
    correctAnswers: [1],
    explanation:
      'HTTPS (HyperText Transfer Protocol Secure) использует криптографические протоколы SSL/TLS для защиты веб-трафика.',
    difficulty: 'easy',
    version: 1,
  },
  {
    id: 'web-multi-022',
    topic: 'web_technologies',
    questionText:
      'Какие из приведенных компонентов и концепций относятся к серверной (backend) веб-разработке?',
    options: [
      'Серверные базы данных (SQL/NoSQL)',
      'API-интерфейсы (REST, GraphQL)',
      'CSS-стили (Flexbox/Grid)',
      'Браузерный DOM-рендеринг',
      'Серверная бизнес-логика (Node.js/Python)',
      'HTML-теги разметки',
    ],
    correctAnswers: [0, 1, 4],
    explanation:
      'Серверная разработка (backend) оперирует базами данных, бизнес-логикой и серверными API. CSS, DOM и теги HTML обрабатываются на клиенте (браузере).',
    difficulty: 'medium',
    version: 1,
  },
  {
    id: 'web-html-023',
    topic: 'web_technologies',
    questionText:
      'Какая организация отвечает за разработку и стандартизацию веб-стандартов, включая спецификации HTML и CSS?',
    options: ['W3C (World Wide Web Consortium)', 'IEEE', 'ISO', 'IETF'],
    correctAnswers: [0],
    explanation:
      'W3C (Консорциум Всемирной паутины) разрабатывает и утверждает открытые технологические стандарты для веба, включая HTML, CSS, SVG.',
    difficulty: 'medium',
    version: 1,
  },
]);
