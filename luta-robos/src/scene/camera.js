/* Câmera lateral com zoom dinâmico e shake (spec §3). */
window.LR = window.LR || {};

LR.createCamera = function () {
  const cam = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 220);
  window.addEventListener('resize', function () {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  });
  return cam;
};

LR.updateCamera = function (cam, a, b, dt, shake) {
  const mid = (a.x + b.x) / 2;
  const dist = Math.abs(a.x - b.x);
  const maxY = Math.max(a.y, b.y);
  const tz = THREE.MathUtils.clamp(6.5 + dist * 0.62, 8.5, 22);
  const ty = 1.8 + maxY * 0.4;
  const k = 1 - Math.exp(-dt * 4.5);
  cam.position.x += (mid * 0.6 - cam.position.x) * k;
  cam.position.y += (ty - cam.position.y) * k;
  cam.position.z += (tz - cam.position.z) * k;
  if (shake > 0.001) {
    cam.position.x += (Math.random() - 0.5) * shake;
    cam.position.y += (Math.random() - 0.5) * shake;
  }
  cam.lookAt(cam.position.x * 0.9, 1.05, 0);
};
