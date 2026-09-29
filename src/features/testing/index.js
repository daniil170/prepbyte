export { TEST_DURATION_SEC, TEST_QUESTION_COUNT } from './domain/testConfig';
export { buildTestVariant } from './domain/testVariantBuilder';
export {
  abandonSession,
  countAnswered,
  createSession,
  finishSession,
  getDeadline,
  getQuestionStatus,
  getRemainingSeconds,
  goToQuestion,
  isExpired,
  selectAnswer,
  toggleFlag,
} from './domain/testSession';

export {
  createTestSessionRepository,
  testSessionRepository,
} from './data/testSessionRepository';
export {
  documentToSession,
  sessionToDocument,
} from './data/testSessionMappers';

export { TestingProvider } from './hooks/TestingProvider';
export { useTestingDependencies } from './hooks/useTestingDependencies';
export { useRemainingSeconds } from './hooks/useRemainingSeconds';
export { useTestSession } from './hooks/useTestSession';
export { useStartTest } from './hooks/useStartTest';
export { useActiveSession } from './hooks/useActiveSession';
