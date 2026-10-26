import type { CSSProperties, ReactNode } from 'react';
import type { Pilot, Team } from '@/domain';
import { PilotNumber } from './ui/PilotNumber';
import styles from './PilotLine.module.css';

interface PilotLineProps {
  pilot: Pilot;
  team: Team;
  /** Substitui o nome da equipe na segunda linha. */
  sub?: ReactNode;
}

/** Identificação padrão de piloto: número, nome e equipe. Igual em todas as telas. */
export function PilotLine({ pilot, team, sub }: PilotLineProps) {
  return (
    <span className={styles.line} style={{ '--team': team.color } as CSSProperties}>
      <PilotNumber number={pilot.number} color={team.color} />
      <span className={styles.text}>
        <span className={styles.name}>{pilot.name}</span>
        <span className={styles.sub}>
          {sub ?? (
            <>
              <span className={styles.dot} aria-hidden="true" />
              {team.name}
            </>
          )}
        </span>
      </span>
    </span>
  );
}
