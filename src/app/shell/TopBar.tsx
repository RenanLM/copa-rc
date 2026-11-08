import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useChampionshipLoader } from '../providers/ChampionshipProvider';
import { useTheme } from '../providers/ThemeProvider';
import type { ProfileDefinition } from '../profiles';
import { initials } from '@/lib/format';
import styles from './TopBar.module.css';

interface TopBarProps {
  profile: ProfileDefinition;
  onOpenProfiles: () => void;
}

export function TopBar({ profile, onOpenProfiles }: TopBarProps) {
  const { state } = useChampionshipLoader();
  const { theme, toggleTheme } = useTheme();
  const isDemo = state.status === 'ready' ? state.model.championship.source === 'demo' : true;
  const first = profile.persona.name.split(' ')[0];

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <svg className={styles.mark} width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="var(--surface)" />
          <path d="M12 44 L26 20 H52 L46 30 H34 L30 38 H42 L36 48 H16 Z" fill="var(--nav-active)" />
        </svg>
        <span className={styles.wordmark}>
          RC <span>Championship</span>
        </span>
        {isDemo && (
          <span
            className={styles.demo}
            title="Pessoas, equipes, resultados e datas são fictícios."
            aria-label="Dados de demonstração: pessoas, equipes, resultados e datas são fictícios"
          >
            Demo
          </span>
        )}
      </div>
      <button
        type="button"
        className={styles.theme}
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      >
        {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={styles.profile}
        onClick={onOpenProfiles}
        aria-haspopup="dialog"
        aria-label={`Perfil de demonstração: ${profile.persona.name}, ${profile.roleLabel}. Trocar perfil`}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials(profile.persona.name)}
        </span>
        <span className={styles.profileName} aria-hidden="true">
          {first}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </header>
  );
}
