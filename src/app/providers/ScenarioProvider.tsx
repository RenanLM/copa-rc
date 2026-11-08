import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { applyDemoScenario, type DemoScenario } from '@/data/demo/scenarios';
import { createChampionshipModel } from '@/domain';
import { setScenarioChoice, useScenarioChoice, type ScenarioChoice } from '@/lib/demo-scenario';
import type { ProfileDefinition } from '../profiles';
import { useChampionshipLoader } from './ChampionshipProvider';
import { ModelContext } from './model-context';

interface ScenarioContextValue {
  /** Momento em vigor (já considerando o padrão do perfil). */
  scenario: DemoScenario;
  /** O que o usuário escolheu: um momento ou `auto` (padrão do perfil). */
  choice: ScenarioChoice;
  setChoice: (choice: ScenarioChoice) => void;
  /** Só dados de demonstração têm "momentos" para escolher. */
  selectable: boolean;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

/**
 * Recorta o campeonato completo no momento em vigor e entrega o modelo (índices e
 * classificações) a todas as telas. Trocar de momento é instantâneo: não recarrega
 * dados, só muda o recorte. Com dados reais (`source: 'live'`) o recorte não existe.
 */
export function ScenarioProvider({ profile, children }: { profile: ProfileDefinition; children: ReactNode }) {
  const { state } = useChampionshipLoader();
  const choice = useScenarioChoice();
  const scenario = choice === 'auto' ? profile.defaultScenario : choice;
  const base = state.status === 'ready' ? state.championship : null;

  const model = useMemo(
    () =>
      base ? createChampionshipModel(base.source === 'demo' ? applyDemoScenario(base, scenario) : base) : null,
    [base, scenario],
  );

  const value = useMemo<ScenarioContextValue>(
    () => ({ scenario, choice, setChoice: setScenarioChoice, selectable: base?.source === 'demo' }),
    [scenario, choice, base],
  );

  return (
    <ScenarioContext.Provider value={value}>
      <ModelContext.Provider value={model}>{children}</ModelContext.Provider>
    </ScenarioContext.Provider>
  );
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario precisa estar dentro de ScenarioProvider');
  return ctx;
}
