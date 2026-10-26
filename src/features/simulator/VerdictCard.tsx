import { motion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Predictor } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { STATUS_META, StatusBadge } from './status';
import { buildVerdict } from './verdict';
import styles from './VerdictCard.module.css';

interface VerdictCardProps {
  predictor: Predictor;
  target: number;
}

/** Resposta direta: dá para chegar lá? Estado, justificativa e melhor/pior caso. */
export function VerdictCard({ predictor, target }: VerdictCardProps) {
  const verdict = buildVerdict(predictor, target);
  const meta = STATUS_META[verdict.status];
  const projection = predictor.horizon === 'next';

  return (
    <motion.div
      key={`${verdict.status}-${target}-${predictor.horizon}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Card className={`${styles.card} ${meta.className}`} aria-labelledby="verdict-title" role="region" aria-live="polite">
        <div className={styles.head}>
          <h2 className={styles.title} id="verdict-title">
            {formatOrdinal(target)} lugar
          </h2>
          <StatusBadge status={verdict.status} />
        </div>
        <p className={styles.summary}>
          <span className="sr-only">Resultado da análise: {meta.description}. </span>
          {verdict.summary}
        </p>
        <div className={styles.details}>
          {verdict.details.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className={styles.range}>
          <div>
            <p className={styles.rangeLabel}>Melhor posição</p>
            <p className={`${styles.rangeValue} num`}>{formatOrdinal(verdict.stats.bestRank)}</p>
          </div>
          <div>
            <p className={styles.rangeLabel}>Pior posição</p>
            <p className={`${styles.rangeValue} num`}>{formatOrdinal(verdict.stats.worstRank)}</p>
          </div>
        </div>
        {projection && (
          <p style={{ marginTop: 12 }}>
            <Badge tone="data">Projeção · ainda restam etapas</Badge>
          </p>
        )}
      </Card>
    </motion.div>
  );
}
