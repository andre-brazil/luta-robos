/* Input por event.code — layout físico do teclado (spec §7, §11.3). */
window.LR = window.LR || {};

LR.input = (function () {
  const down = new Set();
  const pressed = new Set(); // bordas desde o último endFrame()

  const PREVENT = new Set([
    'KeyJ', 'KeyL', 'KeyK', 'KeyI', 'KeyC', 'KeyX', 'KeyZ',
    'Digit4', 'Digit5', 'Digit6', 'Digit8',
    'Numpad4', 'Numpad5', 'Numpad6', 'Numpad8',
    'Delete', 'End', 'PageDown',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'
  ]);

  function init() {
    window.addEventListener('keydown', function (e) {
      if (PREVENT.has(e.code)) e.preventDefault();
      if (LR.audio) LR.audio.unlock();
      if (!down.has(e.code)) pressed.add(e.code);
      down.add(e.code);
    });
    window.addEventListener('keyup', function (e) { down.delete(e.code); });
    window.addEventListener('blur', function () { down.clear(); });
  }

  function isDown(code) { return down.has(code); }
  function anyDown(codes) { return codes.some(function (c) { return down.has(c); }); }
  function wasPressed(code) { return pressed.has(code); }
  function anyPressed(codes) { return codes.some(function (c) { return pressed.has(c); }); }
  function endFrame() { pressed.clear(); }

  return { init: init, isDown: isDown, anyDown: anyDown, wasPressed: wasPressed, anyPressed: anyPressed, endFrame: endFrame };
})();
