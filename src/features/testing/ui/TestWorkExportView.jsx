import { useMemo, useState } from 'react';
import { getTopicLabel } from '@features/question-bank';
import { QuestionContent } from './QuestionContent';
import styles from './TestWorkExportView.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Generates a self-contained offline HTML document containing full exam protocol.
 */
function generateHtmlReport({
  session,
  totalScore,
  maxPossibleScore,
  percentage,
  passed,
  part1Score,
  part2Score,
  detailedResults,
}) {
  const formattedDate = new Date(session?.completedAt || Date.now()).toLocaleString('ru-RU');
  const userId = session?.userId || 'Учащийся PrepByte';
  const sessionId = session?.id || 'session-demo';

  const questionsHtml = detailedResults
    .map((r, idx) => {
      const typeText = r.isMultipleChoice
        ? 'Множественный выбор (2 б.)'
        : 'Одиночный выбор (1 б.)';
      const statusColor = r.isCorrect ? '#16a34a' : r.isPartiallyCorrect ? '#ca8a04' : '#dc2626';
      const pointsText = r.isCorrect
        ? `+${r.pointsAwarded} / ${r.maxPoints} б.`
        : r.isPartiallyCorrect
          ? `+${r.pointsAwarded} / ${r.maxPoints} б.`
          : `0 / ${r.maxPoints} б.`;

      const optionsHtml = r.options
        .map((opt, optIdx) => {
          const letter = OPTION_LETTERS[optIdx] || optIdx + 1;
          const isUser = r.userAnswers.includes(optIdx);
          const isCorrect = r.correctAnswers.includes(optIdx);

          let bg = '#ffffff';
          let border = '#e2e8f0';
          let tag = '';

          if (isUser && isCorrect) {
            bg = '#f0fdf4';
            border = '#86efac';
            tag = '<span style="background:#bbf7d0;color:#14532d;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;">✓ Ваш верный ответ</span>';
          } else if (isUser && !isCorrect) {
            bg = '#fef2f2';
            border = '#fca5a5';
            tag = '<span style="background:#fecaca;color:#7f1d1d;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;">✗ Ваш ошибочный выбор</span>';
          } else if (!isUser && isCorrect) {
            bg = '#fffbeb';
            border = '#fde68a';
            tag = '<span style="background:#fef08a;color:#713f12;font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;">★ Правильный ответ</span>';
          }

          return `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:8px 12px;border:1px solid ${border};background:${bg};border-radius:6px;margin-bottom:6px;font-size:14px;">
              <div><strong>${letter}.</strong> ${opt}</div>
              ${tag}
            </div>
          `;
        })
        .join('');

      const explanationHtml = r.explanation
        ? `<div style="background:#f8fafc;border-left:3px solid #64748b;padding:10px 12px;margin-top:10px;border-radius:4px;font-size:13px;color:#334155;">
             <strong style="display:block;margin-bottom:4px;color:#475569;text-transform:uppercase;font-size:11px;">Пояснение к решению:</strong>
             ${r.explanation}
           </div>`
        : '';

      return `
        <div style="border:1px solid #e2e8f0;border-left:4px solid ${statusColor};border-radius:8px;padding:16px;margin-bottom:16px;background:#ffffff;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
              <span style="font-weight:800;font-size:15px;color:#0f172a;">Вопрос №${idx + 1}</span>
              <span style="background:#f1f5f9;color:#475569;font-size:12px;padding:2px 8px;border-radius:4px;margin-left:8px;">${getTopicLabel(r.topic) || r.topic}</span>
              <span style="font-size:12px;color:#64748b;margin-left:8px;">(${typeText})</span>
            </div>
            <span style="font-weight:800;font-size:14px;color:${statusColor};">${pointsText}</span>
          </div>
          <div style="font-size:14px;color:#1e293b;margin-bottom:12px;white-space:pre-wrap;">${r.questionText}</div>
          <div>${optionsHtml}</div>
          ${explanationHtml}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Протокол ЕНТ Информатика — ${userId} (${totalScore} из 50)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .sheet { max-width: 860px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .score-box { background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    @media print { body { background: #ffffff; padding: 0; } .sheet { box-shadow: none; border: none; padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header-box">
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.08em;margin-bottom:8px;">
        <span>Республика Казахстан · Официальный формат ЕНТ</span>
        <span>PrepByte Информатика</span>
      </div>
      <h1 style="font-size:22px;margin:0 0 6px;text-align:center;color:#0f172a;">ПРОТОКОЛ РЕЗУЛЬТАТОВ ПРОБНОГО ТЕСТИРОВАНИЯ ЕНТ</h1>
      <p style="font-size:14px;color:#475569;margin:0;text-align:center;">Предмет: Информатика (40 заданий / 50 баллов)</p>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;margin-top:16px;font-size:13px;">
        <div><strong style="color:#64748b;display:block;font-size:11px;">УЧАЩИЙСЯ:</strong> ${userId}</div>
        <div><strong style="color:#64748b;display:block;font-size:11px;">ДАТА И ВРЕМЯ:</strong> ${formattedDate}</div>
        <div><strong style="color:#64748b;display:block;font-size:11px;">ID СЕССИИ:</strong> ${sessionId}</div>
      </div>
    </div>

    <div class="score-box">
      <div>
        <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Итоговый балл</div>
        <div style="font-size:42px;font-weight:900;line-height:1;color:#0f172a;margin:6px 0;">${totalScore} <span style="font-size:20px;color:#64748b;">/ ${maxPossibleScore}</span> <span style="font-size:18px;color:#2563eb;">(${percentage}%)</span></div>
        <span style="display:inline-block;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700;background:${passed ? '#dcfce7' : '#fee2e2'};color:${passed ? '#166534' : '#991b1b'};">
          ${passed ? '✓ Пороговый балл сдан' : '✗ Пороговый балл не набран'}
        </span>
      </div>
      <div style="text-align:right;font-size:14px;color:#334155;">
        <div><strong>Часть 1 (№ 1–30):</strong> ${part1Score} из 30 б.</div>
        <div style="margin-top:4px;"><strong>Часть 2 (№ 31–40):</strong> ${part2Score} из 20 б.</div>
      </div>
    </div>

    <h2 style="font-size:16px;border-bottom:2px solid #0f172a;padding-bottom:6px;margin:28px 0 16px;">РАЗБОР ВСЕХ ЗАДАНИЙ (1–40)</h2>
    <div>${questionsHtml}</div>

    <div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:32px;display:flex;justify-content:space-between;font-size:12px;color:#64748b;">
      <span>Сгенерировано платформой PrepByte · ЕНТ Информатика</span>
      <span>${formattedDate}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Official UNT White Sheet Protocol & Detailed Work Export View.
 */
export function TestWorkExportView({ session, scoreData = {}, onClose }) {
  const [copied, setCopied] = useState(false);

  const {
    totalScore = 0,
    maxPossibleScore = 50,
    percentage = 0,
    passed = false,
    detailedResults = [],
  } = scoreData;

  // Split results into Part 1 (1–30) and Part 2 (31–40)
  const part1Results = useMemo(() => detailedResults.slice(0, 30), [detailedResults]);
  const part2Results = useMemo(() => detailedResults.slice(30, 40), [detailedResults]);

  const part1Score = useMemo(
    () => part1Results.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
    [part1Results]
  );
  const part2Score = useMemo(
    () => part2Results.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0),
    [part2Results]
  );

  const totalQuestions = detailedResults.length;
  const correctCount = detailedResults.filter((r) => r.isCorrect).length;
  const partialCount = detailedResults.filter((r) => r.isPartiallyCorrect).length;
  const mistakeCount = detailedResults.filter((r) => !r.isCorrect && !r.isPartiallyCorrect).length;

  const completedAt = session?.completedAt;
  const formattedDate = useMemo(() => {
    return completedAt ? new Date(completedAt).toLocaleString('ru-RU') : 'Сегодня';
  }, [completedAt]);
  const studentIdentifier = session?.userId || 'Учащийся PrepByte';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const htmlString = generateHtmlReport({
      session,
      totalScore,
      maxPossibleScore,
      percentage,
      passed,
      part1Score,
      part2Score,
      detailedResults,
    });

    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ЕНТ_Информатика_Протокол_${session?.id || 'export'}_${totalScore}из50.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    const textSummary = `
ОФИЦИАЛЬНЫЙ ПРОТОКОЛ ЕНТ: ИНФОРМАТИКА
Учащийся: ${studentIdentifier}
Дата: ${formattedDate}
Сессия: ${session?.id || '—'}
Итоговый балл: ${totalScore} / ${maxPossibleScore} (${percentage}%)
Статус: ${passed ? 'СДАНО' : 'НЕ СДАНО'}
Часть 1 (№ 1–30): ${part1Score} / 30 б.
Часть 2 (№ 31–40): ${part2Score} / 20 б.
Правильно: ${correctCount}, Частично: ${partialCount}, Ошибок: ${mistakeCount}
Платформа: PrepByte (Подготовка к ЕНТ)
    `.trim();

    try {
      await navigator.clipboard.writeText(textSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Бланк работы ЕНТ">
      {/* Top Floating Action Bar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <span>📄</span>
          <span>Официальный бланк работы (ЕНТ Информатика)</span>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
            onClick={handlePrint}
            title="Распечатать или сохранить в формате PDF"
          >
            🖨️ Печать / В PDF
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleDownloadHtml}
            title="Скачать автономный HTML-файл с результатами"
          >
            💾 Скачать HTML-отчет
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCopySummary}
            title="Скопировать текстовую сводку в буфер обмена"
          >
            {copied ? '✓ Скопировано' : '📋 Скопировать сводку'}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionButtonClose}`}
            onClick={onClose}
            aria-label="Закрыть бланк"
          >
            ✕ Закрыть
          </button>
        </div>
      </div>

      {/* Pure White Document Sheet */}
      <article className={styles.paper} id="unt-export-paper">
        {/* Protocol Header */}
        <header className={styles.protocolHeader}>
          <div className={styles.headerEmblemRow}>
            <span className={styles.countryTitle}>
              РЕСПУБЛИКА КАЗАХСТАН · НАЦИОНАЛЬНЫЙ ЦЕНТР ТЕСТИРОВАНИЯ (МОДЕЛЬ)
            </span>
            <span className={styles.platformTitle}>
              <span>⚡</span> PrepByte
            </span>
          </div>

          <h1 className={styles.protocolTitle}>
            ПРОТОКОЛ РЕЗУЛЬТАТОВ ПРОБНОГО ТЕСТИРОВАНИЯ
          </h1>
          <p className={styles.protocolSubtitle}>
            Единое Национальное Тестирование · Профильный предмет: Информатика
          </p>

          <div className={styles.metadataGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Учащийся</span>
              <span className={styles.metaValue}>{studentIdentifier}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Дата прохождения</span>
              <span className={styles.metaValue}>{formattedDate}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>ID Сессии</span>
              <span className={styles.metaValue}>{session?.id || '—'}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Формат теста</span>
              <span className={styles.metaValue}>40 заданий / 50 баллов</span>
            </div>
          </div>
        </header>

        {/* Big Score Summary Banner */}
        <section className={styles.scoreBanner} aria-label="Итоговая оценка">
          <div className={styles.scoreBannerMain}>
            <span className={styles.scoreBannerLabel}>Итоговый результат ЕНТ</span>
            <div className={styles.scoreBannerValue}>
              <span className={styles.scoreBannerBig}>{totalScore}</span>
              <span className={styles.scoreBannerTotal}>/ {maxPossibleScore}</span>
              <span className={styles.scoreBannerPercent}>({percentage}%)</span>
            </div>
            <div
              className={`${styles.statusPill} ${
                passed ? styles.statusPillPassed : styles.statusPillFailed
              }`}
            >
              <span>{passed ? '✓' : '✗'}</span>
              <span>{passed ? 'Пороговый балл сдан (≥ 50%)' : 'Пороговый балл не набран (< 50%)'}</span>
            </div>
          </div>

          <div className={styles.scoreBannerDetails}>
            <div className={styles.scoreSubCard}>
              <span className={styles.scoreSubCardTitle}>Часть 1 (№ 1–30)</span>
              <span className={styles.scoreSubCardValue}>{part1Score} / 30 б.</span>
              <span className={styles.scoreSubCardDesc}>Одиночный выбор (1 б./задание)</span>
            </div>
            <div className={styles.scoreSubCard}>
              <span className={styles.scoreSubCardTitle}>Часть 2 (№ 31–40)</span>
              <span className={styles.scoreSubCardValue}>{part2Score} / 20 б.</span>
              <span className={styles.scoreSubCardDesc}>Множественный выбор (2 б./задание)</span>
            </div>
            <div className={styles.scoreSubCard}>
              <span className={styles.scoreSubCardTitle}>Точность</span>
              <span className={styles.scoreSubCardValue}>{correctCount} из {totalQuestions}</span>
              <span className={styles.scoreSubCardDesc}>Заданий на полный балл</span>
            </div>
            <div className={styles.scoreSubCard}>
              <span className={styles.scoreSubCardTitle}>Ошибки / Частично</span>
              <span className={styles.scoreSubCardValue}>{mistakeCount} / {partialCount}</span>
              <span className={styles.scoreSubCardDesc}>Ошибок / Снятий балла</span>
            </div>
          </div>
        </section>

        {/* Quick Answer Matrix Table (Бланк ответов 1..40) */}
        <section aria-label="Сводная таблица ответов">
          <h2 className={styles.sectionTitle}>
            <span>Сводная ведомость ответов (Бланк ответов № 1–40)</span>
            <span className={styles.sectionBadge}>Все 40 вопросов</span>
          </h2>

          <div className={styles.matrixGrid}>
            {detailedResults.map((r, idx) => {
              const userLetters = r.userAnswers.map((i) => OPTION_LETTERS[i] || i + 1).join(',') || '—';
              const correctLetters = r.correctAnswers.map((i) => OPTION_LETTERS[i] || i + 1).join(',');
              const itemClass = r.isCorrect
                ? styles.matrixItemCorrect
                : r.isPartiallyCorrect
                  ? styles.matrixItemPartial
                  : styles.matrixItemIncorrect;

              const tagClass = r.isCorrect
                ? styles.tagCorrect
                : r.isPartiallyCorrect
                  ? styles.tagPartial
                  : styles.tagIncorrect;

              return (
                <div key={r.id || idx} className={`${styles.matrixItem} ${itemClass}`}>
                  <span className={styles.matrixNumber}>№{idx + 1}</span>
                  <div className={styles.matrixAnswerRow}>
                    <span className={styles.matrixUserAnswer}>{userLetters}</span>
                  </div>
                  <div className={styles.matrixCorrectAnswer}>[{correctLetters}]</div>
                  <span className={`${styles.matrixScoreTag} ${tagClass}`}>
                    +{r.pointsAwarded}/{r.maxPoints}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Register of all Questions */}
        <section aria-label="Развернутый реестр заданий">
          {/* Part 1 Header */}
          <div className={styles.partHeader}>
            <h3 className={styles.partTitle}>
              ЧАСТЬ 1. Задания с одним правильным ответом (№ 1–30)
            </h3>
            <span className={styles.partScore}>{part1Score} из 30 баллов</span>
          </div>

          {part1Results.map((result, idx) => (
            <QuestionReviewItem
              key={result.id || idx}
              number={idx + 1}
              result={result}
            />
          ))}

          {/* Part 2 Header */}
          {part2Results.length > 0 ? (
            <>
              <div className={styles.partHeader}>
                <h3 className={styles.partTitle}>
                  ЧАСТЬ 2. Задания с несколькими правильными ответами (№ 31–40)
                </h3>
                <span className={styles.partScore}>{part2Score} из 20 баллов</span>
              </div>

              {part2Results.map((result, idx) => (
                <QuestionReviewItem
                  key={result.id || idx + 30}
                  number={idx + 31}
                  result={result}
                />
              ))}
            </>
          ) : null}
        </section>

        {/* Official Protocol Footer */}
        <footer className={styles.protocolFooter}>
          <span>PrepByte · Сервис комплексной подготовки к ЕНТ по Информатике</span>
          <span>Документ сформирован автоматически · {formattedDate}</span>
        </footer>
      </article>
    </div>
  );
}

function QuestionReviewItem({ number, result }) {
  const pointsClass = result.isCorrect
    ? styles.pointsCorrect
    : result.isPartiallyCorrect
      ? styles.pointsPartial
      : styles.pointsIncorrect;

  const itemClass = result.isCorrect
    ? styles.questionItemCorrect
    : result.isPartiallyCorrect
      ? styles.questionItemPartial
      : styles.questionItemIncorrect;

  const pointsText = result.isCorrect
    ? `+${result.pointsAwarded} / ${result.maxPoints} б.`
    : result.isPartiallyCorrect
      ? `+${result.pointsAwarded} / ${result.maxPoints} б.`
      : `0 / ${result.maxPoints} б.`;

  return (
    <article className={`${styles.questionItem} ${itemClass}`}>
      <div className={styles.questionItemHeader}>
        <div className={styles.questionItemMeta}>
          <span className={styles.questionItemNum}>Задание №{number}</span>
          <span className={styles.questionItemTopic}>
            {getTopicLabel(result.topic) || result.topic}
          </span>
          <span className={styles.questionItemType}>
            {result.isMultipleChoice ? 'Множественный выбор' : 'Одиночный выбор'}
          </span>
        </div>

        <span className={`${styles.questionItemPoints} ${pointsClass}`}>
          {pointsText}
        </span>
      </div>

      <div className={styles.questionBody}>
        <QuestionContent text={result.questionText} />
      </div>

      <div className={styles.optionsContainer}>
        {result.options.map((option, optIdx) => {
          const letter = OPTION_LETTERS[optIdx] || optIdx + 1;
          const isUserSelected = result.userAnswers.includes(optIdx);
          const isCorrectOption = result.correctAnswers.includes(optIdx);

          let rowStyle = styles.optionRow;
          let statusTag = null;

          if (isUserSelected && isCorrectOption) {
            rowStyle = `${styles.optionRow} ${styles.optionChosenCorrect}`;
            statusTag = (
              <span className={`${styles.optionTagStatus} ${styles.tagStudentCorrect}`}>
                ✓ Ваш верный ответ
              </span>
            );
          } else if (isUserSelected && !isCorrectOption) {
            rowStyle = `${styles.optionRow} ${styles.optionChosenIncorrect}`;
            statusTag = (
              <span className={`${styles.optionTagStatus} ${styles.tagStudentWrong}`}>
                ✗ Ваш ошибочный выбор
              </span>
            );
          } else if (!isUserSelected && isCorrectOption) {
            rowStyle = `${styles.optionRow} ${styles.optionMissedCorrect}`;
            statusTag = (
              <span className={`${styles.optionTagStatus} ${styles.tagShouldPick}`}>
                ★ Правильный ответ
              </span>
            );
          }

          return (
            <div key={optIdx} className={rowStyle}>
              <div className={styles.optionTextGroup}>
                <span className={styles.optionLetter}>{letter}.</span>
                <span>{option}</span>
              </div>
              {statusTag}
            </div>
          );
        })}
      </div>

      {result.explanation ? (
        <div className={styles.explanationBox}>
          <h4 className={styles.explanationHeading}>Пояснение к решению:</h4>
          <p className={styles.explanationText}>{result.explanation}</p>
        </div>
      ) : null}
    </article>
  );
}
