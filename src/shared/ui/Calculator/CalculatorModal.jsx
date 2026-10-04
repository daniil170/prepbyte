import { useState, useEffect, useCallback } from 'react';
import styles from './CalculatorModal.module.css';

/**
 * Compact basic calculator supporting +, -, *, /
 */
export function CalculatorModal({ isOpen, onClose }) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const inputDigit = useCallback(
    (digit) => {
      if (waitingForOperand) {
        setDisplay(String(digit));
        setWaitingForOperand(false);
      } else {
        setDisplay(display === '0' ? String(digit) : display + digit);
      }
    },
    [display, waitingForOperand]
  );

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const performOperation = useCallback(
    (nextOperator) => {
      const inputValue = parseFloat(display);

      if (prevValue == null) {
        setPrevValue(inputValue);
      } else if (operator) {
        const currentValue = prevValue || 0;
        let newValue = 0;

        switch (operator) {
          case '+':
            newValue = currentValue + inputValue;
            break;
          case '-':
            newValue = currentValue - inputValue;
            break;
          case '*':
            newValue = currentValue * inputValue;
            break;
          case '/':
            newValue = inputValue !== 0 ? currentValue / inputValue : 0;
            break;
          default:
            newValue = inputValue;
        }

        const rounded = Math.round(newValue * 1e10) / 1e10;
        setPrevValue(rounded);
        setDisplay(String(rounded));
      }

      setWaitingForOperand(true);
      setOperator(nextOperator);
    },
    [display, operator, prevValue]
  );

  const handleEquals = useCallback(() => {
    if (!operator || prevValue == null) return;

    const inputValue = parseFloat(display);
    let newValue = 0;

    switch (operator) {
      case '+':
        newValue = prevValue + inputValue;
        break;
      case '-':
        newValue = prevValue - inputValue;
        break;
      case '*':
        newValue = prevValue * inputValue;
        break;
      case '/':
        newValue = inputValue !== 0 ? prevValue / inputValue : 0;
        break;
      default:
        newValue = inputValue;
    }

    const rounded = Math.round(newValue * 1e10) / 1e10;
    setDisplay(String(rounded));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, operator, prevValue]);

  const handleBackspace = useCallback(() => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display, waitingForOperand]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        inputDigit(parseInt(e.key, 10));
      } else if (e.key === '.') {
        inputDot();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('-');
      } else if (e.key === '*') {
        performOperation('*');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('/');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputDigit, inputDot, performOperation, handleEquals, handleBackspace, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>🧮 Калькулятор</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.displayArea}>
          <div className={styles.history}>
            {prevValue != null && operator ? `${prevValue} ${operator}` : ''}
          </div>
          <div className={styles.display}>{display}</div>
        </div>

        <div className={styles.keypad}>
          <button type="button" className={`${styles.btn} ${styles.btnClear}`} onClick={clearAll}>
            C
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnOp}`} onClick={handleBackspace}>
            ⌫
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOp} ${operator === '/' ? styles.btnOpActive : ''}`}
            onClick={() => performOperation('/')}
          >
            ÷
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOp} ${operator === '*' ? styles.btnOpActive : ''}`}
            onClick={() => performOperation('*')}
          >
            ×
          </button>

          <button type="button" className={styles.btn} onClick={() => inputDigit(7)}>
            7
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(8)}>
            8
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(9)}>
            9
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOp} ${operator === '-' ? styles.btnOpActive : ''}`}
            onClick={() => performOperation('-')}
          >
            -
          </button>

          <button type="button" className={styles.btn} onClick={() => inputDigit(4)}>
            4
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(5)}>
            5
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(6)}>
            6
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnOp} ${operator === '+' ? styles.btnOpActive : ''}`}
            onClick={() => performOperation('+')}
          >
            +
          </button>

          <button type="button" className={styles.btn} onClick={() => inputDigit(1)}>
            1
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(2)}>
            2
          </button>
          <button type="button" className={styles.btn} onClick={() => inputDigit(3)}>
            3
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnEquals}`} onClick={handleEquals}>
            =
          </button>

          <button type="button" className={`${styles.btn} ${styles.btnZero}`} onClick={() => inputDigit(0)}>
            0
          </button>
          <button type="button" className={styles.btn} onClick={inputDot}>
            .
          </button>
        </div>
      </div>
    </div>
  );
}
