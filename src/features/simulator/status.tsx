import { Ban, CircleDashed, Equal, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { OutcomeStatus } from '@/domain';
import styles from './status.module.css';

interface StatusMeta {
  /** Rótulo curto, usado em selos e legendas. */
  label: string;
  /** Frase completa, usada por leitores de tela. */
  description: string;
  Icon: LucideIcon;
  className: string;
}

export const STATUS_META: Record<OutcomeStatus, StatusMeta> = {
  guaranteed: {
    label: 'Garantida',
    description: 'garantida, comprovada matematicamente',
    Icon: ShieldCheck,
    className: styles.guaranteed!,
  },
  possible: {
    label: 'Condicional',
    description: 'possível, mas depende dos resultados dos adversários',
    Icon: CircleDashed,
    className: styles.possible!,
  },
  'tie-only': {
    label: 'Só com empate',
    description: 'só possível com empate em pontos, e o desempate é indefinido',
    Icon: Equal,
    className: styles.tieOnly!,
  },
  impossible: {
    label: 'Impossível',
    description: 'matematicamente impossível',
    Icon: Ban,
    className: styles.impossible!,
  },
};

export const STATUS_ORDER: readonly OutcomeStatus[] = ['guaranteed', 'possible', 'tie-only', 'impossible'];

export function StatusBadge({ status }: { status: OutcomeStatus }) {
  const { label, Icon, className } = STATUS_META[status];
  return (
    <span className={`${styles.badge} ${className}`}>
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}
