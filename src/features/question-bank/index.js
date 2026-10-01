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
  buildTopicDeepDivePrompt,
  VARIANT_SPECIFICATION,
} from './domain/aiPromptTemplates';
export { generateCurriculumQuestions } from './domain/curriculumGenerator';
export { validateVariantPayload } from './domain/variantValidation';
export { useVariantUploader } from './hooks/useVariantUploader';
export { useAiVariantGenerator } from './hooks/useAiVariantGenerator';
export { AdminVariantsPage } from './ui/AdminVariantsPage';
export { AiVariantGenerator } from './ui/AiVariantGenerator';
export { VariantDropzone } from './ui/VariantDropzone';
export { VariantValidationSummary } from './ui/VariantValidationSummary';
export {
  auditBank,
  calculateJaccardSimilarity,
  extractWordShingles,
  findExactDuplicates,
  findNearDuplicates,
  normalizeQuestionText,
} from './domain/questionSimilarity';
export {
  normalizeDocumentText,
  isStructuralStart,
} from './domain/documentNormalization';
export {
  parseQuestionBlocks,
  parseAnswerLabels,
  parseAnswerKeySection,
  resolveAnswerIndices,
  normalizeLabel,
} from './domain/questionBlockParser';
export { buildImportedQuestions } from './domain/questionImportMapper';
export {
  readDocumentText,
  readDocxText,
  readPdfText,
  extractPageTextFromItems,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_PDF_PAGES,
} from './data/documentReaders';
