import {
  bestLapOf,
  gapToLeader,
  pilotBestLap,
  pilotTotalLaps,
  type BestLapRecord,
  type GapToLeader,
} from './laps';
import { pointsForPosition } from './scoring';
import {
  computePilotStandings,
  finishedRaces,
  nextRace,
  resultsOf,
} from './standings';
import type {
  Championship,
  FinishStatus,
  Pilot,
  PilotId,
  PilotStanding,
  Race,
  Team,
} from './types';

export interface LastRaceSummary {
  race: Race;
  position: number;
  fieldSize: number;
  points: number;
  status: FinishStatus;
  gap: GapToLeader;
  laps: number;
  bestLapMs: number | null;
}

export interface HeatSummary {
  index: number;
  position: number;
  fieldSize: number;
  laps: number;
  bestLapMs: number | null;
}

export interface EvolutionPoint {
  race: Race;
  /** Colocação na prova final, ou null se a etapa ainda não foi disputada. */
  racePosition: number | null;
  racePoints: number | null;
  /** Posição no campeonato após a etapa. */
  championshipPosition: number | null;
  /** Pontos acumulados após a etapa. */
  cumulativePoints: number | null;
}

export interface Neighbour {
  standing: PilotStanding;
  /** Diferença absoluta de pontos para o piloto em foco. */
  pointsDiff: number;
}

export interface PilotSeasonSummary {
  pilot: Pilot;
  team: Team;
  teammate: Pilot | null;
  racesFinished: number;
  totalRaces: number;
  standing: PilotStanding;
  /** Posições ganhas (+) ou perdidas (−) na última etapa; null sem etapa anterior. */
  positionChange: number | null;
  pointsBehindLeader: number;
  /** Piloto mais próximo com mais pontos. */
  ahead: Neighbour | null;
  /** Piloto mais próximo com menos pontos. */
  behind: Neighbour | null;
  lastRace: LastRaceSummary | null;
  lastRaceHeats: HeatSummary[];
  bestLap: BestLapRecord | null;
  totalLaps: number;
  evolution: EvolutionPoint[];
  nextRace: Race | null;
}

/**
 * Consolida, em um único ponto do domínio, tudo o que o painel de um piloto
 * precisa. A interface apenas apresenta estes valores.
 */
export function getPilotSeasonSummary(
  championship: Championship,
  pilotId: PilotId,
): PilotSeasonSummary | null {
  const pilot = championship.pilots.find((p) => p.id === pilotId);
  const team = pilot && championship.teams.find((t) => t.id === pilot.teamId);
  if (!pilot || !team) return null;

  const finished = finishedRaces(championship);
  const lastRound = finished.at(-1)?.round ?? 0;
  const standings = computePilotStandings(championship, lastRound);
  const standing = standings.find((s) => s.pilotId === pilotId);
  if (!standing) return null;

  const previous =
    lastRound > 1
      ? computePilotStandings(championship, lastRound - 1).find(
          (s) => s.pilotId === pilotId,
        )
      : undefined;

  const ahead = standings
    .filter((s) => s.points > standing.points)
    .sort((a, b) => a.points - b.points || a.position - b.position)[0];
  const behind = standings
    .filter((s) => s.points < standing.points)
    .sort((a, b) => b.points - a.points || a.position - b.position)[0];
  const leaderPoints = Math.max(...standings.map((s) => s.points));

  const teammate =
    championship.pilots.find((p) => p.teamId === team.id && p.id !== pilot.id) ?? null;

  const lastRaceInfo = finished.at(-1);
  const lastResults = lastRaceInfo && resultsOf(championship, lastRaceInfo.id);
  const lastEntry = lastResults?.final.find((e) => e.pilotId === pilotId);
  const leaderEntry = lastResults?.final.find((e) => e.position === 1);

  const lastRace: LastRaceSummary | null =
    lastRaceInfo && lastResults && lastEntry && leaderEntry
      ? {
          race: lastRaceInfo,
          position: lastEntry.position,
          fieldSize: lastResults.final.length,
          points: pointsForPosition(lastEntry.position, championship.rules),
          status: lastEntry.status,
          gap: gapToLeader(lastEntry, leaderEntry),
          laps: lastEntry.lapTimesMs.length,
          bestLapMs: bestLapOf(lastEntry.lapTimesMs),
        }
      : null;

  const lastRaceHeats: HeatSummary[] = (lastResults?.heats ?? []).flatMap((heat) => {
    const entry = heat.entries.find((e) => e.pilotId === pilotId);
    return entry
      ? [
          {
            index: heat.index,
            position: entry.position,
            fieldSize: heat.entries.length,
            laps: entry.lapTimesMs.length,
            bestLapMs: bestLapOf(entry.lapTimesMs),
          },
        ]
      : [];
  });

  const evolution: EvolutionPoint[] = [...championship.races]
    .sort((a, b) => a.round - b.round)
    .map((race) => {
      const results = race.status === 'finished' ? resultsOf(championship, race.id) : undefined;
      const entry = results?.final.find((e) => e.pilotId === pilotId);
      if (!results || !entry) {
        return {
          race,
          racePosition: null,
          racePoints: null,
          championshipPosition: null,
          cumulativePoints: null,
        };
      }
      const after = computePilotStandings(championship, race.round).find(
        (s) => s.pilotId === pilotId,
      );
      return {
        race,
        racePosition: entry.position,
        racePoints: pointsForPosition(entry.position, championship.rules),
        championshipPosition: after?.position ?? null,
        cumulativePoints: after?.points ?? null,
      };
    });

  return {
    pilot,
    team,
    teammate,
    racesFinished: finished.length,
    totalRaces: championship.rules.totalRaces,
    standing,
    positionChange: previous ? previous.position - standing.position : null,
    pointsBehindLeader: leaderPoints - standing.points,
    ahead: ahead ? { standing: ahead, pointsDiff: ahead.points - standing.points } : null,
    behind: behind ? { standing: behind, pointsDiff: standing.points - behind.points } : null,
    lastRace,
    lastRaceHeats,
    bestLap: pilotBestLap(championship, pilotId),
    totalLaps: pilotTotalLaps(championship, pilotId),
    evolution,
    nextRace: nextRace(championship),
  };
}
