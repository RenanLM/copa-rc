import { createContext } from 'react';
import type { ChampionshipModel } from '@/domain';

/**
 * Modelo do campeonato NO MOMENTO escolhido (ver ScenarioProvider). Fica em um
 * arquivo próprio para que `useModel` (em ChampionshipProvider) e o provedor do
 * momento não dependam um do outro.
 */
export const ModelContext = createContext<ChampionshipModel | null>(null);
