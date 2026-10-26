import { maxPilotsAbove, minPilotsAbove, type Allocation, type RaceSlots } from './slot-solver';

/** PRNG simples e reprodutível para gerar casos de teste. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Enumera TODAS as distribuições válidas e devolve o menor e o maior número de pilotos acima de T. */
function bruteForce(points: readonly number[], races: RaceSlots, threshold: number) {
  const n = points.length;
  let min = Infinity;
  let max = -Infinity;
  const gains = new Array<number>(n).fill(0);

  const place = (race: number, slot: number, used: boolean[]): void => {
    if (race === races.length) {
      const above = points.filter((p, i) => p + gains[i]! > threshold).length;
      min = Math.min(min, above);
      max = Math.max(max, above);
      return;
    }
    const values = races[race]!;
    if (slot === values.length) {
      place(race + 1, 0, new Array<boolean>(n).fill(false));
      return;
    }
    for (let pilot = 0; pilot < n; pilot++) {
      if (used[pilot]) continue;
      used[pilot] = true;
      gains[pilot]! += values[slot]!;
      place(race, slot + 1, used);
      gains[pilot]! -= values[slot]!;
      used[pilot] = false;
    }
  };
  place(0, 0, new Array<boolean>(n).fill(false));
  return { min, max };
}

/** A distribuição é válida e produz exatamente `count` pilotos acima de T? */
function checkAllocation(
  points: readonly number[],
  races: RaceSlots,
  threshold: number,
  allocation: readonly Allocation[],
  count: number,
) {
  // cada slot usado exatamente uma vez
  races.forEach((values, race) => {
    const given = allocation.filter((a) => a.race === race).map((a) => a.value).sort((x, y) => y - x);
    expect(given).toEqual([...values].sort((x, y) => y - x));
    // no máximo um slot por piloto por etapa
    const pilots = allocation.filter((a) => a.race === race).map((a) => a.pilot);
    expect(new Set(pilots).size).toBe(pilots.length);
  });
  const finals = points.map((p, i) => p + allocation.filter((a) => a.pilot === i).reduce((s, a) => s + a.value, 0));
  expect(finals.filter((f) => f > threshold).length).toBe(count);
}

describe('slot-solver: casos pequenos conferidos por força bruta', () => {
  const VALUES = [10, 6, 3, 2, 1];

  it('minPilotsAbove e maxPilotsAbove coincidem com a enumeração completa', () => {
    const random = rng(20261021);
    for (let caseIndex = 0; caseIndex < 400; caseIndex++) {
      const n = 3 + Math.floor(random() * 4); // 3 a 6 adversários
      const raceCount = 1 + Math.floor(random() * 2); // 1 ou 2 etapas
      const races: number[][] = Array.from({ length: raceCount }, () => {
        const size = 1 + Math.floor(random() * Math.min(n, 4));
        return [...VALUES].sort(() => random() - 0.5).slice(0, size).sort((a, b) => b - a);
      });
      const points = Array.from({ length: n }, () => Math.floor(random() * 25));
      const threshold = Math.floor(random() * 30) - 2;

      const expected = bruteForce(points, races, threshold);
      const low = minPilotsAbove(points, races, threshold);
      const high = maxPilotsAbove(points, races, threshold);

      expect({ case: caseIndex, min: low.count, max: high.count }).toEqual({
        case: caseIndex,
        min: expected.min,
        max: expected.max,
      });
      checkAllocation(points, races, threshold, low.allocation, low.count);
      checkAllocation(points, races, threshold, high.allocation, high.count);
    }
  });
});

describe('slot-solver: situações conhecidas', () => {
  it('sem slots, o resultado é só quem já está acima', () => {
    expect(minPilotsAbove([5, 9, 2], [[]], 4).count).toBe(2);
    expect(maxPilotsAbove([5, 9, 2], [[]], 4).count).toBe(2);
  });

  it('um slot grande pode ser absorvido por quem já está acima', () => {
    // 2 adversários já acima de 20; o slot de 10 vai para um deles e ninguém mais passa
    expect(minPilotsAbove([26, 19, 4, 2], [[10]], 20).count).toBe(1);
    // no pior caso, o 10 faz Thiago (4) passar de 20? 4+10=14 não; Rafael (19)+10 passa
    expect(maxPilotsAbove([26, 19, 4, 2], [[10]], 20).count).toBe(2);
  });

  it('um adversário recebe no máximo um slot por etapa', () => {
    // Uma etapa com slots 10 e 9 e dois pilotos: cada um recebe um slot (10 ou 9), ninguém passa de 12.
    // (Sem a regra "um slot por etapa", um piloto levaria 19.)
    expect(maxPilotsAbove([0, 0], [[10, 9]], 12).count).toBe(0);
    // Em etapas diferentes o mesmo piloto pode acumular: 10 + 10 = 20 passa de 15.
    expect(maxPilotsAbove([0, 0, 0], [[10], [10]], 15).count).toBe(1);
  });
});
