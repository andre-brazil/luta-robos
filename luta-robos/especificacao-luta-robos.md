# Especificação de Desenvolvimento — Luta de Robôs 3D (Web)

**Nome de trabalho:** Luta de Robôs 3D
**Gênero:** Jogo de luta 1 contra 1, visão lateral (2.5D)
**Plataforma:** Navegador web desktop (Chrome, Firefox, Edge)
**Estilo visual:** Low poly, paleta neon/cyberpunk
**Modo principal:** Jogador (P1) vs. Robô controlado pela IA do jogo
**Modo secundário (opcional):** Jogador vs. Jogador local, usando o mapeamento do Player 2

---

## 1. Visão Geral

Jogo de luta 3D com câmera lateral, em que dois robôs low poly se enfrentam em uma rua de cidade futurista. O combate se dá em um plano 2D (deslocamento apenas para esquerda/direita e pulo), com renderização 3D, animações articuladas e sistema de golpes com hitbox/hurtbox. Cada robô inicia com 100 pontos de vida, exibidos em barras vermelhas no topo da tela.

### 1.1 Premissas e Decisões de Design (assunções documentadas)

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | A **rasteira** é executada com **Agachar + Chute** (ex.: P1: `K` + `C`) | Nenhuma tecla dedicada foi definida; combinação "baixo + chute" é o padrão do gênero |
| 2 | O modo principal é **P1 vs. IA**, conforme nota no briefing ("o outro robô é controlado pela lógica do jogo"); os controles do Player 2 ficam disponíveis em modo 2 jogadores local | Une os itens 1 e 2 do briefing com a nota final |
| 3 | O dano de um golpe só é aplicado **se o oponente não estiver bloqueando** (regra extraída da nota do briefing) | Interpreta a frase "caso o oponente do jogador não esteja bloqueio(ndo), o chute..." como regra geral de dano |
| 4 | Bloqueio nega **100% do dano** e impede movimento, exatamente conforme briefing | Requisito explícito |
| 5 | **Energia** é o recurso consumido pelos golpes (não pelo bloqueio), com regeneração contínua | Dá função ao atributo "Energia" sem contradizer a regra do bloqueio |

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Renderização 3D | **Three.js** (WebGL), malhas low poly (primitivas compostas ou modelos GLB otimizados) |
| Linguagem | JavaScript ES Modules (recomendado TypeScript) |
| Build | Vite (dev server + build estático) |
| Física | Módulo próprio leve: gravidade, AABB/caixas de colisão (nenhum motor de física completo é necessário) |
| Animação | Interpolação procedural das articulações dos robôs (pivot groups) ou AnimationMixer com clips GLB |
| Áudio | WebAudio API (sons sintetizados ou arquivos OGG leves) |
| Deploy | Build estático servido em qualquer hospedagem web |

---

## 3. Câmera e Perspectiva

- Câmera posicionada **lateralmente** ao plano de luta, olhando para os robôs (visão de lado, estilo Street Fighter em 3D).
- Projeção em perspectiva com FOV baixo (~30–40°) para leitura clara da arena; alternativa ortográfica aceitável.
- Os robôs movem-se apenas nos eixos **X** (esquerda/direita) e **Y** (pulo). O eixo Z é travado no plano da arena.
- **Zoom dinâmico:** a câmera se afasta quando os robôs se separam e se aproxima quando estão perto, mantendo ambos visíveis.
- Leve varredura (sway) vertical para acompanhar pulos altos.

---

## 4. Cenário

Cenário futurista noturno, puramente decorativo (sem colisão, exceto limites da arena):

- **Rua:** asfalto escuro com faixas pintadas, calçadas nas bordas; é o plano onde os robôs lutam.
- **Prédios:** skyline low poly ao fundo, com janelas emissivas (textura ou cores variadas) sugerindo cidade viva.
- **Postes:** postes de luz ao longo da rua, com pontos de luz e cones de iluminação.
- **Extras opcionais:** letreiros neon, fios, letreiro holográfico, céu escuro com estrelas/nuvens poligonais, leve neblina para profundidade.
- **Iluminação:** luz ambiente azulada + luz direcional principal com sombras simples (shadow map único) + pontos de luz dos postes.
- **Limites da arena:** paredes invisíveis nas extremidades da rua; robôs não podem sair do cenário.

---

## 5. Personagens (Robôs)

Dois robôs low poly com silhueta e paleta distintas (ex.: P1 azul, oponente vermelho/laranja).

### 5.1 Construção do modelo

- Corpo articulado montado hierarquicamente (pivot groups): torso, cabeça, ombros, braços (cotovelo), quadril, pernas (joelho).
- Estética low poly: poucos polígonos, faces planas, cores sólidas com material flat/lambert, detalhes em emissivo (olhos, núcleo, juntas).

### 5.2 Animações obrigatórias (estados)

| Animação | Descrição |
|----------|-----------|
| `idle` | Pose de combate com respiro |
| `andar` | Locomoção lateral (esquerda/direita) |
| `agachar` | Pose baixa, de guarda baixa |
| `pular` | Impulsão, ar e aterrissagem |
| `soco` | Golpe rápido de braço |
| `chute` | Golpe lento de perna |
| `rasteira` | Deslize baixo com perna estendida |
| `bloqueio` | Pose defensiva (braços cruzados/escudo) |
| `hit` | Reação ao ser atingido |
| `caída` / `levantar` | Derrubado pela rasteira e recuperação |
| `ko` | Derrota (desligar/desmontar) |
| `vitória` | Pose de vitória (opcional) |

---

## 6. Atributos dos Robôs

Cada robô possui os seguintes atributos (valores base tunáveis em `config`):

| Atributo | Valor base | Efeito no gameplay |
|----------|-----------|--------------------|
| **Vida** | 100 | Pontos de vida; ao chegar a 0, o robô é derrotado |
| **Força** | 10 | Multiplicador de dano: `dano = dano_base × (Força / 10)` |
| **Velocidade** | 10 | Velocidade de deslocamento: `v = v_base × (Velocidade / 10)`; afeta levemente a cadência dos golpes |
| **Resistência** | 10 | Reduz dano recebido em percentual: `redução = Resistência × 0.5%` (máx. 20%) |
| **Energia** | 100 | Recurso consumido pelos golpes; regenera 10 pontos/segundo; sem energia, golpes não são executados |
| **Armadura** | 0 | Redução fixa de dano por golpe recebido (mínimo de 1 ponto de dano sempre é aplicado) |

### 6.1 Fórmula de dano

```
dano_final = máx(1, (dano_base × Força/10) × (1 − Resistência×0.005) − Armadura)
```

Bloqueio: `dano_final = 0` (regra absoluta — ver §7.4).

### 6.2 Custo de energia por golpe

| Golpe | Custo |
|-------|-------|
| Soco | 8 |
| Chute | 15 |
| Rasteira | 12 |

---

## 7. Controles e Ações

### 7.1 Player 1 (obrigatório)

| Tecla | Ação | Tipo de acionamento |
|-------|------|---------------------|
| `J` | Mover para esquerda | Segurar |
| `L` | Mover para direita | Segurar |
| `K` | Agachar | Segurar |
| `I` | Pular | Pressionar |
| `C` | Chute | Pressionar |
| `X` | Soco | Pressionar |
| `Z` | Bloqueio | Segurar |
| `K` + `C` | Rasteira | Agachado + chute |

### 7.2 Player 2 (modo 2 jogadores local)

| Tecla | Ação | Tipo de acionamento |
|-------|------|---------------------|
| `4` (numpad ou topo) | Mover para esquerda | Segurar |
| `6` | Mover para direita | Segurar |
| `5` | Agachar | Segurar |
| `8` | Pular | Pressionar |
| `Del` | Chute | Pressionar |
| `End` | Soco | Pressionar |
| `Page Down` | Bloqueio | Segurar |
| `5` + `Del` | Rasteira | Agachado + chute |

> Recomenda-se aceitar tanto o teclado numérico quanto as teclas do topo, registrando o código físico da tecla (`event.code`).

### 7.3 Ações de movimento

- **Andar:** deslocamento no eixo X pela velocidade calculada no §6.
- **Agachar:** trava o movimento horizontal; muda o hurtbox para a posição baixa.
- **Pular:** impulso vertical com gravidade; o robô pode se mover no ar; ao aterrissar, breve recuperação.
- **Bloqueio:** conforme §7.4. Não permite movimento (nem pulo).
- Somente uma ação de ataque por vez; ataques cancelam o movimento horizontal.

### 7.4 Regras de combate

| Golpe | Dano base | Velocidade | Startup | Alcance | Efeito especial |
|-------|-----------|------------|---------|---------|-----------------|
| **Soco** | −5 | Rápido | 0,25 s | Curto | Hitstun leve |
| **Chute** | −10 | Lento | 0,70 s | Médio | Empurrão maior |
| **Rasteira** | −7 | Normal | 0,50 s | Baixo/Curto | **Derruba o oponente**; só atinge quem está em pé ou agachado (não atinge quem está pulando) |
| **Bloqueio** | 0 | — | Instantâneo | — | **Nega qualquer dano**; impede movimento; sofre leve empurrão ao bloquear |

#### Regras de aplicação de dano

1. Um golpe só causa dano **se o oponente não estiver bloqueando** no momento do impacto.
2. Um golpe conecta quando sua **hitbox** atinge a **hurtbox** do oponente (verificação AABB por frame ativo do golpe).
3. Robôs se orientam automaticamente um para o outro (frente a frente).
4. **Rasteira derruba:** oponente sofre `caída` + `levantar` (invulnerável durante a queda), criando vantagem tática para o atacante.
5. Bloqueio estando em pé bloqueia soco e chute; para bloquear rasteira é preciso estar agachado (exceção: robô já agachado mantém bloqueio válido). 
6. Sem dano de "golpe duplo": um mesmo ataque acerta uma única vez.
7. Hitstop de ~80 ms e leve shake de câmera no impacto (game feel).
8. Personagens não se atravessam: corpos colidem por AABB (empurram levemente).

---

## 8. Interface (HUD)

- **Topo da tela:** duas **barras de vida vermelhas**, uma por robô, espelhadas (P1 à esquerda, oponente à direita).
  - Iniciam cheias, representando **100 pontos de vida**; o preenchimento diminui da cor vermelha para o lado interno (efeito de dreno), opcionalmente com faixa branca de "dano recente" que demora a esvaziar.
  - Identificação visual de cada robô (nome/cor) ao lado da barra.
- **Barra de energia** (exibida abaixo da barra vida): exibe o atributo Energia do §6 na cor azul azul.
  - Inicia cheia, representando **100 pontos de energia**; o tamanho diminui da cor azul para o lado interno (efeito de dreno).
- **Indicadores de estado**: ícone de bloqueio quando ativo.
- **Mensagens de fim:** "K.O.", "Vitória do Jogador 1", "Vitória da IA", com tela de reinício.
- **Timer de round** (ex.: 99 segundos); ao zerar, vence quem tiver mais vida.

---

## 9. Inteligência Artificial do Oponente

O robô oponente é controlado pela lógica do jogo. Implementação recomendada: **máquina de estados com decisão por utilidade**.

### 9.1 Estados da IA

| Estado | Comportamento |
|--------|---------------|
| `aproximar` | Andar na direção do jogador até entrar em alcance |
| `recuar` | Afastar-se após atacar ou quando em desvantagem de vida |
| `atacar` | Escolher golpe conforme distância e estado do jogador |
| `bloquear` | Reação defensiva a golpes do jogador |
| `punir` | Atacar imediatamente após o jogador errar/errar o bloqueio |
| `agachar` | Esquivar de golpes altos / preparar rasteira |

### 9.2 Sensores de decisão

- Distância até o jogador (perto/médio/longe).
- Vida própria vs. vida do jogador.
- Energia disponível (só ataca se houver energia suficiente).
- Estado do jogador: atacando (startup), em hitstun, bloqueando, agachado, no ar.

### 9.3 Política de golpes (exemplos)

- Perto + jogador em hitstun → chute (−10) para máximo dano.
- Médio/longe → aproximar; se jogador bloqueia muito → rasteira.
- Jogador pulando → aguardar/posicionar; rasteira não acerta quem está no ar.

### 9.4 Níveis de dificuldade

| Dificuldade | Tempo de reação | Frequência de bloqueio | Agressividade |
|-------------|-----------------|------------------------|---------------|
| Fácil | 500 ms | 20% | Baixa |
| Normal | 300 ms | 45% | Média |
| Difícil | 150 ms | 70% | Alta |

---

## 10. Fluxo do Jogo

1. **Tela inicial:** título + "Pressione Enter" + seleção de dificuldade.
2. **Round:** luta até um dos robôs chegar a 0 de vida (ou timeout).
3. **K.O.:** animação de derrota do perdedor, mensagem na tela.
4. **Resultado:** tela de vitória/derrota com opção de revanche (`Enter`) ou voltar ao menu (`Esc`).
5. **Formato:** melhor de 3 rounds (configurável; modo "round único" também disponível).

---

## 11. Arquitetura e Estrutura de Código

### 11.1 Módulos

| Módulo | Responsabilidade |
|--------|------------------|
| `engine` | Game loop (timestep fixo 60 Hz), input do teclado, renderer Three.js |
| `scene` | Cenário futurista, iluminação, câmera e zoom dinâmico |
| `characters` | Modelos low poly, articulações, máquina de estados de animação |
| `combat` | Hitbox/hurtbox, resolução de golpes, fórmula de dano, bloqueio, hitstun/knockdown |
| `attributes` | Dados e cálculos dos atributos (§6) |
| `ai` | Máquina de estados e tomada de decisão do oponente |
| `ui` | HUD (barras de vida/energia), mensagens, telas de início/fim |
| `audio` | Efeitos sonoros (golpe, bloqueio, pulo, KO) e música de fundo |
| `config` | Tabela de parâmetros tunáveis (dano, velocidades, custos, dificuldade) |

### 11.2 Estrutura de diretórios sugerida

```
luta-robos/
├── index.html
├── src/
│   ├── main.js
│   ├── config/
│   │   └── game.config.js
│   ├── engine/
│   │   ├── loop.js
│   │   ├── input.js
│   │   └── renderer.js
│   ├── scene/
│   │   ├── arena.js        # rua, prédios, postes
│   │   └── camera.js
│   ├── characters/
│   │   ├── robot.js        # montagem e articulações
│   │   ├── animation.js
│   │   └── attributes.js
│   ├── combat/
│   │   ├── fighter.js      # estado do lutador (FSM)
│   │   └── hitbox.js
│   ├── ai/
│   │   └── opponent.js
│   ├── ui/
│   │   └── hud.js
│   └── audio/
│       └── sounds.js
└── assets/
    ├── models/ (opcional — GLB low poly)
    └── sounds/
```

### 11.3 Loop de jogo

- Lógica em **timestep fixo** (60 Hz) com interpolação de renderização.
- Ordem por tick: `input → IA → máquina de estados dos lutadores → física/movimento → combate (hitbox) → HUD → render`.
- Entrada por `event.code` (layout físico do teclado, independente de idioma).

---

## 12. Requisitos Não Funcionais

| Item | Requisito |
|------|-----------|
| Desempenho | 60 FPS estáveis em desktop médio; ≤ 50 MB de assets |
| Compatibilidade | Chrome, Firefox, Edge (versões atuais), resolução mínima 1280×720 |
| Controles | Teclado obrigatório; nenhum gamepad exigido |
| Offline | Build estático servido via HTTP(S); nenhum backend obrigatório |
| Acessibilidade | Opcional: remapeamento de teclas, redução de flashes |

---

## 13. Fases de Desenvolvimento

| Marco | Entregas |
|-------|----------|
| **M1 — Núcleo** | Janela Three.js, câmera lateral, arena plana, robô movendo/pulando com P1 |
| **M2 — Cenário** | Rua, prédios, postes, iluminação noturna, limites da arena |
| **M3 — Combate** | Soco, chute, rasteira, bloqueio, hitbox/hurtbox, dano, hitstun, derrubada |
| **M4 — IA** | Máquina de estados do oponente, dificuldades, integração P1 vs. IA |
| **M5 — HUD e fluxo** | Barras de vida vermelhas (100 HP), energia, telas de início/fim, rounds |
| **M6 — Polimento** | Animações, áudio, game feel (hitstop, shake), otimização, testes finais |

---

## 14. Critérios de Aceite

- [ ] P1 se move com `J`/`L`, agacha com `K`, pula com `I`, soca com `X`, chuta com `C`, bloqueia segurando `Z`; rasteira executa com agachar + chute.
- [ ] (Modo 2P) P2 responde a `4`/`6`/`5`/`8`, `End` (soco), `Del` (chute), `Page Down` (bloqueio).
- [ ] No topo há uma barra vermelha de vida por robô, iniciando em 100 pontos, diminuindo conforme o dano.
- [ ] Abaixo da barra de vida há uma barra azul de energia por robô, iniciando em 100 pontos, que diminui conforme os golpes são executados, e aumenta com o tempo (regeneração), até um valor máximo de 100 pontos.
- [ ] Cenário futurista ao fundo contém prédios, postes e rua; os robôs lutam sobre a rua.
- [ ] Chute causa −10 de vida, soco −5, rasteira −7 (após cálculo de atributos).
- [ ] Bloqueio impede 100% do dano e impede movimento enquanto ativo.
- [ ] Golpes só causam dano se o oponente não estiver bloqueando.
- [ ] Rasteira derruba o oponente.
- [ ] Oponente é controlado pela IA do jogo com mínimo de 3 níveis de dificuldade.
- [ ] Robôs possuem os atributos Vida, Força, Velocidade, Resistência, Energia e Armadura, com efeitos documentados.
- [ ] Vitória ocorre ao zerar a vida do oponente, com tela de resultado e reinício.

---

*Documento gerado em 15/10/2026 — v1.0*
