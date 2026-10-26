import type {
  FinalEntry,
  Heat,
  HeatEntry,
  PilotId,
  RaceId,
  RaceResults,
} from '@/domain';

/**
 * Geração DETERMINÍSTICA de voltas para os dados de demonstração.
 *
 * Só a ordem de chegada de cada etapa é escrita à mão (ver seed.ts). Os tempos
 * de volta são gerados a partir de uma semente fixa e construídos de modo que:
 *  - a soma das voltas de cada piloto é o seu tempo total;
 *  - o tempo total cresce com a posição de chegada;
 *  - a melhor volta é sempre derivada das voltas (nunca armazenada à parte).
 * Assim, qualquer tela que leia estes dados enxerga os mesmos números.
 */

/** PRNG mulberry32: pequeno, rápido e reprodutível. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clippedNoise(rng: () => number, sigma: number, clip: number): number {
  return Math.max(-clip, Math.min(clip, gaussian(rng) * sigma));
}

/** Distribui `totalMs` em `count` voltas com variação realista (soma exata). */
function lapsSummingTo(
  rng: () => number,
  count: number,
  totalMs: number,
): number[] {
  const weights = Array.from({ length: count }, (_, i) => {
    const startPenalty = i === 0 ? 0.05 : 0;
    return 1 + startPenalty + clippedNoise(rng, 0.014, 0.04);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const laps = weights.map((w) => Math.round((w / sum) * totalMs));
  const drift = totalMs - laps.reduce((a, b) => a + b, 0);
  laps[laps.length - 1] = (laps[laps.length - 1] ?? 0) + drift;
  return laps;
}

function lapsUntil(
  rng: () => number,
  meanMs: number,
  durationMs: number,
): number[] {
  const laps: number[] = [];
  let elapsed = 0;
  while (elapsed < durationMs) {
    const start = laps.length === 0 ? 0.04 : 0;
    const lap = Math.round(meanMs * (1 + start + clippedNoise(rng, 0.018, 0.045)));
    laps.push(lap);
    elapsed += lap;
  }
  return laps;
}

export interface RaceGenerationSpec {
  raceId: RaceId;
  seed: number;
  /** Tempo médio de volta do vencedor, em ms. */
  baseLapMs: number;
  finalLaps: number;
  /** Ordem de chegada, do 1º ao último. Abandonos ficam por último. */
  order: readonly PilotId[];
  /** Pilotos que abandonaram e em que volta. */
  dnf?: Readonly<Record<PilotId, number>>;
  heatCount: number;
  heatDurationMs: number;
}

export function generateRaceResults(spec: RaceGenerationSpec): RaceResults {
  const rng = createRng(spec.seed);
  const dnf = spec.dnf ?? {};

  // Prova final -------------------------------------------------------------
  const leaderTotal = Math.round(spec.baseLapMs * spec.finalLaps);
  let gap = 0;
  const final: FinalEntry[] = spec.order.map((pilotId, index) => {
    const abandonedAfter = dnf[pilotId];
    if (abandonedAfter !== undefined) {
      const mean = spec.baseLapMs * (1 + 0.012 * index);
      return {
        pilotId,
        position: index + 1,
        status: 'dnf',
        lapTimesMs: lapsSummingTo(rng, abandonedAfter, Math.round(mean * abandonedAfter)),
      };
    }
    if (index > 0) gap += Math.round((0.4 + rng() * 3.4) * 1000);
    return {
      pilotId,
      position: index + 1,
      status: 'finished',
      lapTimesMs: lapsSummingTo(rng, spec.finalLaps, leaderTotal + gap),
    };
  });

  // Baterias ----------------------------------------------------------------
  const heatFactors = [1.012, 1.004, 0.998, 0.995];
  const heats: Heat[] = Array.from({ length: spec.heatCount }, (_, h) => {
    const factor = heatFactors[h] ?? 1;
    const entries: Omit<HeatEntry, 'position'>[] = spec.order.map((pilotId, rank) => {
      const mean =
        spec.baseLapMs * factor * (1 + 0.0085 * rank + clippedNoise(rng, 0.007, 0.02));
      return { pilotId, lapTimesMs: lapsUntil(rng, mean, spec.heatDurationMs) };
    });
    const ranked = [...entries].sort(
      (a, b) =>
        b.lapTimesMs.length - a.lapTimesMs.length ||
        sum(a.lapTimesMs) - sum(b.lapTimesMs),
    );
    return {
      index: h + 1,
      durationMs: spec.heatDurationMs,
      entries: ranked.map((entry, i) => ({ ...entry, position: i + 1 })),
    };
  });

  return { raceId: spec.raceId, final, heats };
}

function sum(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
