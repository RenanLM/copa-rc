import type { ChampionshipRules, RaceId, TeamId } from './types';

/** Publicação de uma equipe no feed de uma etapa. */
export interface FeedPost {
  id: string;
  teamId: TeamId;
  raceId: RaceId;
  /** ISO 8601, quando disponível. */
  publishedAt?: string;
  text: string;
  /** Publicações de demonstração nunca são exibidas como conteúdo real. */
  isDemo: boolean;
}

export function postsCount(
  posts: readonly FeedPost[],
  teamId: TeamId,
  raceId: RaceId,
): number {
  return posts.filter((p) => p.teamId === teamId && p.raceId === raceId).length;
}

/** Quantas publicações a equipe ainda pode fazer na etapa (nunca negativo). */
export function postsRemaining(
  posts: readonly FeedPost[],
  teamId: TeamId,
  raceId: RaceId,
  rules: Pick<ChampionshipRules, 'maxPostsPerTeamPerRace'>,
): number {
  return Math.max(0, rules.maxPostsPerTeamPerRace - postsCount(posts, teamId, raceId));
}

export function canTeamPost(
  posts: readonly FeedPost[],
  teamId: TeamId,
  raceId: RaceId,
  rules: Pick<ChampionshipRules, 'maxPostsPerTeamPerRace'>,
): boolean {
  return postsRemaining(posts, teamId, raceId, rules) > 0;
}

export interface FeedLimitViolation {
  teamId: TeamId;
  raceId: RaceId;
  count: number;
  max: number;
}

/** Combinações equipe/etapa que excedem o limite de publicações. */
export function findFeedLimitViolations(
  posts: readonly FeedPost[],
  rules: Pick<ChampionshipRules, 'maxPostsPerTeamPerRace'>,
): FeedLimitViolation[] {
  const counts = new Map<string, FeedLimitViolation>();
  for (const post of posts) {
    const key = `${post.teamId}|${post.raceId}`;
    const current = counts.get(key) ?? {
      teamId: post.teamId,
      raceId: post.raceId,
      count: 0,
      max: rules.maxPostsPerTeamPerRace,
    };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].filter((v) => v.count > v.max);
}
