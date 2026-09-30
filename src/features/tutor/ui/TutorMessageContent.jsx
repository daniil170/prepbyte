import { useMemo } from 'react';
import styles from './TutorMessageContent.module.css';

/**
 * Parses and formats markdown lines into styled elements (headings, code blocks, lists, quotes).
 *
 * @param {string} text
 * @returns {Array<object>}
 */
function parseMarkdownBlocks(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const blocks = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          language: codeLang,
          content: codeContent.join('\n'),
        });
        inCodeBlock = false;
        codeLang = '';
        codeContent = [];
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: line.slice(5).trim() });
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', content: line.slice(2).trim() });
      continue;
    }

    // Bullet or numbered list item
    if (line.trim().match(/^[-*•]\s+/)) {
      blocks.push({
        type: 'list_item',
        content: line.trim().replace(/^[-*•]\s+/, ''),
      });
      continue;
    }

    if (line.trim().match(/^\d+\.\s+/)) {
      blocks.push({
        type: 'list_item',
        content: line.trim().replace(/^\d+\.\s+/, ''),
      });
      continue;
    }

    // Divider
    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({ type: 'divider' });
      continue;
    }

    // Standard paragraph
    if (line.trim()) {
      blocks.push({ type: 'paragraph', content: line });
    }
  }

  // If unclosed code block at end of text
  if (inCodeBlock && codeContent.length > 0) {
    blocks.push({
      type: 'code',
      language: codeLang,
      content: codeContent.join('\n'),
    });
  }

  return blocks;
}

/**
 * Parses inline bold **text** and inline code `code`.
 *
 * @param {string} text
 * @returns {React.ReactNode}
 */
function renderInlineFormatting(text) {
  if (!text) return null;

  // Split on bold or code
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={index} className={styles.inlineCode}>
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className={styles.boldText}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    return token;
  });
}

/**
 * Formats message markdown text for the AI tutor.
 *
 * @param {object} props
 * @param {string} props.content - Markdown message string.
 */
export function TutorMessageContent({ content }) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={styles.wrapper}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h3':
            return (
              <h3 key={index} className={styles.heading3}>
                {renderInlineFormatting(block.content)}
              </h3>
            );
          case 'h4':
            return (
              <h4 key={index} className={styles.heading4}>
                {renderInlineFormatting(block.content)}
              </h4>
            );
          case 'quote':
            return (
              <blockquote key={index} className={styles.quote}>
                {renderInlineFormatting(block.content)}
              </blockquote>
            );
          case 'code':
            return (
              <div key={index} className={styles.codeContainer}>
                {block.language && (
                  <div className={styles.codeBadge}>{block.language}</div>
                )}
                <pre className={styles.pre}>
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          case 'list_item':
            return (
              <div key={index} className={styles.listItem}>
                <span className={styles.bullet}>•</span>
                <span className={styles.listText}>
                  {renderInlineFormatting(block.content)}
                </span>
              </div>
            );
          case 'divider':
            return <hr key={index} className={styles.divider} />;
          default:
            return (
              <p key={index} className={styles.paragraph}>
                {renderInlineFormatting(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
