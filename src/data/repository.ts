import { validateChampionship, type Championship, type ValidationIssue } from '@/domain';
import { buildDemoChampionship } from './demo';

/**
 * Fronteira entre a interface e a origem dos dados. Hoje só existe a fonte de
 * demonstração; uma fonte real (API/telemetria) implementaria esta mesma
 * interface sem alterar telas ou regras.
 */
export interface ChampionshipRepository {
  load(): Promise<Championship>;
}

export class DataLoadError extends Error {
  constructor(
    readonly kind: 'network' | 'invalid',
    message: string,
    readonly issues: readonly ValidationIssue[] = [],
  ) {
    super(message);
    this.name = 'DataLoadError';
  }
}

/** Simulações para avaliação de estados de carregamento e de erro. */
export type DemoSimulation = 'none' | 'slow' | 'error';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * `takeSimulation` devolve a simulação ativa e a consome: assim, "Tentar
 * novamente" após um erro simulado funciona, como numa falha de rede real.
 */
export function createDemoRepository(
  takeSimulation: () => DemoSimulation,
): ChampionshipRepository {
  return {
    async load() {
      const simulation = takeSimulation();
      await wait(simulation === 'slow' ? 2800 : 450);
      if (simulation === 'error') {
        throw new DataLoadError(
          'network',
          'Não foi possível carregar os dados do campeonato.',
        );
      }
      const championship = buildDemoChampionship();
      const issues = validateChampionship(championship);
      if (issues.length > 0) {
        throw new DataLoadError(
          'invalid',
          'Os dados do campeonato estão inconsistentes.',
          issues,
        );
      }
      return championship;
    },
  };
}
