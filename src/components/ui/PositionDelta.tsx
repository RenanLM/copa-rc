import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import styles from './PositionDelta.module.css';

interface PositionDeltaProps {
  /** Posições ganhas (+) ou perdidas (−) desde a etapa anterior; null = sem comparação. */
  change: number | null;
  /** Sem largura mínima: para uso dentro de frases. Em listas, mantém as colunas alinhadas. */
  inline?: boolean;
}

/** Variação de posição. A cor nunca é o único código: há ícone e texto para leitores. */
export function PositionDelta({ change, inline }: PositionDeltaProps) {
  const base = `${styles.delta} ${inline ? styles.inline : ''}`;
  if (change === null) {
    return (
      <span className={base}>
        <span aria-hidden="true">–</span>
        <span className="sr-only">Sem etapa anterior para comparar</span>
      </span>
    );
  }
  if (change === 0) {
    return (
      <span className={base}>
        <Minus size={14} aria-hidden="true" />
        <span className="sr-only">Posição mantida</span>
      </span>
    );
  }
  const up = change > 0;
  const n = Math.abs(change);
  return (
    <span className={`${base} ${up ? styles.up : styles.down} num`}>
      {up ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
      <span aria-hidden="true">{n}</span>
      <span className="sr-only">
        {up ? 'Subiu' : 'Caiu'} {n} {n === 1 ? 'posição' : 'posições'}
      </span>
    </span>
  );
}
