/**
 * Extracts a calendar day string (YYYY-MM-DD) in local time from epoch timestamp or Date.
 *
 * @param {number|Date} timestamp
 * @returns {string} e.g. "2026-09-30"
 */
function toLocalDateString(timestamp) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current active streak of consecutive days with activity.
 *
 * @param {Array<object>} sessions
 * @param {Date|number} [referenceTime=new Date()]
 * @returns {number} Streak count in days.
 */
export function calculateStudyStreak(sessions, referenceTime = new Date()) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return 0;
  }

  // Collect unique active dates
  const activeDates = new Set();
  for (const s of sessions) {
    const time = s.startedAt || s.finishedAt;
    if (typeof time === 'number' && !Number.isNaN(time)) {
      activeDates.add(toLocalDateString(time));
    }
  }

  if (activeDates.size === 0) {
    return 0;
  }

  const refDateStr = toLocalDateString(referenceTime);

  // If today or yesterday is active, streak is alive
  const refDate = new Date(referenceTime);
  const yesterday = new Date(refDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  let currentCheck = refDate;
  if (!activeDates.has(refDateStr)) {
    if (activeDates.has(yesterdayStr)) {
      currentCheck = yesterday;
    } else {
      return 0;
    }
  }

  let streak = 0;
  const cursor = new Date(currentCheck);

  while (activeDates.has(toLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Calculates key performance indicators for a student's test attempts.
 *
 * @param {Array<object>} sessions - List of user's session objects.
 * @param {object} [options]
 * @param {Date|number} [options.referenceTime=new Date()]
 * @returns {{
 *   totalTests: number,
 *   completedTests: number,
 *   abandonedTests: number,
 *   inProgressTests: number,
 *   completionRate: number,
 *   averageScore: number,
 *   topScore: number,
 *   studyStreak: number
 * }}
 */
export function calculateKPIs(sessions, { referenceTime = new Date() } = {}) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      totalTests: 0,
      completedTests: 0,
      abandonedTests: 0,
      inProgressTests: 0,
      completionRate: 0,
      averageScore: 0,
      topScore: 0,
      studyStreak: 0,
    };
  }

  const totalTests = sessions.length;
  let completedTests = 0;
  let abandonedTests = 0;
  let inProgressTests = 0;
  let totalScoreSum = 0;
  let topScore = 0;

  for (const session of sessions) {
    if (session.status === 'completed') {
      completedTests += 1;
      const score = session.score?.totalScore ?? 0;
      totalScoreSum += score;
      if (score > topScore) {
        topScore = score;
      }
    } else if (session.status === 'abandoned') {
      abandonedTests += 1;
    } else if (session.status === 'in_progress') {
      inProgressTests += 1;
    }
  }

  const completionRate =
    totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

  const rawAverage = completedTests > 0 ? totalScoreSum / completedTests : 0;
  const averageScore = Math.round(rawAverage * 10) / 10;

  const studyStreak = calculateStudyStreak(sessions, referenceTime);

  return {
    totalTests,
    completedTests,
    abandonedTests,
    inProgressTests,
    completionRate,
    averageScore,
    topScore,
    studyStreak,
  };
}
