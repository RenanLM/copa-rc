import { ArrowRight, Flag, Radio, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatLongDate } from '@/lib/format';
import styles from './SpectatorHomePage.module.css';

export function SpectatorHomePage() {
  const model = useModel();
  const { championship } = model;
  const liveRace = championship.races.find((race) => race.status === 'live');
  const nextRace = championship.races
    .filter((race) => race.status === 'scheduled')
    .sort((a, b) => a.round - b.round)[0];
  const simulationRace = championship.races.find((race) => race.round === 4);
  const latestRace = championship.races
    .filter((race) => race.status === 'finished')
    .sort((a, b) => b.round - a.round)[0];
  const focusRace = liveRace ?? simulationRace ?? nextRace ?? latestRace;
  const isSimulation = !liveRace && focusRace?.round === 4;
  const track = focusRace && model.tracksById.get(focusRace.trackId);
  const leaders = model.teamStandings.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={`Guia do campeonato · Temporada ${championship.season}`}
        title="A corrida, mais fácil de acompanhar"
        subtitle="Encontre quem está na frente, reconheça as equipes e veja o que acontece em cada etapa."
      />

      <Card as="article" className={styles.hero}>
        <div className={styles.heroHeading}>
          <span className={styles.heroIcon} aria-hidden="true">
            {liveRace ? <Radio size={20} /> : <Flag size={20} />}
          </span>
          <div>
            <p className={styles.eyebrow}>
              {liveRace
                ? 'Etapa em andamento'
                : isSimulation
                  ? 'Ao vivo · simulação'
                  : nextRace
                    ? 'Próxima etapa'
                    : 'Última etapa'}
            </p>
            <h2>{focusRace?.name ?? 'Calendário indisponível'}</h2>
          </div>
        </div>
        {focusRace && (
          <p className={styles.raceMeta}>
            Etapa {focusRace.round} de {championship.rules.totalRaces}
            {track ? ` · ${track.name}` : ''}
            {isSimulation ? ' · Demonstração' : ` · ${formatLongDate(focusRace.date)}`}
          </p>
        )}
        <p className={styles.honesty}>
          {isSimulation
            ? 'A corrida está simulada para esta demonstração; não há dados reais ao vivo.'
            : 'Agenda e resultados são demonstrativos. Esta versão ainda não recebe dados ao vivo.'}
        </p>
        <Link className={styles.primaryLink} to="/espectadora/ao-vivo">
          {isSimulation ? 'Acompanhar corrida' : 'Abrir guia da corrida'} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </Card>

      <section className={styles.section} aria-labelledby="quick-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Acesso rápido</p>
            <h2 id="quick-title">O que você quer ver?</h2>
          </div>
        </div>
        <div className={styles.quickLinks}>
          <Link className={styles.quickLink} to="/espectadora/classificacao">
            <Trophy size={20} aria-hidden="true" />
            <span><strong>Quem lidera</strong><small>Classificação de pilotos e equipes</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={styles.quickLink} to="/espectadora/feed">
            <span className={styles.feedMark} aria-hidden="true">F</span>
            <span><strong>Novidades das equipes</strong><small>Publicações ilustrativas do campeonato</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={styles.quickLink} to="/espectadora/pilotos-equipes">
            <span className={styles.peopleMark} aria-hidden="true">#</span>
            <span><strong>Quem está na pista</strong><small>Encontre pilotos e suas equipes</small></span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Card as="section" aria-labelledby="leaders-title" className={styles.leadersCard}>
        <div className={styles.leadersHeading}>
          <Trophy size={19} aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>Disputa entre equipes</p>
            <h2 id="leaders-title">Quem está na frente?</h2>
          </div>
        </div>
        {leaders.length > 0 ? (
          <ol className={styles.leaders}>
            {leaders.map((standing) => {
              const team = model.teamsById.get(standing.teamId);
              if (!team) return null;
              return (
                <li key={team.id} className={styles.leaderRow}>
                  <span className={styles.rank}>{standing.position}º</span>
                  <span className={styles.teamDot} style={{ backgroundColor: team.color }} aria-hidden="true" />
                  <span className={styles.teamName}>{team.name}</span>
                  <strong className="num">{standing.points} pts</strong>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className={styles.empty}>A classificação aparece após a primeira etapa finalizada.</p>
        )}
        <p className={styles.helper}>Os pontos da equipe somam os resultados dos seus dois pilotos.</p>
        <Link className={styles.textLink} to="/espectadora/classificacao">
          Ver classificação completa <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Card>
    </>
  );
}
