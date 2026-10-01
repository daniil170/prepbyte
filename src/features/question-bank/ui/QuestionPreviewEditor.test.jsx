import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestionPreviewEditor } from './QuestionPreviewEditor';

describe('QuestionPreviewEditor component', () => {
  const sampleQuestions = [
    {
      id: 'q1',
      number: 1,
      questionText: 'Что выведет код print(2 ** 3)?',
      topic: 'python_basics',
      difficulty: 'easy',
      options: ['6', '8', '9'],
      correctAnswers: [1],
      explanation: '2 в степени 3 равно 8.',
      status: 'ok',
      included: true,
    },
    {
      id: 'q2',
      number: 2,
      questionText: 'Какие типы данных являются неизменяемыми?',
      topic: 'python_basics',
      difficulty: 'medium',
      options: ['int', 'list', 'tuple', 'str'],
      correctAnswers: [0, 2, 3],
      explanation: 'Числа, кортежи и строки неизменяемы.',
      status: 'warning',
      duplicateOf: 'q99',
      issues: ['Проверьте дистракторы'],
      included: false,
    },
  ];

  it('renders question items with badges, snippets and points', () => {
    render(<QuestionPreviewEditor questions={sampleQuestions} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('1 балл')).toBeInTheDocument();
    expect(screen.getByText('2 балла')).toBeInTheDocument();
    expect(screen.getByText('✓ ОК')).toBeInTheDocument();
    expect(screen.getByText('! Внимание')).toBeInTheDocument();
    expect(screen.getByText('Дубликат: q99')).toBeInTheDocument();
  });

  it('toggles accordion when clicking header and allows keyboard navigation', () => {
    render(<QuestionPreviewEditor questions={sampleQuestions} />);

    // By default first question is expanded (internalExpandedIndex = 0)
    expect(
      screen.getByDisplayValue('Что выведет код print(2 ** 3)?')
    ).toBeInTheDocument();

    // Click header #2
    const header2 = screen.getByText('#2').closest('[role="button"]');
    fireEvent.click(header2);

    expect(
      screen.getByDisplayValue('Какие типы данных являются неизменяемыми?')
    ).toBeInTheDocument();
    expect(screen.getByText('• Проверьте дистракторы')).toBeInTheDocument();

    // Toggle back with Enter key
    fireEvent.keyDown(header2, { key: 'Enter' });
    expect(
      screen.queryByDisplayValue('Какие типы данных являются неизменяемыми?')
    ).not.toBeInTheDocument();
  });

  it('handles inclusion toggle checkbox', () => {
    const handleToggleInclude = vi.fn();
    render(
      <QuestionPreviewEditor
        questions={sampleQuestions}
        onToggleInclude={handleToggleInclude}
        showInclusion
      />
    );

    const checkbox = screen.getByLabelText('Включить задание 1');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(handleToggleInclude).toHaveBeenCalledWith(0);
  });

  it('calls onUpdateQuestion when editing question text and topic', () => {
    const handleUpdateQuestion = vi.fn();
    render(
      <QuestionPreviewEditor
        questions={sampleQuestions}
        onUpdateQuestion={handleUpdateQuestion}
      />
    );

    const textarea = screen.getByDisplayValue('Что выведет код print(2 ** 3)?');
    fireEvent.change(textarea, { target: { value: 'Новый вопрос' } });

    expect(handleUpdateQuestion).toHaveBeenCalledWith(0, {
      questionText: 'Новый вопрос',
    });
  });

  it('calls onToggleCorrectAnswer and onUpdateOptionText', () => {
    const handleToggleCorrect = vi.fn();
    const handleUpdateOption = vi.fn();

    render(
      <QuestionPreviewEditor
        questions={sampleQuestions}
        onToggleCorrectAnswer={handleToggleCorrect}
        onUpdateOptionText={handleUpdateOption}
      />
    );

    // Option A button
    const optABtn = screen.getByText('A');
    fireEvent.click(optABtn);
    expect(handleToggleCorrect).toHaveBeenCalledWith(0, 0);

    // Option B input
    const optInput = screen.getByDisplayValue('8');
    fireEvent.change(optInput, { target: { value: '88' } });
    expect(handleUpdateOption).toHaveBeenCalledWith(0, 1, '88');
  });

  it('calls onRemoveQuestion when delete button is clicked', () => {
    const handleRemoveQuestion = vi.fn();
    render(
      <QuestionPreviewEditor
        questions={sampleQuestions}
        onRemoveQuestion={handleRemoveQuestion}
      />
    );

    const deleteBtns = screen.getAllByLabelText('Удалить задание');
    fireEvent.click(deleteBtns[0]);
    expect(handleRemoveQuestion).toHaveBeenCalledWith(0);
  });

  it('supports adding and removing options', () => {
    const handleUpdateQuestion = vi.fn();
    render(
      <QuestionPreviewEditor
        questions={sampleQuestions}
        onUpdateQuestion={handleUpdateQuestion}
      />
    );

    const addOptionBtn = screen.getByText('+ Добавить вариант ответа');
    fireEvent.click(addOptionBtn);

    expect(handleUpdateQuestion).toHaveBeenCalledWith(0, {
      options: ['6', '8', '9', ''],
    });

    const removeOptionBtn = screen.getByLabelText('Удалить вариант A');
    fireEvent.click(removeOptionBtn);
    expect(handleUpdateQuestion).toHaveBeenCalledWith(0, {
      options: ['8', '9'],
      correctAnswers: [0], // was 1, shifted by 1
    });
  });
});
