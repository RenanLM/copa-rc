import { useId, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { buildTrackPath, TRACK_VIEWBOX, type PilotId, type Track } from '@/domain';
import type { ReplayPlayer } from './ReplayPlayer';
import styles from './TrackStage.module.css';

export interface StageCar {
  pilotId: PilotId;
  number: number;
  color: string;
  name: string;
}

interface TrackStageProps {
  player: ReplayPlayer;
  track: Track | undefined;
  cars: readonly StageCar[];
  /** Piloto sempre destacado (ex.: o próprio usuário). */
  focusPilotId?: PilotId;
  /** Piloto escolhido na classificação. */
  selectedPilotId?: PilotId | null;
  label: string;
  /** Faixa acima da pista (cronômetro e volta). */
  header?: ReactNode;
  /** Sobreposição sobre a pista (botão de iniciar). */
  children?: ReactNode;
}

const LANE = 4; // deslocamento lateral entre as duas colunas de carros
const CAR_LENGTH = 15;
const CAR_WIDTH = 8;

/**
 * Pista em vista superior. Os carros são movidos direto no DOM a cada quadro
 * (sem re-renderizar o React), o que mantém a animação fluida com 12 carros.
 */
export function TrackStage({ player, track, cars, focusPilotId, selectedPilotId, label, header, children }: TrackStageProps) {
  const uid = useId();
  const reduceMotion = useReducedMotion();
  const path = useMemo(() => buildTrackPath(track?.layout), [track]);
  const carNodes = useRef(new Map<PilotId, SVGGElement>());
  const tagNodes = useRef(new Map<PilotId, SVGGElement>());

  const place = () => {
    for (const sample of player.getSnapshot().cars) {
      const node = carNodes.current.get(sample.pilotId);
      if (!node) continue;
      const lane = sample.gridIndex % 2 === 0 ? -LANE : LANE;
      const p = path.pointAt(sample.visualProgress);
      const x = p.x - Math.sin(p.angle) * lane;
      const y = p.y + Math.cos(p.angle) * lane;
      node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((p.angle * 180) / Math.PI).toFixed(1)})`);
      node.dataset.retired = String(sample.retired);
      tagNodes.current.get(sample.pilotId)?.setAttribute('transform', `translate(${x.toFixed(2)} ${(y - 17).toFixed(2)})`);
    }
  };

  // Reposiciona após cada render (ex.: troca de seleção) e a cada quadro do relógio.
  useLayoutEffect(place);
  useLayoutEffect(() => player.subscribe(place), [player, path]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = path.pointAt(0);
  const startDeg = (start.angle * 180) / Math.PI;
  const highlighted = new Set([focusPilotId, selectedPilotId].filter(Boolean) as PilotId[]);
  // Destacados por último: ficam por cima dos demais.
  const ordered = [...cars].sort((a, b) => Number(highlighted.has(a.pilotId)) - Number(highlighted.has(b.pilotId)));

  return (
    <div className={styles.stage}>
      {header}
      <svg className={styles.svg} viewBox={`0 0 ${TRACK_VIEWBOX.width} ${TRACK_VIEWBOX.height}`} role="img" aria-label={label}>
        <defs>
          <pattern id={`${uid}-checker`} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="#f5f7fa" />
            <rect width="2" height="2" fill="#0b0f14" />
            <rect x="2" y="2" width="2" height="2" fill="#0b0f14" />
          </pattern>
        </defs>

        <motion.g
          key={track?.id ?? 'default'}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <path className={styles.kerb} d={path.d} />
          <motion.path
            className={styles.asphalt}
            d={path.d}
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          />
          <path className={styles.centerline} d={path.d} />
          {/* Linha de chegada */}
          <g transform={`translate(${start.x.toFixed(2)} ${start.y.toFixed(2)}) rotate(${startDeg.toFixed(1)})`}>
            <rect x="-2" y="-14" width="4" height="28" fill={`url(#${uid}-checker)`} />
          </g>
        </motion.g>

        <motion.g
          key={`${track?.id ?? 'default'}-cars`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.5 }}
        >
          {ordered.map((car) => {
            const isFocus = car.pilotId === focusPilotId;
            const isSelected = car.pilotId === selectedPilotId;
            return (
              <g
                key={car.pilotId}
                className={styles.car}
                ref={(node) => {
                  if (node) carNodes.current.set(car.pilotId, node);
                  else carNodes.current.delete(car.pilotId);
                }}
              >
                {(isFocus || isSelected) && (
                  <circle r="12" className={isFocus ? styles.focusRing : styles.selectRing} />
                )}
                <rect
                  x={-CAR_LENGTH / 2}
                  y={-CAR_WIDTH / 2}
                  width={CAR_LENGTH}
                  height={CAR_WIDTH}
                  rx="2.5"
                  fill={car.color}
                  stroke="var(--surface-raised)"
                  strokeWidth="3"
                  paintOrder="stroke"
                />
                <rect x="1" y="-2.4" width="3.6" height="4.8" rx="1" fill="rgb(0 0 0 / 0.45)" />
              </g>
            );
          })}
          {/* Etiquetas com o número do carro destacado (não giram com o carro) */}
          {ordered
            .filter((car) => highlighted.has(car.pilotId))
            .map((car) => {
              const isFocus = car.pilotId === focusPilotId;
              return (
                <g
                  key={`tag-${car.pilotId}`}
                  className={styles.tag}
                  ref={(node) => {
                    if (node) tagNodes.current.set(car.pilotId, node);
                    else tagNodes.current.delete(car.pilotId);
                  }}
                  aria-hidden="true"
                >
                  <rect x="-11" y="-8" width="22" height="16" rx="8" fill={isFocus ? 'var(--accent)' : 'var(--text)'} />
                  <text fill="var(--accent-ink)">{car.number}</text>
                </g>
              );
            })}
        </motion.g>
      </svg>
      {children}
    </div>
  );
}
