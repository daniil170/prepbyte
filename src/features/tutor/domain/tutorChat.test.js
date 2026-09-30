import { describe, expect, it } from 'vitest';
import { createTutorMessage, formatMessagesForAi } from './tutorChat';

describe('tutorChat domain module', () => {
  it('creates an immutable tutor message', () => {
    const msg = createTutorMessage({
      role: 'user',
      content: 'Привет, тьютор!',
      meta: { topic: 'python' },
    });

    expect(msg.role).toBe('user');
    expect(msg.content).toBe('Привет, тьютор!');
    expect(msg.meta.topic).toBe('python');
    expect(msg.id).toBeDefined();
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(Object.isFrozen(msg)).toBe(true);
  });

  it('rejects invalid roles or empty content', () => {
    expect(() =>
      createTutorMessage({ role: 'unknown_role', content: 'test' })
    ).toThrow('Недопустимая роль');

    expect(() => createTutorMessage({ role: 'user', content: '   ' })).toThrow(
      'не должен быть пустым'
    );
  });

  it('formats messages history for Gemini API payload', () => {
    const messages = [
      createTutorMessage({ role: 'user', content: 'Вопрос 1' }),
      createTutorMessage({ role: 'assistant', content: 'Ответ 1' }),
      createTutorMessage({ role: 'system', content: 'Системное сообщение' }),
    ];

    const formatted = formatMessagesForAi(messages);
    expect(formatted).toHaveLength(2);
    expect(formatted[0]).toEqual({
      role: 'user',
      parts: [{ text: 'Вопрос 1' }],
    });
    expect(formatted[1]).toEqual({
      role: 'model',
      parts: [{ text: 'Ответ 1' }],
    });
  });
});
