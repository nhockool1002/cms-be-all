const RANK_THRESHOLDS: Array<{ minPosts: number; title: string }> = [
  { minPosts: 200, title: 'Veteran Member' },
  { minPosts: 50, title: 'Senior Member' },
  { minPosts: 5, title: 'Member' },
  { minPosts: 0, title: 'New Member' },
];

export function rankTitleForPostCount(postCount: number): string {
  return RANK_THRESHOLDS.find((tier) => postCount >= tier.minPosts)!.title;
}
