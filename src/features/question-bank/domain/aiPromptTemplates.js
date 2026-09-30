import { TOPICS } from './topics';

/**
 * Official UNT Computer Science 40-question variant structure specification.
 * - 30 single-choice questions (1 correct option, 4 choices, 1 point each)
 * - 10 multiple-choice questions (2 or 3 correct options, 5-6 choices, 2 points each)
 * - Total max possible points: 50.
 */
export const VARIANT_SPECIFICATION = {
  totalQuestions: 40,
  maxPoints: 50,
  singleChoiceCount: 30,
  multiChoiceCount: 10,
  singleChoiceOptionsCount: 4,
  multiChoiceMinOptions: 5,
  multiChoiceMaxOptions: 6,
  topicsCount: 12,
};

/**
 * Expected JSON schema definition for AI variant generation output.
 */
export const AI_VARIANT_JSON_SCHEMA = {
  type: 'object',
  required: ['variantId', 'title', 'questions'],
  properties: {
    variantId: {
      type: 'string',
      description: 'Unique slug e.g. "unt-cs-2026-v1"',
    },
    title: { type: 'string', description: 'Variant display name in Russian' },
    questions: {
      type: 'array',
      minItems: 40,
      maxItems: 40,
      items: {
        type: 'object',
        required: [
          'id',
          'topic',
          'questionText',
          'options',
          'correctAnswers',
          'explanation',
          'difficulty',
          'version',
        ],
        properties: {
          id: {
            type: 'string',
            description: 'Semantic ID e.g. "py-loop-v1-001"',
          },
          topic: {
            type: 'string',
            enum: TOPICS.map((t) => t.id),
          },
          questionText: {
            type: 'string',
            description: 'Question text with markdown and code blocks',
          },
          options: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 6,
          },
          correctAnswers: {
            type: 'array',
            items: { type: 'integer', minimum: 0 },
            minItems: 1,
          },
          explanation: {
            type: 'string',
            description: 'Step-by-step pedagogical Russian explanation',
          },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          version: { type: 'integer', minimum: 1 },
        },
      },
    },
  },
};

/**
 * Master system prompt for LLMs to generate high-fidelity UNT Computer Science exam variants.
 */
export const AI_VARIANT_SYSTEM_PROMPT = `
Ты — ведущий эксперт-методист по информатике и составитель официальных тестовых заданий для ЕНТ (Единого национального тестирования) Республики Казахстан (НЦТ РК).

ТВОЯ ЗАДАЧА:
Сгенерировать полноценный, стандартизированный экзаменационный вариант ЕНТ по Информатике, состоящий ровно из 40 заданий с суммарным весом 50 баллов.

РЕГЛАМЕНТ СТРУКТУРЫ ВАРИАНТА (40 заданий):
1. Задания 1–30 (Одиночный выбор, 1 балл каждое):
   - Ровно 4 варианта ответа (A, B, C, D).
   - Ровно 1 правильный индекс в \`correctAnswers\` ([0], [1], [2] или [3]).
   - Равномерно распределяй позицию правильного ответа среди A–D (не делай всегда A).
2. Задания 31–40 (Множественный выбор, 2 балла каждое):
   - 5 или 6 вариантов ответа.
   - Ровно 2 или 3 правильных индекса в \`correctAnswers\` (например, [0, 2] или [1, 3, 4]).

ОФИЦИАЛЬНЫЕ 12 ТЕМ СПЕЦИФИКАЦИИ ЕНТ:
1. python_loops — Циклы и условия в Python (for, while, if/elif/else, range, break, continue)
2. python_functions — Функции и структуры данных в Python (def, return, list, dict, set, tuple, string methods)
3. sql_queries — Основные SQL-запросы (SELECT, DISTINCT, WHERE, ORDER BY, LIKE, LIMIT, BETWEEN, IN)
4. sql_joins — Связи таблиц и объединения (INNER/LEFT/RIGHT JOIN, GROUP BY, HAVING, агрегатные функции)
5. network_protocols — Сетевые протоколы и модель OSI/TCP-IP (уровни OSI, HTTP, HTTPS, FTP, DNS, TCP, UDP, IP)
6. network_addressing — IP-адресация и маски подсетей (IPv4, классы, расчет адреса сети, широковещательного адреса, числа хостов)
7. cpu_memory — Процессор и память компьютера (регистры, кэш L1/L2/L3, ОЗУ, ПЗУ, тактовая частота, архитектура фон Неймана)
8. number_systems — Системы счисления и логические операции (2/8/10/16, перевод, AND, OR, NOT, XOR, таблицы истинности)
9. spreadsheet_formulas — Формулы и функции электронных таблиц (СУММ, СРЗНАЧ, ЕСЛИ, ВПР, СЧЁТЕСЛИ, ссылки $A$1)
10. spreadsheet_charts — Диаграммы и фильтрация данных (типы диаграмм, автофильтр, сортировка, условное форматирование)
11. security_basics — Основы информационной безопасности (конфиденциальность, целостность, доступность, фишинг, вирусы, брандмауэр)
12. cryptography_basics — Криптография и защита данных (симметричное/асимметричное шифрование, открытый/закрытый ключ, ЭЦП, хэширование)

ПРАВИЛО ВЕРИФИКАЦИИ ФАКТОВ (EXECUTE, DO NOT GUESS):
- Python-код должен быть 100% синтаксически корректным для Python 3.10+.
- SQL-запросы должны быть стандартными (ANSI SQL / PostgreSQL / SQLite).
- IP-адреса и маски подсетей должны строго рассчитываться математически.
- Переводы чисел и логика должны быть математически безупречны.
- Дистракторы (неверные ответы) должны быть правдоподобными типичными ошибками учеников.
- Поле explanation должно содержать подробное пошаговое объяснение на русском языке.

ФОРМАТ ВЫВОДА:
Ты ДОЛЖЕН вернуть ИСКЛЮЧИТЕЛЬНО валидный JSON-объект.
НЕ используй Markdown-блоки кода (\`\`\`json ... \`\`\`), НЕ пиши вступительного или заключительного текста. Только чистый JSON.
`.trim();

/**
 * Builds user prompt for variant generation with optional custom parameters.
 *
 * @param {object} [params]
 * @param {string} [params.variantSlug="unt-2026-gen"]
 * @param {string} [params.difficultyDistribution="25% easy, 55% medium, 20% hard"]
 * @returns {string} Prompt string.
 */
export function buildAiVariantPrompt({
  variantSlug = 'unt-2026-gen',
  difficultyDistribution = '25% easy, 55% medium, 20% hard',
} = {}) {
  return `
Сгенерируй экзаменационный вариант ЕНТ по Информатике.
Параметры:
- variantId: "${variantSlug}"
- Распределение сложности: ${difficultyDistribution}
- Количество вопросов: ровно 40 (задания 1-30: одиночный выбор, 31-40: множественный выбор)
- Сбалансированное распределение по всем 12 темам.
- Формат: Строго JSON по указанной схеме.
`.trim();
}

/**
 * Builds user prompt for a focused topic deep-dive set.
 *
 * @param {object} params
 * @param {string} params.topicId
 * @param {number} [params.count=10]
 * @param {string} [params.difficulty="medium"]
 * @returns {string} Prompt string.
 */
export function buildTopicDeepDivePrompt({
  topicId,
  count = 10,
  difficulty = 'medium',
} = {}) {
  return `
Сгенерируй тематический интенсив заданий ЕНТ по Информатике.
Параметры:
- Тема: "${topicId}"
- Количество заданий: ${count} (задания 1-${count - 3}: одиночный выбор по 1 баллу, задания ${count - 2}-${count}: множественный выбор по 2 балла)
- Уровень сложности: ${difficulty}
- Формат: Строго валидный JSON по указанной схеме.
`.trim();
}
