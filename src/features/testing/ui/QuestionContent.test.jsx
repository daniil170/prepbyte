import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionContent } from './QuestionContent';

describe('QuestionContent', () => {
  it('renders plain text question without code container', () => {
    const text = 'Какая память является энергозависимой?';
    render(<QuestionContent text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('code')).not.toBeInTheDocument();
  });

  it('renders fenced code blocks within <pre><code> with language tag', () => {
    const text =
      'Что выведет фрагмент кода?\n```python\nfor i in range(3):\n    print(i)\n```';
    render(<QuestionContent text={text} />);

    expect(screen.getByText(/Что выведет фрагмент кода\?/)).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText(/for i in range\(3\):/)).toBeInTheDocument();
  });

  it('returns null on empty text', () => {
    const { container } = render(<QuestionContent text="" />);
    expect(container.firstChild).toBeNull();
  });
});
