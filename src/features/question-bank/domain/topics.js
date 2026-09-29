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
