import { bestLapOf, type GapToLeader } from './laps';
import { resultsOf } from './standings';
import type { Championship, FinishStatus, PilotId, RaceId } from './types';

/**
 * Reprodução ("replay") de uma etapa, construída a partir das voltas JÁ
 * registradas no resultado. Nada é inventado: o tempo em que cada piloto cruza a
 * linha de chegada a cada volta vem dos dados, então a classificação ao final do
 * replay é exatamente o resultado oficial.
 *
 * O que é ILUSTRATIVO: a posição *dentro* de cada volta (interpolada em
 * velocidade constante) e a ordem de largada. Não é telemetria real.
 */

export interface ReplayCar {
  pilotId: PilotId;
  /** 0 = pole. Ordem ilustrativa de largada (ver `gridOrder`). */
  gridIndex: number;
  /** Instante (ms desde a largada) em que cada volta registrada termina. */
  lapEndsMs: readonly number[];
  status: FinishStatus;
}

export interface ReplayModel {
  raceId: RaceId;
  totalLaps: number;
  /** Instante em que o último piloto que terminou cruza a linha. */
  durationMs: number;
  cars: readonly ReplayCar[];
}

export interface CarSample {
  pilotId: PilotId;
  /** 1 = líder. Ordem por progresso; entre quem terminou, por ordem de chegada. */
  position: number;
  /** Voltas percorridas (fracionário). Negativo = ainda atrás da linha, no grid. */
  progress: number;
  /**
   * Posição para DESENHAR o carro: igual a `progress`, mas quem já terminou segue
   * em ritmo reduzido (volta de desaceleração) até meia volta além da linha.
   */
  visualProgress: number;
  /** Volta em andamento (1..totalLaps). */
  lap: number;
  lapsCompleted: number;
  finished: boolean;
  /** Abandonou a prova: o carro fica parado onde o registro termina. */
  retired: boolean;
  gap: GapToLeader;
  gridIndex: number;
}

export interface ReplaySnapshot {
  timeMs: number;
  /** Ordenado por posição. */
  cars: readonly CarSample[];
  leaderLap: number;
  /** Todos os que não abandonaram já cruzaram a linha. */
  raceFinished: boolean;
}

/** Quanto além da linha os carros seguem após terminar, e a que fração da velocidade. */
const COOL_DOWN_LAPS = 0.45;
const COOL_DOWN_SPEED = 0.5;

/** Recuo na largada: duas colunas, a cada par o carro recua mais um pouco. */
const GRID_STEP = 0.018;

export function gridOffset(gridIndex: number): number {
  return (Math.floor(gridIndex / 2) + 1) * GRID_STEP;
}

/**
 * Ordem de largada ILUSTRATIVA: melhor volta nas baterias da etapa; sem baterias,
 * a ordem de chegada. Não é uma regra do campeonato.
 */
export function gridOrder(championship: Championship, raceId: RaceId): PilotId[] {
  const results = resultsOf(championship, raceId);
  if (!results) return [];
  const finalPosition = new Map(results.final.map((e) => [e.pilotId, e.position]));
  const bestInHeats = new Map<PilotId, number>();
  for (const heat of results.heats) {
    for (const entry of heat.entries) {
      const lap = bestLapOf(entry.lapTimesMs);
      if (lap === null) continue;
      bestInHeats.set(entry.pilotId, Math.min(bestInHeats.get(entry.pilotId) ?? Infinity, lap));
    }
  }
  return [...finalPosition.keys()].sort(
    (a, b) =>
      (bestInHeats.get(a) ?? Infinity) - (bestInHeats.get(b) ?? Infinity) ||
      (finalPosition.get(a) ?? 0) - (finalPosition.get(b) ?? 0),
  );
}

/** Monta o modelo de replay de uma etapa finalizada; null se não houver resultado. */
export function buildReplay(championship: Championship, raceId: RaceId): ReplayModel | null {
  const race = championship.races.find((r) => r.id === raceId);
  const results = resultsOf(championship, raceId);
  if (!race || race.status !== 'finished' || !results || results.final.length === 0) return null;

  const grid = gridOrder(championship, raceId);
  const cars: ReplayCar[] = results.final.map((entry) => {
    const lapEndsMs: number[] = [];
    let elapsed = 0;
    for (const lap of entry.lapTimesMs) {
      elapsed += lap;
      lapEndsMs.push(elapsed);
    }
    return {
      pilotId: entry.pilotId,
      gridIndex: Math.max(0, grid.indexOf(entry.pilotId)),
      lapEndsMs,
      status: entry.status,
    };
  });

  const finishTimes = cars
    .filter((c) => c.status === 'finished' && c.lapEndsMs.length > 0)
    .map((c) => c.lapEndsMs[c.lapEndsMs.length - 1]!);
  const durationMs = finishTimes.length > 0 ? Math.max(...finishTimes) : 0;

  return { raceId, totalLaps: race.finalLaps, durationMs, cars };
}

interface RawSample {
  car: ReplayCar;
  progress: number;
  lapsCompleted: number;
  finished: boolean;
  retired: boolean;
  finishTimeMs: number | null;
  /** Duração da volta em andamento (para estimar diferenças). */
  currentLapMs: number;
}

function sampleCar(model: ReplayModel, car: ReplayCar, timeMs: number): RawSample {
  const ends = car.lapEndsMs;
  const start = -gridOffset(car.gridIndex);
  const lastEnd = ends[ends.length - 1] ?? 0;

  if (timeMs <= 0 || ends.length === 0) {
    return { car, progress: start, lapsCompleted: 0, finished: false, retired: false, finishTimeMs: null, currentLapMs: ends[0] ?? 1 };
  }

  // Voltas já concluídas em `timeMs`.
  let done = 0;
  while (done < ends.length && ends[done]! <= timeMs) done++;

  if (done === ends.length) {
    const completedAll = car.status === 'finished' && ends.length >= model.totalLaps;
    return {
      car,
      progress: ends.length,
      lapsCompleted: ends.length,
      finished: completedAll,
      retired: !completedAll,
      finishTimeMs: completedAll ? lastEnd : null,
      currentLapMs: ends[ends.length - 1]! - (ends[ends.length - 2] ?? 0),
    };
  }

  const lapStart = done === 0 ? 0 : ends[done - 1]!;
  const lapMs = ends[done]! - lapStart;
  const fraction = (timeMs - lapStart) / lapMs;
  // Na 1ª volta o carro sai do grid (atrás da linha) e chega a 1.0 ao fim dela.
  const progress = done === 0 ? start + (1 - start) * fraction : done + fraction;
  return { car, progress, lapsCompleted: done, finished: false, retired: false, finishTimeMs: null, currentLapMs: lapMs };
}

/** Estado da corrida em um instante. Função pura: mesmo tempo, mesmo resultado. */
export function sampleReplay(model: ReplayModel, timeMs: number): ReplaySnapshot {
  const raw = model.cars.map((car) => sampleCar(model, car, timeMs));

  raw.sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0) || a.car.gridIndex - b.car.gridIndex;
    }
    return b.progress - a.progress || a.car.gridIndex - b.car.gridIndex;
  });

  const leader = raw[0];
  const cars: CarSample[] = raw.map((r, index) => {
    let gap: GapToLeader;
    if (index === 0) gap = { kind: 'leader' };
    else if (r.retired) gap = { kind: 'dnf' };
    else if (r.finished && leader?.finished) {
      gap = { kind: 'time', ms: (r.finishTimeMs ?? 0) - (leader.finishTimeMs ?? 0) };
    } else {
      const behind = Math.max(0, (leader?.progress ?? 0) - r.progress);
      gap =
        behind >= 1
          ? { kind: 'laps', laps: Math.floor(behind) }
          : { kind: 'time', ms: behind * (leader?.currentLapMs ?? 0) };
    }
    const coolDown =
      r.finished && r.finishTimeMs !== null
        ? Math.min(COOL_DOWN_LAPS, ((timeMs - r.finishTimeMs) / r.currentLapMs) * COOL_DOWN_SPEED)
        : 0;
    return {
      pilotId: r.car.pilotId,
      position: index + 1,
      progress: r.progress,
      visualProgress: r.progress + coolDown,
      lap: Math.min(r.lapsCompleted + 1, model.totalLaps),
      lapsCompleted: r.lapsCompleted,
      finished: r.finished,
      retired: r.retired,
      gap,
      gridIndex: r.car.gridIndex,
    };
  });

  const racing = raw.filter((r) => !r.retired);
  return {
    timeMs,
    cars,
    leaderLap: cars[0]?.lap ?? 1,
    raceFinished: racing.length > 0 && racing.every((r) => r.finished),
  };
}
