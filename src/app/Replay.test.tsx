import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setScenarioChoice } from '@/lib/demo-scenario';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  setScenarioChoice('auto');
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => cleanup());

function open(hash: string) {
  window.location.hash = hash;
  render(<App />);
}

describe('atalhos para replay e desempenho', () => {
  it('o painel oferece os dois atalhos', async () => {
    open('#/piloto');
    await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    expect(screen.getByRole('link', { name: /Rever a corrida/ })).toHaveAttribute(
      'href',
      '#/piloto/corridas/etapa-3/replay',
    );
    expect(screen.getByRole('link', { name: /Ver análise/ })).toHaveAttribute('href', '#/piloto/desempenho');
  });

  it('o resultado da etapa oferece o atalho para o replay', async () => {
    open('#/piloto/corridas/etapa-3');
    await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready);
    expect(screen.getByRole('link', { name: /Ver replay da corrida/ })).toHaveAttribute(
      'href',
      '#/piloto/corridas/etapa-3/replay',
    );
  });
});

describe('Race Replay', () => {
  it('é identificado como simulação ilustrativa e começa pausado', async () => {
    open('#/piloto/corridas/etapa-3/replay');
    expect(await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready)).toBeInTheDocument();
    expect(screen.getAllByText('Simulação ilustrativa').length).toBeGreaterThan(0);
    expect(screen.getByText(/Não é uma transmissão ao vivo nem telemetria real/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reproduzir corrida' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Linha do tempo da corrida' })).toHaveValue('0');
    expect(screen.queryByRole('region', { name: /Resultado final/ })).not.toBeInTheDocument();
  });

  it('reproduz, pausa e reinicia com controles explícitos', async () => {
    open('#/piloto/corridas/etapa-3/replay');
    await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready);

    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir corrida' }));
    const pause = await screen.findByRole('button', { name: 'Pausar' });
    expect(screen.queryByRole('button', { name: 'Reproduzir corrida' })).not.toBeInTheDocument();

    fireEvent.click(pause);
    expect(await screen.findByRole('button', { name: 'Reproduzir' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar do começo' }));
    expect(await screen.findByRole('button', { name: 'Pausar' })).toBeInTheDocument();
  });

  it('altera a velocidade pelo seletor', async () => {
    open('#/piloto/corridas/etapa-3/replay');
    await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready);
    const speeds = screen.getByRole('radiogroup', { name: 'Velocidade da reprodução' });
    expect(within(speeds).getByRole('radio', { name: '4×' })).toBeChecked();
    fireEvent.click(within(speeds).getByRole('radio', { name: '8×' }));
    expect(within(speeds).getByRole('radio', { name: '8×' })).toBeChecked();
  });

  it('ao final mostra o resultado oficial, igual ao da tela de resultados', async () => {
    open('#/piloto/corridas/etapa-3/replay');
    await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready);

    const slider = screen.getByRole('slider', { name: 'Linha do tempo da corrida' });
    fireEvent.change(slider, { target: { value: slider.getAttribute('max') } });

    const final = await screen.findByRole('region', { name: /Resultado final/ });
    const rows = within(final).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Diego Martins');
    expect(rows[0]).toHaveTextContent('+10');
    expect(rows[2]).toHaveTextContent('Lucas Ferreira');
    expect(rows[2]).toHaveTextContent('+3');
    expect(within(final).getByRole('link', { name: 'Ver resultado completo' })).toHaveAttribute(
      'href',
      '#/piloto/corridas/etapa-3',
    );

    const live = screen.getByRole('list', { name: 'Classificação ao vivo' });
    const first = within(live).getAllByRole('listitem')[0]!;
    expect(first).toHaveTextContent('Diego Martins');
    expect(first).toHaveTextContent('Vencedor');
  });

  it('permite destacar um piloto na pista pela classificação', async () => {
    open('#/piloto/corridas/etapa-3/replay');
    await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready);
    const live = screen.getByRole('list', { name: 'Classificação ao vivo' });
    const row = within(live).getAllByRole('button')[0]!;
    expect(row).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-pressed', 'false');
  });

  it('etapa futura não tem replay e explica o motivo', async () => {
    open('#/piloto/corridas/etapa-4/replay');
    expect(await screen.findByText('Replay indisponível', {}, ready)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reproduzir corrida' })).not.toBeInTheDocument();
  });
});

describe('Desempenho', () => {
  it('reúne evolução, comparativo entre etapas e baterias', async () => {
    open('#/piloto/desempenho');
    expect(await screen.findByRole('heading', { name: 'Desempenho' }, ready)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evolução no campeonato' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comparativo entre etapas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Baterias e prova final' })).toBeInTheDocument();
    // cada gráfico tem alternativa textual e tabela equivalente
    expect(screen.getAllByRole('img', { name: /Os mesmos valores estão na tabela abaixo/ })).toHaveLength(2);
    expect(screen.getAllByText('Ver dados em tabela')).toHaveLength(2);
  });

  it('a legenda só aparece ao comparar com outro piloto', async () => {
    open('#/piloto/desempenho');
    await screen.findByRole('heading', { name: 'Desempenho' }, ready);
    expect(screen.queryByRole('list', { name: 'Legenda' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Comparar com'), { target: { value: 'rafael-nunes' } });
    const legends = await screen.findAllByRole('list', { name: 'Legenda' });
    expect(legends).toHaveLength(2);
    expect(within(legends[0]!).getByText('Lucas Ferreira')).toBeInTheDocument();
    expect(within(legends[0]!).getByText('Rafael Nunes')).toBeInTheDocument();
  });

  it('alterna a medida do gráfico de evolução', async () => {
    open('#/piloto/desempenho');
    await screen.findByRole('heading', { name: 'Desempenho' }, ready);
    expect(screen.getByText('Pontos acumulados após cada etapa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Posição' }));
    expect(screen.getByText(/Posição no campeonato após cada etapa/)).toBeInTheDocument();
  });

  it('a matriz de baterias mostra as posições de Lucas na etapa 3', async () => {
    open('#/piloto/desempenho');
    await screen.findByRole('heading', { name: 'Baterias e prova final' }, ready);
    const table = screen.getByRole('table', { name: /Posição em cada bateria/ });
    const row = within(table).getByRole('row', { name: /Etapa 3/ });
    expect(row).toHaveTextContent('4º');
    expect(row).toHaveTextContent('1º');
    expect(screen.getByText(/subiu 3 posições ao longo das baterias/)).toBeInTheDocument();
  });
});
