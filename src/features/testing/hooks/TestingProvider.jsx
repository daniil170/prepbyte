import { useMemo } from 'react';
import { questionRepository as defaultQuestionRepository } from '@features/question-bank';
import { testSessionRepository as defaultSessionRepository } from '../data/testSessionRepository';
import { TestingContext } from './testingContext';

export function TestingProvider({
  children,
  sessionRepository = defaultSessionRepository,
  questionRepository = defaultQuestionRepository,
  now = Date.now,
}) {
  const value = useMemo(
    () => ({
      sessionRepository,
      questionRepository,
      now,
    }),
    [sessionRepository, questionRepository, now]
  );

  return (
    <TestingContext.Provider value={value}>{children}</TestingContext.Provider>
  );
}
