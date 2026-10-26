import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { initials } from '@/lib/format';
import { PROFILES, profilePath, type ProfileDefinition } from '../profiles';
import styles from './ProfileSheet.module.css';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  current: ProfileDefinition;
}

/** Seletor DEMONSTRATIVO de perfil. O protótipo não possui autenticação. */
export function ProfileSheet({ open, onClose, current }: ProfileSheetProps) {
  const navigate = useNavigate();

  return (
    <BottomSheet open={open} onClose={onClose} title="Quem está usando?">
      <p className={styles.intro}>
        Seletor apenas para demonstração: o protótipo não tem login. Cada perfil mostra o
        aplicativo do ponto de vista de uma pessoa diferente, com os mesmos dados.
      </p>
      <ul className={styles.list}>
        {PROFILES.map((profile) => {
          const isCurrent = profile.id === current.id;
          return (
            <li key={profile.id}>
              <button
                type="button"
                className={`${styles.option} ${isCurrent ? styles.current : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => {
                  onClose();
                  if (!isCurrent) navigate(profilePath(profile));
                }}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {initials(profile.persona.name)}
                </span>
                <span className={styles.info}>
                  <span className={styles.name}>{profile.persona.name}</span>
                  <span className={styles.role} style={{ display: 'block' }}>
                    {profile.roleLabel} · {profile.persona.age} anos
                  </span>
                  <span className={styles.role} style={{ display: 'block' }}>
                    {profile.persona.occupation}
                  </span>
                </span>
                {isCurrent && <Check className={styles.check} size={22} aria-label="Perfil atual" />}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
