/* Hitbox/hurtbox (AABB) e regras de aplicação de dano (spec §7.4). */
window.LR = window.LR || {};

// Hurtbox: x = centro, y = centro vertical, w/h = tamanho
LR.getHurtbox = function (f) {
  let h;
  if (f.state === 'knockdown' || f.state === 'getup') h = 0.55;
  else if (f.state === 'crouch' || (f.state === 'block' && f.blockCrouch)) h = 1.2;
  else h = 1.8;
  const baseY = (f.state === 'knockdown' || f.state === 'getup') ? 0 : f.y;
  return { x: f.x, y: baseY + h / 2, w: 0.72, h: h };
};

LR.getHitbox = function (f) {
  if (f.state !== 'attack' || !f.attack) return null;
  const A = LR.CONFIG.attacks[f.attack.type];
  const t = f.attack.t;
  if (t < A.startup || t > A.startup + A.active) return null;
  const d = f.facing;
  if (f.attack.type === 'punch') return { x: f.x + d * 1.05, y: f.y + 1.2, w: 0.9, h: 0.7 };
  if (f.attack.type === 'kick') return { x: f.x + d * 1.4, y: f.y + 0.9, w: 1.1, h: 0.85 };
  return { x: f.x + d * 1.15, y: f.y + 0.25, w: 1.25, h: 0.5 }; // rasteira: altura baixa
};

LR.boxesOverlap = function (a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
};

// Bloqueio em pé segura soco/chute; rasteira exige bloqueio agachado (spec §7.4 regra 5)
LR.canBlock = function (def, attackType) {
  if (def.state !== 'block') return false;
  if (attackType === 'sweep') return !!def.blockCrouch;
  return true;
};

// Resolve ataque de `atk` contra `def`, emitindo eventos. Cada ataque acerta 1 vez (regra 6).
LR.resolveHits = function (atk, def, events) {
  const hb = LR.getHitbox(atk);
  if (!hb || atk.attack.hasHit) return;
  const hu = LR.getHurtbox(def);
  if (!LR.boxesOverlap(hb, hu)) return;
  if (def.invulnerable()) return;
  // Rasteira não atinge quem está no ar (spec §7.4) — e não consome o golpe
  if (atk.attack.type === 'sweep' && def.y > 0.45) return;

  if (LR.canBlock(def, atk.attack.type)) {
    atk.attack.hasHit = true;
    def.onBlocked(atk);
    events.push({ type: 'blocked', def: def, attack: atk.attack.type });
  } else {
    atk.attack.hasHit = true;
    const dmg = LR.calcDamage(LR.CONFIG.damage[atk.attack.type], atk.attrs, def.attrs);
    def.onHit(atk, dmg);
    events.push({ type: 'hit', def: def, dmg: dmg, attack: atk.attack.type });
  }
};
