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
export { parseQuestionText } from './domain/questionText';
export {
  createQuestionRepository,
  questionRepository,
} from './data/questionRepository';
export {
  AI_VARIANT_JSON_SCHEMA,
  AI_VARIANT_SYSTEM_PROMPT,
  buildAiVariantPrompt,
  VARIANT_SPECIFICATION,
} from './domain/aiPromptTemplates';
