import {
  daysBetween,
  formatClock,
  formatCountdown,
  formatGap,
  formatLapTime,
  formatLongDate,
  formatPostDate,
  formatPoints,
  formatShortDate,
  initials,
} from './format';

describe('formatLapTime', () => {
  it('formata voltas abaixo de um minuto como segundos', () => {
    expect(formatLapTime(14_482)).toBe('14.482');
    expect(formatLapTime(9_050)).toBe('9.050');
  });
  it('formata tempos acima de um minuto como m:ss.mmm', () => {
    expect(formatLapTime(286_331)).toBe('4:46.331');
    expect(formatLapTime(61_005)).toBe('1:01.005');
  });
});

describe('formatClock', () => {
  it('mostra minutos, segundos e décimos', () => {
    expect(formatClock(0)).toBe('0:00.0');
    expect(formatClock(5_400)).toBe('0:05.4');
    expect(formatClock(286_331)).toBe('4:46.3');
    expect(formatClock(-50)).toBe('0:00.0');
  });
});

describe('formatGap', () => {
  it('descreve vencedor, diferença de tempo, voltas e abandono', () => {
    expect(formatGap({ kind: 'leader' })).toBe('Vencedor');
    expect(formatGap({ kind: 'time', ms: 2_345 })).toBe('+2.345 s');
    expect(formatGap({ kind: 'laps', laps: 1 })).toBe('+1 volta');
    expect(formatGap({ kind: 'laps', laps: 2 })).toBe('+2 voltas');
    expect(formatGap({ kind: 'dnf' })).toBe('Abandonou');
  });
});

describe('datas e contagem regressiva', () => {
  it('formata datas sem depender do fuso do dispositivo', () => {
    expect(formatShortDate('2026-10-25')).toBe('25 out');
    expect(formatLongDate('2026-10-25')).toBe('dom, 25 out 2026');
  });
  it('calcula dias entre datas', () => {
    expect(daysBetween('2026-10-21', '2026-10-25')).toBe(4);
    expect(daysBetween('2026-10-25', '2026-10-21')).toBe(-4);
    expect(daysBetween('2026-10-21', '2026-10-21')).toBe(0);
  });
  it('descreve a contagem regressiva em linguagem natural', () => {
    expect(formatCountdown(4)).toBe('Em 4 dias');
    expect(formatCountdown(1)).toBe('Amanhã');
    expect(formatCountdown(0)).toBe('Hoje');
    expect(formatCountdown(-3)).toBe('Já ocorreu');
  });
});

describe('formatPostDate', () => {
  it('mostra data e hora quando existem, sem depender do fuso', () => {
    expect(formatPostDate('2026-09-27T14:32')).toBe('27 set · 14:32');
    expect(formatPostDate('2026-09-27T14:32:45')).toBe('27 set · 14:32');
  });
  it('mostra só a data quando não há horário e nada quando não há data', () => {
    expect(formatPostDate('2026-09-27')).toBe('27 set');
    expect(formatPostDate(undefined)).toBeNull();
    expect(formatPostDate('')).toBeNull();
  });
});

describe('textos auxiliares', () => {
  it('pluraliza pontos e extrai iniciais', () => {
    expect(formatPoints(1)).toBe('1 pt');
    expect(formatPoints(11)).toBe('11 pts');
    expect(initials('Lucas Ferreira')).toBe('LF');
  });
});
