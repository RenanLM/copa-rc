import { MotionConfig } from 'motion/react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ChampionshipProvider } from './providers/ChampionshipProvider';
import { PROFILES, profilePath, readLastProfile } from './profiles';
import { DETAIL_ROUTES, NOT_FOUND, PAGES } from './routes';
import { AppShell } from './shell/AppShell';

export function App() {
  return (
    // "user": respeita a preferência de movimento reduzido do sistema.
    <MotionConfig reducedMotion="user">
      <ChampionshipProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to={profilePath(readLastProfile())} replace />} />
            {PROFILES.map((profile) => (
              <Route key={profile.id} path={profile.slug} element={<AppShell profile={profile} />}>
                {profile.nav.map((item) => {
                  const element = PAGES[profile.id][item.id];
                  return item.path === '' ? (
                    <Route key={item.id} index element={element} />
                  ) : (
                    <Route key={item.id} path={item.path} element={element} />
                  );
                })}
                {DETAIL_ROUTES[profile.id].map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={NOT_FOUND} />
              </Route>
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ChampionshipProvider>
    </MotionConfig>
  );
}
