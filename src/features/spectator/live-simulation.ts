import { computePilotStandings, type ReplayCar, type ReplayModel } from '@/domain';
import type { Championship, Race } from '@/domain';

const LAP_TIME_MS = 8_000;

/**
 * Gera uma ordem ilustrativa, com variações de ritmo suficientes para mostrar
 * ultrapassagens. Os tempos não representam telemetria nem resultado oficial.
 */
export function buildSpectatorLiveSimulation(
  championship: Championship,
  race: Race,
): ReplayModel {
  const standings = new Map(
    computePilotStandings(championship).map((standing) => [standing.pilotId, standing.points]),
  );
  const grid = [...championship.pilots].sort(
    (a, b) =>
      (standings.get(b.id) ?? 0) - (standings.get(a.id) ?? 0) ||
      a.number - b.number,
  );

  const cars: ReplayCar[] = grid.map((pilot, gridIndex) => {
    let elapsed = 0;
    const lapEndsMs = Array.from({ length: race.finalLaps }, (_, lapIndex) => {
      const lapNumber = lapIndex + 1;
      const swing =
        Math.sin(lapNumber * 1.17 + gridIndex * 1.83) * 520 +
        Math.sin(lapNumber * 0.39 + gridIndex * 2.71) * 260;
      const lapTime = Math.max(4_000, Math.round(LAP_TIME_MS + gridIndex * 24 + swing));
      elapsed += lapTime;
      return elapsed;
    });

    return { pilotId: pilot.id, gridIndex, lapEndsMs, status: 'finished' };
  });

  return {
    raceId: race.id,
    totalLaps: race.finalLaps,
    durationMs: Math.max(...cars.flatMap((car) => car.lapEndsMs)),
    cars,
  };
}
