import { useId } from 'react';
import { summarizeTarget, type Predictor } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { STATUS_META, STATUS_ORDER } from './status';
import styles from './TargetPicker.module.css';

interface TargetPickerProps {
  predictor: Predictor;
  target: number;
  onChange: (target: number) => void;
}

/**
 * Escolha da posição desejada. Cada posição já mostra, no próprio botão, se ela é
 * garantida, condicional, só com empate ou impossível: dá para escolher vendo o
 * panorama inteiro (reconhecimento em vez de memorização).
 */
export function TargetPicker({ predictor, target, onChange }: TargetPickerProps) {
  const name = useId();
  const positions = Array.from({ length: predictor.fieldSize }, (_, i) => i + 1);

  return (
    <div>
      <div className={styles.grid} role="radiogroup" aria-label="Posição que você quer alcançar">
        {positions.map((position) => {
          const { status } = summarizeTarget(predictor.combos, position);
          const { Icon, className, description } = STATUS_META[status];
          const selected = position === target;
          const isCurrent = position === predictor.currentStanding.position;
          return (
            <label key={position} className={`${styles.chip} ${className} ${selected ? styles.selected : ''}`}>
              <input
                type="radio"
                name={name}
                value={position}
                checked={selected}
                onChange={() => onChange(position)}
                aria-label={`${formatOrdinal(position)} lugar: ${description}${isCurrent ? '. Sua posição atual' : ''}`}
              />
              {isCurrent && (
                <span className={styles.here} aria-hidden="true">
                  Hoje
                </span>
              )}
              <span className={`${styles.ordinal} num`} aria-hidden="true">
                {position}º
              </span>
              <Icon size={15} aria-hidden="true" />
            </label>
          );
        })}
      </div>
      <ul className={styles.legend} aria-label="Legenda dos estados">
        {STATUS_ORDER.map((status) => {
          const { Icon, className, label } = STATUS_META[status];
          return (
            <li key={status} className={styles.legendItem}>
              <span className={`${styles.swatch} ${className}`} aria-hidden="true">
                <Icon size={12} />
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
