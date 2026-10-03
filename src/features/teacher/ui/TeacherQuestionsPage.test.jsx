import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherQuestionsPage } from './TeacherQuestionsPage';
import * as useTeacherQuestionsModule from '../hooks/useTeacherQuestions';

vi.mock('../hooks/useTeacherQuestions');

describe('TeacherQuestionsPage component', () => {
  const mockQuestions = [
    {
      id: 'q1',
      questionText: 'Что такое Python?',
      topic: 'python_loops',
      difficulty: 'easy',
      multiple: false,
      options: ['Язык программирования', 'Змея', 'Браузер', 'База данных'],
      correctAnswers: [0],
    },
    {
      id: 'q2',
      questionText: 'Какие SQL команды изменяют данные?',
      topic: 'sql_queries',
      difficulty: 'medium',
      multiple: true,
      options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
      correctAnswers: [0, 1, 3],
    },
  ];

  it('renders title, create button, filters and question cards', () => {
    vi.spyOn(useTeacherQuestionsModule, 'useTeacherQuestions').mockReturnValue({
      questions: mockQuestions,
      filteredQuestions: mockQuestions,
      isLoading: false,
      error: null,
      actionError: null,
      setActionError: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
      selectedTopic: 'all',
      setSelectedTopic: vi.fn(),
      selectedDifficulty: 'all',
      setSelectedDifficulty: vi.fn(),
      selectedType: 'all',
      setSelectedType: vi.fn(),
      deleteQuestion: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherQuestionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Банк вопросов')).toBeInTheDocument();
    expect(screen.getByText('+ Создать вопрос')).toBeInTheDocument();
    expect(screen.getByText('Что такое Python?')).toBeInTheDocument();
    expect(screen.getByText('Какие SQL команды изменяют данные?')).toBeInTheDocument();
    expect(screen.getAllByText('Один ответ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Несколько ответов').length).toBeGreaterThan(0);
  });

  it('handles search input and filter selection', () => {
    const setSearchQuery = vi.fn();
    const setSelectedTopic = vi.fn();
    const setSelectedDifficulty = vi.fn();
    const setSelectedType = vi.fn();

    vi.spyOn(useTeacherQuestionsModule, 'useTeacherQuestions').mockReturnValue({
      questions: mockQuestions,
      filteredQuestions: mockQuestions,
      isLoading: false,
      error: null,
      actionError: null,
      setActionError: vi.fn(),
      searchQuery: '',
      setSearchQuery,
      selectedTopic: 'all',
      setSelectedTopic,
      selectedDifficulty: 'all',
      setSelectedDifficulty,
      selectedType: 'all',
      setSelectedType,
      deleteQuestion: vi.fn(),
    });

    render(
      <MemoryRouter>
        <TeacherQuestionsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Поиск по тексту или теме...');
    fireEvent.change(searchInput, { target: { value: 'Python' } });
    expect(setSearchQuery).toHaveBeenCalledWith('Python');

    const topicSelect = screen.getByLabelText('Тема:');
    fireEvent.change(topicSelect, { target: { value: 'python_loops' } });
    expect(setSelectedTopic).toHaveBeenCalledWith('python_loops');

    const difficultySelect = screen.getByLabelText('Сложность:');
    fireEvent.change(difficultySelect, { target: { value: 'easy' } });
    expect(setSelectedDifficulty).toHaveBeenCalledWith('easy');

    const typeSelect = screen.getByLabelText('Тип:');
    fireEvent.change(typeSelect, { target: { value: 'single' } });
    expect(setSelectedType).toHaveBeenCalledWith('single');
  });

  it('triggers delete confirmation dialog', async () => {
    const deleteQuestion = vi.fn().mockResolvedValue({ success: true });

    vi.spyOn(useTeacherQuestionsModule, 'useTeacherQuestions').mockReturnValue({
      questions: mockQuestions,
      filteredQuestions: mockQuestions,
      isLoading: false,
      error: null,
      actionError: null,
      setActionError: vi.fn(),
      searchQuery: '',
      setSearchQuery: vi.fn(),
      selectedTopic: 'all',
      setSelectedTopic: vi.fn(),
      selectedDifficulty: 'all',
      setSelectedDifficulty: vi.fn(),
      selectedType: 'all',
      setSelectedType: vi.fn(),
      deleteQuestion,
    });

    render(
      <MemoryRouter>
        <TeacherQuestionsPage />
      </MemoryRouter>
    );

    const deleteBtns = screen.getAllByRole('button', { name: 'Удалить' });
    fireEvent.click(deleteBtns[0]);

    // Dialog heading
    expect(screen.getByText('Удалить вопрос?')).toBeInTheDocument();
    expect(
      screen.getByText('Этот вопрос будет удалён из банка вопросов.')
    ).toBeInTheDocument();
  });
});
