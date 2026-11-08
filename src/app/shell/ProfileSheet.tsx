import { Check } from 'lucide-react';
import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DEMO_SCENARIOS } from '@/data/demo/scenarios';
import { initials } from '@/lib/format';
import { useScenario } from '../providers/ScenarioProvider';
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
  const scenarioName = useId();
  const { scenario, choice, setChoice, selectable } = useScenario();
  const labelOf = (id: string) => DEMO_SCENARIOS.find((s) => s.id === id)?.label ?? id;

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

      {selectable && (
        <section className={styles.moment} aria-labelledby="moment-title">
          <h3 className={styles.momentTitle} id="moment-title">
            Momento do campeonato
          </h3>
          <p className={styles.intro}>
            Escolha até onde a temporada já aconteceu. Piloto e espectadora veem o mesmo momento, com os mesmos
            números.
          </p>
          <div className={styles.moments} role="radiogroup" aria-label="Momento do campeonato">
            {[
              {
                value: 'auto' as const,
                title: 'Padrão do perfil',
                text: `Agora: ${labelOf(scenario)}. O piloto começa após a etapa 3; a espectadora, com a etapa 4 em andamento.`,
              },
              ...DEMO_SCENARIOS.map((s) => ({ value: s.id, title: s.label, text: s.description })),
            ].map((option) => {
              const on = choice === option.value;
              return (
                <label key={option.value} className={`${styles.momentOption} ${on ? styles.momentOn : ''}`}>
                  <input
                    type="radio"
                    name={scenarioName}
                    value={option.value}
                    checked={on}
                    onChange={() => setChoice(option.value)}
                  />
                  <span className={styles.momentRadio} aria-hidden="true" />
                  <span>
                    <span className={styles.name}>{option.title}</span>
                    <span className={styles.role} style={{ display: 'block' }}>
                      {option.text}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      )}
    </BottomSheet>
  );
}
