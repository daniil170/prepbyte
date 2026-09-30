import { formatMessagesForAi } from '../domain/tutorChat';
import { TUTOR_SYSTEM_PROMPT } from '../domain/tutorPrompt';

/**
 * Generates an offline fallback response using expert pedagogical heuristics.
 *
 * @param {string} userText
 * @returns {string} Markdown formatted tutor reply.
 */
function generateOfflineTutorReply(userText) {
  const lower = userText.toLowerCase();

  if (
    lower.includes('ошибку') ||
    lower.includes('разбор') ||
    lower.includes('мой выбор')
  ) {
    return `
### 🎓 Разбор ошибки от ИИ-тьютора PrepByte

Отличный вопрос! Ошибки на пробных тестированиях — это лучший способ запомнить материал навсегда. Давай разберем логику задания по полочкам:

#### 1. В чем ловушка твоего ответа?
Твой выбор — частая ловушка на ЕНТ. Составители тестов специально добавляют варианты, которые кажутся интуитивно верными при беглом прочтении (например, путая индекс с элементом или забывая, что правая граница диапазона не включается).

#### 2. Почему правильный ответ верен?
В информатике важно помнить фундаментальный принцип:
- Если это **Python**: методы строк возвращают новые объекты, а списки мутируют на месте. Диапазон \`range(a, b)\` выполняется ровно до \`b - 1\`.
- Если это **SQL**: фильтрация групп всегда выполняется через \`HAVING\`, а строк — через \`WHERE\`.
- Если это **Сети**: маска подсети \`/24\` оставляет 8 бит для хостов (\`2^8 - 2 = 254\` рабочих адреса).

#### 3. Мнемоническое правило для ЕНТ
> **"Проверяй граничные условия и тип возвращаемого значения!"** — всегда задавай себе вопрос: "Возвращает ли эта операция результат или изменяет объект?".

---

✍️ **Контрольный микро-вопрос:**
Как изменится результат, если мы заменим строгий знак \`<\` на нестрогий \`<=\`? Напиши свой ответ в чат, и я проверю!
`.trim();
  }

  if (lower.includes('конспект') || lower.includes('шпаргалк')) {
    return `
### 📚 Экспресс-конспект для ЕНТ по Информатике

#### Ключевые понятия и формулы:
1. **Количество информации**: Формула Хартли $N = 2^i$ и формула Шеннона $I = -\\sum p_i \\log_2 p_i$.
2. **Сетевая адресация**: Адрес сети = побитовое \`AND\` между IP-адресом и маской подсети.
3. **Реляционные БД**: Первичный ключ (\`PRIMARY KEY\`) уникален и не равен \`NULL\`. Связи строятся через внешние ключи (\`FOREIGN KEY\`).
4. **Сложность алгоритмов**: Бинарный поиск — $O(\\log N)$, сортировка пузырьком — $O(N^2)$, быстрая сортировка — $O(N \\log N)$.

#### ⚠️ Топ-3 ловушек ЕНТ:
- **Ловушка 1:** В формуле электронных таблиц \`$A1\` фиксируется только столбец, а в \`A$1\` — только строка!
- **Ловушка 2:** В IPv4 адрес с всеми единицами в хостовой части — это широковещательный (broadcast) адрес, его нельзя назначать компьютеру.
- **Ловушка 3:** В Python кортежи \`tuple\` нельзя изменять через индексы: \`t[0] = 5\` вызовет ошибку TypeError.

Готов разобрать любую задачу из этого конспекта подробнее?
`.trim();
  }

  return `
Привет! Я твой интерактивный наставник по информатике PrepByte.

Я могу:
- **Разобрать любую ошибку** в твоем тесте и объяснить, как не попадаться в ловушку составителей ЕНТ.
- **Составить краткий конспект** по любой из 12 тем (Python, SQL, OSI, IP-адресация, Архитектура, ИБ).
- **Пошагово разобрать код** на Python или сложный SQL-запрос.

Чем могу помочь прямо сейчас?
`.trim();
}

/**
 * Sends conversation messages to the AI Tutor backend, with graceful offline fallback.
 *
 * @param {object} options
 * @param {Array<object>} options.messages - Tutor message objects.
 * @param {string} [options.apiKey='']
 * @returns {Promise<string>} Assistant reply text in markdown.
 */
export async function sendTutorChatMessage({ messages, apiKey = '' } = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('История сообщений пуста.');
  }

  const activeKey =
    apiKey?.trim() ||
    import.meta.env?.VITE_AI_API_KEY?.trim() ||
    import.meta.env?.VITE_GEMINI_API_KEY?.trim();

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'user');
  const userText = lastUserMessage ? lastUserMessage.content : '';

  // If no external key available, use offline pedagogical engine
  if (!activeKey) {
    return generateOfflineTutorReply(userText);
  }

  try {
    const formattedHistory = formatMessagesForAi(messages);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
      activeKey
    )}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: TUTOR_SYSTEM_PROMPT }],
        },
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Пустой ответ от нейросети');
    }

    return candidateText;
  } catch (err) {
    console.warn(
      '[Tutor API Fallback] Внешний вызов не удался, используется резервный ответ тьютора:',
      err.message
    );
    return generateOfflineTutorReply(userText);
  }
}
