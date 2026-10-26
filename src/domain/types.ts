/**
 * Modelo de domínio do campeonato. Sem dependência de React ou de qualquer
 * biblioteca de interface: pode ser reaproveitado em outra camada visual.
 */

export type PilotId = string;
export type TeamId = string;
export type RaceId = string;
export type TrackId = string;

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  /** Cor de identificação da equipe (carros, listras de tabela). */
  color: string;
  city: string;
  pilotIds: readonly PilotId[];
}

export interface Pilot {
  id: PilotId;
  name: string;
  /** Número do carro. */
  number: number;
  teamId: TeamId;
  age: number;
  city: string;
  bio: string;
}

/** Ponto [x, y] em uma grade de desenho (ver `TRACK_VIEWBOX`). */
export type Point = readonly [number, number];

export interface Track {
  id: TrackId;
  name: string;
  city: string;
  /** Comprimento aproximado de uma volta, em metros (escala real da pista RC). */
  lengthMeters: number;
  /**
   * Traçado simplificado: pontos de controle de uma curva fechada, só para
   * desenhar a pista. Opcional; sem ele a interface usa um oval genérico.
   */
  layout?: readonly Point[];
}

export type RaceStatus = 'scheduled' | 'live' | 'finished';

export interface Race {
  id: RaceId;
  /** Número da etapa (1 a 5). */
  round: number;
  name: string;
  trackId: TrackId;
  /** Data no formato AAAA-MM-DD. */
  date: string;
  /** Horário de largada no formato HH:mm. */
  startTime: string;
  status: RaceStatus;
  /** Voltas previstas na prova final da etapa. */
  finalLaps: number;
}

export type FinishStatus = 'finished' | 'dnf';

/** Resultado de um piloto na prova final de uma etapa. */
export interface FinalEntry {
  pilotId: PilotId;
  /** Posição oficial de chegada (1 = vencedor). */
  position: number;
  status: FinishStatus;
  lapTimesMs: readonly number[];
}

/** Resultado de um piloto em uma bateria (sessão cronometrada). */
export interface HeatEntry {
  pilotId: PilotId;
  position: number;
  lapTimesMs: readonly number[];
}

export interface Heat {
  /** Número da bateria dentro da etapa (1, 2, 3...). */
  index: number;
  durationMs: number;
  entries: readonly HeatEntry[];
}

export interface RaceResults {
  raceId: RaceId;
  final: readonly FinalEntry[];
  heats: readonly Heat[];
}

/** Regras oficiais. Ver `rules.ts` para os valores. */
export interface ChampionshipRules {
  totalRaces: number;
  pilotsPerTeam: number;
  maxPostsPerTeamPerRace: number;
  /** Pontos por posição: índice 0 = 1º lugar. Posições além da lista valem 0. */
  pointsByPosition: readonly number[];
}

/**
 * Critérios de desempate NÃO são definidos pelo regulamento atual.
 * Por isso a configuração padrão é vazia: empates permanecem sinalizados como
 * "critério indefinido". Os critérios abaixo existem apenas como mecanismo
 * opcional e não representam regra oficial.
 */
export type TiebreakCriterion = 'most-wins' | 'finish-countback' | 'best-lap';

export interface TiebreakConfig {
  criteria: readonly TiebreakCriterion[];
}

/** Origem do conjunto de dados exibido. */
export type DataSource = 'demo' | 'live';

export interface Championship {
  id: string;
  name: string;
  season: string;
  source: DataSource;
  /** "Hoje" do conjunto de dados (AAAA-MM-DD). Usado em contagens regressivas. */
  referenceDate: string;
  rules: ChampionshipRules;
  tiebreak: TiebreakConfig;
  teams: readonly Team[];
  pilots: readonly Pilot[];
  tracks: readonly Track[];
  races: readonly Race[];
  results: readonly RaceResults[];
}

export interface PilotStanding {
  pilotId: PilotId;
  teamId: TeamId;
  /** Posição na classificação. Pilotos empatados compartilham a posição. */
  position: number;
  /** Verdadeiro quando há empate que o regulamento não resolve. */
  tied: boolean;
  points: number;
  /** Pontos obtidos em cada etapa finalizada considerada. */
  racePoints: Readonly<Record<RaceId, number>>;
  wins: number;
  podiums: number;
  /** Melhor colocação em uma etapa, ou null se ainda não correu. */
  bestFinish: number | null;
}

export interface TeamStanding {
  teamId: TeamId;
  position: number;
  tied: boolean;
  points: number;
  pilotPoints: readonly { pilotId: PilotId; points: number }[];
  racePoints: Readonly<Record<RaceId, number>>;
}

export interface StandingsSnapshot {
  /** Número de etapas finalizadas consideradas neste retrato. */
  throughRound: number;
  pilots: readonly PilotStanding[];
  teams: readonly TeamStanding[];
}
