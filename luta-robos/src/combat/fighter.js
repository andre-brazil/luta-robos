/* Lutador: máquina de estados de combate (spec §7.3, §7.4). Lógica pura, sem three.js. */
window.LR = window.LR || {};

LR.Fighter = class {
  constructor(opts) {
    this.name = opts.name;
    this.attrs = new LR.Attributes(opts.attrs);
    this.robot = opts.robot || null;
    this.reset(opts.x, opts.facing);
  }

  reset(x, facing) {
    this.x = x; this.y = 0; this.vy = 0;
    this.facing = facing;
    this.hp = this.attrs.vida;
    this.energy = this.attrs.energia;
    this.state = 'idle';
    this.stateTime = 0;
    this.walkPhase = 0;
    this.attack = null;
    this.blockCrouch = false;
    this.landLock = 0;
    this.stun = 0;
  }

  toState(s) { this.state = s; this.stateTime = 0; }
  invulnerable() { return this.state === 'knockdown' || this.state === 'getup'; }
  clampX() {
    const a = LR.CONFIG.arena;
    this.x = Math.max(a.minX + 0.4, Math.min(a.maxX - 0.4, this.x));
  }
  faceFoe(foe) { this.facing = foe.x >= this.x ? 1 : -1; }
  spend(cost) {
    if (this.energy < cost) return false;
    this.energy -= cost;
    return true;
  }
  startAttack(type, foe, ev) {
    this.faceFoe(foe);
    this.attack = { type: type, t: 0, hasHit: false };
    this.toState('attack');
    ev.push({ type: 'attack', f: this, attack: type });
  }

  onHit(atk, dmg) {
    const A = LR.CONFIG.attacks[atk.attack.type];
    this.hp = Math.max(0, this.hp - dmg);
    this.x += atk.facing * A.pushback;
    this.clampX();
    this.attack = null;
    if (this.hp <= 0) this.toState('ko');
    else if (A.knockdown) this.toState('knockdown');
    else { this.stun = LR.CONFIG.hitstun[atk.attack.type] || 0.35; this.toState('hit'); }
  }

  onBlocked(atk) {
    this.x += atk.facing * LR.CONFIG.blockPushback;
    this.clampX();
    this.blockCrouch = this.blockCrouch; // mantém postura
    this.toState('block'); // blockstun
  }

  update(dt, cmd, foe) {
    const ev = [];
    const C = LR.CONFIG;
    this.stateTime += dt;
    if (this.landLock > 0) this.landLock -= dt;

    if (this.state === 'ko' || this.state === 'victory') return ev;

    this.energy = Math.min(this.attrs.energia, this.energy + C.energyRegen * dt);

    // Gravidade / aterrissagem
    if (this.y > 0 || this.vy !== 0) {
      this.vy += C.gravity * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0; this.vy = 0;
        if (this.state === 'air') { this.toState('idle'); this.landLock = C.landLock; ev.push({ type: 'land', f: this }); }
      }
    }

    switch (this.state) {
      case 'hit':
        if (this.stateTime >= this.stun) this.toState('idle');
        return ev;
      case 'knockdown':
        if (this.stateTime >= C.knockdownTime) this.toState('getup');
        return ev;
      case 'getup':
        if (this.stateTime >= C.getupTime) this.toState('idle');
        return ev;
      case 'attack': {
        this.attack.t += dt;
        const A = C.attacks[this.attack.type];
        if (this.attack.t >= A.startup + A.active + A.recovery) {
          this.attack = null;
          this.toState(cmd.down ? 'crouch' : 'idle');
        }
        return ev;
      }
      case 'block':
        if (!cmd.block) this.toState('idle');
        else { this.blockCrouch = !!cmd.down; this.faceFoe(foe); }
        return ev;
      case 'air':
        if (cmd.move) {
          this.x += cmd.move * LR.walkSpeedFor(this.attrs) * 0.85 * dt;
          this.walkPhase += Math.abs(cmd.move) * dt * 6;
          this.clampX();
        }
        return ev;
    }

    // Estados acionáveis no chão: idle / walk / crouch
    if (cmd.block) {
      this.toState('block');
      this.blockCrouch = !!cmd.down;
      this.faceFoe(foe);
      return ev;
    }
    if (cmd.jump && this.landLock <= 0) {
      this.vy = C.jumpVelocity;
      this.y = 0.0001;
      this.toState('air');
      ev.push({ type: 'jump', f: this });
      return ev;
    }
    if (cmd.down) {
      if (this.state !== 'crouch') this.toState('crouch');
      if (this.landLock <= 0) {
        if (cmd.kick && this.spend(C.energyCost.sweep)) this.startAttack('sweep', foe, ev);
        else if (cmd.punch && this.spend(C.energyCost.punch)) this.startAttack('punch', foe, ev);
      }
      return ev;
    }
    if (this.state === 'crouch') this.toState('idle');

    if (cmd.kick && this.spend(C.energyCost.kick)) { this.startAttack('kick', foe, ev); return ev; }
    if (cmd.punch && this.spend(C.energyCost.punch)) { this.startAttack('punch', foe, ev); return ev; }

    if (cmd.move) {
      this.x += cmd.move * LR.walkSpeedFor(this.attrs) * dt;
      this.walkPhase += Math.abs(cmd.move) * dt * 7;
      this.clampX();
      if (this.state !== 'walk') this.toState('walk');
      this.faceFoe(foe);
    } else if (this.state === 'walk') {
      this.toState('idle');
    }
    return ev;
  }
};
