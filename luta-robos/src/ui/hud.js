/* HUD em DOM: barras de vida/energia, timer, mensagens e telas (spec §8). */
window.LR = window.LR || {};

LR.initHUD = function () {
  const css = [
    '#lr-hud{position:fixed;inset:0;pointer-events:none;font-family:"Courier New",monospace;color:#cfefff;z-index:10}',
    '#lr-hud .lr-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-start;padding:14px 18px;gap:12px}',
    '#lr-hud .lr-side{width:42%;max-width:520px}',
    '#lr-hud .lr-name{font-weight:bold;font-size:15px;letter-spacing:2px;text-shadow:0 0 8px #35f0ff;margin-bottom:4px}',
    '#lr-hud .lr-right .lr-name{text-align:right;text-shadow:0 0 8px #ff5c8a}',
    '#lr-hud .lr-hpbar{position:relative;height:24px;background:#200608;border:2px solid #0af3ff55;box-shadow:0 0 12px #000 inset,0 0 10px #0af3ff33}',
    '#lr-hud .lr-hp-fill{position:absolute;top:0;bottom:0;left:0;width:100%;background:linear-gradient(180deg,#ff4040,#a00000);box-shadow:0 0 10px #ff202088}',
    '#lr-hud .lr-hp-lag{position:absolute;top:0;bottom:0;left:0;width:100%;background:#ffd9d9}',
    '#lr-hud .lr-right .lr-hp-fill,#lr-hud .lr-right .lr-hp-lag{left:auto;right:0}',
    '#lr-hud .lr-enbar{position:relative;height:9px;margin-top:3px;background:#04101c;border:1px solid #0af3ff44}',
    '#lr-hud .lr-en-fill{position:absolute;top:0;bottom:0;left:0;width:100%;background:linear-gradient(180deg,#4fc3ff,#0a5fcf);box-shadow:0 0 8px #35a0ff88}',
    '#lr-hud .lr-right .lr-en-fill{left:auto;right:0}',
    '#lr-hud .lr-tag{display:none;margin-top:4px;font-size:11px;letter-spacing:2px;color:#ffe14f;text-shadow:0 0 8px #ffe14f}',
    '#lr-hud .lr-right .lr-tag{text-align:right}',
    '#lr-hud .lr-tag.on{display:block}',
    '#lr-hud .lr-center{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '#lr-hud .lr-timer{font-size:38px;font-weight:bold;color:#fff;text-shadow:0 0 12px #35f0ff,0 0 30px #35f0ff}',
    '#lr-hud .lr-pips{display:flex;gap:5px}',
    '#lr-hud .pip{width:12px;height:12px;border-radius:50%;border:2px solid #35f0ffaa;background:transparent}',
    '#lr-hud .pip.on{background:#ffe14f;border-color:#ffe14f;box-shadow:0 0 8px #ffe14f}',
    '#lr-hud .lr-banner{position:absolute;top:34%;left:0;right:0;text-align:center;opacity:0;transition:opacity .15s}',
    '#lr-hud .lr-banner.show{opacity:1}',
    '#lr-hud .lr-banner .big{font-size:64px;font-weight:bold;color:#fff;letter-spacing:6px;text-shadow:0 0 18px #ff2d78,0 0 50px #ff2d78}',
    '#lr-hud .lr-banner .sub{font-size:20px;letter-spacing:3px;color:#cfefff;text-shadow:0 0 10px #35f0ff;margin-top:6px}',
    '#lr-hud .lr-overlay{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:#04050cd9;text-align:center;pointer-events:none}',
    '#lr-hud .lr-overlay.show{display:flex}',
    '#lr-hud h1{font-size:46px;letter-spacing:6px;margin:0 0 22px;color:#fff;text-shadow:0 0 16px #35f0ff,0 0 50px #35f0ff}',
    '#lr-hud .opt{font-size:19px;letter-spacing:2px;margin:7px 0;color:#9adfff}',
    '#lr-hud .opt.sel{color:#ffe14f;text-shadow:0 0 10px #ffe14f}',
    '#lr-hud .opt.hidden{display:none}',
    '#lr-hud .hint{margin-top:20px;font-size:13px;color:#7fa8c8;letter-spacing:1px;line-height:1.9}',
    '#lr-hud .ctrl{font-size:12px;color:#6f92b2;letter-spacing:1px;margin-top:4px}',
    '#lr-hud .score{font-size:22px;letter-spacing:3px;margin:10px 0 4px;color:#fff}'
  ].join('\n');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'lr-hud';
  root.innerHTML =
    '<div class="lr-top">' +
    '  <div class="lr-side lr-left">' +
    '    <div class="lr-name" id="lr-name-l">JOGADOR 1</div>' +
    '    <div class="lr-hpbar"><div class="lr-hp-lag" id="lr-hplag-l"></div><div class="lr-hp-fill" id="lr-hp-l"></div></div>' +
    '    <div class="lr-enbar"><div class="lr-en-fill" id="lr-en-l"></div></div>' +
    '    <div class="lr-tag" id="lr-tag-l">■ BLOQUEIO</div>' +
    '    <div class="lr-pips" id="lr-pips-l"><span class="pip"></span><span class="pip"></span></div>' +
    '  </div>' +
    '  <div class="lr-center"><div class="lr-timer" id="lr-timer">99</div></div>' +
    '  <div class="lr-side lr-right">' +
    '    <div class="lr-name" id="lr-name-r">IA</div>' +
    '    <div class="lr-hpbar"><div class="lr-hp-lag" id="lr-hplag-r"></div><div class="lr-hp-fill" id="lr-hp-r"></div></div>' +
    '    <div class="lr-enbar"><div class="lr-en-fill" id="lr-en-r"></div></div>' +
    '    <div class="lr-tag" id="lr-tag-r">BLOQUEIO ■</div>' +
    '    <div class="lr-pips" id="lr-pips-r"><span class="pip"></span><span class="pip"></span></div>' +
    '  </div>' +
    '</div>' +
    '<div class="lr-banner" id="lr-banner"><div class="big"></div><div class="sub"></div></div>' +
    '<div class="lr-overlay" id="lr-menu"></div>' +
    '<div class="lr-overlay" id="lr-result"></div>';
  document.body.appendChild(root);

  const $ = function (id) { return document.getElementById(id); };
  let lagL = 100, lagR = 100;

  function pct(v, max) { return Math.max(0, Math.min(100, (v / max) * 100)); }

  const api = {
    setNames: function (l, r) { $('lr-name-l').textContent = l; $('lr-name-r').textContent = r; },

    setVitalsInit: function (f1, f2) {
      lagL = f1.hp; lagR = f2.hp;
      this.setVitals(f1, f2);
    },

    setVitals: function (f1, f2) {
      lagL = Math.max(f1.hp, lagL - 0.45); if (lagL < f1.hp) lagL = f1.hp;
      lagR = Math.max(f2.hp, lagR - 0.45); if (lagR < f2.hp) lagR = f2.hp;
      $('lr-hp-l').style.width = pct(f1.hp, f1.attrs.vida) + '%';
      $('lr-hplag-l').style.width = pct(lagL, f1.attrs.vida) + '%';
      $('lr-hp-r').style.width = pct(f2.hp, f2.attrs.vida) + '%';
      $('lr-hplag-r').style.width = pct(lagR, f2.attrs.vida) + '%';
      $('lr-en-l').style.width = pct(f1.energy, f1.attrs.energia) + '%';
      $('lr-en-r').style.width = pct(f2.energy, f2.attrs.energia) + '%';
    },

    setTimer: function (s) { $('lr-timer').textContent = s; },

    setWins: function (w1, w2) {
      const pl = $('lr-pips-l').children, pr = $('lr-pips-r').children;
      for (let i = 0; i < pl.length; i++) pl[i].className = 'pip' + (i < w1 ? ' on' : '');
      for (let i = 0; i < pr.length; i++) pr[i].className = 'pip' + (i < w2 ? ' on' : '');
    },

    setBlock: function (l, r) {
      $('lr-tag-l').className = 'lr-tag' + (l ? ' on' : '');
      $('lr-tag-r').className = 'lr-tag' + (r ? ' on' : '');
    },

    showBanner: function (big, sub) {
      const b = $('lr-banner');
      b.children[0].textContent = big;
      b.children[1].textContent = sub || '';
      b.className = 'lr-banner show';
    },
    hideBanner: function () { $('lr-banner').className = 'lr-banner'; },

    showMenu: function () { $('lr-menu').className = 'lr-overlay show'; },
    hideMenu: function () { $('lr-menu').className = 'lr-overlay'; },

    refreshMenu: function (game, cursor) {
      const modeLabel = game.mode === '1p' ? '1 JOGADOR (VS IA)' : '2 JOGADORES';
      const diffLabel = LR.CONFIG.difficulties[game.difficulty].label;
      $('lr-menu').innerHTML =
        '<h1>LUTA DE ROBÔS 3D</h1>' +
        '<div class="opt' + (cursor === 0 ? ' sel' : '') + '">MODO ........ ' + modeLabel + '</div>' +
        '<div class="opt' + (cursor === 1 ? ' sel' : '') + (game.mode === '2p' ? ' hidden' : '') + '">DIFICULDADE . ' + diffLabel + '</div>' +
        '<div class="hint">↑ ↓ — SELECIONAR &nbsp;·&nbsp;← → — ALTERAR &nbsp;·&nbsp; ENTER — LUTAR &nbsp;·&nbsp; M — SOM</div>' +
        '<div class="hint" style="margin-top:14px"><b>P1</b>&nbsp; J/L mover · K agachar · I pular · X soco · C chute · Z bloqueio · K+C rasteira</div>' +
        '<div class="ctrl"><b>P2</b>&nbsp; 4/6 mover · 5 agachar · 8 pular · End soco · Del chute · PgDn bloqueio · 5+Del rasteira</div>';
    },

    showResult: function (data) {
      const pip = function (n) { let s = ''; for (let i = 0; i < 2; i++) s += i < n ? '●' : '○'; return s; };
      $('lr-result').innerHTML =
        '<h1>' + data.title + '</h1>' +
        '<div class="score">' + data.leftName + ' &nbsp;' + pip(data.wins[0]) + ' × ' + pip(data.wins[1]) + '&nbsp; ' + data.rightName + '</div>' +
        '<div class="hint">ENTER — REVANCHE &nbsp;·&nbsp; ESC — MENU</div>';
      $('lr-result').className = 'lr-overlay show';
    },
    hideResult: function () { $('lr-result').className = 'lr-overlay'; }
  };
  return api;
};
