import { MASTERY_THRESHOLD_PERCENT, UNT_TOPICS } from './analyticsConstants';

/**
 * Aggregates mastery performance across all 12 UNT Computer Science topics.
 *
 * @param {Array<object>} sessions - List of test sessions.
 * @returns {{
 *   allTopics: Array<{
 *     id: string,
 *     label: string,
 *     score: number,
 *     maxScore: number,
 *     percentage: number,
 *     questionsAttempted: number,
 *     isStrong: boolean
 *   }>,
 *   strongTopics: Array<object>,
 *   growthTopics: Array<object>,
 *   overallMastery: number
 * }}
 */
export function calculateTopicMastery(sessions) {
  // Initialize accumulator for all 12 defined topics
  const topicMap = new Map();
  for (const topic of UNT_TOPICS) {
    topicMap.set(topic.id, {
      id: topic.id,
      label: topic.label,
      score: 0,
      maxScore: 0,
      questionsAttempted: 0,
    });
  }

  if (Array.isArray(sessions)) {
    for (const session of sessions) {
      if (session.status !== 'completed') {
        continue;
      }

      // If byTopicBreakdown is stored in session.score
      if (session.score?.byTopicBreakdown) {
        for (const [topicId, data] of Object.entries(
          session.score.byTopicBreakdown
        )) {
          if (!topicMap.has(topicId)) {
            continue;
          }
          const acc = topicMap.get(topicId);
          acc.score += data.score || 0;
          acc.maxScore += data.maxScore || 0;
          acc.questionsAttempted += data.totalQuestions || 0;
        }
      } else if (Array.isArray(session.questionSnapshots)) {
        // Fallback to questionSnapshots
        for (const snapshot of session.questionSnapshots) {
          const topicId = snapshot.topic;
          if (!topicMap.has(topicId)) {
            continue;
          }
          const acc = topicMap.get(topicId);
          acc.score += snapshot.pointsAwarded || 0;
          acc.maxScore += snapshot.maxPoints || 1;
          acc.questionsAttempted += 1;
        }
      }
    }
  }

  let totalEarned = 0;
  let totalPossible = 0;

  const allTopics = Array.from(topicMap.values()).map((entry) => {
    const percentage =
      entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
    const isStrong =
      percentage >= MASTERY_THRESHOLD_PERCENT && entry.maxScore > 0;

    totalEarned += entry.score;
    totalPossible += entry.maxScore;

    return {
      ...entry,
      percentage,
      isStrong,
    };
  });

  const strongTopics = allTopics
    .filter((t) => t.isStrong)
    .sort((a, b) => b.percentage - a.percentage);

  const growthTopics = allTopics
    .filter((t) => !t.isStrong)
    .sort((a, b) => a.percentage - b.percentage);

  const overallMastery =
    totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

  return {
    allTopics,
    strongTopics,
    growthTopics,
    overallMastery,
  };
}
