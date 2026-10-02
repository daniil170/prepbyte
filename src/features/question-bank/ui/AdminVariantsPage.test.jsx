import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminVariantsPage } from './AdminVariantsPage';

vi.mock('../data/documentReaders', () => ({
  readDocumentText: vi.fn(),
  readDocxText: vi.fn(),
  readPdfText: vi.fn(),
}));

vi.mock('../data/questionRepository', () => ({
  questionRepository: {
    getAllQuestions: vi.fn().mockResolvedValue([]),
    saveQuestionsBatch: vi.fn().mockResolvedValue({ writtenCount: 2 }),
  },
}));

describe('AdminVariantsPage component', () => {
  it('renders header, navigation, and defaults to tab 1 (upload)', () => {
    render(
      <MemoryRouter>
        <AdminVariantsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Управление вариантами ЕНТ')).toBeInTheDocument();
    expect(
      screen.getByText('1. Загрузка файла (JSON, DOCX, PDF)')
    ).toBeInTheDocument();
    expect(screen.getByText('2. ИИ-Генератор вариантов')).toBeInTheDocument();
    expect(
      screen.getByText('Загрузка файла варианта (JSON, DOCX, PDF)')
    ).toBeInTheDocument();
  });

  it('renders format requirements for DOCX and PDF documents', () => {
    render(
      <MemoryRouter>
        <AdminVariantsPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Требования к форматированию документов/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Нумерация заданий:/i)).toBeInTheDocument();
    expect(screen.getByText(/Варианты ответа:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ключи:/i)).toBeInTheDocument();
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

  it('handles document selection, shows summary chips, editor and save button', async () => {
    const { readDocumentText } = await import('../data/documentReaders');
    readDocumentText.mockResolvedValue(
      `
1. Что такое компилятор?
A) Программа трансляции
B) База данных
C) Драйвер
Ответ: A

2. Какие устройства относятся к выводу информации?
A) Монитор
B) Мышь
C) Принтер
Ответ: A, C
    `.trim()
    );

    render(
      <MemoryRouter>
        <AdminVariantsPage />
      </MemoryRouter>
    );

    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['mock content'], 'variant_2026.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(screen.getByText('Файл:')).toBeInTheDocument();
    });

    expect(screen.getByText('variant_2026.docx')).toBeInTheDocument();
    expect(screen.getByText('Выбрано: 2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Распознанные задания (2)')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Что такое компилятор?')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Сохранить 2 вопросов/i })
    ).toBeInTheDocument();

    // Verify default topic UI was removed
    expect(screen.queryByText(/Тема по умолчанию:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Применить тему ко всем/i)
    ).not.toBeInTheDocument();

    // Verify prefix placeholder
    expect(screen.getByPlaceholderText('#10001')).toBeInTheDocument();
  });
});
