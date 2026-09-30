import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TutorDrawer } from './TutorDrawer';

describe('TutorDrawer UI component', () => {
  const createMockChatHook = (overrides = {}) => ({
    messages: [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Привет! Я твой ИИ-тьютор по информатике.',
        timestamp: Date.now(),
      },
    ],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    clearChat: vi.fn(),
    reviewQuestionMistake: vi.fn(),
    requestCheatSheet: vi.fn(),
    ...overrides,
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TutorDrawer isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header, messages and action chips when isOpen is true', () => {
    const mockChat = createMockChatHook();
    render(<TutorDrawer isOpen={true} onClose={vi.fn()} chatHook={mockChat} />);

    expect(screen.getByText('ИИ-Тьютор PrepByte')).toBeInTheDocument();
    expect(screen.getByText(/Привет! Я твой ИИ-тьютор/)).toBeInTheDocument();
    expect(screen.getByText('💡 В чем моя ошибка?')).toBeInTheDocument();
    expect(screen.getByText('📝 Краткий конспект темы')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const mockChat = createMockChatHook();
    render(
      <TutorDrawer isOpen={true} onClose={handleClose} chatHook={mockChat} />
    );

    const closeBtn = screen.getByRole('button', {
      name: 'Закрыть панель тьютора',
    });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('dispatches sendMessage when a quick action chip is clicked', () => {
    const mockChat = createMockChatHook();
    render(<TutorDrawer isOpen={true} onClose={vi.fn()} chatHook={mockChat} />);

    const chip = screen.getByText('💡 В чем моя ошибка?');
    fireEvent.click(chip);

    expect(mockChat.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('почему мой ответ был неверным')
    );
  });

  it('dispatches sendMessage on textarea form submit', () => {
    const mockChat = createMockChatHook();
    render(<TutorDrawer isOpen={true} onClose={vi.fn()} chatHook={mockChat} />);

    const input = screen.getByPlaceholderText(/Задайте вопрос тьютору/i);
    fireEvent.change(input, { target: { value: 'Что такое CIDR?' } });

    const sendBtn = screen.getByRole('button', { name: 'Отправить сообщение' });
    fireEvent.click(sendBtn);

    expect(mockChat.sendMessage).toHaveBeenCalledWith('Что такое CIDR?');
  });
});
