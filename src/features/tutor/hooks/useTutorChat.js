import { useCallback, useState } from 'react';
import { sendTutorChatMessage } from '../data/tutorClient';
import { createTutorMessage } from '../domain/tutorChat';
import {
  buildCheatSheetPrompt,
  buildMistakeReviewPrompt,
} from '../domain/tutorPrompt';

const INITIAL_WELCOME_MESSAGE = createTutorMessage({
  role: 'assistant',
  content: `Привет! Я твой интерактивный **ИИ-тьютор по информатике**.

Готов разобрать любую ошибку в тесте, составить экспресс-конспект по любой теме ЕНТ или пошагово разобрать фрагмент кода!

О чем хочешь поговорить прямо сейчас?`,
  meta: { isWelcome: true },
});

/**
 * Hook managing chat conversation with the AI Study Tutor.
 *
 * @param {object} [options]
 * @param {Function} [options.clientFn=sendTutorChatMessage]
 * @returns {object} Chat state and dispatchers.
 */
export function useTutorChat({ clientFn = sendTutorChatMessage } = {}) {
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (textContent, meta = {}) => {
      const trimmed = textContent?.trim();
      if (!trimmed) return null;

      const userMessage = createTutorMessage({
        role: 'user',
        content: trimmed,
        meta,
      });

      const updatedHistory = [...messages, userMessage];
      setMessages(updatedHistory);
      setIsLoading(true);
      setError(null);

      try {
        const assistantReplyText = await clientFn({
          messages: updatedHistory,
        });

        const assistantMessage = createTutorMessage({
          role: 'assistant',
          content: assistantReplyText,
        });

        setMessages((prev) => [...prev, assistantMessage]);
        return assistantMessage;
      } catch (err) {
        const errorMsg = `Ошибка связи с тьютором: ${err.message}`;
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, clientFn]
  );

  const reviewQuestionMistake = useCallback(
    async (questionData) => {
      const prompt = buildMistakeReviewPrompt(questionData);
      return sendMessage(prompt, {
        type: 'mistake_review',
        questionId: questionData?.id,
      });
    },
    [sendMessage]
  );

  const requestCheatSheet = useCallback(
    async (topicTitle, focusArea = '') => {
      const prompt = buildCheatSheetPrompt({ topicTitle, focusArea });
      return sendMessage(prompt, { type: 'cheat_sheet', topicTitle });
    },
    [sendMessage]
  );

  const clearChat = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reviewQuestionMistake,
    requestCheatSheet,
    clearChat,
  };
}
