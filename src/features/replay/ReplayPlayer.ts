import { sampleReplay, type ReplayModel, type ReplaySnapshot } from '@/domain';

export const REPLAY_SPEEDS = [1, 2, 4, 8] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
export const DEFAULT_REPLAY_SPEED: ReplaySpeed = 4;

export interface PlayerState {
  timeMs: number;
  playing: boolean;
  speed: ReplaySpeed;
  /** Chegou ao fim da corrida. */
  ended: boolean;
}

type Listener = (state: PlayerState) => void;

/** Maior avanço aceito por quadro: evita "saltos" quando a aba volta de segundo plano. */
const MAX_FRAME_MS = 100;

/**
 * Relógio da reprodução. Independente de React: guarda o tempo, a velocidade e o
 * estado (tocando/pausado/fim) e avisa os interessados a cada quadro.
 * `advance` é puro em relação ao tempo real, o que torna a lógica testável.
 */
export class ReplayPlayer {
  private state: PlayerState;
  private readonly listeners = new Set<Listener>();
  private frame: number | null = null;
  private lastFrameAt = 0;
  private cache: { timeMs: number; snapshot: ReplaySnapshot } | null = null;

  constructor(
    readonly model: ReplayModel,
    speed: ReplaySpeed = DEFAULT_REPLAY_SPEED,
  ) {
    this.state = { timeMs: 0, playing: false, speed, ended: false };
  }

  getState(): PlayerState {
    return this.state;
  }

  /** Estado da corrida no instante atual (memorizado por instante). */
  getSnapshot(): ReplaySnapshot {
    if (this.cache?.timeMs !== this.state.timeMs) {
      this.cache = { timeMs: this.state.timeMs, snapshot: sampleReplay(this.model, this.state.timeMs) };
    }
    return this.cache.snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  play(): void {
    if (this.state.ended) this.seek(0);
    if (this.state.playing) return;
    this.set({ playing: true });
    this.startLoop();
  }

  pause(): void {
    if (!this.state.playing) return;
    this.stopLoop();
    this.set({ playing: false });
  }

  toggle(): void {
    if (this.state.playing) this.pause();
    else this.play();
  }

  /** Volta ao início e começa a tocar. */
  restart(): void {
    this.seek(0);
    this.play();
  }

  seek(timeMs: number): void {
    const t = Math.min(Math.max(0, timeMs), this.model.durationMs);
    const ended = t >= this.model.durationMs;
    if (ended) this.stopLoop();
    this.set({ timeMs: t, ended, ...(ended ? { playing: false } : {}) });
  }

  setSpeed(speed: ReplaySpeed): void {
    if (speed !== this.state.speed) this.set({ speed });
  }

  /** Avança o relógio `dtMs` de tempo real (não faz nada se estiver pausado). */
  advance(dtMs: number): void {
    if (!this.state.playing) return;
    this.seek(this.state.timeMs + dtMs * this.state.speed);
  }

  destroy(): void {
    this.stopLoop();
    this.listeners.clear();
  }

  private set(patch: Partial<PlayerState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private startLoop(): void {
    if (typeof requestAnimationFrame !== 'function' || this.frame !== null) return;
    this.lastFrameAt = performance.now();
    const tick = (now: number) => {
      this.frame = null;
      const dt = Math.min(now - this.lastFrameAt, MAX_FRAME_MS);
      this.lastFrameAt = now;
      this.advance(dt);
      if (this.state.playing) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.frame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.frame);
    this.frame = null;
  }
}
