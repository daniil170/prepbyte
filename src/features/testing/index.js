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
  calculateExamScore,
  evaluateQuestion,
} from './domain/scoringEngine';

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

export { QuestionContent } from './ui/QuestionContent';
export { AnswerOptions } from './ui/AnswerOptions';
export { QuestionNavigator } from './ui/QuestionNavigator';
export { TestTimer } from './ui/TestTimer';
export { SaveIndicator } from './ui/SaveIndicator';
export { TestResultsView } from './ui/TestResultsView';
export { TestPage } from './ui/TestPage';
export { StartTestPanel } from './ui/StartTestPanel';
