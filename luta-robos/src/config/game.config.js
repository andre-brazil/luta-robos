/* Configuração central — todos os parâmetros tunáveis do jogo (spec §6, §7, §9). */
window.LR = window.LR || {};

LR.CONFIG = {
  arena: { minX: -13, maxX: 13 },
  walkSpeed: 4.2,          // u/s com Velocidade = 10
  jumpVelocity: 11.5,
  gravity: -30,
  bodyRadius: 0.42,
  spawnX: [-4, 4],

  // Dano base (spec §7.4)
  damage: { punch: 5, kick: 10, sweep: 7 },

  // Custo de energia (spec §6.2)
  energyCost: { punch: 8, kick: 15, sweep: 12 },
  energyRegen: 10,         // pontos/segundo (spec §6)
  energyMax: 100,

  // Golpes: tempos em segundos (spec §7.4)
  attacks: {
    punch: { startup: 0.25, active: 0.12, recovery: 0.25, pushback: 0.25, knockdown: false },
    kick:  { startup: 0.70, active: 0.15, recovery: 0.40, pushback: 0.60, knockdown: false },
    sweep: { startup: 0.50, active: 0.20, recovery: 0.45, pushback: 0.40, knockdown: true  }
  },
  hitstun: { punch: 0.35, kick: 0.55 },
  blockstun: 0.25,
  blockPushback: 0.5,
  knockdownTime: 0.75,
  getupTime: 0.5,
  landLock: 0.12,

  hitstop: { hit: 0.08, block: 0.03, ko: 0.45 },

  rounds: { winsNeeded: 2, time: 99 },

  // Atributos base (spec §6) — usados por ambos os robôs
  attributes: { vida: 100, forca: 10, velocidade: 10, resistencia: 10, energia: 100, armadura: 0 },

  // Paletas low poly (spec §5)
  palettes: [
    { primary: 0x2f6df6, secondary: 0x16244d, dark: 0x0e1428, accent: 0x63e7ff, eye: 0xbffbff, name: 'AZUL' },
    { primary: 0xf6502f, secondary: 0x4d1a16, dark: 0x280e0e, accent: 0xffb35c, eye: 0xffd9a8, name: 'VERMELHO' }
  ],

  // Bindings por event.code (layout físico do teclado — spec §7)
  bindings: {
    p1: {
      left:  ['KeyJ'],
      right: ['KeyL'],
      down:  ['KeyK'],
      jump:  ['KeyI'],
      kick:  ['KeyC'],
      punch: ['KeyX'],
      block: ['KeyZ']
    },
    p2: {
      left:  ['Digit4', 'Numpad4'],
      right: ['Digit6', 'Numpad6'],
      down:  ['Digit5', 'Numpad5'],
      jump:  ['Digit8', 'Numpad8'],
      kick:  ['Delete'],
      punch: ['End'],
      block: ['PageDown']
    }
  },

  // Dificuldades da IA (spec §9.4)
  difficulties: {
    easy:   { label: 'FÁCIL',   reaction: 0.50, blockChance: 0.20, aggression: 0.35 },
    normal: { label: 'NORMAL',  reaction: 0.30, blockChance: 0.45, aggression: 0.60 },
    hard:   { label: 'DIFÍCIL', reaction: 0.15, blockChance: 0.70, aggression: 0.85 }
  }
};
