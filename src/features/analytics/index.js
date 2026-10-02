export {
  MASTERY_THRESHOLD_PERCENT,
  MAX_EXAM_SCORE,
  UNT_TOPICS,
} from './domain/analyticsConstants';
export { calculateKPIs, calculateStudyStreak } from './domain/kpiCalculator';
export { calculateTopicMastery } from './domain/topicMasteryCalculator';
export { computeScoreTimeline } from './domain/scoreTimelineCalculator';
export { buildStudentAnalytics } from './domain/studentAnalytics';

export {
  analyticsRepository,
  createAnalyticsRepository,
} from './data/analyticsRepository';

export { useStudentAnalytics } from './hooks/useStudentAnalytics';

export { AnalyticsDashboard } from './ui/AnalyticsDashboard';
export { StreakFlame } from './ui/StreakFlame';
