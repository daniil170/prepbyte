import { createGroup } from '../domain/group';

function parseTimestamp(ts) {
  if (ts === null || ts === undefined) {
    return Date.now();
  }
  if (typeof ts === 'number' && !Number.isNaN(ts)) {
    return ts;
  }
  if (typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + Math.round((ts.nanoseconds || 0) / 1000000);
  }
  return Date.now();
}

export function documentToGroup(id, data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return createGroup({
    id,
    name: data.name || '',
    teacherId: data.teacherId || '',
    studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
    createdAt: parseTimestamp(data.createdAt),
    updatedAt: parseTimestamp(data.updatedAt),
  });
}

export function groupToDocument(group) {
  return {
    name: group.name,
    teacherId: group.teacherId,
    studentIds: group.studentIds || [],
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
