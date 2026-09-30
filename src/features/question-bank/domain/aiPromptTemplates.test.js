import { describe, expect, it } from 'vitest';
import {
  AI_VARIANT_JSON_SCHEMA,
  AI_VARIANT_SYSTEM_PROMPT,
  buildAiVariantPrompt,
  VARIANT_SPECIFICATION,
} from './aiPromptTemplates';
import { TOPICS } from './topics';

describe('aiPromptTemplates domain module', () => {
  it('defines the standard UNT Computer Science variant specification', () => {
    expect(VARIANT_SPECIFICATION.totalQuestions).toBe(40);
    expect(VARIANT_SPECIFICATION.maxPoints).toBe(50);
    expect(VARIANT_SPECIFICATION.singleChoiceCount).toBe(30);
    expect(VARIANT_SPECIFICATION.multiChoiceCount).toBe(10);
    expect(VARIANT_SPECIFICATION.singleChoiceOptionsCount).toBe(4);
    expect(VARIANT_SPECIFICATION.multiChoiceMinOptions).toBe(5);
    expect(VARIANT_SPECIFICATION.multiChoiceMaxOptions).toBe(6);
    expect(VARIANT_SPECIFICATION.topicsCount).toBe(12);
  });

  it('matches JSON schema with required fields and all 12 topic enums', () => {
    expect(AI_VARIANT_JSON_SCHEMA.type).toBe('object');
    expect(AI_VARIANT_JSON_SCHEMA.required).toContain('variantId');
    expect(AI_VARIANT_JSON_SCHEMA.required).toContain('title');
    expect(AI_VARIANT_JSON_SCHEMA.required).toContain('questions');

    const questionSchema = AI_VARIANT_JSON_SCHEMA.properties.questions.items;
    expect(questionSchema.required).toEqual([
      'id',
      'topic',
      'questionText',
      'options',
      'correctAnswers',
      'explanation',
      'difficulty',
      'version',
    ]);

    expect(questionSchema.properties.topic.enum).toEqual(
      TOPICS.map((t) => t.id)
    );
  });

  it('contains expert persona and instructions in AI_VARIANT_SYSTEM_PROMPT', () => {
    expect(AI_VARIANT_SYSTEM_PROMPT).toContain('ЕНТ');
    expect(AI_VARIANT_SYSTEM_PROMPT).toContain('40 заданий');
    expect(AI_VARIANT_SYSTEM_PROMPT).toContain('50 баллов');
    TOPICS.forEach((t) => {
      expect(AI_VARIANT_SYSTEM_PROMPT).toContain(t.id);
    });
  });

  it('builds custom user prompts with buildAiVariantPrompt', () => {
    const defaultPrompt = buildAiVariantPrompt();
    expect(defaultPrompt).toContain('unt-2026-gen');
    expect(defaultPrompt).toContain('25% easy, 55% medium, 20% hard');

    const customPrompt = buildAiVariantPrompt({
      variantSlug: 'custom-mock-01',
      difficultyDistribution: '50% easy, 50% medium',
    });
    expect(customPrompt).toContain('custom-mock-01');
    expect(customPrompt).toContain('50% easy, 50% medium');
  });
});
