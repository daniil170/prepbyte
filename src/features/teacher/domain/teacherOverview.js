/**
 * Calculates aggregated KPIs for teacher dashboard overview.
 *
 * @param {object} params
 * @param {Array<object>} params.students - List of student profile objects.
 * @param {Array<object>} params.groups - List of group objects.
 * @param {Array<object>} params.sessions - List of test sessions across teacher's students.
 * @param {number} [params.now=Date.now()] - Current epoch timestamp.
 * @returns {{
 *   totalStudents: number,
 *   totalGroups: number,
 *   averageScore: number,
 *   completedTestsCount: number,
 *   activeStudentsLast7Days: number
 * }}
 */
export function calculateTeacherOverview({
  students = [],
  groups = [],
  sessions = [],
  now = Date.now(),
} = {}) {
  const totalStudents = Array.isArray(students) ? students.length : 0;
  const totalGroups = Array.isArray(groups) ? groups.length : 0;

  const validSessions = Array.isArray(sessions) ? sessions : [];

  let completedTestsCount = 0;
  let totalScoreSum = 0;

  for (const session of validSessions) {
    if (session && session.status === 'completed') {
      completedTestsCount++;
      const score = session.score?.totalScore;
      if (typeof score === 'number' && !Number.isNaN(score)) {
        totalScoreSum += score;
      }
    }
  }

  const averageScore =
    completedTestsCount > 0
      ? Math.round((totalScoreSum / completedTestsCount) * 10) / 10
      : 0;

  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const activeStudentUids = new Set();

  for (const session of validSessions) {
    if (!session || !session.userId) continue;
    const sessionTime = session.finishedAt || session.startedAt || 0;
    if (sessionTime >= sevenDaysAgo) {
      activeStudentUids.add(session.userId);
    }
  }

  return {
    totalStudents,
    totalGroups,
    averageScore,
    completedTestsCount,
    activeStudentsLast7Days: activeStudentUids.size,
  };
}
