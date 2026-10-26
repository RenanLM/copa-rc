import { motion } from 'motion/react';
import styles from './SeasonProgress.module.css';

interface SeasonProgressProps {
  completed: number;
  total: number;
}

/** Faixa com uma barra por etapa: preenchida = concluída; contorno = próxima. */
export function SeasonProgress({ completed, total }: SeasonProgressProps) {
  return (
    <div className={styles.wrap} role="img" aria-label={`${completed} de ${total} etapas concluídas`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`${styles.pip} ${i === completed ? styles.next : ''}`}>
          {i < completed && (
            <motion.span
              className={styles.fill}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.15 * i, ease: [0.2, 0.7, 0.2, 1] }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
