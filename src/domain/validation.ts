import { finishedRaces } from './standings';
import type { Championship } from './types';

export interface ValidationIssue {
  code: string;
  message: string;
}

/**
 * Verifica as invariantes do campeonato. Um conjunto de dados que as viole
 * não deve ser exibido: a interface mostra "dados indisponíveis" em vez de
 * apresentar uma classificação inconsistente.
 */
export function validateChampionship(c: Championship): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  if (c.races.length !== c.rules.totalRaces) {
    add('race-count', `O campeonato deve ter ${c.rules.totalRaces} provas; encontradas ${c.races.length}.`);
  }
  const rounds = new Set(c.races.map((r) => r.round));
  for (let round = 1; round <= c.rules.totalRaces; round++) {
    if (!rounds.has(round)) add('missing-round', `Etapa ${round} ausente.`);
  }

  const pilotIds = new Set(c.pilots.map((p) => p.id));
  for (const team of c.teams) {
    const members = c.pilots.filter((p) => p.teamId === team.id);
    if (members.length !== c.rules.pilotsPerTeam) {
      add('team-size', `A equipe ${team.name} deve ter ${c.rules.pilotsPerTeam} pilotos; encontrados ${members.length}.`);
    }
    for (const id of team.pilotIds) {
      if (!pilotIds.has(id)) add('team-pilot-unknown', `Equipe ${team.name} referencia piloto inexistente (${id}).`);
    }
  }
  for (const pilot of c.pilots) {
    if (!c.teams.some((t) => t.id === pilot.teamId)) {
      add('pilot-team-unknown', `Piloto ${pilot.name} sem equipe válida.`);
    }
  }

  const finishedIds = new Set(finishedRaces(c).map((r) => r.id));
  for (const results of c.results) {
    const race = c.races.find((r) => r.id === results.raceId);
    if (!race) {
      add('result-race-unknown', `Resultado para etapa inexistente (${results.raceId}).`);
      continue;
    }
    if (!finishedIds.has(race.id)) {
      add('result-unfinished', `A etapa ${race.round} tem resultados, mas não está finalizada.`);
    }
    const positions = results.final.map((e) => e.position).sort((a, b) => a - b);
    if (positions.some((pos, i) => pos !== i + 1)) {
      add('positions', `Posições da etapa ${race.round} não formam uma sequência 1..N sem repetição.`);
    }
    const seen = new Set<string>();
    for (const entry of results.final) {
      if (!pilotIds.has(entry.pilotId)) add('result-pilot-unknown', `Etapa ${race.round}: piloto inexistente (${entry.pilotId}).`);
      if (seen.has(entry.pilotId)) add('result-duplicate', `Etapa ${race.round}: piloto repetido (${entry.pilotId}).`);
      seen.add(entry.pilotId);
    }
  }
  for (const race of c.races) {
    if (race.status === 'finished' && !c.results.some((r) => r.raceId === race.id)) {
      add('result-missing', `A etapa ${race.round} está finalizada, mas sem resultados.`);
    }
  }
  return issues;
}
