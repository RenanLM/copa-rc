import { useId, type CSSProperties } from 'react';
import styles from './SegmentedControl.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Nome acessível do grupo (ex.: "Tipo de classificação"). */
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Alternância entre visões irmãs. Usa radios nativos: as setas do teclado funcionam.
 * O indicador é posicionado por CSS (índice × largura): não depende de medir o
 * layout, então continua correto mesmo se o conteúdo acima mudar de altura.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));

  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      <div
        className={styles.track}
        style={{ '--n': options.length, '--i': activeIndex } as CSSProperties}
      >
        <span className={styles.indicator} aria-hidden="true" />
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label key={option.value} className={`${styles.option} ${active ? styles.active : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
              />
              <span className={styles.text}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
