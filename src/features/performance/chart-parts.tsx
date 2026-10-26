import type { CSSProperties, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './chart-parts.module.css';

/** Uma série de um gráfico. A cor segue a entidade, nunca a posição na lista. */
export interface SeriesInfo {
  key: string;
  name: string;
  color: string;
}

/** Cores fixas: o piloto em foco é sempre o destaque; o comparado, sempre a cor de dados. */
export const SERIES_COLOR = { me: 'var(--accent)', other: 'var(--data)' } as const;

/** Legenda com chave de linha. Só aparece com 2 ou mais séries (com 1, o título já a nomeia). */
export function ChartLegend({ series }: { series: readonly SeriesInfo[] }) {
  if (series.length < 2) return null;
  return (
    <ul className={styles.legend} aria-label="Legenda">
      {series.map((s) => (
        <li key={s.key} className={styles.legendItem}>
          <span className={styles.key} style={{ '--key': s.color } as CSSProperties} aria-hidden="true" />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

export function ChartTitle({ title, subtitle, id }: { title: string; subtitle?: ReactNode; id: string }) {
  return (
    <div className={styles.chartTitle}>
      <h2 id={id}>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

interface DataTableProps {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly ReactNode[])[];
}

/** Tabela equivalente ao gráfico: todo valor mostrado no desenho também existe aqui. */
export function DataTable({ caption, headers, rows }: DataTableProps) {
  return (
    <details className={styles.tableWrap}>
      <summary>
        Ver dados em tabela
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" style={{ color: 'var(--text)', textTransform: 'none', letterSpacing: 0, fontSize: 'inherit' }}>
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="num">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export { styles as chartStyles };
