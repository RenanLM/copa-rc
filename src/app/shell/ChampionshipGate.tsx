import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { DataLoadError } from '@/data/repository';
import { useChampionshipLoader } from '../providers/ChampionshipProvider';

/**
 * Garante que as telas só renderizem com dados válidos. O restante do shell
 * (barra, navegação) permanece visível durante carregamento e erro.
 */
export function ChampionshipGate({ children }: { children: ReactNode }) {
  const { state, reload } = useChampionshipLoader();

  if (state.status === 'loading') return <LoadingState />;

  if (state.status === 'error') {
    const error = state.error;
    if (error instanceof DataLoadError && error.kind === 'invalid') {
      return (
        <ErrorState
          title="Dados indisponíveis"
          message="Os dados do campeonato estão inconsistentes, então preferimos não exibi-los."
          details={error.issues.map((issue) => issue.message)}
          onRetry={reload}
        />
      );
    }
    return <ErrorState onRetry={reload} />;
  }

  return <>{children}</>;
}
