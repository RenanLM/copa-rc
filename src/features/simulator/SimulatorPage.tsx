import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import {
  assignSlot,
  buildPredictor,
  cheapestViableCombo,
  findCombo,
  placePilot,
  projectStandings,
  scenarioFromPreset,
  type Horizon,
  type PilotId,
  type RivalPreset,
} from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { ProjectedStandings } from './ProjectedStandings';
import { RequirementsGrid } from './RequirementsGrid';
import { ScenarioPanel, type PresetChoice } from './ScenarioPanel';
import { STATUS_META, STATUS_ORDER } from './status';
import { TargetPicker } from './TargetPicker';
import { VerdictCard } from './VerdictCard';
import styles from './SimulatorPage.module.css';

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={`step-${n}`}>
      <div className={styles.step}>
        <span className={styles.stepNumber} aria-hidden="true">
          {n}
        </span>
        <h2 className={styles.stepTitle} id={`step-${n}`}>
          {title}
        </h2>
      </div>
      {children}
    </Card>
  );
}

const PRESET_LABEL: Record<PresetChoice, string> = {
  favorable: 'Mais favorável a você',
  hard: 'Mais difícil para você',
  repeat: 'Rivais repetem a última etapa (ilustrativo)',
  custom: 'Personalizado',
};

/** Race Predictor: escolher a posição, ver se é possível e o que precisa acontecer. */
export function SimulatorPage() {
  const model = useModel();
  const profile = useProfile();
  const { championship } = model;
  const pilotId = profile.persona.pilotId;

  const [horizon, setHorizon] = useState<Horizon>('final');
  const [target, setTarget] = useState<number | null>(null);
  const [chosen, setChosen] = useState<number[] | null>(null);
  const [preset, setPreset] = useState<RivalPreset>('favorable');
  const [custom, setCustom] = useState<PilotId[][] | null>(null);

  const result = useMemo(
    () => (pilotId ? buildPredictor(championship, pilotId, horizon) : ({ ok: false, reason: 'unknown-pilot' } as const)),
    [championship, pilotId, horizon],
  );

  if (!result.ok) {
    const message =
      result.reason === 'no-remaining-races'
        ? 'O campeonato já terminou: não há mais etapas para simular.'
        : result.reason === 'too-many-races'
          ? 'Ainda restam etapas demais para a análise exata. Ela fica disponível mais adiante na temporada.'
          : 'Não encontramos os dados deste piloto.';
    return (
      <>
        <PageHeader title="Simulador" />
        <EmptyState
          title="Simulador indisponível"
          message={message}
          action={
            <LinkButton to={profilePath(profile)} variant="primary">
              Ir para o início
            </LinkButton>
          }
        />
      </>
    );
  }

  const { predictor } = result;
  const current = predictor.currentStanding.position;
  const activeTarget = target ?? Math.max(1, current - 1);
  const combo = (chosen && findCombo(predictor, chosen)) || cheapestViableCombo(predictor, activeTarget);
  const rivalOrder = predictor.rivalIds;
  const lastRound = model.lastFinishedRound;

  const presetScenario = scenarioFromPreset(predictor, combo, preset, activeTarget);
  const podiums = custom ?? presetScenario.outcomes.map((o) => [...o.podium]);
  const scenario = { outcomes: predictor.races.map((race, i) => ({ raceId: race.id, podium: podiums[i] ?? [] })) };
  const standings = projectStandings(championship, scenario);
  const presetChoice: PresetChoice = custom ? 'custom' : preset;

  const remainingCount = championship.races.filter((r) => r.status !== 'finished').length;
  const nextRound = championship.races.find((r) => r.status !== 'finished')?.round;

  const resetScenario = () => {
    setChosen(null);
    setCustom(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="Race Predictor"
        title="Simulador"
        subtitle="Escolha a posição que quer alcançar e veja se é possível, o que precisa acontecer e como ficaria a classificação."
      />

      <Step n={1} title="Posição que você quer">
        {remainingCount > 1 && (
          <SegmentedControl<Horizon>
            label="Até quando simular"
            value={horizon}
            onChange={(h) => {
              setHorizon(h);
              resetScenario();
            }}
            options={[
              { value: 'next', label: `Após a etapa ${nextRound}` },
              { value: 'final', label: 'Fim do campeonato' },
            ]}
          />
        )}
        <p className={styles.context}>
          Hoje você está em <strong>{formatOrdinal(current)}</strong> com <strong>{predictor.currentStanding.points} pts</strong>.{' '}
          {horizon === 'next'
            ? `Simulando só a etapa ${nextRound}: é uma projeção, ainda restará${remainingCount - 1 === 1 ? '' : 'm'} ${remainingCount - 1} ${remainingCount - 1 === 1 ? 'etapa' : 'etapas'}.`
            : `Restam ${remainingCount} ${remainingCount === 1 ? 'etapa' : 'etapas'} para o fim do campeonato.`}
        </p>
        <TargetPicker
          predictor={predictor}
          target={activeTarget}
          onChange={(t) => {
            setTarget(t);
            resetScenario();
          }}
        />
      </Step>

      <VerdictCard predictor={predictor} target={activeTarget} />

      <Step n={2} title="Seus resultados">
        <RequirementsGrid
          predictor={predictor}
          target={activeTarget}
          placings={combo.placings}
          onChange={(placings) => {
            setChosen(placings);
            if (custom) {
              setCustom(
                custom.map((podium, i) => placePilot(podium, predictor.pilot.id, placings[i]!, predictor.slots, rivalOrder)),
              );
            }
          }}
        />
      </Step>

      <Step n={3} title="Os adversários">
        <ScenarioPanel
          predictor={predictor}
          preset={presetChoice}
          onPreset={(p) => {
            setPreset(p);
            setCustom(null);
          }}
          podiums={podiums}
          onEditSlot={(raceIndex, placing, id) =>
            setCustom(podiums.map((podium, i) => (i === raceIndex ? assignSlot(podium, placing, id) : [...podium])))
          }
          lastRound={lastRound}
        />
      </Step>

      <ProjectedStandings
        model={model}
        predictor={predictor}
        standings={standings}
        focusPilotId={predictor.pilot.id}
        scenarioLabel={PRESET_LABEL[presetChoice]}
      />

      <Card>
        <details className={styles.how}>
          <summary>
            Como calculamos
            <ChevronDown size={20} aria-hidden="true" />
          </summary>
          <div className={styles.howBody}>
            <p>
              Não usamos palpites nem percentuais. O simulador examina <strong>todas</strong> as formas possíveis de as etapas
              restantes terminarem (só as {predictor.slots} primeiras posições pontuam) e conclui, com certeza matemática:
            </p>
            <ul className={styles.howList}>
              {STATUS_ORDER.map((status) => {
                const { Icon, label } = STATUS_META[status];
                const text: Record<typeof status, string> = {
                  guaranteed: 'vale em todos os resultados possíveis, mesmo perdendo todos os empates.',
                  possible: 'existe um resultado que leva até lá, mas depende de como os adversários pontuam.',
                  'tie-only': 'só acontece empatando em pontos. O regulamento não define o desempate, então não contamos como conquista.',
                  impossible: 'nem o melhor cenário possível chega lá.',
                };
                return (
                  <li key={status}>
                    <Icon size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
                    <span>
                      <strong>{label}:</strong> {text[status]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p>
              <strong>Projeção não é resultado final.</strong> Simular só a próxima etapa mostra como a classificação ficaria
              logo depois dela, com etapas ainda por disputar.
            </p>
            <p>Este simulador não estima chances nem diz o que é mais provável.</p>
          </div>
        </details>
      </Card>
    </>
  );
}
