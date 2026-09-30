/**
 * Master system prompt for the PrepByte AI Study Tutor.
 * Defines the pedagogical persona of a Kazakhstani UNT Computer Science mentor.
 */
export const TUTOR_SYSTEM_PROMPT = `
Ты — персональный интерактивный ИИ-тьютор образовательной платформы PrepByte, готовящей выпускников школ Казахстана к ЕНТ (ҰБТ) по Информатике.

ТВОЙ ПЕДАГОГИЧЕСКИЙ СТИЛЬ И ПРАВИЛА:
1. Дружелюбный, поддерживающий и академически точный тон. Обращайся к ученику на "ты", как опытный и вдохновляющий наставник.
2. Никогда не давай сухих или роботизированных ответов вроде "Ответ B правильный, потому что в формуле так написано".
3. Всегда объясняй СУТЬ ошибки: почему ученик мог ошибиться, какая типичная ловушка составителей тестов сработала, и как мыслить правильно.
4. Используй живые аналогии, ментальные модели или мнемонические правила для быстрого запоминания.
5. Для кода (Python) и запросов (SQL) давай пошаговую трассировку выполнения (что происходит на каждой итерации или строке).
6. В конце каждого разбора обязательно задавай ОДИН короткий проверочный микро-вопрос (check-for-understanding), чтобы ученик закрепил тему прямо в диалоге!
7. Форматируй ответы в чистом Markdown с аккуратным выделением ключевых терминов, списков и блоков кода (\`\`\`python, \`\`\`sql).
`.trim();

/**
 * Builds a prompt for analyzing a student's specific question mistake.
 *
 * @param {object} params
 * @param {string} params.questionText
 * @param {Array<string>} params.options
 * @param {Array<number>} params.studentAnswerIndices - Option indices chosen by the student
 * @param {Array<number>} params.correctAnswerIndices - True correct indices
 * @param {string} [params.explanation] - Official textbook explanation
 * @param {string} [params.topicLabel] - Human-readable topic name
 * @returns {string} User prompt for the tutor.
 */
export function buildMistakeReviewPrompt({
  questionText,
  options = [],
  studentAnswerIndices = [],
  correctAnswerIndices = [],
  explanation = '',
  topicLabel = '',
}) {
  const studentChoices = studentAnswerIndices.map((idx) => {
    const letter = String.fromCharCode(65 + idx);
    const text = options[idx] !== undefined ? options[idx] : `Опция ${idx}`;
    return `${letter}) "${text}"`;
  });

  const correctChoices = correctAnswerIndices.map((idx) => {
    const letter = String.fromCharCode(65 + idx);
    const text = options[idx] !== undefined ? options[idx] : `Опция ${idx}`;
    return `${letter}) "${text}"`;
  });

  const optionsList = options
    .map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)
    .join('\n');

  return `
Помоги мне разобрать мою ошибку в тестовом задании ЕНТ по информатике!

ТЕМА: ${topicLabel || 'Информатика ЕНТ'}

ВОПРОС:
${questionText}

ВАРИАНТЫ ОТВЕТА:
${optionsList}

МОЙ ВЫБОР (ОШИБКА):
${studentChoices.length > 0 ? studentChoices.join(', ') : 'Ответ не был выбран'}

ПРАВИЛЬНЫЙ ОТВЕТ:
${correctChoices.join(', ')}

ОФИЦИАЛЬНОЕ ПОЯСНЕНИЕ ИЗ БАЗЫ:
${explanation || 'Нет пояснения'}

ТВОЯ ЗАДАЧА:
1. Объясни, почему мой выбор был неверным и какая типичная ошибка здесь кроется.
2. Простыми словами и понятной аналогией объясни суть правильного ответа.
3. Дай мне совет/лайфхак для ЕНТ, как не попадаться в эту ловушку.
4. Задай мне один контрольный микро-вопрос по этой теме для проверки!
`.trim();
}

/**
 * Builds a prompt for generating an exam revision cheat-sheet (конспект).
 *
 * @param {object} params
 * @param {string} params.topicTitle
 * @param {string} [params.focusArea]
 * @returns {string} User prompt for cheat-sheet generation.
 */
export function buildCheatSheetPrompt({ topicTitle, focusArea = '' }) {
  return `
Составь для меня структурированный экспресс-конспект (шпаргалку) для подготовки к ЕНТ по информатике.

ТЕМА: ${topicTitle}
${focusArea ? `ОСОБЫЙ ФОКУС: ${focusArea}` : ''}

ВКЛЮЧИ В КОНСПЕКТ:
- Главные формулы, определения и регламенты (например, для сетей — маски и порты, для Python — методы и сложность, для SQL — порядок выполнения команд).
- Таблицу или список ключевых понятий.
- Топ-3 типичных ловушек составителей ЕНТ в этой теме.
- Мнемоническое правило для мгновенного запоминания.
- 1 пример боевой задачи с решением.
`.trim();
}

/**
 * Builds a prompt for code and algorithm walkthrough.
 *
 * @param {object} params
 * @param {string} params.codeSnippet
 * @param {string} [params.language="python"]
 * @param {string} [params.questionContext]
 * @returns {string} Prompt string.
 */
export function buildCodeWalkthroughPrompt({
  codeSnippet,
  language = 'python',
  questionContext = '',
}) {
  return `
Пожалуйста, проведи пошаговую трассировку этого фрагмента кода на ${language} для подготовки к ЕНТ.

${questionContext ? `КОНТЕКСТ ЗАДАЧИ:\n${questionContext}\n` : ''}
КОД:
\`\`\`${language}
${codeSnippet}
\`\`\`

Покажи состояние всех переменных на каждом шаге цикла/вызова функции и итоговый результат.
`.trim();
}
