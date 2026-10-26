import { maxPilotsAbove, minPilotsAbove, type Allocation, type RaceSlots } from './slot-solver';

/**
 * Análise exata dos resultados possíveis nas etapas restantes, para UM piloto.
 *
 * Para cada combinação de colocações do piloto (uma por etapa restante) calcula,
 * considerando TODAS as formas legais de os adversários pontuarem:
 *  - `bestShared`: melhor posição possível (empates dividem a posição);
 *  - `bestOutright`: melhor posição possível sem depender de empate;
 *  - `worst`: pior posição possível (todo empate é perdido).
 *
 * "Posição" aqui segue a classificação do app: 1 + quantos têm MAIS pontos.
 * Como o desempate é indefinido, só se garante o que vale mesmo perdendo os empates.
 */

/** Acima disso a busca exata fica cara; a interface avisa que não há análise. */
export const MAX_ANALYSED_RACES = 3;

export interface OutcomeInput {
  /** Pontos atuais do piloto analisado. */
  points: number;
  /** Pontos atuais dos adversários (uma entrada por adversário). */
  rivals: readonly number[];
  /** Etapas restantes consideradas. */
  raceCount: number;
  /** Regra de pontos: índice 0 = 1º lugar. */
  pointsByPosition: readonly number[];
}

export interface OutcomeCombo {
  /** Colocação do piloto em cada etapa: 1..n pontuam; n+1 = "fora dos pontos". */
  placings: readonly number[];
  gained: number;
  /** Pontos finais do piloto nesta combinação. */
  points: number;
  bestShared: number;
  bestOutright: number;
  worst: number;
}

export type OutcomeStatus = 'guaranteed' | 'possible' | 'tie-only' | 'impossible';

/** Pontos de uma colocação (n+1 ou mais = 0). */
export function pointsOfPlacing(pointsByPosition: readonly number[], placing: number): number {
  return pointsByPosition[placing - 1] ?? 0;
}

/** Slots que sobram aos adversários quando o piloto ocupa a colocação `placing` em cada etapa. */
export function rivalSlots(
  pointsByPosition: readonly number[],
  placings: readonly number[],
): { values: RaceSlots; placingsOf: readonly (readonly number[])[] } {
  const placingsOf = placings.map((mine) =>
    pointsByPosition.map((_, i) => i + 1).filter((placing) => placing !== mine),
  );
  return {
    values: placingsOf.map((list) => list.map((placing) => pointsByPosition[placing - 1]!)),
    placingsOf,
  };
}

function* allPlacings(raceCount: number, choices: number): Generator<number[]> {
  const current: number[] = [];
  function* walk(race: number): Generator<number[]> {
    if (race === raceCount) {
      yield [...current];
      return;
    }
    for (let placing = 1; placing <= choices; placing++) {
      current[race] = placing;
      yield* walk(race + 1);
    }
  }
  yield* walk(0);
}

export function analyzeOutcomes(input: OutcomeInput): OutcomeCombo[] {
  if (input.raceCount > MAX_ANALYSED_RACES) {
    throw new RangeError(`Análise exata limitada a ${MAX_ANALYSED_RACES} etapas restantes.`);
  }
  const choices = input.pointsByPosition.length + 1;
  const combos: OutcomeCombo[] = [];

  for (const placings of allPlacings(input.raceCount, choices)) {
    const gained = placings.reduce((sum, placing) => sum + pointsOfPlacing(input.pointsByPosition, placing), 0);
    const total = input.points + gained;
    const { values } = rivalSlots(input.pointsByPosition, placings);
    combos.push({
      placings,
      gained,
      points: total,
      bestShared: 1 + minPilotsAbove(input.rivals, values, total).count,
      bestOutright: 1 + minPilotsAbove(input.rivals, values, total - 1).count,
      worst: 1 + maxPilotsAbove(input.rivals, values, total - 1).count,
    });
  }
  return combos;
}

/** Estado de uma combinação em relação à posição desejada. */
export function statusOf(combo: OutcomeCombo, target: number): OutcomeStatus {
  if (combo.worst <= target) return 'guaranteed';
  if (combo.bestShared > target) return 'impossible';
  if (combo.bestOutright <= target) return 'possible';
  return 'tie-only';
}

export interface TargetSummary {
  /** Visão geral, SEM presumir os seus resultados. */
  status: OutcomeStatus;
  bestRank: number;
  worstRank: number;
  counts: Record<OutcomeStatus, number>;
  /** Menos pontos que ainda deixam a posição possível sem depender de empate. */
  minPointsPossible: number | null;
  /** Menos pontos que GARANTEM a posição, quaisquer que sejam os rivais. */
  minPointsGuaranteed: number | null;
}

export function summarizeTarget(combos: readonly OutcomeCombo[], target: number): TargetSummary {
  const counts: Record<OutcomeStatus, number> = { guaranteed: 0, possible: 0, 'tie-only': 0, impossible: 0 };
  let minPossible: number | null = null;
  let minGuaranteed: number | null = null;
  for (const combo of combos) {
    const status = statusOf(combo, target);
    counts[status]++;
    if ((status === 'possible' || status === 'guaranteed') && (minPossible === null || combo.gained < minPossible)) {
      minPossible = combo.gained;
    }
    if (status === 'guaranteed' && (minGuaranteed === null || combo.gained < minGuaranteed)) {
      minGuaranteed = combo.gained;
    }
  }
  const total = combos.length;
  const status: OutcomeStatus =
    counts.guaranteed === total
      ? 'guaranteed'
      : counts.impossible === total
        ? 'impossible'
        : counts.possible + counts.guaranteed > 0
          ? 'possible'
          : 'tie-only';

  return {
    status,
    bestRank: Math.min(...combos.map((c) => c.bestShared)),
    worstRank: Math.max(...combos.map((c) => c.worst)),
    counts,
    minPointsPossible: minPossible,
    minPointsGuaranteed: minGuaranteed,
  };
}

export type WitnessKind =
  /** Adversários pontuam o mínimo possível contra o piloto (sem depender de empate). */
  | 'favorable'
  /** Idem, aceitando empate (usado quando a posição só é possível com empate). */
  | 'favorable-with-tie'
  /** Adversários pontuam o máximo possível contra o piloto. */
  | 'hard';

/**
 * Uma distribuição concreta dos pontos dos adversários que realiza o melhor ou o
 * pior caso da combinação. Cada alocação é um slot (etapa, colocação) dado a um adversário.
 */
export function witnessFor(
  input: OutcomeInput,
  combo: OutcomeCombo,
  kind: WitnessKind,
): { race: number; placing: number; rival: number }[] {
  const { values, placingsOf } = rivalSlots(input.pointsByPosition, combo.placings);
  const threshold = kind === 'favorable-with-tie' ? combo.points : combo.points - 1;
  const solved =
    kind === 'hard'
      ? maxPilotsAbove(input.rivals, values, threshold)
      : minPilotsAbove(input.rivals, values, threshold);

  // Converte (etapa, valor) em (etapa, colocação), consumindo cada colocação uma vez.
  const free = placingsOf.map((list) => [...list]);
  return solved.allocation.map((a: Allocation) => {
    const list = free[a.race]!;
    const index = list.findIndex((placing) => input.pointsByPosition[placing - 1] === a.value);
    const [placing] = list.splice(index >= 0 ? index : 0, 1);
    return { race: a.race, placing: placing ?? 0, rival: a.pilot };
  });
}
