import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestingProvider } from './TestingProvider';
import { useTestingDependencies } from './useTestingDependencies';

function TestConsumer() {
  const { sessionRepository, questionRepository, now } =
    useTestingDependencies();
  return (
    <div>
      <div data-testid="has-session-repo">
        {Boolean(sessionRepository).toString()}
      </div>
      <div data-testid="has-question-repo">
        {Boolean(questionRepository).toString()}
      </div>
      <div data-testid="current-now">{now()}</div>
    </div>
  );
}

describe('TestingProvider and useTestingDependencies', () => {
  it('throws an error when useTestingDependencies is called outside TestingProvider', () => {
    // Suppress React boundary console error for expected throw
    const originalError = console.error;
    console.error = () => {};

    expect(() => render(<TestConsumer />)).toThrow(
      'useTestingDependencies must be used within a TestingProvider'
    );

    console.error = originalError;
  });

  it('provides default dependencies when no props are specified', () => {
    render(
      <TestingProvider>
        <TestConsumer />
      </TestingProvider>
    );

    expect(screen.getByTestId('has-session-repo').textContent).toBe('true');
    expect(screen.getByTestId('has-question-repo').textContent).toBe('true');
    expect(
      Number(screen.getByTestId('current-now').textContent)
    ).toBeGreaterThan(0);
  });

  it('provides injected fake dependencies and fixed clock', () => {
    const fakeSessionRepo = { fakeSession: true };
    const fakeQuestionRepo = { fakeQuestion: true };
    const fixedNow = () => 1700000000000;

    function CustomConsumer() {
      const { sessionRepository, questionRepository, now } =
        useTestingDependencies();
      return (
        <div>
          <div data-testid="session-flag">
            {fakeSessionRepo === sessionRepository ? 'matched' : 'unmatched'}
          </div>
          <div data-testid="question-flag">
            {fakeQuestionRepo === questionRepository ? 'matched' : 'unmatched'}
          </div>
          <div data-testid="now-val">{now()}</div>
        </div>
      );
    }

    render(
      <TestingProvider
        sessionRepository={fakeSessionRepo}
        questionRepository={fakeQuestionRepo}
        now={fixedNow}
      >
        <CustomConsumer />
      </TestingProvider>
    );

    expect(screen.getByTestId('session-flag').textContent).toBe('matched');
    expect(screen.getByTestId('question-flag').textContent).toBe('matched');
    expect(screen.getByTestId('now-val').textContent).toBe('1700000000000');
  });
});
