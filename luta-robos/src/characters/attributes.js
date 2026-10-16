/* Atributos dos robôs e cálculo de dano (spec §6). */
window.LR = window.LR || {};

LR.Attributes = class {
  constructor(o) {
    o = o || LR.CONFIG.attributes;
    this.vida = o.vida != null ? o.vida : 100;
    this.forca = o.forca != null ? o.forca : 10;
    this.velocidade = o.velocidade != null ? o.velocidade : 10;
    this.resistencia = o.resistencia != null ? o.resistencia : 10;
    this.energia = o.energia != null ? o.energia : 100;
    this.armadura = o.armadura != null ? o.armadura : 0;
  }
};

// dano_final = máx(1, (base × Força/10) × (1 − Resistência×0.005, máx 20%) − Armadura)
LR.calcDamage = function (base, atk, def) {
  const reduc = Math.min(def.resistencia * 0.005, 0.2);
  const raw = base * (atk.forca / 10) * (1 - reduc) - def.armadura;
  return Math.max(1, Math.round(raw));
};

LR.walkSpeedFor = function (attrs) {
  return LR.CONFIG.walkSpeed * (attrs.velocidade / 10);
};
