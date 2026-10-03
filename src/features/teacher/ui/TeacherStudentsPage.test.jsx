import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as studentsHook from '../hooks/useTeacherStudents';
import { TeacherStudentsPage } from './TeacherStudentsPage';

describe('TeacherStudentsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders student list and filters by search query', () => {
    const mockStudents = [
      {
        uid: 's1',
        displayName: 'Данияр Ахметов',
        email: 'daniyar@test.kz',
        groupIds: ['g1'],
        groupNames: ['Группа A'],
        completedTestsCount: 5,
        averageScore: 42.0,
        bestScore: 48,
        lastActivityAt: Date.now(),
        isActiveInLast7Days: true,
      },
      {
        uid: 's2',
        displayName: 'Алия Касымова',
        email: 'aliya@test.kz',
        groupIds: ['g2'],
        groupNames: ['Группа B'],
        completedTestsCount: 3,
        averageScore: 36.5,
        bestScore: 40,
        lastActivityAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
        isActiveInLast7Days: false,
      },
    ];

    const mockGroups = [
      { id: 'g1', name: 'Группа A' },
      { id: 'g2', name: 'Группа B' },
    ];

    vi.spyOn(studentsHook, 'useTeacherStudents').mockReturnValue({
      students: mockStudents,
      groups: mockGroups,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherStudentsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Данияр Ахметов')).toBeInTheDocument();
    expect(screen.getByText('Алия Касымова')).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument();
    expect(screen.getByText('Неактивен')).toBeInTheDocument();

    // Filter by search
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Данияр' } });

    expect(screen.getByText('Данияр Ахметов')).toBeInTheDocument();
    expect(screen.queryByText('Алия Касымова')).not.toBeInTheDocument();
  });
});
