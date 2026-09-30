import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminVariantsPage } from './AdminVariantsPage';

describe('AdminVariantsPage component', () => {
  it('renders header, navigation, and defaults to tab 1 (upload)', () => {
    render(
      <MemoryRouter>
        <AdminVariantsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Управление вариантами ЕНТ')).toBeInTheDocument();
    expect(screen.getByText('1. Загрузка файла (JSON)')).toBeInTheDocument();
    expect(screen.getByText('2. ИИ-Генератор вариантов')).toBeInTheDocument();
    expect(
      screen.getByText('Загрузка JSON-файла варианта')
    ).toBeInTheDocument();
  });

  it('switches to tab 2 (AI generator) when tab button is clicked', () => {
    render(
      <MemoryRouter>
        <AdminVariantsPage />
      </MemoryRouter>
    );

    const generatorTabBtn = screen.getByRole('button', {
      name: '2. ИИ-Генератор вариантов',
    });
    fireEvent.click(generatorTabBtn);

    expect(screen.getByLabelText('ИИ-Генератор вариантов')).toBeInTheDocument();
    expect(screen.getByText('Параметры генерации')).toBeInTheDocument();
  });
});
