// Domain
export {
  createGroup,
  validateGroupName,
  addStudentToGroupEntity,
  removeStudentFromGroupEntity,
} from './domain/group';
export { calculateTeacherOverview } from './domain/teacherOverview';
export {
  enrichStudentSummary,
  formatActivityDate,
} from './domain/studentProfile';
export { createExam, validateExamInput, isExamAccessibleByStudent } from './domain/exam';
export { EXAM_STATUS, canTransitionExamStatus, transitionExamStatus } from './domain/examLifecycle';
export { generateExamPin, isValidExamPin, normalizeExamPin } from './domain/examPin';
export {
  createExamSession,
  startExamSession,
  updateExamSessionAnswer,
  toggleExamSessionFlag,
  submitExamSession,
  getExamSessionRemainingSeconds,
  isExamSessionExpired,
  EXAM_SESSION_STATUS,
} from './domain/examSession';

// Data
export {
  groupRepository,
  createGroupRepository,
} from './data/groupRepository';
export {
  teacherStudentRepository,
  createTeacherStudentRepository,
} from './data/teacherStudentRepository';
export {
  examRepository,
  createExamRepository,
} from './data/examRepository';
export {
  documentToExam,
  examToDocument,
  documentToExamSession,
  examSessionToDocument,
} from './data/examMappers';

// Hooks
export { useTeacherOverview } from './hooks/useTeacherOverview';
export { useTeacherStudents } from './hooks/useTeacherStudents';
export { useTeacherStudentDetails } from './hooks/useTeacherStudentDetails';
export { useTeacherGroups } from './hooks/useTeacherGroups';
export { useTeacherGroupDetails } from './hooks/useTeacherGroupDetails';
export { useTeacherExams } from './hooks/useTeacherExams';
export { useTeacherExamLive } from './hooks/useTeacherExamLive';
export { useTeacherQuestions } from './hooks/useTeacherQuestions';
export { useExamBuilder } from './hooks/useExamBuilder';
export { useTeacherExamResults } from './hooks/useTeacherExamResults';
export { useTeacherStudentAnalytics } from './hooks/useTeacherStudentAnalytics';

// UI
export { TeacherLayout } from './ui/TeacherLayout';
export { TeacherOverviewPage } from './ui/TeacherOverviewPage';
export { TeacherStudentsPage } from './ui/TeacherStudentsPage';
export { TeacherStudentDetailPage } from './ui/TeacherStudentDetailPage';
export { TeacherGroupsPage } from './ui/TeacherGroupsPage';
export { TeacherGroupDetailPage } from './ui/TeacherGroupDetailPage';
export { TeacherExamsPage } from './ui/TeacherExamsPage';
export { TeacherExamLivePage } from './ui/TeacherExamLivePage';
export { TeacherExamFormPage } from './ui/TeacherExamFormPage';
export { TeacherExamResultsPage } from './ui/TeacherExamResultsPage';
export { TeacherStudentAnalyticsPage } from './ui/TeacherStudentAnalyticsPage';
export { TeacherQuestionsPage } from './ui/TeacherQuestionsPage';
export { TeacherQuestionFormPage } from './ui/TeacherQuestionFormPage';
export { CreateExamModal } from './ui/CreateExamModal';

