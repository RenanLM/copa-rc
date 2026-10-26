/**
 * Núcleo EXATO do simulador: distribuição dos pontos das etapas restantes entre
 * os adversários. Trabalha só com números (sem pilotos, sem React), o que o torna
 * fácil de provar e de testar contra força bruta.
 *
 * Modelo: em cada etapa restante existem "slots" de pontos (ex.: 10, 6, 3, 2, 1).
 * Cada slot vai para um adversário diferente, e um adversário recebe NO MÁXIMO um
 * slot por etapa (ele só tem uma colocação por prova). Slots que ninguém recebe
 * valem 0 (colocação fora dos pontos). O piloto em análise já ocupou o seu próprio
 * slot, que por isso não aparece aqui.
 *
 * Duas perguntas, ambas respondidas com exatidão:
 *  - `minPilotsAbove`: no melhor caso para o piloto, quantos adversários ficam
 *    ACIMA de um limite T (pontos finais > T)?
 *  - `maxPilotsAbove`: no pior caso, quantos?
 */

/** Slots de pontos de cada etapa restante (valores disponíveis para os adversários). */
export type RaceSlots = readonly (readonly number[])[];

export interface Allocation {
  /** Índice da etapa em `RaceSlots`. */
  race: number;
  value: number;
  /** Índice do adversário no vetor de pontos recebido. */
  pilot: number;
}

export interface SolveResult {
  /** Quantos adversários terminam com pontos > T (exato). */
  count: number;
  /** Uma distribuição que realiza `count` (testemunha concreta). */
  allocation: Allocation[];
}

interface Slot {
  race: number;
  value: number;
}

const byValueDesc = (a: Slot, b: Slot) => b.value - a.value || a.race - b.race;

/**
 * Cabe todos os slots nas capacidades, com no máximo um slot por etapa por piloto?
 * Busca exaustiva com memorização e poda por simetria. Retorna o piloto de cada
 * slot (na ordem recebida) ou null se for impossível.
 */
function pack(slots: readonly Slot[], caps: readonly number[]): number[] | null {
  if (slots.length === 0) return [];
  if (caps.length === 0) return null;

  const order = slots.map((_, i) => i).sort((a, b) => byValueDesc(slots[a]!, slots[b]!));
  const remaining = [...caps];
  const usedRaces = caps.map(() => 0);
  const result = new Array<number>(slots.length).fill(-1);
  const failed = new Set<string>();

  const keyAt = (depth: number) =>
    `${depth}|${remaining
      .map((cap, p) => `${cap}:${usedRaces[p]}`)
      .sort()
      .join(',')}`;

  const dfs = (depth: number): boolean => {
    if (depth === order.length) return true;
    const key = keyAt(depth);
    if (failed.has(key)) return false;

    const index = order[depth]!;
    const slot = slots[index]!;
    const tried = new Set<string>();
    for (let p = 0; p < caps.length; p++) {
      if (remaining[p]! < slot.value || (usedRaces[p]! & (1 << slot.race)) !== 0) continue;
      const signature = `${remaining[p]}:${usedRaces[p]}`;
      if (tried.has(signature)) continue; // pilotos no mesmo estado são intercambiáveis
      tried.add(signature);

      remaining[p]! -= slot.value;
      usedRaces[p]! |= 1 << slot.race;
      result[index] = p;
      if (dfs(depth + 1)) return true;
      remaining[p]! += slot.value;
      usedRaces[p]! &= ~(1 << slot.race);
    }
    failed.add(key);
    return false;
  };

  return dfs(0) ? result : null;
}

/**
 * Cada piloto da lista consegue receber slots (no máx. um por etapa) somando pelo
 * menos `need`? Retorna os slots de cada piloto ou null.
 */
function cover(slots: readonly Slot[], needs: readonly number[]): number[][] | null {
  const races = slots.reduce((max, s) => Math.max(max, s.race + 1), 0);
  const byRace: number[][] = Array.from({ length: races }, () => []);
  slots.forEach((s, i) => byRace[s.race]!.push(i));

  const chosen: number[][] = needs.map(() => []);
  const failed = new Set<string>();

  const dfs = (pilot: number, used: number): boolean => {
    if (pilot === needs.length) return true;
    const key = `${pilot}|${used}`;
    if (failed.has(key)) return false;
    const need = needs[pilot]!;

    // Escolhas mínimas: para cada etapa, ou nenhum slot ou um slot livre; para ao atingir `need`.
    const pick = (race: number, sum: number, mask: number, picked: number[]): boolean => {
      if (sum >= need) {
        chosen[pilot] = picked;
        return dfs(pilot + 1, used | mask);
      }
      if (race === races) return false;
      for (const idx of byRace[race]!) {
        const bit = 1 << idx;
        if (((used | mask) & bit) !== 0) continue;
        if (pick(race + 1, sum + slots[idx]!.value, mask | bit, [...picked, idx])) return true;
      }
      return pick(race + 1, sum, mask, picked);
    };

    if (pick(0, 0, 0, [])) return true;
    failed.add(key);
    return false;
  };

  return dfs(0, 0) ? chosen : null;
}

function flatten(races: RaceSlots): Slot[] {
  return races.flatMap((values, race) => values.map((value) => ({ race, value })));
}

/**
 * MELHOR caso: o menor número de adversários com pontos finais > `threshold`.
 *
 * Argumento de exatidão: adversários já acima de T absorvem pontos "de graça";
 * entre os demais, sacrificar (deixar passar) os de MENOR folga é sempre ao menos
 * tão bom quanto qualquer outra escolha; e, com `a` absorvedores, os `a` maiores
 * slots de cada etapa devem ir para eles. O resto precisa caber nas folgas.
 */
export function minPilotsAbove(points: readonly number[], races: RaceSlots, threshold: number): SolveResult {
  const above: number[] = [];
  const capable: { pilot: number; cap: number }[] = [];
  points.forEach((p, pilot) => {
    if (p > threshold) above.push(pilot);
    else capable.push({ pilot, cap: threshold - p });
  });
  capable.sort((a, b) => a.cap - b.cap || a.pilot - b.pilot);

  for (let k = 0; k <= capable.length; k++) {
    const sacrificed = capable.slice(0, k).map((c) => c.pilot);
    const rest = capable.slice(k);
    const absorbers = [...sacrificed, ...above];

    const allocation: Allocation[] = [];
    const residual: Slot[] = [];
    races.forEach((values, race) => {
      [...values]
        .sort((a, b) => b - a)
        .forEach((value, index) => {
          if (index < absorbers.length) allocation.push({ race, value, pilot: absorbers[index]! });
          else residual.push({ race, value });
        });
    });

    const placed = pack(residual, rest.map((c) => c.cap));
    if (placed) {
      residual.forEach((slot, i) => allocation.push({ ...slot, pilot: rest[placed[i]!]!.pilot }));
      return { count: above.length + k, allocation };
    }
  }
  // Só ocorre se houver mais slots por etapa do que adversários.
  return { count: points.length, allocation: [] };
}

/**
 * PIOR caso: o maior número de adversários com pontos finais > `threshold`.
 *
 * Quem precisa de menos pontos para passar o limite é o mais barato de "trazer":
 * se k pilotos podem ser trazidos, os k de menor necessidade também podem.
 */
export function maxPilotsAbove(points: readonly number[], races: RaceSlots, threshold: number): SolveResult {
  const already = points.filter((p) => p > threshold).length;
  const candidates = points
    .map((p, pilot) => ({ pilot, need: threshold - p + 1 }))
    .filter((c) => c.need >= 1)
    .sort((a, b) => a.need - b.need || a.pilot - b.pilot);

  const slots = flatten(races);

  for (let k = candidates.length; k >= 0; k--) {
    const group = candidates.slice(0, k);
    // Mais exigentes primeiro: poda melhor.
    const ordered = [...group].sort((a, b) => b.need - a.need);
    const covered = cover(slots, ordered.map((c) => c.need));
    if (!covered) continue;

    const allocation: Allocation[] = [];
    const taken = new Set<number>();
    const holds = new Map<number, Set<number>>(); // etapa -> pilotos que já têm slot
    ordered.forEach((c, i) => {
      for (const slotIndex of covered[i]!) {
        const slot = slots[slotIndex]!;
        allocation.push({ ...slot, pilot: c.pilot });
        taken.add(slotIndex);
        (holds.get(slot.race) ?? holds.set(slot.race, new Set()).get(slot.race)!).add(c.pilot);
      }
    });

    // Slots que sobraram vão para quem tem mais pontos (o desfecho "natural").
    const byPoints = points.map((p, pilot) => ({ pilot, p })).sort((a, b) => b.p - a.p || a.pilot - b.pilot);
    slots.forEach((slot, slotIndex) => {
      if (taken.has(slotIndex)) return;
      const heldHere = holds.get(slot.race) ?? new Set<number>();
      const target = byPoints.find((c) => !heldHere.has(c.pilot));
      if (!target) return;
      allocation.push({ ...slot, pilot: target.pilot });
      heldHere.add(target.pilot);
      holds.set(slot.race, heldHere);
    });
    return { count: already + k, allocation };
  }
  return { count: already, allocation: [] };
}
