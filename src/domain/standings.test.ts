import { buildDemoChampionship } from '@/data/demo';
import {
  computePilotStandings,
  computeStandingsHistory,
  computeTeamStandings,
  finishedRaces,
  nextRace,
} from './standings';
import type { Championship, FinalEntry } from './types';

const demo = buildDemoChampionship();

function pointsOf(championship: Championship, round?: number) {
  return Object.fromEntries(
    computePilotStandings(championship, round).map((s) => [s.pilotId, s.points]),
  );
}

describe('classificação de pilotos (dados de demonstração)', () => {
  it('soma os pontos oficiais das três etapas finalizadas', () => {
    const points = pointsOf(demo);
    expect(points).toMatchObject({
      'diego-martins': 26, // 10 + 6 + 10
      'rafael-nunes': 19, // 3 + 10 + 6
      'lucas-ferreira': 11, // 6 + 2 + 3
      'thiago-barros': 4, // 1 + 3 + 0
      'bianca-moreira': 2,
      'helena-duarte': 2,
      'carla-ribeiro': 1,
      'mateus-cavalcante': 1,
      'andre-lima': 0,
    });
  });

  it('ordena por pontos e atribui posições', () => {
    const standings = computePilotStandings(demo);
    expect(standings.slice(0, 4).map((s) => [s.pilotId, s.position])).toEqual([
      ['diego-martins', 1],
      ['rafael-nunes', 2],
      ['lucas-ferreira', 3],
      ['thiago-barros', 4],
    ]);
  });

  it('sinaliza empates sem desempate definido, compartilhando a posição', () => {
    const standings = computePilotStandings(demo);
    const bianca = standings.find((s) => s.pilotId === 'bianca-moreira')!;
    const helena = standings.find((s) => s.pilotId === 'helena-duarte')!;
    expect(bianca.position).toBe(5);
    expect(helena.position).toBe(5);
    expect(bianca.tied && helena.tied).toBe(true);

    const carla = standings.find((s) => s.pilotId === 'carla-ribeiro')!;
    expect(carla.position).toBe(7);
    const zero = standings.filter((s) => s.points === 0);
    expect(zero).toHaveLength(4);
    expect(new Set(zero.map((s) => s.position))).toEqual(new Set([9]));

    const lucas = standings.find((s) => s.pilotId === 'lucas-ferreira')!;
    expect(lucas.tied).toBe(false);
  });

  it('respeita o corte por etapa (retrato histórico)', () => {
    expect(pointsOf(demo, 1)['diego-martins']).toBe(10);
    expect(pointsOf(demo, 2)['diego-martins']).toBe(16);
    expect(computePilotStandings(demo, 0).every((s) => s.points === 0)).toBe(true);
  });

  it('registra vitórias, pódios e melhor colocação', () => {
    const standings = computePilotStandings(demo);
    const diego = standings.find((s) => s.pilotId === 'diego-martins')!;
    expect(diego).toMatchObject({ wins: 2, podiums: 3, bestFinish: 1 });
    const lucas = standings.find((s) => s.pilotId === 'lucas-ferreira')!;
    expect(lucas).toMatchObject({ wins: 0, podiums: 2, bestFinish: 2 });
  });
});

describe('classificação de equipes', () => {
  it('é a soma dos pontos dos dois pilotos', () => {
    const teams = computeTeamStandings(demo);
    const byId = Object.fromEntries(teams.map((t) => [t.teamId, t]));
    expect(byId['apex-racing']!.points).toBe(27);
    expect(byId['vortex-motorsport']!.points).toBe(21);
    expect(byId['torque-lab']!.points).toBe(13);
    expect(byId['torque-lab']!.pilotPoints).toHaveLength(2);
    expect(teams.map((t) => t.teamId).slice(0, 3)).toEqual([
      'apex-racing',
      'vortex-motorsport',
      'torque-lab',
    ]);
  });

  it('a soma das equipes é igual à soma dos pilotos', () => {
    const pilotTotal = computePilotStandings(demo).reduce((s, p) => s + p.points, 0);
    const teamTotal = computeTeamStandings(demo).reduce((s, t) => s + t.points, 0);
    expect(teamTotal).toBe(pilotTotal);
  });
});

describe('histórico e calendário', () => {
  it('gera um retrato por etapa finalizada', () => {
    const history = computeStandingsHistory(demo);
    expect(history.map((h) => h.throughRound)).toEqual([1, 2, 3]);
    expect(history[2]!.pilots[0]!.pilotId).toBe('diego-martins');
  });

  it('identifica etapas finalizadas e a próxima', () => {
    expect(finishedRaces(demo)).toHaveLength(3);
    expect(nextRace(demo)?.round).toBe(4);
  });
});

describe('desempate configurável', () => {
  const entry = (pilotId: string, position: number, bestLapMs: number): FinalEntry => ({
    pilotId,
    position,
    status: 'finished',
    lapTimesMs: [bestLapMs, bestLapMs + 500],
  });

  /** Campeonato mínimo com pilotos a, b, c e uma lista de provas finalizadas. */
  function build(
    rounds: FinalEntry[][],
    criteria: Championship['tiebreak']['criteria'] = [],
  ): Championship {
    return {
      ...demo,
      pilots: ['a', 'b', 'c'].map((id, i) => ({
        ...demo.pilots[0]!,
        id,
        number: i + 1,
        teamId: 't',
      })),
      teams: [{ ...demo.teams[0]!, id: 't', pilotIds: ['a', 'b', 'c'] }],
      races: rounds.map((_, i) => ({
        ...demo.races[0]!,
        id: `r${i + 1}`,
        round: i + 1,
        status: 'finished' as const,
      })),
      results: rounds.map((final, i) => ({ raceId: `r${i + 1}`, final, heats: [] })),
      tiebreak: { criteria },
    };
  }

  const position = (c: Championship, id: string) =>
    computePilotStandings(c).find((s) => s.pilotId === id)!;

  // a: 2º + 3º = 9 pts | b: 3º + 2º = 9 pts | c: 1º + 1º = 20 pts
  const tiedNoWins = [
    [entry('c', 1, 14100), entry('a', 2, 14000), entry('b', 3, 13800)],
    [entry('c', 1, 14100), entry('b', 2, 13800), entry('a', 3, 14000)],
  ];

  it('sem critérios, o empate permanece e é sinalizado como tal', () => {
    const c = build(tiedNoWins);
    expect(position(c, 'c')).toMatchObject({ position: 1, tied: false });
    expect(position(c, 'a')).toMatchObject({ position: 2, tied: true });
    expect(position(c, 'b')).toMatchObject({ position: 2, tied: true });
  });

  it('"best-lap" desempata pela melhor volta quando configurado', () => {
    const c = build(tiedNoWins, ['best-lap']);
    expect(position(c, 'b')).toMatchObject({ position: 2, tied: false });
    expect(position(c, 'a')).toMatchObject({ position: 3, tied: false });
  });

  it('critério que não separa os pilotos mantém o empate', () => {
    const c = build(tiedNoWins, ['most-wins', 'finish-countback']);
    expect(position(c, 'a').tied && position(c, 'b').tied).toBe(true);
  });

  // a: 2º + 2º = 12 pts | b: 1º + 4º = 12 pts | c: 3º + 3º = 6 pts
  const tiedDifferentFinishes = [
    [entry('b', 1, 14000), entry('a', 2, 14100), entry('c', 3, 14200)],
    [entry('a', 2, 14100), entry('c', 3, 14200), entry('b', 4, 14300)],
  ];

  it('"most-wins" e "finish-countback" favorecem quem venceu', () => {
    for (const criterion of ['most-wins', 'finish-countback'] as const) {
      const c = build(tiedDifferentFinishes, [criterion]);
      expect(position(c, 'b')).toMatchObject({ position: 1, tied: false });
      expect(position(c, 'a')).toMatchObject({ position: 2, tied: false });
    }
    const none = build(tiedDifferentFinishes);
    expect(position(none, 'a')).toMatchObject({ position: 1, tied: true });
  });
});
