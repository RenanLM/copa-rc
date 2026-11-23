import { Star } from 'lucide-react';
import { PilotLine } from '@/components/PilotLine';
import { Card } from '@/components/ui/Card';
import type { ChampionshipModel, PilotId, ReplaySnapshot } from '@/domain';
import { liveGap } from '@/features/replay/Leaderboard';
import { formatOrdinal } from '@/lib/format';
import { MAX_FAVORITE_PILOTS } from '@/lib/favorite-pilots';
import styles from './FavoritePilots.module.css';

interface FavoritePilotsProps {
  model: ChampionshipModel;
  /** Estado atual da corrida: dele vêm a posição e a diferença de cada preferido. */
  snapshot: ReplaySnapshot;
  /** Pilotos preferidos, na ordem em que foram escolhidos. */
  favoriteIds: readonly PilotId[];
  selectedPilotId: PilotId | null;
  onSelect: (pilotId: PilotId | null) => void;
  onToggleFavorite: (pilotId: PilotId) => void;
  /** Aviso visível (ex.: limite atingido). Vazio não mostra nada. */
  notice: string;
}

/**
 * "Seus pilotos": resumo, acima do placar, de como estão os pilotos que a
 * espectadora escolheu acompanhar. Sem preferidos, convida a escolher.
 */
export function FavoritePilots({
  model,
  snapshot,
  favoriteIds,
  selectedPilotId,
  onSelect,
  onToggleFavorite,
  notice,
}: FavoritePilotsProps) {
  // Na ordem da corrida: quem está na frente aparece primeiro.
  const rows = snapshot.cars
    .filter((car) => favoriteIds.includes(car.pilotId))
    .flatMap((car) => {
      const pilot = model.pilotsById.get(car.pilotId);
      const team = pilot && model.teamsById.get(pilot.teamId);
      return pilot && team ? [{ car, pilot, team }] : [];
    });

  return (
    <Card as="section" flush aria-labelledby="favorite-pilots-title" className={styles.card}>
      <div className={styles.heading}>
        <h2 id="favorite-pilots-title">Seus pilotos</h2>
        <span className={styles.count}>
          {rows.length} de {MAX_FAVORITE_PILOTS}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className={styles.invite}>
          <Star size={16} aria-hidden="true" />
          <span>
            Escolha até {MAX_FAVORITE_PILOTS} pilotos para acompanhar de perto. Toque na estrela ao lado do nome, no
            placar abaixo.
          </span>
        </p>
      ) : (
        <ul className={styles.list}>
          {rows.map(({ car, pilot, team }) => {
            const isSelected = car.pilotId === selectedPilotId;
            const gap = car.position === 1 ? (car.finished ? 'Vencedor' : 'Líder') : liveGap(car.gap, car.finished);
            return (
              <li key={car.pilotId} className={`${styles.item} ${isSelected ? styles.selected : ''}`}>
                <button
                  type="button"
                  className={styles.row}
                  aria-pressed={isSelected}
                  aria-label={`${formatOrdinal(car.position)}: ${pilot.name}, ${team.name}. Toque para destacar na pista.`}
                  onClick={() => onSelect(isSelected ? null : car.pilotId)}
                >
                  <span className={`${styles.position} num`} aria-hidden="true">
                    {car.position}º
                  </span>
                  <PilotLine
                    pilot={pilot}
                    team={team}
                    sub={car.retired ? 'Fora da prova' : car.finished ? 'Terminou' : gap}
                  />
                </button>
                <button
                  type="button"
                  className={styles.star}
                  aria-pressed
                  aria-label={`Acompanhar ${pilot.name}`}
                  onClick={() => onToggleFavorite(car.pilotId)}
                >
                  <Star size={22} fill="currentColor" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
    </Card>
  );
}
