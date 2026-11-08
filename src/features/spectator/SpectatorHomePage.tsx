import { ArrowRight, CalendarDays, Flag, MapPin, Medal, Radio, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { finishedRaces, getRaceImpact, maxPointsPerRace, nextRace, type Race, type RaceStatus } from '@/domain';
import { daysBetween, formatCountdown, formatLongDate, formatOrdinal } from '@/lib/format';
import styles from './SpectatorHomePage.module.css';

const STATUS: Record<RaceStatus, { label: string; tone: 'outline' | 'data' | 'accent' }> = {
  scheduled: { label: 'Agendada', tone: 'outline' },
  live: { label: 'Em andamento', tone: 'data' },
  finished: { label: 'Finalizada', tone: 'accent' },
};

/** Etapa finalizada há poucos dias ainda é "a etapa do momento": o que se quer ver é o resultado. */
const RECENT_DAYS = 7;

export function SpectatorHomePage() {
  const model = useModel();
  const profile = useProfile();
  const { championship } = model;
  const rules = championship.rules;

  const liveRace = championship.races.find((race) => race.status === 'live');
  const lastFinished = finishedRaces(championship).at(-1);
  const upcoming = nextRace(championship);
  const nextScheduled = championship.races
    .filter((race) => race.status === 'scheduled')
    .sort((a, b) => a.round - b.round)[0];

  const recentlyFinished =
    lastFinished && daysBetween(lastFinished.date, championship.referenceDate) <= RECENT_DAYS ? lastFinished : undefined;
  const focusRace: Race | undefined = liveRace ?? recentlyFinished ?? upcoming ?? lastFinished;
  const track = focusRace && model.tracksById.get(focusRace.trackId);
  const impact = focusRace?.status === 'finished' ? getRaceImpact(championship, focusRace.id) : null;
  const isLive = focusRace?.status === 'live';
  const showNextEvent = nextScheduled && nextScheduled.id !== focusRace?.id;
  const nextTrack = nextScheduled && model.tracksById.get(nextScheduled.trackId);

  const topTeams = model.teamStandings.slice(0, 3);
  const topPilots = model.pilotStandings.slice(0, 3);
  const status = focusRace ? STATUS[focusRace.status] : null;

  return (
    <>
      <PageHeader
        eyebrow={`Guia do campeonato · Temporada ${championship.season}`}
        title="A corrida, mais fácil de acompanhar"
        subtitle="Encontre quem está na frente, reconheça as equipes e veja o que acontece em cada etapa."
      />

      <Card as="article" className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroHeading}>
          <span className={styles.heroIcon} aria-hidden="true">
            {isLive ? <Radio size={20} /> : focusRace?.status === 'finished' ? <Medal size={20} /> : <Flag size={20} />}
          </span>
          <div className={styles.heroTitle}>
            <p className={styles.eyebrow}>Etapa atual</p>
            <h2 id="hero-title">{focusRace?.name ?? 'Calendário indisponível'}</h2>
          </div>
          {status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>

        {focusRace && (
          <p className={styles.raceMeta}>
            Etapa {focusRace.round} de {rules.totalRaces}
            {track ? ` · ${track.name}` : ''} · {formatLongDate(focusRace.date)}
          </p>
        )}

        {isLive && (
          <p className={styles.honesty}>
            Esta etapa é uma simulação da demonstração; não há dados reais ao vivo. Os resultados só valem na classificação
            depois que ela termina.
          </p>
        )}

        {focusRace?.status === 'scheduled' && (
          <p className={styles.honesty}>
            {formatCountdown(daysBetween(championship.referenceDate, focusRace.date))}. A etapa ainda não começou; agenda e
            resultados são demonstrativos.
          </p>
        )}

        {impact && (
          <ol className={styles.podiumMini} aria-label={`Pódio da etapa ${impact.race.round}`}>
            {impact.podium.map((entry) => {
              const pilot = model.pilotsById.get(entry.pilotId);
              const team = model.teamsById.get(entry.teamId);
              return (
                <li key={entry.pilotId} className={styles.podiumRow}>
                  <span className={`${styles.podiumPos} num`}>{entry.position}º</span>
                  <span className={styles.teamDot} style={{ backgroundColor: team?.color }} aria-hidden="true" />
                  <span className={styles.podiumName}>
                    {pilot?.name}
                    <small>{team?.name}</small>
                  </span>
                  <strong className="num">+{entry.points} pts</strong>
                </li>
              );
            })}
          </ol>
        )}

        {focusRace && isLive && (
          <Link className={styles.primaryLink} to={profilePath(profile, 'ao-vivo')}>
            Acompanhar etapa <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
        {focusRace && focusRace.status === 'finished' && (
          <Link className={styles.primaryLink} to={profilePath(profile, `etapa/${focusRace.id}`)}>
            Ver pódio e resultado <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
        {focusRace && focusRace.status === 'scheduled' && lastFinished && (
          <Link className={styles.primaryLink} to={profilePath(profile, `etapa/${lastFinished.id}`)}>
            Ver resultado da etapa {lastFinished.round} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        )}
      </Card>

      {showNextEvent && nextScheduled && (
        <Card as="section" aria-labelledby="next-event-title" className={styles.nextCard}>
          <div className={styles.nextHead}>
            <div>
              <p className={styles.eyebrow}>Próximo evento</p>
              <h2 id="next-event-title">
                Etapa {nextScheduled.round} · {nextScheduled.name}
              </h2>
            </div>
            <Badge tone="data">{formatCountdown(daysBetween(championship.referenceDate, nextScheduled.date))}</Badge>
          </div>
          <p className={styles.nextInfo}>
            <MapPin size={16} aria-hidden="true" />
            {nextTrack ? `${nextTrack.name} · ${nextTrack.city}` : 'Local a confirmar'}
          </p>
          <p className={styles.nextInfo}>
            <CalendarDays size={16} aria-hidden="true" />
            {formatLongDate(nextScheduled.date)} · {nextScheduled.startTime}
          </p>
        </Card>
      )}

      <section className={styles.section} aria-labelledby="quick-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Acesso rápido</p>
            <h2 id="quick-title">O que você quer ver?</h2>
          </div>
        </div>
        <div className={styles.quickLinks}>
          <Link className={styles.quickLink} to={profilePath(profile, 'classificacao')}>
            <Trophy size={20} aria-hidden="true" />
            <span>
              <strong>Quem lidera</strong>
              <small>Classificação de pilotos e equipes</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {lastFinished && (
            <Link className={styles.quickLink} to={profilePath(profile, `etapa/${lastFinished.id}`)}>
              <Medal size={20} aria-hidden="true" />
              <span>
                <strong>Resultados das etapas</strong>
                <small>Pódio e pontos de cada etapa</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
          <Link className={styles.quickLink} to={profilePath(profile, 'feed')}>
            <span className={styles.feedMark} aria-hidden="true">
              F
            </span>
            <span>
              <strong>Novidades das equipes</strong>
              <small>Publicações ilustrativas do campeonato</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={styles.quickLink} to={profilePath(profile, 'pilotos-equipes')}>
            <span className={styles.peopleMark} aria-hidden="true">
              #
            </span>
            <span>
              <strong>Quem está na pista</strong>
              <small>Encontre pilotos e suas equipes</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Card as="section" aria-labelledby="leaders-title" className={styles.leadersCard}>
        <div className={styles.leadersHeading}>
          <Trophy size={19} aria-hidden="true" />
          <div>
            <p className={styles.eyebrow}>Classificação geral</p>
            <h2 id="leaders-title">Quem está na frente?</h2>
          </div>
        </div>
        {topTeams.length > 0 && topPilots.length > 0 ? (
          <>
            <div>
              <h3 className={styles.listTitle}>Pilotos</h3>
              <ol className={styles.leaders} aria-label="Três primeiros pilotos">
                {topPilots.map((standing) => {
                  const pilot = model.pilotsById.get(standing.pilotId);
                  const team = model.teamsById.get(standing.teamId);
                  if (!pilot || !team) return null;
                  return (
                    <li key={pilot.id} className={styles.leaderRow}>
                      <span className={styles.rank}>
                        {formatOrdinal(standing.position)}
                        {standing.tied ? '=' : ''}
                      </span>
                      <span className={styles.teamDot} style={{ backgroundColor: team.color }} aria-hidden="true" />
                      <span className={styles.teamName}>
                        {pilot.name}
                        <small className={styles.sub}> · {team.name}</small>
                      </span>
                      <strong className="num">{standing.points} pts</strong>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div>
              <h3 className={styles.listTitle}>Equipes</h3>
              <ol className={styles.leaders} aria-label="Três primeiras equipes">
                {topTeams.map((standing) => {
                  const team = model.teamsById.get(standing.teamId);
                  if (!team) return null;
                  return (
                    <li key={team.id} className={styles.leaderRow}>
                      <span className={styles.rank}>
                        {formatOrdinal(standing.position)}
                        {standing.tied ? '=' : ''}
                      </span>
                      <span className={styles.teamDot} style={{ backgroundColor: team.color }} aria-hidden="true" />
                      <span className={styles.teamName}>{team.name}</span>
                      <strong className="num">{standing.points} pts</strong>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        ) : (
          <p className={styles.empty}>A classificação aparece após a primeira etapa finalizada.</p>
        )}
        <p className={styles.helper}>Os pontos da equipe somam os resultados dos seus dois pilotos.</p>
        <Link className={styles.textLink} to={profilePath(profile, 'classificacao')}>
          Ver classificação completa <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </Card>

      <Card as="section" aria-labelledby="how-title" className={styles.howCard}>
        <p className={styles.eyebrow}>Para quem está começando</p>
        <h2 id="how-title">Como funciona o campeonato</h2>
        <ul className={styles.how}>
          <li>
            O campeonato tem <strong>{rules.totalRaces} etapas</strong> (corridas). Cada uma acontece em uma pista diferente.
          </li>
          <li>
            Em cada etapa, as <strong>{rules.pointsByPosition.length} primeiras posições</strong> ganham pontos:{' '}
            <strong>{rules.pointsByPosition.join(', ')}</strong>. Quem chega depois disso fica com 0.
          </li>
          <li>
            Cada equipe tem <strong>{rules.pilotsPerTeam} pilotos</strong>, e os pontos da equipe são a soma dos dois.
          </li>
          <li>
            Ganha o campeonato quem somar mais pontos ao longo das etapas. A pontuação máxima de uma etapa é{' '}
            {maxPointsPerRace(rules)}. Em caso de empate em pontos, o regulamento ainda não define o desempate.
          </li>
        </ul>
      </Card>
    </>
  );
}
