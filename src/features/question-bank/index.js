export {
  createQuestion,
  isMultipleAnswer,
  QuestionDomainError,
} from './domain/question';
export {
  getTopicById,
  getTopicLabel,
  isValidTopic,
  listTopics,
  TOPIC_GROUPS,
  TOPICS,
} from './domain/topics';
export { validateQuestion } from './domain/questionValidation';
export {
  createQuestionRepository,
  questionRepository,
} from './data/questionRepository';
