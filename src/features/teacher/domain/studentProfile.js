/**
 * Formats epoch timestamp into human-readable relative or short date string.
 *
 * @param {number|null} timestamp
 * @param {number} [now=Date.now()]
 * @returns {string} e.g. "Сегодня", "Вчера", or "12 мар. 2026 г."
 */
export function formatActivityDate(timestamp, now = Date.now()) {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Нет данных';
  }

  const d = new Date(timestamp);
  const current = new Date(now);

  const isToday =
    d.getDate() === current.getDate() &&
    d.getMonth() === current.getMonth() &&
    d.getFullYear() === current.getFullYear();

  if (isToday) return 'Сегодня';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Вчера';

  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Enriches student profile with calculated metrics from their test sessions.
 *
 * @param {object} student - Student profile entity.
 * @param {Array<object>} sessions - Student's test sessions.
 * @param {Array<object>} groups - Teacher's groups for resolving group names.
 * @param {number} [now=Date.now()]
 * @returns {object} Enriched student summary for teacher table.
 */
export function enrichStudentSummary(student, sessions = [], groups = [], now = Date.now()) {
  if (!student || typeof student !== 'object') {
    return null;
  }

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeGroups = Array.isArray(groups) ? groups : [];

  let completedCount = 0;
  let scoreSum = 0;
  let topScore = 0;
  let latestActivity = 0;

  for (const s of safeSessions) {
    if (!s) continue;
    const time = s.finishedAt || s.startedAt || 0;
    if (time > latestActivity) {
      latestActivity = time;
    }

    if (s.status === 'completed') {
      completedCount++;
      const score = s.score?.totalScore ?? 0;
      scoreSum += score;
      if (score > topScore) {
        topScore = score;
      }
    }
  }

  const averageScore =
    completedCount > 0
      ? Math.round((scoreSum / completedCount) * 10) / 10
      : 0;

  const studentGroupIds = new Set(student.groupIds || []);
  const matchingGroups = safeGroups.filter(
    (g) =>
      studentGroupIds.has(g.id) ||
      (Array.isArray(g.studentIds) && g.studentIds.includes(student.uid))
  );
  const groupNames = matchingGroups.map((g) => g.name);

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const isActive = latestActivity > 0 && latestActivity >= sevenDaysAgo;

  return {
    uid: student.uid,
    displayName:
      student.displayName || (student.email ? student.email.split('@')[0] : 'Ученик'),
    email: student.email || '',
    groupNames: groupNames.length > 0 ? groupNames : ['Без группы'],
    testCount: safeSessions.length,
    completedTests: completedCount,
    averageScore,
    topScore,
    lastActivity: latestActivity > 0 ? latestActivity : null,
    lastActivityFormatted: formatActivityDate(latestActivity, now),
    status: isActive ? 'active' : 'inactive',
    statusLabel: isActive ? 'Активен' : 'Неактивен',
  };
}
