/* IA do oponente: máquina de estados com decisão por utilidade (spec §9). */
window.LR = window.LR || {};

LR.OpponentAI = class {
  constructor(diffKey) {
    this.setDifficulty(diffKey);
    this.r = Math.random;
    this.clear();
  }

  setDifficulty(k) { this.diff = LR.CONFIG.difficulties[k]; }

  clear() {
    this.cmd = { move: 0, down: false, jump: false, kick: false, punch: false, block: false };
    this.think = 0;
    this.mode = 'idle';
    this.modeTimer = 0;
    this.blockFor = 0;
    this.attackCd = 0.6;
  }

  update(dt, me, foe) {
    const c = this.cmd, D = this.diff;
    c.jump = c.kick = c.punch = false;

    if (this.attackCd > 0) this.attackCd -= dt;

    if (this.blockFor > 0) {
      this.blockFor -= dt;
      c.block = this.blockFor > 0;
      if (!c.block) c.down = false;
      return c;
    }
    c.block = false;

    this.think -= dt;
    const dist = Math.abs(foe.x - me.x);
    const dir = Math.sign(foe.x - me.x) || 1;
    if (this.think <= 0) { this.think = D.reaction; this.decide(me, foe, dist, dir); }

    if (this.modeTimer > 0) this.modeTimer -= dt;
    else if (this.mode !== 'idle') { this.mode = 'idle'; c.move = 0; c.down = false; }

    if (this.mode === 'approach') c.move = dir;
    else if (this.mode === 'retreat') c.move = -dir;
    else if (this.mode === 'crouch') c.down = true;

    return c;
  }

  decide(me, foe, dist, dir) {
    const c = this.cmd, D = this.diff, R = this.r;
    c.move = 0; c.down = false;

    const foeAtk = (foe.state === 'attack' && foe.attack) ? foe.attack.type : null;
    const foeStarting = foeAtk && foe.attack.t < LR.CONFIG.attacks[foeAtk].startup;

    // Defesa: reagir ao startup do golpe do jogador (spec §9.1 bloquear)
    if (foeStarting && dist < 3.2 && R() < D.blockChance) {
      c.block = true;
      c.down = foeAtk === 'sweep'; // bloqueio agachado segura rasteira
      this.blockFor = 0.25 + R() * 0.35;
      this.mode = 'idle';
      return;
    }

    // Ataque: punir ou pressionar (spec §9.1 atacar/punir)
    if (this.attackCd <= 0) {
      const foeVulnerable = foe.state === 'hit' || foe.state === 'knockdown' || foe.state === 'getup';
      if (foeVulnerable && dist < 2.4) { this.fire(me, foe); return; }
      if (dist < 2.3 && R() < D.aggression) { this.fire(me, foe); return; }
    }

    // Espaçamento (spec §9.1 aproximar/recuar/agachar)
    if (me.hp < foe.hp - 30 && R() < 0.3) {
      this.mode = 'retreat'; this.modeTimer = 0.3 + R() * 0.25;
      return;
    }
    if (dist > 2.4) { this.mode = 'approach'; this.modeTimer = 0.2 + R() * 0.2; }
    else if (R() < 0.22) { this.mode = 'crouch'; this.modeTimer = 0.2 + R() * 0.3; }
  }

  fire(me, foe) {
    const c = this.cmd, R = this.r, C = LR.CONFIG;
    const canKick = me.energy >= C.energyCost.kick;
    const canPunch = me.energy >= C.energyCost.punch;
    const canSweep = me.energy >= C.energyCost.sweep;
    let type = null;

    if (foe && foe.state === 'block' && canSweep && R() < 0.6) type = 'sweep';       // vs bloqueio: rasteira
    else if (foe && foe.state === 'crouch' && canKick && R() < 0.5) type = 'kick';
    else {
      const roll = R();
      if (roll < 0.38) type = canKick ? 'kick' : (canPunch ? 'punch' : null);
      else if (roll < 0.72) type = canPunch ? 'punch' : null;
      else type = canSweep ? 'sweep' : (canPunch ? 'punch' : null);
    }
    if (!type) return;

    if (type === 'sweep') { c.down = true; c.kick = true; }
    else if (type === 'kick') c.kick = true;
    else c.punch = true;

    this.attackCd = (1.1 - this.diff.aggression) * 0.8 + 0.25;
  }
};
