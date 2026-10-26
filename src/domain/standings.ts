import { bestLapOf } from './laps';
import { pointsForPosition } from './scoring';
import type {
  Championship,
  PilotId,
  PilotStanding,
  Race,
  RaceId,
  RaceResults,
  StandingsSnapshot,
  TeamStanding,
  TiebreakCriterion,
} from './types';

/** Etapas finalizadas, em ordem de realização. */
export function finishedRaces(championship: Championship): Race[] {
  return championship.races
    .filter((r) => r.status === 'finished')
    .sort((a, b) => a.round - b.round);
}

/** Primeira etapa ainda não finalizada (a em andamento ou a próxima). */
export function nextRace(championship: Championship): Race | null {
  return (
    [...championship.races]
      .sort((a, b) => a.round - b.round)
      .find((r) => r.status !== 'finished') ?? null
  );
}

export function resultsOf(
  championship: Championship,
  raceId: RaceId,
): RaceResults | undefined {
  return championship.results.find((r) => r.raceId === raceId);
}

interface PilotAccumulator {
  pilotId: PilotId;
  teamId: string;
  points: number;
  racePoints: Record<RaceId, number>;
  /** finishes[i] = quantas vezes terminou na posição i+1. */
  finishes: number[];
  bestLapMs: number | null;
}

function accumulate(
  championship: Championship,
  throughRound: number,
): PilotAccumulator[] {
  const byPilot = new Map<PilotId, PilotAccumulator>();
  for (const pilot of championship.pilots) {
    byPilot.set(pilot.id, {
      pilotId: pilot.id,
      teamId: pilot.teamId,
      points: 0,
      racePoints: {},
      finishes: [],
      bestLapMs: null,
    });
  }

  for (const race of finishedRaces(championship)) {
    if (race.round > throughRound) continue;
    const results = resultsOf(championship, race.id);
    if (!results) continue;
    for (const entry of results.final) {
      const acc = byPilot.get(entry.pilotId);
      if (!acc) continue;
      const pts = pointsForPosition(entry.position, championship.rules);
      acc.racePoints[race.id] = pts;
      acc.points += pts;
      acc.finishes[entry.position - 1] = (acc.finishes[entry.position - 1] ?? 0) + 1;
    }
    for (const session of [results.final, ...results.heats.map((h) => h.entries)]) {
      for (const entry of session) {
        const acc = byPilot.get(entry.pilotId);
        const lap = bestLapOf(entry.lapTimesMs);
        if (acc && lap !== null && (acc.bestLapMs === null || lap < acc.bestLapMs)) {
          acc.bestLapMs = lap;
        }
      }
    }
  }
  return [...byPilot.values()];
}

/**
 * Compara dois pilotos pelos critérios de desempate configurados.
 * Retorna 0 quando nenhum critério os separa (empate sem solução).
 * Valor negativo = `a` fica à frente.
 */
function compareByTiebreak(
  a: PilotAccumulator,
  b: PilotAccumulator,
  criteria: readonly TiebreakCriterion[],
): number {
  for (const criterion of criteria) {
    let diff = 0;
    switch (criterion) {
      case 'most-wins':
        diff = (b.finishes[0] ?? 0) - (a.finishes[0] ?? 0);
        break;
      case 'finish-countback': {
        const len = Math.max(a.finishes.length, b.finishes.length);
        for (let i = 0; i < len && diff === 0; i++) {
          diff = (b.finishes[i] ?? 0) - (a.finishes[i] ?? 0);
        }
        break;
      }
      case 'best-lap':
        if (a.bestLapMs !== b.bestLapMs) {
          if (a.bestLapMs === null) diff = 1;
          else if (b.bestLapMs === null) diff = -1;
          else diff = a.bestLapMs - b.bestLapMs;
        }
        break;
    }
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Classificação de pilotos considerando as etapas até `throughRound`. */
export function computePilotStandings(
  championship: Championship,
  throughRound: number = championship.rules.totalRaces,
): PilotStanding[] {
  const criteria = championship.tiebreak.criteria;
  const numberOf = new Map(championship.pilots.map((p) => [p.id, p.number]));
  const accs = accumulate(championship, throughRound);

  const compare = (a: PilotAccumulator, b: PilotAccumulator) =>
    b.points !== a.points ? b.points - a.points : compareByTiebreak(a, b, criteria);

  // A ordem entre empatados é só de exibição estável (número do carro);
  // não representa critério de desempate.
  accs.sort(
    (a, b) =>
      compare(a, b) || (numberOf.get(a.pilotId) ?? 0) - (numberOf.get(b.pilotId) ?? 0),
  );

  const standings: PilotStanding[] = [];
  accs.forEach((acc, i) => {
    const prev = accs[i - 1];
    const sameAsPrev = prev !== undefined && compare(prev, acc) === 0;
    const position = sameAsPrev ? standings[i - 1]!.position : i + 1;
    standings.push({
      pilotId: acc.pilotId,
      teamId: acc.teamId,
      position,
      tied: false,
      points: acc.points,
      racePoints: acc.racePoints,
      wins: acc.finishes[0] ?? 0,
      podiums: (acc.finishes[0] ?? 0) + (acc.finishes[1] ?? 0) + (acc.finishes[2] ?? 0),
      bestFinish: acc.finishes.findIndex((n) => (n ?? 0) > 0) + 1 || null,
    });
  });
  return markTies(standings);
}

function markTies<T extends { position: number; tied: boolean }>(rows: T[]): T[] {
  const counts = new Map<number, number>();
  for (const row of rows) counts.set(row.position, (counts.get(row.position) ?? 0) + 1);
  return rows.map((row) => ({ ...row, tied: (counts.get(row.position) ?? 0) > 1 }));
}

/** Classificação de equipes: soma dos pontos dos pilotos de cada equipe. */
export function computeTeamStandings(
  championship: Championship,
  throughRound: number = championship.rules.totalRaces,
  pilotStandings: readonly PilotStanding[] = computePilotStandings(
    championship,
    throughRound,
  ),
): TeamStanding[] {
  const rows = championship.teams.map((team) => {
    const members = pilotStandings.filter((s) => s.teamId === team.id);
    const racePoints: Record<RaceId, number> = {};
    for (const member of members) {
      for (const [raceId, pts] of Object.entries(member.racePoints)) {
        racePoints[raceId] = (racePoints[raceId] ?? 0) + pts;
      }
    }
    return {
      teamId: team.id,
      points: members.reduce((sum, m) => sum + m.points, 0),
      pilotPoints: members.map((m) => ({ pilotId: m.pilotId, points: m.points })),
      racePoints,
    };
  });

  // Desempate entre equipes também não é definido: empates ficam sinalizados.
  const sorted = [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      teamOrder(championship, a.teamId) - teamOrder(championship, b.teamId),
  );
  const standings: TeamStanding[] = [];
  sorted.forEach((row, i) => {
    const prev = standings[i - 1];
    const position = prev && prev.points === row.points ? prev.position : i + 1;
    standings.push({ ...row, position, tied: false });
  });
  return markTies(standings);
}

function teamOrder(championship: Championship, teamId: string): number {
  return championship.teams.findIndex((t) => t.id === teamId);
}

/**
 * Retrato da classificação após cada etapa finalizada (1..N). Alimenta
 * gráficos de evolução e indicadores de subida/descida de posição.
 */
export function computeStandingsHistory(
  championship: Championship,
): StandingsSnapshot[] {
  return finishedRaces(championship).map((race) => {
    const pilots = computePilotStandings(championship, race.round);
    return {
      throughRound: race.round,
      pilots,
      teams: computeTeamStandings(championship, race.round, pilots),
    };
  });
}
