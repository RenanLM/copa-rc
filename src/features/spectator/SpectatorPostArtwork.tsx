import type { CSSProperties } from 'react';
import type { PostKind, Team } from '@/domain';
import { POST_KINDS } from './spectator-content';
import styles from './SpectatorPostArtwork.module.css';

/**
 * Ilustração de uma publicação de demonstração. Não é foto de ninguém: o texto
 * alternativo vem do dado e o selo "Arte demonstrativa" fica sempre visível.
 */
export function SpectatorPostArtwork({
  team,
  description,
  kind,
}: {
  team: Team;
  description: string;
  kind: PostKind;
}) {
  const { icon: Icon } = POST_KINDS[kind];
  return (
    <div
      className={styles.artwork}
      style={{ '--team': team.color } as CSSProperties}
      role="img"
      aria-label={`Ilustração demonstrativa: ${description}`}
    >
      <svg viewBox="0 0 360 180" aria-hidden="true" focusable="false">
        <path className={styles.trackOuter} d="M-20 142 C38 142 30 48 104 48 H252 C326 48 330 138 390 138" />
        <path className={styles.trackInner} d="M-20 142 C38 142 30 48 104 48 H252 C326 48 330 138 390 138" />
        <path className={styles.trackLine} d="M-20 142 C38 142 30 48 104 48 H252 C326 48 330 138 390 138" />
        <g className={styles.car} transform="translate(202 38) rotate(2)">
          <rect x="7" y="15" width="79" height="32" rx="13" />
          <path d="M24 15 34 3h26l14 12Z" />
          <rect x="22" y="9" width="34" height="11" rx="5" className={styles.window} />
          <circle cx="25" cy="48" r="8" className={styles.wheel} />
          <circle cx="69" cy="48" r="8" className={styles.wheel} />
          <text x="48" y="37" textAnchor="middle">#{team.shortName}</text>
        </g>
      </svg>
      <span className={styles.emblem} aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className={styles.artLabel}>Arte demonstrativa</span>
    </div>
  );
}
