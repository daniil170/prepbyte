import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScratchpadDrawer } from './ScratchpadDrawer';

describe('ScratchpadDrawer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ScratchpadDrawer isOpen={false} onClose={vi.fn()} sessionId="s1" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders whiteboard drawer and saves input to localStorage', () => {
    render(
      <ScratchpadDrawer isOpen={true} onClose={vi.fn()} sessionId="s1" />
    );

    expect(screen.getByText('Белый лист / Черновик')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Используйте этот белый лист для любых черновых записей/i
    );
    fireEvent.change(textarea, { target: { value: '1010_2 = 10_10' } });

    expect(textarea.value).toBe('1010_2 = 10_10');
    expect(localStorage.getItem('prepbyte_scratchpad_s1')).toBe('1010_2 = 10_10');
  });

  it('inserts helper snippets when quick buttons are clicked', () => {
    render(
      <ScratchpadDrawer isOpen={true} onClose={vi.fn()} sessionId="s1" />
    );

    const quickBtn = screen.getByRole('button', { name: '2ⁿ' });
    fireEvent.click(quickBtn);

    const textarea = screen.getByRole('textbox', {
      name: 'Поле для черновых вычислений',
    });
    expect(textarea.value).toContain('2^0=1');
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ScratchpadDrawer isOpen={true} onClose={handleClose} sessionId="s1" />
    );

    const closeBtn = screen.getByRole('button', { name: 'Скрыть черновик' });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
