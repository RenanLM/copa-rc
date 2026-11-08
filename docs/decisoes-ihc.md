# Decisões de design e critérios de IHC

Documento vivo: cada fase acrescenta as decisões relevantes. Siglas: **B&S** = critérios ergonômicos de Bastien e Scapin; **N** = heurísticas de Nielsen (N1 a N10).

## Fase 1 — Piloto

| Decisão | Onde | Critério |
| --- | --- | --- |
| Os indicadores principais (posição, pontos, distância para os vizinhos, progresso da temporada) aparecem no topo do painel, sem navegação extra. | Início | B&S Carga de trabalho; N6 Reconhecimento em vez de memorização |
| A posição é explicada em frases ("8 pts para alcançar o 2º lugar (Rafael Nunes)"), não só em números. | Início | B&S Significado dos códigos; N2 Correspondência com o mundo real |
| Navegação inferior com **ícone + rótulo** em todos os itens, destaque do item ativo e indicador animado. | Shell | B&S Condução; N1 Visibilidade do estado; N4 Consistência |
| Seletor de perfil sempre no mesmo lugar (canto superior direito), explicando que é só demonstração. | Shell | N3 Controle e liberdade; N1 |
| Selo **"Demo"** permanente na barra e texto explicativo no perfil: nada fictício parece real. | Shell, Perfil | N1; B&S Condução; honestidade da informação |
| A cor nunca é o único código: variação de posição tem seta + número; melhor volta tem texto; deltas têm texto para leitores de tela. | Classificação, Resultados | B&S Compatibilidade/Significado; acessibilidade |
| Mesma identificação de piloto (número + nome + equipe) e mesma ordem de colunas em todas as listas. | `PilotLine`, listas | B&S Homogeneidade e coerência; N4 |
| Resultados de etapas futuras **não existem**: a tela diz "Resultados em breve". | Detalhe da etapa | N5 Prevenção de erros; N1 |
| Detalhes de voltas ficam recolhidos e abrem ao toque (divulgação progressiva). | Resultado da etapa | B&S Carga de trabalho; N8 Design minimalista |
| Empates não são desfeitos por regra inventada: aparece "=" e a legenda "o regulamento ainda não define o desempate". | Classificação, Início | B&S Significado dos códigos; N1; N2 |
| "Como funciona a pontuação" disponível na própria classificação, lido das regras oficiais (sem duplicar valores). | Classificação | N10 Ajuda e documentação; N6 |
| Tela de detalhe com botão **Voltar** e retorno ao calendário; back do navegador funciona (URLs por rota). | Corridas | N3; B&S Controle explícito |
| Erro de carregamento em linguagem simples, tranquilizando ("nenhuma informação foi perdida") e com ação "Tentar novamente"; o shell permanece. | Estados | N9 Ajudar a reconhecer, diagnosticar e recuperar erros; B&S Gestão de erros |
| Carregamento com esqueleto que imita o layout final, anunciado a leitores de tela. | Estados | N1; B&S Condução |
| Rota inexistente e etapa inexistente levam a uma página amigável com caminho de volta. | Placeholders | N9; N3 |
| Alvos de toque ≥ 44 px (botões pequenos ≥ 40 px), foco visível em toda a interface, atalho "Ir para o conteúdo", foco levado ao conteúdo a cada navegação. | Global | B&S Adaptabilidade; acessibilidade |
| Movimento reduzido respeitado: transições e contadores desligam sob `prefers-reduced-motion`. Contadores animam só na 1ª exibição. | Global | B&S Adaptabilidade; N7 Flexibilidade e eficiência |
| Dark mode, tipografia condensada para números e títulos (Barlow Condensed) e corpo em Inter, com números tabulares para tempos e pontos. | Tokens | N8; B&S Compatibilidade (referência a transmissões esportivas) |
| Áreas ainda não liberadas aparecem como "Em breve — Em desenvolvimento", com descrição do que farão. | Navegação | N1; N2 |

## Fase 4 — Telemetria rápida do Lucas

| Decisão | Onde | Critério |
| --- | --- | --- |
| A última bateria registrada fica no topo do painel do piloto e também aparece no detalhe da etapa, com número de voltas, melhor volta e ritmo médio. | Início, Corridas | B&S Carga de trabalho; N1 Visibilidade do estado; N6 Reconhecimento |
| A telemetria detalhada e a comparação da melhor volta com o líder da bateria ficam em um painel inferior, acessível por um botão explícito. | Início, Corridas | B&S Condução; N7 Flexibilidade e eficiência; divulgação progressiva |
| As voltas podem ser trocadas no painel sem filtros avançados ou ações destrutivas; todos os controles novos têm área de toque de pelo menos 44 px. | Telemetria | B&S Gestão de erros; B&S Adaptabilidade |
| A melhor volta da bateria usa verde e o ritmo médio usa amarelo com texto escuro; a cor é acompanhada por rótulos textuais. | Telemetria | B&S Significado dos códigos; N1 |
| Não se exibe carga física ou alerta de bateria crítica: os dados atuais só registram voltas, não tensão nem percentual de carga. | Telemetria | N2 Correspondência com o mundo real; honestidade da informação |

## Fase 2 — Replay e desempenho

| Decisão | Onde | Critério |
| --- | --- | --- |
| A reprodução **começa pausada**, com botão grande "Reproduzir corrida". Nada se move sem o usuário pedir. | Replay | B&S Controle explícito; N3 Controle e liberdade |
| Controles sempre visíveis: reproduzir/pausar, reiniciar, velocidade (1×, 2×, 4×, 8×) e linha do tempo arrastável, com o rótulo mudando conforme o estado ("Reproduzir", "Pausar", "Reproduzir novamente"). | Replay | N1 Visibilidade do estado; N3; B&S Condução |
| Selo **"Simulação ilustrativa"** + texto "não é transmissão ao vivo nem telemetria real". No fim, o cartão traz o selo **"Resultado final"** (classificação oficial). Três origens, três selos, nunca misturados. | Replay | N1; N2 Correspondência com o mundo real; honestidade da informação |
| Cronômetro, volta atual e bandeira quadriculada em uma faixa **acima** da pista, sem cobrir o traçado. | Replay | N8 Design minimalista; B&S Carga de trabalho |
| Lucas é identificado na pista (anel + etiqueta com o número) e na lista ("você"); tocar em qualquer piloto da lista o destaca na pista. | Replay | N6 Reconhecimento em vez de memorização; B&S Condução |
| A lista reordena com animação quando há ultrapassagem; a seta ▲/▼ some depois de 1,8 s e não aparece em 8× nem ao arrastar a linha do tempo. | Replay | N1; B&S Carga de trabalho (evita ruído) |
| Leitores de tela são avisados só do que importa: mudanças de posição do piloto em foco e o fim da corrida (região `aria-live` educada). Nada de narrar o cronômetro. | Replay | Acessibilidade; N1 |
| Diferenças durante a corrida têm 1 casa decimal ("+0,9 s") e as finais 3 ("+6,116 s"): a precisão mostrada reflete o que é estimado e o que é oficial. | Replay | N2; honestidade da informação |
| Posição de chegada, tempos e pontos do cartão final vêm dos mesmos dados da tela de resultados (há teste que compara). | Replay | B&S Homogeneidade e coerência; N4 |
| Gráficos comparam etapas em **% relativa ao mais rápido da etapa**, e a nota explica "100% = …". Pistas diferentes passam a ser comparáveis. | Desempenho | N2; B&S Significado dos códigos |
| Todo gráfico tem **alternativa textual** (`role="img"` com resumo), **tabela equivalente** ("Ver dados em tabela") e seletor de etapa por teclado; o desenho nunca é o único acesso a um valor. | Desempenho | Acessibilidade; N7 Flexibilidade e eficiência |
| Cor de série fixa por entidade: o piloto em foco é sempre o destaque (lima); o comparado, sempre azul de dados. Texto nunca usa a cor da série. A legenda só aparece com 2+ séries. Par validado: separação para daltonismo (ΔE ≥ 22) e contraste ≥ 3:1. | Desempenho | B&S Homogeneidade; acessibilidade |
| Filtro "Comparar com" em **uma linha acima** dos gráficos que ele afeta, com a explicação "Vale para os gráficos de evolução e de etapas". | Desempenho | N6; N4 |
| Matriz de baterias: intensidade = proximidade do 1º, número da posição sempre escrito, cor do texto escolhida pelo maior contraste com o fundo da célula. Uma frase resume ("subiu 3 posições ao longo das baterias"). | Desempenho | B&S Significado dos códigos; acessibilidade |
| Seletores (Pontos/Posição, etapas) têm o indicador animado por CSS, sem medir layout: não "foge" quando o conteúdo acima muda de altura. | Global | N1; robustez |
| Movimento reduzido: o replay não anima traçado, curvas e pontos de entrada; a reprodução só ocorre por ação do usuário. | Global | B&S Adaptabilidade |
| Atalhos nos lugares onde a pergunta nasce: "Rever a corrida" no cartão da última etapa, "Ver replay da corrida" no resultado e "Ver análise" na evolução do painel. | Início, Corridas | N7; B&S Condução |

## Fase 3 — Simulador (Race Predictor)

| Decisão | Onde | Critério |
| --- | --- | --- |
| A tela responde primeiro à pergunta do piloto ("dá para chegar ao 2º?") com um **veredito** logo abaixo da escolha, e só depois detalha o que precisa acontecer. A posição desejada começa na próxima acima da atual e o mapa já vem posicionado no resultado **mais barato** que atende. | Simulador | B&S Carga de trabalho; N7 Flexibilidade e eficiência |
| Quatro estados com aparência **diferente em forma, borda e ícone**, nunca só cor: *Garantida* (cheia, sólida, escudo), *Condicional* (tracejada, círculo tracejado), *Só com empate* (pontilhada, sinal de igual), *Impossível* (apagada, proibido). | Simulador | B&S Significado dos códigos; acessibilidade |
| Só se chama de **garantida** o que vale em todos os resultados possíveis, mesmo perdendo todos os empates. O texto diz "Comprovado" e explica como. Nada de "provável" ou percentuais. | Veredito | N1; honestidade da informação; requisito do enunciado |
| Cada botão de posição já mostra o estado dela (ícone + nome acessível), dando o panorama sem abrir nada. Há legenda dos quatro estados. | Escolha da posição | N6 Reconhecimento em vez de memorização |
| **Mapa de resultados**: grade das combinações das suas colocações nas duas etapas restantes, cada célula com estado e pontos somados; toque aplica o cenário. Setas do teclado navegam; só uma célula entra na ordem de tabulação. | Seus resultados | N7; B&S Controle explícito; acessibilidade |
| **Projeção ≠ resultado final**: seletor "Após a etapa 4" × "Fim do campeonato", com selo próprio ("Projeção" × "Final"), título distinto e o aviso "isto não é a classificação final". A mesma posição pode mudar de estado entre os dois. | Horizonte, classificação | N1; N2 Correspondência com o mundo real |
| Cenários prontos dos adversários com nome e descrição: *Mais favorável* e *Mais difícil* (extremos reais, calculados), *Rivais repetem a etapa anterior* marcado como **Ilustrativo**. | Adversários | N2; N6; B&S Significado dos códigos |
| Ajuste manual por posição com listas nativas. Escolher quem já está em outra posição **troca os dois de lugar**: é impossível repetir piloto (prevenção de erro em vez de mensagem de erro). A opção "Personalizado" aparece sozinha quando o usuário edita. | Adversários | N5 Prevenção de erros; B&S Gestão de erros; N1 |
| Empates na projeção ficam como empates ("2º=", "empatado: o desempate é indefinido") e a legenda explica. Nenhum critério é inventado. | Classificação projetada | B&S Significado dos códigos; N1 |
| A classificação projetada reordena com animação (e mostra seta de variação e pontos ganhos), e uma frase resume o resultado do piloto neste cenário. | Classificação projetada | N1; B&S Condução |
| Seção "Como calculamos" recolhida, em linguagem simples, explicando que são todos os resultados possíveis e que o simulador não estima chances. | Rodapé | N10 Ajuda e documentação |
| Estados de erro: campeonato encerrado, análise indisponível (muitas etapas restantes) e piloto não encontrado têm mensagem e caminho de volta. | Simulador | N9; B&S Gestão de erros |

## Fase 4 — Espectadora

| Decisão | Onde | Critério |
| --- | --- | --- |
| Início como guia rápido: situa a etapa e oferece ações diretas para ver quem lidera, acompanhar a corrida, abrir o feed ou encontrar participantes. | Início | B&S Carga de trabalho; N6 Reconhecimento em vez de memorização; N7 Flexibilidade e eficiência |
| A barra inferior mantém ícone e rótulo, com "Pilotos" em vez do nome longo "Pilotos e Equipes" para caber melhor na tela estreita; o destino ainda permite alternar entre as duas listas. | Navegação | B&S Condução; N1 Visibilidade do estado; N4 Consistência |
| A aba "Ao Vivo" apresenta a etapa em andamento como **simulação**: selo "Simulação ilustrativa", pílula neutra "Simulação em andamento" (nunca "ao vivo" em vermelho, que lembraria uma transmissão) e aviso de que posições, tempos e ultrapassagens são fictícios. A pessoa controla a simulação (pausar, reiniciar, velocidade, ir para o final); ela não reinicia sozinha e termina no resultado oficial. | Guia de pista | B&S Controle explícito; N1 Visibilidade do estado; N2 Correspondência com o mundo real; honestidade da informação |
| Os carros percorrem o traçado real desenhado para a etapa; cores das equipes, números dos carros e seleção no placar ajudam a localizar cada participante. | Guia de pista | N6 Reconhecimento em vez de memorização; B&S Significado dos códigos |
| O placar mostra posição, nome, equipe, diferença estimada para o líder e volta; as linhas reordenam com animação, e setas indicam subida/descida. O controle permite pausar e retomar a simulação. | Guia de pista | B&S Carga de trabalho; N1; N3 Controle e liberdade; N8 Design minimalista |
| A simulação fica identificada visualmente e é apresentada como conteúdo fictício; não se mistura com resultados finais nem com a classificação do campeonato. | Guia de pista | N1; N2 Correspondência com o mundo real; honestidade da informação |
| Cor da equipe ajuda a reconhecer o carro, mas vem sempre junto de nome, número ou texto; a cor nunca é o único identificador. | Placar, Feed, Diretório | B&S Significado dos códigos; N6 Reconhecimento em vez de memorização; acessibilidade |
| Ilustrações geradas pela interface têm rótulo próprio e não se passam por fotos ou publicações reais. O carrossel "Em destaque" foi retirado: repetia as mesmas publicações da lista e escondia conteúdo atrás de uma rolagem lateral. Veja a seção "Feed das equipes" abaixo. | Feed | B&S Condução; Gestalt — Continuidade e Fechamento; N1; honestidade da informação |
| Diretório permite alternar entre pilotos e equipes e pesquisar nomes, equipe, cidade e número sem exigir memorização de identificadores. | Pilotos | N6 Reconhecimento em vez de memorização; N7 Flexibilidade e eficiência |
| A classificação compartilhada explica pontos acumulados em linguagem de espectadora e mantém a opção entre pilotos e equipes. | Classificação | B&S Compatibilidade; N2; N6 |
| Busca, filtros e cartões têm rótulos explícitos, feedback de lista vazia e alvos de toque de pelo menos 44 px. | Feed, Diretório | B&S Condução e Gestão de erros; N1; acessibilidade |

## Fase 4 — Etapa 4, pódio e momentos do campeonato

| Decisão | Onde | Critério |
| --- | --- | --- |
| Um **momento do campeonato** único (após a etapa 3, etapa 4 em andamento, após a etapa 4) alimenta todas as telas. Piloto e espectadora veem os mesmos números; o padrão de cada perfil conta a sua história (Lucas após a etapa 3, Mariana com a etapa 4 em andamento). | Folha de perfil, todo o app | B&S Homogeneidade e coerência; N4 Consistência e padrões |
| O seletor de momento fica na folha de perfil, com o estado atual escrito ("Agora: …"), e vale só para a sessão. | Folha de perfil | N1 Visibilidade do estado; N3 Controle e liberdade |
| Ao terminar a simulação, **um botão explícito** ("Ver resultado e pódio") leva ao resultado; nada muda sozinho enquanto a pessoa assiste. | Ao Vivo | B&S Controle explícito; N3 |
| O pódio é revelado do 3º para o 1º, como numa premiação, com medalha sempre acompanhada de número, texto ("Lugar 1, medalha de ouro") e pontos. Há botão "Rever" e, com movimento reduzido, tudo aparece de uma vez. Ordem de leitura 1º-2º-3º para leitores de tela, ordem visual 2º-1º-3º. | Resultado da etapa | B&S Significado dos códigos; Adaptabilidade; acessibilidade |
| "Destaques da etapa" em frases curtas, sem jargão ("Dobradinha da Vortex", "Nova liderança do campeonato"). A liderança só é anunciada quando é inequívoca antes e depois: não se conta empate como conquista. | Resultado da etapa | N2; B&S Significado dos códigos; honestidade da informação |
| "Como ficou o campeonato" mostra a classificação **antes** e reordena as linhas até a **depois**, com setas e pontos somados, só quando o quadro aparece na tela; "Rever" repete. | Resultado da etapa | N1; B&S Condução (feedback imediato) |
| A classificação da etapa mostra os pontos de cada posição (só as 5 primeiras pontuam, dito na tela) e abre as voltas ao toque. | Resultado da etapa | B&S Carga de trabalho (divulgação progressiva); N6 |
| O início da espectadora mostra o **status** da etapa (Agendada, Em andamento, Finalizada) com selo, o resultado resumido quando acabou de terminar, o próximo evento, os líderes e "Como funciona o campeonato" com os valores lidos das regras. Status de etapa em andamento diz "Em andamento", não "Ao vivo". | Início da espectadora | N1; N2; N10 Ajuda e documentação |
| Em telas estreitas a palavra "Championship" sai da barra superior para que o selo "Demo" nunca fique coberto: é a pista permanente de que os dados são fictícios. | Barra superior | N1; honestidade da informação |

## Fase 4 — Feed das equipes

Tarefa do enunciado: *encontrar as publicações de uma equipe durante a terceira etapa*.

| Decisão | Onde | Critério |
| --- | --- | --- |
| Dois filtros que **se combinam**: equipe e etapa. Cada opção é um botão com o estado marcado (`aria-pressed`), e a tarefa se resolve em dois toques (equipe, depois etapa). | Feed | B&S Condução; N7 Flexibilidade e eficiência; N6 Reconhecimento em vez de memorização |
| Cada filtro tem um rótulo próprio ("Equipe", "Etapa") e a primeira opção é sempre "Todas as…", que desfaz o filtro. "Limpar filtros" só aparece quando há filtro. | Feed | N3 Controle e liberdade; B&S Controle explícito |
| Uma linha de resumo anuncia o resultado a cada mudança ("4 publicações · Torque Lab · etapa 3", ou "Mostrando 8 de 45"), em região de status para leitores de tela. | Feed | N1 Visibilidade do estado; B&S Feedback imediato |
| **Estado vazio explicado**: "Aurora Speed não tem publicações na etapa 2", com dois caminhos de volta ("Ver todas as etapas de Aurora Speed" e "Limpar filtros"). Nunca uma lista em branco. | Feed | N9 Ajudar a reconhecer e se recuperar de erros; B&S Gestão de erros |
| A regra de **4 publicações por equipe e etapa** é mostrada ao escolher uma equipe: "2 de 4" por etapa, barras de uso e o texto "limite atingido" (nunca só a cor). O limite vem do domínio e é verificado na validação dos dados. | Feed | N1; N10 Ajuda e documentação; B&S Significado dos códigos |
| O feed mostra só o que já existe no **momento do campeonato**: após a etapa 3 não há nada sobre a etapa 4, e durante a etapa 4 não há resumos de resultado antes de ela acabar. Os resumos de resultado são gerados dos resultados oficiais. | Feed, dados | N2 Correspondência com o mundo real; honestidade da informação; B&S Homogeneidade e coerência |
| Cada cartão mostra equipe (nome e cor), etapa (número e nome), tipo em texto com ícone (Resultado, Acontecimento, Pilotos, Bastidores), **data e hora quando existem** (nada é inventado quando faltam), título, texto e pilotos citados. | Feed | N6; B&S Significado dos códigos; Gestalt — Proximidade |
| **Selo "Demonstração" em cada publicação**, além do aviso no topo e do rótulo "Arte demonstrativa" na ilustração, para o conteúdo não ser confundido com publicações reais mesmo quando um cartão aparece isolado. | Feed | Honestidade da informação; N1 |
| Lista paginada em lotes de 8 com "Mostrar mais publicações (n)" informando quantas faltam; trocar de filtro volta ao primeiro lote. Mais recentes primeiro. | Feed | B&S Carga de trabalho; N7 |
| As etapas **quebram de linha** (são poucas) e as equipes rolam de lado com o fim esmaecido, para não gastar a tela do celular; nenhuma opção fica fora do alcance. Alvos de pelo menos 44 px. | Feed | B&S Carga de trabalho; acessibilidade |

## Pendências para as próximas fases

- Conectar telemetria autorizada para substituir a simulação acadêmica pelo placar realmente ao vivo, informando atualização e perda de sinal.
- Substituir posts e ilustrações de exemplo por publicações e imagens fornecidas pelas equipes, com autoria; a data e a hora já são exibidas quando existem.
- Definir com a organização o que acontece quando uma equipe tenta passar de 4 publicações por etapa (a interface só exibe a cota; quem publica ainda não existe no aplicativo).
- Testar com usuários se dois filtros em chips bastam ou se a espectadora espera também buscar por texto ou por piloto.
- Revisar contraste dos textos terciários (`--text-3`) na Fase 6.
- Validar a navegação e os fluxos da Mariana em teste de usabilidade na arquibancada, incluindo tela pequena, brilho alto e ruído.
- Avaliar em teste com usuários se a pista animada precisa de números nos carros (hoje só o piloto em foco e o selecionado têm etiqueta).
- Habilitar tooltip por foco/toque nos pontos dos gráficos (hoje os valores estão em rótulos, na leitura da etapa e na tabela equivalente).
- Missões de usabilidade (Fase 6): persona, contexto, objetivo e critério de sucesso, sem passo a passo.
