import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setScenarioChoice } from '@/lib/demo-scenario';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

beforeEach(() => {
  setPendingSimulation('none');
  setScenarioChoice('auto');
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => cleanup());

/** "0:03.4" → 3.4 segundos. */
function clockSeconds(): number {
  const text = screen.getByText('Tempo').parentElement!.textContent!.replace('Tempo', '').trim();
  const [minutes, seconds] = text.split(':').map(Number);
  return minutes! * 60 + seconds!;
}

describe('etapa em andamento (espectadora)', () => {
  it('roda em tempo real: o cronômetro não corre mais rápido que o relógio', async () => {
    window.location.hash = '#/espectadora/ao-vivo';
    render(<App />);
    await screen.findByRole('button', { name: 'Pausar simulação' }, { timeout: 5000 });

    const started = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const realSeconds = (performance.now() - started) / 1000;
    const shown = clockSeconds();

    // em 1× o cronômetro acompanha o relógio (nunca passa dele); em 4× passaria de 4 s
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThanOrEqual(realSeconds + 0.5);
  });
});

async function openLive() {
  window.location.hash = '#/espectadora/ao-vivo';
  render(<App />);
  await screen.findByRole('button', { name: 'Pausar simulação' }, { timeout: 5000 });
  return screen.getByRole('list', { name: 'Classificação ao vivo' });
}

const star = (board: HTMLElement, name: string) => within(board).getByRole('button', { name: `Acompanhar ${name}` });

describe('pilotos preferidos no Ao Vivo', () => {
  it('sem preferidos, "Seus pilotos" convida a escolher e mostra 0 de 3', async () => {
    await openLive();
    const region = screen.getByRole('region', { name: 'Seus pilotos' });
    expect(within(region).getByText('0 de 3')).toBeInTheDocument();
    expect(within(region).getByText(/Escolha até 3 pilotos/)).toBeInTheDocument();
  });

  it('cada linha do placar tem uma estrela com nome acessível e estado (aria-pressed)', async () => {
    const board = await openLive();
    const stars = within(board).getAllByRole('button', { name: /^Acompanhar / });
    expect(stars).toHaveLength(12);
    for (const s of stars) expect(s).toHaveAttribute('aria-pressed', 'false');
  });

  it('escolher um piloto o coloca em "Seus pilotos" e marca a linha como preferido', async () => {
    const board = await openLive();
    fireEvent.click(star(board, 'Rafael Nunes'));

    expect(star(board, 'Rafael Nunes')).toHaveAttribute('aria-pressed', 'true');
    const region = screen.getByRole('region', { name: 'Seus pilotos' });
    expect(within(region).getByText('1 de 3')).toBeInTheDocument();
    expect(within(region).getByText('Rafael Nunes')).toBeInTheDocument();
    // a linha do placar diz, em texto, que é preferido (a cor não é o único sinal)
    expect(within(board).getByText('Preferido · Vortex Motorsport')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('rcc:favorite-pilots')!)).toEqual(['rafael-nunes']);
  });

  it('a escolha continua na próxima visita', async () => {
    const board = await openLive();
    fireEvent.click(star(board, 'Lucas Ferreira'));
    cleanup();

    const again = await openLive();
    expect(star(again, 'Lucas Ferreira')).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('region', { name: 'Seus pilotos' })).getByText('Lucas Ferreira')).toBeInTheDocument();
  });

  it('não deixa passar de 3 e explica o que fazer', async () => {
    const board = await openLive();
    for (const name of ['Rafael Nunes', 'Helena Duarte', 'Lucas Ferreira']) fireEvent.click(star(board, name));
    fireEvent.click(star(board, 'Diego Martins'));

    expect(star(board, 'Diego Martins')).toHaveAttribute('aria-pressed', 'false');
    const region = screen.getByRole('region', { name: 'Seus pilotos' });
    expect(within(region).getByText('3 de 3')).toBeInTheDocument();
    expect(within(region).getByText(/Você já acompanha 3 pilotos/)).toBeInTheDocument();

    // tirar um libera a vaga e o aviso some
    fireEvent.click(star(board, 'Helena Duarte'));
    expect(within(region).queryByText(/Você já acompanha 3 pilotos/)).not.toBeInTheDocument();
    fireEvent.click(star(board, 'Diego Martins'));
    expect(star(board, 'Diego Martins')).toHaveAttribute('aria-pressed', 'true');
  });

  it('também dá para tirar um preferido pela própria faixa "Seus pilotos"', async () => {
    const board = await openLive();
    fireEvent.click(star(board, 'Rafael Nunes'));
    const region = screen.getByRole('region', { name: 'Seus pilotos' });
    fireEvent.click(within(region).getByRole('button', { name: 'Acompanhar Rafael Nunes' }));

    expect(within(region).getByText('0 de 3')).toBeInTheDocument();
    expect(star(board, 'Rafael Nunes')).toHaveAttribute('aria-pressed', 'false');
  });

  it('a seleção por toque para ver o carro na pista continua funcionando', async () => {
    const board = await openLive();
    const row = within(board).getByRole('button', { name: /Rafael Nunes, Vortex Motorsport\. Toque para destacar/ });
    expect(row).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('organização da tela Ao Vivo', () => {
  it('o placar vem antes dos controles da demonstração e depois da pista', async () => {
    const board = await openLive();
    const track = screen.getByRole('img', { name: /Simulação da etapa 4/ });
    const controls = screen.getByText(/Controles da demonstração/);
    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(track.compareDocumentPosition(board) & FOLLOWING).toBeTruthy();
    expect(board.compareDocumentPosition(controls) & FOLLOWING).toBeTruthy();
  });

  it('o aviso de simulação é um bloco só, sem repetir a mesma frase', async () => {
    await openLive();
    expect(screen.getAllByText('Simulação ilustrativa')).toHaveLength(1);
    expect(screen.getAllByText(/Posições, tempos e ultrapassagens são fictícios/)).toHaveLength(1);
  });

  it('a volta aparece no cabeçalho do placar, não repetida em cada linha', async () => {
    const board = await openLive();
    expect(within(board).queryByText(/^Volta \d+\/\d+$/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Volta \d+\/\d+$/)).toBeInTheDocument();
  });

  it('a dica de uso fica junto do placar, não depois dele', async () => {
    const board = await openLive();
    const hint = screen.getByText(/Toque na estrela para acompanhar um piloto/);
    expect(hint.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
