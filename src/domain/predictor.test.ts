import { buildDemoChampionship } from '@/data/demo';
import { statusOf, summarizeTarget } from './outcomes';
import {
  assignSlot,
  buildPredictor,
  cheapestViableCombo,
  findCombo,
  placePilot,
  remainingRaces,
  scenarioFromPreset,
  type Predictor,
} from './predictor';
import { projectStandings, validateScenario, type Scenario } from './scenario';

const demo = buildDemoChampionship();
const LUCAS = 'lucas-ferreira';

function predictorFor(horizon: 'next' | 'final'): Predictor {
  const result = buildPredictor(demo, LUCAS, horizon);
  if (!result.ok) throw new Error(result.reason);
  return result.predictor;
}

describe('buildPredictor', () => {
  it('horizonte final considera as duas etapas restantes (36 combinações)', () => {
    const p = predictorFor('final');
    expect(p.races.map((r) => r.round)).toEqual([4, 5]);
    expect(p.racesAfterHorizon).toBe(0);
    expect(p.combos).toHaveLength(36);
    expect(p.currentStanding).toMatchObject({ position: 3, points: 11 });
    expect(p.rivalIds).toHaveLength(11);
    expect(p.rivalIds[0]).toBe('diego-martins'); // adversários na ordem da classificação
  });

  it('horizonte "próxima etapa" considera só a etapa 4 e avisa que ainda resta uma', () => {
    const p = predictorFor('next');
    expect(p.races.map((r) => r.round)).toEqual([4]);
    expect(p.racesAfterHorizon).toBe(1);
    expect(p.combos).toHaveLength(6);
  });

  it('informa por que não há análise', () => {
    expect(buildPredictor(demo, 'fantasma', 'final')).toEqual({ ok: false, reason: 'unknown-pilot' });
    const finished = { ...demo, races: demo.races.map((r) => ({ ...r, status: 'finished' as const })) };
    expect(buildPredictor(finished, LUCAS, 'final')).toEqual({ ok: false, reason: 'no-remaining-races' });
  });

  it('lista as etapas restantes', () => {
    expect(remainingRaces(demo).map((r) => r.round)).toEqual([4, 5]);
  });
});

describe('afirmações matemáticas para Lucas (11 pts, 3º)', () => {
  const p = predictorFor('final');
  const combo = (a: number, b: number) => findCombo(p, [a, b])!;

  it('vencer as duas etapas torna o título possível, mas não garantido', () => {
    expect(combo(1, 1).points).toBe(31);
    expect(statusOf(combo(1, 1), 1)).toBe('possible');
  });

  it('vencendo as duas etapas, o pior caso é o 3º lugar (garantido)', () => {
    // Diego (26) e Rafael (19) podem passar, mas não os dois ao mesmo tempo com menos de 2º+2º.
    expect(combo(1, 1).worst).toBe(3);
    expect(statusOf(combo(1, 1), 3)).toBe('guaranteed');
    expect(statusOf(combo(1, 1), 2)).toBe('possible');
  });

  it('sem pontuar, o 2º lugar é matematicamente impossível', () => {
    expect(statusOf(combo(6, 6), 2)).toBe('impossible');
    expect(statusOf(combo(6, 6), 1)).toBe('impossible');
  });

  it('manter o 3º lugar não é garantido: sem pontuar, vários adversários podem passar', () => {
    expect(combo(6, 6).worst).toBeGreaterThan(3);
    expect(summarizeTarget(p.combos, 3).status).toBe('possible');
  });

  it('o 12º lugar é garantido em qualquer cenário', () => {
    expect(summarizeTarget(p.combos, 12).status).toBe('guaranteed');
    expect(summarizeTarget(p.combos, 1).bestRank).toBe(1);
  });

  it('a combinação mais barata atende a posição desejada', () => {
    for (const target of [1, 2, 3, 4]) {
      const cheapest = cheapestViableCombo(p, target);
      expect(['possible', 'guaranteed']).toContain(statusOf(cheapest, target));
      // nenhuma combinação com menos pontos atende
      const cheaper = p.combos.filter((c) => c.gained < cheapest.gained && ['possible', 'guaranteed'].includes(statusOf(c, target)));
      expect(cheaper).toHaveLength(0);
    }
    expect(cheapestViableCombo(p, 3).gained).toBe(0);
  });
});

describe('cenários e classificação projetada', () => {
  const p = predictorFor('final');
  const combo = findCombo(p, [1, 1])!;

  it('o cenário favorável realiza o melhor caso e é válido pelas regras', () => {
    const scenario = scenarioFromPreset(p, combo, 'favorable', 1);
    expect(validateScenario(demo, scenario)).toEqual([]);
    expect(scenario.outcomes.map((o) => o.raceId)).toEqual(['etapa-4', 'etapa-5']);
    for (const outcome of scenario.outcomes) {
      expect(outcome.podium).toHaveLength(5);
      expect(outcome.podium[0]).toBe(LUCAS);
    }
    const projected = projectStandings(demo, scenario);
    const lucas = projected.find((s) => s.pilotId === LUCAS)!;
    expect(lucas).toMatchObject({ points: 31, position: 1, tied: false, gained: 20, basePosition: 3, change: 2 });
  });

  it('o cenário difícil realiza o pior caso (empates contra)', () => {
    const scenario = scenarioFromPreset(p, combo, 'hard', 1);
    expect(validateScenario(demo, scenario)).toEqual([]);
    const projected = projectStandings(demo, scenario);
    const lucas = projected.find((s) => s.pilotId === LUCAS)!;
    const atLeast = projected.filter((s) => s.pilotId !== LUCAS && s.points >= lucas.points).length;
    expect(1 + atLeast).toBe(combo.worst);
  });

  it('"rivais repetem" usa a ordem da etapa 3 e mantém as colocações de Lucas', () => {
    const scenario = scenarioFromPreset(p, findCombo(p, [3, 3])!, 'repeat', 3);
    expect(validateScenario(demo, scenario)).toEqual([]);
    // etapa 3: Diego, Rafael, Lucas, Helena, Mateus → sem Lucas: Diego, Rafael, Helena, Mateus, Thiago
    expect(scenario.outcomes[0]!.podium).toEqual(['diego-martins', 'rafael-nunes', LUCAS, 'helena-duarte', 'mateus-cavalcante']);
  });

  it('a projeção usa só as regras oficiais de pontos e sinaliza empates', () => {
    const scenario: Scenario = {
      outcomes: [
        { raceId: 'etapa-4', podium: ['thiago-barros', 'bianca-moreira', LUCAS] },
      ],
    };
    const projected = projectStandings(demo, scenario);
    const by = Object.fromEntries(projected.map((s) => [s.pilotId, s]));
    expect(by['thiago-barros']).toMatchObject({ points: 14, gained: 10 }); // 4 + 10
    expect(by['bianca-moreira']).toMatchObject({ points: 8 }); // 2 + 6
    expect(by[LUCAS]).toMatchObject({ points: 14, gained: 3 }); // 11 + 3 → empata com Thiago
    expect(by['thiago-barros']!.tied && by[LUCAS]!.tied).toBe(true);
    expect(by['thiago-barros']!.position).toBe(by[LUCAS]!.position);
  });

  it('sem cenário, a projeção é a classificação atual', () => {
    const projected = projectStandings(demo, { outcomes: [] });
    expect(projected.every((s) => s.gained === 0 && s.change === 0)).toBe(true);
    expect(projected.slice(0, 3).map((s) => s.pilotId)).toEqual(['diego-martins', 'rafael-nunes', LUCAS]);
  });
});

describe('validateScenario', () => {
  it('recusa piloto repetido, etapa já disputada, piloto inexistente e pódio grande demais', () => {
    expect(validateScenario(demo, { outcomes: [{ raceId: 'etapa-4', podium: [LUCAS, LUCAS] }] })).toHaveLength(1);
    expect(validateScenario(demo, { outcomes: [{ raceId: 'etapa-3', podium: [LUCAS] }] })[0]).toMatch(/já foi disputada/);
    expect(validateScenario(demo, { outcomes: [{ raceId: 'etapa-4', podium: ['x'] }] })[0]).toMatch(/inexistente/);
    expect(
      validateScenario(demo, {
        outcomes: [{ raceId: 'etapa-4', podium: ['a', 'b', 'c', 'd', 'e', 'f'] }],
      }).some((m) => m.includes('posições que pontuam')),
    ).toBe(true);
  });
});

describe('edição do pódio', () => {
  const podium = ['a', 'b', 'c', 'd', 'e'];

  it('assignSlot troca de lugar com quem já estava no pódio, sem repetir pilotos', () => {
    expect(assignSlot(podium, 2, 'e')).toEqual(['a', 'e', 'c', 'd', 'b']);
  });

  it('assignSlot com piloto de fora tira o ocupante do pódio', () => {
    expect(assignSlot(podium, 2, 'z')).toEqual(['a', 'z', 'c', 'd', 'e']);
  });

  it('placePilot move o piloto, e o ocupante assume a posição antiga', () => {
    expect(placePilot(['L', 'b', 'c', 'd', 'e'], 'L', 3, 5, ['b', 'c', 'd', 'e', 'f'])).toEqual(['c', 'b', 'L', 'd', 'e']);
  });

  it('placePilot para fora dos pontos preenche a vaga com o próximo adversário', () => {
    expect(placePilot(['L', 'b', 'c', 'd', 'e'], 'L', 6, 5, ['b', 'c', 'd', 'e', 'f', 'g'])).toEqual(['f', 'b', 'c', 'd', 'e']);
  });

  it('placePilot vindo de fora dos pontos expulsa o ocupante da posição', () => {
    expect(placePilot(['a', 'b', 'c', 'd', 'e'], 'L', 2, 5, ['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'L', 'c', 'd', 'e']);
  });
});
