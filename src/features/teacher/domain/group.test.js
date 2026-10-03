import { describe, expect, it } from 'vitest';
import {
  addStudentToGroupEntity,
  createGroup,
  removeStudentFromGroupEntity,
  validateGroupName,
} from './group';

describe('group domain', () => {
  it('creates an immutable group entity', () => {
    const group = createGroup({
      id: 'grp-1',
      name: '10-А класс',
      teacherId: 'teacher-1',
      studentIds: ['s1', 's2'],
    });

    expect(group.id).toBe('grp-1');
    expect(group.name).toBe('10-А класс');
    expect(group.teacherId).toBe('teacher-1');
    expect(group.studentIds).toEqual(['s1', 's2']);
    expect(Object.isFrozen(group)).toBe(true);
    expect(Object.isFrozen(group.studentIds)).toBe(true);
  });

  it('throws on missing required parameters', () => {
    expect(() => createGroup({ name: 'A', teacherId: 't1' })).toThrow();
    expect(() => createGroup({ id: 'g1', teacherId: 't1' })).toThrow();
    expect(() => createGroup({ id: 'g1', name: 'A' })).toThrow();
  });

  it('validates group name', () => {
    expect(validateGroupName('11-Б').valid).toBe(true);
    expect(validateGroupName('A').valid).toBe(false);
    expect(validateGroupName('').valid).toBe(false);
    expect(validateGroupName(null).valid).toBe(false);
    expect(validateGroupName('X'.repeat(51)).valid).toBe(false);
  });

  it('adds and removes students immutably', () => {
    const group = createGroup({
      id: 'grp-1',
      name: '10-А',
      teacherId: 't1',
      studentIds: ['s1'],
    });

    const withStudent = addStudentToGroupEntity(group, 's2');
    expect(withStudent.studentIds).toEqual(['s1', 's2']);
    expect(group.studentIds).toEqual(['s1']); // original untouched

    // Adding existing student is no-op
    const noop = addStudentToGroupEntity(withStudent, 's2');
    expect(noop.studentIds).toEqual(['s1', 's2']);

    const withoutStudent = removeStudentFromGroupEntity(withStudent, 's1');
    expect(withoutStudent.studentIds).toEqual(['s2']);
  });
});
