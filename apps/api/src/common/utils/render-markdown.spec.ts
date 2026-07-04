import { renderMarkdown } from './render-markdown';

describe('renderMarkdown', () => {
  it('escapes HTML special characters', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('converts newlines to <br>', () => {
    expect(renderMarkdown('line one\nline two')).toBe('line one<br>line two');
  });
});
