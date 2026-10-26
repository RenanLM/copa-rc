import { buildDemoChampionship } from '@/data/demo';
import { getPilotPerformance } from './performance';

const demo = buildDemoChampionship();
const lucas = getPilotPerformance(demo, 'lucas-ferreira');

describe('getPilotPerformance — Lucas Ferreira', () => {
  it('traz uma entrada por etapa disputada, em ordem', () => {
    expect(lucas.map((p) => p.race.round)).toEqual([1, 2, 3]);
    expect(lucas.map((p) => p.finalPosition)).toEqual([2, 4, 3]);
    expect(lucas.map((p) => p.points)).toEqual([6, 2, 3]);
    expect(lucas.map((p) => p.championshipPosition)).toEqual([2, 3, 3]);
    expect(lucas.map((p) => p.cumulativePoints)).toEqual([6, 8, 11]);
  });

  it('desempenho relativo nunca passa de 100 e 100 = o mais rápido', () => {
    for (const p of lucas) {
      expect(p.bestLapRelative).not.toBeNull();
      expect(p.bestLapRelative!).toBeLessThanOrEqual(100 + 1e-9);
      expect(p.bestLapRelative!).toBeGreaterThan(90);
      expect(p.paceRelative!).toBeLessThanOrEqual(100 + 1e-9);
    }
    // Na etapa 3 a volta mais rápida da etapa foi dele (bateria 3)
    expect(lucas[2]!.bestLapRelative).toBeCloseTo(100, 6);
    expect(lucas[2]!.bestLapMs).toBe(lucas[2]!.raceFastestMs);
  });

  it('inclui as três baterias de cada etapa', () => {
    for (const p of lucas) {
      expect(p.heats.map((h) => h.index)).toEqual([1, 2, 3]);
      for (const h of p.heats) {
        expect(h.fieldSize).toBe(12);
        expect(h.bestLapMs!).toBeGreaterThanOrEqual(h.fastestMs);
      }
    }
  });

  it('a regularidade é um percentual pequeno e positivo', () => {
    for (const p of lucas) {
      expect(p.consistencyPct).not.toBeNull();
      expect(p.consistencyPct!).toBeGreaterThan(0);
      expect(p.consistencyPct!).toBeLessThan(10);
    }
  });
});

describe('getPilotPerformance — vencedor', () => {
  it('o vencedor da etapa tem ritmo relativo 100', () => {
    const diego = getPilotPerformance(demo, 'diego-martins');
    expect(diego[0]!.paceRelative).toBeCloseTo(100, 6); // venceu a etapa 1
    expect(diego[1]!.paceRelative!).toBeLessThan(100); // 2º na etapa 2
  });

  it('piloto inexistente não tem desempenho', () => {
    expect(getPilotPerformance(demo, 'fantasma')).toEqual([]);
  });
});
