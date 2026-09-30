import {
  AI_VARIANT_SYSTEM_PROMPT,
  buildAiVariantPrompt,
  buildTopicDeepDivePrompt,
} from '../domain/aiPromptTemplates';
import { generateCurriculumQuestions } from '../domain/curriculumGenerator';

/**
 * Client for generating UNT exam variants via Gemini / AI API,
 * with automatic fallback to high-fidelity curriculum generation.
 *
 * @param {object} options
 * @param {'full_exam'|'topic_deep_dive'} [options.mode='full_exam']
 * @param {string} [options.topicId='python_loops']
 * @param {string} [options.apiKey='']
 * @param {string} [options.difficulty='balanced']
 * @returns {Promise<{ questions: Array<object>, source: string, note?: string }>}
 */
export async function requestAiVariantGeneration({
  mode = 'full_exam',
  topicId = 'python_loops',
  apiKey = '',
  difficulty = 'balanced',
} = {}) {
  const activeKey =
    apiKey?.trim() ||
    import.meta.env?.VITE_AI_API_KEY?.trim() ||
    import.meta.env?.VITE_GEMINI_API_KEY?.trim();

  // If no external API key provided, use local curriculum generator
  if (!activeKey) {
    const questions = generateCurriculumQuestions({
      mode,
      topicId,
      count: mode === 'full_exam' ? 40 : 10,
      difficulty,
    });
    return {
      questions,
      source: 'curriculum_generator',
      note: 'Сгенерировано локальным методическим генератором PrepByte (API-ключ не задан).',
    };
  }

  // Attempt live generation with Gemini Flash API
  try {
    const userPrompt =
      mode === 'full_exam'
        ? buildAiVariantPrompt({
            variantSlug: `unt-${Date.now().toString(36)}`,
            difficultyDistribution:
              difficulty === 'balanced'
                ? '25% easy, 55% medium, 20% hard'
                : `100% ${difficulty}`,
          })
        : buildTopicDeepDivePrompt({
            topicId,
            count: 10,
            difficulty,
          });

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
          parts: [{ text: AI_VARIANT_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[AI Generation API Error] status=${response.status}:`,
        errorText
      );
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Пустой ответ от нейросетевой модели');
    }

    const parsed = JSON.parse(candidateText);
    const questions = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.questions)
        ? parsed.questions
        : null;

    if (!questions || questions.length === 0) {
      throw new Error('Некорректная структура JSON от ИИ-модели');
    }

    return {
      questions,
      source: 'gemini',
      note: 'Успешно сгенерировано нейросетью Gemini 2.0 Flash.',
    };
  } catch (err) {
    console.warn(
      '[AI Generator Fallback] Ошибка внешнего вызова API, используется локальный генератор:',
      err.message
    );
    const questions = generateCurriculumQuestions({
      mode,
      topicId,
      count: mode === 'full_exam' ? 40 : 10,
      difficulty,
    });
    return {
      questions,
      source: 'curriculum_generator',
      note: `Внешний API недоступен (${err.message}). Применен локальный генератор.`,
    };
  }
}
