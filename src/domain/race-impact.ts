import { gapToLeader, raceFastestLap, totalTimeOf, type GapToLeader, type SessionRef } from './laps';
import { pointsForPosition } from './scoring';
import { computePilotStandings, computeTeamStandings, resultsOf } from './standings';
import type { Championship, PilotId, PilotStanding, Race, RaceId, TeamId, TeamStanding } from './types';

/**
 * Impacto de uma etapa finalizada: pódio, destaques e como a classificação geral
 * mudou. Tudo é derivado dos mesmos resultados e das mesmas regras de pontos que
 * alimentam as demais telas.
 */

export interface PodiumEntry {
  /** 1, 2 ou 3. */
  position: number;
  pilotId: PilotId;
  teamId: TeamId;
  points: number;
  totalTimeMs: number;
  gap: GapToLeader;
}

export interface StandingChange<Id extends string = string> {
  id: Id;
  /** Posição antes da etapa; null se a etapa foi a primeira (não há antes). */
  positionBefore: number | null;
  positionAfter: number;
  pointsBefore: number;
  pointsAfter: number;
  /** Pontos somados na etapa. */
  gained: number;
  tiedBefore: boolean;
  tiedAfter: boolean;
}

export type RaceHighlight =
  | { kind: 'winner'; pilotId: PilotId; teamId: TeamId }
  /** Dois pilotos da mesma equipe no pódio. `double` = 1º e 2º. */
  | { kind: 'team-podium'; teamId: TeamId; pilotIds: PilotId[]; positions: number[]; double: boolean }
  /** Novo líder do campeonato de pilotos (só quando a liderança é inequívoca antes e depois). */
  | { kind: 'pilot-lead'; pilotId: PilotId; previousLeaderId: PilotId }
  | { kind: 'team-lead'; teamId: TeamId; previousLeaderId: TeamId }
  | { kind: 'fastest-lap'; pilotId: PilotId; timeMs: number; session: SessionRef }
  | { kind: 'biggest-climb'; pilotId: PilotId; places: number };

export interface RaceImpact {
  race: Race;
  podium: PodiumEntry[];
  highlights: RaceHighlight[];
  pilots: StandingChange<PilotId>[];
  teams: StandingChange<TeamId>[];
}

/** Líder único (sem empate) ou null. */
function uniqueLeader<T extends { position: number; tied: boolean }>(rows: readonly T[]): T | null {
  const first = rows.find((r) => r.position === 1);
  return first && !first.tied ? first : null;
}

function changes<R extends { position: number; points: number; tied: boolean }, Id extends string>(
  after: readonly R[],
  before: readonly R[] | null,
  idOf: (row: R) => Id,
): StandingChange<Id>[] {
  const previous = new Map(before?.map((row) => [idOf(row), row]));
  return after.map((row) => {
    const old = previous.get(idOf(row));
    return {
      id: idOf(row),
      positionBefore: old ? old.position : null,
      positionAfter: row.position,
      pointsBefore: old ? old.points : 0,
      pointsAfter: row.points,
      gained: row.points - (old?.points ?? 0),
      tiedBefore: old?.tied ?? false,
      tiedAfter: row.tied,
    };
  });
}

/** null se a etapa não existe, não foi finalizada ou não tem resultado. */
export function getRaceImpact(championship: Championship, raceId: RaceId): RaceImpact | null {
  const race = championship.races.find((r) => r.id === raceId);
  const results = resultsOf(championship, raceId);
  if (!race || race.status !== 'finished' || !results || results.final.length === 0) return null;

  const ordered = [...results.final].sort((a, b) => a.position - b.position);
  const winner = ordered[0]!;
  const teamOf = (pilotId: PilotId) => championship.pilots.find((p) => p.id === pilotId)?.teamId ?? '';

  const podium: PodiumEntry[] = ordered.slice(0, 3).map((entry) => ({
    position: entry.position,
    pilotId: entry.pilotId,
    teamId: teamOf(entry.pilotId),
    points: pointsForPosition(entry.position, championship.rules),
    totalTimeMs: totalTimeOf(entry.lapTimesMs),
    gap: gapToLeader(entry, winner),
  }));

  // Classificação antes e depois da etapa.
  const pilotsAfter: PilotStanding[] = computePilotStandings(championship, race.round);
  const teamsAfter: TeamStanding[] = computeTeamStandings(championship, race.round, pilotsAfter);
  const hasBefore = race.round > 1;
  const pilotsBefore = hasBefore ? computePilotStandings(championship, race.round - 1) : null;
  const teamsBefore = pilotsBefore ? computeTeamStandings(championship, race.round - 1, pilotsBefore) : null;

  const pilotChanges = changes(pilotsAfter, pilotsBefore, (r) => r.pilotId);
  const teamChanges = changes(teamsAfter, teamsBefore, (r) => r.teamId);

  // Destaques ---------------------------------------------------------------
  const highlights: RaceHighlight[] = [
    { kind: 'winner', pilotId: winner.pilotId, teamId: teamOf(winner.pilotId) },
  ];

  const byTeam = new Map<TeamId, PodiumEntry[]>();
  for (const entry of podium) byTeam.set(entry.teamId, [...(byTeam.get(entry.teamId) ?? []), entry]);
  for (const [teamId, entries] of byTeam) {
    if (entries.length < 2) continue;
    const positions = entries.map((e) => e.position);
    highlights.push({
      kind: 'team-podium',
      teamId,
      pilotIds: entries.map((e) => e.pilotId),
      positions,
      double: positions.includes(1) && positions.includes(2),
    });
  }

  if (pilotsBefore) {
    const was = uniqueLeader(pilotsBefore);
    const now = uniqueLeader(pilotsAfter);
    if (was && now && was.pilotId !== now.pilotId) {
      highlights.push({ kind: 'pilot-lead', pilotId: now.pilotId, previousLeaderId: was.pilotId });
    }
  }
  if (teamsBefore) {
    const was = uniqueLeader(teamsBefore);
    const now = uniqueLeader(teamsAfter);
    if (was && now && was.teamId !== now.teamId) {
      highlights.push({ kind: 'team-lead', teamId: now.teamId, previousLeaderId: was.teamId });
    }
  }

  const fastest = raceFastestLap(championship, raceId);
  if (fastest) {
    highlights.push({ kind: 'fastest-lap', pilotId: fastest.pilotId, timeMs: fastest.timeMs, session: fastest.session });
  }

  const climb = pilotChanges
    .filter((c) => c.positionBefore !== null)
    .map((c) => ({ pilotId: c.id, places: c.positionBefore! - c.positionAfter }))
    .sort((a, b) => b.places - a.places)[0];
  if (climb && climb.places >= 2) highlights.push({ kind: 'biggest-climb', ...climb });

  return { race, podium, highlights, pilots: pilotChanges, teams: teamChanges };
}
