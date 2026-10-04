import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TeacherExamFormPage } from './TeacherExamFormPage';
import * as useExamBuilderModule from '../hooks/useExamBuilder';

vi.mock('../hooks/useExamBuilder');

describe('TeacherExamFormPage component', () => {
  const mockBuilderState = {
    isEditMode: false,
    title: '',
    setTitle: vi.fn(),
    groupId: 'groupA',
    setGroupId: vi.fn(),
    durationMinutes: 60,
    setDurationMinutes: vi.fn(),
    questionIds: [],
    selectedQuestions: [],
    groups: [
      { id: 'groupA', name: 'Группа 10-А', studentIds: ['s1'] },
      { id: 'groupB', name: 'Группа 10-Б', studentIds: ['s2'] },
    ],
    pickerQuestions: [
      { id: 'q1', questionText: 'Вопрос из банка 1', topic: 'math', difficulty: 'easy', multiple: false },
    ],
    availableTopics: ['math'],
    searchQuery: '',
    setSearchQuery: vi.fn(),
    topicFilter: 'all',
    setTopicFilter: vi.fn(),
    difficultyFilter: 'all',
    setDifficultyFilter: vi.fn(),
    typeFilter: 'all',
    setTypeFilter: vi.fn(),
    addQuestion: vi.fn(),
    removeQuestion: vi.fn(),
    moveQuestionUp: vi.fn(),
    moveQuestionDown: vi.fn(),
    saveDraft: vi.fn(),
    deleteDraft: vi.fn(),
    isLoading: false,
    isSaving: false,
    error: null,
    validationErrors: {},
  };

  it('renders form fields and header in creation mode', () => {
    vi.spyOn(useExamBuilderModule, 'useExamBuilder').mockReturnValue(mockBuilderState);

    render(
      <MemoryRouter initialEntries={['/teacher/exams/new']}>
        <Routes>
          <Route path="/teacher/exams/new" element={<TeacherExamFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Конструктор экзамена')).toBeInTheDocument();
    expect(screen.getByLabelText(/Название экзамена/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Целевая группа/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Длительность/)).toBeInTheDocument();
    expect(screen.getByText('Вопрос из банка 1')).toBeInTheDocument();
    expect(screen.getByText('+ Добавить')).toBeInTheDocument();
  });

  it('renders edit mode with selected questions and delete draft button', () => {
    const editState = {
      ...mockBuilderState,
      isEditMode: true,
      title: 'Контрольная 10-А',
      questionIds: ['q1'],
      selectedQuestions: [
        { id: 'q1', questionText: 'Выбранный вопрос 1', topic: 'math', difficulty: 'medium', multiple: false },
      ],
      pickerQuestions: [],
    };

    vi.spyOn(useExamBuilderModule, 'useExamBuilder').mockReturnValue(editState);

    render(
      <MemoryRouter initialEntries={['/teacher/exams/exam1/edit']}>
        <Routes>
          <Route path="/teacher/exams/:examId/edit" element={<TeacherExamFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Редактирование черновика экзамена')).toBeInTheDocument();
    expect(screen.getByText('Выбранный вопрос 1')).toBeInTheDocument();
    expect(screen.getByText('Удалить черновик')).toBeInTheDocument();
  });

  it('calls addQuestion when + Добавить is clicked', () => {
    const addQuestionSpy = vi.fn();
    vi.spyOn(useExamBuilderModule, 'useExamBuilder').mockReturnValue({
      ...mockBuilderState,
      addQuestion: addQuestionSpy,
    });

    render(
      <MemoryRouter initialEntries={['/teacher/exams/new']}>
        <Routes>
          <Route path="/teacher/exams/new" element={<TeacherExamFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Добавить'));
    expect(addQuestionSpy).toHaveBeenCalledWith(mockBuilderState.pickerQuestions[0]);
  });
});
