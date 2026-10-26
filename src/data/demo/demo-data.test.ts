import { totalTimeOf, validateChampionship } from '@/domain';
import { buildDemoChampionship } from '.';

const demo = buildDemoChampionship();

describe('dados de demonstração', () => {
  it('respeitam todas as invariantes do campeonato', () => {
    expect(validateChampionship(demo)).toEqual([]);
  });

  it('são determinísticos (mesma semente, mesmos números)', () => {
    expect(buildDemoChampionship()).toEqual(demo);
  });

  it('têm 5 provas, 6 equipes de 2 pilotos e 3 etapas finalizadas', () => {
    expect(demo.races).toHaveLength(5);
    expect(demo.teams).toHaveLength(6);
    expect(demo.pilots).toHaveLength(12);
    expect(demo.races.filter((r) => r.status === 'finished')).toHaveLength(3);
    expect(demo.results).toHaveLength(3);
  });

  it('o tempo total cresce com a posição de chegada na prova final', () => {
    for (const results of demo.results) {
      const finishers = results.final.filter((e) => e.status === 'finished');
      const totals = finishers.map((e) => totalTimeOf(e.lapTimesMs));
      expect([...totals].sort((a, b) => a - b)).toEqual(totals);
      // todos os que terminaram completam o mesmo número de voltas
      const race = demo.races.find((r) => r.id === results.raceId)!;
      expect(finishers.every((e) => e.lapTimesMs.length === race.finalLaps)).toBe(true);
    }
  });

  it('abandonos têm menos voltas e ficam nas últimas posições', () => {
    const race2 = demo.results.find((r) => r.raceId === 'etapa-2')!;
    const dnf = race2.final.filter((e) => e.status === 'dnf');
    expect(dnf).toHaveLength(1);
    expect(dnf[0]!.position).toBe(12);
    expect(dnf[0]!.lapTimesMs).toHaveLength(9);
  });

  it('cada bateria classifica por voltas e depois por tempo', () => {
    for (const results of demo.results) {
      expect(results.heats).toHaveLength(3);
      for (const heat of results.heats) {
        expect(heat.entries).toHaveLength(12);
        const keys = heat.entries.map((e) => ({
          laps: e.lapTimesMs.length,
          time: totalTimeOf(e.lapTimesMs),
        }));
        for (let i = 1; i < keys.length; i++) {
          const prev = keys[i - 1]!;
          const cur = keys[i]!;
          expect(prev.laps > cur.laps || (prev.laps === cur.laps && prev.time <= cur.time)).toBe(true);
        }
        expect(heat.entries.map((e) => e.position)).toEqual(
          Array.from({ length: 12 }, (_, i) => i + 1),
        );
      }
    }
  });

  it('tempos de volta são plausíveis para pista RC (10 s a 25 s)', () => {
    for (const results of demo.results) {
      for (const entry of results.final) {
        for (const lap of entry.lapTimesMs) {
          expect(lap).toBeGreaterThan(10_000);
          expect(lap).toBeLessThan(25_000);
        }
      }
    }
  });
});
