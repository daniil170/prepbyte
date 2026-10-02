import { useEffect, useRef, useState } from 'react';
import { useTutorChat } from '../hooks/useTutorChat';
import { TutorMessageContent } from './TutorMessageContent';
import styles from './TutorDrawer.module.css';

const QUICK_ACTIONS = [
  {
    label: ' В чем моя ошибка?',
    prompt:
      'Объясни, почему мой ответ был неверным и в чем главная ловушка этого задания?',
  },
  {
    label: 'Краткий конспект темы',
    prompt:
      'Сделай краткий конспект (шпаргалку) по этой теме со всеми важными правилами и ловушками ЕНТ.',
  },
  {
    label: ' Похожее задание',
    prompt:
      'Дай мне одно похожее проверочное задание по этой теме, чтобы я мог потренироваться.',
  },
  {
    label: 'Трассировка кода',
    prompt:
      'Пожалуйста, проведи пошаговую трассировку выполнения этого кода и покажи значения переменных.',
  },
];

/**
 * Slide-over interactive AI study tutor drawer.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {object} [props.chatHook] - Optional instance of useTutorChat.
 */
export function TutorDrawer({ isOpen, onClose, chatHook }) {
  const internalChat = useTutorChat();
  const chat = chatHook || internalChat;

  const { messages, isLoading, error, sendMessage, clearChat } = chat;

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (
      isOpen &&
      typeof messagesEndRef.current?.scrollIntoView === 'function'
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    sendMessage(text);
  };

  const handleQuickAction = (prompt) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="ИИ-Тьютор PrepByte"
      >
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <span className={styles.avatar}>🤖</span>
              <h2 className={styles.title}>ИИ-Тьютор PrepByte</h2>
              <span className={styles.badge}>[ЕНТ МЕНТОР]</span>
            </div>
            <p className={styles.subtitle}>
              Разбор ошибок, экспресс-конспекты и пошаговая трассировка кода.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearChat}
              title="Очистить диалог"
              aria-label="Очистить диалог"
            >
              Сброс
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Закрыть тьютор"
              aria-label="Закрыть панель тьютора"
            >
              ×
            </button>
          </div>
        </header>

        {/* Quick Action Chips */}
        <div className={styles.quickActionsBar}>
          <div className={styles.quickActionsScroll}>
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.chipBtn}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className={styles.messagesContainer}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  isUser ? styles.userRow : styles.assistantRow
                }`}
              >
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.userBubble : styles.assistantBubble
                  }`}
                >
                  {isUser ? (
                    <div className={styles.userText}>{msg.content}</div>
                  ) : (
                    <TutorMessageContent content={msg.content} />
                  )}
                  <span className={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                <div className={styles.loadingDots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.loadingText}>
                    ИИ-тьютор анализирует...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert} role="alert">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form className={styles.inputForm} onSubmit={handleSend}>
          <textarea
            ref={inputRef}
            className={styles.inputArea}
            placeholder="Задайте вопрос тьютору (Enter — отправить)..."
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!inputText.trim() || isLoading}
            aria-label="Отправить сообщение"
          >
            Отправить
          </button>
        </form>
      </aside>
    </div>
  );
}
