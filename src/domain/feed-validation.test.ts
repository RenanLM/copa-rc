import { buildDemoChampionship } from '@/data/demo';
import {
  canTeamPost,
  findFeedLimitViolations,
  postsRemaining,
  type FeedPost,
} from './feed';
import { OFFICIAL_RULES } from './rules';
import { validateChampionship } from './validation';

const post = (n: number, teamId = 'torque-lab', raceId = 'etapa-3'): FeedPost => ({
  id: `p${n}`,
  teamId,
  raceId,
  text: 'Teste',
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
