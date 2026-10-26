import { ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ChampionshipRules } from '@/domain';
import styles from './StandingsPage.module.css';

/** Explica a pontuação em linguagem simples, lida das regras oficiais (não duplicada). */
export function ScoringLegend({ rules }: { rules: ChampionshipRules }) {
  const scoring = rules.pointsByPosition;
  return (
    <Card>
      <details className={styles.rules}>
        <summary>
          Como funciona a pontuação
          <ChevronDown size={20} aria-hidden="true" />
        </summary>
        <div className={styles.rulesBody}>
          <p>
            O campeonato tem {rules.totalRaces} etapas. Em cada uma, os pilotos ganham pontos conforme a
            colocação final:
          </p>
          <ol className={styles.scale} aria-label="Pontos por colocação">
            {scoring.map((points, index) => (
              <li key={index} className={styles.scaleItem}>
                <span>{index + 1}º</span>
                <span className="num">{points}</span>
              </li>
            ))}
          </ol>
          <p>Do {scoring.length + 1}º lugar em diante, a etapa vale 0 ponto.</p>
          <p>
            Cada equipe tem {rules.pilotsPerTeam} pilotos. Os pontos da equipe são a soma dos pontos
            dos dois.
          </p>
        </div>
      </details>
    </Card>
  );
}
