import { describe, expect, it } from 'vitest';
import {
  TUTOR_SYSTEM_PROMPT,
  buildCheatSheetPrompt,
  buildCodeWalkthroughPrompt,
  buildMistakeReviewPrompt,
} from './tutorPrompt';

describe('tutorPrompt domain module', () => {
  it('contains expert persona and rules in TUTOR_SYSTEM_PROMPT', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('PrepByte');
    expect(TUTOR_SYSTEM_PROMPT).toContain('ЕНТ');
    expect(TUTOR_SYSTEM_PROMPT).toContain('микро-вопрос');
  });

  it('builds comprehensive mistake review prompt with question and user answers', () => {
    const prompt = buildMistakeReviewPrompt({
      questionText: 'Что выведет print(2 ** 3)?',
      options: ['6', '8', '9', '5'],
      studentAnswerIndices: [0], // Student chose 6
      correctAnswerIndices: [1], // Correct is 8
      explanation: '2 в степени 3 равно 8.',
      topicLabel: 'Циклы и условия в Python',
    });

    expect(prompt).toContain('Что выведет print(2 ** 3)?');
    expect(prompt).toContain('МОЙ ВЫБОР (ОШИБКА):');
    expect(prompt).toContain('A) "6"');
    expect(prompt).toContain('ПРАВИЛЬНЫЙ ОТВЕТ:');
    expect(prompt).toContain('B) "8"');
    expect(prompt).toContain('Циклы и условия в Python');
  });

  it('builds cheat sheet prompt with topic title and focus area', () => {
    const prompt = buildCheatSheetPrompt({
      topicTitle: 'Компьютерные сети (OSI)',
      focusArea: 'IP-адресация и маски',
    });

    expect(prompt).toContain('Компьютерные сети (OSI)');
    expect(prompt).toContain('IP-адресация и маски');
    expect(prompt).toContain('Топ-3 типичных ловушек');
  });

  it('builds code walkthrough prompt with language and code block', () => {
    const prompt = buildCodeWalkthroughPrompt({
      codeSnippet: 'for i in range(5): print(i)',
      language: 'python',
      questionContext: 'Задача #12',
    });

    expect(prompt).toContain('```python');
    expect(prompt).toContain('for i in range(5): print(i)');
    expect(prompt).toContain('Задача #12');
  });
});
