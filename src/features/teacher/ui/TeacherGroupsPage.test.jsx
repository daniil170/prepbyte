import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as groupsHook from '../hooks/useTeacherGroups';
import { TeacherGroupsPage } from './TeacherGroupsPage';

describe('TeacherGroupsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders list of groups with student counts', () => {
    const mockGroups = [
      { id: 'g1', name: '11 «А» класс', studentIds: ['s1', 's2'], createdAt: Date.now() },
      { id: 'g2', name: '11 «Б» класс', studentIds: [], createdAt: Date.now() },
    ];

    vi.spyOn(groupsHook, 'useTeacherGroups').mockReturnValue({
      groups: mockGroups,
      loading: false,
      error: null,
      refresh: vi.fn(),
      createGroup: vi.fn(),
      deleteGroup: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherGroupsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('11 «А» класс')).toBeInTheDocument();
    expect(screen.getByText('2 учеников')).toBeInTheDocument();
    expect(screen.getByText('11 «Б» класс')).toBeInTheDocument();
    expect(screen.getByText('0 учеников')).toBeInTheDocument();
  });
});
