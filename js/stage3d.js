// Brilhinhos — o palco 3D: um renderizador só, atrás da interface, que troca de
// cena (Forja do Trovão, Fazendinha de cada região, Vitrine). E as miniaturas
// (figurinhas) usadas no Códice e nas listas.
import * as THREE from './vendor/three.module.js';
import { buildCreature, buildEgg, itemSprite, sparkleTexture, GEO, SHAPES, mat, shade, Builder, taperTube } from './creature3d.js';
import { RARITIES, ELEMENTS } from './data.js';

let renderer, canvas, current = null, clock = new THREE.Clock(), elapsed = 0, envTex = null;
function makeEnv(r) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#dfe9ff'); g.addColorStop(0.45, '#9fb4e0'); g.addColorStop(0.55, '#c9a07a'); g.addColorStop(1, '#3a3040');
  x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(70, 30, 26, 14, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(190, 40, 16, 10, 0, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(r); const out = pm.fromEquirectangular(t).texture; pm.dispose(); return out;
}
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rarColor = (r) => RARITIES[r].cor;

export function initStage(el) {
  canvas = el;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  envTex = makeEnv(renderer);
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); if (current) { current.camera.aspect = w / h; current.camera.updateProjectionMatrix(); current.fit?.(w, h); }
  };
  new ResizeObserver(resize).observe(canvas); resize();
  canvas.addEventListener('pointerdown', (e) => {
    if (!current?.onTap) return;
    current.onTap(rayAt(e.clientX, e.clientY), e);
  });
  const loop = () => {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05); elapsed += dt;
    if (!current) return;
    current.update(elapsed, dt);
    renderer.render(current.scene, current.camera);
  };
  loop();
}
export function setScene(sc) {
  if (current?.dispose) current.dispose();
  current = sc;
  if (sc && !sc.scene.environment) { sc.scene.environment = envTex; sc.scene.environmentIntensity = sc.envI ?? 0.6; }
  if (sc) { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; sc.camera.aspect = w / h; sc.camera.updateProjectionMatrix(); sc.fit?.(w, h); }
}
export const currentScene = () => current;
export function rayAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  ptr.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, current.camera); return ray;
}
export function toScreen(obj, dy = 0) {
  const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += dy; v.project(current.camera);
  const r = canvas.getBoundingClientRect();
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}

function lights(scene, { sky = '#cfe6ff', ground = '#5a4a40', sun = '#fff2dc', sunI = 2.6, hemiI = 1.1, radius = 8 } = {}) {
  scene.add(new THREE.HemisphereLight(sky, ground, hemiI));
  const s = new THREE.DirectionalLight(sun, sunI); s.position.set(radius * 0.6, radius * 1.4, radius * 0.8);
  s.castShadow = true; s.shadow.mapSize.set(1024, 1024);
  const c = s.shadow.camera; c.left = c.bottom = -radius; c.right = c.top = radius; c.near = 0.5; c.far = radius * 4; s.shadow.bias = -0.0008; s.shadow.normalBias = 0.02;
  scene.add(s);
  const rim = new THREE.DirectionalLight('#bcd6ff', 0.8); rim.position.set(-radius, radius * 0.5, -radius); scene.add(rim);
  return s;
}
function makeSparkles(scene, n = 40, area = 3, colors = ['#ffffff', '#fff3a0', '#ffd27a', '#b8ecff'], rise = 2.4) {
  const tex = sparkleTexture(); const list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: colors[i % colors.length], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.userData = { life: Math.random(), speed: 0.3 + Math.random() * 0.5, x: (Math.random() - 0.5) * area, z: (Math.random() - 0.5) * area, y0: Math.random() * 0.5 };
    scene.add(s); list.push(s);
  }
  return { list, update(dt, active = 1) { for (const s of list) { const u = s.userData; u.life += dt * u.speed * 0.5; if (u.life > 1) { u.life = 0; u.x = (Math.random() - 0.5) * area; u.z = (Math.random() - 0.5) * area; } s.position.set(u.x, u.y0 + u.life * rise, u.z); const a = Math.sin(u.life * Math.PI) * active; s.material.opacity = a; s.scale.setScalar(0.1 + 0.16 * a); } } };
}
function burst(scene, pos, color = '#fff3a0', n = 26, power = 3) {
  const tex = sparkleTexture(); const parts = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: Array.isArray(color) ? color[i % color.length] : color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(pos); const a = Math.random() * Math.PI * 2, b = Math.random() * 1.2;
    s.userData.v = V(Math.cos(a) * Math.cos(b), Math.sin(b) + 0.3, Math.sin(a) * Math.cos(b)).multiplyScalar(power * (0.5 + Math.random() * 0.6)); s.userData.t = 0;
    scene.add(s); parts.push(s);
  }
  return parts;
}
function stepBursts(scene, parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const s = parts[i]; s.userData.t += dt; s.userData.v.y -= 5 * dt; s.position.addScaledVector(s.userData.v, dt);
    const k = s.userData.t / 1.1; s.material.opacity = 1 - k; s.scale.setScalar(0.22 * (1 - k * 0.5));
    if (k >= 1) { s.parent.remove(s); s.material.dispose(); parts.splice(i, 1); }
  }
}
// raio (relâmpago) de um ponto a outro
function boltMesh(from, to, color = '#bff6ff', width = 0.07) {
  const pts = [from.clone()]; const n = 9;
  for (let i = 1; i < n; i++) { const k = i / n; const p = from.clone().lerp(to, k); p.x += (Math.random() - 0.5) * 0.6; p.z += (Math.random() - 0.5) * 0.6; pts.push(p); }
  pts.push(to.clone());
  const g = taperTube(pts, width, width * 0.5, 30);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
  const glow = new THREE.Mesh(taperTube(pts, width * 3, width * 1.5, 30), new THREE.MeshBasicMaterial({ color: '#5fc8ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.add(glow); return m;
}

// ---------- texturas de chão ----------
const texCache = new Map();
function canvasTex(w, h, draw, rep = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t;
}
function rnd0(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function blobs(x, w, h, n, r0, r1, colors, a, rnd) { for (let i = 0; i < n; i++) { x.globalAlpha = a * (0.5 + rnd() * 0.5); x.fillStyle = colors[i % colors.length]; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, r0 + rnd() * (r1 - r0), (r0 + rnd() * (r1 - r0)) * 0.7, rnd() * 3, 0, 7); x.fill(); } x.globalAlpha = 1; }
function groundTex(el, base) {
  const key = 'g' + el + base; if (texCache.has(key)) return texCache.get(key);
  const rnd = rnd0(el.length * 997 + 7); let emis = null;
  const map = canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const d = shade(base, 0, 0, -0.08), l = shade(base, 0, 0, 0.07), d2 = shade(base, 0.03, 0.05, -0.15);
    blobs(x, w, h, 260, 10, 40, [d, l, d2], 0.35, rnd);
    if (['planta', 'agua'].includes(el)) { for (let i = 0; i < 9000; i++) { x.strokeStyle = rnd() < 0.5 ? shade(base, 0.02, 0.1, -0.12) : shade(base, -0.02, 0.05, 0.1); x.globalAlpha = 0.5; x.beginPath(); const px = rnd() * w, py = rnd() * h; x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 2, py - 3 - rnd() * 4); x.stroke(); } blobs(x, w, h, 18, 6, 14, ['#8a6a48'], 0.35, rnd); }
    if (el === 'gelo') { blobs(x, w, h, 120, 10, 50, ['#ffffff', '#d8f0fa'], 0.5, rnd); for (let i = 0; i < 40; i++) { x.globalAlpha = 0.25; x.strokeStyle = '#9fd4ea'; x.lineWidth = 1.5; x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * 60; py += (rnd() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); } }
    if (['fogo', 'pedra', 'eletrico', 'cosmo', 'vento'].includes(el)) { for (let i = 0; i < 70; i++) { x.globalAlpha = 0.45; x.strokeStyle = shade(base, 0, 0, -0.2); x.lineWidth = 2; x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (rnd() - 0.5) * 50; py += (rnd() - 0.5) * 50; x.lineTo(px, py); } x.stroke(); } blobs(x, w, h, 300, 1, 4, [shade(base, 0, 0, 0.15)], 0.5, rnd); }
    if (el === 'pedra') { for (let y = 0; y < h; y += 26) { x.globalAlpha = 0.18; x.fillStyle = y % 52 ? '#ffd7a8' : '#7a4a2a'; x.fillRect(0, y + rnd() * 6, w, 8); } }
    if (el === 'cosmo') blobs(x, w, h, 200, 1, 2.5, ['#ffffff', '#ffb8f8', '#9fd0ff'], 0.8, rnd);
    x.globalAlpha = 1;
  }, 3);
  if (el === 'fogo' || el === 'cosmo' || el === 'eletrico') {
    const r2 = rnd0(el.length * 31 + 3);
    emis = canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
      const col = el === 'fogo' ? '#ff6a10' : el === 'cosmo' ? '#c88cff' : '#ffe14a';
      x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 10; x.lineWidth = el === 'fogo' ? 4 : 2;
      for (let i = 0; i < (el === 'fogo' ? 28 : 14); i++) { x.beginPath(); let px = r2() * w, py = r2() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r2() - 0.5) * 60; py += (r2() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
      if (el === 'cosmo') blobs(x, w, h, 200, 1, 2.5, ['#ffffff'], 1, r2);
    }, 3);
  }
  const out = { map, emis }; texCache.set(key, out); return out;
}
const cliffTex = (c) => { const k = 'cl' + c; if (!texCache.has(k)) { const rnd = rnd0(77); texCache.set(k, canvasTex(512, 128, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) { x.globalAlpha = 0.25; x.fillStyle = y % 20 ? shade(c, 0, 0, 0.1) : shade(c, 0, 0, -0.15); x.fillRect(0, y + rnd() * 4, w, 4 + rnd() * 4); } blobs(x, w, h, 200, 2, 10, [shade(c, 0, 0, -0.2)], 0.4, rnd); x.globalAlpha = 1; })); } return texCache.get(k); };

// ======================= FORJA DO TROVÃO =======================
export function forgeScene() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#1b1d33', 14, 34);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const sunL = lights(scene, { sky: '#8fa8ff', ground: '#2a2030', sun: '#ffd9b0', sunI: 1.6, hemiI: 0.9, radius: 7 });
  const b = new Builder(false);
  const root = new THREE.Group(); scene.add(root);
  // piso de pedra com anel de runas
  const stone = mat('#6a6478', { kind: 'pedra', seed: 11, rough: 0.9 });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.8, 0.6, 64), stone); floor.position.y = -0.3; floor.receiveShadow = true; root.add(floor);
  const runeMat = mat('#2fd8ff', { glow: 0.5, emis: '#2fb8ff' }).clone();
  const runeRing = new THREE.Group(); runeRing.position.y = 0.03; root.add(runeRing);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; const m = new THREE.Mesh(i % 2 ? SHAPES.bolt : GEO.oct, runeMat); m.position.set(Math.cos(a) * 3.9, 0, Math.sin(a) * 3.9); if (i % 2) { m.rotation.set(-Math.PI / 2, 0, a); m.scale.setScalar(0.22); } else m.scale.set(0.1, 0.03, 0.1); runeRing.add(m); }
  const runeCircle = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.03, 8, 120), runeMat); runeCircle.rotation.x = Math.PI / 2; runeRing.add(runeCircle);
  const runeCircle2 = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.02, 8, 120), runeMat); runeCircle2.rotation.x = Math.PI / 2; runeRing.add(runeCircle2);
  // fornalha ao fundo (arco de pedra com fogo)
  const furn = b.g(root, [0, 0, -3.8]);
  const brick = mat('#5a4a4a', { kind: 'pedra', seed: 4, rough: 0.95 });
  b.m(furn, GEO.box, brick, [0, 1.4, 0], [3.4, 2.8, 1.4]);
  b.m(furn, GEO.box, brick, [0, 3.1, 0], [2.4, 0.8, 1.2]);
  b.m(furn, GEO.cyl, brick, [0, 4.4, 0], [0.45, 1.8, 0.45]);
  b.m(furn, GEO.box, mat('#1a0e0a', { rough: 1 }), [0, 0.95, 0.68], [1.5, 1.1, 0.1]);
  const mouth = b.m(furn, GEO.box, mat('#ff7a1a', { glow: 1.2, emis: '#ff5a10' }), [0, 0.95, 0.62], [1.4, 1.0, 0.02]); mouth.castShadow = false;
  for (let i = 0; i < 7; i++) { const f = b.m(furn, SHAPES.flame, mat(i % 2 ? '#ffcc33' : '#ff6a1a', { glow: 2.2, emis: i % 2 ? '#ffcc33' : '#ff5a10' }), [(i - 3) * 0.2, 0.45, 0.72], 0.45 + (i % 3) * 0.12, [0, 0, (i - 3) * 0.08]); f.castShadow = false; f.userData.flame = true; }
  const fireL = new THREE.PointLight('#ff8a3c', 18, 10, 1.6); fireL.position.set(0, 1.2, -2.6); scene.add(fireL);
  for (const sx of [1, -1]) { // pilares com braseiros
    const p = b.g(root, [sx * 3.6, 0, -1.6]);
    b.m(p, GEO.cyl, brick, [0, 1.3, 0], [0.38, 2.6, 0.38]); b.m(p, GEO.cyl, mat('#3a3a44', { metal: 0.7, rough: 0.4 }), [0, 2.75, 0], [0.55, 0.3, 0.55]);
    for (let i = 0; i < 3; i++) { const f = b.m(p, SHAPES.flame, mat(i ? '#ffcc33' : '#ff5a1a', { glow: 2, emis: '#ff7a1a' }), [0, 2.9, 0], 0.55 - i * 0.12, [0, i * 1.05, 0]); f.castShadow = false; f.userData.flame = true; }
  }
  // bigorna
  const iron = mat('#8a90a4', { rough: 0.32, metal: 0.9 });
  const anvil = b.g(root, [0, 0, 0]);
  b.m(anvil, GEO.box, mat('#3e3438', { kind: 'pedra', seed: 2, rough: 0.9 }), [0, 0.3, 0], [1.3, 0.6, 1.0]);
  b.m(anvil, GEO.box, iron, [0, 0.75, 0], [0.55, 0.35, 0.45]);
  b.m(anvil, GEO.box, iron, [0, 1.05, 0], [1.5, 0.28, 0.62]);
  b.m(anvil, GEO.cone, iron, [1.05, 1.07, 0], [0.22, 0.65, 0.2], [0, 0, -Math.PI / 2]);
  const anvilTop = b.m(anvil, GEO.box, mat('#7df9ff', { glow: 0.0, emis: '#7df9ff' }), [0, 1.2, 0], [1.4, 0.02, 0.55]); anvilTop.material = anvilTop.material.clone();
  const anvilGlow = new THREE.PointLight('#7df9ff', 0, 4); anvilGlow.position.set(0, 1.6, 0.4); scene.add(anvilGlow);
  // o martelo (cabo de couro, cabeça com runas)
  const hammer = b.g(root, [0.25, 2.5, 0.3]); hammer.scale.setScalar(1.35);
  const hm = mat('#b4bccf', { rough: 0.25, metal: 0.95 });
  const head = b.g(hammer, [0, 0, 0]);
  b.m(head, GEO.box, hm, [0, 0, 0], [0.95, 0.5, 0.5]);
  for (const sx of [1, -1]) b.m(head, GEO.box, mat('#a9b0c2', { rough: 0.25, metal: 0.95 }), [sx * 0.5, 0, 0], [0.08, 0.58, 0.58]);
  const runeOn = mat('#7df9ff', { glow: 1.5, emis: '#7df9ff' });
  for (const sz of [1, -1]) { const r = b.m(head, SHAPES.bolt, runeOn, [0, 0, sz * 0.26], 0.16, [0, 0, 0]); r.castShadow = false; }
  b.m(hammer, GEO.cyl, mat('#5a3a24', { rough: 0.8 }), [0, -0.75, 0], [0.07, 1.2, 0.07]);
  for (let i = 0; i < 5; i++) b.m(hammer, GEO.cyl, mat('#3a2414', { rough: 0.9 }), [0, -0.3 - i * 0.2, 0], [0.085, 0.06, 0.085], [0.2, 0, 0]);
  b.m(hammer, GEO.sph, hm, [0, -1.4, 0], 0.11);
  // nuvens de tempestade no alto
  const clouds = new THREE.Group(); scene.add(clouds);
  const cm = mat('#3a3d5c', { rough: 1 });
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const c = b.g(clouds, [Math.cos(a) * 9, 7 + Math.sin(i) * 0.8, Math.sin(a) * 9 - 3]); for (let j = 0; j < 4; j++) b.m(c, GEO.sph, cm, [j * 1.3 - 2, Math.sin(j) * 0.4, 0], [1.4, 0.9, 1.1]).castShadow = false; }
  const embers = makeSparkles(scene, 40, 5, ['#ffb347', '#ff7a1a', '#ffe08a'], 4);
  const runes = makeSparkles(scene, 18, 2.2, ['#7df9ff', '#bff6ff'], 2);

  camera.position.set(0, 4.4, 10.5); camera.lookAt(0, 1.0, 0);
  let bursts = [], falling = [], charge = 0, chargeTarget = 0, egg = null, eggT = 0, wobble = 0, creature = null, swing = -1, bolts = [], flash = 0, shake = 0, glowCol = new THREE.Color('#7df9ff');
  const flashL = new THREE.PointLight('#bff6ff', 0, 20); flashL.position.set(0, 6, 2); scene.add(flashL);
  const camBase = camera.position.clone(), look = V(0, 1.2, 0);
  const api = {
    scene, camera,
    fit(w, h) { const portrait = h > w; camera.fov = portrait ? 58 : 42; camBase.set(0, portrait ? 5.2 : 4.4, portrait ? 12.5 : 10.5); look.set(0, portrait ? 1.8 : 1.0, 0); camera.position.copy(camBase); camera.lookAt(look); camera.updateProjectionMatrix(); },
    dropItem(emoji, color) { const s = itemSprite(emoji, 0.7, color); s.position.set((Math.random() - 0.5) * 0.8, 4, 0.3); scene.add(s); falling.push({ s, v: 0, color }); },
    clearItems() { for (const f of falling) scene.remove(f.s); falling = []; },
    setLiquid(color) { glowCol.set(color); },
    setStir(p) { chargeTarget = p; },
    strike() { swing = 0; },
    lightning() { const bm = boltMesh(V((Math.random() - 0.5) * 2, 9, -1), V(0, 1.25, 0), '#e6fbff', 0.09); scene.add(bm); bolts.push({ m: bm, t: 0 }); flash = 1; shake = 0.5; },
    showEgg(el, rar) {
      if (egg) scene.remove(egg); api.lightning();
      egg = buildEgg(el, rar); egg.position.y = 1.2; egg.scale.setScalar(0.01); hammer.visible = false; egg.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(egg); eggT = 0;
      glowCol.set(rarColor(rar)); chargeTarget = 1;
      bursts.push(...burst(scene, V(0, 1.6, 0), [rarColor(rar), '#ffffff', '#7df9ff'], 40, 4));
    },
    tapEgg() { wobble = 1; if (egg) bursts.push(...burst(scene, V(0, 1.8, 0.3), ['#ffffff', '#7df9ff'], 12, 2.5)); },
    reveal(spId, shiny) {
      if (egg) { bursts.push(...burst(scene, V(0, 1.8, 0), ['#ffffff', '#7df9ff', '#ffe066', '#ff9f5a'], 80, 5)); scene.remove(egg); egg = null; }
      api.lightning();
      if (creature) scene.remove(creature);
      creature = buildCreature({ sp: spId }, { shiny }); creature.position.set(0, 1.22, 0.05); creature.userData.full = creature.scale.x; creature.scale.setScalar(0.01); creature.userData.grow = 0; scene.add(creature);
      creature.userData.ctrl.happy(); hammer.visible = false;
    },
    clearCreature() { if (creature) scene.remove(creature); creature = null; chargeTarget = 0; hammer.visible = true; },
    onTap(r) { if (creature && r.intersectObject(creature, true).length) creature.userData.ctrl.jump(); },
    update(t, dt) {
      charge += (chargeTarget - charge) * Math.min(1, dt * 4);
      anvilTop.material.emissive.copy(glowCol); anvilTop.material.emissiveIntensity = charge * 2.5; anvilGlow.color.copy(glowCol); anvilGlow.intensity = charge * 8;
      runeMat.emissiveIntensity = 0.25 + charge * 0.9; runeRing.rotation.y += dt * (0.05 + charge * 0.6);
      fireL.intensity = 16 + Math.sin(t * 9) * 3 + Math.sin(t * 23) * 2;
      root.traverse((o) => { if (o.userData.flame) { o.scale.y = o.scale.x * (1 + Math.sin(t * 12 + o.rotation.y * 3) * 0.15); } });
      clouds.rotation.y += dt * 0.02;
      // martelo: flutua, ou bate
      if (swing >= 0) {
        swing += dt * 3.2; const k = swing;
        if (k < 0.35) { hammer.rotation.z = -k / 0.35 * 1.2; hammer.position.y = 2.5 + k; }
        else if (k < 0.55) { const q = (k - 0.35) / 0.2; hammer.rotation.z = -1.2 + q * 2.0; hammer.position.y = 2.85 - q * 1.2; }
        else if (k < 0.6) { if (!hammer.userData.hit) { hammer.userData.hit = true; bursts.push(...burst(scene, V(0, 1.3, 0.2), ['#ffd27a', '#ffffff', '#7df9ff'], 26, 4)); shake = 0.3; flash = Math.max(flash, 0.35); api.onHit?.(); } }
        else if (k < 1.2) { const q = (k - 0.6) / 0.6; hammer.rotation.z = 0.8 * (1 - q); hammer.position.y = 1.65 + q * 0.85; }
        else { swing = -1; hammer.userData.hit = false; }
      } else { hammer.position.y = 2.5 + Math.sin(t * 1.6) * 0.08; hammer.rotation.z = Math.sin(t * 1.1) * 0.08; hammer.rotation.y += dt * 0.4; }
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i]; f.v += dt * 9; f.s.position.y -= f.v * dt; f.s.material.rotation += dt * 3;
        if (f.s.position.y < 1.3) { scene.remove(f.s); falling.splice(i, 1); bursts.push(...burst(scene, V(f.s.position.x, 1.3, f.s.position.z), [f.color || '#7df9ff', '#ffffff'], 16, 2.5)); glowCol.set(f.color || '#7df9ff'); chargeTarget = Math.max(chargeTarget, 0.4); }
      }
      if (egg) { eggT += dt; const g = Math.min(1, eggT / 0.5); egg.scale.setScalar(1.35 * (1 - Math.pow(1 - g, 3) + Math.sin(g * Math.PI) * 0.2)); egg.position.y = 1.25 + Math.sin(t * 2) * 0.05; wobble = Math.max(0, wobble - dt * 2.5); egg.userData.shell.rotation.z = Math.sin(t * 30) * 0.2 * wobble; egg.rotation.y += dt * 0.8; }
      if (creature) { const u = creature.userData; u.grow = Math.min(1, u.grow + dt * 2.2); const k = u.grow; creature.scale.setScalar(u.full * ((1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.18)); u.ctrl.update(t, dt); }
      for (let i = bolts.length - 1; i >= 0; i--) { const bo = bolts[i]; bo.t += dt; bo.m.material.opacity = Math.max(0, 1 - bo.t * 3) * (Math.sin(bo.t * 60) > -0.3 ? 1 : 0.2); bo.m.children[0].material.opacity = bo.m.material.opacity * 0.35; if (bo.t > 0.4) { scene.remove(bo.m); bolts.splice(i, 1); } }
      flash = Math.max(0, flash - dt * 3); flashL.intensity = flash * 60;
      shake = Math.max(0, shake - dt * 1.5);
      const zoomIn = creature || egg ? 1 : 0; api._z = (api._z || 0) + (zoomIn - (api._z || 0)) * Math.min(1, dt * 2.5);
      const cz = camBase.clone().lerp(V(0, 2.9, 5.6), api._z * 0.85), lz = look.clone().lerp(V(0, 1.7, 0), api._z * 0.85);
      camera.position.set(cz.x + (Math.random() - 0.5) * shake * 0.3, cz.y + (Math.random() - 0.5) * shake * 0.3, cz.z); camera.lookAt(lz);
      embers.update(dt, 0.8); runes.update(dt, charge);
      stepBursts(scene, bursts, dt);
    },
  };
  return api;
}
export const nestScene = forgeScene;

// ======================= FAZENDINHA =======================
// opts: { nivel, amigos: [{uid, spId, shiny, bolsa, emoji}], brilhos, resgate: {salvo}, nodes: {arv, roc, cant}, base }
export function farmScene(region, opts) {
  const el = region.el;
  const scene = new THREE.Scene();
  const fogC = shade(region.ceu[1], 0, -0.1, -0.05); scene.fog = new THREE.Fog(fogC, 20, 52);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const b = new Builder(false); const rnd = mulberry(region.id.length * 97 + 13);
  const lvl = opts.nivel; const radius = 6 + lvl * 1.0;
  const dark = ['fogo', 'eletrico', 'cosmo'].includes(el);
  lights(scene, { sky: dark ? '#9aa0ff' : '#d8ecff', ground: shade(region.chao, 0, 0, -0.2), sun: el === 'fogo' ? '#ffc08a' : dark ? '#c8c8ff' : '#fff2dc', sunI: dark ? 1.8 : 2.6, hemiI: dark ? 0.8 : 1.15, radius: radius + 2 });
  const world = new THREE.Group(); scene.add(world);
  const gt = groundTex(el, region.chao);
  const topM = new THREE.MeshStandardMaterial({ map: gt.map, bumpMap: gt.map, bumpScale: 2, roughness: el === 'gelo' ? 0.45 : 0.95, emissiveMap: gt.emis, emissive: gt.emis ? new THREE.Color('#ffffff') : new THREE.Color('#000'), emissiveIntensity: gt.emis ? 1.1 : 0 });
  const topGeo = new THREE.CircleGeometry(radius, 96);
  const top = new THREE.Mesh(topGeo, topM); top.rotation.x = -Math.PI / 2; top.receiveShadow = true; world.add(top);
  const cl = el === 'gelo' ? '#b8ccd6' : el === 'cosmo' ? '#2a2244' : el === 'fogo' ? '#2a1e1e' : el === 'pedra' ? '#a0603a' : el === 'eletrico' ? '#3a3c4a' : '#7a6248';
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.45, 3.2, 64, 4, true), new THREE.MeshStandardMaterial({ map: cliffTex(cl), roughness: 1 }));
  cliff.material.map.repeat.set(4, 1); cliff.position.y = -1.6; world.add(cliff);
  const bottom = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.45, 2.5, 32), new THREE.MeshStandardMaterial({ map: cliffTex(cl), roughness: 1 })); bottom.rotation.x = Math.PI; bottom.position.y = -4.4; world.add(bottom);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2 + rnd() * 0.1; const r = radius * (0.97 + rnd() * 0.04); rock(b, world, [Math.cos(a) * r, 0.05, Math.sin(a) * r], 0.25 + rnd() * 0.35, cl, rnd); }
  if (['planta', 'agua', 'vento'].includes(el)) grass(world, radius, region.chao, rnd, 700 + lvl * 250);

  // ---- posições fixas dos recursos (o jogo e a tela usam o mesmo índice) ----
  const N = opts.nodes;
  const plotPos = N.cant.map((_, i) => { const c = i % 4, r = Math.floor(i / 4); return V(-radius * 0.45 + (c - 1.5) * 1.15, 0, radius * 0.15 + (r - 0.5) * 1.15); });
  const treePos = N.arv.map((_, i) => { const a = Math.PI * (1.05 + (i / Math.max(1, N.arv.length)) * 0.8) + 0.2; return V(Math.cos(a) * radius * 0.7, 0, Math.sin(a) * radius * 0.7); });
  const rockPos = N.roc.map((_, i) => { const a = Math.PI * (1.95 + (i / Math.max(1, N.roc.length)) * 0.55); return V(Math.cos(a) * radius * 0.66, 0, Math.sin(a) * radius * 0.66); });
  const basePos = { bancada: V(radius * 0.3, 0, radius * 0.45), forno: V(radius * 0.58, 0, radius * 0.1), totem: V(0, 0, -radius * 0.2) };
  const npcPos = V(radius * 0.55, 0, -radius * 0.45);
  const occupied = [...plotPos, ...treePos, ...rockPos, ...Object.values(basePos), npcPos];

  // canteiros
  const soilM = mat('#5a3a24', { kind: 'pele', seed: 5, rough: 1 }), wetM = mat('#3a2416', { rough: 0.6 });
  const plots = plotPos.map((p, i) => {
    const g = b.g(world, p.toArray());
    const box = b.m(g, GEO.box, soilM, [0, 0.08, 0], [1.0, 0.16, 1.0]); box.receiveShadow = true;
    for (const [x, z] of [[-0.5, 0], [0.5, 0], [0, -0.5], [0, 0.5]]) b.m(g, GEO.box, mat('#7a5a3a', { rough: 0.9 }), [x, 0.12, z], x ? [0.06, 0.2, 1.06] : [1.06, 0.2, 0.06]);
    const seeds = b.g(g, [0, 0.17, 0]); for (let k = 0; k < 6; k++) b.m(seeds, GEO.sphLo, mat('#d9b070'), [((k % 3) - 1) * 0.28, 0, (Math.floor(k / 3) - 0.5) * 0.4], 0.04);
    const sprout = b.g(g, [0, 0.16, 0]); for (let k = 0; k < 4; k++) { const sg = b.g(sprout, [((k % 2) - 0.5) * 0.45, 0, (Math.floor(k / 2) - 0.5) * 0.45]); b.m(sg, GEO.cyl, mat('#4f9d3a'), [0, 0.12, 0], [0.025, 0.24, 0.025]); for (const sx of [1, -1]) b.m(sg, SHAPES.leaf, mat('#6fbf3a'), [0, 0.22, 0], 0.16, [0, 0, -sx * 0.7]); }
    const bush = b.g(g, [0, 0.16, 0]); for (let k = 0; k < 4; k++) { const bg = b.g(bush, [((k % 2) - 0.5) * 0.45, 0, (Math.floor(k / 2) - 0.5) * 0.45]); b.m(bg, GEO.ico, mat('#3f8a2e', { flat: true }), [0, 0.25, 0], 0.22); for (let f = 0; f < 3; f++) b.m(bg, GEO.sph, mat('#e8322a', { rough: 0.3 }), [Math.cos(f * 2) * 0.15, 0.3 + f * 0.05, Math.sin(f * 2) * 0.15], 0.07); }
    const bubble = itemSprite('🍎', 0.6, '#ff8a1c'); bubble.position.y = 1.1; bubble.userData.plotBubble = i; g.add(bubble);
    g.userData = { tipo: 'canteiro', idx: i, box, seeds, sprout, bush, bubble };
    return g;
  });
  // árvores e rochas de recurso
  const trees = treePos.map((p, i) => {
    const g = b.g(world, p.toArray()); g.rotation.y = rnd() * 6; const full = b.g(g); const s = 0.9 + rnd() * 0.3; full.scale.setScalar(s);
    resourceTree(b, full, el, rnd);
    const stump = b.g(g); b.m(stump, GEO.cyl, mat('#6a4a32', { kind: 'couro', seed: 4 }), [0, 0.12, 0], [0.18, 0.24, 0.18]); b.m(stump, GEO.cyl, mat('#d9b98a'), [0, 0.245, 0], [0.16, 0.01, 0.16]);
    g.userData = { tipo: 'arvore', idx: i, full, stump }; return g;
  });
  const rocks = rockPos.map((p, i) => {
    const g = b.g(world, p.toArray()); const full = b.g(g);
    const rr = rock(b, full, [0, 0.45, 0], 0.75, el === 'cosmo' ? '#3a3060' : el === 'gelo' ? '#9ab0c0' : '#7a7480', rnd); rr.castShadow = true;
    for (let k = 0; k < 5; k++) { const a = k * 1.3; b.m(full, GEO.oct, mat(k % 2 ? '#b0b8c8' : '#d08a4a', { metal: 0.8, rough: 0.3 }), [Math.cos(a) * 0.5, 0.35 + (k % 3) * 0.2, Math.sin(a) * 0.5], 0.09); }
    const rubble = b.g(g); for (let k = 0; k < 4; k++) rock(b, rubble, [Math.cos(k * 1.6) * 0.3, 0.08, Math.sin(k * 1.6) * 0.3], 0.14, '#7a7480', rnd);
    g.userData = { tipo: 'rocha', idx: i, full, rubble }; return g;
  });
  // a base (só na Floresta Viva)
  const base = {};
  if (opts.base) {
    const wood = mat('#8a5a34', { kind: 'couro', seed: 6, rough: 0.9 }), dkw = mat('#5a3a22', { rough: 0.9 });
    if (opts.base.bancada) { const g = b.g(world, basePos.bancada.toArray(), [0, -0.6, 0]); b.m(g, GEO.box, wood, [0, 0.75, 0], [1.6, 0.12, 0.8]); for (const [x, z] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) b.m(g, GEO.box, dkw, [x, 0.37, z], [0.1, 0.74, 0.1]); b.m(g, GEO.box, mat('#9aa0b0', { metal: 0.8, rough: 0.3 }), [0.4, 0.88, 0], [0.4, 0.12, 0.25]); b.m(g, GEO.cyl, dkw, [-0.4, 0.86, 0.1], [0.04, 0.4, 0.04], [0, 0, Math.PI / 2]); b.m(g, GEO.box, mat('#b4bccf', { metal: 0.9, rough: 0.25 }), [-0.2, 0.86, 0.1], [0.14, 0.12, 0.1]); g.userData = { tipo: 'bancada' }; base.bancada = g; }
    if (opts.base.forno) { const g = b.g(world, basePos.forno.toArray(), [0, -1.2, 0]); const st = mat('#6a6470', { kind: 'pedra', seed: 9, rough: 0.95 }); b.m(g, GEO.cyl, st, [0, 0.7, 0], [0.7, 1.4, 0.7]); b.m(g, GEO.cone, st, [0, 1.65, 0], [0.55, 0.5, 0.55]); b.m(g, GEO.cyl, st, [0, 2.1, 0], [0.18, 0.6, 0.18]); const mouth = b.m(g, GEO.box, mat('#ff7a1a', { glow: 0.2, emis: '#ff5a10' }).clone(), [0, 0.5, 0.62], [0.5, 0.45, 0.1]); mouth.castShadow = false; const fl = new THREE.PointLight('#ff8a3c', 0, 4); fl.position.set(0, 0.6, 1); g.add(fl); g.userData = { tipo: 'forno', mouth, fl }; base.forno = g; }
    for (let i = 0; i < (opts.base.casinha || 0); i++) { const a = -0.4 + i * 0.35; const g = b.g(world, [Math.cos(a) * radius * 0.8, 0, Math.sin(a) * radius * 0.8], [0, -a - Math.PI / 2, 0]); b.m(g, GEO.box, mat('#e8d8b8', { rough: 0.9 }), [0, 0.45, 0], [0.9, 0.9, 0.8]); b.m(g, GEO.cone, mat('#b04a3a', { rough: 0.8 }), [0, 1.15, 0], [0.8, 0.6, 0.8], [0, Math.PI / 4, 0]); b.m(g, GEO.box, dkw, [0, 0.3, 0.41], [0.3, 0.5, 0.02]); occupied.push(g.position.clone()); }
    if (opts.base.totem) { const g = b.g(world, basePos.totem.toArray()); b.m(g, GEO.box, mat('#6a6478', { kind: 'pedra', seed: 3, rough: 0.9 }), [0, 0.8, 0], [0.5, 1.6, 0.5]); const bolt = b.m(g, SHAPES.bolt, mat('#7df9ff', { glow: 1.8 }), [0, 1.0, 0.27], 0.3); bolt.castShadow = false; b.m(g, GEO.oct, mat('#7df9ff', { glow: 2 }), [0, 1.9, 0], 0.18); }
  }
  // decoração do bioma (anel de fora)
  const props = 10 + lvl * 4;
  for (let i = 0; i < props; i++) {
    const a = rnd() * Math.PI * 2, r = radius * (0.84 + rnd() * 0.1);
    const p = V(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (occupied.some((q) => q.distanceTo(p) < 1.6)) continue;
    biomeProp(b, world, el, p.toArray(), 0.55 + rnd() * 0.4, rnd, scene);
  }
  const sky = new THREE.Group(); scene.add(sky);
  if (el === 'cosmo' || el === 'eletrico') { const pts = new THREE.BufferGeometry(); const arr = []; for (let i = 0; i < 600; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 0.8 + 0.1; arr.push(Math.cos(a) * 60 * Math.cos(e), 60 * Math.sin(e), Math.sin(a) * 60 * Math.cos(e)); } pts.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); sky.add(new THREE.Points(pts, new THREE.PointsMaterial({ color: '#ffffff', size: 0.35, fog: false }))); }
  if (el !== 'cosmo') { const cm = mat(dark ? '#4a4c66' : '#ffffff', { rough: 1 }); for (let i = 0; i < 7; i++) { const c = b.g(sky, [(rnd() - 0.5) * 40, 10 + rnd() * 5, -16 - rnd() * 10]); for (let j = 0; j < 4; j++) b.m(c, GEO.sph, cm, [j * 1.1 - 1.6, Math.sin(j) * 0.3, 0], [1.2 - Math.abs(j - 1.5) * 0.2, 0.75, 0.8]).castShadow = false; } }

  // companheiros
  const walkers = [];
  for (const it of opts.amigos) {
    const c = buildCreature({ sp: it.spId }, { shiny: it.shiny }); c.scale.multiplyScalar(1.5); c.userData.height *= 1.5;
    const a = rnd() * Math.PI * 2; c.position.set(Math.cos(a) * radius * 0.3, 0, Math.sin(a) * radius * 0.3);
    world.add(c);
    const w = { c, uid: it.uid, target: new THREE.Vector3(), wait: rnd() * 2, bubbles: [], job: null, hitT: 0 };
    newTarget(w); walkers.push(w); setBubbles(w, it.bolsa, it.emoji);
  }
  function newTarget(w) { const a = Math.random() * Math.PI * 2, r = Math.random() * radius * 0.5; w.target.set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  function setBubbles(w, n, emoji) {
    for (const s of w.bubbles) w.c.remove(s); w.bubbles = [];
    const k = w.c.scale.x; n = Math.min(3, n || 0);
    for (let i = 0; i < n; i++) { const s = itemSprite(emoji || '🎁', 0.6 / k, '#ffd23f'); s.userData.bubble = true; s.position.set((i - (n - 1) / 2) * 0.6 / k, (w.c.userData.height + 0.5) / k, 0); w.c.add(s); w.bubbles.push(s); }
  }
  const sparkles = [];
  function placeSparkles(n) {
    for (const s of sparkles) world.remove(s); sparkles.length = 0;
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTexture(), color: '#fff2a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); const a = rnd() * Math.PI * 2, r = radius * (0.15 + rnd() * 0.3); s.position.set(Math.cos(a) * r, 0.35, Math.sin(a) * r); s.scale.setScalar(0.8); s.userData.sparkle = true; world.add(s); sparkles.push(s); }
  }
  placeSparkles(opts.brilhos || 0);
  let npc = null, trap = null;
  if (opts.resgate) {
    const r = region.resgate;
    npc = buildCreature({ npc: { arch: r.arch, cor: r.cor, chapeu: r.chapeu } }); npc.scale.multiplyScalar(1.5);
    npc.position.copy(npcPos); world.add(npc);
    if (!opts.resgate.salvo) trap = makeTrap(b, world, r.armadilha, npcPos, npc);
  }
  const amb = makeSparkles(scene, 30, radius * 1.4, el === 'fogo' ? ['#ffb347', '#ff7a1a'] : el === 'cosmo' ? ['#ffffff', '#ffb8f8'] : el === 'eletrico' ? ['#fff47a', '#bff6ff'] : el === 'gelo' ? ['#ffffff', '#dff6ff'] : ['#ffffff', '#fff3a0'], el === 'gelo' ? -2 : 2.4);
  let bursts = [], camAng = 0.35, zoom = 1, boltT = 3, nodeState = N, fornoOn = false;
  function applyNodes(st) {
    nodeState = st;
    st.arv.forEach((n, i) => { if (!trees[i]) return; trees[i].userData.full.visible = n.vivo; trees[i].userData.stump.visible = !n.vivo; });
    st.roc.forEach((n, i) => { if (!rocks[i]) return; rocks[i].userData.full.visible = n.vivo; rocks[i].userData.rubble.visible = !n.vivo; });
    st.cant.forEach((n, i) => { const u = plots[i]?.userData; if (!u) return; u.seeds.visible = n.st === 'semeado'; u.sprout.visible = n.st === 'regado'; u.bush.visible = n.st === 'pronto'; u.bubble.visible = n.st === 'pronto'; u.box.material = n.st === 'regado' || n.st === 'pronto' ? wetM : soilM; u.grow = n.grow ?? 0; });
  }
  applyNodes(N);
  const nodePos = (tipo, i) => tipo === 'cortar' ? treePos[i] : tipo === 'minerar' ? rockPos[i] : ['semear', 'regar', 'colher'].includes(tipo) ? plotPos[i] : tipo === 'fundir' ? basePos.forno : null;
  const api = {
    scene, camera, world, walkers,
    fit(w, h) { api.portrait = h > w; },
    setAmigoBubbles(uid, n, emoji) { const w = walkers.find((x) => x.uid === uid); if (w) setBubbles(w, n, emoji); },
    setSparkles: placeSparkles,
    setNodes: applyNodes,
    setForno(on) { fornoOn = on; },
    // trabalho do companheiro: vai até o recurso e trabalha
    setJob(uid, tipo, idx) { const w = walkers.find((x) => x.uid === uid); if (!w) return; const p = tipo ? nodePos(tipo, idx) : null; w.job = p ? { tipo, p: p.clone() } : tipo === 'cheio' ? { tipo, p: null } : null; },
    popAt(obj, color) { const p = new THREE.Vector3(); obj.getWorldPosition(p); bursts.push(...burst(scene, p, color || ['#fff3a0', '#ffffff'], 18, 2.5)); },
    freeNpc() { if (trap) { const p = new THREE.Vector3(); npc.getWorldPosition(p); bursts.push(...burst(scene, p.setY(1), ['#ffffff', '#7df9ff', '#ffe066', '#ff9f5a'], 70, 5)); world.remove(trap.g); trap = null; } npc?.userData.ctrl.happy(); },
    pick(r) {
      const targets = [...walkers.map((w) => w.c), ...sparkles, ...(npc ? [npc] : []), ...plots, ...trees, ...rocks, ...Object.values(base)];
      const hits = r.intersectObjects(targets, true);
      for (const h of hits) {
        let o = h.object;
        if (o.userData.sparkle) return { tipo: 'brilho', obj: o };
        while (o && !walkers.some((w) => w.c === o) && o !== npc && !o.userData.tipo) o = o.parent;
        if (!o) continue;
        if (o === npc) return { tipo: 'npc', obj: npc };
        const w = walkers.find((x) => x.c === o);
        if (w) return { tipo: h.object.userData.bubble ? 'bolha' : 'amigo', walker: w, obj: h.object };
        return { tipo: o.userData.tipo, idx: o.userData.idx, obj: o };
      }
      return null;
    },
    removeSparkle(o) { world.remove(o); sparkles.splice(sparkles.indexOf(o), 1); },
    rotate(dx) { camAng += dx * 0.006; },
    zoomBy(k) { zoom = Math.min(1.35, Math.max(0.6, zoom * k)); },
    update(t, dt) {
      const dist = (radius * 1.55 + 4) * (api.portrait ? 1.4 : 1) * zoom;
      camera.position.set(Math.sin(camAng) * dist, dist * 0.62, Math.cos(camAng) * dist); camera.lookAt(0, 0.4, 0);
      sky.rotation.y += dt * 0.01;
      if (el === 'eletrico') { boltT -= dt; if (boltT < 0) { boltT = 2 + Math.random() * 4; const a = Math.random() * Math.PI * 2; const bm = boltMesh(V(Math.cos(a) * radius * 1.2, 14, Math.sin(a) * radius * 1.2 - 6), V(Math.cos(a) * radius * 1.5, -2, Math.sin(a) * radius * 1.5 - 6)); scene.add(bm); setTimeout(() => scene.remove(bm), 180); } }
      if (base.forno) { const u = base.forno.userData; u.mouth.material.emissiveIntensity = fornoOn ? 2 + Math.sin(t * 9) * 0.5 : 0.2; u.fl.intensity = fornoOn ? 6 + Math.sin(t * 11) * 2 : 0; }
      plots.forEach((p, i) => { const u = p.userData; if (u.sprout.visible) u.sprout.scale.setScalar(0.3 + 0.7 * (u.grow || 0)); if (u.bubble.visible) u.bubble.position.y = 1.1 + Math.sin(t * 3 + i) * 0.08; });
      for (const w of walkers) {
        const c = w.c; const ctrl = c.userData.ctrl;
        let goal = null;
        if (w.job?.tipo === 'cheio' || w.bubbles.length >= 3) { ctrl.setWalking(0); }
        else if (w.job?.p) goal = w.job.p;
        if (goal) {
          const d = goal.clone().sub(c.position); d.y = 0; const len = d.length();
          if (len > 0.95) { d.normalize(); c.position.addScaledVector(d, dt * 1.6); const ang = Math.atan2(d.x, d.z); c.rotation.y += ((ang - c.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6); ctrl.setWalking(1); }
          else { // trabalhando: vira para o alvo e dá golpes/pulinhos
            ctrl.setWalking(0); const ang = Math.atan2(d.x, d.z); c.rotation.y += ((ang - c.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
            w.hitT -= dt; if (w.hitT < 0) { w.hitT = 0.9; ctrl.jump(); const col = { cortar: ['#c9a06a', '#8a6a44'], minerar: ['#c0c8d8', '#ffd27a'], regar: ['#8fd8ff', '#ffffff'], semear: ['#d9b070', '#8ee07a'], colher: ['#ff6a5a', '#8ee07a'], fundir: ['#ffb347', '#ff6a10'] }[w.job.tipo] || ['#ffffff']; bursts.push(...burst(scene, goal.clone().setY(0.7), col, 6, 1.6)); }
          }
        } else if (!(w.job?.tipo === 'cheio' || w.bubbles.length >= 3)) {
          if (w.wait > 0) { w.wait -= dt; ctrl.setWalking(0); }
          else {
            const d = w.target.clone().sub(c.position); d.y = 0; const len = d.length();
            if (len < 0.1) { w.wait = 1.5 + Math.random() * 3; newTarget(w); }
            else { d.normalize(); c.position.addScaledVector(d, dt * 1.0); const ang = Math.atan2(d.x, d.z); c.rotation.y += ((ang - c.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 5); ctrl.setWalking(1); }
          }
        }
        ctrl.update(t, dt);
        const k = c.scale.x; w.bubbles.forEach((s, i) => { s.position.y = (c.userData.height + 0.5 + Math.sin(t * 3 + i) * 0.08) / k; });
      }
      sparkles.forEach((s, i) => { s.material.rotation = t + i; s.scale.setScalar(0.7 + Math.sin(t * 4 + i) * 0.15); });
      if (npc) { npc.userData.ctrl.update(t, dt); npc.lookAt(camera.position.x, 0, camera.position.z); }
      if (trap) trap.update(t, dt);
      world.traverse((o) => { if (o.userData.flame) o.scale.y = o.userData.flame * (1 + Math.sin(t * 11 + o.id) * 0.15); });
      amb.update(dt, 0.7); stepBursts(scene, bursts, dt);
    },
  };
  return api;
}
function resourceTree(b, g, el, rnd) {
  const trunkC = el === 'gelo' ? '#5a4a40' : el === 'cosmo' ? '#3a2a50' : el === 'eletrico' ? '#3a3a44' : '#6a4a32';
  b.m(g, taperTube([V(0, 0, 0), V(0.05, 0.8, 0), V(-0.03, 1.6, 0.02)], 0.17, 0.1), mat(trunkC, { kind: 'couro', seed: 4, rough: 0.95 }));
  const leaf = { planta: '#3f8a2e', agua: '#3f8a5a', vento: '#7fae6a', gelo: '#e8f6fa', cosmo: '#9a6aff', eletrico: '#f7cf2a', fogo: '#a03a1a', pedra: '#7a8a4a' }[el] || '#4f9d3a';
  if (el === 'gelo') { for (let i = 0; i < 3; i++) b.m(g, GEO.cone, mat(i ? '#e8f6fa' : '#2f6a5a', { rough: 0.6 }), [0, 1.1 + i * 0.45, 0], [0.75 - i * 0.18, 0.8, 0.75 - i * 0.18]); return; }
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.m(g, GEO.ico, mat(shade(leaf, 0, 0, (i % 2) * 0.06), { rough: 0.85, flat: true, glow: el === 'cosmo' || el === 'eletrico' ? 0.25 : 0, emis: leaf }), [Math.cos(a) * 0.35, 1.75 + (i % 2) * 0.25, Math.sin(a) * 0.35], 0.5 + (i % 3) * 0.1); }
  b.m(g, GEO.ico, mat(shade(leaf, 0, 0, 0.05), { rough: 0.85, flat: true }), [0, 2.25, 0], 0.55);
}
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rock(b, parent, p, s, color, rnd) {
  const g = new THREE.DodecahedronGeometry(1, 1); const pos = g.attributes.position;
  const sd = rnd() * 100; for (let i = 0; i < pos.count; i++) { const v = V(pos.getX(i), pos.getY(i), pos.getZ(i)); const h = Math.sin(Math.round(v.x * 50) * 12.9898 + Math.round(v.y * 50) * 78.233 + Math.round(v.z * 50) * 37.719 + sd) * 43758.5453; v.multiplyScalar(0.82 + (h - Math.floor(h)) * 0.3); pos.setXYZ(i, v.x, v.y * 0.7, v.z); }
  g.computeVertexNormals();
  const m = b.m(parent, g, mat(shade(color, 0, 0, (rnd() - 0.5) * 0.1), { kind: 'pedra', seed: 9, rough: 0.95, flat: true }), p, s, [rnd(), rnd() * 6, rnd()]); m.receiveShadow = true; return m;
}
function grass(parent, radius, base, rnd, n) {
  const geo = new THREE.ConeGeometry(0.035, 0.32, 3); geo.translate(0, 0.16, 0);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  const inst = new THREE.InstancedMesh(geo, m, n); const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * radius * 0.95;
    d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); d.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5); d.scale.setScalar(0.6 + rnd() * 0.9); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    inst.setColorAt(i, c.set(shade(base, (rnd() - 0.5) * 0.04, 0.1, (rnd() - 0.3) * 0.15)));
  }
  inst.receiveShadow = true; parent.add(inst);
}
function biomeProp(b, g0, el, p, s, rnd, scene) {
  const g = b.g(g0, p); g.scale.setScalar(s); g.rotation.y = rnd() * 6;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const trunk = (c, h = 1.2, r = 0.12) => b.m(g, taperTube([V(0, 0, 0), V(0.05, h * 0.5, 0), V(-0.03, h, 0.02)], r, r * 0.6), mat(c, { kind: 'couro', seed: 4, rough: 0.95 }));
  const foliage = (c, y, n = 4, r = 0.55) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; b.m(g, GEO.ico, mat(shade(c, 0, 0, (i % 2) * 0.06), { rough: 0.85, flat: true }), [Math.cos(a) * r * 0.45, y + (i % 2) * 0.25, Math.sin(a) * r * 0.45], r * (0.7 + (i % 3) * 0.15)); } b.m(g, GEO.ico, mat(shade(c, 0, 0, 0.05), { rough: 0.85, flat: true }), [0, y + 0.45, 0], r * 0.8); };
  const crystal = (c, h, glow = 0.8) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; b.m(g, GEO.oct, mat(c, { glow, emis: c, rough: 0.15, metal: 0.2 }), [Math.cos(a) * 0.15 * (i ? 1 : 0), h * (i ? 0.35 : 0.5), Math.sin(a) * 0.15 * (i ? 1 : 0)], [0.12, h * (i ? 0.35 : 0.55), 0.12], [Math.cos(a) * 0.4 * (i ? 1 : 0), 0, Math.sin(a) * 0.4 * (i ? 1 : 0)]); } };
  switch (el) {
    case 'planta': if (rnd() < 0.65) { trunk('#6a4a32', 1.6, 0.14); foliage(pick(['#3f8a2e', '#4f9d3a', '#5aa63f']), 1.6, 5, 0.7); } else { b.m(g, GEO.cyl, mat('#e8dcc8'), [0, 0.2, 0], [0.06, 0.4, 0.06]); b.m(g, GEO.sph, mat(pick(['#c0392b', '#d35400', '#8e44ad'])), [0, 0.42, 0], [0.25, 0.14, 0.25]); } break;
    case 'agua': if (rnd() < 0.5) { for (let i = 0; i < 5; i++) b.m(g, GEO.cyl, mat('#5a8a3a'), [i * 0.08 - 0.16, 0.4, (i % 2) * 0.08], [0.025, 0.8 + i * 0.1, 0.025]); } else { trunk('#5a4030', 1.2); foliage('#3f8a5a', 1.2, 3, 0.5); } break;
    case 'fogo': if (rnd() < 0.5) { rock(b, g, [0, 0.3, 0], 0.5, '#2a1e1e', rnd); const f = b.m(g, SHAPES.flame, mat('#ff6a10', { glow: 2, emis: '#ff5a10' }), [0, 0.6, 0], 0.4); f.userData.flame = 0.4; f.castShadow = false; } else { b.m(g, taperTube([V(0, 0, 0), V(0.1, 0.8, 0), V(0, 1.4, 0.1)], 0.12, 0.04), mat('#1c1414', { rough: 1 })); for (let i = 0; i < 2; i++) b.m(g, GEO.oct, mat('#ff8a1c', { glow: 1.5, emis: '#ff6a10' }), [0.1 * i, 1.0 + i * 0.3, 0], [0.08, 0.15, 0.08]); } break;
    case 'vento': if (rnd() < 0.4) { for (let i = 0; i < 4; i++) b.m(g, GEO.sph, mat('#ffffff', { rough: 1 }), [i * 0.35 - 0.5, 1.6 + Math.sin(i) * 0.12, (i % 2) * 0.2], 0.35 - Math.abs(i - 1.5) * 0.05).castShadow = false; } else rock(b, g, [0, 0.5, 0], 0.6, '#8aa39a', rnd); break;
    case 'gelo': if (rnd() < 0.5) { trunk('#5a4a40', 0.5); for (let i = 0; i < 3; i++) b.m(g, GEO.cone, mat(i ? '#e8f6fa' : '#2f6a5a', { rough: 0.6 }), [0, 0.7 + i * 0.4, 0], [0.6 - i * 0.15, 0.7, 0.6 - i * 0.15]); } else crystal('#bff0ff', 1.4, 0.3); break;
    case 'pedra': if (rnd() < 0.6) { const h = 1.5 + rnd() * 1.5; b.m(g, GEO.cyl, mat('#b0703a', { kind: 'pedra', seed: 8, rough: 0.95, flat: true }), [0, h / 2, 0], [0.5, h, 0.45]); b.m(g, GEO.cyl, mat('#c98a50', { kind: 'pedra', seed: 9, rough: 0.95, flat: true }), [0, h + 0.1, 0], [0.6, 0.2, 0.55]); } else { rock(b, g, [0, 0.25, 0], 0.4, '#a0603a', rnd); crystal(pick(['#ff9a3c', '#b57bff']), 0.8); } break;
    case 'eletrico': if (rnd() < 0.5) { b.m(g, GEO.cyl, mat('#4a4c5c', { metal: 0.8, rough: 0.35 }), [0, 0.8, 0], [0.08, 1.6, 0.08]); b.m(g, GEO.sph, mat('#fff27a', { glow: 2, emis: '#ffe23a' }), [0, 1.7, 0], 0.18); for (let i = 0; i < 3; i++) b.m(g, GEO.ring, mat('#8a8ca0', { metal: 0.9, rough: 0.3 }), [0, 0.6 + i * 0.3, 0], 0.18, [Math.PI / 2, 0, 0]); } else crystal('#fff47a', 1.0, 0.9); break;
    case 'cosmo': if (rnd() < 0.5) crystal(pick(['#c88cff', '#7df9ff', '#ff7df2']), 1.2, 1.2); else { rock(b, g, [0, 0.3, 0], 0.5, '#2a2244', rnd); b.m(g, GEO.ring, mat('#ff7df2', { glow: 1.4 }), [0, 0.9, 0], 0.5, [Math.PI / 2.4, 0, 0]); } break;
  }
}
function makeTrap(b, parent, kind, pos, npc) {
  const g = new THREE.Group(); g.position.copy(pos); parent.add(g);
  const spin = [];
  const glass = (c, op = 0.45) => mat(c, { op, rough: 0.05, glow: 0.1 });
  switch (kind) {
    case 'ilha': { const w = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.7, 40), new THREE.MeshStandardMaterial({ color: '#3a9ad8', roughness: 0.1, emissive: '#1a5a8a', emissiveIntensity: 0.3 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.06; g.add(w); break; }
    case 'redemoinho': for (let i = 0; i < 3; i++) { const t = b.m(g, GEO.ring, glass('#bfeeff', 0.7), [0, 0.1 + i * 0.25, 0], [1.0 - i * 0.2, 1.0 - i * 0.2, 1], [Math.PI / 2, 0, 0]); spin.push(t); } break;
    case 'nuvem': { const c = b.g(g, [0, 2.4, 0]); for (let j = 0; j < 4; j++) b.m(c, GEO.sph, mat('#5a5f78', { rough: 1 }), [j * 0.4 - 0.6, Math.sin(j) * 0.1, 0], 0.45); for (let i = 0; i < 8; i++) b.m(c, GEO.cyl, glass('#8fd0ff', 0.8), [(i % 4 - 1.5) * 0.3, -0.6 - (i % 2) * 0.3, (i % 2) * 0.1], [0.02, 0.25, 0.02]); spin.push(c); break; }
    case 'alto': { b.m(g, GEO.cyl, mat('#8aa39a', { kind: 'pedra', seed: 6, flat: true }), [0, 1.2, 0], [0.55, 2.4, 0.55]); npc.position.y = 2.4; const bal = b.m(g, GEO.sph, mat('#d9534f', { rough: 0.6 }), [0.7, 3.8, 0], [0.5, 0.6, 0.5]); b.m(g, GEO.cyl, mat('#ffffff'), [0.5, 3.05, 0], [0.01, 0.9, 0.01], [0, 0, 0.3]); spin.push(bal); break; }
    case 'gelo': b.m(g, GEO.box, glass('#d9f7ff', 0.5), [0, 0.85, 0], [1.3, 1.7, 1.3], [0, 0.4, 0]); break;
    case 'pedras': for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.m(g, GEO.dode, mat('#a0603a', { kind: 'pedra', seed: 5, flat: true }), [Math.cos(a) * 0.9, 0.35 + (i % 2) * 0.35, Math.sin(a) * 0.9], 0.42, [i, i, 0]); } break;
    case 'nevoa': for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const m = b.m(g, GEO.sph, glass('#5a5f78', 0.6), [Math.cos(a) * 0.95, 0.5 + (i % 3) * 0.4, Math.sin(a) * 0.95], 0.6); spin.push(m); } break;
    case 'bolha': b.m(g, GEO.sph, glass('#9fd0ff', 0.3), [0, 0.9, 0], 1.1); break;
  }
  return { g, update(t, dt) { spin.forEach((s, i) => { if (kind === 'redemoinho') s.rotation.z += dt * (1 + i); else s.position.y += Math.sin(t * 2 + i) * 0.002; }); if (kind === 'nevoa') g.rotation.y = t * 0.3; } };
}

// ======================= VITRINE =======================
export function showcaseScene(spId, shiny) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  lights(scene, { sky: '#dfe8ff', ground: '#4a4458', sunI: 2.4, hemiI: 1.0, radius: 4 });
  const b = new Builder(false);
  const podium = b.g(scene);
  const st = mat('#5a566a', { kind: 'pedra', seed: 12, rough: 0.9 });
  const p1 = b.m(podium, GEO.cyl, st, [0, -0.15, 0], [1.8, 0.3, 1.8]); p1.receiveShadow = true;
  const rim = b.m(podium, GEO.ring, mat('#7df9ff', { glow: 1.5 }), [0, 0.01, 0], [1.75, 1.75, 1], [Math.PI / 2, 0, 0]); rim.castShadow = false;
  let creature = null, bursts = [], spin = 0.5;
  const sparks = makeSparkles(scene, 20, 2.6, ['#ffffff', '#7df9ff', '#ffe08a']);
  const look = new THREE.Vector3();
  function set(id, sh) {
    if (creature) scene.remove(creature);
    creature = buildCreature({ sp: id }, { shiny: sh }); scene.add(creature);
    creature.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(creature); const sz = bb.getSize(V(0, 0, 0)); const R = Math.max(1.4, sz.x, sz.y, sz.z);
    look.set(0, -R * 0.05, 0); camera.position.set(0, R * 0.8 + 0.6, R * 2.3 + 2.4); camera.lookAt(look);
  }
  set(spId, shiny);
  return {
    scene, camera, set,
    get creature() { return creature; },
    jump() { creature.userData.ctrl.jump(); }, happy() { creature.userData.ctrl.happy(); },
    hearts() { bursts.push(...burst(scene, V(0, creature.userData.height, 0.3), ['#7df9ff', '#ffffff', '#ffe08a'], 16, 2)); },
    evolveFx(newId, sh) { bursts.push(...burst(scene, V(0, 1, 0), ['#ffffff', '#7df9ff', '#ffe066', '#b18cff'], 90, 5)); set(newId, sh); creature.userData.full = creature.scale.x; creature.scale.multiplyScalar(0.3); creature.userData.grow = 0; creature.userData.ctrl.happy(); },
    turn(dx) { spin += dx * 0.01; },
    onTap(r) { if (creature && r.intersectObject(creature, true).length) { creature.userData.ctrl.jump(); this.onCreatureTap?.(); } },
    update(t, dt) {
      if (!creature) return;
      const u = creature.userData;
      if (u.grow !== undefined && u.grow < 1) { u.grow = Math.min(1, u.grow + dt * 1.5); const k = u.grow; creature.scale.setScalar(u.full * (0.3 + 0.7 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.15)); }
      creature.rotation.y = spin + Math.sin(t * 0.5) * 0.25; rim.rotation.z += dt * 0.3;
      u.ctrl.update(t, dt); sparks.update(dt, 0.5); stepBursts(scene, bursts, dt);
    },
  };
}

// ======================= FIGURINHAS (miniaturas) =======================
let thumbR = null, thumbScene = null, thumbCam = null;
const thumbCache = new Map();
export function thumb(spId, { silhouette = false, shiny = false, size = 192, npc = null } = {}) {
  const key = `${npc ? 'npc' + npc.arch + npc.chapeu : spId}|${silhouette}|${shiny}|${size}`;
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!thumbR) {
    const c = document.createElement('canvas');
    thumbR = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
    thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = 1.15;
    thumbScene = new THREE.Scene(); thumbScene.environment = makeEnv(thumbR); thumbScene.environmentIntensity = 0.6; thumbScene.add(new THREE.HemisphereLight('#ffffff', '#6a5a7a', 1.3));
    const dl = new THREE.DirectionalLight('#fff', 2.4); dl.position.set(2, 4, 3); thumbScene.add(dl);
    const rl = new THREE.DirectionalLight('#9fd0ff', 1.0); rl.position.set(-3, 2, -3); thumbScene.add(rl);
    thumbCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  }
  thumbR.setPixelRatio(1); thumbR.setSize(size, size, false);
  const c = npc ? buildCreature({ npc }) : buildCreature({ sp: spId }, { silhouette, shiny });
  c.rotation.y = 0.6; c.userData.ctrl.update(0.3, 0.016); thumbScene.add(c);
  c.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(c); const sz = bb.getSize(V(0, 0, 0)), ct = bb.getCenter(V(0, 0, 0));
  const R = Math.max(sz.x, sz.y, sz.z) * 0.6; const d = R / Math.tan(15 * Math.PI / 180);
  thumbCam.position.set(ct.x, ct.y + d * 0.25, ct.z + d); thumbCam.lookAt(ct);
  thumbR.render(thumbScene, thumbCam);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbScene.remove(c);
  thumbCache.set(key, url); return url;
}
