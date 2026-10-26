import { useMemo, type CSSProperties } from 'react';
import { FlaskConical, Hourglass, WifiOff } from 'lucide-react';
import { useChampionshipLoader, useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { PilotLine } from '@/components/PilotLine';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PilotNumber } from '@/components/ui/PilotNumber';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StateViews';
import { getPilotSeasonSummary } from '@/domain';
import { setPendingSimulation } from '@/lib/demo-settings';
import { formatOrdinal } from '@/lib/format';
import styles from './PilotProfilePage.module.css';

export function PilotProfilePage() {
  const model = useModel();
  const profile = useProfile();
  const { reload } = useChampionshipLoader();
  const pilotId = profile.persona.pilotId;
  const { championship } = model;

  const summary = useMemo(
    () => (pilotId ? getPilotSeasonSummary(championship, pilotId) : null),
    [championship, pilotId],
  );

  if (!summary) {
    return <EmptyState heading="h1" title="Perfil indisponível" message="Não encontramos os dados deste piloto." />;
  }

  const { pilot, team, teammate, standing } = summary;
  const teammateStanding = teammate && model.standingByPilot.get(teammate.id);

  const simulate = (mode: 'error' | 'slow') => {
    setPendingSimulation(mode);
    reload();
  };

  return (
    <>
      <PageHeader eyebrow="Perfil" title="Meu perfil" />

      <Card tone="accent" telemetry>
        <div className={styles.identity} style={{ position: 'relative' }}>
          <PilotNumber number={pilot.number} color={team.color} size="large" />
          <div>
            <h2 className={styles.name}>{pilot.name}</h2>
            <p className={styles.meta}>
              {pilot.age} anos · {pilot.city}
            </p>
          </div>
        </div>
        <p className={styles.bio} style={{ position: 'relative' }}>
          {pilot.bio}
        </p>
      </Card>

      <ul className={styles.stats} aria-label="Resumo da temporada">
        <li className={styles.stat}>
          <span className={`${styles.statValue} num`} style={{ color: 'var(--accent)' }}>
            {formatOrdinal(standing.position)}
          </span>
          <span className={styles.statLabel}>Posição</span>
        </li>
        <li className={styles.stat}>
          <span className={`${styles.statValue} num`}>{standing.points}</span>
          <span className={styles.statLabel}>Pontos</span>
        </li>
        <li className={styles.stat}>
          <span className={`${styles.statValue} num`}>{standing.wins}</span>
          <span className={styles.statLabel}>Vitórias</span>
        </li>
        <li className={styles.stat}>
          <span className={`${styles.statValue} num`}>{standing.podiums}</span>
          <span className={styles.statLabel}>Pódios</span>
        </li>
      </ul>

      <Card as="section" aria-labelledby="team-title">
        <h2 className={styles.sectionTitle} id="team-title">
          Minha equipe
        </h2>
        <p className={styles.teamHead} style={{ '--team': team.color } as CSSProperties}>
          <span className={styles.swatch} aria-hidden="true" />
          {team.name} · {team.city}
        </p>
        <ul>
          <li className={styles.member}>
            <PilotLine pilot={pilot} team={team} sub="Você" />
            <span className={`${styles.memberPts} num`}>
              {standing.points}
              <span className="sr-only"> pontos</span>
            </span>
          </li>
          {teammate && (
            <li className={styles.member}>
              <PilotLine pilot={teammate} team={team} sub="Companheiro de equipe" />
              <span className={`${styles.memberPts} num`}>
                {teammateStanding?.points ?? 0}
                <span className="sr-only"> pontos</span>
              </span>
            </li>
          )}
        </ul>
      </Card>

      <Card as="section" aria-labelledby="demo-title">
        <h2 className={styles.sectionTitle} id="demo-title">
          Sobre este protótipo
        </h2>
        <div className={styles.paragraphs}>
          <p>
            <Badge tone="data">
              <FlaskConical size={11} aria-hidden="true" /> Demonstração
            </Badge>
          </p>
          <p>
            Pilotos, equipes, pistas, datas e tempos são fictícios e foram criados apenas para
            demonstrar o aplicativo. Nada aqui representa uma transmissão ao vivo.
          </p>
          <p>
            Todas as telas leem os mesmos dados, então a classificação é sempre a mesma em qualquer
            lugar do aplicativo.
          </p>
        </div>
        <div className={styles.actions}>
          <p className={styles.sectionTitle} style={{ margin: 0 }}>
            Avaliação de estados do sistema
          </p>
          <Button icon={<WifiOff size={18} aria-hidden="true" />} onClick={() => simulate('error')}>
            Simular falha ao carregar
          </Button>
          <Button icon={<Hourglass size={18} aria-hidden="true" />} onClick={() => simulate('slow')}>
            Simular carregamento lento
          </Button>
        </div>
      </Card>
    </>
  );
}
