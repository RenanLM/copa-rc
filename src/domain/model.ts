import {
  computePilotStandings,
  computeStandingsHistory,
  computeTeamStandings,
  finishedRaces,
} from './standings';
import type {
  Championship,
  Pilot,
  PilotId,
  PilotStanding,
  Race,
  RaceId,
  RaceResults,
  StandingsSnapshot,
  Team,
  TeamId,
  TeamStanding,
  Track,
  TrackId,
} from './types';

/**
 * Visão pronta para consumo: índices por id e classificações calculadas UMA vez.
 * Todas as telas (painel, ranking, simuladores, animações) recebem este mesmo
 * objeto, o que impede versões divergentes da classificação.
 */
export interface ChampionshipModel {
  championship: Championship;
  pilotsById: ReadonlyMap<PilotId, Pilot>;
  teamsById: ReadonlyMap<TeamId, Team>;
  racesById: ReadonlyMap<RaceId, Race>;
  tracksById: ReadonlyMap<TrackId, Track>;
  resultsByRace: ReadonlyMap<RaceId, RaceResults>;
  /** Classificação atual (todas as etapas finalizadas). */
  pilotStandings: readonly PilotStanding[];
  teamStandings: readonly TeamStanding[];
  standingByPilot: ReadonlyMap<PilotId, PilotStanding>;
  /** Retratos da classificação após cada etapa finalizada. */
  history: readonly StandingsSnapshot[];
  /** Número da última etapa finalizada (0 se nenhuma). */
  lastFinishedRound: number;
}

export function createChampionshipModel(championship: Championship): ChampionshipModel {
  const lastFinishedRound = finishedRaces(championship).at(-1)?.round ?? 0;
  const pilotStandings = computePilotStandings(championship, lastFinishedRound);
  return {
    championship,
    pilotsById: new Map(championship.pilots.map((p) => [p.id, p])),
    teamsById: new Map(championship.teams.map((t) => [t.id, t])),
    racesById: new Map(championship.races.map((r) => [r.id, r])),
    tracksById: new Map(championship.tracks.map((t) => [t.id, t])),
    resultsByRace: new Map(championship.results.map((r) => [r.raceId, r])),
    pilotStandings,
    teamStandings: computeTeamStandings(championship, lastFinishedRound, pilotStandings),
    standingByPilot: new Map(pilotStandings.map((s) => [s.pilotId, s])),
    history: computeStandingsHistory(championship),
    lastFinishedRound,
  };
}
