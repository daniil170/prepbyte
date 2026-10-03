import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherQuestionFormPage } from './TeacherQuestionFormPage';
import { questionRepository } from '@features/question-bank';

vi.mock('@features/question-bank', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    questionRepository: {
      getQuestionWithAnswer: vi.fn(),
      saveQuestion: vi.fn(),
    },
  };
});

describe('TeacherQuestionFormPage component', () => {
  it('renders creation form with default state', () => {
    render(
      <MemoryRouter initialEntries={['/teacher/questions/new']}>
        <Routes>
          <Route
            path="/teacher/questions/new"
            element={<TeacherQuestionFormPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Создание вопроса')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите текст вопроса...')).toBeInTheDocument();
    expect(screen.getByText('+ Добавить вариант')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сохранить вопрос' })).toBeInTheDocument();
  });

  it('displays validation errors when submitting empty form', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher/questions/new']}>
        <Routes>
          <Route
            path="/teacher/questions/new"
            element={<TeacherQuestionFormPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: 'Сохранить вопрос' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Введите текст вопроса.')).toBeInTheDocument();
  });

  it('loads and populates form when editing an existing question', async () => {
    questionRepository.getQuestionWithAnswer.mockResolvedValue({
      id: 'q100',
      questionText: 'Существующий вопрос по SQL',
      topic: 'sql_queries',
      difficulty: 'hard',
      multiple: false,
      options: ['SELECT', 'DELETE'],
      correctAnswers: [0],
      explanation: 'SELECT выводит данные.',
    });

    render(
      <MemoryRouter initialEntries={['/teacher/questions/q100/edit']}>
        <Routes>
          <Route
            path="/teacher/questions/:questionId/edit"
            element={<TeacherQuestionFormPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Существующий вопрос по SQL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SELECT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DELETE')).toBeInTheDocument();
  });

  it('allows adding and removing option fields', () => {
    render(
      <MemoryRouter initialEntries={['/teacher/questions/new']}>
        <Routes>
          <Route
            path="/teacher/questions/new"
            element={<TeacherQuestionFormPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    const addBtn = screen.getByText('+ Добавить вариант');
    fireEvent.click(addBtn);

    const optionInputs = screen.getAllByPlaceholderText(/Текст варианта/);
    expect(optionInputs).toHaveLength(5);
  });
});
