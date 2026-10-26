import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  hint?: ReactNode;
  action?: { label: string; to: string };
  id?: string;
}

export function SectionHeader({ title, hint, action, id }: SectionHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h2 className={styles.title} id={id}>
          {title}
        </h2>
        {hint && <p className={styles.hint}>{hint}</p>}
      </div>
      {action && (
        <Link to={action.to} className={styles.action}>
          {action.label}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
