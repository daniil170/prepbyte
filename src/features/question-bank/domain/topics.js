export const TOPIC_GROUPS = Object.freeze({
  PYTHON: { id: 'python', label: 'Программирование на Python' },
  DATABASES_SQL: { id: 'databases_sql', label: 'Базы данных и SQL' },
  NETWORKS: { id: 'networks', label: 'Компьютерные сети' },
  COMPUTER_ARCHITECTURE: {
    id: 'computer_architecture',
    label: 'Архитектура компьютеров',
  },
  SPREADSHEETS: { id: 'spreadsheets', label: 'Электронные таблицы' },
  INFORMATION_SECURITY: {
    id: 'information_security',
    label: 'Информационная безопасность',
  },
  WEB_TECHNOLOGIES: {
    id: 'web_technologies',
    label: 'Веб-технологии и HTML/CSS',
  },
});

export const TOPICS = Object.freeze([
  {
    id: 'python_loops',
    label: 'Циклы и условия в Python',
    group: 'python',
  },
  {
    id: 'python_functions',
    label: 'Функции и структуры данных в Python',
    group: 'python',
  },
  {
    id: 'sql_queries',
    label: 'Основные SQL-запросы (SELECT, WHERE, ORDER BY)',
    group: 'databases_sql',
  },
  {
    id: 'sql_joins',
    label: 'Связи таблиц и объединения (JOIN, GROUP BY)',
    group: 'databases_sql',
  },
  {
    id: 'network_protocols',
    label: 'Сетевые протоколы и модель OSI/TCP-IP',
    group: 'networks',
  },
  {
    id: 'network_addressing',
    label: 'IP-адресация и маски подсетей',
    group: 'networks',
  },
  {
    id: 'cpu_memory',
    label: 'Процессор и память компьютера',
    group: 'computer_architecture',
  },
  {
    id: 'number_systems',
    label: 'Системы счисления и логические операции',
    group: 'computer_architecture',
  },
  {
    id: 'spreadsheet_formulas',
    label: 'Формулы и функции электронных таблиц',
    group: 'spreadsheets',
  },
  {
    id: 'spreadsheet_charts',
    label: 'Диаграммы и фильтрация данных',
    group: 'spreadsheets',
  },
  {
    id: 'security_basics',
    label: 'Основы информационной безопасности',
    group: 'information_security',
  },
  {
    id: 'cryptography_basics',
    label: 'Криптография и защита данных',
    group: 'information_security',
  },
  {
    id: 'html_css',
    label: 'Основы HTML и CSS верстки',
    group: 'web_technologies',
  },
  {
    id: 'web_technologies',
    label: 'Веб-разработка и клиент-сервер',
    group: 'web_technologies',
  },
]);

const TOPICS_BY_ID = new Map(TOPICS.map((topic) => [topic.id, topic]));

export function listTopics() {
  return [...TOPICS];
}

export function getTopicById(id) {
  return TOPICS_BY_ID.get(id) || null;
}

export function getTopicLabel(id) {
  const topic = getTopicById(id);
  return topic ? topic.label : '';
}

export function isValidTopic(id) {
  return TOPICS_BY_ID.has(id);
}

/**
 * Automatically infers an ENT Informatics topic based on question text and options.
 *
 * @param {string} text - Question text
 * @param {string[]} [options=[]] - Option texts
 * @returns {string} Inferred topic ID
 */
export function detectQuestionTopic(text = '', options = []) {
  const combined = `${text} ${(options || []).join(' ')}`.toLowerCase();

  // 1. SQL joins & relations
  if (
    /(join\b|group by\b|inner join|left join|right join|связи таблиц|связь между таблицами|один ко многим|многие ко многим)/i.test(
      combined
    )
  ) {
    return 'sql_joins';
  }

  // 2. SQL queries & manipulation
  if (
    /(select\b|insert\b|update\b|delete\b|drop\b|truncate\b|order by|having|субд|реляционн|первичный ключ|primary key|foreign key|структуры самой таблицы)/i.test(
      combined
    )
  ) {
    return 'sql_queries';
  }

  // 3. HTML / CSS
  if (
    /(html\b|css\b|style\b|margin\b|padding\b|border\b|flex\b|grid\b|box model|селектор|display\b|background|font-family|<article>|<aside>|<header>|<div>|<span>|<table>)/i.test(
      combined
    )
  ) {
    return 'html_css';
  }

  // 4. Network addressing
  if (
    /(ip-адрес|ip адрес|ipv4|ipv6|маск[а-я]* подсет|подсет|mac-адрес|mac адрес|адрес из 48 бит|сетевой карте|сетевая карта|шлюз|dhcp)/i.test(
      combined
    )
  ) {
    return 'network_addressing';
  }

  // 5. Network protocols & topology
  if (
    /(сетев|сеть|osi\b|tcp\b|udp\b|роутер|маршрутизатор|коммутатор|switch\b|dns\b|wi-fi|bluetooth|lan\b|wan\b|pan\b|топологи|протокол)/i.test(
      combined
    )
  ) {
    return 'network_protocols';
  }

  // 6. Web technologies
  if (
    /(web\b|веб|браузер|клиент-сервер|http\b|https\b|url\b|домен|веб-сервер|хостинг)/i.test(
      combined
    )
  ) {
    return 'web_technologies';
  }

  // 7. Spreadsheets - Charts
  if (/(диаграмм|график|круговая диаграмма|гистограмм)/i.test(combined)) {
    return 'spreadsheet_charts';
  }

  // 8. Spreadsheets - Formulas
  if (
    /(excel|электронн[а-я]* таблиц|ячейк|впр|vlookup|sum\(|average\(|\$[a-z]\$\d)/i.test(
      combined
    ) ||
    combined.includes('копировании формулы')
  ) {
    return 'spreadsheet_formulas';
  }

  // 9. Cryptography
  if (
    /(шифрован|хэш|криптографи|эцп|симметричн|асимметричн|rsa\b|aes\b|des\b)/i.test(
      combined
    )
  ) {
    return 'cryptography_basics';
  }

  // 10. Information security
  if (
    /(безопасност|парол|вирус|атак|уязвимост|firewall|брандмауэр|фишинг|вредоносн|троян|шпионск)/i.test(
      combined
    )
  ) {
    return 'security_basics';
  }

  // 11. CPU & Memory / Hardware
  if (
    /(процессор|памят|озу|ram\b|rom\b|кэш|шина|материнск|северный мост|южный мост|фон нейман|bios|регистр|жесткий диск|ssd|hdd|тактов|разрядност|периферийн|устройства компьютера|арифметико-логическ|алу\b)/i.test(
      combined
    )
  ) {
    return 'cpu_memory';
  }

  // 12. Number systems & Boolean logic
  if (
    /(двоичн|шестнадцатеричн|восьмеричн|систем[а-я]* счисления|конъюнкци|дизъюнкци|инверси|вентил|логическ|булев|таблиц[а-я]* истинности|xor\b|логическому закону)/i.test(
      combined
    ) ||
    /[₀-₉]/.test(combined) ||
    /[∧∨¬]/.test(combined)
  ) {
    return 'number_systems';
  }

  // 13. Python loops
  if (/(for |while |range\(|цикл|итераци|break\b|continue\b)/i.test(combined)) {
    return 'python_loops';
  }

  // 14. Python functions & programming structures
  if (
    /(python|def |print\(|list\b|dict\b|tuple\b|set\b|lambda\b|elif\b|except\b|import |append\b|len\(|str\(|int\(|float\(|словар|массив|список|функци|алгоритм|стек|очеред|дерев|сортировк|рекурси|машинного обучения|инференс|нейросет)/i.test(
      combined
    ) ||
    combined.includes('.split(')
  ) {
    return 'python_functions';
  }

  // Fallback default topic
  return 'cpu_memory';
}
