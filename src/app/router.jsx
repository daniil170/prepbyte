import { createBrowserRouter } from 'react-router-dom';
import {
  AdminRoute,
  LoginPage,
  ProtectedRoute,
  PublicOnlyRoute,
  RegisterPage,
  TeacherRoute,
} from '@features/auth';
import { AnalyticsDashboard } from '@features/analytics';
import { AdminVariantsPage } from '@features/question-bank';
import { TestPage } from '@features/testing';
import {
  TeacherLayout,
  TeacherOverviewPage,
  TeacherStudentsPage,
  TeacherStudentDetailPage,
  TeacherGroupsPage,
  TeacherGroupDetailPage,
  TeacherExamsPage,
  TeacherExamLivePage,
  TeacherExamFormPage,
  TeacherQuestionsPage,
  TeacherQuestionFormPage,
} from '@features/teacher';
import {
  StudentExamJoinPage,
  StudentExamPage,
} from '@features/exams';
import HomePage from './pages/HomePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';

export const routes = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/variants',
    element: (
      <AdminRoute>
        <AdminVariantsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/teacher',
    element: (
      <TeacherRoute>
        <TeacherLayout />
      </TeacherRoute>
    ),
    children: [
      {
        index: true,
        element: <TeacherOverviewPage />,
      },
      {
        path: 'students',
        element: <TeacherStudentsPage />,
      },
      {
        path: 'students/:studentId',
        element: <TeacherStudentDetailPage />,
      },
      {
        path: 'groups',
        element: <TeacherGroupsPage />,
      },
      {
        path: 'groups/:groupId',
        element: <TeacherGroupDetailPage />,
      },
      {
        path: 'exams',
        element: <TeacherExamsPage />,
      },
      {
        path: 'exams/new',
        element: <TeacherExamFormPage />,
      },
      {
        path: 'exams/:examId/edit',
        element: <TeacherExamFormPage />,
      },
      {
        path: 'exams/:examId',
        element: <TeacherExamLivePage />,
      },
      {
        path: 'questions',
        element: <TeacherQuestionsPage />,
      },
      {
        path: 'questions/new',
        element: <TeacherQuestionFormPage />,
      },
      {
        path: 'questions/:questionId/edit',
        element: <TeacherQuestionFormPage />,
      },
    ],
  },
  {
    path: '/exam/join',
    element: (
      <ProtectedRoute>
        <StudentExamJoinPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exam/:examId',
    element: (
      <ProtectedRoute>
        <StudentExamPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exam/:examId/result',
    element: (
      <ProtectedRoute>
        <StudentExamPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <AnalyticsDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/test/:sessionId',
    element: (
      <ProtectedRoute>
        <TestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: '/cookie-policy',
    element: <CookiePolicyPage />,
  },
];

export const router = createBrowserRouter(routes);
