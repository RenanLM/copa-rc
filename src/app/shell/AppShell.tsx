import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { ProfileProvider } from '../providers/ProfileProvider';
import { ScenarioProvider } from '../providers/ScenarioProvider';
import { rememberProfile, type ProfileDefinition } from '../profiles';
import { BottomNav } from './BottomNav';
import { ChampionshipGate } from './ChampionshipGate';
import { ProfileSheet } from './ProfileSheet';
import { TopBar } from './TopBar';
import styles from './AppShell.module.css';

/**
 * Moldura comum a todos os perfis: barra superior, conteúdo e navegação.
 * O perfil define apenas a navegação e a persona; o restante é compartilhado.
 */
export function AppShell({ profile }: { profile: ProfileDefinition }) {
  const location = useLocation();
  const outlet = useOutlet();
  const contentRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => rememberProfile(profile), [profile]);

  // A cada navegação: volta ao topo e leva o foco ao conteúdo (leitores de tela
  // anunciam a nova tela; teclado continua de onde faz sentido).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    contentRef.current?.scrollTo({ top: 0 });
    contentRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <ProfileProvider profile={profile}>
      <ScenarioProvider profile={profile}>
      <div className={styles.app}>
        <a
          className={styles.skip}
          href="#conteudo"
          onClick={(event) => {
            event.preventDefault();
            contentRef.current?.focus();
          }}
        >
          Ir para o conteúdo
        </a>
        <TopBar profile={profile} onOpenProfiles={() => setSheetOpen(true)} />
        {/* layoutScroll: o Motion precisa saber que este contêiner rola, senão as
            animações de layout (indicadores dos seletores) saem do lugar. */}
        <motion.main ref={contentRef} id="conteudo" className={styles.content} tabIndex={-1} layoutScroll>
          <motion.div
            key={location.pathname}
            className={styles.page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <ChampionshipGate>{outlet}</ChampionshipGate>
          </motion.div>
        </motion.main>
        <BottomNav profile={profile} />
        <ProfileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} current={profile} />
      </div>
      </ScenarioProvider>
    </ProfileProvider>
  );
}
