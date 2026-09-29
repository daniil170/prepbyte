import { useMemo } from 'react';
import { parseQuestionText } from '@features/question-bank';
import styles from './QuestionContent.module.css';

/**
 * Renders question text segmented into text and fenced code blocks.
 *
 * @param {object} props
 * @param {string} props.text - Question markdown/text content.
 */
export function QuestionContent({ text }) {
  const segments = useMemo(() => parseQuestionText(text), [text]);

  if (!text || segments.length === 0) {
    return null;
  }

  return (
    <div className={styles.content}>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} className={styles.codeContainer}>
              {segment.language ? (
                <div className={styles.codeHeader}>{segment.language}</div>
              ) : null}
              <pre className={styles.pre}>
                <code className={styles.code}>{segment.content}</code>
              </pre>
            </div>
          );
        }

        return (
          <span key={index} className={styles.textSegment}>
            {segment.content}
          </span>
        );
      })}
    </div>
  );
}
