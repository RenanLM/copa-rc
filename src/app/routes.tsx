import type { ReactElement } from 'react';
import { PilotHomePage } from '@/features/home/PilotHomePage';
import { NotFoundPage } from '@/features/placeholders/NotFoundPage';
import { PerformancePage } from '@/features/performance/PerformancePage';
import { PilotProfilePage } from '@/features/profile/PilotProfilePage';
import { RaceDetailPage } from '@/features/races/RaceDetailPage';
import { RaceReplayPage } from '@/features/replay/RaceReplayPage';
import { RaceResultPage } from '@/features/results/RaceResultPage';
import { RacesPage } from '@/features/races/RacesPage';
import { SpectatorDirectoryPage } from '@/features/spectator/SpectatorDirectoryPage';
import { SpectatorFeedPage } from '@/features/spectator/SpectatorFeedPage';
import { SpectatorHomePage } from '@/features/spectator/SpectatorHomePage';
import { SpectatorLivePage } from '@/features/spectator/SpectatorLivePage';
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
    home: <SpectatorHomePage />,
    live: <SpectatorLivePage />,
    standings: <StandingsPage />,
    feed: <SpectatorFeedPage />,
    directory: <SpectatorDirectoryPage />,
  },
};

/** Rotas de detalhe que não aparecem na navegação principal. */
export const DETAIL_ROUTES: Record<ProfileId, { path: string; element: ReactElement }[]> = {
  pilot: [
    { path: 'corridas/:raceId', element: <RaceDetailPage /> },
    { path: 'corridas/:raceId/replay', element: <RaceReplayPage /> },
    { path: 'desempenho', element: <PerformancePage /> },
  ],
  spectator: [{ path: 'etapa/:raceId', element: <RaceResultPage /> }],
};

export const NOT_FOUND = <NotFoundPage />;
