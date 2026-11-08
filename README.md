# RC Championship

Aplicativo mobile de acompanhamento de um campeonato de corridas de carros por controle remoto (RC), com duas experiências sobre os mesmos dados:

| Perfil | Persona | Situação |
| --- | --- | --- |
| Piloto | Lucas Ferreira, 24 anos, estudante de Engenharia | **Fases 1 a 3 entregues** (início, corridas, replay, desempenho, simulador, classificação, perfil) |
| Espectadora | Mariana Costa, 29 anos, designer gráfica | Início, simulação ao vivo, resultado e pódio da etapa 4, classificação, feed por equipe e etapa (com a regra de 4 publicações) e diretório implementados; telemetria e publicações reais pendentes |

> Todos os dados são **de demonstração** (pessoas, equipes, pistas, datas e tempos fictícios). O aplicativo sinaliza isso na interface.

## Como executar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev        # http://localhost:5173
```

Abra no celular (mesma rede, endereço "Network" exibido pelo Vite) ou use o modo responsivo do navegador.

| Endereço | O que abre |
| --- | --- |
| `/#/piloto` | Experiência de Lucas (piloto) |
| `/#/piloto/corridas/etapa-3/replay` | Race Replay da etapa 3 (pista animada) |
| `/#/piloto/desempenho` | Gráficos de evolução, comparativo entre etapas e baterias |
| `/#/piloto/simulador` | Race Predictor: posição desejada, o que precisa acontecer e classificação projetada |
| `/#/espectadora` | Experiência de Mariana (espectadora) |
| `/#/espectadora/etapa/etapa-4` | Resultado e pódio da etapa 4 (só existe a partir do momento "após a etapa 4") |
| `/?momento=apos-etapa-4#/piloto` | Abre o app no momento "após a etapa 4" (outros: `apos-etapa-3`, `etapa-4-em-andamento`) |
| `/?sim=error#/piloto` | Simula falha no primeiro carregamento (estado de erro) |
| `/?sim=slow#/piloto` | Simula carregamento lento (estado de carregamento) |

O seletor de perfil fica no canto superior direito e também escolhe o **momento do campeonato** (após a etapa 3, etapa 4 em andamento, após a etapa 4). O piloto começa após a etapa 3 e a espectadora, com a etapa 4 em andamento; a escolha vale só para a sessão. Não há autenticação.
O tema claro é o padrão para facilitar a leitura ao ar livre; use o botão de sol/lua na barra superior para alternar entre os temas. A escolha fica salva neste dispositivo.

## Scripts

```bash
npm test           # testes de domínio, dados, formatação e interface
npm run typecheck  # verificação de tipos
npm run build      # build de produção em dist/
```

## Documentação

- [docs/arquitetura.md](docs/arquitetura.md) — stack, estrutura, fluxo de dados, regras do campeonato, premissas e roadmap.
- [docs/decisoes-ihc.md](docs/decisoes-ihc.md) — decisões de design mapeadas aos critérios de Bastien e Scapin e às heurísticas de Nielsen.
- [docs/Decisões Técnicas - IHC Trabalho Final.pdf](docs/Decisões%20Técnicas%20-%20IHC%20Trabalho%20Final.pdf) — personas, cenários e abordagem de interface do trabalho.
