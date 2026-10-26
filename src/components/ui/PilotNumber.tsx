import type { CSSProperties } from 'react';
import styles from './PilotNumber.module.css';

interface PilotNumberProps {
  number: number;
  /** Cor da equipe. */
  color: string;
  size?: 'default' | 'large';
}

/** Placa com o número do carro na cor da equipe. */
export function PilotNumber({ number, color, size = 'default' }: PilotNumberProps) {
  return (
    <span
      className={`${styles.plate} ${size === 'large' ? styles.large : ''} num`}
      style={{ '--team': color } as CSSProperties}
      role="img"
      aria-label={`Carro número ${number}`}
    >
      <span aria-hidden="true">{number}</span>
    </span>
  );
}
