import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as overviewHook from '../hooks/useTeacherOverview';
import { TeacherOverviewPage } from './TeacherOverviewPage';

describe('TeacherOverviewPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(overviewHook, 'useTeacherOverview').mockReturnValue({
      overview: null,
      loading: true,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherOverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Загрузка аналитики учителя...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.spyOn(overviewHook, 'useTeacherOverview').mockReturnValue({
      overview: null,
      loading: false,
      error: 'Ошибка загрузки данных',
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherOverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
  });

  it('renders KPI values and recent students table', () => {
    vi.spyOn(overviewHook, 'useTeacherOverview').mockReturnValue({
      overview: {
        kpis: {
          totalStudents: 15,
          totalGroups: 3,
          averageScore: 41.2,
          completedTestsCount: 50,
          activeStudentsLast7Days: 12,
        },
        studentsCount: 15,
        groupsCount: 3,
        recentStudents: [
          {
            uid: 'st-1',
            displayName: 'Алибек Сериков',
            email: 'alibek@test.kz',
            school: 'РФМШ',
            grade: 11,
          },
        ],
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherOverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Общая сводка')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('41.2')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Алибек Сериков')).toBeInTheDocument();
    expect(screen.getByText('alibek@test.kz')).toBeInTheDocument();
  });
});
