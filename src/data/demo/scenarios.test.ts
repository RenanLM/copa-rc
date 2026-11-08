import {
  buildReplay,
  computePilotStandings,
  computeTeamStandings,
  nextRace,
  sampleReplay,
  validateChampionship,
} from '@/domain';
import { applyDemoScenario, buildDemoChampionship, buildFullDemoChampionship, DEMO_SCENARIOS } from '.';

const full = buildFullDemoChampionship();

describe('momentos do campeonato (demonstração)', () => {
  it('todos os momentos respeitam as invariantes do campeonato', () => {
    for (const { id } of DEMO_SCENARIOS) {
      expect({ id, issues: validateChampionship(applyDemoScenario(full, id)) }).toEqual({ id, issues: [] });
    }
  });

  it('o padrão é "após a etapa 3": etapa 4 agendada e sem resultado', () => {
    const c = buildDemoChampionship();
    expect(c.races.find((r) => r.round === 4)?.status).toBe('scheduled');
    expect(c.results.map((r) => r.raceId)).toEqual(['etapa-1', 'etapa-2', 'etapa-3']);
    expect(c.referenceDate).toBe('2026-10-21');
    expect(nextRace(c)?.round).toBe(4);
  });

  it('"etapa 4 em andamento": etapa 4 ao vivo, sem resultado, classificação igual à de antes', () => {
    const c = buildDemoChampionship('race-4-live');
    expect(c.races.find((r) => r.round === 4)?.status).toBe('live');
    expect(c.races.find((r) => r.round === 5)?.status).toBe('scheduled');
    expect(c.results).toHaveLength(3);
    expect(nextRace(c)?.round).toBe(4);
    expect(computePilotStandings(c)).toEqual(computePilotStandings(buildDemoChampionship()));
  });

  it('"após a etapa 4": etapa 4 finalizada, próxima é a 5', () => {
    const c = buildDemoChampionship('after-race-4');
    expect(c.races.filter((r) => r.status === 'finished').map((r) => r.round)).toEqual([1, 2, 3, 4]);
    expect(c.results).toHaveLength(4);
    expect(nextRace(c)?.round).toBe(5);
    expect(c.referenceDate).toBe('2026-10-26');
  });

  it('o momento é um recorte: não altera as etapas já disputadas', () => {
    const before = buildDemoChampionship('after-race-3');
    const after = buildDemoChampionship('after-race-4');
    expect(after.results.slice(0, 3)).toEqual(before.results);
  });

  it('é determinístico', () => {
    expect(buildDemoChampionship('after-race-4')).toEqual(buildDemoChampionship('after-race-4'));
  });
});

describe('resultado da etapa 4', () => {
  const c = buildDemoChampionship('after-race-4');
  const order = (round: number) =>
    c.results
      .find((r) => r.raceId === `etapa-${round}`)!
      .final.slice()
      .sort((a, b) => a.position - b.position)
      .map((e) => e.pilotId);

  it('tem dobradinha da Vortex e Lucas em 3º', () => {
    expect(order(4).slice(0, 5)).toEqual([
      'rafael-nunes',
      'helena-duarte',
      'lucas-ferreira',
      'diego-martins',
      'thiago-barros',
    ]);
  });

  it('muda a liderança: Rafael passa Diego, com os pontos oficiais', () => {
    const points = Object.fromEntries(computePilotStandings(c).map((s) => [s.pilotId, s.points]));
    expect(points).toMatchObject({
      'rafael-nunes': 29, // 19 + 10
      'diego-martins': 28, // 26 + 2
      'lucas-ferreira': 14, // 11 + 3
      'helena-duarte': 8, // 2 + 6
      'thiago-barros': 5, // 4 + 1
    });
    const standings = computePilotStandings(c);
    expect(standings.slice(0, 3).map((s) => [s.pilotId, s.position, s.tied])).toEqual([
      ['rafael-nunes', 1, false],
      ['diego-martins', 2, false],
      ['lucas-ferreira', 3, false],
    ]);
  });

  it('a Vortex assume a liderança entre as equipes', () => {
    const teams = computeTeamStandings(c);
    expect(teams.slice(0, 3).map((t) => [t.teamId, t.points])).toEqual([
      ['vortex-motorsport', 37],
      ['apex-racing', 29],
      ['torque-lab', 16],
    ]);
  });

  it('a simulação ao vivo termina exatamente no resultado oficial', () => {
    const replay = buildReplay(c, 'etapa-4')!;
    const finish = sampleReplay(replay, replay.durationMs);
    expect(finish.cars.map((car) => car.pilotId)).toEqual(order(4));
    expect(finish.raceFinished).toBe(true);
  });

  it('só existe replay da etapa 4 quando ela está finalizada', () => {
    expect(buildReplay(buildDemoChampionship('race-4-live'), 'etapa-4')).toBeNull();
    expect(buildReplay(buildDemoChampionship(), 'etapa-4')).toBeNull();
  });
});
