import { describe, expect, it } from 'vitest';
import { documentToGroup, groupToDocument } from './groupMappers';
import { createGroup } from '../domain/group';

describe('groupRepository and mappers', () => {
  it('maps document data to Group entity', () => {
    const raw = {
      name: '10-Б Информатика',
      teacherId: 't-123',
      studentIds: ['s1', 's2'],
      createdAt: 50000,
      updatedAt: 60000,
    };

    const group = documentToGroup('grp-100', raw);
    expect(group.id).toBe('grp-100');
    expect(group.name).toBe('10-Б Информатика');
    expect(group.teacherId).toBe('t-123');
    expect(group.studentIds).toEqual(['s1', 's2']);
    expect(group.createdAt).toBe(50000);
    expect(group.updatedAt).toBe(60000);
  });

  it('maps Group entity to document payload', () => {
    const group = createGroup({
      id: 'grp-200',
      name: '11-А',
      teacherId: 't-456',
      studentIds: ['s3'],
      createdAt: 1000,
      updatedAt: 2000,
    });

    const doc = groupToDocument(group);
    expect(doc.name).toBe('11-А');
    expect(doc.teacherId).toBe('t-456');
    expect(doc.studentIds).toEqual(['s3']);
    expect(doc.createdAt).toBe(1000);
    expect(doc.updatedAt).toBe(2000);
  });
});
