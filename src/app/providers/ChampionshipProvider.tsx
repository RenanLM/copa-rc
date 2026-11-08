import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createDemoRepository } from '@/data/repository';
import type { Championship, ChampionshipModel } from '@/domain';
import { takePendingSimulation } from '@/lib/demo-settings';
import { ModelContext } from './model-context';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  /** `championship` é o conjunto COMPLETO; o momento escolhido o recorta (ScenarioProvider). */
  | { status: 'ready'; championship: Championship };

interface ChampionshipContextValue {
  state: LoadState;
  reload: () => void;
}

const ChampionshipContext = createContext<ChampionshipContextValue | null>(null);

// Trocar a origem dos dados (API real, telemetria) é trocar esta linha.
const repository = createDemoRepository(takePendingSimulation);

export function ChampionshipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  // Uma única requisição por tentativa, mesmo com o StrictMode remontando efeitos.
  const inflight = useRef<{ attempt: number; promise: Promise<Championship> } | null>(null);

  useEffect(() => {
    if (inflight.current?.attempt !== attempt) {
      inflight.current = { attempt, promise: repository.load() };
    }
    let cancelled = false;
    inflight.current.promise.then(
      (championship) => {
        if (!cancelled) setState({ status: 'ready', championship });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(() => ({ state, reload }), [state, reload]);
  return <ChampionshipContext.Provider value={value}>{children}</ChampionshipContext.Provider>;
}

export function useChampionshipLoader(): ChampionshipContextValue {
  const ctx = useContext(ChampionshipContext);
  if (!ctx) throw new Error('useChampionshipLoader precisa estar dentro de ChampionshipProvider');
  return ctx;
}

/**
 * Modelo do campeonato no momento escolhido. Só use dentro de `ChampionshipGate`,
 * que garante dados prontos.
 */
export function useModel(): ChampionshipModel {
  const model = useContext(ModelContext);
  if (!model) throw new Error('useModel chamado antes de os dados estarem prontos');
  return model;
}

/** Campeonato completo, sem recorte de momento (ex.: fonte da simulação ao vivo). */
export function useBaseChampionship(): Championship {
  const { state } = useChampionshipLoader();
  if (state.status !== 'ready') throw new Error('useBaseChampionship chamado antes de os dados estarem prontos');
  return state.championship;
}
