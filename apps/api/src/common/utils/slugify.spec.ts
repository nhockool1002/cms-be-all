import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('General Discussion')).toBe('general-discussion');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify('What is 2 + 2?!')).toBe('what-is-2-2');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --hello world--  ')).toBe('hello-world');
  });
});
