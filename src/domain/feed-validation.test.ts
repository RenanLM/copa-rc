import { buildDemoChampionship } from '@/data/demo';
import {
  canTeamPost,
  feedQuota,
  filterFeed,
  findFeedLimitViolations,
  postsRemaining,
  racesWithPosts,
  sortFeed,
} from './feed';
import { OFFICIAL_RULES } from './rules';
import type { FeedPost } from './types';
import { validateChampionship } from './validation';

const post = (
  n: number,
  teamId = 'torque-lab',
  raceId = 'etapa-3',
  publishedAt?: string,
): FeedPost => ({
  id: `p${n}`,
  teamId,
  raceId,
  kind: 'event',
  title: `Título ${n}`,
  text: 'Teste',
  publishedAt,
  imageAlt: 'Imagem de teste',
  isDemo: true,
});

describe('limite de publicações por equipe e prova', () => {
  it('permite até 4 publicações', () => {
    const posts = [post(1), post(2), post(3)];
    expect(postsRemaining(posts, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toBe(1);
    expect(canTeamPost(posts, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toBe(true);
  });

  it('bloqueia a 5ª publicação da mesma equipe na mesma etapa', () => {
    const posts = [1, 2, 3, 4].map((n) => post(n));
    expect(canTeamPost(posts, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toBe(false);
    expect(postsRemaining(posts, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toBe(0);
  });

  it('o limite é por equipe e por etapa, não global', () => {
    const posts = [1, 2, 3, 4].map((n) => post(n));
    expect(canTeamPost(posts, 'apex-racing', 'etapa-3', OFFICIAL_RULES)).toBe(true);
    expect(canTeamPost(posts, 'torque-lab', 'etapa-2', OFFICIAL_RULES)).toBe(true);
  });

  it('detecta violações em conjuntos de dados', () => {
    const posts = [1, 2, 3, 4, 5].map((n) => post(n));
    expect(findFeedLimitViolations(posts, OFFICIAL_RULES)).toEqual([
      { teamId: 'torque-lab', raceId: 'etapa-3', count: 5, max: 4 },
    ]);
    expect(findFeedLimitViolations(posts.slice(0, 4), OFFICIAL_RULES)).toEqual([]);
  });

  it('feedQuota resume o uso da cota da equipe na etapa', () => {
    const posts = [post(1), post(2), post(3, 'apex-racing')];
    expect(feedQuota(posts, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toEqual({
      teamId: 'torque-lab',
      raceId: 'etapa-3',
      count: 2,
      max: 4,
      remaining: 2,
      full: false,
    });
    const full = [1, 2, 3, 4].map((n) => post(n));
    expect(feedQuota(full, 'torque-lab', 'etapa-3', OFFICIAL_RULES)).toMatchObject({
      count: 4,
      remaining: 0,
      full: true,
    });
  });
});

describe('filtro e ordem do feed', () => {
  const posts = [
    post(1, 'torque-lab', 'etapa-1'),
    post(2, 'torque-lab', 'etapa-3'),
    post(3, 'apex-racing', 'etapa-3'),
    post(4, 'apex-racing', 'etapa-1'),
  ];
  const ids = (list: readonly FeedPost[]) => list.map((p) => p.id);

  it('sem filtro devolve tudo', () => {
    expect(ids(filterFeed(posts, {}))).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(ids(filterFeed(posts, { teamId: null, raceId: null }))).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('filtra por equipe, por etapa e pelos dois ao mesmo tempo', () => {
    expect(ids(filterFeed(posts, { teamId: 'torque-lab' }))).toEqual(['p1', 'p2']);
    expect(ids(filterFeed(posts, { raceId: 'etapa-3' }))).toEqual(['p2', 'p3']);
    expect(ids(filterFeed(posts, { teamId: 'torque-lab', raceId: 'etapa-3' }))).toEqual(['p2']);
  });

  it('a combinação sem publicações devolve lista vazia', () => {
    expect(filterFeed(posts, { teamId: 'nitro-garage', raceId: 'etapa-3' })).toEqual([]);
  });

  it('ordena do mais recente ao mais antigo, com as sem data por último', () => {
    const list = [
      post(1, 'torque-lab', 'etapa-3', '2026-09-26T18:00'),
      post(2, 'torque-lab', 'etapa-3'),
      post(3, 'torque-lab', 'etapa-3', '2026-09-27T17:00'),
      post(4, 'torque-lab', 'etapa-3', '2026-09-26T18:00'),
    ];
    expect(ids(sortFeed(list))).toEqual(['p3', 'p1', 'p4', 'p2']);
    // não altera a lista original
    expect(ids(list)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('racesWithPosts mantém a ordem do calendário e não repete', () => {
    expect(racesWithPosts(posts, ['etapa-1', 'etapa-2', 'etapa-3', 'etapa-4'])).toEqual([
      'etapa-1',
      'etapa-3',
    ]);
  });
});

describe('validateChampionship', () => {
  const demo = buildDemoChampionship();
  const codes = (c: typeof demo) => validateChampionship(c).map((i) => i.code);

  it('rejeita calendário com número de provas diferente de 5', () => {
    expect(codes({ ...demo, races: demo.races.slice(0, 4) })).toContain('race-count');
  });

  it('rejeita equipe sem exatamente 2 pilotos', () => {
    const pilots = demo.pilots.filter((p) => p.id !== 'bianca-moreira');
    expect(codes({ ...demo, pilots })).toContain('team-size');
  });

  it('rejeita posições repetidas em uma etapa', () => {
    const results = demo.results.map((r, i) =>
      i === 0
        ? { ...r, final: r.final.map((e, j) => (j === 1 ? { ...e, position: 1 } : e)) }
        : r,
    );
    expect(codes({ ...demo, results })).toContain('positions');
  });

  it('rejeita etapa finalizada sem resultado e resultado de etapa não finalizada', () => {
    expect(codes({ ...demo, results: demo.results.slice(0, 2) })).toContain('result-missing');
    const races = demo.races.map((r) => (r.id === 'etapa-3' ? { ...r, status: 'scheduled' as const } : r));
    expect(codes({ ...demo, races })).toContain('result-unfinished');
  });
});

describe('validação do feed', () => {
  const demo = buildDemoChampionship();
  const valid = (extra: FeedPost[]) => ({ ...demo, feed: [...demo.feed, ...extra] });
  const codes = (c: typeof demo) => validateChampionship(c).map((i) => i.code);
  const base = (over: Partial<FeedPost> = {}): FeedPost => ({
    ...post(900, 'nitro-garage', 'etapa-3', '2026-09-27T20:00'),
    ...over,
  });

  it('o feed de demonstração é válido', () => {
    expect(validateChampionship(demo)).toEqual([]);
  });

  it('aceita publicação nova que respeita todas as regras', () => {
    expect(codes(valid([base()]))).toEqual([]);
  });

  it('rejeita a 5ª publicação da equipe na etapa', () => {
    const extras = [1, 2, 3, 4, 5].map((n) =>
      base({ id: `extra-${n}`, teamId: 'torque-lab', publishedAt: '2026-09-27T20:00' }),
    );
    expect(codes(valid(extras))).toContain('post-limit');
  });

  it('rejeita id repetido, equipe, etapa e piloto inexistentes', () => {
    expect(codes(valid([base({ id: demo.feed[0]!.id })]))).toContain('post-duplicate');
    expect(codes(valid([base({ teamId: 'ninguem' })]))).toContain('post-team-unknown');
    expect(codes(valid([base({ raceId: 'etapa-9' })]))).toContain('post-race-unknown');
    expect(codes(valid([base({ pilotIds: ['fantasma'] })]))).toContain('post-pilot-unknown');
  });

  it('rejeita publicação de etapa ainda agendada', () => {
    expect(codes(valid([base({ raceId: 'etapa-5' })]))).toContain('post-race-not-open');
  });

  it('rejeita data e hora inválidas e publicação no futuro', () => {
    expect(codes(valid([base({ publishedAt: '27/09/2026 20h' })]))).toContain('post-time-invalid');
    expect(codes(valid([base({ publishedAt: '2026-12-01T10:00' })]))).toContain('post-in-future');
  });

  it('em conjunto de demonstração, exige a marca de demonstração', () => {
    expect(codes(valid([base({ isDemo: false })]))).toContain('post-not-flagged');
  });

  it('aceita publicação sem data e hora (a data é opcional)', () => {
    expect(codes(valid([base({ publishedAt: undefined })]))).toEqual([]);
  });
});
