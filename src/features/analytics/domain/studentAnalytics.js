import { calculateKPIs } from './kpiCalculator';
import { calculateTopicMastery } from './topicMasteryCalculator';
import { computeScoreTimeline } from './scoreTimelineCalculator';

/**
 * Aggregates all learning analytics for a student from their raw session history.
 *
 * @param {Array<object>} sessions - List of test session documents.
 * @param {object} [options]
 * @param {Date|number} [options.referenceTime=new Date()]
 * @param {number} [options.timelineLimit=15]
 * @returns {{
 *   kpis: object,
 *   topicMastery: object,
 *   scoreTimeline: Array<object>,
 *   recentAttempts: Array<object>,
 *   hasAttempts: boolean
 * }}
 */
export function buildStudentAnalytics(sessions, options = {}) {
  const safeSessions = Array.isArray(sessions) ? [...sessions] : [];

  // Sort descending by startedAt for recent attempts list
  const recentAttempts = [...safeSessions].sort((a, b) => {
    const timeA = a.startedAt || 0;
    const timeB = b.startedAt || 0;
    return timeB - timeA;
  });

  const kpis = calculateKPIs(safeSessions, options);
  const topicMastery = calculateTopicMastery(safeSessions);
  const scoreTimeline = computeScoreTimeline(
    safeSessions,
    options.timelineLimit
  );

  return {
    kpis,
    topicMastery,
    scoreTimeline,
    recentAttempts,
    hasAttempts: safeSessions.length > 0,
    hasCompletedAttempts: kpis.completedTests > 0,
  };
}
