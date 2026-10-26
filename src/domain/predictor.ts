import {
  analyzeOutcomes,
  MAX_ANALYSED_RACES,
  statusOf,
  witnessFor,
  type OutcomeCombo,
  type OutcomeInput,
} from './outcomes';
import type { RaceOutcome, Scenario } from './scenario';
import { computePilotStandings, finishedRaces, resultsOf } from './standings';
import type { Championship, Pilot, PilotId, PilotStanding, Race } from './types';

/**
 * Race Predictor: liga a análise exata (números) ao campeonato (pilotos e etapas).
 *
 * `horizon` separa duas perguntas diferentes:
 *  - 'next'  → classificação PROJETADA após a próxima etapa (ainda restam provas);
 *  - 'final' → classificação FINAL, após a última etapa do campeonato.
 */
export type Horizon = 'next' | 'final';
export type RivalPreset = 'favorable' | 'hard' | 'repeat';

export interface Predictor {
  championship: Championship;
  pilot: Pilot;
  horizon: Horizon;
  /** Etapas consideradas (a próxima, ou todas as restantes). */
  races: Race[];
  /** Etapas restantes além do horizonte (0 no horizonte final). */
  racesAfterHorizon: number;
  /** Adversários, na ordem da classificação atual. */
  rivalIds: PilotId[];
  input: OutcomeInput;
  /** Uma entrada por combinação de colocações do piloto nas etapas consideradas. */
  combos: OutcomeCombo[];
  currentStanding: PilotStanding;
  fieldSize: number;
  slots: number;
}

export type PredictorResult =
  | { ok: true; predictor: Predictor }
  | { ok: false; reason: 'unknown-pilot' | 'no-remaining-races' | 'too-many-races' };

/** Etapas ainda não finalizadas, em ordem. */
export function remainingRaces(championship: Championship): Race[] {
  return championship.races.filter((r) => r.status !== 'finished').sort((a, b) => a.round - b.round);
}

export function buildPredictor(championship: Championship, pilotId: PilotId, horizon: Horizon): PredictorResult {
  const pilot = championship.pilots.find((p) => p.id === pilotId);
  if (!pilot) return { ok: false, reason: 'unknown-pilot' };

  const remaining = remainingRaces(championship);
  if (remaining.length === 0) return { ok: false, reason: 'no-remaining-races' };

  const races = horizon === 'next' ? remaining.slice(0, 1) : remaining;
  if (races.length > MAX_ANALYSED_RACES) return { ok: false, reason: 'too-many-races' };

  const lastRound = finishedRaces(championship).at(-1)?.round ?? 0;
  const standings = computePilotStandings(championship, lastRound);
  const currentStanding = standings.find((s) => s.pilotId === pilotId);
  if (!currentStanding) return { ok: false, reason: 'unknown-pilot' };

  const rivals = standings.filter((s) => s.pilotId !== pilotId);
  const input: OutcomeInput = {
    points: currentStanding.points,
    rivals: rivals.map((s) => s.points),
    raceCount: races.length,
    pointsByPosition: championship.rules.pointsByPosition,
  };

  return {
    ok: true,
    predictor: {
      championship,
      pilot,
      horizon,
      races,
      racesAfterHorizon: remaining.length - races.length,
      rivalIds: rivals.map((s) => s.pilotId),
      input,
      combos: analyzeOutcomes(input),
      currentStanding,
      fieldSize: standings.length,
      slots: championship.rules.pointsByPosition.length,
    },
  };
}

export function findCombo(predictor: Predictor, placings: readonly number[]): OutcomeCombo | undefined {
  return predictor.combos.find((c) => c.placings.every((p, i) => p === placings[i]));
}

/**
 * Combinação "mais barata" que ainda atende a posição desejada: a de menos pontos
 * entre as garantidas ou possíveis (sem depender de empate). Sem nenhuma, a de
 * melhor resultado possível. É o ponto de partida da tela: responde "o que eu preciso?".
 */
export function cheapestViableCombo(predictor: Predictor, target: number): OutcomeCombo {
  const viable = predictor.combos
    .filter((c) => {
      const status = statusOf(c, target);
      return status === 'guaranteed' || status === 'possible';
    })
    .sort((a, b) => a.gained - b.gained || a.placings.reduce((s, p) => s + p, 0) - b.placings.reduce((s, p) => s + p, 0));
  if (viable[0]) return viable[0];
  return [...predictor.combos].sort((a, b) => b.gained - a.gained)[0]!;
}

/** Pódio de uma etapa: índice = colocação − 1. Preenche com `fillers` as posições sem dono. */
function completePodium(
  slots: number,
  assigned: ReadonlyMap<number, PilotId>,
  fillers: readonly PilotId[],
): PilotId[] {
  const used = new Set(assigned.values());
  const spare = fillers.filter((id) => !used.has(id));
  const podium: PilotId[] = [];
  for (let placing = 1; placing <= slots; placing++) {
    const id = assigned.get(placing) ?? spare.shift();
    if (id) podium.push(id);
  }
  return podium;
}

/** Ordem de chegada dos adversários na última etapa disputada (referência do cenário "repetem"). */
function lastRaceOrder(predictor: Predictor): PilotId[] {
  const last = finishedRaces(predictor.championship).at(-1);
  const results = last && resultsOf(predictor.championship, last.id);
  return (results?.final ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((e) => e.pilotId)
    .filter((id) => id !== predictor.pilot.id);
}

/**
 * Cenário completo: as colocações do piloto (`combo`) + o comportamento dos
 * adversários (`preset`). `favorable` e `hard` vêm da análise exata e portanto
 * são o MELHOR e o PIOR caso reais; `repeat` é só ilustrativo.
 */
export function scenarioFromPreset(
  predictor: Predictor,
  combo: OutcomeCombo,
  preset: RivalPreset,
  target: number,
): Scenario {
  const { pilot, rivalIds, slots } = predictor;
  const fillers = preset === 'repeat' ? lastRaceOrder(predictor) : rivalIds;

  const witness =
    preset === 'repeat'
      ? []
      : witnessFor(
          predictor.input,
          combo,
          preset === 'hard' ? 'hard' : statusOf(combo, target) === 'tie-only' ? 'favorable-with-tie' : 'favorable',
        );

  const outcomes: RaceOutcome[] = predictor.races.map((race, raceIndex) => {
    const assigned = new Map<number, PilotId>();
    const mine = combo.placings[raceIndex]!;
    if (mine <= slots) assigned.set(mine, pilot.id);
    for (const w of witness) {
      if (w.race !== raceIndex || w.placing === 0) continue;
      const rivalId = rivalIds[w.rival];
      if (rivalId) assigned.set(w.placing, rivalId);
    }
    return { raceId: race.id, podium: completePodium(slots, assigned, fillers) };
  });
  return { outcomes };
}

/**
 * Coloca `pilotId` na posição `placing` do pódio. Se ele já estava em outra
 * posição, os dois trocam de lugar (nunca há pilotos repetidos nem posições vazias).
 */
export function assignSlot(podium: readonly PilotId[], placing: number, pilotId: PilotId): PilotId[] {
  const next = [...podium];
  const index = placing - 1;
  const previousIndex = next.indexOf(pilotId);
  const displaced = next[index];
  next[index] = pilotId;
  if (previousIndex >= 0 && previousIndex !== index && displaced !== undefined) next[previousIndex] = displaced;
  return next;
}

/**
 * Move o piloto em foco para a colocação `placing` (n+1 = fora dos pontos) mantendo
 * os rivais onde estavam. Quem ocupava a nova posição assume a antiga (troca); se
 * o piloto sai dos pontos, o lugar vago é preenchido pelo próximo rival de `fillers`.
 */
export function placePilot(
  podium: readonly PilotId[],
  pilotId: PilotId,
  placing: number,
  slots: number,
  fillers: readonly PilotId[],
): PilotId[] {
  const oldIndex = podium.indexOf(pilotId);
  const assigned = new Map<number, PilotId>();
  podium.forEach((id, i) => {
    if (id !== pilotId) assigned.set(i + 1, id);
  });

  if (placing <= slots) {
    const occupant = assigned.get(placing);
    assigned.set(placing, pilotId);
    if (occupant && oldIndex >= 0) assigned.set(oldIndex + 1, occupant);
  }
  return completePodium(
    slots,
    assigned,
    fillers.filter((id) => id !== pilotId),
  );
}
