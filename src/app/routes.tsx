import type { ReactElement } from 'react';
import { Newspaper, Radio, Users } from 'lucide-react';
import { PilotHomePage } from '@/features/home/PilotHomePage';
import { NotFoundPage } from '@/features/placeholders/NotFoundPage';
import { ComingSoonPage } from '@/features/placeholders/ComingSoonPage';
import { PerformancePage } from '@/features/performance/PerformancePage';
import { PilotProfilePage } from '@/features/profile/PilotProfilePage';
import { RaceDetailPage } from '@/features/races/RaceDetailPage';
import { RaceReplayPage } from '@/features/replay/RaceReplayPage';
import { RacesPage } from '@/features/races/RacesPage';
import { SimulatorPage } from '@/features/simulator/SimulatorPage';
import { StandingsPage } from '@/features/standings/StandingsPage';
import type { ProfileId } from './profiles';

/**
 * Liga cada item de navegação (declarado em profiles.ts) à sua tela.
 * Telas compartilhadas (Classificação, Corridas) aparecem em mais de um perfil.
 */
export const PAGES: Record<ProfileId, Record<string, ReactElement>> = {
  pilot: {
    home: <PilotHomePage />,
    races: <RacesPage />,
    standings: <StandingsPage />,
    simulator: <SimulatorPage />,
    profile: <PilotProfilePage />,
  },
  spectator: {
    home: (
      <ComingSoonPage
        title="Início"
        icon={Radio}
        description="Aqui você vai acompanhar a etapa do momento, os líderes e entender como o campeonato funciona."
      />
    ),
    live: (
      <ComingSoonPage
        title="Ao Vivo"
        icon={Radio}
        description="Acompanhe as posições dos pilotos na pista durante a corrida."
      />
    ),
    standings: <StandingsPage />,
    feed: (
      <ComingSoonPage
        title="Feed"
        icon={Newspaper}
        description="Publicações das equipes sobre cada etapa."
      />
    ),
    directory: (
      <ComingSoonPage
        title="Pilotos e Equipes"
        icon={Users}
        description="Conheça quem disputa o campeonato e as equipes em que correm."
      />
    ),
  },
};

/** Rotas de detalhe que não aparecem na navegação principal. */
export const DETAIL_ROUTES: Record<ProfileId, { path: string; element: ReactElement }[]> = {
  pilot: [
    { path: 'corridas/:raceId', element: <RaceDetailPage /> },
    { path: 'corridas/:raceId/replay', element: <RaceReplayPage /> },
    { path: 'desempenho', element: <PerformancePage /> },
  ],
  spectator: [],
};

export const NOT_FOUND = <NotFoundPage />;
