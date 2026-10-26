import { useId, useMemo, useState } from 'react';
import { Activity, Waves } from 'lucide-react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { LinkButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/StateViews';
import { getPilotPerformance, getPilotSeasonSummary, maxPointsPerRace } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { SERIES_COLOR } from './chart-parts';
import { EvolutionChart } from './EvolutionChart';
import { HeatMatrix } from './HeatMatrix';
import { StageComparison } from './StageComparison';
import styles from './PerformancePage.module.css';

/** Análise de desempenho do piloto: evolução, comparativo entre etapas e baterias. */
export function PerformancePage() {
  const model = useModel();
  const profile = useProfile();
  const selectId = useId();
  const { championship } = model;
  const pilotId = profile.persona.pilotId;
  const home = profilePath(profile);
  const [compareId, setCompareId] = useState('');

  const mine = useMemo(
    () => (pilotId ? { summary: getPilotSeasonSummary(championship, pilotId), performance: getPilotPerformance(championship, pilotId) } : null),
    [championship, pilotId],
  );
  const other = useMemo(
    () =>
      compareId
        ? { summary: getPilotSeasonSummary(championship, compareId), performance: getPilotPerformance(championship, compareId) }
        : null,
    [championship, compareId],
  );

  if (!mine?.summary) {
    return (
      <EmptyState
        heading="h1"
        title="Desempenho indisponível"
        message="Não encontramos os dados deste piloto."
        action={
          <LinkButton to={home} variant="primary">
            Ir para o início
          </LinkButton>
        }
      />
    );
  }
  if (mine.performance.length === 0) {
    return (
      <>
        <PageHeader back={{ to: home, label: 'Início' }} title="Desempenho" />
        <EmptyState icon={Activity} title="Ainda sem dados" message="A análise aparece depois da primeira etapa disputada." />
      </>
    );
  }

  const { summary, performance } = mine;
  const last = performance.at(-1)!;
  const rounds = performance.length;
  const fieldSize = model.pilotStandings.length;

  const meInfo = { key: 'me', name: summary.pilot.name, color: SERIES_COLOR.me };
  const otherInfo =
    other?.summary ? { key: 'other', name: other.summary.pilot.name, color: SERIES_COLOR.other } : null;

  const evolutionSeries = [
    { info: meInfo, points: summary.evolution },
    ...(otherInfo && other?.summary ? [{ info: otherInfo, points: other.summary.evolution }] : []),
  ];
  const performanceSeries = [
    { info: meInfo, performance },
    ...(otherInfo && other ? [{ info: otherInfo, performance: other.performance }] : []),
  ];

  const rivals = model.pilotStandings.filter((s) => s.pilotId !== pilotId);

  return (
    <>
      <PageHeader
        back={{ to: home, label: 'Início' }}
        eyebrow="Análise"
        title="Desempenho"
        subtitle={`${rounds} ${rounds === 1 ? 'etapa disputada' : 'etapas disputadas'} · dados de demonstração`}
      />

      <div className={styles.tiles}>
        <StatTile
          label="Ritmo"
          icon={<Activity size={14} aria-hidden="true" />}
          tone="data"
          value={<span className="num">{last.paceRelative !== null ? `${last.paceRelative.toFixed(1)}%` : '—'}</span>}
          caption={`do ritmo médio do vencedor na etapa ${last.race.round}`}
        />
        <StatTile
          label="Regularidade"
          icon={<Waves size={14} aria-hidden="true" />}
          value={<span className="num">{last.consistencyPct !== null ? `±${last.consistencyPct.toFixed(1)}%` : '—'}</span>}
          caption={`variação entre suas voltas na etapa ${last.race.round} (menor = mais regular)`}
        />
      </div>

      <div className={styles.filter}>
        <label className={styles.filterLabel} htmlFor={selectId}>
          Comparar com
        </label>
        <select id={selectId} className={styles.select} value={compareId} onChange={(event) => setCompareId(event.target.value)}>
          <option value="">Ninguém</option>
          {rivals.map((s) => (
            <option key={s.pilotId} value={s.pilotId}>
              {formatOrdinal(s.position)} · {model.pilotsById.get(s.pilotId)?.name}
            </option>
          ))}
        </select>
        <span className={styles.filterHint}>Vale para os gráficos de evolução e de etapas.</span>
      </div>

      <EvolutionChart series={evolutionSeries} fieldSize={fieldSize} />
      <StageComparison series={performanceSeries} maxRacePoints={maxPointsPerRace(championship.rules)} />
      <HeatMatrix performance={performance} />
    </>
  );
}
