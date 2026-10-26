import type { Championship, FinalEntry, PilotId, RaceId } from './types';

export function bestLapOf(lapTimesMs: readonly number[]): number | null {
  if (lapTimesMs.length === 0) return null;
  return Math.min(...lapTimesMs);
}

export function totalTimeOf(lapTimesMs: readonly number[]): number {
  return lapTimesMs.reduce((sum, lap) => sum + lap, 0);
}

export type SessionRef =
  | { type: 'final' }
  | { type: 'heat'; index: number };

export interface BestLapRecord {
  pilotId: PilotId;
  raceId: RaceId;
  round: number;
  session: SessionRef;
  /** Número da volta dentro da sessão (começa em 1). */
  lapNumber: number;
  timeMs: number;
}

function* allLaps(
  championship: Championship,
  filter?: { pilotId?: PilotId; raceId?: RaceId },
): Generator<BestLapRecord> {
  for (const results of championship.results) {
    if (filter?.raceId && results.raceId !== filter.raceId) continue;
    const race = championship.races.find((r) => r.id === results.raceId);
    if (!race) continue;

    for (const entry of results.final) {
      if (filter?.pilotId && entry.pilotId !== filter.pilotId) continue;
      for (const [i, timeMs] of entry.lapTimesMs.entries()) {
        yield {
          pilotId: entry.pilotId,
          raceId: race.id,
          round: race.round,
          session: { type: 'final' },
          lapNumber: i + 1,
          timeMs,
        };
      }
    }
    for (const heat of results.heats) {
      for (const entry of heat.entries) {
        if (filter?.pilotId && entry.pilotId !== filter.pilotId) continue;
        for (const [i, timeMs] of entry.lapTimesMs.entries()) {
          yield {
            pilotId: entry.pilotId,
            raceId: race.id,
            round: race.round,
            session: { type: 'heat', index: heat.index },
            lapNumber: i + 1,
            timeMs,
          };
        }
      }
    }
  }
}

function fastest(laps: Iterable<BestLapRecord>): BestLapRecord | null {
  let best: BestLapRecord | null = null;
  for (const lap of laps) {
    if (best === null || lap.timeMs < best.timeMs) best = lap;
  }
  return best;
}

/** Melhor volta do piloto em todo o campeonato (baterias e provas finais). */
export function pilotBestLap(
  championship: Championship,
  pilotId: PilotId,
): BestLapRecord | null {
  return fastest(allLaps(championship, { pilotId }));
}

/** Melhor volta de uma etapa (baterias e prova final), entre todos os pilotos. */
export function raceFastestLap(
  championship: Championship,
  raceId: RaceId,
): BestLapRecord | null {
  return fastest(allLaps(championship, { raceId }));
}

/** Melhor volta do piloto em uma etapa específica. */
export function pilotRaceBestLap(
  championship: Championship,
  pilotId: PilotId,
  raceId: RaceId,
): BestLapRecord | null {
  return fastest(allLaps(championship, { pilotId, raceId }));
}

/** Total de voltas completadas pelo piloto (baterias + provas finais). */
export function pilotTotalLaps(
  championship: Championship,
  pilotId: PilotId,
): number {
  let total = 0;
  for (const results of championship.results) {
    for (const entry of results.final) {
      if (entry.pilotId === pilotId) total += entry.lapTimesMs.length;
    }
    for (const heat of results.heats) {
      for (const entry of heat.entries) {
        if (entry.pilotId === pilotId) total += entry.lapTimesMs.length;
      }
    }
  }
  return total;
}

export type GapToLeader =
  | { kind: 'leader' }
  | { kind: 'time'; ms: number }
  | { kind: 'laps'; laps: number }
  | { kind: 'dnf' };

/**
 * Diferença para o vencedor. Se o piloto completou menos voltas, a diferença
 * é expressa em voltas; abandonos são sinalizados.
 */
export function gapToLeader(
  entry: FinalEntry,
  leader: FinalEntry,
): GapToLeader {
  if (entry.status === 'dnf') return { kind: 'dnf' };
  if (entry.pilotId === leader.pilotId) return { kind: 'leader' };
  const lapsDown = leader.lapTimesMs.length - entry.lapTimesMs.length;
  if (lapsDown > 0) return { kind: 'laps', laps: lapsDown };
  return {
    kind: 'time',
    ms: totalTimeOf(entry.lapTimesMs) - totalTimeOf(leader.lapTimesMs),
  };
}
