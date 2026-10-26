import { buildDemoChampionship } from '@/data/demo';
import { buildPredictor, type Horizon, type Predictor } from '@/domain';
import { buildVerdict } from './verdict';

const demo = buildDemoChampionship();

function predictor(horizon: Horizon): Predictor {
  const result = buildPredictor(demo, 'lucas-ferreira', horizon);
  if (!result.ok) throw new Error(result.reason);
  return result.predictor;
}

describe('buildVerdict (Lucas, 3º com 11 pts)', () => {
  const final = predictor('final');

  it('garantida só quando vale em todos os resultados', () => {
    const verdict = buildVerdict(final, 12);
    expect(verdict.status).toBe('guaranteed');
    expect(verdict.summary).toMatch(/^Garantida/);
    expect(verdict.details.join(' ')).toMatch(/Comprovado/);
  });

  it('o 1º lugar é condicional: possível, mas nunca garantido', () => {
    const verdict = buildVerdict(final, 1);
    expect(verdict.status).toBe('possible');
    expect(verdict.summary).toMatch(/Possível, mas depende/);
    expect(verdict.stats.minPointsGuaranteed).toBeNull();
    expect(verdict.details.join(' ')).toMatch(/Nenhum resultado seu garante/);
  });

  it('informa quantos pontos são necessários e quando a posição passa a ser garantida', () => {
    const verdict = buildVerdict(final, 3);
    expect(verdict.stats.minPointsPossible).toBe(0);
    expect(verdict.stats.minPointsGuaranteed).not.toBeNull();
    expect(verdict.details.join(' ')).toMatch(/a posição fica garantida/);
  });

  it('a mesma pergunta tem respostas diferentes na projeção e no final', () => {
    const next = predictor('next');
    expect(buildVerdict(next, 1)).toMatchObject({ status: 'impossible', where: 'após a etapa 4' });
    expect(buildVerdict(next, 1).details.join(' ')).toMatch(/projetada após a etapa 4: ainda restará 1 etapa/);
    expect(buildVerdict(final, 1)).toMatchObject({ status: 'possible', where: 'ao final do campeonato' });
  });

  it('nunca chama de garantida uma posição cujo pior caso é pior', () => {
    for (let target = 1; target <= 12; target++) {
      const verdict = buildVerdict(final, target);
      if (verdict.status === 'guaranteed') expect(verdict.stats.worstRank).toBeLessThanOrEqual(target);
      if (verdict.status === 'impossible') expect(verdict.stats.bestRank).toBeGreaterThan(target);
    }
  });
});
