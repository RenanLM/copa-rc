import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import type { ChampionshipModel, RaceHighlight } from '@/domain';
import { describeHighlight } from './highlights';
import styles from './RaceHighlights.module.css';

interface RaceHighlightsProps {
  model: ChampionshipModel;
  highlights: readonly RaceHighlight[];
}

/** Destaques da etapa em frases curtas: o que aconteceu de importante e por quê. */
export function RaceHighlights({ model, highlights }: RaceHighlightsProps) {
  const items = highlights.flatMap((h) => {
    const text = describeHighlight(model, h);
    return text ? [text] : [];
  });
  if (items.length === 0) return null;

  return (
    <Card aria-labelledby="highlights-title" role="region">
      <h2 className={styles.title} id="highlights-title">
        Destaques da etapa
      </h2>
      <ul className={styles.list}>
        {items.map(({ key, Icon, title, text }, index) => (
          <motion.li
            key={key}
            className={styles.item}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon size={18} />
            </span>
            <div>
              <p className={styles.itemTitle}>{title}</p>
              <p className={styles.itemText}>{text}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
