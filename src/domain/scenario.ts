import { pointsForPosition } from './scoring';
import { computePilotStandings } from './standings';
import type { Championship, PilotId, RaceId, TeamId } from './types';

/**
 * Cenário hipotético: quem termina em cada posição pontuadora das etapas que
 * ainda não aconteceram. Pontos são sempre calculados pelas regras oficiais.
 */
export interface RaceOutcome {
  raceId: RaceId;
  /** Pilotos em ordem de chegada: índice 0 = 1º lugar. Quem não está na lista faz 0 ponto. */
  podium: readonly PilotId[];
}

export interface Scenario {
  outcomes: readonly RaceOutcome[];
}

export interface ProjectedStanding {
  pilotId: PilotId;
  teamId: TeamId;
  /** Posição na projeção. Empatados dividem a posição (desempate indefinido). */
  position: number;
  tied: boolean;
  points: number;
  basePoints: number;
  basePosition: number;
  /** Pontos somados pelo cenário. */
  gained: number;
  /** Posições ganhas (+) ou perdidas (−) em relação à classificação atual. */
  change: number;
}

/** Problemas de um cenário (lista vazia = válido). */
export function validateScenario(championship: Championship, scenario: Scenario): string[] {
  const issues: string[] = [];
  const pilots = new Set(championship.pilots.map((p) => p.id));
  const maxSlots = championship.rules.pointsByPosition.length;

  for (const outcome of scenario.outcomes) {
    const race = championship.races.find((r) => r.id === outcome.raceId);
    if (!race) issues.push(`Etapa inexistente: ${outcome.raceId}.`);
    else if (race.status === 'finished') issues.push(`A etapa ${race.round} já foi disputada.`);
    if (outcome.podium.length > maxSlots) issues.push(`Mais pilotos do que posições que pontuam (${maxSlots}).`);
    const seen = new Set<PilotId>();
    for (const id of outcome.podium) {
      if (!pilots.has(id)) issues.push(`Piloto inexistente: ${id}.`);
      if (seen.has(id)) issues.push(`Piloto repetido na mesma etapa: ${id}.`);
      seen.add(id);
    }
  }
  return issues;
}

/**
 * Classificação projetada: classificação atual + pontos do cenário. Os critérios
 * de desempate (indefinidos) nunca são aplicados: empatados dividem a posição.
 */
export function projectStandings(championship: Championship, scenario: Scenario): ProjectedStanding[] {
  const base = computePilotStandings(championship);
  const gained = new Map<PilotId, number>();
  for (const outcome of scenario.outcomes) {
    outcome.podium.forEach((pilotId, index) => {
      gained.set(pilotId, (gained.get(pilotId) ?? 0) + pointsForPosition(index + 1, championship.rules));
    });
  }

  const numberOf = new Map(championship.pilots.map((p) => [p.id, p.number]));
  const rows = base
    .map((s) => ({
      pilotId: s.pilotId,
      teamId: s.teamId,
      basePoints: s.points,
      basePosition: s.position,
      gained: gained.get(s.pilotId) ?? 0,
    }))
    .map((r) => ({ ...r, points: r.basePoints + r.gained }))
    .sort((a, b) => b.points - a.points || (numberOf.get(a.pilotId) ?? 0) - (numberOf.get(b.pilotId) ?? 0));

  const out: ProjectedStanding[] = [];
  rows.forEach((row, index) => {
    const previous = out[index - 1];
    const position = previous && previous.points === row.points ? previous.position : index + 1;
    out.push({ ...row, position, tied: false, change: row.basePosition - position });
  });
  const counts = new Map<number, number>();
  out.forEach((r) => counts.set(r.position, (counts.get(r.position) ?? 0) + 1));
  return out.map((r) => ({ ...r, tied: (counts.get(r.position) ?? 0) > 1 }));
}
