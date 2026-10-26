import type { ReactNode } from 'react';
import { Card } from './Card';
import styles from './StatTile.module.css';

interface StatTileProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: ReactNode;
  /** `data` colore o valor com a cor de telemetria. */
  tone?: 'default' | 'data';
}

/** Indicador numérico com rótulo e legenda. Base dos painéis de desempenho. */
export function StatTile({ label, value, caption, icon, tone = 'default' }: StatTileProps) {
  return (
    <Card as="div" className={`${styles.tile} ${tone === 'data' ? styles.data : ''}`}>
      <p className={styles.label}>
        {icon}
        {label}
      </p>
      <p className={styles.value}>{value}</p>
      {caption && <p className={styles.caption}>{caption}</p>}
    </Card>
  );
}
