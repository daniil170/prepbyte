import { useMemo } from 'react';
import { questionRepository as defaultQuestionRepository } from '@features/question-bank';
import { testSessionRepository as defaultSessionRepository } from '../data/testSessionRepository';
import { questionExposureRepository as defaultExposureRepository } from '../data/questionExposureRepository';
import { TestingContext } from './testingContext';

export function TestingProvider({
  children,
  sessionRepository = defaultSessionRepository,
  questionRepository = defaultQuestionRepository,
  exposureRepository = defaultExposureRepository,
  now = Date.now,
}) {
  const value = useMemo(
    () => ({
      sessionRepository,
      questionRepository,
      exposureRepository,
      now,
    }),
    [sessionRepository, questionRepository, exposureRepository, now]
  );

  return (
    <TestingContext.Provider value={value}>{children}</TestingContext.Provider>
  );
}
