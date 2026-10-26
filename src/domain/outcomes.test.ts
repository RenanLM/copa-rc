import { analyzeOutcomes, statusOf, summarizeTarget, witnessFor, type OutcomeInput } from './outcomes';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Referência: enumera TODOS os resultados possíveis (quem fica em cada posição
 * pontuadora de cada etapa) e guarda, por combinação de colocações do piloto
 * (índice 0 do vetor de jogadores), a melhor/pior posição final.
 */
function bruteForce(input: OutcomeInput) {
  const players = 1 + input.rivals.length;
  const slots = input.pointsByPosition.length;
  const base = [input.points, ...input.rivals];
  const results = new Map<string, { gained: number; points: number; bestShared: number; bestOutright: number; worst: number }>();

  const gains = new Array<number>(players).fill(0);
  const placings: number[] = [];

  const finishRace = (race: number): void => {
    if (race === input.raceCount) {
      const finals = base.map((p, i) => p + gains[i]!);
      const mine = finals[0]!;
      const strictlyAbove = finals.slice(1).filter((f) => f > mine).length;
      const atLeast = finals.slice(1).filter((f) => f >= mine).length;
      const key = placings.join(',');
      const entry = results.get(key) ?? {
        gained: mine - input.points,
        points: mine,
        bestShared: Infinity,
        bestOutright: Infinity,
        worst: -Infinity,
      };
      entry.bestShared = Math.min(entry.bestShared, 1 + strictlyAbove);
      entry.bestOutright = Math.min(entry.bestOutright, 1 + atLeast);
      entry.worst = Math.max(entry.worst, 1 + atLeast);
      results.set(key, entry);
      return;
    }
    fill(race, 0, new Array<boolean>(players).fill(false), slots + 1);
  };

  const fill = (race: number, slot: number, used: boolean[], myPlacing: number): void => {
    if (slot === slots) {
      placings[race] = myPlacing;
      finishRace(race + 1);
      return;
    }
    for (let player = 0; player < players; player++) {
      if (used[player]) continue;
      used[player] = true;
      gains[player]! += input.pointsByPosition[slot]!;
      fill(race, slot + 1, used, player === 0 ? slot + 1 : myPlacing);
      gains[player]! -= input.pointsByPosition[slot]!;
      used[player] = false;
    }
  };

  finishRace(0);
  return results;
}

describe('analyzeOutcomes confere com a enumeração completa', () => {
  it('em 150 campeonatos pequenos aleatórios (regra 5-3-1, 1 e 2 etapas)', () => {
    const random = rng(424242);
    for (let caseIndex = 0; caseIndex < 150; caseIndex++) {
      const input: OutcomeInput = {
        points: Math.floor(random() * 12),
        rivals: Array.from({ length: 3 + Math.floor(random() * 2) }, () => Math.floor(random() * 14)),
        raceCount: 1 + Math.floor(random() * 2),
        pointsByPosition: [5, 3, 1],
      };
      const expected = bruteForce(input);
      const combos = analyzeOutcomes(input);
      expect(combos.length).toBe(expected.size);
      for (const combo of combos) {
        const reference = expected.get(combo.placings.join(','))!;
        expect({ case: caseIndex, placings: combo.placings, ...pick(combo) }).toEqual({
          case: caseIndex,
          placings: combo.placings,
          ...pick(reference),
        });
      }
    }
  });
});

const pick = (c: { gained: number; points: number; bestShared: number; bestOutright: number; worst: number }) => ({
  gained: c.gained,
  points: c.points,
  bestShared: c.bestShared,
  bestOutright: c.bestOutright,
  worst: c.worst,
});

describe('estados por posição desejada', () => {
  // Piloto com 11 pontos; adversários 26, 19, 4, 2, 2, 1, 1, 0, 0, 0, 0; 2 etapas; regra oficial.
  const input: OutcomeInput = {
    points: 11,
    rivals: [26, 19, 4, 2, 2, 1, 1, 0, 0, 0, 0],
    raceCount: 2,
    pointsByPosition: [10, 6, 3, 2, 1],
  };
  const combos = analyzeOutcomes(input);
  const combo = (a: number, b: number) => combos.find((c) => c.placings[0] === a && c.placings[1] === b)!;

  it('gera todas as combinações de colocações (6 × 6)', () => {
    expect(combos).toHaveLength(36);
    expect(combo(1, 1)).toMatchObject({ gained: 20, points: 31 });
    expect(combo(6, 6)).toMatchObject({ gained: 0, points: 11 });
  });

  it('vencer as duas etapas não GARANTE o título, mas o torna possível', () => {
    // Diego (26) pode somar até 12 (2º nas duas) e chegar a 38 > 31
    expect(statusOf(combo(1, 1), 1)).toBe('possible');
    expect(summarizeTarget(combos, 1).status).toBe('possible');
  });

  it('a posição é impossível quando nem o melhor cenário a alcança', () => {
    // Sem pontuar, o piloto (11) não chega ao 1º: Diego (26) e Rafael (19) já estão à frente.
    expect(statusOf(combo(6, 6), 1)).toBe('impossible');
    expect(statusOf(combo(6, 6), 2)).toBe('impossible');
  });

  it('só se garante o que vale no pior caso (empates perdidos)', () => {
    // Pior caso de quem faz 0 ponto: muita gente passa; 12º é o único garantido
    expect(statusOf(combo(6, 6), 12)).toBe('guaranteed');
    expect(statusOf(combo(6, 6), combo(6, 6).worst)).toBe('guaranteed');
    expect(statusOf(combo(6, 6), combo(6, 6).worst - 1)).not.toBe('guaranteed');
  });

  it('o resumo geral é coerente com as combinações', () => {
    const summary = summarizeTarget(combos, 3);
    expect(summary.bestRank).toBe(1);
    expect(summary.worstRank).toBeGreaterThan(3);
    expect(summary.counts.guaranteed + summary.counts.possible + summary.counts['tie-only'] + summary.counts.impossible).toBe(36);
    expect(summary.minPointsGuaranteed === null || summary.minPointsGuaranteed >= (summary.minPointsPossible ?? 0)).toBe(true);
  });

  it('mais pontos nunca pioram o estado para uma mesma posição', () => {
    const rank = { impossible: 0, 'tie-only': 1, possible: 2, guaranteed: 3 } as const;
    for (let target = 1; target <= 12; target++) {
      for (const a of combos) {
        for (const b of combos) {
          // b tem colocações iguais ou melhores em todas as etapas
          if (a.placings.every((p, i) => b.placings[i]! <= p)) {
            expect(rank[statusOf(b, target)]).toBeGreaterThanOrEqual(rank[statusOf(a, target)]);
          }
        }
      }
    }
  });
});

describe('witnessFor', () => {
  const input: OutcomeInput = {
    points: 11,
    rivals: [26, 19, 4, 2, 2, 1, 1, 0, 0, 0, 0],
    raceCount: 2,
    pointsByPosition: [10, 6, 3, 2, 1],
  };
  const combos = analyzeOutcomes(input);
  const combo = combos.find((c) => c.placings[0] === 1 && c.placings[1] === 1)!;

  it('o cenário favorável realiza o melhor caso e o difícil, o pior', () => {
    const rankFrom = (alloc: ReturnType<typeof witnessFor>, tieLost: boolean) => {
      const finals = input.rivals.map(
        (p, i) => p + alloc.filter((a) => a.rival === i).reduce((s, a) => s + (input.pointsByPosition[a.placing - 1] ?? 0), 0),
      );
      return 1 + finals.filter((f) => (tieLost ? f >= combo.points : f > combo.points)).length;
    };
    expect(rankFrom(witnessFor(input, combo, 'favorable'), true)).toBe(combo.bestOutright);
    expect(rankFrom(witnessFor(input, combo, 'hard'), true)).toBe(combo.worst);
  });

  it('cada colocação pontuadora de cada etapa vai para um adversário diferente', () => {
    for (const kind of ['favorable', 'favorable-with-tie', 'hard'] as const) {
      const alloc = witnessFor(input, combo, kind);
      for (let race = 0; race < input.raceCount; race++) {
        const placings = alloc.filter((a) => a.race === race).map((a) => a.placing);
        const rivals = alloc.filter((a) => a.race === race).map((a) => a.rival);
        expect(new Set(placings).size).toBe(placings.length);
        expect(new Set(rivals).size).toBe(rivals.length);
        expect(placings).not.toContain(combo.placings[race]); // a colocação do piloto não é dada a rival
      }
    }
  });
});

describe('limites', () => {
  it('recusa análises exatas com mais de 3 etapas restantes', () => {
    expect(() =>
      analyzeOutcomes({ points: 0, rivals: [0, 0, 0, 0, 0, 0], raceCount: 4, pointsByPosition: [10, 6, 3, 2, 1] }),
    ).toThrow(RangeError);
  });
});
