// Brilhinhos — a fazendinha em 3D, como um pedaço de mundo aberto: a grade de 5×5 lotes,
// o que está liberado com cores vivas e o resto na sombra com um cadeado; além da grade,
// o mundo continua (morros, florestas, neblina). O personagem anda até onde você toca,
// e corta, minera, cata, planta, rega, colhe, faz carinho e constrói. Os recursos
// somem quando usados e voltam crescendo. As construções ficam onde você escolheu.
import * as THREE from './vendor/three.module.js';
import { buildCreature, itemSprite, sparkleTexture, GEO, SHAPES, mat, shade, Builder, taperTube } from './creature3d.js';
import { lights, makeSparkles, burst, stepBursts, boltMesh, groundTex, canvasTex, resourceTree, rock, biomeProp, makeTrap, mulberry } from './stage3d.js';
import { buildKid } from './kid3d.js';
import { ZONE, HALF, ALL_ZONES, zoneCenter, parseKey, zoneAt, zoneProps, clampOpen, insideOpen, SPAWN, NPC_SPOT, inGrid } from './world.js';
import { BUILDINGS } from './data.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const angTo = (cur, target, k) => cur + ((target - cur + Math.PI * 3) % (Math.PI * 2) - Math.PI) * k;
// materiais apagados para o que está nos lotes bloqueados
const dimCache = new Map();
function dimMat(m) {
  if (dimCache.has(m)) return dimCache.get(m);
  const d = m.clone(); if (d.color) d.color.lerp(new THREE.Color('#5a5a72'), 0.55).multiplyScalar(0.55);
  if (d.emissive) d.emissiveIntensity *= 0.2; dimCache.set(m, d); return d;
}
function dim(obj) { obj.traverse((o) => { if (o.isMesh && !o.userData.keep) o.material = Array.isArray(o.material) ? o.material.map(dimMat) : dimMat(o.material); }); }
// junta todas as malhas de um grupo numa só por material (o cenário parado vira poucos "desenhos")
const LOW = new Map([[GEO.sph, GEO.sphLo], [GEO.ring, new THREE.TorusGeometry(1, 0.06, 6, 20)], [GEO.cyl, new THREE.CylinderGeometry(1, 1, 1, 8)], [GEO.cone, new THREE.ConeGeometry(1, 1, 8)], [GEO.dome, new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)]]);
const flatCache = new WeakMap();
function flat(geo) {
  let f = flatCache.get(geo);
  if (!f) { const g = geo.index ? geo.toNonIndexed() : geo; f = { p: g.attributes.position.array, n: g.attributes.normal?.array, u: g.attributes.uv?.array, c: g.attributes.position.count }; flatCache.set(geo, f); }
  return f;
}
const _m3 = new THREE.Matrix3();
export function compact(root, { shadow = true } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(); const dead = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep || o.geometry.attributes.position === undefined) return;
    const m = o.material; if (Array.isArray(m)) return;
    const k = m.uuid; if (!buckets.has(k)) buckets.set(k, { m, list: [], shadow: false, count: 0 });
    const bk = buckets.get(k); const f = flat(LOW.get(o.geometry) || o.geometry);
    bk.list.push({ f, mx: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) }); bk.count += f.c; bk.shadow ||= o.castShadow; dead.push(o);
  });
  for (const o of dead) o.parent.remove(o);
  const out = [];
  for (const bk of buckets.values()) {
    const pos = new Float32Array(bk.count * 3), nor = new Float32Array(bk.count * 3), uv = new Float32Array(bk.count * 2); let off = 0;
    for (const { f, mx } of bk.list) {
      const e = mx.elements; _m3.getNormalMatrix(mx); const n = _m3.elements;
      for (let i = 0; i < f.c; i++) {
        const x = f.p[i * 3], y = f.p[i * 3 + 1], z = f.p[i * 3 + 2]; const j = (off + i) * 3;
        pos[j] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[j + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[j + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        if (f.n) { const a = f.n[i * 3], b2 = f.n[i * 3 + 1], c = f.n[i * 3 + 2]; let nx = n[0] * a + n[3] * b2 + n[6] * c, ny = n[1] * a + n[4] * b2 + n[7] * c, nz = n[2] * a + n[5] * b2 + n[8] * c; const l = Math.hypot(nx, ny, nz) || 1; nor[j] = nx / l; nor[j + 1] = ny / l; nor[j + 2] = nz / l; }
        if (f.u) { uv[(off + i) * 2] = f.u[i * 2]; uv[(off + i) * 2 + 1] = f.u[i * 2 + 1]; }
      }
      off += f.c;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, bk.m); mesh.castShadow = shadow && bk.shadow; mesh.receiveShadow = true; root.add(mesh); out.push({ geo, m: bk.m, shadow: mesh.castShadow });
  }
  return out;
}
// grupo de peças paradas, montado uma vez e guardado (abrir a fazendinha de novo fica rápido)
const groupCache = new Map();
function cachedGroup(parent, key, build, opts) {
  const g = new THREE.Group(); parent.add(g);
  let list = groupCache.get(key);
  if (!list) { build(g); list = compact(g, opts); if (groupCache.size > 4000) groupCache.clear(); groupCache.set(key, list); }
  else for (const it of list) { const m = new THREE.Mesh(it.geo, it.m); m.castShadow = it.shadow; m.receiveShadow = true; g.add(m); }
  return g;
}
// selo do cadeado (canvas)
const lockTexCache = {};
function lockTex(open) {
  return (lockTexCache[open] ||= canvasTex(256, 256, (x) => {
    x.clearRect(0, 0, 256, 256);
    const g = x.createRadialGradient(128, 120, 20, 128, 128, 118); g.addColorStop(0, open ? 'rgba(255,236,150,1)' : 'rgba(210,214,236,.95)'); g.addColorStop(1, open ? 'rgba(255,190,60,1)' : 'rgba(120,126,160,.95)');
    x.fillStyle = g; x.beginPath(); x.arc(128, 128, 108, 0, 7); x.fill(); x.lineWidth = 12; x.strokeStyle = open ? '#fff6c8' : '#e8ecff'; x.stroke();
    x.font = '120px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('🔒', 128, 136);
    if (open) { x.fillStyle = '#3aa65a'; x.beginPath(); x.arc(200, 56, 40, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 8; x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 64px sans-serif'; x.fillText('+', 200, 60); }
  }));
}
// tamanho dos companheiros em proporção ao cenário (o personagem tem ~1,15 m)
const BIG = new Set(['urso', 'mamute', 'rinoceronte', 'hipopotamo', 'dragao', 'golem', 'dino', 'cavalo', 'grifo', 'tubarao', 'polvo', 'serpente', 'crocodilo']);
const SMALL = new Set(['coelho', 'sapo', 'besouro', 'mariposa', 'morcego', 'pinguim', 'aguaviva', 'porcoespinho', 'peixe', 'lontra']);
function petScale(c, arch, stage) {
  const target = [0.55, 0.82, 1.15][stage] * (BIG.has(arch) ? 1.3 : SMALL.has(arch) ? 0.8 : 1);
  return target / Math.max(0.3, c.userData.height || 1);
}

export function farmScene(region, opts) {
  const el = region.el; const tema = opts.tema;
  const scene = new THREE.Scene();
  const fogC = shade(region.ceu[1], 0, -0.1, -0.05); scene.fog = new THREE.Fog(fogC, 26, 70);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 260);
  const b = new Builder(false); const rnd = mulberry(region.id.length * 97 + 13);
  const dark = ['fogo', 'eletrico', 'cosmo'].includes(el);
  const sun = lights(scene, { sky: dark ? '#9aa0ff' : '#d8ecff', ground: shade(region.chao, 0, 0, -0.2), sun: el === 'fogo' ? '#ffc08a' : dark ? '#c8c8ff' : '#fff2dc', sunI: dark ? 1.9 : 2.7, hemiI: dark ? 0.85 : 1.15, radius: 14 });
  sun.shadow.mapSize.set(1024, 1024); scene.add(sun.target);
  const world = new THREE.Group(); scene.add(world);
  const zonas = new Set(opts.zonas);
  let obsCache = null, obsT = 0;
  const isOpen = (k) => zonas.has(k);
  // ---------- chão: um só, enorme (o mundo continua além da grade) ----------
  const gt = groundTex(el, region.chao);
  const gmap = gt.map.clone(); gmap.needsUpdate = true; gmap.repeat.set(70, 70);
  const gem = gt.emis ? gt.emis.clone() : null; if (gem) { gem.needsUpdate = true; gem.repeat.set(70, 70); }
  const groundM = new THREE.MeshStandardMaterial({ map: gmap, bumpMap: gmap, bumpScale: 1.5, roughness: el === 'gelo' ? 0.5 : 0.95, emissiveMap: gem, emissive: gem ? new THREE.Color('#ffffff') : new THREE.Color('#000'), emissiveIntensity: gem ? 0.9 : 0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), groundM); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  // ---------- lotes: os bloqueados ficam na sombra, com cadeado ----------
  const shadeM = new THREE.MeshBasicMaterial({ color: '#141026', transparent: true, opacity: 0.5, depthWrite: false });
  const wildM = new THREE.MeshBasicMaterial({ color: '#141026', transparent: true, opacity: 0.32, depthWrite: false });
  const tileGeo = new THREE.PlaneGeometry(ZONE, ZONE);
  const locks = []; const abriveis = new Map((opts.abriveis || []).map((a) => [a.key, a]));
  for (const k of ALL_ZONES) {
    if (isOpen(k)) continue;
    const [cx, cz] = zoneCenter(k);
    const t = new THREE.Mesh(tileGeo, shadeM); t.rotation.x = -Math.PI / 2; t.position.set(cx, 0.03, cz); t.renderOrder = 1; world.add(t);
    const ab = abriveis.get(k);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lockTex(!!ab), depthTest: true, transparent: true }));
    // o cadeado de quem dá para abrir fica perto da borda com a área liberada (aparece na tela)
    let lx = cx, lz = cz;
    if (ab) { const [zx, zz] = parseKey(k); const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => isOpen(`${zx + dx},${zz + dz}`)); if (nb) { lx = cx + nb[0] * (ZONE / 2 - 2.4); lz = cz + nb[1] * (ZONE / 2 - 2.4); } }
    sp.scale.setScalar(ab ? 1.8 : 1.4); sp.position.set(lx, ab ? 1.7 : 1.6, lz); sp.userData = { lote: k, base: sp.position.y, ab: !!ab }; world.add(sp); locks.push(sp);
    if (ab) { // anel dourado no chão: dá para abrir este!
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.25, 48), new THREE.MeshBasicMaterial({ color: '#ffd25a', transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(lx, 0.05, lz); ring.userData.lockRing = true; world.add(ring); sp.userData.ring = ring;
      const post = b.m(world, GEO.cyl, mat('#8a5a34', { rough: 0.9 }), [lx, 0.45, lz], [0.07, 0.9, 0.07]); post.userData.keep = true;
    }
  }
  // além da grade: o mundo selvagem, mais apagado
  const outer = new THREE.Shape(); outer.moveTo(-150, -150); outer.lineTo(150, -150); outer.lineTo(150, 150); outer.lineTo(-150, 150);
  const E = ZONE * (HALF + 0.5); const hole = new THREE.Path(); hole.moveTo(-E, -E); hole.lineTo(-E, E); hole.lineTo(E, E); hole.lineTo(E, -E); outer.holes.push(hole);
  const wild = new THREE.Mesh(new THREE.ShapeGeometry(outer), wildM); wild.rotation.x = -Math.PI / 2; wild.position.y = 0.025; world.add(wild);
  // borda da área liberada: estacas com uma faixa de luz
  const edgeM = new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.75 });
  const edges = new THREE.Group(); world.add(edges);
  for (const k of zonas) {
    const [cx, cz] = zoneCenter(k); const [zx, zz] = parseKey(k); const h = ZONE / 2;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (isOpen(`${zx + dx},${zz + dz}`)) continue;
      for (let i = 0; i < 10; i++) {
        const u = -h + (i + 0.5) * (ZONE / 10);
        const px = cx + (dx ? dx * h : u), pz = cz + (dz ? dz * h : u);
        const seg = new THREE.Mesh(GEO.box, edgeM); seg.scale.set(dx ? 0.08 : 0.55, 0.05, dx ? 0.55 : 0.08); seg.position.set(px, 0.05, pz); edges.add(seg);
        if (i % 2 === 0 && inGrid(zx + dx, zz + dz)) { b.m(edges, GEO.cyl, mat('#8a5a34', { rough: 0.9 }), [px, 0.25, pz], [0.05, 0.5, 0.05]); }
      }
    }
  }
  // ---------- o mundo além: morros e florestas distantes (instanciados, leves) ----------
  {
    const n = 140; const trunk = new THREE.InstancedMesh(GEO.cyl, mat('#5a4030', { rough: 1 }), n); const crown = new THREE.InstancedMesh(el === 'gelo' ? GEO.cone : GEO.ico, mat('#ffffff', { rough: 0.9, flat: true }), n);
    const d = new THREE.Object3D(); const c = new THREE.Color(); let i = 0;
    const leaf = { planta: '#3f8a2e', agua: '#3f8a5a', vento: '#7fae6a', gelo: '#2f6a5a', cosmo: '#7a5acc', eletrico: '#c9a92a', fogo: '#5a2a1a', pedra: '#8a7a4a' }[el] || '#4f9d3a';
    while (i < n) {
      const a = rnd() * Math.PI * 2, r = E + 3 + rnd() * 55; const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < E + 1 && Math.abs(z) < E + 1) continue;
      const s = 1.2 + rnd() * 1.6;
      d.position.set(x, s * 1.0, z); d.scale.set(0.2 * s, 2 * s, 0.2 * s); d.rotation.set(0, 0, 0); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
      d.position.set(x, s * 2.6, z); d.scale.set(1.3 * s, (el === 'gelo' ? 2.4 : 1.2) * s, 1.3 * s); d.rotation.set(0, rnd() * 6, 0); d.updateMatrix(); crown.setMatrixAt(i, d.matrix);
      crown.setColorAt(i, c.set(shade(leaf, (rnd() - 0.5) * 0.04, 0, (rnd() - 0.5) * 0.12))); i++;
    }
    trunk.castShadow = false; crown.castShadow = false; world.add(trunk, crown);
    // morros ao longe
    const hillM = mat(shade(region.chao, 0, -0.1, el === 'gelo' ? 0.05 : -0.08), { rough: 1, flat: true });
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + rnd() * 0.3; const r = 85 + rnd() * 25; const h = 14 + rnd() * 18; const m = b.m(world, el === 'pedra' || el === 'fogo' ? GEO.cone : GEO.sph, hillM, [Math.cos(a) * r, el === 'pedra' || el === 'fogo' ? h / 2 : -h * 0.3, Math.sin(a) * r], [h * 1.4, h, h * 1.4]); m.castShadow = false; }
    if (el === 'fogo') { const v = b.m(world, GEO.cone, mat('#3a2020', { rough: 1, flat: true }), [-40, 14, -95], [40, 28, 40]); v.castShadow = false; const lava = b.m(world, GEO.sph, mat('#ff6a10', { glow: 2.5, emis: '#ff5a10' }), [-40, 28, -95], [4, 1.2, 4]); lava.castShadow = false; }
  }
  // ---------- grama ----------
  if (['planta', 'agua', 'vento'].includes(el)) {
    const geo = new THREE.ConeGeometry(0.035, 0.34, 3); geo.translate(0, 0.17, 0);
    const n = 2600; const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), n); const d = new THREE.Object3D(); const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = (rnd() - 0.5) * ZONE * (HALF * 2 + 1.6), z = (rnd() - 0.5) * ZONE * (HALF * 2 + 1.6);
      const open = isOpen(zoneAt(x, z)) && Math.abs(x) <= E && Math.abs(z) <= E;
      if (!open && rnd() < 0.55) { d.scale.setScalar(0.0001); d.updateMatrix(); inst.setMatrixAt(i, d.matrix); continue; }
      d.position.set(x, 0, z); d.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5); d.scale.setScalar(0.6 + rnd() * 0.9); d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
      const col = shade(region.chao, (rnd() - 0.5) * 0.04, 0.1, (rnd() - 0.3) * 0.15); inst.setColorAt(i, open ? c.set(col) : c.set(col).lerp(new THREE.Color('#5a5a72'), 0.55).multiplyScalar(0.55));
    }
    inst.receiveShadow = true; world.add(inst);
  }
  // ---------- enfeites pequenos de cada lote ----------
  compact(edges, { shadow: true });
  const berry = { planta: '#e8322a', agua: '#4a7aff', fogo: '#ff8a1c', vento: '#ff6fb5', gelo: '#9fe8ff', pedra: '#c84a8a', eletrico: '#ffe23a', cosmo: '#c88cff' }[el] || '#e8322a';
  // o que está nos lotes bloqueados vira um bloco só, apagado (e guardado para a próxima vez)
  const lockedKeys = ALL_ZONES.filter((k) => !isOpen(k));
  cachedGroup(world, `${region.id}|L|${lockedKeys.join(';')}`, (lg) => {
    for (const k of lockedKeys) for (const p of zoneProps(region.id, k, 4)) { const g = b.g(lg, [p.x, 0, p.z]); g.rotation.y = p.v * 6; smallProp(b, g, el, p.v, p.s); }
    for (const r of opts.recursos) if (r.bloqueado) { const g = b.g(lg, [r.x, 0, r.z]); g.rotation.y = r.rot; buildResource(b, g, r, el, berry, 'full'); }
    dim(lg);
  }, { shadow: false });
  const propList = [];
  for (const k of ALL_ZONES) {
    if (!isOpen(k)) continue;
    zoneProps(region.id, k, 6).forEach((p, i) => {
      const g = cachedGroup(world, `${region.id}|P|${k}|${i}`, (x) => smallProp(b, x, el, p.v, p.s), { shadow: false });
      g.position.set(p.x, 0, p.z); g.rotation.y = p.v * 6; propList.push(g);
    });
  }
  // ---------- recursos (árvores, rochas, arbustos) ----------
  const resObjs = new Map(); // id -> {g, full, sapling, data, vivo}
  for (const r of opts.recursos) {
    if (r.bloqueado) continue;
    const g = b.g(world, [r.x, 0, r.z]); g.rotation.y = r.rot;
    const full = cachedGroup(g, `${region.id}|${r.id}|f`, (x) => buildResource(b, x, r, el, berry, 'full'));
    const sapling = cachedGroup(g, `${region.id}|${r.id}|s`, (x) => buildResource(b, x, r, el, berry, 'sapling'));
    const o = { g, full, sapling, data: r, vivo: r.vivo, anim: 0, mode: null, locked: false };
    full.visible = r.vivo; sapling.visible = !r.vivo; if (!r.vivo) sapling.scale.setScalar(0.3 + 0.7 * (r.cresce || 0));
    g.userData = { tipo: 'recurso', id: r.id };
    resObjs.set(r.id, o);
  }
  // árvores podem ficar transparentes quando tapam o personagem
  const trees = [...resObjs.values()].filter((o) => o.data.tipo === 'arvore');
  for (const o of trees) { o.fade = 1; o.mats = []; o.g.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; o.mats.push(m.material); } }); }
  function setFade(o, f) { if (Math.abs((o.lastF ?? 1) - f) < 0.01) return; o.lastF = f; for (const m of o.mats) { m.opacity = f; m.depthWrite = f > 0.95; } }
  function segDist(a, b2, p) { const ab = b2.clone().sub(a); const t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); const q = a.clone().addScaledVector(ab, t); return Math.hypot(q.x - p.x, q.z - p.z); }
  // ---------- construções ----------
  const obraObjs = new Map();
  function makeObra(o) {
    const g = b.g(world, [o.x, 0, o.z], [0, o.rot || 0, 0]);
    buildingModel(b, g, o.tipo, el);
    if (!['canteiro', 'forno', 'totem', 'balanco', 'fonte', 'arvore_natal', 'baloes', 'fogueira'].includes(o.tipo)) compact(g);
    g.userData = { tipo: 'obra', uid: o.uid, obra: o.tipo };
    const e = { g, o: { ...o }, pop: 0, pending: false };
    if (o.tipo === 'canteiro') e.plot = g.userData.plot;
    obraObjs.set(o.uid, e); hideProps(); return e;
  }
  function hideProps() { for (const p of propList) p.visible = ![...obraObjs.values()].some((e) => Math.hypot(e.g.position.x - p.position.x, e.g.position.z - p.position.z) < (BUILDINGS[e.o.tipo].r + 0.4)); }
  function applyPlot(e, o) {
    const u = e.g.userData.plot; if (!u) return;
    u.seeds.visible = o.st === 'semeado'; u.sprout.visible = o.st === 'regado'; u.bush.visible = o.st === 'pronto'; u.bubble.visible = o.st === 'pronto';
    u.box.material = o.st === 'regado' || o.st === 'pronto' ? u.wetM : u.soilM; u.grow = o.grow ?? 0;
  }
  for (const o of opts.obras) { const e = makeObra(o); applyPlot(e, o); }
  // ---------- quem pede socorro ----------
  let npc = null, trap = null; const npcPos = V(NPC_SPOT[0], 0, NPC_SPOT[1]);
  if (opts.resgate) {
    const r = region.resgate;
    npc = buildCreature({ npc: { arch: r.arch, cor: r.cor, chapeu: r.chapeu } }); npc.scale.multiplyScalar(1.25 / Math.max(0.5, npc.userData.height)); npc.userData.height = 1.25;
    npc.position.copy(npcPos); world.add(npc);
    if (!opts.resgate.salvo) trap = makeTrap(b, world, r.armadilha, npcPos, npc);
  }
  // ---------- o personagem ----------
  const kid = buildKid(opts.kid); const sp0 = opts.spawn || SPAWN; kid.position.set(sp0[0], 0, sp0[1]); kid.rotation.y = Math.PI * 0.1; world.add(kid);
  const K = { goal: null, follow: null, stopAt: 0, onArrive: null, onFail: null, stuck: 0, last: V(0, 0, 0), speed: 0 };
  // ---------- companheiros ----------
  const walkers = [];
  for (const it of opts.amigos) {
    const c = buildCreature({ sp: it.spId }, { shiny: it.shiny }); const sc = petScale(c, it.arch, it.stage); c.scale.multiplyScalar(sc); c.userData.height *= sc;
    const [px, pz] = clampOpen(opts.zonas, (rnd() - 0.5) * 7, (rnd() - 0.5) * 7, 0.8); c.position.set(px, 0, pz);
    world.add(c);
    const w = { c, uid: it.uid, target: new THREE.Vector3(px, 0, pz), wait: rnd() * 2, bubbles: [], job: null, hitT: 0, r: 0.25 + 0.3 * sc * (it.stage + 1) * 0.4, happyT: 0 };
    newTarget(w); walkers.push(w); setBubbles(w, it.bolsa, it.emoji);
  }
  function newTarget(w) { const k = [...zonas][Math.floor(Math.random() * zonas.size)]; const [cx, cz] = zoneCenter(k); w.target.set(cx + (Math.random() - 0.5) * 8, 0, cz + (Math.random() - 0.5) * 8); }
  function setBubbles(w, n, emoji) {
    for (const s of w.bubbles) w.c.remove(s); w.bubbles = [];
    const k = w.c.scale.x; n = Math.min(3, n || 0);
    for (let i = 0; i < n; i++) { const s = itemSprite(emoji || '🎁', 0.5 / k, '#ffd23f'); s.userData.bubble = true; s.position.set((i - (n - 1) / 2) * 0.5 / k, (w.c.userData.height + 0.45) / k, 0); w.c.add(s); w.bubbles.push(s); }
  }
  // ---------- brilhos no chão ----------
  const sparkles = [];
  function placeSparkles(n) {
    for (const s of sparkles) world.remove(s); sparkles.length = 0;
    const zl = [...zonas];
    for (let i = 0; i < n; i++) {
      let p = null; for (let tries = 0; tries < 20 && !p; tries++) { const [cx, cz] = zoneCenter(zl[Math.floor(rnd() * zl.length)]); const x = cx + (rnd() - 0.5) * 8, z = cz + (rnd() - 0.5) * 8; if (!obstacles().some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 0.5)) p = [x, z]; }
      if (!p) continue;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkleTexture(), color: '#fff2a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.set(p[0], 0.45, p[1]); s.scale.setScalar(0.9); s.userData.sparkle = true; world.add(s); sparkles.push(s);
    }
  }
  placeSparkles(opts.brilhos || 0);
  // ---------- época do ano ----------
  const themeFx = themeDecor(b, world, scene, tema, zonas, rnd, obstaclesStatic);
  const amb = makeSparkles(scene, 40, 22, el === 'fogo' ? ['#ffb347', '#ff7a1a'] : el === 'cosmo' ? ['#ffffff', '#ffb8f8'] : el === 'eletrico' ? ['#fff47a', '#bff6ff'] : el === 'gelo' ? ['#ffffff', '#dff6ff'] : ['#ffffff', '#fff3a0'], el === 'gelo' ? -2 : 2.4);
  // ---------- marcador do destino e "fantasma" da construção ----------
  const marker = new THREE.Group(); marker.visible = false; world.add(marker);
  const mRing = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.45, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false })); mRing.rotation.x = -Math.PI / 2; mRing.position.y = 0.06; marker.add(mRing);
  const mDot = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: '#7df9ff', transparent: true, depthWrite: false })); mDot.rotation.x = -Math.PI / 2; mDot.position.y = 0.065; marker.add(mDot);
  let markerT = 0;
  let ghost = null;
  // ---------- colisões ----------
  function obstaclesStatic() {
    const out = [];
    for (const o of resObjs.values()) if (!o.locked && o.vivo) out.push({ x: o.data.x, z: o.data.z, r: o.data.r * 0.85 });
    for (const e of obraObjs.values()) if (e.o.tipo !== 'canteiro' && e.o.tipo !== 'flores') out.push({ x: e.g.position.x, z: e.g.position.z, r: BUILDINGS[e.o.tipo].r * 0.8 });
    if (npc) out.push({ x: npcPos.x, z: npcPos.z, r: 0.6 });
    return out;
  }
  function obstacles() { if (!obsCache || obsT <= 0) { obsCache = obstaclesStatic(); obsT = 0.5; } return obsCache; }
  function stepAgent(pos, goal, speed, dt, r) {
    const d = goal.clone().sub(pos); d.y = 0; const len = d.length(); if (len < 1e-4) return 0;
    const step = Math.min(len, speed * dt); pos.addScaledVector(d.normalize(), step);
    for (const o of obstacles()) { const dx = pos.x - o.x, dz = pos.z - o.z; const dd = Math.hypot(dx, dz); const min = o.r + r; if (dd < min && dd > 1e-4) { pos.x = o.x + dx / dd * min; pos.z = o.z + dz / dd * min; } }
    const [cx, cz] = clampOpen(opts.zonas, pos.x, pos.z, r); pos.x = cx; pos.z = cz;
    return step;
  }
  let bursts = [], camAng = 0.5, zoom = 1, boltT = 3, fornoOn = false, camT = V(sp0[0], 0, sp0[1]);
  const revealKey = opts.reveal; let revealT = revealKey ? 0 : 2;
  const revealObjs = [];
  if (revealKey) { // o lote que acabou de abrir: tudo nasce crescendo
    const [cx, cz] = zoneCenter(revealKey);
    world.traverse((o) => { if (o.parent === world && o !== ground && Math.abs(o.position.x - cx) < ZONE / 2 && Math.abs(o.position.z - cz) < ZONE / 2 && (o.userData.tipo === 'recurso' || propList.includes(o))) { revealObjs.push({ o, s: o.scale.clone(), d: Math.random() * 0.6 }); o.scale.setScalar(0.001); } });
    setTimeout(() => bursts.push(...burst(scene, V(cx, 1, cz), ['#ffffff', '#ffd25a', '#7df9ff', '#8ee07a'], 90, 6)), 200);
  }
  const fxTimers = [];
  const api = {
    scene, camera, world, walkers, kid,
    fit(w, h) { api.portrait = h > w; },
    // ---------- o personagem ----------
    get kidPos() { return kid.position; },
    walkTo(x, z, o = {}) {
      const [gx, gz] = clampOpen(opts.zonas, x, z, 0.3);
      K.goal = V(gx, 0, gz); K.follow = o.follow || null; K.stopAt = o.stopAt || 0; K.onArrive = o.onArrive || null; K.onFail = o.onFail || null; K.stuck = 0; K.face = o.face ? V(o.face[0], 0, o.face[1]) : null;
      kid.userData.ctrl.stop();
      if (o.marker !== false) { marker.visible = true; marker.position.set(gx, 0, gz); markerT = 0; }
    },
    stopWalk() { K.goal = null; K.follow = null; },
    kidAct(tipo, dur, onHit, onEnd) { kid.userData.ctrl.act(tipo, dur, onHit, onEnd); },
    get kidBusy() { return kid.userData.ctrl.busy; },
    // ---------- recursos ----------
    resourcePos(id) { const o = resObjs.get(id); return o ? o.data : null; },
    // tirado agora (pelo jogador ou companheiro): some com efeito
    removeResource(id) {
      const o = resObjs.get(id); if (!o || !o.vivo) return; o.vivo = false; o.mode = 'out'; o.anim = 0; obsT = 0;
      const p = V(o.data.x, 1, o.data.z);
      const col = o.data.tipo === 'arvore' ? ['#c9a06a', '#6fbf3a', '#8a6a44'] : o.data.tipo === 'rocha' ? ['#c0c8d8', '#ffd27a', '#8a8490'] : [berry, '#6fbf3a'];
      bursts.push(...burst(scene, p, col, 26, 3));
    },
    setResources(list) {
      for (const r of list) {
        const o = resObjs.get(r.id); if (!o || o.locked) continue;
        if (r.vivo && !o.vivo) { o.vivo = true; o.mode = 'in'; o.anim = 0; obsT = 0; o.full.visible = true; o.full.scale.setScalar(0.01); o.sapling.visible = false; bursts.push(...burst(scene, V(o.data.x, 0.6, o.data.z), ['#ffffff', '#8ee07a', '#fff3a0'], 20, 2.2)); }
        else if (!r.vivo && o.vivo) api.removeResource(r.id);
        if (!r.vivo && o.mode !== 'out') o.sapling.scale.setScalar(0.3 + 0.7 * (r.cresce || 0));
      }
    },
    // ---------- construções ----------
    setObras(list) {
      const seen = new Set();
      for (const o of list) {
        seen.add(o.uid); let e = obraObjs.get(o.uid);
        if (!e) { e = makeObra(o); }
        else if (e.o.x !== o.x || e.o.z !== o.z || e.o.rot !== o.rot) { e.g.position.set(o.x, 0, o.z); e.g.rotation.y = o.rot || 0; e.o = { ...o }; hideProps(); obsT = 0; }
        e.o.st = o.st; applyPlot(e, o);
      }
      for (const [uid, e] of obraObjs) if (!seen.has(uid)) { bursts.push(...burst(scene, e.g.position.clone().setY(0.6), ['#ffffff', '#c9a06a'], 24, 2.5)); world.remove(e.g); obraObjs.delete(uid); hideProps(); }
      obsT = 0;
    },
    // a obra nasce escondida e aparece quando o personagem termina de martelar
    hideObra(uid) { const e = obraObjs.get(uid); if (e) { e.pending = true; e.g.scale.setScalar(0.001); } },
    revealObra(uid) { const e = obraObjs.get(uid); if (e) { e.pending = false; e.pop = 0.0001; bursts.push(...burst(scene, e.g.position.clone().setY(0.4), ['#ffffff', '#ffd25a', '#c9a06a', '#7df9ff'], 46, 3.5)); } },
    obraPos(uid) { const e = obraObjs.get(uid); return e ? e.g.position : null; },
    obraObj(uid) { return obraObjs.get(uid)?.g; },
    setGhost(tipo, x, z, rot, ok) {
      if (!tipo) { if (ghost) world.remove(ghost.g); ghost = null; return; }
      if (!ghost || ghost.tipo !== tipo) {
        if (ghost) world.remove(ghost.g);
        const g = b.g(world); buildingModel(b, g, tipo, el);
        g.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.62; o.material.depthWrite = false; o.castShadow = false; } });
        const ring = new THREE.Mesh(new THREE.RingGeometry(BUILDINGS[tipo].r, BUILDINGS[tipo].r + 0.14, 40), new THREE.MeshBasicMaterial({ color: '#5fd27a', transparent: true, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; g.add(ring);
        const disk = new THREE.Mesh(new THREE.CircleGeometry(BUILDINGS[tipo].r, 40), new THREE.MeshBasicMaterial({ color: '#5fd27a', transparent: true, opacity: 0.25, depthWrite: false })); disk.rotation.x = -Math.PI / 2; disk.position.y = 0.065; g.add(disk);
        ghost = { g, tipo, ring, disk };
      }
      ghost.g.position.set(x, 0, z); ghost.g.rotation.y = rot || 0;
      const c = ok ? '#5fd27a' : '#ff5a5a'; ghost.ring.material.color.set(c); ghost.disk.material.color.set(c);
    },
    // ---------- companheiros ----------
    setAmigoBubbles(uid, n, emoji) { const w = walkers.find((x) => x.uid === uid); if (w) setBubbles(w, n, emoji); },
    setJob(uid, tipo, alvo) {
      const w = walkers.find((x) => x.uid === uid); if (!w) return;
      let p = null;
      if (['cortar', 'minerar', 'catar'].includes(tipo)) { const r = resObjs.get(alvo); if (r) p = { x: r.data.x, z: r.data.z, r: r.data.r }; }
      else if (['semear', 'regar', 'colher'].includes(tipo)) { const e = obraObjs.get(alvo); if (e) p = { x: e.g.position.x, z: e.g.position.z, r: 0.7 }; }
      else if (tipo === 'fundir') { const e = [...obraObjs.values()].find((q) => q.o.tipo === 'forno'); if (e) p = { x: e.g.position.x, z: e.g.position.z, r: 1.2 }; }
      w.job = p ? { tipo, p: V(p.x, 0, p.z), r: p.r } : tipo === 'cheio' ? { tipo, p: null } : null;
    },
    petHappy(uid) { const w = walkers.find((x) => x.uid === uid); if (w) { w.c.userData.ctrl.happy(); w.happyT = 1.2; bursts.push(...burst(scene, w.c.position.clone().setY(w.c.userData.height + 0.2), ['#ff7ab8', '#ffffff', '#ffd25a'], 18, 2)); } },
    walkerPos(uid) { return walkers.find((x) => x.uid === uid)?.c.position || null; },
    setSparkles: placeSparkles,
    setForno(on) { fornoOn = on; },
    popAt(pos, color, n = 18) { const p = pos.isVector3 ? pos.clone() : (() => { const v = new THREE.Vector3(); pos.getWorldPosition(v); return v; })(); bursts.push(...burst(scene, p, color || ['#fff3a0', '#ffffff'], n, 2.5)); },
    freeNpc() { if (trap) { bursts.push(...burst(scene, npcPos.clone().setY(1), ['#ffffff', '#7df9ff', '#ffe066', '#ff9f5a'], 70, 5)); world.remove(trap.g); trap = null; npc.position.y = 0; } npc?.userData.ctrl.happy(); },
    npcPos,
    // ---------- toque ----------
    pick(ray) {
      const targets = [...walkers.map((w) => w.c), ...sparkles, ...(npc ? [npc] : []), kid, ...[...resObjs.values()].filter((o) => !o.locked).map((o) => o.g), ...[...obraObjs.values()].map((e) => e.g), ...locks];
      const hits = ray.intersectObjects(targets, true);
      const shown = (o) => { for (let q = o; q && q !== world; q = q.parent) if (!q.visible) return false; return true; };
      for (const h of hits) {
        let o = h.object; if (!shown(o)) continue;
        if (o.userData.sparkle) return { tipo: 'brilho', obj: o };
        if (o.userData.lote) return { tipo: 'lote', key: o.userData.lote };
        while (o && o !== world && !walkers.some((w) => w.c === o) && o !== npc && o !== kid && !o.userData.tipo) o = o.parent;
        if (!o || o === world) continue;
        if (o === kid) return { tipo: 'eu', obj: kid };
        if (o === npc) return { tipo: 'npc', obj: npc };
        const w = walkers.find((x) => x.c === o);
        if (w) return { tipo: h.object.userData.bubble ? 'bolha' : 'amigo', walker: w, obj: h.object };
        if (o.userData.tipo === 'recurso') { const r = resObjs.get(o.userData.id); return { tipo: 'recurso', id: o.userData.id, vivo: r.vivo, data: r.data, obj: o }; }
        if (o.userData.tipo === 'obra') return { tipo: 'obra', uid: o.userData.uid, obra: o.userData.obra, obj: o };
      }
      // chão
      const p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(V(0, 1, 0), 0), p)) return null;
      const k = zoneAt(p.x, p.z);
      if (!isOpen(k)) return inGrid(...parseKey(k)) ? { tipo: 'lote', key: k, x: p.x, z: p.z } : { tipo: 'longe', x: p.x, z: p.z };
      return { tipo: 'chao', x: p.x, z: p.z };
    },
    groundAt(ray) { const p = new THREE.Vector3(); return ray.ray.intersectPlane(new THREE.Plane(V(0, 1, 0), 0), p) ? p : null; },
    rotate(dx) { camAng += dx * 0.006; },
    zoomBy(k) { zoom = Math.min(1.7, Math.max(0.55, zoom * k)); },
    get camAng() { return camAng; },
    update(t, dt) {
      obsT -= dt;
      // ---------- personagem ----------
      const kc = kid.userData.ctrl;
      if (K.goal && !kc.busy) {
        if (K.follow) { const fp = K.follow(); if (fp) K.goal.set(fp.x, 0, fp.z); }
        const d = K.goal.clone().sub(kid.position); d.y = 0; const len = d.length();
        const stop = Math.max(0.12, K.stopAt);
        if (len <= stop) {
          const face = K.face || (K.stopAt ? K.goal : null);
          K.goal = null; kc.setMove(0); marker.visible = false;
          if (face) { const f = face.clone().sub(kid.position); kid.rotation.y = Math.atan2(f.x, f.z); }
          const cb = K.onArrive; K.onArrive = null; cb?.();
        } else {
          const speed = len > 2.5 ? 3.4 : 1.9; const before = kid.position.clone();
          const target = K.stopAt ? K.goal.clone().addScaledVector(d.clone().normalize(), -K.stopAt * 0.9) : K.goal;
          stepAgent(kid.position, target, speed, dt, 0.28);
          const moved = kid.position.distanceTo(before);
          kc.setMove(moved / dt);
          kid.rotation.y = angTo(kid.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 10));
          K.stuck = moved < speed * dt * 0.15 ? K.stuck + dt : 0;
          if (K.stuck > 0.6) { const close = len <= stop + 1.2; K.goal = null; kc.setMove(0); marker.visible = false; const cb = close ? K.onArrive : K.onFail; K.onArrive = null; cb?.(); }
        }
      } else if (!K.goal) kc.setMove(0);
      kc.update(t, dt);
      if (marker.visible) { markerT += dt; mRing.scale.setScalar(1 + Math.sin(markerT * 6) * 0.15); mRing.material.opacity = 0.9; }
      // ---------- câmera segue o personagem ----------
      camT.lerp(kid.position, Math.min(1, dt * 4));
      const dist = 12.5 * (api.portrait ? 1.3 : 1) * zoom;
      camera.position.set(camT.x + Math.sin(camAng) * dist * 0.66, dist * 0.98, camT.z + Math.cos(camAng) * dist * 0.66); camera.lookAt(camT.x, 0.5, camT.z);
      // árvores entre a câmera e o personagem ficam transparentes (para nunca esconder a criança)
      for (const o of trees) { const d2 = segDist(camera.position, kid.position, o.g.position); const hide = d2 < 2.3 && camera.position.distanceTo(o.g.position) < camera.position.distanceTo(kid.position); o.fade += ((hide ? 0.25 : 1) - o.fade) * Math.min(1, dt * 6); setFade(o, o.fade); }
      sun.position.set(camT.x + 8, 20, camT.z + 10); sun.target.position.copy(camT); sun.target.updateMatrixWorld();
      // ---------- recursos ----------
      for (const o of resObjs.values()) {
        if (o.mode === 'out') { o.anim += dt / 0.7; const k = Math.min(1, o.anim); if (o.data.tipo === 'arvore') { o.full.rotation.z = k * k * 1.4; o.full.scale.setScalar(1 - k * 0.6); } else o.full.scale.setScalar(Math.max(0.001, 1 - k)); if (k >= 1) { o.mode = null; o.full.visible = false; o.full.rotation.z = 0; o.full.scale.setScalar(1); o.sapling.visible = true; o.sapling.scale.setScalar(0.3); } }
        else if (o.mode === 'in') { o.anim += dt / 0.9; const k = Math.min(1, o.anim); o.full.scale.setScalar(Math.max(0.001, k < 0.7 ? (k / 0.7) * 1.15 : 1.15 - (k - 0.7) / 0.3 * 0.15)); if (k >= 1) { o.mode = null; o.full.scale.setScalar(1); } }
      }
      // ---------- obras aparecendo ----------
      for (const e of obraObjs.values()) {
        if (e.pop > 0) { e.pop += dt / 0.7; const k = Math.min(1, e.pop); const s = k < 0.6 ? (k / 0.6) * 1.2 : 1.2 - (k - 0.6) / 0.4 * 0.2; e.g.scale.set(1 + (1 - k) * 0.3 * Math.sin(k * 20), Math.max(0.001, s), 1 + (1 - k) * 0.3 * Math.sin(k * 20)); if (k >= 1) { e.pop = 0; e.g.scale.setScalar(1); } }
        const u = e.g.userData;
        if (u.plot) { const p = u.plot; if (p.sprout.visible) p.sprout.scale.setScalar(0.3 + 0.7 * (p.grow || 0)); if (p.bubble.visible) p.bubble.position.y = 1.05 + Math.sin(t * 3 + e.o.uid) * 0.08; }
        if (u.flame) u.flame.scale.y = 1 + Math.sin(t * 11 + e.o.uid) * 0.18;
        if (u.spin) u.spin.rotation.y += dt * 0.8;
        if (u.swing) u.swing.rotation.x = Math.sin(t * 1.6 + e.o.uid) * 0.35;
        if (u.water) u.water.material.opacity = 0.65 + Math.sin(t * 3) * 0.1;
        if (u.blink) u.blink.forEach((m, i) => { m.material.emissiveIntensity = 0.6 + (Math.sin(t * 4 + i * 1.7) > 0 ? 1.6 : 0); });
        if (u.float) u.float.position.y = u.floatY + Math.sin(t * 1.4 + e.o.uid) * 0.12;
        if (u.mouth) { u.mouth.material.emissiveIntensity = fornoOn ? 2 + Math.sin(t * 9) * 0.5 : 0.25; u.fl.intensity = fornoOn ? 6 + Math.sin(t * 11) * 2 : 0; }
      }
      // ---------- lotes bloqueados ----------
      for (const l of locks) { l.position.y = l.userData.base + Math.sin(t * 2 + l.position.x) * 0.12; if (l.userData.ring) { l.userData.ring.material.opacity = 0.5 + Math.sin(t * 3) * 0.3; l.userData.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06); } }
      // ---------- companheiros ----------
      for (const w of walkers) {
        const c = w.c; const ctrl = c.userData.ctrl; let goal = null; const full = w.job?.tipo === 'cheio' || w.bubbles.length >= 3;
        if (w.happyT > 0) { w.happyT -= dt; ctrl.setWalking(0); }
        else if (full) ctrl.setWalking(0);
        else if (w.job?.p) goal = w.job.p;
        if (goal) {
          const d = goal.clone().sub(c.position); d.y = 0; const len = d.length(); const reach = w.job.r + 0.35;
          if (len > reach) { stepAgent(c.position, goal, 1.7, dt, w.r); c.rotation.y = angTo(c.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 6)); ctrl.setWalking(1); }
          else {
            ctrl.setWalking(0); c.rotation.y = angTo(c.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 6));
            w.hitT -= dt; if (w.hitT < 0) { w.hitT = 0.9; ctrl.jump(); const col = { cortar: ['#c9a06a', '#8a6a44'], minerar: ['#c0c8d8', '#ffd27a'], regar: ['#8fd8ff', '#ffffff'], semear: ['#d9b070', '#8ee07a'], colher: ['#ff6a5a', '#8ee07a'], catar: [berry, '#8ee07a'], fundir: ['#ffb347', '#ff6a10'] }[w.job.tipo] || ['#ffffff']; bursts.push(...burst(scene, goal.clone().setY(0.6), col, 6, 1.6)); }
          }
        } else if (!full && w.happyT <= 0) {
          if (w.wait > 0) { w.wait -= dt; ctrl.setWalking(0); }
          else {
            const d = w.target.clone().sub(c.position); d.y = 0; const len = d.length();
            if (len < 0.3) { w.wait = 1.5 + Math.random() * 3; newTarget(w); }
            else { const before = c.position.clone(); stepAgent(c.position, w.target, 1.0, dt, w.r); if (c.position.distanceTo(before) < 0.002) newTarget(w); c.rotation.y = angTo(c.rotation.y, Math.atan2(d.x, d.z), Math.min(1, dt * 5)); ctrl.setWalking(1); }
          }
        }
        // não atravessa o personagem
        const dx = c.position.x - kid.position.x, dz = c.position.z - kid.position.z; const dd = Math.hypot(dx, dz), mn = w.r + 0.3; if (dd < mn && dd > 1e-4) { c.position.x = kid.position.x + dx / dd * mn; c.position.z = kid.position.z + dz / dd * mn; }
        ctrl.update(t, dt);
        const k = c.scale.x; w.bubbles.forEach((s, i) => { s.position.y = (c.userData.height + 0.45 + Math.sin(t * 3 + i) * 0.08) / k; });
      }
      sparkles.forEach((s, i) => { s.material.rotation = t + i; s.scale.setScalar(0.8 + Math.sin(t * 4 + i) * 0.15); });
      if (npc) { npc.userData.ctrl.update(t, dt); const f = kid.position.clone().sub(npc.position); npc.rotation.y = angTo(npc.rotation.y, Math.atan2(f.x, f.z), Math.min(1, dt * 3)); }
      if (trap) trap.update(t, dt);
      world.traverse((o) => { if (o.userData.flame) o.scale.y = o.userData.flame * (1 + Math.sin(t * 11 + o.id) * 0.15); });
      if (el === 'eletrico') { boltT -= dt; if (boltT < 0) { boltT = 2 + Math.random() * 4; const a = Math.random() * Math.PI * 2; const bm = boltMesh(V(camT.x + Math.cos(a) * 40, 30, camT.z + Math.sin(a) * 40 - 20), V(camT.x + Math.cos(a) * 44, -2, camT.z + Math.sin(a) * 44 - 20)); scene.add(bm); setTimeout(() => scene.remove(bm), 180); } }
      // lote novo aparecendo
      if (revealT < 2) { revealT += dt; for (const r of revealObjs) { const k = Math.min(1, Math.max(0, (revealT - r.d) / 0.6)); const s = k < 0.7 ? k / 0.7 * 1.15 : 1.15 - (k - 0.7) / 0.3 * 0.15; r.o.scale.copy(r.s).multiplyScalar(Math.max(0.001, s)); } }
      amb.update(dt, 0.6); themeFx?.update(t, dt, camT); stepBursts(scene, bursts, dt);
      ghost && (ghost.ring.scale.setScalar(1 + Math.sin(t * 6) * 0.04));
    },
    dispose() { fxTimers.forEach(clearTimeout); },
  };
  return api;
}

// ---------- árvore, rocha ou arbusto (a peça inteira ou o brotinho que volta a crescer) ----------
function buildResource(b, root, r, el, berry, part) {
  if (r.tipo === 'arvore') {
    if (part === 'full') { const in1 = b.g(root); in1.scale.setScalar(1.5 * r.s); resourceTree(b, in1, el, mulberry(Math.round(r.x * 100 + r.z))); }
    else { b.m(root, GEO.cyl, mat('#6a4a32'), [0, 0.15, 0], [0.03, 0.3, 0.03]); for (const sx of [1, -1]) b.m(root, SHAPES.leaf, mat('#6fbf3a'), [0, 0.28, 0], 0.18, [0, 0, -sx * 0.8]); b.m(root, GEO.cyl, mat('#6a4a32', { kind: 'couro', seed: 4 }), [0.25, 0.08, 0.1], [0.22, 0.16, 0.22]); }
  } else if (r.tipo === 'rocha') {
    const col = el === 'cosmo' ? '#3a3060' : el === 'gelo' ? '#9ab0c0' : el === 'pedra' ? '#a0603a' : '#7a7480';
    if (part === 'full') { rock(b, root, [0, 0.5, 0], 0.85 * r.s, col, mulberry(Math.round(r.x * 31 + r.z))); for (let k = 0; k < 6; k++) { const a = k * 1.1; b.m(root, GEO.oct, mat(k % 2 ? '#b0b8c8' : '#d08a4a', { metal: 0.8, rough: 0.3 }), [Math.cos(a) * 0.55 * r.s, 0.4 + (k % 3) * 0.22, Math.sin(a) * 0.55 * r.s], 0.11); } }
    else for (let k = 0; k < 3; k++) rock(b, root, [Math.cos(k * 2.1) * 0.25, 0.07, Math.sin(k * 2.1) * 0.25], 0.12, col, mulberry(k + 3));
  } else {
    const lc = { gelo: '#cfe8f0', fogo: '#6a3a2a', cosmo: '#5a3a9a', eletrico: '#8a8a3a', pedra: '#7a8a4a' }[el] || '#3f8a2e';
    if (part === 'full') {
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; b.m(root, GEO.ico, mat(shade(lc, 0, 0, (k % 2) * 0.06), { rough: 0.85, flat: true }), [Math.cos(a) * 0.28, 0.32 + (k % 2) * 0.12, Math.sin(a) * 0.28], 0.32); }
      b.m(root, GEO.ico, mat(shade(lc, 0, 0, 0.05), { rough: 0.85, flat: true }), [0, 0.58, 0], 0.3);
      for (let k = 0; k < 9; k++) { const a = k * 2.4; b.m(root, GEO.sph, mat(berry, { rough: 0.25, glow: el === 'cosmo' || el === 'eletrico' ? 0.6 : 0, emis: berry }), [Math.cos(a) * 0.42, 0.3 + (k % 3) * 0.17, Math.sin(a) * 0.42], 0.065); }
    } else for (const sx of [1, -1]) b.m(root, SHAPES.leaf, mat('#6fbf3a'), [0, 0.02, 0], 0.16, [0, sx, -sx * 0.7]);
  }
}
// ---------- enfeites pequenos do chão (por bioma) ----------
function smallProp(b, g, el, v, s) {
  const k = Math.floor(v * 4);
  const flower = (c) => { b.m(g, GEO.cyl, mat('#4f9d3a'), [0, 0.14 * s, 0], [0.015, 0.28 * s, 0.015]); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.m(g, GEO.sph, mat(c), [Math.cos(a) * 0.06, 0.29 * s, Math.sin(a) * 0.06], [0.05, 0.02, 0.05]).castShadow = false; } b.m(g, GEO.sph, mat('#ffd34d'), [0, 0.3 * s, 0], 0.035).castShadow = false; };
  const pebble = (c) => { for (let i = 0; i < 3; i++) b.m(g, GEO.dode, mat(c, { rough: 0.95, flat: true }), [(i - 1) * 0.18, 0.05, (i % 2) * 0.12], 0.08 + i * 0.02, [i, i * 2, 0]); };
  const mush = () => { b.m(g, GEO.cyl, mat('#f2e6cc'), [0, 0.07, 0], [0.035, 0.14, 0.035]); b.m(g, GEO.dome, mat('#d9342b', { rough: 0.6 }), [0, 0.13, 0], [0.11, 0.08, 0.11]); };
  const crystal = (c) => { for (let i = 0; i < 3; i++) b.m(g, GEO.oct, mat(c, { glow: 0.9, emis: c, rough: 0.2 }), [(i - 1) * 0.1, 0.16, 0], [0.06, 0.18 + i * 0.04, 0.06], [0, 0, (i - 1) * 0.3]).castShadow = false; };
  switch (el) {
    case 'planta': [() => flower('#ff7ab8'), () => flower('#ffffff'), mush, () => flower('#9a6aff')][k](); break;
    case 'agua': [() => flower('#7ac8ff'), () => pebble('#9ab0c0'), () => { for (let i = 0; i < 4; i++) b.m(g, GEO.cyl, mat('#5a8a3a'), [i * 0.06 - 0.1, 0.25, (i % 2) * 0.06], [0.015, 0.5, 0.015]); }, () => flower('#ffffff')][k](); break;
    case 'fogo': [() => pebble('#2a1e1e'), () => crystal('#ff6a10'), () => pebble('#4a2a2a'), () => crystal('#ffb020')][k](); break;
    case 'vento': [() => flower('#ffffff'), () => pebble('#8aa39a'), () => flower('#ffd34d'), () => pebble('#a0b8b0')][k](); break;
    case 'gelo': [() => crystal('#bff0ff'), () => pebble('#e8f6fa'), () => crystal('#9fd8ff'), () => pebble('#c8dde8')][k](); break;
    case 'pedra': [() => pebble('#a0603a'), () => crystal('#ff9a3c'), () => pebble('#c98a50'), () => { b.m(g, GEO.cyl, mat('#5a8a3a'), [0, 0.15, 0], [0.06, 0.3, 0.06]); b.m(g, GEO.cyl, mat('#5a8a3a'), [0.07, 0.2, 0], [0.04, 0.12, 0.04], [0, 0, -0.8]); }][k](); break;
    case 'eletrico': [() => crystal('#fff47a'), () => pebble('#4a4c5c'), () => crystal('#bff6ff'), () => pebble('#6a6c7c')][k](); break;
    case 'cosmo': [() => crystal('#c88cff'), () => crystal('#7df9ff'), () => pebble('#2a2244'), () => crystal('#ff7df2')][k](); break;
  }
}

// ---------- os modelos de cada construção (escala: o personagem tem 1,15 m) ----------
export function buildingModel(b, g, tipo, el) {
  const wood = mat('#8a5a34', { kind: 'couro', seed: 6, rough: 0.9 }), dkw = mat('#5a3a22', { rough: 0.9 }), steel = mat('#9aa0b0', { metal: 0.8, rough: 0.3 }), stone = mat('#6a6470', { kind: 'pedra', seed: 9, rough: 0.95 });
  const u = g.userData;
  switch (tipo) {
    case 'canteiro': {
      const soilM = mat('#5a3a24', { kind: 'pele', seed: 5, rough: 1 }), wetM = mat('#3a2416', { rough: 0.6 });
      const box = b.m(g, GEO.box, soilM, [0, 0.09, 0], [1.2, 0.18, 1.2]); box.receiveShadow = true;
      for (const [x, z] of [[-0.6, 0], [0.6, 0], [0, -0.6], [0, 0.6]]) b.m(g, GEO.box, mat('#7a5a3a', { rough: 0.9 }), [x, 0.13, z], x ? [0.08, 0.24, 1.28] : [1.28, 0.24, 0.08]);
      for (let k = 0; k < 3; k++) b.m(g, GEO.box, mat('#4a2e1c', { rough: 1 }), [0, 0.185, (k - 1) * 0.36], [1.05, 0.02, 0.1]);
      const seeds = b.g(g, [0, 0.2, 0]); for (let k = 0; k < 6; k++) b.m(seeds, GEO.sphLo, mat('#d9b070'), [((k % 3) - 1) * 0.32, 0, (Math.floor(k / 3) - 0.5) * 0.45], 0.045);
      const sprout = b.g(g, [0, 0.19, 0]); for (let k = 0; k < 4; k++) { const sg = b.g(sprout, [((k % 2) - 0.5) * 0.5, 0, (Math.floor(k / 2) - 0.5) * 0.5]); b.m(sg, GEO.cyl, mat('#4f9d3a'), [0, 0.13, 0], [0.025, 0.26, 0.025]); for (const sx of [1, -1]) b.m(sg, SHAPES.leaf, mat('#6fbf3a'), [0, 0.24, 0], 0.17, [0, 0, -sx * 0.7]); }
      const bush = b.g(g, [0, 0.19, 0]); for (let k = 0; k < 4; k++) { const bg = b.g(bush, [((k % 2) - 0.5) * 0.5, 0, (Math.floor(k / 2) - 0.5) * 0.5]); b.m(bg, GEO.ico, mat('#3f8a2e', { flat: true }), [0, 0.26, 0], 0.24); for (let f = 0; f < 3; f++) b.m(bg, GEO.sph, mat('#e8322a', { rough: 0.3 }), [Math.cos(f * 2) * 0.16, 0.32 + f * 0.05, Math.sin(f * 2) * 0.16], 0.075); }
      const bubble = itemSprite('🍎', 0.55, '#ff8a1c'); bubble.position.y = 1.05; g.add(bubble);
      seeds.visible = sprout.visible = bush.visible = bubble.visible = false;
      u.plot = { box, seeds, sprout, bush, bubble, soilM, wetM, grow: 0 }; break;
    }
    case 'bancada': b.m(g, GEO.box, wood, [0, 0.72, 0], [1.7, 0.12, 0.85]); for (const [x, z] of [[-0.75, -0.32], [0.75, -0.32], [-0.75, 0.32], [0.75, 0.32]]) b.m(g, GEO.box, dkw, [x, 0.35, z], [0.1, 0.7, 0.1]); b.m(g, GEO.box, wood, [0, 0.25, 0], [1.5, 0.06, 0.7]); b.m(g, GEO.box, steel, [0.45, 0.84, 0], [0.42, 0.12, 0.26]); b.m(g, GEO.cyl, dkw, [-0.4, 0.82, 0.12], [0.04, 0.4, 0.04], [0, 0, Math.PI / 2]); b.m(g, GEO.box, mat('#b4bccf', { metal: 0.9, rough: 0.25 }), [-0.2, 0.82, 0.12], [0.14, 0.12, 0.1]); b.m(g, GEO.box, wood, [0, 1.3, -0.4], [1.6, 1.0, 0.06]); for (let i = 0; i < 3; i++) b.m(g, GEO.cyl, steel, [-0.5 + i * 0.5, 1.35, -0.34], [0.03, 0.35, 0.03]); break;
    case 'forno': { b.m(g, GEO.cyl, stone, [0, 0.7, 0], [0.75, 1.4, 0.75]); b.m(g, GEO.cone, stone, [0, 1.65, 0], [0.6, 0.55, 0.6]); b.m(g, GEO.cyl, stone, [0, 2.15, 0], [0.18, 0.7, 0.18]); const mouth = b.m(g, GEO.box, mat('#ff7a1a', { glow: 0.2, emis: '#ff5a10' }).clone(), [0, 0.5, 0.67], [0.5, 0.45, 0.1]); mouth.castShadow = false; const fl = new THREE.PointLight('#ff8a3c', 0, 5); fl.position.set(0, 0.6, 1.1); g.add(fl); u.mouth = mouth; u.fl = fl; break; }
    case 'casinha': { b.m(g, GEO.box, mat('#e8d8b8', { rough: 0.9 }), [0, 0.75, 0], [1.9, 1.5, 1.6]); const roof = b.m(g, GEO.cone, mat('#b04a3a', { rough: 0.8 }), [0, 1.95, 0], [1.75, 1.0, 1.55], [0, Math.PI / 4, 0]); roof.scale.set(1.75, 1.0, 1.55); b.m(g, GEO.box, dkw, [0, 0.45, 0.81], [0.5, 0.9, 0.04]); for (const sx of [1, -1]) { b.m(g, GEO.box, mat('#9fd8ff', { rough: 0.1, glow: 0.2, emis: '#ffe8a0' }), [sx * 0.6, 0.95, 0.81], [0.35, 0.35, 0.03]); b.m(g, GEO.box, wood, [sx * 0.6, 0.95, 0.83], [0.4, 0.04, 0.02]); } b.m(g, GEO.box, mat('#d9534f'), [0.55, 2.2, 0.3], [0.22, 0.5, 0.22]); break; }
    case 'totem': { b.m(g, GEO.box, mat('#6a6478', { kind: 'pedra', seed: 3, rough: 0.9 }), [0, 1.0, 0], [0.6, 2.0, 0.6]); const bolt = b.m(g, SHAPES.bolt, mat('#7df9ff', { glow: 1.8 }), [0, 1.2, 0.32], 0.35); bolt.castShadow = false; const cr = b.m(g, GEO.oct, mat('#7df9ff', { glow: 2 }), [0, 2.35, 0], 0.22); u.spin = cr; break; }
    case 'cerca': for (const x of [-0.6, 0, 0.6]) b.m(g, GEO.box, wood, [x, 0.42, 0], [0.1, 0.84, 0.1]); for (const y of [0.3, 0.62]) b.m(g, GEO.box, wood, [0, y, 0], [1.35, 0.08, 0.05]); for (const x of [-0.6, 0, 0.6]) b.m(g, GEO.cone, wood, [x, 0.9, 0], [0.07, 0.12, 0.07], [0, Math.PI / 4, 0]); break;
    case 'flores': { const cols = ['#ff7ab8', '#ffd34d', '#ffffff', '#9a6aff', '#ff6a5a']; b.m(g, GEO.cyl, mat('#4a2e1c', { rough: 1 }), [0, 0.05, 0], [0.6, 0.1, 0.6]); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.15 + (i % 3) * 0.14; const fg = b.g(g, [Math.cos(a) * r, 0.08, Math.sin(a) * r]); b.m(fg, GEO.cyl, mat('#4f9d3a'), [0, 0.18, 0], [0.018, 0.36, 0.018]); for (let k = 0; k < 5; k++) { const aa = (k / 5) * Math.PI * 2; b.m(fg, GEO.sph, mat(cols[i % cols.length]), [Math.cos(aa) * 0.07, 0.37, Math.sin(aa) * 0.07], [0.06, 0.025, 0.06]).castShadow = false; } b.m(fg, GEO.sph, mat('#ffd34d'), [0, 0.38, 0], 0.04); } break; }
    case 'lanterna': { b.m(g, GEO.cyl, mat('#3a3a44', { metal: 0.6, rough: 0.4 }), [0, 0.9, 0], [0.05, 1.8, 0.05]); b.m(g, GEO.cyl, mat('#3a3a44', { metal: 0.6 }), [0, 0.04, 0], [0.18, 0.08, 0.18]); const lamp = b.m(g, GEO.sph, mat('#fff2b0', { glow: 1.8, emis: '#ffd36a' }), [0, 1.9, 0], 0.16); lamp.castShadow = false; b.m(g, GEO.cone, mat('#3a3a44', { metal: 0.6 }), [0, 2.08, 0], [0.22, 0.16, 0.22]); const pl = new THREE.PointLight('#ffd36a', 3, 5); pl.position.set(0, 1.85, 0); g.add(pl); break; }
    case 'banco': b.m(g, GEO.box, wood, [0, 0.42, 0], [1.3, 0.08, 0.42]); b.m(g, GEO.box, wood, [0, 0.72, -0.2], [1.3, 0.3, 0.06]); for (const x of [-0.55, 0.55]) { b.m(g, GEO.box, dkw, [x, 0.21, 0.12], [0.08, 0.42, 0.08]); b.m(g, GEO.box, dkw, [x, 0.4, -0.18], [0.08, 0.8, 0.08]); } break;
    case 'espantalho': { b.m(g, GEO.cyl, wood, [0, 0.8, 0], [0.05, 1.6, 0.05]); b.m(g, GEO.cyl, wood, [0, 1.15, 0], [0.04, 1.1, 0.04], [0, 0, Math.PI / 2]); b.m(g, GEO.box, mat('#d9534f', { kind: 'pele', seed: 2 }), [0, 1.0, 0], [0.45, 0.5, 0.22]); b.m(g, GEO.sph, mat('#f2d9a0', { rough: 0.9 }), [0, 1.55, 0], 0.2); b.m(g, GEO.cyl, mat('#e8c46a'), [0, 1.72, 0], [0.38, 0.03, 0.38]); b.m(g, GEO.cyl, mat('#e8c46a'), [0, 1.8, 0], [0.18, 0.16, 0.18]); for (const sx of [1, -1]) b.m(g, GEO.sph, mat('#2a1a14'), [sx * 0.07, 1.58, 0.18], 0.025); b.m(g, GEO.ring, mat('#2a1a14'), [0, 1.5, 0.19], [0.06, 0.04, 1], [0, 0, Math.PI]).castShadow = false; break; }
    case 'balanco': { for (const x of [-0.85, 0.85]) { b.m(g, GEO.cyl, wood, [x, 0.95, -0.3], [0.06, 2.0, 0.06], [0.28, 0, 0]); b.m(g, GEO.cyl, wood, [x, 0.95, 0.3], [0.06, 2.0, 0.06], [-0.28, 0, 0]); } b.m(g, GEO.cyl, wood, [0, 1.92, 0], [0.06, 1.8, 0.06], [0, 0, Math.PI / 2]); const sw = b.g(g, [0, 1.9, 0]); for (const x of [-0.25, 0.25]) b.m(sw, GEO.cyl, mat('#c9b48a'), [x, -0.6, 0], [0.012, 1.2, 0.012]); b.m(sw, GEO.box, mat('#e2403a'), [0, -1.2, 0], [0.6, 0.05, 0.25]); u.swing = sw; break; }
    case 'fonte': { b.m(g, GEO.cyl, stone, [0, 0.2, 0], [1.0, 0.4, 1.0]); const wtr = b.m(g, GEO.cyl, mat('#5fbfff', { op: 0.7, rough: 0.05, glow: 0.3, emis: '#3aa0ff' }), [0, 0.38, 0], [0.88, 0.04, 0.88]); wtr.castShadow = false; u.water = wtr; b.m(g, GEO.cyl, stone, [0, 0.75, 0], [0.12, 0.8, 0.12]); b.m(g, GEO.cyl, stone, [0, 1.12, 0], [0.4, 0.1, 0.4]); const jet = b.m(g, GEO.cone, mat('#bfe8ff', { op: 0.55, glow: 0.6, emis: '#7fd0ff' }), [0, 1.4, 0], [0.12, 0.5, 0.12]); jet.castShadow = false; break; }
    case 'arvore_natal': { b.m(g, GEO.cyl, mat('#6a4a32'), [0, 0.2, 0], [0.12, 0.4, 0.12]); for (let i = 0; i < 3; i++) b.m(g, GEO.cone, mat('#2f8a4a', { rough: 0.8 }), [0, 0.75 + i * 0.55, 0], [0.85 - i * 0.22, 0.9, 0.85 - i * 0.22]); const blink = []; for (let i = 0; i < 14; i++) { const a = i * 2.2, y = 0.5 + (i / 14) * 1.5, r = 0.75 - (i / 14) * 0.55; const lm = mat(['#ff4a4a', '#ffd34d', '#4fc3f7', '#ff7ab8'][i % 4], { glow: 1.2 }).clone(); const m = b.m(g, GEO.sph, lm, [Math.cos(a) * r, y, Math.sin(a) * r], 0.06); m.castShadow = false; blink.push(m); } u.blink = blink; const st = b.m(g, SHAPES.star, mat('#ffd34d', { glow: 1.6 }), [0, 2.35, 0], 0.22); st.castShadow = false; u.spin = st; for (let i = 0; i < 3; i++) { const gx = Math.cos(i * 2.1) * 0.7, gz = Math.sin(i * 2.1) * 0.7; b.m(g, GEO.box, mat(['#e2403a', '#3f63e0', '#ffd34d'][i]), [gx, 0.15, gz], [0.3, 0.3, 0.3]); b.m(g, GEO.box, mat('#ffffff'), [gx, 0.15, gz], [0.32, 0.31, 0.06]); } break; }
    case 'guarda_sol': { b.m(g, GEO.cyl, mat('#ffffff'), [0, 1.0, 0], [0.04, 2.0, 0.04]); const cols = ['#ff6a5a', '#ffffff']; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.m(g, GEO.cone, mat(cols[i % 2], { rough: 0.6 }), [Math.cos(a) * 0.4, 1.95, Math.sin(a) * 0.4], [0.5, 0.35, 0.5], [0, -a, 0]); } b.m(g, GEO.cone, mat('#ff6a5a'), [0, 2.05, 0], [1.1, 0.4, 1.1]); b.m(g, GEO.box, mat('#ffd34d'), [0.5, 0.05, 0.3], [0.6, 0.04, 1.2]); b.m(g, GEO.sph, mat('#ff4a4a'), [-0.5, 0.2, 0.4], 0.2); break; }
    case 'baloes': { const cols = ['#ff4fb0', '#ffd34d', '#4fc3f7', '#5fd27a', '#9a6aff']; b.m(g, GEO.box, mat('#c9a06a'), [0, 0.08, 0], [0.3, 0.16, 0.3]); const f = b.g(g, [0, 0, 0]); cols.forEach((c, i) => { const a = (i / cols.length) * Math.PI * 2; const x = Math.cos(a) * 0.3, z = Math.sin(a) * 0.3, y = 1.8 + (i % 2) * 0.3; b.m(f, GEO.sph, mat(c, { rough: 0.25 }), [x, y, z], [0.24, 0.3, 0.24]); b.m(f, GEO.cyl, mat('#ffffff'), [x / 2, y / 2, z / 2], [0.006, y, 0.006], [z * 0.5, 0, -x * 0.5]); }); u.float = f; u.floatY = 0; break; }
    case 'ninho_ovos': { b.m(g, GEO.ring, mat('#c9a06a', { rough: 1 }), [0, 0.12, 0], [0.45, 0.45, 3], [Math.PI / 2, 0, 0]); b.m(g, GEO.cyl, mat('#a8844a'), [0, 0.06, 0], [0.42, 0.08, 0.42]); ['#ff9fd2', '#9fe0ff', '#ffe066', '#b59cff', '#8ee07a'].forEach((c, i) => { const a = (i / 5) * Math.PI * 2; b.m(g, GEO.sph, mat(c, { kind: 'pele', seed: i + 2 }), [Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2], [0.11, 0.15, 0.11], [0.3, 0, 0.2]); }); break; }
    case 'fogueira': { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, GEO.cyl, dkw, [Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2], [0.07, 0.6, 0.07], [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]); } for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.m(g, GEO.dode, mat('#8a8490', { flat: true }), [Math.cos(a) * 0.55, 0.08, Math.sin(a) * 0.55], 0.12); } const fl = b.m(g, SHAPES.flame, mat('#ff8a1c', { glow: 2.4, emis: '#ff6a10' }), [0, 0.35, 0], 0.55); fl.castShadow = false; u.flame = fl; const pl = new THREE.PointLight('#ff9a3c', 4, 6); pl.position.set(0, 0.8, 0); g.add(pl); const cols = ['#e2403a', '#ffd34d', '#3f63e0', '#5fd27a']; for (const x of [-1.0, 1.0]) b.m(g, GEO.cyl, wood, [x, 0.9, 0], [0.04, 1.8, 0.04]); for (let i = 0; i < 9; i++) { const x = -0.9 + i * 0.225, y = 1.7 - Math.sin((i / 8) * Math.PI) * 0.3; b.m(g, GEO.cone, mat(cols[i % 4]), [x, y - 0.08, 0], [0.09, 0.16, 0.01], [Math.PI, 0, 0]).castShadow = false; } break; }
    case 'abobora_luz': { const pm = mat('#ff8a1c', { rough: 0.55 }); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, GEO.sph, pm, [Math.cos(a) * 0.14, 0.3, Math.sin(a) * 0.14], [0.26, 0.3, 0.26]); } b.m(g, GEO.cyl, mat('#4a7a2a'), [0, 0.62, 0], [0.05, 0.16, 0.05]); const em = mat('#ffe066', { glow: 2, emis: '#ffb020' }); for (const sx of [1, -1]) b.m(g, GEO.cone, em, [sx * 0.12, 0.36, 0.37], [0.06, 0.08, 0.03], [Math.PI / 2, 0, 0]).castShadow = false; b.m(g, GEO.box, em, [0, 0.22, 0.38], [0.2, 0.05, 0.03]).castShadow = false; const pl = new THREE.PointLight('#ffb020', 2.5, 4); pl.position.set(0, 0.4, 0.6); g.add(pl); break; }
  }
  return g;
}

// ---------- a época do ano no cenário ----------
function themeDecor(b, world, scene, tema, zonas, rnd, obstacles) {
  if (!tema) return null;
  const spots = []; const obs = obstacles();
  for (const k of zonas) { const [cx, cz] = zoneCenter(k); for (let i = 0; i < 3; i++) { const x = cx + (rnd() - 0.5) * 8.5, z = cz + (rnd() - 0.5) * 8.5; if (Math.hypot(x - SPAWN[0], z - SPAWN[1]) < 1.6) continue; if (obs.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + 0.7)) continue; spots.push([x, z]); } }
  const floaters = [];
  for (const [x, z] of spots) {
    const g = b.g(world, [x, 0, z], [0, rnd() * 6, 0]); const v = rnd();
    switch (tema) {
      case 'natal': if (v < 0.4) { for (let i = 0; i < 2; i++) b.m(g, GEO.cone, mat('#2f8a4a'), [0, 0.35 + i * 0.3, 0], [0.32 - i * 0.08, 0.45, 0.32 - i * 0.08]); b.m(g, SHAPES.star, mat('#ffd34d', { glow: 1.4 }), [0, 0.92, 0], 0.08).castShadow = false; } else if (v < 0.75) { const c = ['#e2403a', '#3f63e0', '#ffd34d', '#5fd27a'][Math.floor(rnd() * 4)]; b.m(g, GEO.box, mat(c), [0, 0.14, 0], [0.28, 0.28, 0.28]); b.m(g, GEO.box, mat('#ffffff'), [0, 0.14, 0], [0.3, 0.29, 0.06]); b.m(g, GEO.box, mat('#ffffff'), [0, 0.14, 0], [0.06, 0.29, 0.3]); } else { b.m(g, GEO.sph, mat('#ffffff', { rough: 0.9 }), [0, 0.25, 0], 0.25); b.m(g, GEO.sph, mat('#ffffff', { rough: 0.9 }), [0, 0.6, 0], 0.17); b.m(g, GEO.cone, mat('#ff8a1c'), [0, 0.6, 0.18], [0.03, 0.12, 0.03], [Math.PI / 2, 0, 0]); for (const sx of [1, -1]) b.m(g, GEO.sph, mat('#1a1a1a'), [sx * 0.06, 0.66, 0.14], 0.02); b.m(g, GEO.cone, mat('#e2403a'), [0, 0.82, 0], [0.12, 0.22, 0.12]); } break;
      case 'ferias': if (v < 0.35) { b.m(g, taperTube([V(0, 0, 0), V(0.15, 1, 0), V(0.3, 2, 0)], 0.08, 0.05), mat('#a07a4a', { kind: 'couro', seed: 3 })); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, SHAPES.leaf, mat('#3f9a4a'), [0.3, 2.0, 0], [0.9, 1.4, 0.9], [Math.PI / 2 - 0.5, a, 0]); } b.m(g, GEO.sph, mat('#6a4a2a'), [0.3, 1.9, 0.12], 0.1); } else if (v < 0.7) { const bb = b.m(g, GEO.sph, mat('#ffffff', { kind: 'pele', seed: 4 }), [0, 0.22, 0], 0.22); bb.material = mat('#ff4a4a', { rough: 0.3 }); b.m(g, GEO.ring, mat('#ffffff'), [0, 0.22, 0], [0.22, 0.22, 3]); b.m(g, GEO.ring, mat('#4fc3f7'), [0, 0.22, 0], [0.22, 0.22, 3], [0, Math.PI / 2, 0]); } else { b.m(g, SHAPES.star, mat('#ff8a5a', { rough: 0.7 }), [0, 0.04, 0], 0.18, [-Math.PI / 2, 0, 0]); } break;
      case 'carnaval': if (v < 0.5) { const c = ['#ff4fb0', '#ffd34d', '#4fc3f7', '#5fd27a', '#9a6aff'][Math.floor(rnd() * 5)]; const f = b.g(g); b.m(f, GEO.sph, mat(c, { rough: 0.25 }), [0, 1.3, 0], [0.22, 0.28, 0.22]); b.m(f, GEO.cyl, mat('#ffffff'), [0, 0.65, 0], [0.006, 1.3, 0.006]); floaters.push({ f, y: 0, p: rnd() * 6 }); } else { for (let i = 0; i < 8; i++) b.m(g, GEO.cyl, mat(['#ff4fb0', '#ffd34d', '#4fc3f7', '#5fd27a'][i % 4]), [(rnd() - 0.5) * 0.6, 0.01, (rnd() - 0.5) * 0.6], [0.05, 0.01, 0.05]).castShadow = false; b.m(g, GEO.sph, mat('#ff4fb0', { metal: 0.4, rough: 0.3 }), [0, 0.12, 0], [0.22, 0.1, 0.08]); } break;
      case 'pascoa': if (v < 0.55) { const c = ['#ff9fd2', '#9fe0ff', '#ffe066', '#b59cff', '#8ee07a'][Math.floor(rnd() * 5)]; b.m(g, GEO.sph, mat(c, { kind: 'pele', seed: Math.floor(rnd() * 9) }), [0, 0.16, 0], [0.12, 0.16, 0.12]); b.m(g, GEO.ring, mat('#ffffff'), [0, 0.16, 0], [0.125, 0.125, 2], [Math.PI / 2, 0, 0]); } else { b.m(g, GEO.sph, mat('#ffffff', { rough: 0.9 }), [0, 0.18, 0], [0.2, 0.18, 0.24]); b.m(g, GEO.sph, mat('#ffffff', { rough: 0.9 }), [0, 0.34, 0.16], 0.12); for (const sx of [1, -1]) b.m(g, GEO.sph, mat('#ffd6e8'), [sx * 0.05, 0.52, 0.12], [0.03, 0.12, 0.02], [0.2, 0, sx * 0.2]); b.m(g, GEO.sph, mat('#ffffff'), [0, 0.2, -0.24], 0.07); } break;
      case 'junina': if (v < 0.4) { for (let i = 0; i < 3; i++) b.m(g, GEO.cyl, mat('#e8c46a'), [(i - 1) * 0.1, 0.25, 0], [0.04, 0.5, 0.04], [0, 0, (i - 1) * 0.3]); b.m(g, GEO.cyl, mat('#ffd34d', { kind: 'pele', seed: 6 }), [0.1, 0.35, 0.15], [0.07, 0.3, 0.07], [0.4, 0, 0.3]); } else { const cols = ['#e2403a', '#ffd34d', '#3f63e0', '#5fd27a']; b.m(g, GEO.cyl, mat('#8a5a34'), [0, 1.0, 0], [0.04, 2.0, 0.04]); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, GEO.cone, mat(cols[i % 4]), [Math.cos(a) * 0.45, 1.55, Math.sin(a) * 0.45], [0.09, 0.16, 0.01], [Math.PI, -a, 0]).castShadow = false; b.m(g, GEO.cyl, mat('#ffffff'), [Math.cos(a) * 0.22, 1.75, Math.sin(a) * 0.22], [0.005, 0.5, 0.005], [Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2]); } } break;
      case 'halloween': if (v < 0.55) { const pm = mat('#ff8a1c', { rough: 0.55 }); const s = 0.6 + rnd() * 0.5; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, GEO.sph, pm, [Math.cos(a) * 0.1 * s, 0.2 * s, Math.sin(a) * 0.1 * s], [0.18 * s, 0.2 * s, 0.18 * s]); } b.m(g, GEO.cyl, mat('#4a7a2a'), [0, 0.42 * s, 0], [0.03, 0.1, 0.03]); const em = mat('#ffe066', { glow: 1.8, emis: '#ffb020' }); for (const sx of [1, -1]) b.m(g, GEO.cone, em, [sx * 0.08 * s, 0.24 * s, 0.26 * s], [0.04, 0.06, 0.02], [Math.PI / 2, 0, 0]).castShadow = false; b.m(g, GEO.box, em, [0, 0.14 * s, 0.27 * s], [0.12 * s, 0.03, 0.02]).castShadow = false; } else { const f = b.g(g); const gm = mat('#ffffff', { op: 0.85, rough: 0.8 }); b.m(f, GEO.sph, gm, [0, 1.2, 0], [0.25, 0.3, 0.25]); b.m(f, GEO.cone, gm, [0, 0.95, 0], [0.27, 0.35, 0.27], [Math.PI, 0, 0]); for (const sx of [1, -1]) b.m(f, GEO.sph, mat('#2a1a3a'), [sx * 0.08, 1.25, 0.22], [0.04, 0.06, 0.02]); b.m(f, GEO.sph, mat('#ff7ab8'), [0, 1.14, 0.23], [0.05, 0.03, 0.02]); floaters.push({ f, y: 0, p: rnd() * 6 }); } break;
    }
    const fl = floaters.length && floaters[floaters.length - 1].f.parent === g ? floaters[floaters.length - 1].f : null;
    if (fl) compact(fl, { shadow: false }); else compact(g, { shadow: true });
  }
  // partículas no ar
  const tex = sparkleTexture(); const parts = []; const n = 110;
  const cols = { natal: ['#ffffff', '#eaf6ff'], ferias: ['#fff3a0', '#ffffff'], carnaval: ['#ff4fb0', '#ffd34d', '#4fc3f7', '#5fd27a', '#9a6aff'], pascoa: ['#ffb3d9', '#ffffff', '#ffe066'], junina: ['#ffb347', '#ff6a10', '#ffe066'], halloween: ['#ff8a1c', '#b59cff', '#ffe066'] }[tema];
  const fall = { natal: -0.9, ferias: 0.25, carnaval: -1.2, pascoa: -0.5, junina: 1.1, halloween: 0.35 }[tema];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cols[i % cols.length], transparent: true, depthWrite: false, blending: tema === 'carnaval' || tema === 'pascoa' ? THREE.NormalBlending : THREE.AdditiveBlending })); s.userData = { x: (rnd() - 0.5) * 34, y: rnd() * 9, z: (rnd() - 0.5) * 34, p: rnd() * 6 }; s.scale.setScalar(tema === 'natal' ? 0.16 : 0.13); scene.add(s); parts.push(s); }
  return {
    update(t, dt, c) {
      for (const s of parts) { const u = s.userData; u.y += fall * dt; if (u.y < 0) u.y += 9; if (u.y > 9) u.y -= 9; s.position.set(c.x + u.x + Math.sin(t + u.p) * 0.4, u.y, c.z + u.z + Math.cos(t * 0.8 + u.p) * 0.4); if (tema === 'carnaval') s.material.rotation = t * 3 + u.p; }
      for (const f of floaters) f.f.position.y = Math.sin(t * 1.3 + f.p) * 0.15;
    },
  };
}
