import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'outline' | 'soft' | 'accent' | 'data' | 'alert';
}

export function Badge({ tone = 'outline', className, ...rest }: BadgeProps) {
  const cls = [styles.badge, tone !== 'outline' && styles[tone], className]
    .filter(Boolean)
    .join(' ');
  return <span className={cls} {...rest} />;
}
