import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StudentExamJoinPage } from './StudentExamJoinPage';
import * as useStudentExamJoinModule from '../hooks/useStudentExamJoin';

vi.mock('../hooks/useStudentExamJoin');

describe('StudentExamJoinPage component', () => {
  it('renders PIN input and submit button', () => {
    vi.spyOn(useStudentExamJoinModule, 'useStudentExamJoin').mockReturnValue({
      pin: '',
      setPin: vi.fn(),
      isLoading: false,
      error: null,
      joinExam: vi.fn(),
    });

    render(
      <MemoryRouter>
        <StudentExamJoinPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Вход на экзамен')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    expect(screen.getByText('Присоединиться')).toBeInTheDocument();
  });
});
