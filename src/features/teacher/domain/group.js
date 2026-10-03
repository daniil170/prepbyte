/**
 * Creates an immutable Group entity.
 *
 * @param {object} params
 * @param {string} params.id - Unique group ID.
 * @param {string} params.name - Group name (e.g. "10-А класс").
 * @param {string} params.teacherId - UID of the teacher owning this group.
 * @param {string[]} [params.studentIds=[]] - Array of student UIDs.
 * @param {number} [params.createdAt] - Creation timestamp in epoch ms.
 * @param {number} [params.updatedAt] - Last update timestamp in epoch ms.
 * @returns {object} Immutable Group entity.
 */
export function createGroup({
  id,
  name,
  teacherId,
  studentIds = [],
  createdAt = Date.now(),
  updatedAt = Date.now(),
} = {}) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error('Group must have a non-empty id.');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Group must have a non-empty name.');
  }
  if (!teacherId || typeof teacherId !== 'string' || !teacherId.trim()) {
    throw new Error('Group must have a valid teacherId.');
  }

  const cleanStudentIds = Array.isArray(studentIds)
    ? Object.freeze([...new Set(studentIds.filter((s) => typeof s === 'string' && s.trim()))])
    : Object.freeze([]);

  return Object.freeze({
    id: id.trim(),
    name: name.trim(),
    teacherId: teacherId.trim(),
    studentIds: cleanStudentIds,
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
    updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now(),
  });
}

/**
 * Validates group name constraints.
 *
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateGroupName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Название группы обязательно.' };
  }
  const clean = name.trim();
  if (clean.length < 2) {
    return {
      valid: false,
      error: 'Название группы должно содержать минимум 2 символа.',
    };
  }
  if (clean.length > 50) {
    return {
      valid: false,
      error: 'Название группы не должно превышать 50 символов.',
    };
  }
  return { valid: true, error: null };
}

/**
 * Immutably adds a student ID to a group entity.
 *
 * @param {object} group
 * @param {string} studentId
 * @returns {object}
 */
export function addStudentToGroupEntity(group, studentId) {
  if (!studentId || typeof studentId !== 'string') return group;
  const cleanId = studentId.trim();
  if (group.studentIds.includes(cleanId)) return group;

  return createGroup({
    ...group,
    studentIds: [...group.studentIds, cleanId],
    updatedAt: Date.now(),
  });
}

/**
 * Immutably removes a student ID from a group entity.
 *
 * @param {object} group
 * @param {string} studentId
 * @returns {object}
 */
export function removeStudentFromGroupEntity(group, studentId) {
  if (!studentId || typeof studentId !== 'string') return group;
  const cleanId = studentId.trim();
  if (!group.studentIds.includes(cleanId)) return group;

  return createGroup({
    ...group,
    studentIds: group.studentIds.filter((id) => id !== cleanId),
    updatedAt: Date.now(),
  });
}
