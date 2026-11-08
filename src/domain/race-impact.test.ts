import { buildDemoChampionship } from '@/data/demo';
import { raceFastestLap } from './laps';
import { getRaceImpact } from './race-impact';

const c = buildDemoChampionship('after-race-4');

describe('getRaceImpact — etapa 4', () => {
  const impact = getRaceImpact(c, 'etapa-4')!;

  it('o pódio traz os três primeiros com pontos oficiais e diferenças', () => {
    expect(impact.podium.map((p) => [p.position, p.pilotId, p.points])).toEqual([
      [1, 'rafael-nunes', 10],
      [2, 'helena-duarte', 6],
      [3, 'lucas-ferreira', 3],
    ]);
    expect(impact.podium[0]!.gap).toEqual({ kind: 'leader' });
    expect(impact.podium[1]!.gap.kind).toBe('time');
    expect(impact.podium.every((p) => p.totalTimeMs > 0)).toBe(true);
    expect(impact.podium.map((p) => p.teamId)).toEqual(['vortex-motorsport', 'vortex-motorsport', 'torque-lab']);
  });

  it('destaca vencedor, dobradinha da Vortex, nova liderança e volta mais rápida', () => {
    const kinds = impact.highlights.map((h) => h.kind);
    expect(kinds).toContain('winner');
    expect(impact.highlights).toContainEqual({ kind: 'winner', pilotId: 'rafael-nunes', teamId: 'vortex-motorsport' });
    expect(impact.highlights).toContainEqual({
      kind: 'team-podium',
      teamId: 'vortex-motorsport',
      pilotIds: ['rafael-nunes', 'helena-duarte'],
      positions: [1, 2],
      double: true,
    });
    expect(impact.highlights).toContainEqual({ kind: 'pilot-lead', pilotId: 'rafael-nunes', previousLeaderId: 'diego-martins' });
    expect(impact.highlights).toContainEqual({ kind: 'team-lead', teamId: 'vortex-motorsport', previousLeaderId: 'apex-racing' });
    const fastest = raceFastestLap(c, 'etapa-4')!;
    expect(impact.highlights).toContainEqual({
      kind: 'fastest-lap',
      pilotId: fastest.pilotId,
      timeMs: fastest.timeMs,
      session: fastest.session,
    });
  });

  it('mostra como a classificação de pilotos mudou', () => {
    const by = Object.fromEntries(impact.pilots.map((p) => [p.id, p]));
    expect(by['rafael-nunes']).toMatchObject({ positionBefore: 2, positionAfter: 1, pointsBefore: 19, pointsAfter: 29, gained: 10 });
    expect(by['diego-martins']).toMatchObject({ positionBefore: 1, positionAfter: 2, pointsBefore: 26, pointsAfter: 28, gained: 2 });
    expect(by['lucas-ferreira']).toMatchObject({ positionBefore: 3, positionAfter: 3, gained: 3 });
    expect(by['helena-duarte']).toMatchObject({ positionBefore: 5, positionAfter: 4, gained: 6 });
    // a lista segue a ordem da nova classificação
    expect(impact.pilots.map((p) => p.positionAfter)).toEqual([...impact.pilots.map((p) => p.positionAfter)].sort((a, b) => a - b));
  });

  it('mostra como a classificação de equipes mudou, somando os pontos dos dois pilotos', () => {
    const by = Object.fromEntries(impact.teams.map((t) => [t.id, t]));
    expect(by['vortex-motorsport']).toMatchObject({ positionBefore: 2, positionAfter: 1, pointsBefore: 21, pointsAfter: 37, gained: 16 });
    expect(by['apex-racing']).toMatchObject({ positionBefore: 1, positionAfter: 2, pointsAfter: 29, gained: 2 });
    const totalGained = impact.pilots.reduce((s, p) => s + p.gained, 0);
    expect(impact.teams.reduce((s, t) => s + t.gained, 0)).toBe(totalGained);
    expect(totalGained).toBe(10 + 6 + 3 + 2 + 1); // pontos distribuídos na etapa
  });

  it('não inventa mudanças que dependem de desempate', () => {
    // nenhum destaque de liderança quando o líder antes ou depois é indefinido (empate)
    const leaders = impact.highlights.filter((h) => h.kind === 'pilot-lead' || h.kind === 'team-lead');
    expect(leaders.length).toBe(2);
  });
});

describe('getRaceImpact — outras etapas', () => {
  it('a 1ª etapa não tem "antes": sem mudança de posição nem de liderança', () => {
    const impact = getRaceImpact(c, 'etapa-1')!;
    expect(impact.pilots.every((p) => p.positionBefore === null && p.pointsBefore === 0)).toBe(true);
    expect(impact.highlights.map((h) => h.kind)).not.toContain('pilot-lead');
    expect(impact.podium.map((p) => p.pilotId)).toEqual(['diego-martins', 'lucas-ferreira', 'rafael-nunes']);
  });

  it('a etapa 3 compara a classificação depois dela com a de antes, mesmo existindo a etapa 4', () => {
    const impact = getRaceImpact(c, 'etapa-3')!;
    const diego = impact.pilots.find((p) => p.id === 'diego-martins')!;
    expect(diego).toMatchObject({ pointsBefore: 16, pointsAfter: 26, gained: 10 });
    expect(impact.pilots.find((p) => p.id === 'lucas-ferreira')).toMatchObject({ pointsAfter: 11 });
  });

  it('é nulo para etapa inexistente, agendada ou em andamento', () => {
    expect(getRaceImpact(c, 'nada')).toBeNull();
    expect(getRaceImpact(c, 'etapa-5')).toBeNull();
    expect(getRaceImpact(buildDemoChampionship('race-4-live'), 'etapa-4')).toBeNull();
    expect(getRaceImpact(buildDemoChampionship(), 'etapa-4')).toBeNull();
  });
});
