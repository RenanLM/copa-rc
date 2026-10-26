import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  tone?: 'default' | 'accent' | 'data';
  /** Remove o espaçamento interno (para listas que ocupam toda a largura). */
  flush?: boolean;
  telemetry?: boolean;
}

export function Card({
  as: Tag = 'section',
  tone = 'default',
  flush,
  telemetry,
  className,
  ...rest
}: CardProps) {
  const cls = [
    styles.card,
    tone !== 'default' && styles[tone],
    flush && styles.flush,
    telemetry && styles.telemetry,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={cls} {...rest} />;
}
