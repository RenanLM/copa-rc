import { bestLapOf, raceFastestLap, totalTimeOf } from './laps';
import { pointsForPosition } from './scoring';
import { computePilotStandings, finishedRaces, resultsOf } from './standings';
import type { Championship, PilotId, Race } from './types';

export interface HeatPerformance {
  index: number;
  position: number;
  fieldSize: number;
  laps: number;
  bestLapMs: number | null;
  /** Volta mais rápida da bateria, entre todos os pilotos. */
  fastestMs: number;
}

export interface RacePerformance {
  race: Race;
  finalPosition: number;
  fieldSize: number;
  points: number;
  championshipPosition: number;
  cumulativePoints: number;
  /** Melhor volta do piloto na etapa (baterias e prova final). */
  bestLapMs: number | null;
  /** Volta mais rápida da etapa, entre todos os pilotos. */
  raceFastestMs: number | null;
  /**
   * Melhor volta relativa: 100 × (volta mais rápida da etapa ÷ melhor volta do piloto).
   * 100 = tão rápido quanto a volta mais rápida da etapa. Normaliza pistas diferentes.
   */
  bestLapRelative: number | null;
  /** Tempo médio de volta na prova final. */
  avgLapMs: number | null;
  /** Tempo médio de volta do vencedor da prova final. */
  winnerAvgMs: number | null;
  /** Ritmo relativo: 100 × (média do vencedor ÷ média do piloto). 100 = ritmo do vencedor. */
  paceRelative: number | null;
  /**
   * Variação entre voltas: coeficiente de variação (%) das voltas 2..N da prova final
   * (a 1ª volta sai da largada parada e fica de fora). Menor = mais regular.
   */
  consistencyPct: number | null;
  heats: HeatPerformance[];
}

function coefficientOfVariation(values: readonly number[]): number | null {
  if (values.length < 3) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : null;
}

/** Indicadores de desempenho do piloto, uma entrada por etapa finalizada em que correu. */
export function getPilotPerformance(
  championship: Championship,
  pilotId: PilotId,
): RacePerformance[] {
  const out: RacePerformance[] = [];

  for (const race of finishedRaces(championship)) {
    const results = resultsOf(championship, race.id);
    const entry = results?.final.find((e) => e.pilotId === pilotId);
    if (!results || !entry) continue;

    const standing = computePilotStandings(championship, race.round).find(
      (s) => s.pilotId === pilotId,
    );
    const winner = results.final.find((e) => e.position === 1);
    const pilotBest = [
      bestLapOf(entry.lapTimesMs),
      ...results.heats.map((h) =>
        bestLapOf(h.entries.find((e) => e.pilotId === pilotId)?.lapTimesMs ?? []),
      ),
    ].reduce<number | null>((min, lap) => (lap === null ? min : min === null ? lap : Math.min(min, lap)), null);

    const raceFastestMs = raceFastestLap(championship, race.id)?.timeMs ?? null;
    const avgLapMs =
      entry.lapTimesMs.length > 0 ? totalTimeOf(entry.lapTimesMs) / entry.lapTimesMs.length : null;
    const winnerAvgMs =
      winner && winner.lapTimesMs.length > 0
        ? totalTimeOf(winner.lapTimesMs) / winner.lapTimesMs.length
        : null;

    out.push({
      race,
      finalPosition: entry.position,
      fieldSize: results.final.length,
      points: pointsForPosition(entry.position, championship.rules),
      championshipPosition: standing?.position ?? 0,
      cumulativePoints: standing?.points ?? 0,
      bestLapMs: pilotBest,
      raceFastestMs,
      bestLapRelative:
        pilotBest !== null && raceFastestMs !== null ? (raceFastestMs / pilotBest) * 100 : null,
      avgLapMs,
      winnerAvgMs,
      paceRelative: avgLapMs !== null && winnerAvgMs !== null ? (winnerAvgMs / avgLapMs) * 100 : null,
      consistencyPct: coefficientOfVariation(entry.lapTimesMs.slice(1)),
      heats: results.heats.flatMap((heat) => {
        const mine = heat.entries.find((e) => e.pilotId === pilotId);
        if (!mine) return [];
        return [
          {
            index: heat.index,
            position: mine.position,
            fieldSize: heat.entries.length,
            laps: mine.lapTimesMs.length,
            bestLapMs: bestLapOf(mine.lapTimesMs),
            fastestMs: Math.min(
              ...heat.entries.map((e) => bestLapOf(e.lapTimesMs) ?? Infinity),
            ),
          },
        ];
      }),
    });
  }
  return out;
}
