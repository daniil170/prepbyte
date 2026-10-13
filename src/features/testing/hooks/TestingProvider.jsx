import { useMemo } from 'react';
import { questionRepository as defaultQuestionRepository } from '@features/question-bank';
import { submitExamSessionClient as defaultSubmitExamSession } from '@features/teacher';
import { testSessionRepository as defaultSessionRepository } from '../data/testSessionRepository';
import { questionExposureRepository as defaultExposureRepository } from '../data/questionExposureRepository';
import { TestingContext } from './testingContext';

export function TestingProvider({
  children,
  sessionRepository = defaultSessionRepository,
  questionRepository = defaultQuestionRepository,
  exposureRepository = defaultExposureRepository,
  submitExamSession = defaultSubmitExamSession,
  now = Date.now,
}) {
  const value = useMemo(
    () => ({
      sessionRepository,
      questionRepository,
      exposureRepository,
      submitExamSession,
      now,
    }),
    [sessionRepository, questionRepository, exposureRepository, submitExamSession, now]
  );

  return (
    <TestingContext.Provider value={value}>{children}</TestingContext.Provider>
  );
}
