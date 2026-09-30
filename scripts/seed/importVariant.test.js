import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importVariant } from './importVariant.js';

describe('importVariant pipeline', () => {
  const sampleFixturePath = 'scripts/seed/fixtures/sampleVariant.json';

  it('successfully validates sampleVariant.json in dry-run mode', async () => {
    const result = await importVariant({
      filePath: sampleFixturePath,
      isDryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.isDryRun).toBe(true);
    expect(result.count).toBe(40);
    expect(result.breakdown.singleAnswerCount).toBe(30);
    expect(result.breakdown.multiAnswerCount).toBe(10);
    expect(result.breakdown.difficultyCounts.easy).toBeGreaterThan(0);
    expect(result.breakdown.difficultyCounts.medium).toBeGreaterThan(0);
    expect(Object.keys(result.breakdown.topicCounts).length).toBe(12);
  });

  it('throws an error if filePath is missing or file does not exist', async () => {
    await expect(importVariant({ isDryRun: true })).rejects.toThrow(
      'Укажите путь к JSON файлу варианта'
    );

    await expect(
      importVariant({ filePath: 'non_existent_file.json', isDryRun: true })
    ).rejects.toThrow('Файл не найден');
  });

  it('throws an error if file contains invalid JSON', async () => {
    const tempBadJson = path.resolve('scripts/seed/fixtures/bad.json');
    fs.writeFileSync(tempBadJson, '{ invalid: json', 'utf8');

    try {
      await expect(
        importVariant({ filePath: tempBadJson, isDryRun: true })
      ).rejects.toThrow('Ошибка парсинга JSON');
    } finally {
      fs.unlinkSync(tempBadJson);
    }
  });

  it('throws an error if questions array is empty', async () => {
    const tempEmpty = path.resolve('scripts/seed/fixtures/empty.json');
    fs.writeFileSync(tempEmpty, JSON.stringify({ questions: [] }), 'utf8');

    try {
      await expect(
        importVariant({ filePath: tempEmpty, isDryRun: true })
      ).rejects.toThrow('Вариант не содержит заданий');
    } finally {
      fs.unlinkSync(tempEmpty);
    }
  });

  it('detects and rejects duplicate question IDs within the imported file', async () => {
    const tempDupes = path.resolve('scripts/seed/fixtures/dupes.json');
    const duplicatePayload = {
      questions: [
        {
          id: 'dup-001',
          topic: 'python_loops',
          questionText: 'Test 1',
          options: ['A', 'B'],
          correctAnswers: [0],
          explanation: 'Exp',
          difficulty: 'easy',
          version: 1,
        },
        {
          id: 'dup-001',
          topic: 'python_loops',
          questionText: 'Test 2',
          options: ['A', 'B'],
          correctAnswers: [0],
          explanation: 'Exp',
          difficulty: 'easy',
          version: 1,
        },
      ],
    };

    fs.writeFileSync(tempDupes, JSON.stringify(duplicatePayload), 'utf8');

    try {
      await expect(
        importVariant({ filePath: tempDupes, isDryRun: true })
      ).rejects.toThrow('Ошибка валидации заданий варианта');
    } finally {
      fs.unlinkSync(tempDupes);
    }
  });

  it('detects and rejects conflict IDs with existing question bank', async () => {
    const tempConflict = path.resolve('scripts/seed/fixtures/conflict.json');
    const conflictPayload = [
      {
        id: 'py-loop-001', // Existing seed ID
        topic: 'python_loops',
        questionText: 'Conflicting Question Text',
        options: ['A', 'B'],
        correctAnswers: [0],
        explanation: 'Exp',
        difficulty: 'easy',
        version: 1,
      },
    ];

    fs.writeFileSync(tempConflict, JSON.stringify(conflictPayload), 'utf8');

    try {
      await expect(
        importVariant({ filePath: tempConflict, isDryRun: true })
      ).rejects.toThrow('Ошибка валидации заданий варианта');
    } finally {
      fs.unlinkSync(tempConflict);
    }
  });

  it('allows importing questions with existing IDs when a unique prefix is applied', async () => {
    const tempConflict = path.resolve('scripts/seed/fixtures/prefixed.json');
    const conflictPayload = [
      {
        id: 'py-loop-001',
        topic: 'python_loops',
        questionText: 'Prefixed Question Text',
        options: ['A', 'B'],
        correctAnswers: [0],
        explanation: 'Exp',
        difficulty: 'easy',
        version: 1,
      },
    ];

    fs.writeFileSync(tempConflict, JSON.stringify(conflictPayload), 'utf8');

    try {
      const result = await importVariant({
        filePath: tempConflict,
        isDryRun: true,
        prefix: 'mock-variant-v2-',
      });

      expect(result.success).toBe(true);
      expect(result.questions[0].id).toBe('mock-variant-v2-py-loop-001');
    } finally {
      fs.unlinkSync(tempConflict);
    }
  });

  it('reports domain validation errors from validateQuestion', async () => {
    const tempInvalid = path.resolve('scripts/seed/fixtures/invalid.json');
    const invalidPayload = [
      {
        id: 'bad-001',
        topic: 'unknown_topic_id',
        questionText: '',
        options: ['A'], // Less than 2 options
        correctAnswers: [99], // Out of bounds
        explanation: '',
        difficulty: 'super_hard', // Invalid difficulty
        version: -1,
      },
    ];

    fs.writeFileSync(tempInvalid, JSON.stringify(invalidPayload), 'utf8');

    try {
      await expect(
        importVariant({ filePath: tempInvalid, isDryRun: true })
      ).rejects.toThrow('Ошибка валидации заданий варианта');
    } finally {
      fs.unlinkSync(tempInvalid);
    }
  });
});
