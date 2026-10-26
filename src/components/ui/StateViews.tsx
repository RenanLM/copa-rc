import type { ReactNode } from 'react';
import { RefreshCw, SearchX, TriangleAlert, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import styles from './StateViews.module.css';

/** Carregamento com esqueleto do layout. Anunciado a leitores de tela. */
export function LoadingState({ label = 'Carregando dados do campeonato…' }: { label?: string }) {
  return (
    <div className={styles.skeletonPage} role="status" aria-live="polite">
      <div className={styles.skeleton} style={{ height: 210 }} />
      <div className={styles.skeleton} style={{ height: 120 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className={styles.skeleton} style={{ height: 96 }} />
        <div className={styles.skeleton} style={{ height: 96 }} />
      </div>
      <div className={styles.skeleton} style={{ height: 140 }} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  details?: readonly string[];
  onRetry?: () => void;
}

/** Erro recuperável: diz o que houve, tranquiliza e oferece a próxima ação. */
export function ErrorState({
  title = 'Não foi possível carregar',
  message = 'Verifique sua conexão e tente novamente. Nenhuma informação foi perdida.',
  details,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <span className={`${styles.icon} ${styles.iconAlert}`}>
        <TriangleAlert size={26} aria-hidden="true" />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="primary" icon={<RefreshCw size={18} aria-hidden="true" />} onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
      {details && details.length > 0 && (
        <details className={styles.details}>
          <summary>Detalhes técnicos</summary>
          <ul>
            {details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  /** Use "h1" quando o estado ocupa a página inteira (ex.: rota inexistente). */
  heading?: 'h1' | 'h2';
}

/** Dado indisponível ou funcionalidade ainda não liberada. */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  message,
  action,
  heading: Heading = 'h2',
}: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.icon}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      {message && <p className={styles.message}>{message}</p>}
      {action}
    </div>
  );
}
