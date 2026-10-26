import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Common {
  variant?: Variant;
  size?: 'default' | 'small';
  icon?: ReactNode;
}

function classes({ variant = 'secondary', size = 'default' }: Common, extra?: string) {
  return [
    styles.button,
    variant === 'primary' && styles.primary,
    variant === 'ghost' && styles.ghost,
    size === 'small' && styles.small,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant,
  size,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return (
    <button type={type} className={classes({ variant, size }, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: LinkProps & Common) {
  return (
    <Link className={classes({ variant, size }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
