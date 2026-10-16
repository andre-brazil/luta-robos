# Luta de Robôs 3D

Jogo de luta 3D em visão lateral (2.5D) entre dois robôs low poly, para navegador web.
Implementado conforme a especificação em [`especificacao-luta-robos.md`](especificacao-luta-robos.md).

## Como executar

Não há etapa de build: basta servir a pasta por HTTP e abrir `index.html`.

- **Opção mais simples:** abra `index.html` direto no navegador (duplo clique). Funciona em `file://` porque o jogo usa scripts clássicos. Requer internet para baixar o three.js da CDN.
- **Opção servidor local (recomendada):** qualquer servidor estático serve, por exemplo:
  - `npx serve .`
  - `python -m http.server 8000` → http://localhost:8000

Para rodar 100% offline, baixe o `three.min.js` (three@0.147.0) para `vendor/three.min.js` e troque o `<script src="...">` da CDN em `index.html` pelo caminho local.

## Controles

**Player 1**

| Tecla | Ação |
|-------|------|
| `J` / `L` | Mover esquerda / direita |
| `K` | Agachar (segurar) |
| `I` | Pular |
| `X` | Soco (−5, rápido) |
| `C` | Chute (−10, lento) |
| `K` + `C` | Rasteira (−7, derruba) |
| `Z` | Bloqueio (segurar — nega 100% do dano, sem mover) |

**Player 2** (modo 2 jogadores)

| Tecla | Ação |
|-------|------|
| `4` / `6` | Mover esquerda / direita |
| `5` | Agachar |
| `8` | Pular |
| `End` | Soco |
| `Del` | Chute |
| `5` + `Del` | Rasteira |
| `Page Down` | Bloqueio |

Outras teclas: `←` `→` `↑` `↓` + `Enter` no menu · `Enter` revanche / `Esc` menu no resultado · `M` liga/desliga o som.

## Regras implementadas

- Barras vermelhas de vida (100 HP) e barras azuis de energia (100) no topo, timer de 99 s, melhor de 3 rounds.
- Soco −5 (startup 0,25 s), chute −10 (0,70 s), rasteira −7 (0,50 s, derruba o oponente e só é bloqueada agachado).
- Bloqueio nega 100% do dano e impede movimento; golpes só causam dano se o oponente não estiver bloqueando.
- Atributos (Vida, Força, Velocidade, Resistência, Energia, Armadura) com a fórmula de dano da spec §6.1; golpes custam energia (8/15/12), que regenera 10 pontos/s.
- IA do oponente com 3 dificuldades (reação, frequência de bloqueio e agressividade conforme spec §9.4).
- Cenário futurista noturno: rua, prédios com janelas emissivas, postes de luz, letreiros neon, estrelas e neblina.

## Estrutura

```
index.html
src/
├── config/game.config.js      # parâmetros tunáveis
├── engine/{input,loop,renderer}.js
├── scene/{arena,camera}.js
├── characters/{attributes,robot,animation}.js
├── combat/{fighter,hitbox}.js
├── ai/opponent.js
├── audio/sounds.js            # WebAudio sintetizado
├── ui/hud.js                  # HUD em DOM
└── main.js                    # fluxo do jogo
verify/standalone.html         # versão autocontida com testes automatizados
```

Nota: a spec previa ES modules + Vite; como o ambiente não dispunha de shell/npm, a
implementação usa scripts clássicos sem build, mantendo a mesma estrutura de módulos
(tudo namespaced em `window.LR`).
