import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// O Vitest está com `css: false` e roda na raiz do projeto: o CSS é lido direto do arquivo.
const tokensCss = readFileSync(join(process.cwd(), 'src', 'styles', 'tokens.css'), 'utf-8');

/**
 * Guarda de legibilidade (Tarefa 3 do relatório): os pares de cor usados para TEXTO
 * têm de manter o contraste mínimo da WCAG 2.1 (4,5:1 para texto comum) nos dois
 * temas. Se alguém trocar um token e o texto ficar ilegível, este teste avisa.
 */

type Rgb = { r: number; g: number; b: number };

function block(selector: string): string {
  const start = tokensCss.indexOf(selector);
  if (start < 0) throw new Error(`bloco não encontrado: ${selector}`);
  const open = tokensCss.indexOf('{', start);
  return tokensCss.slice(open + 1, tokensCss.indexOf('}', open));
}

function declarations(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) map.set(match[1]!, match[2]!.trim());
  return map;
}

const light = declarations(block(':root {'));
const dark = new Map([...light, ...declarations(block(":root[data-theme='dark']"))]);

function parse(value: string, theme: Map<string, string>): { rgb: Rgb; alpha: number } {
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (ref) return parse(theme.get(ref[1]!) ?? '', theme);
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return { rgb: { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }, alpha: 1 };
  }
  const fn = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (fn) return { rgb: { r: +fn[1]!, g: +fn[2]!, b: +fn[3]! }, alpha: fn[4] ? +fn[4] : 1 };
  throw new Error(`cor não reconhecida: ${value}`);
}

const over = (top: { rgb: Rgb; alpha: number }, bottom: Rgb): Rgb => ({
  r: top.rgb.r * top.alpha + bottom.r * (1 - top.alpha),
  g: top.rgb.g * top.alpha + bottom.g * (1 - top.alpha),
  b: top.rgb.b * top.alpha + bottom.b * (1 - top.alpha),
});

const luminance = ({ r, g, b }: Rgb) => {
  const f = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

function color(theme: Map<string, string>, token: string): Rgb {
  return parse(`var(--${token})`, theme).rgb;
}

/** Cor de um token translúcido (ex.: --data-soft) já sobre o fundo `base`. */
function soft(theme: Map<string, string>, token: string, base: string): Rgb {
  return over(parse(`var(--${token})`, theme), color(theme, base));
}

const AA = 4.5;

describe.each([
  ['claro', light],
  ['escuro', dark],
] as const)('tema %s: texto legível', (_name, theme) => {
  it.each([
    ['texto', 'bg'],
    ['texto', 'surface'],
    ['text-2', 'surface'],
    ['text-3', 'surface'],
    ['text-3', 'bg'],
    ['accent-text', 'surface'],
    ['accent-text', 'surface-sunken'],
    ['data-text', 'surface'],
    ['data-text', 'bg'],
    ['nav-active', 'surface-sunken'],
    ['alert', 'surface'],
    ['gain', 'surface'],
  ])('%s sobre %s tem pelo menos 4,5:1', (fg, bg) => {
    const token = fg === 'texto' ? 'text' : fg;
    expect(contrast(color(theme, token), color(theme, bg))).toBeGreaterThanOrEqual(AA);
  });

  it('texto de dados sobre o selo suave (sobre cartão e sobre fundo) tem pelo menos 4,5:1', () => {
    for (const base of ['surface', 'bg']) {
      expect(contrast(color(theme, 'data-text'), soft(theme, 'data-soft', base))).toBeGreaterThanOrEqual(AA);
    }
  });

  it('número escuro sobre as medalhas tem pelo menos 4,5:1', () => {
    for (const medal of ['gold', 'silver', 'bronze']) {
      expect(contrast(color(theme, 'medal-ink'), color(theme, medal))).toBeGreaterThanOrEqual(AA);
    }
  });

  it('texto sobre o destaque (botão principal) tem pelo menos 4,5:1', () => {
    expect(contrast(color(theme, 'accent-ink'), color(theme, 'accent'))).toBeGreaterThanOrEqual(AA);
  });
});

describe('o amarelo-limão não serve de texto no tema claro', () => {
  it('é o motivo de existir --accent-text: o destaque puro tem menos de 3:1 sobre o cartão', () => {
    expect(contrast(color(light, 'accent'), color(light, 'surface'))).toBeLessThan(3);
    expect(contrast(color(light, 'accent-text'), color(light, 'surface'))).toBeGreaterThanOrEqual(AA);
  });

  it('no tema escuro o texto de destaque continua sendo o próprio destaque', () => {
    expect(color(dark, 'accent-text')).toEqual(color(dark, 'accent'));
    expect(color(dark, 'data-text')).toEqual(color(dark, 'data'));
  });
});
