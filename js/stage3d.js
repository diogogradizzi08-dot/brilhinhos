// Brilhinhos — o palco 3D: um renderizador só, atrás da interface, que troca de
// cena (Ninho Arco-íris, Fazendinha de cada região, Vitrine). E as miniaturas
// (figurinhas) usadas no Códice e nas listas.
import * as THREE from './vendor/three.module.js';
import { buildCreature, buildEgg, itemSprite, sparkleTexture, toon, GEO, shade, RAINBOW, Builder } from './creature3d.js';
import { RARITIES, ELEMENTS, REGIONS } from './data.js';

let renderer, canvas, current = null, clock = new THREE.Clock(), elapsed = 0;
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();

export function initStage(el) {
  canvas = el;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); if (current) { current.camera.aspect = w / h; current.camera.updateProjectionMatrix(); current.fit?.(w, h); }
  };
  new ResizeObserver(resize).observe(canvas); resize();
  canvas.addEventListener('pointerdown', (e) => {
    if (!current?.onTap) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, current.camera);
    current.onTap(ray, e);
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
  if (sc) { const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; sc.camera.aspect = w / h; sc.camera.updateProjectionMatrix(); sc.fit?.(w, h); }
}
export const currentScene = () => current;
// raio a partir de um ponto da tela (para tocar em coisas 3D)
export function rayAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  ptr.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, current.camera); return ray;
}
// posição na tela de um objeto 3D
export function toScreen(obj, dy = 0) {
  const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += dy; v.project(current.camera);
  const r = canvas.getBoundingClientRect();
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}

function baseScene(sky = ['#bfe9ff', '#fff4fb']) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#ffffff', shade(sky[0], 0, -0.2, -0.1), 1.5));
  const sun = new THREE.DirectionalLight('#fff6e8', 1.7); sun.position.set(3, 6, 4); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  return { scene, camera };
}
// faíscas que sobem e somem
function makeSparkles(scene, n = 40, area = 3, colors = ['#ffffff', '#fff3a0', '#ffc2e8', '#b8ecff']) {
  const tex = sparkleTexture(); const list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: colors[i % colors.length], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.userData = { life: Math.random(), speed: 0.3 + Math.random() * 0.5, x: (Math.random() - 0.5) * area, z: (Math.random() - 0.5) * area, y0: Math.random() * 0.5 };
    scene.add(s); list.push(s);
  }
  return {
    list,
    update(dt, active = 1) {
      for (const s of list) {
        const u = s.userData; u.life += dt * u.speed * 0.5;
        if (u.life > 1) { u.life = 0; u.x = (Math.random() - 0.5) * area; u.z = (Math.random() - 0.5) * area; }
        s.position.set(u.x, u.y0 + u.life * 2.4, u.z);
        const a = Math.sin(u.life * Math.PI) * active; s.material.opacity = a; s.scale.setScalar(0.12 + 0.18 * a);
      }
    },
  };
}
// estouro de faíscas (nascimento, coleta, evolução)
function burst(scene, pos, color = '#fff3a0', n = 26, power = 3) {
  const tex = sparkleTexture(); const parts = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: Array.isArray(color) ? color[i % color.length] : color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.position.copy(pos); const a = Math.random() * Math.PI * 2, b = Math.random() * 1.2;
    s.userData.v = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b) + 0.3, Math.sin(a) * Math.cos(b)).multiplyScalar(power * (0.5 + Math.random() * 0.6));
    s.userData.t = 0; scene.add(s); parts.push(s);
  }
  return parts;
}
function stepBursts(scene, parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const s = parts[i]; s.userData.t += dt;
    s.userData.v.y -= 4 * dt; s.position.addScaledVector(s.userData.v, dt);
    const k = s.userData.t / 1.2; s.material.opacity = 1 - k; s.scale.setScalar(0.25 * (1 - k * 0.5));
    if (k >= 1) { scene.remove(s); s.material.dispose(); parts.splice(i, 1); }
  }
}

// ======================= NINHO ARCO-ÍRIS =======================
export function nestScene() {
  const { scene, camera } = baseScene();
  const B = new Builder(false);
  const root = new THREE.Group(); scene.add(root);
  // chão de nuvem e pétalas
  const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 48), toon('#fde8f6')); ground.rotation.x = -Math.PI / 2; root.add(ground);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; B.part(root, GEO.sph, i % 2 ? '#ffffff' : '#fff2fb', [Math.cos(a) * 4.2, 0.2, Math.sin(a) * 4.2], [0.9, 0.5, 0.7], [0, a, 0]); }
  // pedestal-flor
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; B.part(root, GEO.sph, RAINBOW[i % 6], [Math.cos(a) * 1.55, 0.18, Math.sin(a) * 1.55], [0.75, 0.16, 0.45], [0, -a, 0], { outline: 0.05 }); }
  B.part(root, GEO.cyl, '#fff7e8', [0, 0.35, 0], [1.25, 0.5, 1.25], [0, 0, 0], { outline: 0.04 });
  // ninho trançado (anéis)
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(1.2 - i * 0.04, 0.2, 12, 40), toon(['#e9b989', '#f3c999', '#ddab7a'][i]));
    t.rotation.x = Math.PI / 2; t.position.y = 0.72 + i * 0.16; root.add(t);
  }
  // água mágica
  const poolMat = new THREE.MeshToonMaterial({ color: '#9fe3ff', emissive: '#9fe3ff', emissiveIntensity: 0.35, transparent: true, opacity: 0.92 });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.08, 40), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.95; root.add(pool);
  // redemoinho de cores (anel girando)
  const swirl = new THREE.Group(); swirl.position.y = 0.97; root.add(swirl);
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.25 + i * 0.13, 0.03, 6, 30, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: RAINBOW[i], transparent: true, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.rotation.z = i; swirl.add(m); }
  // arco-íris atrás
  const arc = new THREE.Group(); arc.position.set(0, 0.2, -3.2); root.add(arc);
  RAINBOW.forEach((c, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(3.4 - i * 0.22, 0.12, 8, 48, Math.PI), toon(c, 0.15)); arc.add(m); });
  for (const sx of [1, -1]) B.part(arc, GEO.sph, '#ffffff', [sx * 3.0, 0, 0.2], [1.0, 0.55, 0.6], [0, 0, 0], { outline: 0.05 });
  const sparks = makeSparkles(scene, 36, 2.2);
  camera.position.set(0, 3.6, 6.2); camera.lookAt(0, 0.9, 0);

  let bursts = [], falling = [], stir = 0, stirTarget = 0, egg = null, eggT = 0, wobble = 0, creature = null, light = null, hue = 0;
  const api = {
    scene, camera,
    fit(w, h) { const portrait = h > w; camera.fov = portrait ? 54 : 40; camera.position.set(0, portrait ? 4.6 : 4.0, portrait ? 9.2 : 8.0); camera.lookAt(0, portrait ? 0.9 : 0.55, 0); camera.updateProjectionMatrix(); },
    dropItem(emoji, color) {
      const s = itemSprite(emoji, 0.7); s.position.set((Math.random() - 0.5) * 0.6, 3.4, 0.4); scene.add(s);
      falling.push({ s, v: 0, color });
    },
    clearItems() { for (const f of falling) scene.remove(f.s); falling = []; },
    setLiquid(color) { poolMat.color.set(color); poolMat.emissive.set(color); },
    setStir(p) { stirTarget = p; },
    showEgg(el, rar) {
      if (egg) scene.remove(egg);
      egg = buildEgg(el, rar); egg.position.y = 0.95; egg.scale.setScalar(0.01); scene.add(egg); eggT = 0;
      const rc = rar === 'mitico' ? '#ff9bf0' : RARITIES[rar].cor;
      if (light) scene.remove(light);
      light = new THREE.PointLight(rc, 1.2, 5); light.position.set(0, 2.6, 1.5); scene.add(light);
      bursts.push(...burst(scene, new THREE.Vector3(0, 1.3, 0), [rc, '#ffffff'], 30, 3));
    },
    tapEgg() { wobble = 1; if (egg) bursts.push(...burst(scene, new THREE.Vector3(0, 1.6, 0.3), '#ffffff', 8, 2)); },
    reveal(spId, shiny, rar) {
      if (egg) { bursts.push(...burst(scene, new THREE.Vector3(0, 1.5, 0), RAINBOW.concat(['#ffffff']), 60, 4.5)); scene.remove(egg); egg = null; }
      if (creature) scene.remove(creature);
      creature = buildCreature({ sp: spId }, { shiny }); creature.position.y = 0.95; creature.scale.multiplyScalar(0.01); creature.userData.grow = 0; scene.add(creature);
      creature.userData.ctrl.happy();
    },
    clearCreature() { if (creature) scene.remove(creature); creature = null; if (light) scene.remove(light); light = null; stir = stirTarget = 0; },
    onTap(r) { if (creature) { const hit = r.intersectObject(creature, true); if (hit.length) creature.userData.ctrl.jump(); } },
    update(t, dt) {
      sparks.update(dt, 0.4 + stir);
      stir += (stirTarget - stir) * Math.min(1, dt * 5);
      swirl.rotation.y -= dt * (0.6 + stir * 6);
      swirl.children.forEach((m, i) => { m.material.opacity = stir * 0.9; m.position.y = Math.sin(t * 3 + i) * 0.02; });
      hue = (hue + dt * stir * 0.6) % 1;
      if (stir > 0.05) { const c = new THREE.Color().setHSL(hue, 0.75, 0.72); poolMat.color.lerp(c, dt * 2); poolMat.emissive.copy(poolMat.color); }
      arc.scale.setScalar(1 + Math.sin(t * 1.5) * 0.01);
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i]; f.v += dt * 9; f.s.position.y -= f.v * dt; f.s.material.rotation += dt * 3;
        if (f.s.position.y < 1.0) { scene.remove(f.s); falling.splice(i, 1); bursts.push(...burst(scene, new THREE.Vector3(f.s.position.x, 1.0, f.s.position.z), f.color || '#bff0ff', 14, 2)); }
      }
      if (egg) {
        eggT += dt; const g = Math.min(1, eggT / 0.6); egg.scale.setScalar(1.1 * (g < 1 ? 1 - Math.pow(1 - g, 3) * 1.0 + Math.sin(g * Math.PI) * 0.15 : 1));
        egg.position.y = 0.95 + Math.sin(t * 2) * 0.05;
        wobble = Math.max(0, wobble - dt * 2.5); egg.userData.shell.rotation.z = Math.sin(t * 30) * 0.2 * wobble;
        egg.rotation.y += dt * 0.6;
      }
      if (creature) {
        const u = creature.userData; u.grow = Math.min(1, u.grow + dt * 2.2);
        const k = u.grow; const base = creature.userData.baseScale ||= creature.scale.x / 0.01;
        creature.scale.setScalar(base * (k < 1 ? (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.2 : 1));
        u.ctrl.update(t, dt);
      }
      if (light) light.intensity = 1.0 + Math.sin(t * 4) * 0.4;
      stepBursts(scene, bursts, dt);
    },
  };
  return api;
}

// ======================= FAZENDINHA =======================
// region: objeto de REGIONS; farmLevel; amigos: [{amigo, spId, shiny, prontos}], brilhos (0..3), resgate: {salvo, npc}
export function farmScene(region, opts) {
  const { scene, camera } = baseScene(region.ceu);
  const B = new Builder(false); const rnd = mulberry(region.id.length * 97 + 13);
  const lvl = opts.nivel; const radius = 4.2 + lvl * 0.9;
  const world = new THREE.Group(); scene.add(world);
  // ilha
  const grass = region.chao;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, 0.5, 64), toon(grass)); top.position.y = -0.25; world.add(top);
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.55, 1.6, 64), toon(region.el === 'gelo' ? '#cfe6f0' : region.el === 'vento' ? '#ffffff' : '#c99a6a')); dirt.position.y = -1.3; world.add(dirt);
  // bordas fofinhas
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; B.part(world, GEO.sph, shade(grass, 0, 0, i % 2 ? 0.04 : -0.04), [Math.cos(a) * radius * 0.98, -0.05, Math.sin(a) * radius * 0.98], [0.6, 0.3, 0.6]); }
  // canteiros (um por espaço da fazenda), arranjados num círculo interno
  const slots = lvl + 1;
  for (let i = 0; i < slots; i++) {
    const a = (i / slots) * Math.PI * 2 + 0.4; const r = radius * 0.45;
    const g = B.part(world, GEO.cyl, shade(grass, 0, -0.1, -0.12), [Math.cos(a) * r, 0.02, Math.sin(a) * r], [0.75, 0.04, 0.75]);
  }
  // decoração do bioma: cresce com o nível (é o "território" aumentando)
  const props = 6 + lvl * 4;
  for (let i = 0; i < props; i++) {
    const a = rnd() * Math.PI * 2, r = radius * (0.68 + rnd() * 0.26);
    prop(B, world, region.el, [Math.cos(a) * r, 0, Math.sin(a) * r], 0.7 + rnd() * 0.6, rnd);
  }
  // cerquinha
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2; if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) > 0) continue;
    B.part(world, GEO.cyl, '#fff6ea', [Math.cos(a) * radius * 0.92, 0.25, Math.sin(a) * radius * 0.92], [0.06, 0.5, 0.06]);
  }
  // nuvens no céu
  const clouds = new THREE.Group(); scene.add(clouds);
  for (let i = 0; i < 6; i++) { const c = B.group(clouds, [(rnd() - 0.5) * 30, 6 + rnd() * 4, -10 - rnd() * 8]); for (let j = 0; j < 4; j++) B.part(c, GEO.sph, '#ffffff', [j * 0.9 - 1.3, Math.sin(j) * 0.3, 0], [1 - Math.abs(j - 1.5) * 0.2, 0.7, 0.7]); }

  // amigos
  const walkers = [];
  for (const it of opts.amigos) {
    const c = buildCreature({ sp: it.spId }, { shiny: it.shiny });
    const a = rnd() * Math.PI * 2; c.position.set(Math.cos(a) * radius * 0.4, 0, Math.sin(a) * radius * 0.4);
    world.add(c);
    const w = { c, uid: it.uid, target: new THREE.Vector3(), wait: rnd() * 2, bubbles: [], prontos: 0 };
    newTarget(w); walkers.push(w); setBubbles(w, it.prontos, it.bubbleEmoji);
  }
  function newTarget(w) { const a = Math.random() * Math.PI * 2, r = Math.random() * radius * 0.62; w.target.set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  function setBubbles(w, n, emoji) {
    for (const b of w.bubbles) w.c.remove(b);
    w.bubbles = [];
    for (let i = 0; i < n; i++) { const s = itemSprite(emoji || '🎁', 0.55 / w.c.scale.x, '#ffe36b'); s.userData.bubble = true; s.position.set((i - (n - 1) / 2) * 0.55 / w.c.scale.x, w.c.userData.height / w.c.scale.x + 0.45 / w.c.scale.x, 0); w.c.add(s); w.bubbles.push(s); }
  }
  // brilhos no chão (toque para pegar)
  const sparkles = [];
  function placeSparkles(n) {
    for (const s of sparkles) world.remove(s); sparkles.length = 0;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTexture(), color: '#fff7b0', transparent: true, depthWrite: false })); const a = rnd() * Math.PI * 2, r = radius * (0.3 + rnd() * 0.45);
      s.position.set(Math.cos(a) * r, 0.35, Math.sin(a) * r); s.scale.setScalar(0.7); s.userData.sparkle = true; world.add(s); sparkles.push(s);
    }
  }
  placeSparkles(opts.brilhos || 0);

  // morador em perigo (ou salvo, passeando)
  let npc = null, trap = null;
  if (opts.resgate) {
    const r = region.resgate;
    npc = buildCreature({ npc: { arch: r.arch, cor: r.cor, chapeu: r.chapeu } });
    const pos = new THREE.Vector3(radius * 0.62, 0, -radius * 0.35);
    npc.position.copy(pos); world.add(npc);
    if (!opts.resgate.salvo) { trap = makeTrap(B, world, r.armadilha, pos, npc); npc.userData.npc = true; }
    else npc.userData.npc = true;
  }
  const sp = makeSparkles(scene, 24, radius * 1.4, ['#ffffff', '#fff3a0', shade(grass, 0, 0.2, 0.15)]);
  let bursts = [], camAng = 0.35, drag = null, zoom = 1;
  const api = {
    scene, camera, world, walkers,
    fit(w, h) { api.portrait = h > w; },
    setAmigoBubbles(uid, n, emoji) { const w = walkers.find((x) => x.uid === uid); if (w) setBubbles(w, n, emoji); },
    setSparkles: placeSparkles,
    popAt(obj, color) { const p = new THREE.Vector3(); obj.getWorldPosition(p); bursts.push(...burst(scene, p, color || ['#fff3a0', '#ffffff'], 18, 2.5)); },
    freeNpc() {
      if (trap) { const p = new THREE.Vector3(); npc.getWorldPosition(p); bursts.push(...burst(scene, p.setY(1), RAINBOW, 70, 5)); world.remove(trap.g); trap = null; }
      npc?.userData.ctrl.happy();
    },
    onTap: null,
    pick(r) {
      const hits = r.intersectObjects([...walkers.map((w) => w.c), ...sparkles, ...(npc ? [npc] : [])], true);
      for (const h of hits) {
        let o = h.object;
        if (o.userData.sparkle) return { tipo: 'brilho', obj: o, idx: sparkles.indexOf(o) };
        while (o && !walkers.some((w) => w.c === o) && o !== npc) o = o.parent;
        if (o === npc) return { tipo: 'npc', obj: npc };
        const w = walkers.find((x) => x.c === o);
        if (w) return { tipo: h.object.userData.bubble ? 'bolha' : 'amigo', walker: w, obj: h.object };
      }
      return null;
    },
    removeSparkle(o) { world.remove(o); sparkles.splice(sparkles.indexOf(o), 1); },
    rotate(dx) { camAng += dx * 0.006; },
    zoomBy(k) { zoom = Math.min(1.35, Math.max(0.7, zoom * k)); },
    update(t, dt) {
      const dist = (radius * 2.0 + 4) * (api.portrait ? 1.35 : 1) * zoom;
      camera.position.set(Math.sin(camAng) * dist, dist * 0.62, Math.cos(camAng) * dist); camera.lookAt(0, 0.6, 0);
      clouds.position.x = Math.sin(t * 0.05) * 3;
      for (const w of walkers) {
        const c = w.c; const ctrl = c.userData.ctrl;
        if (w.bubbles.length) w.wait = Math.max(w.wait, 0.3); // com cestinha pronta, fica parado esperando o toque
        if (w.wait > 0) { w.wait -= dt; ctrl.setWalking(0); }
        else {
          const d = w.target.clone().sub(c.position); const len = d.length();
          if (len < 0.1) { w.wait = 1.5 + Math.random() * 3; newTarget(w); }
          else { d.normalize(); c.position.addScaledVector(d, dt * 0.9); const ang = Math.atan2(d.x, d.z); c.rotation.y += ((ang - c.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6); ctrl.setWalking(1); }
        }
        ctrl.update(t, dt);
        w.bubbles.forEach((b, i) => { b.position.y = (c.userData.height + 0.5 + Math.sin(t * 3 + i) * 0.08) / c.scale.x; });
      }
      sparkles.forEach((s, i) => { s.material.rotation = t + i; s.scale.setScalar(0.6 + Math.sin(t * 4 + i) * 0.15); });
      if (npc) { npc.userData.ctrl.update(t, dt); npc.lookAt(camera.position.x, 0, camera.position.z); }
      if (trap) trap.update(t, dt);
      sp.update(dt, 0.6);
      stepBursts(scene, bursts, dt);
    },
  };
  return api;
}

function prop(B, parent, el, p, s, rnd) {
  const g = B.group(parent, p); g.scale.setScalar(s); g.rotation.y = rnd() * 6;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  switch (el) {
    case 'planta': if (rnd() < 0.5) tree(B, g, '#7ccf5f', '#a8744f'); else flowerBush(B, g, pick(['#ff8fb6', '#ffd36b', '#b59cff', '#ffffff'])); break;
    case 'agua': if (rnd() < 0.5) { B.part(g, GEO.cyl, '#7fd0f5', [0, 0.02, 0], [0.9, 0.04, 0.9]); B.part(g, GEO.sph, '#7ed46a', [0.3, 0.06, 0.1], [0.3, 0.04, 0.3]); flowerBush(B, g, '#ff9fc4', 0.4); } else reeds(B, g); break;
    case 'sol': if (rnd() < 0.5) sunflower(B, g); else { B.part(g, GEO.sph, '#ffcf6b', [0, 0.35, 0], [0.5, 0.4, 0.5], [0, 0, 0], { outline: 0.05 }); B.part(g, GEO.sph, '#ff9f5a', [0.35, 0.25, 0.2], 0.25, [0, 0, 0], { outline: 0.08 }); } break;
    case 'vento': cloudPuff(B, g, pick(['#ffffff', '#f2f8ff'])); break;
    case 'gelo': if (rnd() < 0.5) tree(B, g, '#e8fbff', '#a0b8c8', true); else B.part(g, GEO.oct, '#cdf6ff', [0, 0.5, 0], [0.3, 0.7, 0.3], [0, 0, 0.2], { outline: 0.06, glow: 0.2 }); break;
    case 'pedra': if (rnd() < 0.5) { B.part(g, GEO.sph, '#c9b39a', [0, 0.25, 0], [0.55, 0.4, 0.5], [0, 0, 0], { outline: 0.05 }); B.part(g, GEO.oct, pick(['#b57bff', '#7be0c8', '#ff8fb6']), [0.2, 0.6, 0], [0.15, 0.32, 0.15], [0, 0, -0.3], { outline: 0.1, glow: 0.4 }); } else mushroom(B, g, pick(['#b57bff', '#7be0c8'])); break;
    case 'sonho': if (rnd() < 0.5) mushroom(B, g, pick(['#d6b5ff', '#ffb3e0'])); else tree(B, g, '#b8a6f2', '#8a7ab0'); break;
    case 'luz': if (rnd() < 0.5) { B.part(g, GEO.cyl, '#fff3c4', [0, 0.45, 0], [0.04, 0.9, 0.04]); B.part(g, GEO.star, '#ffe066', [0, 1.0, 0], 0.2, [0, 0, 0], { outline: 0.1, glow: 0.7 }); } else flowerBush(B, g, '#fff3a0', 1, 0.5); break;
  }
}
function tree(B, g, leaf, trunk, snow) {
  B.part(g, GEO.cyl, trunk, [0, 0.45, 0], [0.13, 0.9, 0.13], [0, 0, 0], { outline: 0.1 });
  if (snow) { for (let i = 0; i < 3; i++) B.part(g, GEO.cone, leaf, [0, 0.8 + i * 0.35, 0], [0.6 - i * 0.15, 0.6, 0.6 - i * 0.15], [0, 0, 0], { outline: 0.05 }); }
  else { B.part(g, GEO.sph, leaf, [0, 1.15, 0], [0.6, 0.55, 0.6], [0, 0, 0], { outline: 0.05 }); B.part(g, GEO.sph, shade(leaf, 0, 0, 0.06), [0.25, 1.35, 0.15], 0.35, [0, 0, 0], { outline: 0.06 }); }
}
function flowerBush(B, g, c, s = 1, glow = 0) {
  B.part(g, GEO.sph, '#6cc95a', [0, 0.2 * s, 0], [0.45 * s, 0.3 * s, 0.45 * s], [0, 0, 0], { outline: 0.06 });
  for (let i = 0; i < 4; i++) { const a = i * 1.7; B.part(g, GEO.sph, c, [Math.cos(a) * 0.28 * s, 0.42 * s, Math.sin(a) * 0.28 * s], 0.11 * s, [0, 0, 0], { outline: 0.12, glow }); }
}
function reeds(B, g) { for (let i = 0; i < 4; i++) { B.part(g, GEO.cyl, '#6fbf5a', [i * 0.12 - 0.18, 0.35, (i % 2) * 0.1], [0.03, 0.7, 0.03]); B.part(g, GEO.sph, '#a8744f', [i * 0.12 - 0.18, 0.72, (i % 2) * 0.1], [0.05, 0.12, 0.05]); } }
function sunflower(B, g) { B.part(g, GEO.cyl, '#6fbf5a', [0, 0.45, 0], [0.04, 0.9, 0.04]); const h = B.group(g, [0, 0.95, 0.05], [0.3, 0, 0]); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; B.part(h, GEO.sph, '#ffd23f', [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0], [0.1, 0.06, 0.03], [0, 0, a], { outline: 0.1 }); } B.part(h, GEO.sph, '#a8744f', [0, 0, 0.02], [0.13, 0.13, 0.05]); }
function cloudPuff(B, g, c) { for (let i = 0; i < 4; i++) B.part(g, GEO.sph, c, [i * 0.3 - 0.45, 0.3 + Math.sin(i) * 0.1, (i % 2) * 0.15], 0.3 - Math.abs(i - 1.5) * 0.04, [0, 0, 0], { outline: 0.05 }); }
function mushroom(B, g, c) { B.part(g, GEO.cyl, '#fff3e0', [0, 0.25, 0], [0.12, 0.5, 0.12], [0, 0, 0], { outline: 0.1 }); B.part(g, GEO.sph, c, [0, 0.55, 0], [0.38, 0.22, 0.38], [0, 0, 0], { outline: 0.06, glow: 0.3 }); for (let i = 0; i < 3; i++) B.part(g, GEO.sph, '#ffffff', [Math.cos(i * 2) * 0.2, 0.68, Math.sin(i * 2) * 0.2], 0.05); }

function makeTrap(B, parent, kind, pos, npc) {
  const g = new THREE.Group(); g.position.copy(pos); parent.add(g);
  const spin = [];
  switch (kind) {
    case 'ilha': { // ilhota com riacho em volta
      const w = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.6, 32), new THREE.MeshToonMaterial({ color: '#7fd0f5', emissive: '#7fd0f5', emissiveIntensity: 0.2 })); w.rotation.x = -Math.PI / 2; w.position.y = 0.03; g.add(w);
      for (let i = 0; i < 5; i++) B.part(g, GEO.sph, '#b9a08a', [Math.cos(i * 1.3) * 0.9, 0.05, Math.sin(i * 1.3) * 0.9], [0.15, 0.06, 0.12]);
      break; }
    case 'redemoinho': for (let i = 0; i < 3; i++) { const t = B.part(g, GEO.ring, '#bfeeff', [0, 0.1 + i * 0.25, 0], 0.9 - i * 0.18, [Math.PI / 2, 0, 0], { glass: 0.6 }); spin.push(t); } break;
    case 'nuvem': { const c = B.group(g, [0, 2.4, 0]); cloudPuff(B, c, '#c7d3e0'); c.scale.setScalar(1.6); for (let i = 0; i < 6; i++) B.part(c, GEO.sph, '#8fd0ff', [(i % 3 - 1) * 0.3, -0.4 - (i % 2) * 0.3, (i % 2) * 0.1], [0.03, 0.08, 0.03]); spin.push(c); break; }
    case 'alto': { B.part(g, GEO.cyl, '#d8e6f5', [0, 1.1, 0], [0.5, 2.2, 0.5], [0, 0, 0], { outline: 0.04 }); npc.position.y = 2.2; const bal = B.part(g, GEO.sph, '#ff8fb6', [0.6, 3.6, 0], [0.45, 0.55, 0.45], [0, 0, 0], { outline: 0.05 }); B.part(g, GEO.cyl, '#ffffff', [0.45, 2.9, 0], [0.01, 0.9, 0.01], [0, 0, 0.3]); spin.push(bal); break; }
    case 'gelo': B.part(g, GEO.sph, '#d9f7ff', [0, 0.9, 0], [0.95, 1.05, 0.95], [0, 0, 0], { glass: 0.5 }); for (let i = 0; i < 6; i++) B.part(g, GEO.oct, '#e6fbff', [Math.cos(i) * 0.8, 0.2 + (i % 3) * 0.5, Math.sin(i) * 0.8], [0.15, 0.35, 0.15], [0, 0, i], { glass: 0.7 }); break;
    case 'pedras': for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; B.part(g, GEO.sph, '#b8a48c', [Math.cos(a) * 0.85, 0.35 + (i % 2) * 0.3, Math.sin(a) * 0.85], [0.42, 0.38, 0.4], [i, i, 0], { outline: 0.05 }); } break;
    case 'nevoa': for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const m = B.part(g, GEO.sph, '#e6dcff', [Math.cos(a) * 0.9, 0.5 + (i % 3) * 0.35, Math.sin(a) * 0.9], 0.55, [0, 0, 0], { glass: 0.55 }); spin.push(m); } break;
    case 'bolha': B.part(g, GEO.sph, '#ffe6ff', [0, 0.9, 0], 1.05, [0, 0, 0], { glass: 0.35 }); break;
  }
  return { g, update(t, dt) { spin.forEach((s, i) => { if (kind === 'redemoinho') s.rotation.z += dt * (1 + i); else s.position.y += Math.sin(t * 2 + i) * 0.002; }); g.rotation.y = kind === 'nevoa' ? t * 0.2 : 0; } };
}
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ======================= VITRINE (um amigo no palco) =======================
export function showcaseScene(spId, shiny, colors = ['#fff0fa', '#e8f7ff']) {
  const { scene, camera } = baseScene();
  const B = new Builder(false);
  const podium = B.group(scene);
  B.part(podium, GEO.cyl, '#ffffff', [0, -0.15, 0], [1.6, 0.3, 1.6], [0, 0, 0], { outline: 0.03 });
  B.part(podium, GEO.cyl, colors[0], [0, -0.32, 0], [1.75, 0.12, 1.75]);
  let creature = null, bursts = [], spin = 0.35, dragging = false;
  const sparks = makeSparkles(scene, 20, 2.4);
  function set(id, sh) {
    if (creature) scene.remove(creature);
    creature = buildCreature({ sp: id }, { shiny: sh }); scene.add(creature);
    const h = Math.max(1.6, creature.userData.height); camera.position.set(0, h * 0.7 + 0.9, h * 2.6 + 4.2); camera.lookAt(0, h * 0.05, 0);
  }
  set(spId, shiny);
  return {
    scene, camera,
    set,
    get creature() { return creature; },
    jump() { creature.userData.ctrl.jump(); },
    happy() { creature.userData.ctrl.happy(); },
    hearts() { bursts.push(...burst(scene, new THREE.Vector3(0, creature.userData.height, 0.3), ['#ff8fb6', '#ffc2d8', '#ffffff'], 16, 2)); },
    evolveFx(newId, sh) {
      bursts.push(...burst(scene, new THREE.Vector3(0, 1, 0), RAINBOW.concat(['#ffffff']), 80, 5));
      set(newId, sh); creature.scale.multiplyScalar(0.3); creature.userData.grow = 0;
      creature.userData.ctrl.happy();
    },
    turn(dx) { spin += dx * 0.01; },
    onTap(r) { if (creature && r.intersectObject(creature, true).length) { creature.userData.ctrl.jump(); this.onCreatureTap?.(); } },
    update(t, dt) {
      if (!creature) return;
      if (creature.userData.grow !== undefined && creature.userData.grow < 1) {
        creature.userData.grow = Math.min(1, creature.userData.grow + dt * 1.5);
        const base = creature.userData.fullScale ||= creature.scale.x / 0.3; const k = creature.userData.grow;
        creature.scale.setScalar(base * (0.3 + 0.7 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.15));
      }
      creature.rotation.y = spin + Math.sin(t * 0.5) * 0.25;
      creature.userData.ctrl.update(t, dt); sparks.update(dt, 0.5); stepBursts(scene, bursts, dt);
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
    thumbR.outputColorSpace = THREE.SRGBColorSpace;
    thumbScene = new THREE.Scene(); thumbScene.add(new THREE.HemisphereLight('#ffffff', '#b9d8ff', 1.6));
    const dl = new THREE.DirectionalLight('#fff', 1.6); dl.position.set(2, 4, 3); thumbScene.add(dl);
    thumbCam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  }
  thumbR.setPixelRatio(1); thumbR.setSize(size, size, false);
  const c = npc ? buildCreature({ npc }) : buildCreature({ sp: spId }, { silhouette, shiny });
  thumbScene.add(c);
  const h = c.userData.height; thumbCam.position.set(0, h * 0.62, h * 2.3 + 1.35); thumbCam.lookAt(0, h * 0.47, 0); c.rotation.y = 0.4;
  c.userData.ctrl.update(0.3, 0.016);
  thumbR.render(thumbScene, thumbCam);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbScene.remove(c);
  thumbCache.set(key, url); return url;
}
