import { OFFICIAL_RULES } from './rules';
import { maxPointsPerRace, pointsForPosition, scoringPositions } from './scoring';

describe('regras oficiais', () => {
  it('define 5 provas, 2 pilotos por equipe e 4 publicações por equipe/prova', () => {
    expect(OFFICIAL_RULES.totalRaces).toBe(5);
    expect(OFFICIAL_RULES.pilotsPerTeam).toBe(2);
    expect(OFFICIAL_RULES.maxPostsPerTeamPerRace).toBe(4);
  });
});

describe('pointsForPosition', () => {
  it.each([
    [1, 10],
    [2, 6],
    [3, 3],
    [4, 2],
    [5, 1],
  ])('posição %i vale %i pontos', (position, points) => {
    expect(pointsForPosition(position, OFFICIAL_RULES)).toBe(points);
  });

  it.each([6, 7, 12, 99])('posição %i (demais posições) vale 0', (position) => {
    expect(pointsForPosition(position, OFFICIAL_RULES)).toBe(0);
  });

  it.each([0, -1, 1.5, NaN])('posição inválida %s vale 0', (position) => {
    expect(pointsForPosition(position, OFFICIAL_RULES)).toBe(0);
  });

  it('expõe o máximo por prova e quantas posições pontuam', () => {
    expect(maxPointsPerRace(OFFICIAL_RULES)).toBe(10);
    expect(scoringPositions(OFFICIAL_RULES)).toBe(5);
  });
});
