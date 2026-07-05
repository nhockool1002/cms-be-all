import { rankTitleForPostCount } from './rank-title';

describe('rankTitleForPostCount', () => {
  it('returns New Member for 0-4 posts', () => {
    expect(rankTitleForPostCount(0)).toBe('New Member');
    expect(rankTitleForPostCount(4)).toBe('New Member');
  });

  it('returns Member for 5-49 posts', () => {
    expect(rankTitleForPostCount(5)).toBe('Member');
    expect(rankTitleForPostCount(49)).toBe('Member');
  });

  it('returns Senior Member for 50-199 posts', () => {
    expect(rankTitleForPostCount(50)).toBe('Senior Member');
    expect(rankTitleForPostCount(199)).toBe('Senior Member');
  });

  it('returns Veteran Member for 200+ posts', () => {
    expect(rankTitleForPostCount(200)).toBe('Veteran Member');
    expect(rankTitleForPostCount(10000)).toBe('Veteran Member');
  });
});
