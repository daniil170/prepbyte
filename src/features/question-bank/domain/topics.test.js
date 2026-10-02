import { describe, expect, it } from 'vitest';
import {
  detectQuestionTopic,
  getTopicById,
  getTopicLabel,
  isValidTopic,
  listTopics,
  TOPIC_GROUPS,
  TOPICS,
} from './topics';

describe('topics domain catalog', () => {
  it('contains exactly 14 topics, 2 per official group', () => {
    expect(TOPICS).toHaveLength(14);

    const groupKeys = Object.keys(TOPIC_GROUPS);
    expect(groupKeys).toHaveLength(7);

    const groupCounts = {};
    TOPICS.forEach((topic) => {
      groupCounts[topic.group] = (groupCounts[topic.group] || 0) + 1;
    });

    Object.values(TOPIC_GROUPS).forEach((group) => {
      expect(groupCounts[group.id]).toBe(2);
    });
  });

  it('lists topics via listTopics helper', () => {
    const list = listTopics();
    expect(list).toHaveLength(14);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('label');
    expect(list[0]).toHaveProperty('group');
  });

  it('looks up topic by id and label correctly', () => {
    const topic = getTopicById('python_loops');
    expect(topic).not.toBeNull();
    expect(topic.id).toBe('python_loops');
    expect(topic.group).toBe('python');
    expect(getTopicLabel('python_loops')).toBe('Циклы и условия в Python');

    expect(getTopicById('non_existent')).toBeNull();
    expect(getTopicLabel('non_existent')).toBe('');
  });

  it('validates topic existence with isValidTopic', () => {
    expect(isValidTopic('sql_queries')).toBe(true);
    expect(isValidTopic('network_protocols')).toBe(true);
    expect(isValidTopic('invalid_topic_id')).toBe(false);
  });

  describe('detectQuestionTopic', () => {
    it('detects sql_queries and sql_joins', () => {
      expect(
        detectQuestionTopic('Какой запрос SQL выбирает данные?', [
          'SELECT * FROM users',
          'UPDATE users',
        ])
      ).toBe('sql_queries');

      expect(
        detectQuestionTopic(
          'Какое ключевое слово объединяет таблицы по условию?',
          ['INNER JOIN', 'LEFT JOIN']
        )
      ).toBe('sql_joins');
    });

    it('detects html_css and network topics', () => {
      expect(
        detectQuestionTopic(
          'Какой тег HTML используется для разметки статьи?',
          ['<article>', '<aside>', '<div>']
        )
      ).toBe('html_css');

      expect(
        detectQuestionTopic('Маска подсети 255.255.255.0 в сети IPv4:', [
          '/24',
          '/16',
        ])
      ).toBe('network_addressing');

      expect(
        detectQuestionTopic(
          'Какой протокол сетевого уровня модели OSI отвечает за маршрутизацию?',
          ['TCP', 'IP', 'HTTP']
        )
      ).toBe('network_protocols');
    });

    it('detects number systems and python', () => {
      expect(
        detectQuestionTopic('Переведите двоичное число 1010 в десятичное:', [
          '10',
          '12',
        ])
      ).toBe('number_systems');

      expect(
        detectQuestionTopic(
          'Какой цикл в Python выполняется пока верно условие?',
          ['while x > 0:', 'for i in range:']
        )
      ).toBe('python_loops');
    });

    it('falls back to cpu_memory for hardware or unclassified questions', () => {
      expect(
        detectQuestionTopic(
          'Какое устройство выполняет арифметико-логические операции в компьютере?',
          ['Процессор', 'ОЗУ']
        )
      ).toBe('cpu_memory');

      expect(
        detectQuestionTopic('Общий вопрос без специфических терминов', [
          'Вариант 1',
          'Вариант 2',
        ])
      ).toBe('cpu_memory');
    });
  });
});
