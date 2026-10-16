/* Game loop com timestep fixo de 60 Hz (spec §11.3). */
window.LR = window.LR || {};

LR.Loop = class {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.step = 1 / 60;
    this.acc = 0;
    this.last = 0;
    this.running = false;
  }
  start() {
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.25) dt = 0.25; // aba anti-spiral of death
      this.acc += dt;
      while (this.acc >= this.step) {
        this.update(this.step);
        this.acc -= this.step;
      }
      this.render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  stop() { this.running = false; }
};
