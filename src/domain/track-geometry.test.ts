import { tracks } from '@/data/demo/seed';
import { buildTrackPath, DEFAULT_TRACK_LAYOUT, TRACK_VIEWBOX } from './track-geometry';
import type { Point } from './types';

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(a, b, c);
  const d2 = o(a, b, d);
  const d3 = o(c, d, a);
  const d4 = o(c, d, b);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Verdadeiro se a curva fechada se cruza (o que confundiria a ordem na pista). */
function selfIntersects(points: readonly Point[]): boolean {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // segmentos vizinhos pelo fechamento
      if (segmentsIntersect(points[i]!, points[(i + 1) % n]!, points[j]!, points[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

describe('buildTrackPath', () => {
  it('gera um circuito fechado e cíclico', () => {
    const path = buildTrackPath(DEFAULT_TRACK_LAYOUT);
    const start = path.pointAt(0);
    const end = path.pointAt(1);
    expect(end.x).toBeCloseTo(start.x, 3);
    expect(end.y).toBeCloseTo(start.y, 3);
    const wrapped = path.pointAt(2.25);
    const quarter = path.pointAt(0.25);
    expect(wrapped.x).toBeCloseTo(quarter.x, 3);
    expect(path.pointAt(-0.75).y).toBeCloseTo(quarter.y, 3);
  });

  it('o ponto avança de forma contínua ao longo da volta', () => {
    const path = buildTrackPath(DEFAULT_TRACK_LAYOUT);
    const step = path.length / 500;
    let prev = path.pointAt(0);
    for (let i = 1; i <= 500; i++) {
      const p = path.pointAt(i / 500);
      expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(step * 1.5);
      prev = p;
    }
  });

  it('usa o oval padrão quando o traçado é inválido', () => {
    expect(buildTrackPath([[0, 0]]).d).toBe(buildTrackPath(DEFAULT_TRACK_LAYOUT).d);
  });

  it('produz um atributo d de caminho fechado', () => {
    const { d } = buildTrackPath(DEFAULT_TRACK_LAYOUT);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});

describe('traçados das pistas de demonstração', () => {
  it.each(tracks.map((t) => [t.id, t] as const))('%s: cabe na grade e não se cruza', (_id, track) => {
    expect(track.layout).toBeDefined();
    const path = buildTrackPath(track.layout);
    for (const [x, y] of path.polyline) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(TRACK_VIEWBOX.width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(TRACK_VIEWBOX.height);
    }
    expect(selfIntersects(path.polyline)).toBe(false);
  });
});
