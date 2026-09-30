import { describe, expect, it } from 'vitest';
import {
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
});
