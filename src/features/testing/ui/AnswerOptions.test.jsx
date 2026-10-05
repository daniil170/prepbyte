import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerOptions } from './AnswerOptions';

describe('AnswerOptions', () => {
  const options = ['Шина данных', 'Шина адреса', 'Шина управления'];

  it('renders single choice options with radio inputs and single-answer hint', () => {
    const handleSelect = vi.fn();
    render(
      <AnswerOptions
        options={options}
        selectedAnswers={[1]}
        multiple={false}
        onSelect={handleSelect}
      />
    );

    expect(screen.getByText('Выберите один ответ')).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).not.toBeChecked();
    expect(radios[1]).toBeChecked();
    expect(radios[2]).not.toBeChecked();

    fireEvent.click(radios[0]);
    expect(handleSelect).toHaveBeenCalledWith(0);
  });

  it('renders multiple choice options with checkbox inputs and multiple-answer hint', () => {
    const handleSelect = vi.fn();
    render(
      <AnswerOptions
        options={options}
        selectedAnswers={[0, 2]}
        multiple={true}
        onSelect={handleSelect}
      />
    );

    expect(screen.getByText('Выберите все верные ответы')).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();

    fireEvent.click(checkboxes[1]);
    expect(handleSelect).toHaveBeenCalledWith(1);
  });

  it('renders non-color visual indicator for selected choices', () => {
    render(
      <AnswerOptions
        options={options}
        selectedAnswers={[0]}
        multiple={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('[✓]')).toBeInTheDocument();
  });

  it('triggers onSelect when clicking the text label of single and multi-choice options', () => {
    const handleSelect = vi.fn();
    render(
      <AnswerOptions
        options={options}
        selectedAnswers={[]}
        multiple={true}
        onSelect={handleSelect}
      />
    );

    const optionText = screen.getByText('Шина адреса');
    fireEvent.click(optionText);
    expect(handleSelect).toHaveBeenCalledWith(1);
  });
});
