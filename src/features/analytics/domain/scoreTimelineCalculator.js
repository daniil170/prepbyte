/**
 * Computes chronological score timeline for completed test sessions.
 *
 * @param {Array<object>} sessions
 * @param {number} [limit=15]
 * @returns {Array<{
 *   id: string,
 *   timestamp: number,
 *   formattedDate: string,
 *   score: number,
 *   maxScore: number,
 *   percentage: number,
 *   durationSec: number
 * }>}
 */
export function computeScoreTimeline(sessions, limit = 15) {
  if (!Array.isArray(sessions)) {
    return [];
  }

  const completed = sessions.filter(
    (s) => s && s.status === 'completed' && typeof s.startedAt === 'number'
  );

  // Sort chronologically ascending
  completed.sort((a, b) => a.startedAt - b.startedAt);

  const selected = completed.slice(-limit);

  return selected.map((session) => {
    const started = session.startedAt;
    const finished = session.finishedAt || started;
    const durationSec = Math.max(0, Math.round((finished - started) / 1000));

    const dateObj = new Date(finished);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const formattedDate = `${day}.${month}`;

    const score = session.score?.totalScore ?? 0;
    const maxScore = session.score?.maxPossibleScore ?? 50;
    const percentage =
      session.score?.percentage ??
      (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);

    return {
      id: session.id,
      timestamp: finished,
      formattedDate,
      score,
      maxScore,
      percentage,
      durationSec,
    };
  });
}
