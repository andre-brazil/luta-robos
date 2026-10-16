/* Ponto de entrada: monta engine, cena, lutadores e o fluxo do jogo (spec §10, §11). */
(function () {
  if (!window.THREE) return;
  const C = LR.CONFIG;

  const app = document.getElementById('app');
  const renderer = LR.createRenderer(app);
  const scene = new THREE.Scene();
  LR.buildArena(scene);
  const camera = LR.createCamera();
  camera.position.set(0, 2.2, 13);

  LR.input.init();
  const hud = LR.initHUD();

  const robots = [LR.buildRobot(C.palettes[0]), LR.buildRobot(C.palettes[1])];
  scene.add(robots[0].group, robots[1].group);

  const F = [
    new LR.Fighter({ name: 'JOGADOR 1', x: C.spawnX[0], facing: 1, robot: robots[0] }),
    new LR.Fighter({ name: 'IA', x: C.spawnX[1], facing: -1, robot: robots[1] })
  ];
  const ai = new LR.OpponentAI('normal');
  const game = { state: 'menu', mode: '1p', difficulty: 'normal', wins: [0, 0], round: 1, timer: C.rounds.time, freeze: 0, shake: 0, introT: 0, koT: 0, time: 0 };
  const menu = { cursor: 0 };
  const DIFFS = ['easy', 'normal', 'hard'];
  const NO_CMD = { move: 0, down: false, jump: false, kick: false, punch: false, block: false };

  window.__LR_GAME__ = { game: game, fighters: F, robots: robots, ai: ai, LR: LR, startMatch: startMatch, hud: hud };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function readCmd(map) {
    const I = LR.input;
    return {
      move: (I.anyDown(map.right) ? 1 : 0) - (I.anyDown(map.left) ? 1 : 0),
      down: I.anyDown(map.down),
      jump: I.anyPressed(map.jump),
      kick: I.anyPressed(map.kick),
      punch: I.anyPressed(map.punch),
      block: I.anyDown(map.block)
    };
  }

  function bodyPush() {
    const a = F[0], b = F[1];
    if (a.invulnerable() || b.invulnerable()) return;
    const dx = b.x - a.x, min = C.bodyRadius * 2;
    if (Math.abs(dx) < min && Math.abs(a.y - b.y) < 1.4) {
      const push = (min - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1);
      a.x = clamp(a.x - push, C.arena.minX + 0.4, C.arena.maxX - 0.4);
      b.x = clamp(b.x + push, C.arena.minX + 0.4, C.arena.maxX - 0.4);
    }
  }

  function winnerLabel(w) {
    if (game.mode === '1p') return w === 0 ? 'JOGADOR 1' : 'IA';
    return 'JOGADOR ' + (w + 1);
  }

  function startMatch() {
    game.wins = [0, 0];
    game.round = 1;
    hud.setWins(0, 0);
    hud.hideMenu();
    startRound();
  }

  function startRound() {
    F[0].reset(C.spawnX[0], 1);
    F[1].reset(C.spawnX[1], -1);
    F[1].name = game.mode === '1p' ? 'IA' : 'JOGADOR 2';
    ai.setDifficulty(game.difficulty);
    ai.clear();
    game.timer = C.rounds.time;
    game.state = 'intro';
    game.introT = 0;
    hud.setNames('JOGADOR 1', F[1].name);
    hud.hideResult();
    hud.setVitalsInit(F[0], F[1]);
    hud.setTimer(C.rounds.time);
    hud.showBanner('ROUND ' + game.round, '');
  }

  function endRound(reason) {
    const both = F[0].state === 'ko' && F[1].state === 'ko';
    let w = -1;
    if (reason === 'timeout') { if (F[0].hp !== F[1].hp) w = F[0].hp > F[1].hp ? 0 : 1; }
    else w = both ? -1 : (F[0].state === 'ko' ? 1 : 0);
    if (w >= 0) {
      game.wins[w]++;
      hud.setWins(game.wins[0], game.wins[1]);
      if (F[w].state !== 'ko') F[w].toState('victory');
      F[1 - w].toState('ko');
    }
    game.state = 'ko';
    game.koT = 0;
    hud.showBanner(reason === 'timeout' ? 'TEMPO!' : 'K.O.!', w >= 0 ? winnerLabel(w) + ' VENCE O ROUND' : 'EMPATE');
  }

  function showResult() {
    game.state = 'result';
    const w = game.wins[0] >= C.rounds.winsNeeded ? 0 : 1;
    hud.showResult({
      title: 'VITÓRIA DO ' + winnerLabel(w) + '!',
      wins: game.wins,
      leftName: 'JOGADOR 1',
      rightName: F[1].name
    });
  }

  function toMenu() {
    game.state = 'menu';
    F[0].reset(C.spawnX[0], 1);
    F[1].reset(C.spawnX[1], -1);
    hud.hideResult();
    hud.hideBanner();
    hud.showMenu();
  }

  function menuTick() {
    if (LR.input.wasPressed('ArrowUp') || LR.input.wasPressed('ArrowDown')) {
      menu.cursor = (menu.cursor + 1) % 2;
      LR.audio.select();
    }
    if (LR.input.wasPressed('ArrowLeft') || LR.input.wasPressed('ArrowRight')) {
      if (menu.cursor === 0) game.mode = game.mode === '1p' ? '2p' : '1p';
      else {
        const i = DIFFS.indexOf(game.difficulty);
        game.difficulty = DIFFS[(i + 1) % 3];
      }
      LR.audio.select();
    }
    if (LR.input.wasPressed('Enter')) { LR.audio.announce(); startMatch(); }
    hud.refreshMenu(game, menu.cursor);
  }

  function fightTick(dt) {
    game.timer -= dt;
    if (game.timer <= 0) { game.timer = 0; hud.setTimer(0); endRound('timeout'); return; }

    const cmd1 = readCmd(C.bindings.p1);
    const cmd2 = game.mode === '1p' ? ai.update(dt, F[1], F[0]) : readCmd(C.bindings.p2);
    const ev = F[0].update(dt, cmd1, F[1]).concat(F[1].update(dt, cmd2, F[0]));
    bodyPush();
    LR.resolveHits(F[0], F[1], ev);
    LR.resolveHits(F[1], F[0], ev);

    for (let i = 0; i < ev.length; i++) {
      const e = ev[i];
      if (e.type === 'hit') {
        LR.audio.hit();
        if (e.attack === 'kick') LR.audio.kick();
        else if (e.attack === 'punch') LR.audio.punch();
        else LR.audio.sweep();
        game.freeze = Math.max(game.freeze, C.hitstop.hit);
        game.shake = 0.12;
        robots[e.def === F[0] ? 0 : 1].flashT = 1;
      } else if (e.type === 'blocked') {
        LR.audio.block();
        game.freeze = Math.max(game.freeze, C.hitstop.block);
        game.shake = 0.05;
      } else if (e.type === 'jump') LR.audio.jump();
      else if (e.type === 'land') LR.audio.land();
    }

    hud.setVitals(F[0], F[1]);
    hud.setBlock(F[0].state === 'block', F[1].state === 'block');
    hud.setTimer(Math.ceil(game.timer));

    if (F[0].state === 'ko' || F[1].state === 'ko') {
      LR.audio.ko();
      game.freeze = Math.max(game.freeze, C.hitstop.ko);
      game.shake = 0.5;
      endRound('ko');
    }
  }

  function update(dt) {
    game.time += dt;
    if (LR.input.wasPressed('KeyM')) LR.audio.toggleMute();
    if (game.freeze > 0) {
      game.freeze -= dt;
      LR.input.endFrame();
      return;
    }
    switch (game.state) {
      case 'menu':
        F[0].update(dt, NO_CMD, F[1]);
        F[1].update(dt, NO_CMD, F[0]);
        menuTick();
        break;
      case 'intro':
        game.introT += dt;
        F[0].update(dt, NO_CMD, F[1]);
        F[1].update(dt, NO_CMD, F[0]);
        if (game.introT >= 0.8 && game.introT - dt < 0.8) hud.showBanner('LUTEM!', '');
        if (game.introT >= 1.5) game.state = 'fight';
        break;
      case 'fight':
        fightTick(dt);
        break;
      case 'ko':
        game.koT += dt;
        F[0].stateTime += dt;
        F[1].stateTime += dt;
        if (game.koT >= 2.2) {
          if (game.wins[0] >= C.rounds.winsNeeded || game.wins[1] >= C.rounds.winsNeeded) showResult();
          else { game.round++; startRound(); }
        }
        break;
      case 'result':
        F[0].stateTime += dt;
        F[1].stateTime += dt;
        if (LR.input.wasPressed('Enter')) startMatch();
        else if (LR.input.wasPressed('Escape')) toMenu();
        break;
    }
    LR.input.endFrame();
  }

  function render() {
    for (let i = 0; i < 2; i++) {
      LR.applyPose(robots[i], F[i], game.time);
      robots[i].flashT = Math.max(0, robots[i].flashT - 0.06);
      const ko = F[i].state === 'ko';
      robots[i].eyeMat.emissiveIntensity = ko ? 0.05 : 1.6;
      robots[i].coreMat.emissiveIntensity = ko ? 0.1 : 1.2 + robots[i].flashT * 3 + (F[i].state === 'block' ? 0.5 + Math.sin(game.time * 10) * 0.3 : 0);
    }
    game.shake *= 0.88;
    LR.updateCamera(camera, F[0], F[1], 1 / 60, game.shake);
    renderer.render(scene, camera);
  }

  hud.showMenu();
  new LR.Loop(update, render).start();
})();
