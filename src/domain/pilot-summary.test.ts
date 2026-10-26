import { buildDemoChampionship } from '@/data/demo';
import { getPilotSeasonSummary } from './pilot-summary';

const demo = buildDemoChampionship();
const lucas = getPilotSeasonSummary(demo, 'lucas-ferreira')!;

describe('getPilotSeasonSummary — Lucas Ferreira', () => {
  it('resume posição, pontos e distâncias para os vizinhos', () => {
    expect(lucas.standing).toMatchObject({ position: 3, points: 11, tied: false });
    expect(lucas.pointsBehindLeader).toBe(15);
    expect(lucas.ahead).toMatchObject({ pointsDiff: 8 });
    expect(lucas.ahead?.standing.pilotId).toBe('rafael-nunes');
    expect(lucas.behind).toMatchObject({ pointsDiff: 7 });
    expect(lucas.behind?.standing.pilotId).toBe('thiago-barros');
  });

  it('informa a última etapa (3ª) com pontos calculados pelo domínio', () => {
    expect(lucas.lastRace).toMatchObject({
      position: 3,
      points: 3,
      fieldSize: 12,
      status: 'finished',
      laps: 20,
    });
    expect(lucas.lastRace?.race.round).toBe(3);
    expect(lucas.lastRace?.gap.kind).toBe('time');
  });

  it('lista as três baterias da última etapa', () => {
    expect(lucas.lastRaceHeats.map((h) => h.index)).toEqual([1, 2, 3]);
    expect(lucas.lastRaceHeats.every((h) => h.laps > 0 && h.bestLapMs !== null)).toBe(true);
  });

  it('descreve a evolução em cinco etapas, com as futuras em aberto', () => {
    expect(lucas.evolution).toHaveLength(5);
    expect(lucas.evolution.map((e) => e.racePosition)).toEqual([2, 4, 3, null, null]);
    expect(lucas.evolution.map((e) => e.racePoints)).toEqual([6, 2, 3, null, null]);
    expect(lucas.evolution.map((e) => e.championshipPosition)).toEqual([2, 3, 3, null, null]);
    expect(lucas.evolution.map((e) => e.cumulativePoints)).toEqual([6, 8, 11, null, null]);
  });

  it('aponta a próxima corrida e a variação de posição', () => {
    expect(lucas.nextRace?.round).toBe(4);
    expect(lucas.positionChange).toBe(0);
    expect(lucas.racesFinished).toBe(3);
    expect(lucas.totalRaces).toBe(5);
  });

  it('a melhor volta e o total de voltas vêm dos mesmos dados das telas de resultado', () => {
    const finalLaps = demo.results.flatMap((r) =>
      r.final.filter((e) => e.pilotId === 'lucas-ferreira').flatMap((e) => e.lapTimesMs),
    );
    const heatLaps = demo.results.flatMap((r) =>
      r.heats.flatMap((h) =>
        h.entries.filter((e) => e.pilotId === 'lucas-ferreira').flatMap((e) => e.lapTimesMs),
      ),
    );
    const all = [...finalLaps, ...heatLaps];
    expect(lucas.totalLaps).toBe(all.length);
    expect(lucas.bestLap?.timeMs).toBe(Math.min(...all));
  });

  it('identifica o companheiro de equipe', () => {
    expect(lucas.teammate?.id).toBe('bianca-moreira');
    expect(lucas.team.id).toBe('torque-lab');
  });

  it('retorna null para piloto inexistente', () => {
    expect(getPilotSeasonSummary(demo, 'fantasma')).toBeNull();
  });
});

describe('getPilotSeasonSummary — líder', () => {
  it('não tem piloto à frente nem distância para o líder', () => {
    const diego = getPilotSeasonSummary(demo, 'diego-martins')!;
    expect(diego.ahead).toBeNull();
    expect(diego.pointsBehindLeader).toBe(0);
    expect(diego.behind?.pointsDiff).toBe(7);
  });
});
