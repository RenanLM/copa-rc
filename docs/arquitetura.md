# Arquitetura

## 1. Stack e justificativa

| Escolha | Motivo |
| --- | --- |
| **React 19 + TypeScript + Vite** | Componentização e tipagem estática; ciclo de desenvolvimento rápido. |
| **PWA mobile-first** (HashRouter) | Roda em qualquer celular por um endereço, sem instalar nada: ideal para aplicar as missões de usabilidade com várias pessoas. Rotas por *hash* funcionam em hospedagem estática. |
| **`motion`** | Animações de layout e entrada, com suporte nativo a `prefers-reduced-motion`. |
| **CSS Modules + tokens** | Estilo local por componente; toda cor, espaçamento e duração vem de `src/styles/tokens.css`. |
| **`lucide-react`** | Conjunto único de ícones, traço consistente. |
| **Vitest + Testing Library** | Testes do domínio (regras) e da interface. |

**Portabilidade.** A pasta `src/domain` é TypeScript puro, sem React. Se o projeto precisar virar React Native, as regras, os cálculos e os dados são reaproveitados sem alteração; só a camada de telas muda.

## 2. Estrutura

```
src/
  domain/        Regras e cálculos do campeonato (sem React)
    rules.ts       OFFICIAL_RULES: 5 provas, 2 pilotos/equipe, 4 posts/prova, pontos 10-6-3-2-1
    scoring.ts     pointsForPosition
    standings.ts   classificação de pilotos e equipes, histórico, desempate configurável
    laps.ts        melhor volta, total de voltas, diferença para o vencedor
    pilot-summary.ts  tudo o que o painel de um piloto precisa
    feed.ts        limite de publicações por equipe e prova
    validation.ts  invariantes do campeonato
    model.ts       índices + classificações calculadas UMA vez
    track-geometry.ts  curva fechada da pista (Catmull-Rom) e ponto na fração da volta
    replay.ts      modelo e amostragem do replay (estado da corrida em qualquer instante)
    performance.ts indicadores de desempenho por etapa e bateria
    slot-solver.ts núcleo EXATO do simulador (só números): melhor/pior caso de pontos dos rivais
    outcomes.ts    análise de resultados do piloto (combinações de colocações) e estados
    scenario.ts    cenário hipotético e classificação projetada
    predictor.ts   liga a análise ao campeonato (horizonte, cenários prontos, edição do pódio)
  data/
    repository.ts  fronteira com a fonte de dados (hoje: demonstração)
    demo/          dados fictícios + gerador determinístico de voltas
  app/
    profiles.ts    perfis (persona + navegação): dados, não telas
    routes.tsx     liga cada item de navegação à sua tela
    providers/     carregamento dos dados e perfil atual
    shell/         barra superior, navegação inferior, seletor de perfil
  components/    Componentes compartilhados (ui/ e PilotLine)
  features/      Telas por área: home, races, standings, profile, placeholders,
                 replay (pista animada, reutilizável) e performance (gráficos)
  lib/           formatação (tempos, datas) e opções de demonstração
  styles/        tokens e CSS global
```

## 3. Fluxo de dados (uma única fonte)

```
Repository.load() → validateChampionship() → createChampionshipModel() → useModel()
                                                    │
                    classificação, histórico, índices por id (calculados uma vez)
                                                    │
        dashboards · calendário · resultados · classificação · (futuro) pista animada e simuladores
```

- Nenhuma tela calcula pontos ou posições. Elas chamam o domínio (`getPilotSeasonSummary`, `computePilotStandings`...).
- Pontos **não são armazenados** nos dados: são sempre derivados da posição de chegada.
- Melhor volta, tempo total e ritmo médio são derivados das voltas; nunca guardados à parte. Isso impede números diferentes em telas diferentes.
- Se os dados violarem uma invariante (ex.: posições repetidas, equipe sem 2 pilotos), o app mostra **"Dados indisponíveis"** em vez de uma classificação inconsistente.

## 4. Regras do campeonato

| Regra | Valor | Onde |
| --- | --- | --- |
| Número de provas | 5 | `OFFICIAL_RULES.totalRaces` (validado) |
| Pontos | 1º 10 · 2º 6 · 3º 3 · 4º 2 · 5º 1 · demais 0 | `OFFICIAL_RULES.pointsByPosition` |
| Pilotos por equipe | 2 (validado) | `OFFICIAL_RULES.pilotsPerTeam` |
| Pontos da equipe | soma dos dois pilotos | `computeTeamStandings` |
| Publicações no feed | até 4 por equipe e prova | `feed.ts` |

### Premissas e itens deliberadamente indefinidos

1. **Desempate.** O regulamento não o define, então **não foi inventado**. `DEFAULT_TIEBREAK` é vazio: pilotos com a mesma pontuação **dividem a posição** (ex.: "5º=") e a interface explica que o critério é indefinido. Existe um mecanismo opcional (`most-wins`, `finish-countback`, `best-lap`) para quando a organização definir a regra; ele não é usado por padrão e não é regra oficial.
2. **Baterias.** O enunciado pede "baterias" e "provas" mas não define a relação entre elas. Premissa: baterias são sessões cronometradas dentro da etapa; o **resultado oficial da etapa** (prova final) é dado de entrada, não derivado das baterias.
3. **Abandono (DNF).** O piloto ocupa a posição final registrada; os pontos seguem a posição.
4. **Datas.** `referenceDate` ("hoje" da demonstração) é fixa (2026-10-21) para que contagens regressivas sejam reproduzíveis.

### Race Replay (Fase 2)

O replay **não é inventado**: `buildReplay` usa o instante em que cada piloto termina cada volta, somando os tempos de volta do resultado oficial. Por isso, ao final do replay a classificação é exatamente o resultado oficial (há teste que garante isso, inclusive as diferenças de tempo).

| Vem dos dados | É ilustrativo (estimado) |
| --- | --- |
| Quando cada carro cruza a linha a cada volta; ordem de chegada; tempo final; abandonos | Posição dentro da volta (velocidade constante); ordem de largada (melhor volta nas baterias); diferença em segundos durante a corrida; volta de desaceleração após a bandeira |

- `ReplayPlayer` (sem React) guarda tempo, velocidade e estado. `advance(dt)` não depende do relógio real, então é testável. O avanço por quadro é limitado a 100 ms (sem saltos ao voltar de segundo plano).
- Os 12 carros são movidos direto no DOM a cada quadro; a lista e o cronômetro atualizam a 4 a 10 Hz (e na hora quando a ordem muda). Custo medido de amostrar e posicionar um quadro: cerca de 0,003 ms.
- O componente `RaceReplay` não conhece personas: recebe o modelo, a etapa e um piloto opcional a destacar. Será reutilizado em "Ao Vivo" na experiência da espectadora.
- `ProvenanceBadge` separa três origens que nunca se misturam: **Ao vivo** (dados reais), **Simulação ilustrativa** e **Resultado final**. O replay usa "Simulação ilustrativa" enquanto roda e "Resultado final" no cartão de encerramento (que vem da classificação oficial, não da simulação).
- `Track.layout` (opcional) são pontos de controle da pista. Sem ele, usa-se um oval genérico.

### Indicadores de desempenho (Fase 2)

Definidos em `performance.ts` e usados nos gráficos. Como as pistas têm tempos diferentes, tudo é **relativo ao mais rápido da etapa**:

| Indicador | Definição | Leitura |
| --- | --- | --- |
| Melhor volta relativa | 100 × (volta mais rápida da etapa ÷ melhor volta do piloto) | 100% = tão rápido quanto a volta mais rápida da etapa |
| Ritmo relativo | 100 × (tempo médio de volta do vencedor ÷ tempo médio do piloto) | 100% = ritmo do vencedor |
| Regularidade | Coeficiente de variação (%) das voltas 2..N da prova final | Menor = mais regular. A 1ª volta fica de fora (largada parada) |

### Race Predictor (Fase 3)

**Sem palpites.** O simulador não estima chances: ele prova, por análise exaustiva, o que é certo, o que é possível e o que é impossível. Probabilidades ficam para a Fase 5, com método e hipóteses documentados.

**Modelo.** Em cada etapa restante só as 5 primeiras posições pontuam (10, 6, 3, 2, 1), e cada piloto tem uma única colocação por etapa. Logo, o futuro é "quem recebe cada slot de pontos": um adversário recebe no máximo um slot por etapa. Para cada combinação de colocações do piloto (6 × 6 = 36 com duas etapas restantes), calcula-se:

| Medida | Definição |
| --- | --- |
| `bestShared` | menor posição possível; empates dividem a posição (como na classificação do app) |
| `bestOutright` | menor posição possível sem depender de empate |
| `worst` | maior posição possível, perdendo todos os empates |

**Estados** (função `statusOf`, para uma posição desejada P):

| Estado | Condição | Significado |
| --- | --- | --- |
| Garantida | `worst ≤ P` | vale em TODOS os resultados possíveis, mesmo perdendo todos os empates |
| Condicional | `bestOutright ≤ P < worst` | existe resultado que leva lá, mas depende dos rivais |
| Só com empate | `bestShared ≤ P < bestOutright` | só empatando; como o desempate é indefinido, não conta como conquista |
| Impossível | `bestShared > P` | nem o melhor cenário chega lá |

**Exatidão.** `slot-solver.ts` resolve duas perguntas sobre os adversários, para um limite T: quantos podem ficar acima de T no melhor caso (`minPilotsAbove`) e no pior (`maxPilotsAbove`). Os argumentos (sacrificar o de menor folga; os maiores slots vão para quem já está acima; trazer primeiro quem precisa de menos pontos) estão nos comentários do código. Como validação, os testes comparam o resultado com a **enumeração completa** de todos os resultados possíveis em 400 casos aleatórios do solver e 150 campeonatos aleatórios da análise, além de fatos derivados à mão (ex.: vencendo as duas etapas, o pior caso de Lucas é 3º). A análise completa de Lucas leva cerca de 3 ms.

**Horizonte.** `next` considera só a próxima etapa (projeção, "ainda resta N etapa"); `final` considera todas as restantes (classificação final). A mesma posição pode ter estados diferentes nos dois (ex.: o título é impossível após a etapa 4 e condicional no fim).

**Cenários.** Cada cenário = colocações do piloto (escolhidas no mapa) + comportamento dos adversários:
- *Mais favorável / Mais difícil*: são o melhor e o pior caso reais, obtidos do solver (distribuição concreta, não amostragem);
- *Rivais repetem a etapa anterior*: só ilustrativo, marcado como tal;
- *Personalizado*: edição por posição. Escolher um piloto que já está em outra posição troca os dois de lugar, então nunca há pilotos repetidos nem posições vazias.

**Limites.** Análise exata até 3 etapas restantes (`MAX_ANALYSED_RACES`); acima disso a tela explica que ainda não está disponível. Projeções nunca aplicam critérios de desempate: empatados dividem a posição e são sinalizados.

## 5. Multi-perfil

`profiles.ts` declara cada perfil como dado (persona + itens de navegação). `routes.tsx` liga cada item a uma tela. A URL carrega o perfil (`/#/piloto/...`, `/#/espectadora/...`), o que permite abrir uma missão direto no ponto desejado.

Componentes não conhecem personas. A tela de classificação recebe o piloto em destaque pelo perfil atual (`persona.pilotId`): para Lucas, a linha é destacada com "você"; para Mariana, não há destaque. Para criar um novo perfil basta uma entrada em `PROFILES` e um mapeamento em `PAGES`.

## 6. Estados do sistema e modo de demonstração

- **Carregando**: esqueleto do layout, anunciado a leitores de tela.
- **Erro**: mensagem em linguagem simples + "Tentar novamente". A barra e a navegação continuam visíveis.
- **Indisponível / em breve**: `EmptyState`, com identificação clara.
- Para avaliar esses estados: Perfil → "Avaliação de estados do sistema", ou `?sim=error` / `?sim=slow` na URL. A simulação vale uma única vez, então "Tentar novamente" funciona como numa falha de rede real.

## 7. Animações

`MotionConfig reducedMotion="user"` + tokens de duração que zeram sob `prefers-reduced-motion`. Contadores animados (`AnimatedNumber`) contam só na primeira exibição da sessão e expõem o valor final a leitores de tela.

## 8. Roadmap

| Fase | Conteúdo | Situação |
| --- | --- | --- |
| 1 | Identidade, navegação, painel de Lucas, resultados da etapa 3, classificação | **Concluída** |
| 2 | Race Replay, gráficos animados, baterias, comparativo entre etapas | **Concluída** |
| 3 | Race Predictor (simulador) | **Concluída** |
| 4 | Experiência de Mariana: início, ao vivo, resultado e pódio, feed, pilotos e equipes | Pendente |
| 5 | Probabilidades de título (cálculo determinístico, depois Monte Carlo se justificável) | Pendente |
| 6 | Missões de usabilidade, acessibilidade, desempenho | Pendente |
