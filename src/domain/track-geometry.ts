import type { Point } from './types';

/** Grade de desenho dos traçados. */
export const TRACK_VIEWBOX = { width: 400, height: 280 } as const;

/** Oval genérico, usado quando a pista não tem traçado próprio. */
export const DEFAULT_TRACK_LAYOUT: readonly Point[] = [
  [70, 70], [200, 45], [330, 70], [365, 140], [330, 210], [200, 235], [70, 210], [35, 140],
];

export interface TrackPoint {
  x: number;
  y: number;
  /** Direção de deslocamento, em radianos (0 = para a direita). */
  angle: number;
}

export interface TrackPath {
  /** Atributo `d` de um <path> SVG fechado. */
  d: string;
  /** Comprimento do traçado na grade de desenho. */
  length: number;
  /** Ponto na fração `u` da volta (0 = linha de chegada; aceita qualquer real, é cíclico). */
  pointAt: (u: number) => TrackPoint;
  /** Pontos da curva (sem repetir o primeiro), para testes e desenho. */
  polyline: readonly Point[];
}

const ALPHA = 0.5; // Catmull-Rom centrípeto: sem laços nem sobressaltos em curvas fechadas

function dist(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function lerp(a: Point, b: Point, w: number): Point {
  return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
}

/** Interpolação de Barry–Goldman entre p1 e p2 (t em [0, 1]). */
function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t0 = 0;
  const t1 = t0 + Math.max(dist(p0, p1), 1e-6) ** ALPHA;
  const t2 = t1 + Math.max(dist(p1, p2), 1e-6) ** ALPHA;
  const t3 = t2 + Math.max(dist(p2, p3), 1e-6) ** ALPHA;
  const u = t1 + (t2 - t1) * t;

  const a1 = lerp(p0, p1, (u - t0) / (t1 - t0));
  const a2 = lerp(p1, p2, (u - t1) / (t2 - t1));
  const a3 = lerp(p2, p3, (u - t2) / (t3 - t2));
  const b1 = lerp(a1, a2, (u - t0) / (t2 - t0));
  const b2 = lerp(a2, a3, (u - t1) / (t3 - t1));
  return lerp(b1, b2, (u - t1) / (t2 - t1));
}

/** Constrói uma curva fechada suave que passa por todos os pontos de controle. */
export function buildTrackPath(
  layout: readonly Point[] = DEFAULT_TRACK_LAYOUT,
  samplesPerSegment = 24,
): TrackPath {
  const control = layout.length >= 3 ? layout : DEFAULT_TRACK_LAYOUT;
  const n = control.length;
  const at = (i: number) => control[((i % n) + n) % n]!;

  const polyline: Point[] = [];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < samplesPerSegment; k++) {
      polyline.push(catmullRom(at(i - 1), at(i), at(i + 1), at(i + 2), k / samplesPerSegment));
    }
  }

  // Comprimento acumulado, incluindo o segmento que fecha a volta.
  const cumulative: number[] = [0];
  for (let i = 1; i <= polyline.length; i++) {
    cumulative.push(cumulative[i - 1]! + dist(polyline[i - 1]!, polyline[i % polyline.length]!));
  }
  const length = cumulative[polyline.length]!;

  const pointAt = (u: number): TrackPoint => {
    const frac = ((u % 1) + 1) % 1;
    const target = frac * length;
    let lo = 0;
    let hi = polyline.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (cumulative[mid]! <= target) lo = mid;
      else hi = mid - 1;
    }
    const a = polyline[lo]!;
    const b = polyline[(lo + 1) % polyline.length]!;
    const span = cumulative[lo + 1]! - cumulative[lo]!;
    const w = span > 0 ? (target - cumulative[lo]!) / span : 0;
    return {
      x: a[0] + (b[0] - a[0]) * w,
      y: a[1] + (b[1] - a[1]) * w,
      angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  };

  const d =
    polyline
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ') + ' Z';

  return { d, length, pointAt, polyline };
}
