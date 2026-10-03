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

// Data
export {
  groupRepository,
  createGroupRepository,
} from './data/groupRepository';
export {
  teacherStudentRepository,
  createTeacherStudentRepository,
} from './data/teacherStudentRepository';

// Hooks
export { useTeacherOverview } from './hooks/useTeacherOverview';
export { useTeacherStudents } from './hooks/useTeacherStudents';
export { useTeacherStudentDetails } from './hooks/useTeacherStudentDetails';
export { useTeacherGroups } from './hooks/useTeacherGroups';
export { useTeacherGroupDetails } from './hooks/useTeacherGroupDetails';

// UI
export { TeacherLayout } from './ui/TeacherLayout';
export { TeacherOverviewPage } from './ui/TeacherOverviewPage';
export { TeacherStudentsPage } from './ui/TeacherStudentsPage';
export { TeacherStudentDetailPage } from './ui/TeacherStudentDetailPage';
export { TeacherGroupsPage } from './ui/TeacherGroupsPage';
export { TeacherGroupDetailPage } from './ui/TeacherGroupDetailPage';
