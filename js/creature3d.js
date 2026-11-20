// Brilhinhos — gerador 3D dos companheiros (e dos moradores, ovos e itens).
// Tudo é montado por código: um corpo fofinho de olhos grandes, mais as peças
// do arquétipo (orelhas, cauda, casco...) e do elemento (folhinha, barbatana,
// juba de sol, asas, cristais, gema, lua, estrela). O estágio deixa maior e
// mais enfeitado. Estilo "desenho": material toon de 3 tons + contorno.
import * as THREE from './vendor/three.module.js';
import { SPECIES, FAMILIES, ELEMENTS } from './data.js';

// ---------- materiais ----------
const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const matCache = new Map();
export function toon(color, emissive = 0) {
  const k = `t${color}|${emissive}`;
  if (!matCache.has(k)) {
    const c = new THREE.Color(color);
    matCache.set(k, new THREE.MeshToonMaterial({ color: c, gradientMap: GRAD, emissive: c, emissiveIntensity: emissive }));
  }
  return matCache.get(k);
}
function outlineMat(color) {
  const k = `o${color}`;
  if (!matCache.has(k)) {
    const c = new THREE.Color(color); const hsl = {}; c.getHSL(hsl);
    c.setHSL(hsl.h, Math.min(1, hsl.s * 0.9 + 0.1), Math.max(0.12, hsl.l * 0.42));
    matCache.set(k, new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }));
  }
  return matCache.get(k);
}
function glassMat(color, opacity = 0.35) {
  const k = `g${color}|${opacity}`;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: GRAD, transparent: true, opacity, depthWrite: false, emissive: new THREE.Color(color), emissiveIntensity: 0.25 }));
  return matCache.get(k);
}
const SIL = new THREE.MeshBasicMaterial({ color: '#3d3766' });

// ---------- formas ----------
const G = {
  sph: new THREE.SphereGeometry(1, 30, 22),
  sphLo: new THREE.SphereGeometry(1, 14, 10),
  cone: new THREE.ConeGeometry(1, 1, 22),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
  oct: new THREE.OctahedronGeometry(1, 0),
  smile: new THREE.TorusGeometry(1, 0.2, 8, 20, Math.PI),
  ring: new THREE.TorusGeometry(1, 0.08, 10, 40),
  halfRing: new THREE.TorusGeometry(1, 0.22, 10, 30, Math.PI),
  crescent: new THREE.TorusGeometry(1, 0.3, 10, 24, Math.PI * 1.25),
};
function starGeo(points = 5, inner = 0.45) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const r = i % 2 ? inner : 1, a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3 });
  g.center(); return g;
}
G.star = starGeo();
function heartGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9); s.bezierCurveTo(-1.2, -0.1, -1.0, 1.0, 0, 0.45); s.bezierCurveTo(1.0, 1.0, 1.2, -0.1, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3 });
  g.center(); return g;
}
G.heart = heartGeo();

// ---------- utilidades ----------
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shade(hex, dh = 0, ds = 0, dl = 0) {
  const c = new THREE.Color(hex); const o = {}; c.getHSL(o);
  c.setHSL((o.h + dh + 1) % 1, THREE.MathUtils.clamp(o.s + ds, 0, 1), THREE.MathUtils.clamp(o.l + dl, 0, 1));
  return '#' + c.getHexString();
}
const RAINBOW = ['#ff7b9c', '#ffb36b', '#ffe36b', '#8ce07a', '#6fc8ff', '#b59cff'];
// cor principal de cada família dentro do elemento (na ordem em que aparecem)
const FAMILY_COLORS = {
  planta: ['#86d96c', '#56c98e', '#b4dc4f', '#6fbf7c', '#a4d47e', '#3fb98a'],
  agua:   ['#5ab8f6', '#45cfdf', '#6d95ff', '#7fd8f0', '#38a8d6', '#5b7ce8'],
  sol:    ['#ffa24a', '#ff7f5e', '#ffc248', '#ff8f73', '#ffb763', '#ff6a4a'],
  vento:  ['#9fd3ff', '#c4e6ff', '#b3c4ff', '#a3eefc', '#d4dcff', '#8bbcf0'],
  gelo:   ['#b4eef5', '#dcf6ff', '#a2dcff', '#c4fbef', '#bccdff', '#93e2e8'],
  pedra:  ['#b39a80', '#9d8bb5', '#c9a07a', '#8e9cab', '#a5b897', '#cf8f8f'],
  sonho:  ['#c6a6f2', '#a7a3f2', '#e3a7e6', '#b6aeff', '#d6b5ff', '#998de0'],
  luz:    ['#ffd95a', '#ffe98c', '#ffc25a', '#fff07a', '#ffd38f', '#ffe066'],
  arco:   ['#ff9ad5', '#ffb3e6'],
};
const PATTERNS = ['capuz', 'manchas', 'listras', 'pontas', 'mascara', 'liso'];

class Builder {
  constructor(sil) { this.sil = sil; }
  part(parent, geo, color, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], o = {}) {
    const mat = this.sil ? SIL : o.glass ? glassMat(color, o.glass) : toon(color, o.glow || 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...p); m.scale.set(...(Array.isArray(s) ? s : [s, s, s])); m.rotation.set(...r);
    if (o.outline && !this.sil && !o.glass) {
      const ol = new THREE.Mesh(geo, outlineMat(color)); ol.scale.setScalar(1 + (o.outline === true ? 0.07 : o.outline)); m.add(ol);
    }
    parent.add(m); return m;
  }
  group(parent, p = [0, 0, 0], r = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); parent.add(g); return g; }
  // a mesma peça dos dois lados (x espelhado)
  pair(parent, fn) { return [fn(1), fn(-1)]; }
}

// ponto na superfície de um elipsoide (para pôr olho, bochecha, enfeite)
function onSurf(R, sx, sy, sz, x, y, front = 1) {
  const u = x / (R * sx), v = y / (R * sy); const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
  return { p: [x, y, w * R * sz * front], ry: Math.atan2(u, w) * front, rx: -Math.atan2(v, w) };
}

// ---------- arquétipos ----------
const ARCH = {
  gato:      { ears: 'cat', tail: 'thin', whisk: true },
  coelho:    { ears: 'bunny', tail: 'puff' },
  raposa:    { ears: 'fox', tail: 'fluffy', snout: true },
  urso:      { ears: 'round', tail: 'puff', snout: true },
  rato:      { ears: 'mouse', tail: 'thin', whisk: true },
  passaro:   { ears: 'tuft', tail: 'feathers', beak: true, wings: true, birdFeet: true },
  peixe:     { ears: 'none', tail: 'fish', fins: true, float: true, noLegs: true },
  tartaruga: { ears: 'none', tail: 'tiny', shell: true },
  sapo:      { ears: 'none', tail: 'none', topEyes: true, wide: true },
  cervo:     { ears: 'deer', tail: 'puff', antlers: true },
  coruja:    { ears: 'tuft', tail: 'feathers', beak: true, wings: true, owl: true, birdFeet: true },
  foca:      { ears: 'none', tail: 'flipper', flippers: true, noLegs: true, whisk: true, wide: true },
  pinguim:   { ears: 'none', tail: 'tiny', beak: true, flippers: true, bigBelly: true, birdFeet: true },
  ourico:    { ears: 'round', tail: 'none', spikes: true, snout: true, smallEars: true },
  dragao:    { ears: 'none', tail: 'dragon', horns: true, wings: true, snout: true },
  carneiro:  { ears: 'floppy', tail: 'puff', wool: true },
  axolote:   { ears: 'none', tail: 'fish', gills: true, wide: true },
  panda:     { ears: 'round', tail: 'puff', panda: true },
  esquilo:   { ears: 'cat', tail: 'curl', smallEars: true },
};

const STAGE = [
  { scale: 0.82, headR: 0.8, headY: 1.02, bodyR: 0.52, bodySY: 0.95, bodyY: 0.42, eye: 1.15 },
  { scale: 1.0, headR: 0.74, headY: 1.34, bodyR: 0.6, bodySY: 1.12, bodyY: 0.56, eye: 1.0 },
  { scale: 1.16, headR: 0.72, headY: 1.62, bodyR: 0.68, bodySY: 1.3, bodyY: 0.7, eye: 0.92 },
];

// ---------- montagem ----------
// spec: { sp } espécie | { npc: {arch, cor, chapeu} }; opts: { silhouette, shiny }
export function buildCreature(spec, opts = {}) {
  const B = new Builder(!!opts.silhouette);
  let arch, el, stage, seed, rar, famId;
  if (spec.npc) { arch = spec.npc.arch; el = null; stage = 1; seed = 999; rar = 'comum'; }
  else { const s = SPECIES[spec.sp]; arch = s.arch; el = s.el; stage = s.stage; famId = s.fam; seed = s.fam * 7 + 3; rar = s.rar; }
  const A = ARCH[arch] || ARCH.gato; const st = STAGE[stage]; const rand = mulberry(seed);

  // cores
  let main, belly, acc;
  if (spec.npc) { main = spec.npc.cor; belly = shade(main, 0, -0.1, 0.12); acc = '#ff9fb8'; }
  else {
    [main, belly, acc] = ELEMENTS[el].cores;
    const fIdx = FAMILIES.filter((f) => f.el === el).findIndex((f) => f.id === famId);
    main = FAMILY_COLORS[el][fIdx] || main;
    if (arch === 'panda') { belly = '#ffffff'; }
    if (opts.shiny) { main = shade(main, 0.42, 0.1, 0.05); acc = shade(acc, 0.35, 0, 0); }
  }
  const dark = shade(main, 0, 0, -0.22);
  const pink = '#ff9fbd';
  const pattern = spec.npc ? 'liso' : PATTERNS[Math.floor(rand() * PATTERNS.length)];
  const second = spec.npc ? main : (rand() < 0.5 ? shade(acc, 0, -0.05, 0.02) : shade(main, 0.06, 0.05, -0.16));

  const root = new THREE.Group(); // fica no chão
  const body = B.group(root); // tudo que pula/respira
  const anim = { ears: [], tails: [], wings: [], eyes: [], spin: [], float: [] };
  const legs = stage === 2 && !A.noLegs ? 0.16 : 0;
  const lift = (A.float ? 0.35 : 0);
  body.position.y = lift;
  const torso = B.group(body, [0, legs, 0]);

  // corpo
  const bw = A.wide ? 1.12 : 1;
  B.part(torso, G.sph, main, [0, st.bodyY, 0], [st.bodyR * bw, st.bodyR * st.bodySY, st.bodyR * 0.92], [0, 0, 0], { outline: 0.06 });
  B.part(torso, G.sph, belly, [0, st.bodyY - 0.03, st.bodyR * 0.42], [st.bodyR * (A.bigBelly ? 0.82 : 0.62) * bw, st.bodyR * st.bodySY * (A.bigBelly ? 0.85 : 0.72), st.bodyR * 0.55]);

  // pés e braços
  if (!A.noLegs) {
    const fc = A.birdFeet ? '#ffa94d' : (arch === 'panda' ? '#3a3a48' : shade(main, 0, 0, -0.08));
    B.pair(body, (sx) => B.part(body, G.sph, fc, [sx * st.bodyR * 0.5, 0.11, st.bodyR * 0.45], [0.2, 0.12, 0.26], [0, 0, 0], { outline: 0.1 }));
    if (legs) B.pair(body, (sx) => B.part(body, G.cyl, A.birdFeet ? fc : main, [sx * st.bodyR * 0.5, 0.2, st.bodyR * 0.3], [0.11, 0.24, 0.11], [0, 0, 0], { outline: 0.1 }));
    if (stage >= 1 && !A.flippers && !A.wings) {
      B.pair(torso, (sx) => B.part(torso, G.sph, arch === 'panda' ? '#3a3a48' : main, [sx * st.bodyR * 0.98 * bw, st.bodyY + 0.05, st.bodyR * 0.2], [0.15, 0.26, 0.15], [0.2, 0, sx * 0.5], { outline: 0.1 }));
    }
  }
  if (A.flippers) B.pair(body, (sx) => { const f = B.part(torso, G.sph, dark, [sx * st.bodyR * 1.0 * bw, st.bodyY, 0.05], [0.12, 0.36, 0.22], [0, 0, sx * 0.7], { outline: 0.1 }); anim.wings.push({ m: f, sx, base: sx * 0.7, amp: 0.25 }); return f; });

  // cabeça
  const R = st.headR; const HS = [1, 0.92, 0.95];
  const head = B.group(torso, [0, st.headY, 0.02]);
  const hw = A.wide ? (arch === 'sapo' ? 1.2 : 1.08) : 1, hh = arch === 'sapo' ? 0.82 : 1;
  B.part(head, G.sph, main, [0, 0, 0], [R * HS[0] * hw, R * HS[1] * hh, R * HS[2]], [0, 0, 0], { outline: 0.06 });
  // padrão de pelagem da família
  if (!B.sil) switch (pattern) {
    case 'capuz': B.part(head, G.sph, second, [0, R * 0.12, -R * 0.06], [R * 1.02 * hw, R * 0.86 * hh, R * 0.94], [-0.35, 0, 0]); break;
    case 'manchas': for (let i = 0; i < 4 + stage * 2; i++) {
      const a = rand() * Math.PI * 2, b = rand() * 1.2 - 0.3;
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)); if (dir.z > 0.45) dir.z = -dir.z;
      const onHead = i % 2 === 1;
      const m = B.part(onHead ? head : torso, G.sph, second, onHead ? [dir.x * R * 0.97, dir.y * R * 0.9, dir.z * R * 0.93] : [dir.x * st.bodyR * 0.97, st.bodyY + dir.y * st.bodyR * st.bodySY * 0.9, dir.z * st.bodyR * 0.9], [0.11, 0.11, 0.035]);
      m.lookAt(m.position.clone().multiplyScalar(3));
    } break;
    case 'listras': for (let i = 0; i < 3; i++) {
      const yy = st.bodyY + st.bodyR * (0.45 - i * 0.35) * st.bodySY;
      B.part(torso, G.sph, second, [0, yy, -st.bodyR * 0.55], [st.bodyR * 0.75, 0.06, st.bodyR * 0.5], [0, 0, 0]);
      B.part(head, G.sph, second, [0, R * (0.75 - i * 0.12), -R * (0.35 + i * 0.22)], [R * (0.35 - i * 0.05), 0.04, R * 0.5], [-0.6 - i * 0.35, 0, 0]);
    } break;
    case 'mascara': B.part(head, G.sph, second, [0, R * 0.05, R * 0.5], [R * 0.72, R * 0.3, R * 0.42]); break;
  }
  anim.head = head;

  // rosto
  const eyeK = st.eye * (A.owl ? 1.25 : 1);
  const eyeY = A.topEyes ? R * 0.55 : R * 0.02;
  const eyeX = R * (A.topEyes ? 0.38 : 0.34);
  if (arch === 'panda') B.pair(head, (sx) => { const q = onSurf(R, 1, 0.92, 0.95, sx * eyeX, eyeY - 0.02); B.part(head, G.sph, '#3a3a48', q.p, [R * 0.27, R * 0.3, R * 0.12], [q.rx, q.ry, sx * -0.5]); });
  if (A.owl) B.pair(head, (sx) => { const q = onSurf(R, 1, 0.92, 0.95, sx * eyeX, eyeY); B.part(head, G.sph, belly, q.p, [R * 0.33, R * 0.33, R * 0.1], [q.rx, q.ry, 0]); });
  for (const sx of [1, -1]) {
    const q = onSurf(R, 1, 0.92, 0.95, sx * eyeX, eyeY);
    const eg = B.group(head, q.p, [q.rx, q.ry, 0]);
    if (A.topEyes) { eg.position.z -= R * 0.12; eg.position.y += R * 0.06; B.part(eg, G.sph, main, [0, 0, -0.03], [R * 0.3, R * 0.3, R * 0.28], [0, 0, 0], { outline: 0.08 }); }
    B.part(eg, G.sph, '#ffffff', [0, 0, 0], [R * 0.2 * eyeK, R * 0.24 * eyeK, R * 0.1]);
    B.part(eg, G.sph, '#2d2346', [0, -R * 0.02, R * 0.04], [R * 0.155 * eyeK, R * 0.2 * eyeK, R * 0.08]);
    if (!B.sil) {
      B.part(eg, G.sphLo, opts.shiny ? '#ffe46b' : '#ffffff', [R * 0.05 * eyeK, R * 0.08 * eyeK, R * 0.11], [R * 0.06 * eyeK, R * 0.07 * eyeK, R * 0.02], [0, 0, 0], { glow: 0.6 });
      B.part(eg, G.sphLo, '#ffffff', [-R * 0.05 * eyeK, -R * 0.08 * eyeK, R * 0.1], [R * 0.03, R * 0.03, R * 0.015], [0, 0, 0], { glow: 0.6 });
    }
    anim.eyes.push(eg);
  }
  // bochechas
  if (!B.sil) B.pair(head, (sx) => { const q = onSurf(R, 1, 0.92, 0.95, sx * R * 0.56, -R * 0.24); B.part(head, G.sph, pink, q.p, [R * 0.13, R * 0.08, R * 0.04], [q.rx, q.ry, 0]); });
  // focinho / bico / boca
  if (A.beak) {
    const q = onSurf(R, 1, 0.92, 0.95, 0, -R * 0.2);
    B.part(head, G.cone, '#ffa94d', [0, q.p[1], q.p[2] + R * 0.05], [R * 0.13, R * 0.24, R * 0.1], [Math.PI / 2, 0, 0], { outline: 0.1 });
  } else {
    let mouthY = -R * 0.3, mz = 0;
    if (A.snout) {
      const q = onSurf(R, 1, 0.92, 0.95, 0, -R * 0.25);
      B.part(head, G.sph, belly, [0, q.p[1], q.p[2] - R * 0.05], [R * 0.3, R * 0.2, R * 0.2]);
      B.part(head, G.sph, '#3b2d3f', [0, q.p[1] + R * 0.07, q.p[2] + R * 0.13], [R * 0.08, R * 0.06, R * 0.05]);
      mouthY = -R * 0.38; mz = R * 0.12;
    }
    const q = onSurf(R, 1, 0.92, 0.95, 0, mouthY);
    if (!B.sil) B.part(head, G.smile, '#4a2b3a', [0, q.p[1], q.p[2] + mz - R * 0.01], [R * (A.wide ? 0.13 : 0.08), R * 0.07, R * 0.05], [q.rx, 0, Math.PI]);
  }
  if (A.whisk && !B.sil) for (const sx of [1, -1]) for (const dy of [0.02, -0.06]) {
    const q = onSurf(R, 1, 0.92, 0.95, sx * R * 0.7, -R * 0.2 + dy * R);
    B.part(head, G.cyl, '#ffffff', q.p, [0.006, R * 0.32, 0.006], [0, 0, sx * (1.45 + dy * 3)]);
  }

  // orelhas
  const earC = arch === 'panda' ? '#3a3a48' : pattern === 'pontas' || pattern === 'capuz' ? second : main;
  const ears = A.smallEars ? 0.7 : 1;
  const earFn = {
    cat: (sx) => { const g = B.group(head, [sx * R * 0.46, R * 0.7, -R * 0.05], [0, 0, -sx * 0.32]); B.part(g, G.cone, earC, [0, R * 0.2 * ears, 0], [R * 0.24 * ears, R * 0.46 * ears, R * 0.16], [0, 0, 0], { outline: 0.08 }); B.part(g, G.cone, pink, [0, R * 0.18 * ears, R * 0.06], [R * 0.13 * ears, R * 0.3 * ears, R * 0.06]); return g; },
    fox: (sx) => { const g = B.group(head, [sx * R * 0.5, R * 0.66, -R * 0.08], [0, 0, -sx * 0.4]); B.part(g, G.cone, earC, [0, R * 0.32, 0], [R * 0.3, R * 0.7, R * 0.18], [0, 0, 0], { outline: 0.08 }); B.part(g, G.cone, belly, [0, R * 0.28, R * 0.08], [R * 0.18, R * 0.48, R * 0.06]); return g; },
    bunny: (sx) => { const g = B.group(head, [sx * R * 0.3, R * 0.75, -R * 0.08], [-0.15, 0, -sx * 0.18]); B.part(g, G.sph, earC, [0, R * 0.55, 0], [R * 0.17, R * 0.6, R * 0.12], [0, 0, 0], { outline: 0.08 }); B.part(g, G.sph, pink, [0, R * 0.55, R * 0.07], [R * 0.09, R * 0.45, R * 0.05]); return g; },
    round: (sx) => { const g = B.group(head, [sx * R * 0.62 * (A.smallEars ? 0.9 : 1), R * 0.66, -R * 0.1], [0, 0, -sx * 0.4]); B.part(g, G.sph, earC, [0, 0, 0], [R * 0.25 * ears, R * 0.25 * ears, R * 0.14], [0, 0, 0], { outline: 0.08 }); B.part(g, G.sph, arch === 'panda' ? '#5b5b6b' : pink, [0, 0, R * 0.06], [R * 0.14 * ears, R * 0.14 * ears, R * 0.06]); return g; },
    mouse: (sx) => { const g = B.group(head, [sx * R * 0.66, R * 0.58, -R * 0.12], [0, 0, -sx * 0.5]); B.part(g, G.sph, earC, [0, 0, 0], [R * 0.4, R * 0.4, R * 0.1], [0, 0, 0], { outline: 0.06 }); B.part(g, G.sph, pink, [0, 0, R * 0.05], [R * 0.26, R * 0.26, R * 0.05]); return g; },
    floppy: (sx) => { const g = B.group(head, [sx * R * 0.86, R * 0.22, -R * 0.05], [0, 0, -sx * 0.9]); B.part(g, G.sph, shade(belly, 0, 0, -0.08), [sx * R * 0.12, -R * 0.12, 0], [R * 0.32, R * 0.15, R * 0.18], [0, 0, 0], { outline: 0.08 }); return g; },
    deer: (sx) => { const g = B.group(head, [sx * R * 0.8, R * 0.42, -R * 0.1], [0, 0, -sx * 1.05]); B.part(g, G.sph, earC, [0, R * 0.2, 0], [R * 0.14, R * 0.3, R * 0.08], [0, 0, 0], { outline: 0.08 }); B.part(g, G.sph, pink, [0, R * 0.2, R * 0.05], [R * 0.08, R * 0.2, R * 0.04]); return g; },
    tuft: (sx) => { const g = B.group(head, [sx * R * 0.38, R * 0.8, -R * 0.1], [0, 0, -sx * 0.5]); B.part(g, G.cone, dark, [0, R * 0.15, 0], [R * 0.12, R * 0.36, R * 0.08], [0, 0, 0], { outline: 0.1 }); return g; },
  };
  if (earFn[A.ears]) for (const sx of [1, -1]) anim.ears.push({ g: earFn[A.ears](sx), sx });

  // cauda (no corpo, atrás)
  const tailG = B.group(torso, [0, st.bodyY - 0.05, -st.bodyR * 0.82]);
  const tailC = pattern === 'pontas' || pattern === 'listras' ? second : main;
  anim.tails.push(tailG);
  const tl = 1 + stage * 0.25;
  switch (A.tail) {
    case 'puff': B.part(tailG, G.sph, belly, [0, 0, -0.06], 0.18 * tl, [0, 0, 0], { outline: 0.08 }); break;
    case 'tiny': B.part(tailG, G.sph, dark, [0, -0.1, 0], [0.1, 0.08, 0.14]); break;
    case 'thin': {
      const pts = [[0, 0, 0], [0, 0.15, -0.25], [0, 0.45, -0.38], [0, 0.72, -0.28]].map((p) => new THREE.Vector3(p[0], p[1] * tl, p[2] * tl));
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.06, 8);
      B.part(tailG, g, tailC, [0, 0, 0], 1, [0, 0, 0], { outline: 0.25 });
      B.part(tailG, G.sph, el ? acc : belly, [pts[3].x, pts[3].y, pts[3].z], 0.1, [0, 0, 0], { outline: 0.1 });
      break; }
    case 'fluffy': {
      B.part(tailG, G.sph, tailC, [0, 0.28 * tl, -0.25 * tl], [0.3 * tl, 0.5 * tl, 0.3 * tl], [-0.7, 0, 0], { outline: 0.06 });
      B.part(tailG, G.sph, belly, [0, 0.62 * tl, -0.48 * tl], [0.2 * tl, 0.24 * tl, 0.2 * tl], [-0.7, 0, 0]);
      if (spec.sp !== undefined && SPECIES[spec.sp].rar === 'mitico') {
        for (const sx of [1, -1]) { B.part(tailG, G.sph, RAINBOW[sx > 0 ? 4 : 0], [sx * 0.32, 0.24 * tl, -0.2 * tl], [0.22 * tl, 0.42 * tl, 0.22 * tl], [-0.6, 0, sx * 0.6], { outline: 0.06 }); }
      }
      break; }
    case 'curl': {
      for (let i = 0; i < 7; i++) {
        const a = i / 6; const rr = (0.2 + 0.12 * Math.sin(a * Math.PI)) * tl;
        B.part(tailG, G.sph, i % 2 ? main : tailC, [0, (0.1 + a * 1.0) * tl, (-0.1 - Math.sin(a * 2.4) * 0.45) * tl], rr, [0, 0, 0], { outline: 0.06 });
      }
      break; }
    case 'fish': {
      B.part(tailG, G.sph, acc, [0.14, 0.05, -0.18], [0.04, 0.28 * tl, 0.22 * tl], [0.5, 0.25, 0], { outline: 0.1 });
      B.part(tailG, G.sph, acc, [-0.14, 0.05, -0.18], [0.04, 0.28 * tl, 0.22 * tl], [0.5, -0.25, 0], { outline: 0.1 });
      break; }
    case 'flipper': B.pair(tailG, (sx) => B.part(tailG, G.sph, dark, [sx * 0.12, -0.25, -0.1], [0.16, 0.06, 0.24], [0, sx * 0.4, 0], { outline: 0.1 })); break;
    case 'feathers': for (const a of [-0.45, 0, 0.45]) B.part(tailG, G.sph, a ? main : acc, [Math.sin(a) * 0.12, 0.12, -0.18], [0.1, 0.04, 0.3 * tl], [0.5, a, 0], { outline: 0.12 }); break;
    case 'dragon': {
      for (let i = 0; i < 5; i++) { const k = i / 4; B.part(tailG, G.sph, main, [0, -0.2 + k * 0.35, -0.1 - k * 0.55 * tl], (0.2 - k * 0.1) * tl, [0, 0, 0], { outline: 0.08 }); }
      B.part(tailG, G.cone, acc, [0, 0.2, -0.72 * tl], [0.15, 0.3, 0.06], [-0.9, 0, 0], { outline: 0.1 });
      break; }
  }

  // peças especiais do arquétipo
  if (A.shell) {
    const sc = el === 'pedra' ? shade(acc, 0, -0.2, 0.05) : el ? shade(ELEMENTS[el].cores[2], 0, -0.1, -0.05) : '#8bc06a';
    B.part(torso, G.sph, sc, [0, st.bodyY + 0.08, -st.bodyR * 0.25], [st.bodyR * 1.05, st.bodyR * st.bodySY * 0.95, st.bodyR * 0.9], [0, 0, 0], { outline: 0.05 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B.part(torso, G.sph, shade(sc, 0, 0, 0.12), [Math.cos(a) * st.bodyR * 0.62, st.bodyY + 0.12 + Math.sin(a) * st.bodyR * 0.55, -st.bodyR * 0.95], [0.12, 0.12, 0.05]); }
  }
  if (A.spikes) {
    const spc = el === 'planta' ? '#4e9c45' : el === 'pedra' ? acc : dark;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, ring = i % 2 ? 0.55 : 0.85;
      const dir = new THREE.Vector3(Math.cos(a) * ring, Math.sin(a) * ring * 0.9 + 0.2, -0.75).normalize();
      const m = B.part(torso, el === 'pedra' ? G.oct : G.cone, spc, [dir.x * st.bodyR, st.bodyY + dir.y * st.bodyR * st.bodySY, dir.z * st.bodyR], el === 'pedra' ? [0.08, 0.16, 0.08] : [0.08, 0.28, 0.08], [0, 0, 0], { outline: 0.15 });
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
  }
  if (arch === 'dragao') { // crista nas costas e barriga em gomos: cara de dragãozinho
    for (let i = 0; i < 4 + stage; i++) {
      const k = i / (3 + stage), a = -0.2 + k * 1.6;
      const yy = st.bodyY + Math.cos(a) * st.bodyR * st.bodySY * 0.95, zz = -Math.sin(a) * st.bodyR * 0.9;
      B.part(torso, G.cone, acc, [0, yy, zz], [0.07, 0.18, 0.07], [-a, 0, 0], { outline: 0.15 });
    }
    for (let i = 0; i < 3; i++) B.part(torso, G.sph, shade(belly, 0, 0, -0.06), [0, st.bodyY + st.bodyR * (0.35 - i * 0.3) * st.bodySY, st.bodyR * 0.82], [st.bodyR * (0.48 - i * 0.06), 0.035, 0.08]);
    B.part(head, G.cone, acc, [0, R * 0.95, -R * 0.4], [R * 0.08, R * 0.22, R * 0.08], [-0.6, 0, 0], { outline: 0.15 });
  }
  if (arch === 'ourico') for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.12 + i * 0.127);
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9 + 0.1, -0.7).normalize();
    const m = B.part(head, el === 'pedra' ? G.oct : G.cone, el === 'planta' ? '#4e9c45' : el === 'pedra' ? acc : dark, [dir.x * R * 0.85, dir.y * R * 0.85, dir.z * R * 0.85], [R * 0.11, R * 0.4, R * 0.11], [0, 0, 0], { outline: 0.15 });
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }
  if (arch === 'raposa' || arch === 'gato') B.pair(head, (sx) => B.part(head, G.cone, belly, [sx * R * 0.9, -R * 0.25, 0], [R * 0.14, R * 0.3, R * 0.12], [0, 0, sx * 1.9], { outline: 0.1 }));
  if (A.wool) {
    const wc = el === 'sol' ? '#fff3c4' : el === 'sonho' ? '#f3e8ff' : '#ffffff';
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; B.part(torso, G.sph, wc, [Math.cos(a) * st.bodyR * 0.85, st.bodyY + Math.sin(a) * st.bodyR * 0.8 * st.bodySY, -0.05], 0.24 * st.bodyR / 0.6, [0, 0, 0], { outline: 0.06 }); }
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.15 + i * 0.175); B.part(head, G.sph, wc, [Math.cos(a) * R * 0.62, R * 0.55 + Math.sin(a) * R * 0.22, -R * 0.12], R * 0.26, [0, 0, 0], { outline: 0.06 }); }
  }
  if (A.gills) for (const sx of [1, -1]) for (let i = 0; i < 3; i++) {
    const a = -0.5 + i * 0.5;
    B.part(head, G.sph, acc === '#ffd36b' ? '#ff9fc4' : acc, [sx * R * 0.92, R * (0.15 + i * 0.18), -R * 0.1], [R * 0.08, R * 0.26, R * 0.08], [0, 0, -sx * (1.0 + a)], { outline: 0.12 });
  }
  if (A.fins) {
    B.pair(head, (sx) => B.part(head, G.sph, acc, [sx * R * 0.95, -R * 0.1, -R * 0.1], [R * 0.06, R * 0.24, R * 0.3], [0, sx * 0.4, 0], { outline: 0.1 }));
    B.part(head, G.sph, acc, [0, R * 0.95, -R * 0.15], [R * 0.06, R * 0.32, R * 0.4], [0.3, 0, 0], { outline: 0.1 });
  }
  if (A.horns) B.pair(head, (sx) => B.part(head, el === 'gelo' || el === 'pedra' ? G.oct : G.cone, el === 'gelo' ? '#dffaff' : el === 'pedra' ? acc : '#fff2c4', [sx * R * 0.35, R * 0.85, -R * 0.15], el === 'gelo' || el === 'pedra' ? [R * 0.1, R * 0.28, R * 0.1] : [R * 0.11, R * 0.34, R * 0.11], [-0.3, 0, -sx * 0.35], { outline: 0.12 }));
  if (A.antlers) {
    const ac = el === 'planta' ? '#8b6a4a' : el === 'gelo' ? '#e0fbff' : el === 'pedra' ? acc : el === 'luz' ? '#fff1a8' : el === 'arco' ? '#ffffff' : '#c9a27a';
    const glow = el === 'luz' || el === 'arco' ? 0.4 : 0;
    if (el === 'arco') { // chifre de unicórnio
      const q = onSurf(R, 1, 0.92, 0.95, 0, R * 0.62);
      B.part(head, G.cone, '#fff6c9', [0, q.p[1] + R * 0.25, q.p[2] * 0.6], [R * 0.13, R * 0.6, R * 0.13], [0.3, 0, 0], { outline: 0.1, glow: 0.3 });
    } else for (const sx of [1, -1]) {
      const g = B.group(head, [sx * R * 0.32, R * 0.78, -R * 0.08], [0, 0, -sx * 0.3]);
      const crystal = el === 'gelo' || el === 'pedra';
      B.part(g, crystal ? G.oct : G.cyl, ac, [0, R * 0.25, 0], crystal ? [R * 0.09, R * 0.3, R * 0.09] : [R * 0.045, R * 0.5, R * 0.045], [0, 0, 0], { outline: 0.15, glow });
      if (stage >= 1) B.part(g, crystal ? G.oct : G.cyl, ac, [sx * R * 0.12, R * 0.35, 0], crystal ? [R * 0.06, R * 0.2, R * 0.06] : [R * 0.035, R * 0.28, R * 0.035], [0, 0, -sx * 0.8], { outline: 0.15, glow });
      if (el === 'planta') B.part(g, G.sph, '#7ed46a', [0, R * 0.5, 0], [R * 0.12, R * 0.06, R * 0.08], [0, 0, 0.4], { outline: 0.1 });
    }
  }
  const hasWings = A.wings || el === 'vento' || el === 'sonho' && stage >= 1;
  if (hasWings) {
    const sonhoW = el === 'sonho' && !A.wings;
    const wc = sonhoW ? '#ffd1ec' : el === 'vento' ? '#ffffff' : A.owl || arch === 'passaro' ? dark : shade(acc, 0, -0.1, 0.05);
    const ws = (el === 'vento' ? 1.25 : 1) * (0.75 + stage * 0.2);
    for (const sx of [1, -1]) {
      const g = B.group(torso, [sx * st.bodyR * 0.55, st.bodyY + st.bodyR * 0.35, -st.bodyR * 0.45], [0, -sx * 0.5, 0]);
      if (sonhoW) {
        B.part(g, G.sph, wc, [sx * 0.28 * ws, 0.12 * ws, 0], [0.32 * ws, 0.24 * ws, 0.03], [0, 0, sx * 0.3], { glass: 0.65 });
        B.part(g, G.sph, '#c6a6f2', [sx * 0.22 * ws, -0.15 * ws, 0], [0.2 * ws, 0.16 * ws, 0.03], [0, 0, -sx * 0.3], { glass: 0.65 });
      } else {
        B.part(g, G.sph, wc, [sx * 0.28 * ws, 0.08, 0], [0.34 * ws, 0.16 * ws, 0.07], [0, 0, sx * 0.35], { outline: 0.1 });
        B.part(g, G.sph, wc, [sx * 0.2 * ws, -0.06, 0.01], [0.26 * ws, 0.12 * ws, 0.06], [0, 0, sx * 0.05], { outline: 0.1 });
      }
      anim.wings.push({ m: g, sx, base: g.rotation.z, amp: 0.35, axis: 'y', baseY: g.rotation.y });
    }
  }

  // ---------- enfeites do elemento ----------
  const top = (y = 0) => [0, R * 0.92 + y, -R * 0.02];
  if (!spec.npc) switch (el) {
    case 'planta': {
      const g = B.group(head, top(), [0, 0, 0.1]);
      B.part(g, G.cyl, '#5aa84a', [0, R * 0.12, 0], [0.025, R * 0.25, 0.025]);
      for (const sx of [1, -1]) B.part(g, G.sph, sx > 0 ? '#8ee07a' : '#6cc95a', [sx * R * 0.17, R * 0.25, 0], [R * 0.2, R * 0.07, R * 0.12], [0, 0, sx * 0.5], { outline: 0.12 });
      anim.spin.push({ g, wob: true });
      if (stage >= 1) flower(B, head, [R * 0.5, R * 0.62, R * 0.25], R * 0.2, acc);
      if (stage >= 2) for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + i * 0.133); B.part(head, G.sph, i % 2 ? '#8ee07a' : '#6cc95a', [Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.55 + R * 0.25, -R * 0.35], [R * 0.2, R * 0.08, R * 0.12], [0.3, 0, a - Math.PI / 2], { outline: 0.1 }); }
      break; }
    case 'agua': {
      B.part(head, G.sph, acc === '#ffd36b' ? '#8fd8ff' : acc, top(-R * 0.05), [R * 0.07, R * 0.3, R * 0.35], [-0.2, 0, 0], { outline: 0.1 });
      const q = onSurf(R, 1, 0.92, 0.95, 0, R * 0.42);
      B.part(head, G.sph, '#bfeaff', q.p, [R * 0.08, R * 0.11, R * 0.05], [q.rx, 0, 0], { glow: 0.3 });
      if (stage >= 1 && !A.fins && !A.gills) B.pair(head, (sx) => B.part(head, G.sph, '#8fd8ff', [sx * R * 0.95, -R * 0.05, -R * 0.12], [R * 0.05, R * 0.2, R * 0.28], [0, sx * 0.5, 0], { outline: 0.1 }));
      if (stage >= 2) orbit(B, torso, anim, 4, st.bodyY + 0.2, 0.95, (g, i) => B.part(g, G.sph, '#d4f2ff', [0, 0, 0], 0.07 + (i % 2) * 0.03, [0, 0, 0], { glass: 0.55 }));
      break; }
    case 'sol': {
      const n = stage === 0 ? 1 : stage === 1 ? 8 : 12;
      if (n === 1) {
        const g = B.group(head, top(-R * 0.02));
        B.part(g, G.sph, '#ffcf4a', [0, R * 0.12, 0], [R * 0.16, R * 0.16, R * 0.16], [0, 0, 0], { outline: 0.1, glow: 0.2 });
        B.part(g, G.cone, '#ffb13b', [0, R * 0.32, 0], [R * 0.13, R * 0.3, R * 0.13], [0, 0, 0], { outline: 0.1, glow: 0.2 });
        anim.spin.push({ g, wob: true });
      } else {
        const g = B.group(head, [0, R * 0.1, -R * 0.45]);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          B.part(g, G.cone, i % 2 ? '#ffcf4a' : '#ffa53b', [Math.cos(a) * R * 1.0, Math.sin(a) * R * 1.0, 0], [R * 0.16, R * (stage === 2 ? 0.42 : 0.32), R * 0.08], [0, 0, a - Math.PI / 2], { outline: 0.1, glow: 0.25 });
        }
        anim.spin.push({ g, speed: 0.25, axis: 'z' });
      }
      break; }
    case 'vento': {
      B.pair(head, (sx) => B.part(head, G.sph, '#ffffff', [sx * R * 0.55, R * 0.72, -R * 0.2], [R * 0.2, R * 0.13, R * 0.14], [0, 0, sx * 0.3], { outline: 0.1 }));
      if (stage >= 2) { const r = B.part(torso, G.ring, '#dff2ff', [0, st.bodyY, 0], [0.95, 0.95, 0.95], [Math.PI / 2.3, 0, 0], { glass: 0.7 }); anim.spin.push({ g: r, speed: 0.8, axis: 'z' }); }
      break; }
    case 'gelo': {
      const cr = (p, s, rz) => B.part(head, G.oct, '#dffaff', p, s, [0, 0, rz], { outline: 0.12, glow: 0.2 });
      if (!A.horns && !A.antlers) cr(top(R * 0.08), [R * 0.12, R * 0.3, R * 0.12], 0);
      if (stage >= 1) for (const sx of [1, -1]) cr([sx * R * 0.4, R * 0.8, -R * 0.1], [R * 0.08, R * 0.22, R * 0.08], -sx * 0.4);
      if (!B.sil) B.pair(head, (sx) => { const q = onSurf(R, 1, 0.92, 0.95, sx * R * 0.6, -R * 0.02); B.part(head, G.star, '#ffffff', q.p, R * 0.06, [q.rx, q.ry, 0], { glow: 0.5 }); });
      if (stage >= 2) orbit(B, torso, anim, 5, st.headY + 0.1, 1.0, (g) => B.part(g, G.oct, '#e6fcff', [0, 0, 0], [0.06, 0.12, 0.06], [0, 0, 0], { glow: 0.4 }));
      break; }
    case 'pedra': {
      const q = onSurf(R, 1, 0.92, 0.95, 0, R * 0.42);
      B.part(head, G.oct, acc, q.p, [R * 0.12, R * 0.15, R * 0.08], [q.rx, 0, 0], { outline: 0.12, glow: 0.25 });
      if (stage >= 1 && !A.spikes && !A.shell) for (let i = 0; i < 3; i++) B.part(torso, G.oct, shade(main, 0, 0, -0.1), [(i - 1) * 0.22, st.bodyY + st.bodyR * 0.5, -st.bodyR * 0.75], [0.1, 0.18, 0.1], [0.5, 0, (i - 1) * 0.3], { outline: 0.12 });
      if (stage >= 2) for (let i = 0; i < 3; i++) B.part(head, G.oct, i === 1 ? acc : '#7be0c8', [(i - 1) * R * 0.28, R * 0.95 + (i === 1 ? R * 0.1 : 0), -R * 0.05], [R * 0.1, R * 0.24, R * 0.1], [0, 0, (i - 1) * -0.3], { outline: 0.12, glow: 0.3 });
      break; }
    case 'sonho': {
      const q = onSurf(R, 1, 0.92, 0.95, 0, R * 0.45);
      B.part(head, G.crescent, '#fff3b0', q.p, [R * 0.12, R * 0.12, R * 0.12], [q.rx, 0, 0.6], { glow: 0.5 });
      if (stage >= 2) orbit(B, torso, anim, 3, st.headY + 0.3, 0.9, (g) => B.part(g, G.star, '#fff3b0', [0, 0, 0], 0.08, [0, 0, 0], { glow: 0.6 }));
      break; }
    case 'luz': {
      const g = B.group(head, top(R * 0.05));
      B.part(g, G.cyl, '#ffe9a8', [0, R * 0.12, 0], [0.02, R * 0.25, 0.02]);
      B.part(g, G.star, '#ffe066', [0, R * 0.34, 0], R * 0.17, [0, 0, 0], { outline: 0.12, glow: 0.6 });
      anim.spin.push({ g: g.children[1], speed: 1.2, axis: 'y' });
      if (stage >= 1) { const h = B.part(head, G.ring, '#fff3a6', [0, R * 1.15, -R * 0.1], [R * 0.45, R * 0.45, R * 0.45], [Math.PI / 2, 0, 0], { glow: 0.8 }); anim.spin.push({ g: h, speed: 0.5, axis: 'z' }); }
      if (stage >= 2) orbit(B, torso, anim, 4, st.bodyY + 0.3, 1.0, (gg) => B.part(gg, G.star, '#ffe066', [0, 0, 0], 0.08, [0, 0, 0], { glow: 0.7 }));
      break; }
    case 'arco': {
      const g = B.group(head, [0, R * 0.1, -R * 0.5]);
      const n = 3 + stage;
      for (let i = 0; i < n; i++) B.part(g, G.halfRing, RAINBOW[i % 6], [0, 0, -i * 0.02], R * (0.95 + i * 0.13), [0, 0, 0], { glow: 0.25 });
      if (SPECIES[spec.sp].rar === 'mitico') orbit(B, torso, anim, 6, st.headY, 1.1, (gg, i) => B.part(gg, G.star, RAINBOW[i], [0, 0, 0], 0.07, [0, 0, 0], { glow: 0.7 }));
      break; }
  }
  // Adulto ganha uma "capinha" de brilho por raridade alta
  if (!spec.npc && stage === 2 && ['epico', 'lendario', 'mitico'].includes(rar) && !B.sil) {
    const ring = B.part(root, G.ring, rar === 'epico' ? '#ff9fd8' : '#ffd84a', [0, 0.04, 0], [1.1, 1.1, 1.1], [Math.PI / 2, 0, 0], { glow: 0.9 });
    anim.spin.push({ g: ring, speed: 0.6, axis: 'z' });
  }
  // chapéu dos moradores
  if (spec.npc) hat(B, head, R, spec.npc.chapeu);

  // sombra
  if (!B.sil) {
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.16, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; sh.userData.base = st.bodyR * 1.15 * (A.wide ? 1.15 : 1); sh.scale.setScalar(sh.userData.base); root.add(sh); anim.shadow = sh;
  }
  // brilho do cintilante
  if (opts.shiny && !B.sil) orbit(B, root, anim, 5, 1.2 * st.scale, 1.05, (g) => B.part(g, G.star, '#fff6a8', [0, 0, 0], 0.06, [0, 0, 0], { glow: 0.9 }), 1.6);

  root.scale.setScalar(st.scale);
  const height = (st.headY + R * 1.2 + lift + legs) * st.scale;
  const ctrl = makeController(root, body, anim, A, height);
  root.userData = { ctrl, height, sp: spec.sp, stage };
  return root;
}

function flower(B, parent, p, s, color) {
  const g = B.group(parent, p, [0.3, 0, 0]);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; B.part(g, G.sph, color, [Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, 0], [s * 0.45, s * 0.45, s * 0.2], [0, 0, 0], { outline: 0.12 }); }
  B.part(g, G.sph, '#ffe36b', [0, 0, s * 0.1], s * 0.3);
  return g;
}
function orbit(B, parent, anim, n, y, radius, fn, speed = 0.8) {
  const g = B.group(parent, [0, y, 0]);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const c = B.group(g, [Math.cos(a) * radius, Math.sin(i * 2.1) * 0.12, Math.sin(a) * radius]); fn(c, i); }
  anim.spin.push({ g, speed, axis: 'y' });
}
function hat(B, head, R, kind) {
  const t = R * 0.88;
  switch (kind) {
    case 'palha': B.part(head, G.cyl, '#f3d27a', [0, t, -0.02], [R * 1.05, 0.04, R * 1.05], [-0.1, 0, 0], { outline: 0.05 }); B.part(head, G.cyl, '#f3d27a', [0, t + 0.12, -0.04], [R * 0.55, 0.22, R * 0.55], [-0.1, 0, 0], { outline: 0.05 }); B.part(head, G.cyl, '#ff8fa8', [0, t + 0.05, -0.03], [R * 0.57, 0.06, R * 0.57], [-0.1, 0, 0]); flower(B, head, [R * 0.5, t + 0.08, R * 0.25], R * 0.13, '#ff8fa8'); break;
    case 'marinheiro': B.part(head, G.cyl, '#ffffff', [0, t + 0.04, 0], [R * 0.62, 0.16, R * 0.62], [-0.15, 0, 0], { outline: 0.06 }); B.part(head, G.cyl, '#3b6fd1', [0, t, 0], [R * 0.64, 0.05, R * 0.64], [-0.15, 0, 0]); B.part(head, G.cyl, '#2b3550', [0, t - 0.02, R * 0.4], [R * 0.4, 0.03, R * 0.25], [0.2, 0, 0]); break;
    case 'bone': B.part(head, G.sph, '#ff6f6f', [0, t - 0.02, 0], [R * 0.7, R * 0.4, R * 0.7], [0, 0, 0], { outline: 0.06 }); B.part(head, G.cyl, '#ff6f6f', [0, t - 0.08, R * 0.6], [R * 0.4, 0.03, R * 0.3], [0.15, 0, 0], { outline: 0.1 }); break;
    case 'touca': case 'gorro': {
      const c = kind === 'gorro' ? '#ff7b9c' : '#7ec8ff';
      B.part(head, G.sph, c, [0, t - 0.04, -0.03], [R * 0.78, R * 0.5, R * 0.78], [0, 0, 0], { outline: 0.06 });
      B.part(head, G.cyl, '#ffffff', [0, t - 0.2, -0.02], [R * 0.8, 0.08, R * 0.8]);
      B.part(head, G.sph, '#ffffff', [0, t + R * 0.42, -0.05], R * 0.16, [0, 0, 0], { outline: 0.1 }); break; }
    case 'capacete': B.part(head, G.sph, '#ffd23f', [0, t - 0.05, 0], [R * 0.8, R * 0.5, R * 0.8], [0, 0, 0], { outline: 0.06 }); B.part(head, G.cyl, '#fff6c2', [0, t + 0.02, R * 0.7], [0.08, 0.05, 0.08], [Math.PI / 2, 0, 0], { glow: 0.9 }); break;
    case 'dormir': B.part(head, G.cone, '#9fb4ff', [0, t + 0.2, -0.12], [R * 0.62, R * 0.9, R * 0.62], [-0.5, 0, 0.3], { outline: 0.06 }); B.part(head, G.sph, '#ffffff', [R * 0.32, t + 0.48, -0.55], R * 0.16, [0, 0, 0], { outline: 0.1 }); break;
    case 'estrela': B.part(head, G.star, '#ffe066', [0, t + 0.2, 0], R * 0.32, [0, 0, 0], { outline: 0.1, glow: 0.6 }); break;
  }
}

// ---------- animação ----------
function makeController(root, body, anim, A, height) {
  const ph = Math.random() * 10;
  let blinkT = 1 + Math.random() * 3, jumpT = -1, happyT = -1, walking = 0;
  return {
    height,
    jump() { jumpT = 0; },
    happy() { happyT = 0; },
    setWalking(v) { walking = v; },
    update(t, dt) {
      const tt = t + ph;
      const f = walking ? 9 : 2.2;
      let y = (A.float ? Math.sin(tt * 1.6) * 0.08 + 0.35 : 0) + Math.abs(Math.sin(tt * f * 0.5)) * (walking ? 0.12 : 0) ;
      let sq = 1 + Math.sin(tt * f) * (walking ? 0.03 : 0.025);
      if (jumpT >= 0) { jumpT += dt; const k = jumpT / 0.6; if (k >= 1) jumpT = -1; else { y += Math.sin(k * Math.PI) * 0.7; sq *= 1 + Math.sin(k * Math.PI * 2) * 0.08; } }
      let spin = 0;
      if (happyT >= 0) { happyT += dt; const k = happyT / 1.1; if (k >= 1) happyT = -1; else { y += Math.abs(Math.sin(k * Math.PI * 2)) * 0.45; spin = k * Math.PI * 2; } }
      body.position.y = y; body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); body.rotation.y = spin;
      if (anim.shadow) anim.shadow.scale.setScalar((1 - Math.min(0.5, y * 0.6)) * anim.shadow.userData.base);
      if (anim.head) { anim.head.rotation.z = Math.sin(tt * 1.3) * 0.06; anim.head.rotation.x = Math.sin(tt * 0.9) * 0.04; }
      blinkT -= dt; let eyeS = 1;
      if (blinkT < 0.12) eyeS = Math.max(0.1, Math.abs(blinkT - 0.06) / 0.06);
      if (blinkT < 0) blinkT = 2 + Math.random() * 3.5;
      for (const e of anim.eyes) e.scale.y = eyeS;
      for (const e of anim.ears) e.g.rotation.x = Math.sin(tt * 2.5 + e.sx) * 0.08;
      for (const g of anim.tails) g.rotation.y = Math.sin(tt * (walking ? 6 : 3)) * 0.35;
      for (const w of anim.wings) {
        const fl = Math.sin(tt * (walking ? 14 : 5)) * w.amp;
        if (w.axis === 'y') w.m.rotation.y = w.baseY + fl * w.sx; else w.m.rotation.z = w.base + fl * w.sx;
      }
      for (const s of anim.spin) {
        if (s.wob) s.g.rotation.z = Math.sin(tt * 2) * 0.15;
        else s.g.rotation[s.axis] += dt * s.speed;
      }
    },
  };
}

// ---------- ovo ----------
export function buildEgg(el, rar) {
  const B = new Builder(false); const root = new THREE.Group(); const g = B.group(root);
  const cores = el ? ELEMENTS[el].cores : ['#ffffff', '#ffffff', '#ff9ad5'];
  const base = rar === 'mitico' || el === 'arco' ? '#fff4fb' : shade(cores[1], 0, 0.1, -0.03);
  B.part(g, G.sph, base, [0, 0.75, 0], [0.55, 0.75, 0.55], [0, 0, 0], { outline: 0.05 });
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, yy = 0.45 + (i % 3) * 0.28;
    const dir = new THREE.Vector3(Math.cos(a) * 0.55, (yy - 0.75) / 0.75 * 0.75, Math.sin(a) * 0.55);
    const m = B.part(g, G.sph, el === 'arco' || rar === 'mitico' ? RAINBOW[i % 6] : i % 2 ? cores[0] : cores[2], [Math.cos(a) * 0.5, yy, Math.sin(a) * 0.5], [0.13, 0.13, 0.04]);
    m.lookAt(m.position.clone().multiplyScalar(2).setY(yy));
  }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.15, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; root.add(sh);
  root.userData.shell = g;
  return root;
}

// ---------- item como figurinha flutuante (emoji num disco) ----------
const spriteCache = new Map();
export function itemTexture(emoji, ring = '#ffffff') {
  const k = emoji + ring;
  if (spriteCache.has(k)) return spriteCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.lineWidth = 8; x.strokeStyle = ring; x.stroke();
  x.font = '72px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; spriteCache.set(k, t); return t;
}
export function itemSprite(emoji, size = 0.6, ring) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemTexture(emoji, ring), depthTest: true }));
  s.scale.setScalar(size); return s;
}
export function sparkleTexture() {
  if (spriteCache.has('spark')) return spriteCache.get('spark');
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,250,210,0.9)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'white'; x.beginPath(); x.moveTo(32, 2); x.lineTo(36, 28); x.lineTo(62, 32); x.lineTo(36, 36); x.lineTo(32, 62); x.lineTo(28, 36); x.lineTo(2, 32); x.lineTo(28, 28); x.fill();
  const t = new THREE.CanvasTexture(c); spriteCache.set('spark', t); return t;
}
export { G as GEO, shade, RAINBOW, Builder };
