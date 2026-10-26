import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  localStorage.clear();
});

afterEach(() => cleanup());

async function openSimulator() {
  window.location.hash = '#/piloto/simulador';
  render(<App />);
  await screen.findByRole('heading', { name: 'Simulador' }, ready);
}

const chip = (position: number) => screen.getByRole('radio', { name: new RegExp(`^${position}º lugar:`) });

describe('Simulador', () => {
  it('começa na próxima posição acima da atual, com a resposta já visível', async () => {
    await openSimulator();
    expect(chip(2)).toBeChecked();
    const verdict = screen.getByRole('region', { name: '2º lugar' });
    expect(within(verdict).getByText('Condicional')).toBeInTheDocument();
    expect(verdict).toHaveTextContent(/pelo menos 9 pts/);
    expect(verdict).toHaveTextContent('Melhor posição');
  });

  it('cada posição mostra seu estado no próprio botão, sem depender de cor', async () => {
    await openSimulator();
    expect(chip(3)).toHaveAccessibleName(/Sua posição atual/);
    expect(chip(1)).toHaveAccessibleName(/possível, mas depende dos resultados/);
    expect(chip(12)).toHaveAccessibleName(/garantida, comprovada matematicamente/);
    expect(screen.getByRole('list', { name: 'Legenda dos estados' })).toHaveTextContent(/Garantida.*Condicional.*Só com empate.*Impossível/);
  });

  it('só chama de garantida o que é comprovado: 12º sim, 1º não', async () => {
    await openSimulator();
    fireEvent.click(chip(12));
    const verdict = await screen.findByRole('region', { name: '12º lugar' });
    expect(within(verdict).getByText('Garantida')).toBeInTheDocument();
    expect(verdict).toHaveTextContent(/Comprovado/);

    fireEvent.click(chip(1));
    const title = await screen.findByRole('region', { name: '1º lugar' });
    expect(within(title).getByText('Condicional')).toBeInTheDocument();
    expect(title).not.toHaveTextContent('Garantida');
  });

  it('separa a projeção após a próxima etapa da classificação final', async () => {
    await openSimulator();
    // final por padrão
    expect(screen.getByRole('heading', { name: 'Classificação final projetada' })).toBeInTheDocument();
    expect(screen.queryByText('Projeção · ainda restam etapas')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Após a etapa 4' }));
    expect(await screen.findByRole('heading', { name: 'Classificação projetada' })).toBeInTheDocument();
    expect(screen.getByText(/isto não é a classificação final/)).toBeInTheDocument();
    expect(screen.getByText('Projeção · ainda restam etapas')).toBeInTheDocument();

    // a mesma posição muda de estado: o título é impossível após a etapa 4, mas possível no final
    fireEvent.click(chip(1));
    const verdict = await screen.findByRole('region', { name: '1º lugar' });
    expect(within(verdict).getByText('Impossível')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Fim do campeonato' }));
    expect(within(await screen.findByRole('region', { name: '1º lugar' })).getByText('Condicional')).toBeInTheDocument();
  });

  it('o mapa de resultados mostra os quatro estados e aplica o cenário ao tocar', async () => {
    await openSimulator();
    const grid = screen.getByRole('grid', { name: /Seus resultados nas etapas restantes/ });
    const cell = (a: string, b: string) =>
      within(grid).getByRole('button', { name: new RegExp(`etapa 4: ${a}, etapa 5: ${b}\\.`) });

    expect(cell('1º lugar', '1º lugar')).toHaveAccessibleName(/Soma 20 pontos.*possível, mas depende/);
    expect(cell('fora dos pontos', 'fora dos pontos')).toHaveAccessibleName(/matematicamente impossível/);

    fireEvent.click(cell('1º lugar', '1º lugar'));
    expect(cell('1º lugar', '1º lugar')).toHaveAttribute('aria-pressed', 'true');
    // cenário mais favorável com 31 pontos: Lucas lidera a classificação final projetada
    const list = screen.getByRole('list', { name: 'Classificação final projetada' });
    const first = within(list).getAllByRole('listitem')[0]!;
    expect(first).toHaveTextContent('Lucas Ferreira');
    expect(first).toHaveTextContent('31');
  });

  it('navega o mapa pelo teclado (setas)', async () => {
    await openSimulator();
    const grid = screen.getByRole('grid', { name: /Seus resultados nas etapas restantes/ });
    const buttons = within(grid).getAllByRole('button');
    const selected = buttons.find((b) => b.getAttribute('aria-pressed') === 'true')!;
    expect(selected).toHaveAttribute('tabindex', '0');
    selected.focus();
    fireEvent.keyDown(selected, { key: 'ArrowRight' });
    expect(document.activeElement).not.toBe(selected);
    expect(grid).toContainElement(document.activeElement as HTMLElement);
  });

  it('cenário "mais difícil" mostra empates sem inventar desempate', async () => {
    await openSimulator();
    const grid = screen.getByRole('grid', { name: /Seus resultados nas etapas restantes/ });
    fireEvent.click(within(grid).getByRole('button', { name: /etapa 4: 1º lugar, etapa 5: 1º lugar\./ }));
    fireEvent.click(screen.getByRole('radio', { name: /Mais difícil para você/ }));
    expect(screen.getByText('Mais difícil para você', { selector: 'strong' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Classificação final projetada' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    // no pior caso de quem vence as duas etapas, Rafael empata com Lucas em 31 pts: o empate é
    // sinalizado nas duas linhas (e não resolvido por uma regra inventada)
    const lucasRow = within(list).getAllByRole('listitem').find((li) => li.textContent?.includes('Lucas Ferreira'))!;
    expect(within(lucasRow).getByLabelText(/Posição \d+, empatado/)).toBeInTheDocument();
    expect(within(list).getAllByLabelText(/empatado/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/o regulamento ainda não define o desempate/)).toBeInTheDocument();
  });

  it('ajuste manual troca pilotos de lugar, nunca repete, e vira "Personalizado"', async () => {
    await openSimulator();
    fireEvent.click(screen.getByText('Ajustar resultados dos adversários'));
    const firstSlot = screen.getByRole('combobox', { name: /Quem termina em 1º na etapa 4/ });
    const before = (firstSlot as HTMLSelectElement).value;
    const secondSlot = screen.getByRole('combobox', { name: /Quem termina em 3º na etapa 4/ });
    const target = (secondSlot as HTMLSelectElement).value;
    expect(target).not.toBe(before);

    // coloca no 1º quem estava no 3º: os dois trocam de lugar
    fireEvent.change(firstSlot, { target: { value: target } });
    expect((screen.getByRole('combobox', { name: /Quem termina em 1º na etapa 4/ }) as HTMLSelectElement).value).toBe(target);
    expect((screen.getByRole('combobox', { name: /Quem termina em 3º na etapa 4/ }) as HTMLSelectElement).value).toBe(before);
    expect(screen.getByRole('radio', { name: /Personalizado/ })).toBeChecked();

    // nenhum piloto repetido na mesma etapa
    const values = screen
      .getAllByRole('combobox')
      .filter((el) => /etapa 4/.test(el.getAttribute('aria-label') ?? ''))
      .map((el) => (el as HTMLSelectElement).value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('o simulador não existe na navegação da espectadora', async () => {
    window.location.hash = '#/espectadora';
    render(<App />);
    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' }, ready);
    expect(within(nav).queryByRole('link', { name: 'Simulador' })).not.toBeInTheDocument();
  });
});
