/* Áudio sintetizado via WebAudio — efeitos e trilha simples (spec §2, §11.1). */
window.LR = window.LR || {};

LR.audio = (function () {
  let ctx = null, master = null, musicOn = false, musicTimer = null, step = 0;

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      startMusic();
    } catch (e) { ctx = null; }
  }

  function blip(freq, type, dur, vol, slideTo) {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) {}
  }

  function noise(dur, vol, freq) {
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const len = Math.max(1, (dur * ctx.sampleRate) | 0);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t0); s.stop(t0 + dur);
    } catch (e) {}
  }

  function bass(f, t, d) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.value = 480;
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(fl); fl.connect(g); g.connect(master);
    o.start(t); o.stop(t + d);
  }

  function hat(t) {
    const len = 2205;
    const buf = ctx.createBuffer(1, len, 22050);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.06);
  }

  function pad(t, d) {
    [220, 261.63, 329.63].forEach(function (fr) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.35);
      g.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + d);
    });
  }

  function startMusic() {
    if (musicOn || !ctx) return;
    musicOn = true;
    const bassline = [55, 55, 82.41, 55, 65.41, 65.41, 98, 73.42]; // Lá menor sombrio
    const spb = 60 / 112 / 2; // colcheias a 112 bpm
    let next = ctx.currentTime + 0.15;
    musicTimer = setInterval(function () {
      if (!ctx) return;
      while (next < ctx.currentTime + 0.3) {
        const s = step % 8;
        bass(bassline[s], next, spb * 0.92);
        if (s % 2 === 0) hat(next);
        if (s === 0) pad(next, spb * 8);
        next += spb;
        step++;
      }
    }, 90);
  }

  return {
    unlock: unlock,
    toggleMute: function () { if (master) master.gain.value = master.gain.value > 0 ? 0 : 0.5; },
    punch: function () { blip(170, 'square', 0.12, 0.4, 60); noise(0.06, 0.22, 900); },
    kick: function () { blip(110, 'square', 0.2, 0.5, 45); noise(0.09, 0.28, 600); },
    sweep: function () { noise(0.22, 0.3, 1400); },
    block: function () { blip(900, 'triangle', 0.08, 0.3, 500); noise(0.04, 0.18, 2500); },
    hit: function () { noise(0.08, 0.35, 700); blip(220, 'sawtooth', 0.1, 0.25, 90); },
    jump: function () { blip(240, 'sine', 0.12, 0.22, 520); },
    land: function () { noise(0.04, 0.12, 400); },
    ko: function () { blip(320, 'sawtooth', 0.7, 0.5, 38); noise(0.5, 0.35, 320); },
    select: function () { blip(660, 'square', 0.06, 0.25, 880); },
    announce: function () { blip(440, 'square', 0.14, 0.3, 660); }
  };
})();
