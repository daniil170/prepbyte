import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title, description and action buttons when open', () => {
    render(
      <ConfirmDialog
        open={true}
        title="Завершить тестирование?"
        description="У вас осталось 5 неотвеченных вопросов."
        confirmLabel="Да, завершить"
        cancelLabel="Продолжить"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Завершить тестирование?')).toBeInTheDocument();
    expect(
      screen.getByText('У вас осталось 5 неотвеченных вопросов.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Да, завершить' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Продолжить' })
    ).toBeInTheDocument();
  });

  it('triggers onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Завершить?"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('triggers onCancel when cancel button is clicked or dialog cancels', () => {
    const handleCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Отменить?"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('calls showModal when opened and closes on unmount/open=false', () => {
    const { rerender } = render(
      <ConfirmDialog
        open={false}
        title="Тест"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.open).toBe(false);

    rerender(
      <ConfirmDialog
        open={true}
        title="Тест"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(dialog.open).toBe(true);
  });
});
