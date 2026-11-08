import type { ChampionshipRules, FeedPost, RaceId, TeamId } from './types';

/**
 * Regras do feed. A regra oficial, "cada equipe pode fazer até quatro publicações
 * no feed de cada prova", vive aqui e em `OFFICIAL_RULES`: nenhuma tela a repete.
 */

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

/** Uso da cota de uma equipe em uma etapa: "3 de 4". */
export interface FeedQuota {
  teamId: TeamId;
  raceId: RaceId;
  count: number;
  max: number;
  remaining: number;
  /** Atingiu o limite: não pode mais publicar nesta etapa. */
  full: boolean;
}

export function feedQuota(
  posts: readonly FeedPost[],
  teamId: TeamId,
  raceId: RaceId,
  rules: Pick<ChampionshipRules, 'maxPostsPerTeamPerRace'>,
): FeedQuota {
  const count = postsCount(posts, teamId, raceId);
  const max = rules.maxPostsPerTeamPerRace;
  return { teamId, raceId, count, max, remaining: Math.max(0, max - count), full: count >= max };
}

export interface FeedFilter {
  /** null/ausente = todas as equipes. */
  teamId?: TeamId | null;
  /** null/ausente = todas as etapas. */
  raceId?: RaceId | null;
}

/** Publicações que atendem aos DOIS filtros ao mesmo tempo. */
export function filterFeed(posts: readonly FeedPost[], filter: FeedFilter): FeedPost[] {
  return posts.filter(
    (post) =>
      (!filter.teamId || post.teamId === filter.teamId) &&
      (!filter.raceId || post.raceId === filter.raceId),
  );
}

/** Mais recentes primeiro. Sem data vai para o fim; empate de horário desempata pelo id. */
export function sortFeed(posts: readonly FeedPost[]): FeedPost[] {
  return [...posts].sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id);
    }
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return a.id.localeCompare(b.id);
  });
}

/** Etapas que têm ao menos uma publicação, sem repetição, na ordem em que aparecem em `order`. */
export function racesWithPosts(posts: readonly FeedPost[], order: readonly RaceId[]): RaceId[] {
  const present = new Set(posts.map((p) => p.raceId));
  return order.filter((id) => present.has(id));
}

/** Data e hora no formato aceito pelos dados: AAAA-MM-DDTHH:mm (ou com segundos). */
export const POST_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
