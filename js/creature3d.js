// Brilhinhos — gerador 3D dos companheiros (e dos moradores, núcleos e itens).
// Cada espécie tem um TIPO DE CORPO de verdade, a partir de um animal de referência:
// 4 patas (lobo, raposa, felino, cervo, urso, javali, lagarto, tartaruga, rinoceronte,
// mamute, dragão, grifo), 2 patas (sapo, pinguim, gorila, golem, dinossauro), ave/morcego,
// peixe/arraia, serpente/enguia, inseto (besouro, mariposa) e espírito (água-viva).
// A pele é uma textura feita na hora (pelo, escama, pena, pedra, lava, gelo, raio, galáxia)
// e o elemento acrescenta peças (folhas, barbatanas, chamas, cristais, placas, raios, estrelas).
// O estágio muda proporção (filhote cabeçudo → adulto imponente) e acrescenta armadura.
import * as THREE from './vendor/three.module.js';
import { SPECIES, FAMILIES, ELEMENTS } from './data.js';

// ---------- utilidades ----------
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shade(hex, dh = 0, ds = 0, dl = 0) {
  const c = new THREE.Color(hex); const o = {}; c.getHSL(o);
  c.setHSL((o.h + dh + 1) % 1, THREE.MathUtils.clamp(o.s + ds, 0, 1), THREE.MathUtils.clamp(o.l + dl, 0, 1));
  return '#' + c.getHexString();
}
export const RAINBOW = ['#ff7b9c', '#ffb36b', '#ffe36b', '#8ce07a', '#6fc8ff', '#b59cff'];
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- texturas de pele (canvas, em cache) ----------
const texCache = new Map();
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function noiseDots(x, w, h, n, r0, r1, col, a0, a1, rnd) { for (let i = 0; i < n; i++) { x.globalAlpha = a0 + rnd() * (a1 - a0); x.fillStyle = col; x.beginPath(); x.arc(rnd() * w, rnd() * h, r0 + rnd() * (r1 - r0), 0, 7); x.fill(); } x.globalAlpha = 1; }
// kind: pelo|escama|pena|pele|quitina|couro|pedra|lava|gelo|gel|casco ; over: elemento ; pat: listras|manchas|nada
function skin(kind, c1, c2, over, pat, seed) {
  const key = [kind, c1, c2, over, pat, seed].join('|');
  if (texCache.has(key)) return texCache.get(key);
  const W = 256, H = 128; let emis = null;
  const map = canvasTex(W, H, (x) => {
    const rnd = mulberry(seed * 13 + kind.length * 7);
    x.fillStyle = c1; x.fillRect(0, 0, W, H);
    // gradiente de barriga (parte de baixo da esfera = fim da textura)
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, c2 + 'aa'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const dk = shade(c1, 0, 0, -0.14), lt = shade(c1, 0, 0, 0.12);
    if (kind === 'pelo') { for (let i = 0; i < 2600; i++) { const px = rnd() * W, py = rnd() * H; x.strokeStyle = rnd() < 0.5 ? dk : lt; x.globalAlpha = 0.25 + rnd() * 0.3; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py + 3 + rnd() * 4); x.stroke(); } }
    if (kind === 'escama' || kind === 'casco') {
      const s = kind === 'casco' ? 22 : 9;
      for (let yy = 0; yy < H + s; yy += s * 0.62) for (let xx = 0; xx < W + s; xx += s) {
        const ox = (Math.round(yy / (s * 0.62)) % 2) * s / 2; x.globalAlpha = 0.55; x.strokeStyle = dk; x.lineWidth = kind === 'casco' ? 2.5 : 1.2;
        x.beginPath(); x.arc(xx + ox, yy, s * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
        x.globalAlpha = 0.18; x.fillStyle = lt; x.beginPath(); x.arc(xx + ox, yy - s * 0.15, s * 0.25, 0, 7); x.fill();
      }
    }
    if (kind === 'pena') for (let yy = 0; yy < H + 10; yy += 7) for (let xx = 0; xx < W + 10; xx += 10) { const ox = (yy / 7) % 2 * 5; x.globalAlpha = 0.45; x.strokeStyle = dk; x.lineWidth = 1.4; x.beginPath(); x.arc(xx + ox, yy, 5.5, 0.1, Math.PI - 0.1); x.stroke(); }
    if (kind === 'pele') noiseDots(x, W, H, 160, 1, 4, dk, 0.15, 0.4, rnd);
    if (kind === 'couro') { noiseDots(x, W, H, 900, 0.5, 1.6, dk, 0.2, 0.5, rnd); for (let i = 0; i < 40; i++) { x.globalAlpha = 0.3; x.strokeStyle = dk; x.beginPath(); const px = rnd() * W, py = rnd() * H; x.moveTo(px, py); x.quadraticCurveTo(px + 8, py + rnd() * 6, px + 16, py); x.stroke(); } }
    if (kind === 'quitina') { for (let i = 0; i < 8; i++) { x.globalAlpha = 0.25; x.fillStyle = lt; x.fillRect(0, i * 16 + 3, W, 2); } noiseDots(x, W, H, 200, 0.5, 1.5, dk, 0.2, 0.4, rnd); }
    if (kind === 'pedra' || kind === 'lava') {
      noiseDots(x, W, H, 260, 3, 12, dk, 0.15, 0.35, rnd); noiseDots(x, W, H, 200, 2, 7, lt, 0.1, 0.25, rnd);
      x.globalAlpha = 0.7; x.strokeStyle = shade(c1, 0, 0, -0.3); x.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) { let px = rnd() * W, py = rnd() * H; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (rnd() - 0.5) * 30; py += (rnd() - 0.5) * 20; x.lineTo(px, py); } x.stroke(); }
    }
    if (kind === 'gelo') { for (let i = 0; i < 60; i++) { x.globalAlpha = 0.25 + rnd() * 0.3; x.strokeStyle = '#ffffff'; x.lineWidth = 1 + rnd() * 2; const px = rnd() * W, py = rnd() * H; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 40, py + (rnd() - 0.5) * 40); x.stroke(); } }
    if (kind === 'gel') { noiseDots(x, W, H, 40, 4, 14, lt, 0.15, 0.3, rnd); }
    // padrão da família
    x.globalAlpha = 1;
    if (pat === 'listras') { x.fillStyle = shade(c1, 0, 0.05, -0.2); for (let i = 0; i < 9; i++) { const xx = (i / 9) * W + rnd() * 6; x.beginPath(); x.moveTo(xx, 0); x.quadraticCurveTo(xx + 10, H * 0.25, xx + 3, H * 0.5); x.lineTo(xx - 3, H * 0.5); x.quadraticCurveTo(xx + 2, H * 0.25, xx - 6, 0); x.fill(); } }
    if (pat === 'manchas') noiseDots(x, W, H * 0.6, 24, 5, 11, shade(c1, 0.02, 0.05, -0.18), 0.65, 0.85, rnd);
    // elemento por cima
    if (over === 'eletrico') { x.strokeStyle = '#2a2638'; x.globalAlpha = 0.85; x.lineWidth = 5; for (let i = 0; i < 6; i++) { const xx = (i / 6) * W + 10; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + 12, H * 0.18); x.lineTo(xx - 4, H * 0.26); x.lineTo(xx + 10, H * 0.45); x.stroke(); } }
    if (over === 'cosmo') {
      for (let i = 0; i < 6; i++) { const gx = rnd() * W, gy = rnd() * H, gr = 20 + rnd() * 30; const rg = x.createRadialGradient(gx, gy, 0, gx, gy, gr); rg.addColorStop(0, i % 2 ? '#ff7df280' : '#6fa8ff80'); rg.addColorStop(1, '#00000000'); x.fillStyle = rg; x.globalAlpha = 1; x.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); }
      noiseDots(x, W, H, 120, 0.4, 1.4, '#ffffff', 0.6, 1, rnd);
    }
    if (over === 'gelo' && kind !== 'gelo') { for (let i = 0; i < 30; i++) { x.globalAlpha = 0.35; x.strokeStyle = '#ffffff'; x.lineWidth = 1.5; const px = rnd() * W, py = rnd() * H * 0.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 20, py + 10); x.stroke(); } }
    if (over === 'planta' && kind !== 'pele') noiseDots(x, W, H * 0.55, 30, 3, 8, '#6fae3c', 0.5, 0.8, rnd);
    x.globalAlpha = 1;
  });
  if (kind === 'lava' || over === 'eletrico' || over === 'cosmo') {
    emis = canvasTex(W, H, (x) => {
      const rnd = mulberry(seed * 13 + kind.length * 7 + 5);
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      if (kind === 'lava') { x.strokeStyle = '#ff8a1c'; x.lineWidth = 2.5; x.shadowColor = '#ffcc33'; x.shadowBlur = 6; for (let i = 0; i < 22; i++) { let px = rnd() * W, py = rnd() * H; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (rnd() - 0.5) * 30; py += (rnd() - 0.5) * 18; x.lineTo(px, py); } x.stroke(); } }
      if (over === 'cosmo') noiseDots(x, W, H, 120, 0.4, 1.4, '#ffffff', 0.6, 1, rnd);
      if (over === 'eletrico') { x.strokeStyle = '#fff47a'; x.globalAlpha = 0.5; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const xx = (i / 6) * W + 10; x.beginPath(); x.moveTo(xx + 3, 0); x.lineTo(xx + 15, H * 0.18); x.lineTo(xx - 1, H * 0.26); x.lineTo(xx + 13, H * 0.45); x.stroke(); } }
    });
  }
  const out = { map, emis }; texCache.set(key, out); return out;
}
function irisTex(color, slit, glow) {
  const key = `iris|${color}|${slit}|${glow}`;
  if (texCache.has(key)) return texCache.get(key);
  const t = canvasTex(128, 128, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
    const g = x.createRadialGradient(64, 64, 6, 64, 64, 46); g.addColorStop(0, shade(color, 0, 0.1, 0.2)); g.addColorStop(0.7, color); g.addColorStop(1, shade(color, 0, 0, -0.3));
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 46, 0, 7); x.fill();
    x.strokeStyle = shade(color, 0, 0, -0.35); x.lineWidth = 4; x.stroke();
    x.fillStyle = '#120c18'; x.beginPath(); if (slit) x.ellipse(64, 64, 8, 34, 0, 0, 7); else x.arc(64, 64, 20, 0, 7); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(48, 46, 10, 0, 7); x.fill(); x.beginPath(); x.arc(78, 80, 4, 0, 7); x.fill();
  });
  texCache.set(key, t); return t;
}

// ---------- materiais ----------
const matCache = new Map();
const SIL = new THREE.MeshBasicMaterial({ color: '#2b2550' });
function mat(color, o = {}) {
  const k = JSON.stringify([color, o.kind, o.c2, o.over, o.pat, o.seed, o.rough, o.metal, o.glow, o.op, o.emis, o.flat]);
  if (matCache.has(k)) return matCache.get(k);
  const p = { color: o.kind ? '#ffffff' : color, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, flatShading: !!o.flat };
  if (o.kind) { const s = skin(o.kind, color, o.c2 || color, o.over, o.pat, o.seed || 1); p.map = s.map; p.bumpMap = s.map; p.bumpScale = 1.2; if (s.emis) { p.emissiveMap = s.emis; p.emissive = new THREE.Color(o.kind === 'lava' ? '#ff6a00' : o.over === 'eletrico' ? '#ffee55' : '#ffffff'); p.emissiveIntensity = 1.4; } }
  if (o.glow) { p.emissive = new THREE.Color(o.emis || color); p.emissiveIntensity = o.glow; }
  if (o.op) { p.transparent = true; p.opacity = o.op; p.depthWrite = false; }
  const m = new THREE.MeshStandardMaterial(p);
  matCache.set(k, m); return m;
}
export function toon(color, glow = 0) { return mat(color, { glow }); } // compatibilidade (cenário)

// ---------- formas ----------
const G = {
  sph: new THREE.SphereGeometry(1, 32, 22),
  sphLo: new THREE.SphereGeometry(1, 14, 10),
  cone: new THREE.ConeGeometry(1, 1, 18),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
  oct: new THREE.OctahedronGeometry(1, 0),
  ico: new THREE.IcosahedronGeometry(1, 0),
  dode: new THREE.DodecahedronGeometry(1, 0),
  box: new THREE.BoxGeometry(1, 1, 1),
  ring: new THREE.TorusGeometry(1, 0.06, 10, 48),
  lid: new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
  dome: new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
};
function shapeGeo(pts, depth = 0.04, curves = true) {
  const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (curves && p.length === 4) s.quadraticCurveTo(p[0], p[1], p[2], p[3]); else s.lineTo(p[0], p[1]); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.6, bevelSize: depth * 0.6, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2); return g;
}
const SHAPES = {
  star: (() => { const p = []; for (let i = 0; i <= 10; i++) { const r = i % 2 ? 0.45 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return shapeGeo(p, 0.3, false); })(),
  bolt: shapeGeo([[0.1, 1], [-0.45, 0.05], [-0.02, 0.05], [-0.25, -1], [0.45, 0.15], [0.02, 0.15], [0.3, 1]], 0.18, false),
  leaf: shapeGeo([[0, 0], [0.45, 0.35, 0.05, 1], [-0.35, 0.35, 0, 0]], 0.05),
  fin: shapeGeo([[0, 0], [0.2, 0.7, 0.75, 0.85], [0.6, 0.3, 0.9, 0], [0, 0]], 0.04),
  ear: shapeGeo([[-0.5, 0], [-0.35, 0.5, 0, 1], [0.35, 0.5, 0.5, 0], [0, -0.1, -0.5, 0]], 0.06),
  feather: shapeGeo([[0, 0], [0.18, 0.4, 0.06, 1], [-0.1, 0.4, 0, 0]], 0.03),
  membrane: shapeGeo([[0, 0], [0.5, 0.55], [1.15, 0.65], [1.25, 0.1], [1.0, 0.25, 0.9, -0.05], [0.7, 0.15, 0.6, -0.15], [0.35, 0.05, 0, -0.1]], 0.03, false),
  flame: shapeGeo([[0, 0], [0.5, 0.25, 0.25, 0.7], [0.15, 0.85, 0, 1.2], [-0.05, 0.75, -0.2, 0.6], [-0.4, 0.3, 0, 0]], 0.08),
  mothWing: shapeGeo([[0, 0], [0.3, 0.9, 1.0, 0.85], [1.25, 0.4, 0.9, 0], [0.5, -0.1, 0, 0]], 0.025),
  mothWing2: shapeGeo([[0, 0], [0.7, -0.1, 0.75, -0.6], [0.35, -0.85, 0.05, -0.3], [0, 0]], 0.025),
};

// tubo afinando (caudas, serpentes, tentáculos)
function taperTube(points, r0, r1, seg = 24) {
  const curve = new THREE.CatmullRomCurve3(points);
  const rad = 10; const g = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const pos = g.attributes.position;
  for (let i = 0; i <= seg; i++) {
    const c = curve.getPointAt(i / seg); const r = r0 + (r1 - r0) * Math.pow(i / seg, 0.9);
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; const v = V(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); }
  }
  g.computeVertexNormals(); return g;
}

class B {
  constructor(sil) { this.sil = sil; this.meshes = []; }
  m(parent, geo, material, p = [0, 0, 0], s = 1, r = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geo, this.sil ? SIL : material);
    mesh.position.set(...p); if (Array.isArray(s)) mesh.scale.set(...s); else mesh.scale.setScalar(s); mesh.rotation.set(...r);
    mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  g(parent, p = [0, 0, 0], r = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); parent.add(g); return g; }
  // cápsula de a até b
  limb(parent, material, a, b, r) {
    const d = b.clone().sub(a); const len = d.length();
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 12), this.sil ? SIL : material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  // aponta um objeto (eixo Y) para uma direção
  aim(mesh, dir) { mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); return mesh; }
}

// ---------- arquétipos ----------
const PLAN = {
  lobo: 'quad', raposa: 'quad', felino: 'quad', cervo: 'quad', urso: 'quad', javali: 'quad', lagarto: 'quad', tartaruga: 'quad',
  rinoceronte: 'quad', mamute: 'quad', dragao: 'quad', grifo: 'quad',
  sapo: 'biped', pinguim: 'biped', macaco: 'biped', golem: 'biped', dino: 'biped',
  ave: 'bird', morcego: 'bird', peixe: 'fish', arraia: 'fish', serpente: 'serpent', enguia: 'serpent',
  besouro: 'insect', mariposa: 'insect', aguaviva: 'spirit',
  cavalo: 'quad', coelho: 'quad', crocodilo: 'quad', hipopotamo: 'quad', lontra: 'quad', porcoespinho: 'quad',
  coruja: 'bird', tubarao: 'fish', escorpiao: 'insect', polvo: 'spirit',
};
const QUAD = {
  lobo:        { len: 1.25, h: 0.4, w: 0.38, leg: 0.55, legR: 0.085, head: 0.33, snout: 0.62, ears: 'pont', tail: 'peluda', neck: 0.32, skin: 'pelo', slit: false },
  raposa:      { len: 1.0, h: 0.34, w: 0.32, leg: 0.42, legR: 0.07, head: 0.32, snout: 0.66, ears: 'grande', tail: 'peluda', neck: 0.28, skin: 'pelo', slit: true },
  felino:      { len: 1.2, h: 0.38, w: 0.37, leg: 0.5, legR: 0.09, head: 0.33, snout: 0.32, ears: 'pont', tail: 'fina', neck: 0.28, skin: 'pelo', slit: true },
  cervo:       { len: 1.1, h: 0.38, w: 0.33, leg: 0.85, legR: 0.06, head: 0.28, snout: 0.6, ears: 'cervo', tail: 'curta', neck: 0.6, skin: 'pelo', antlers: true },
  urso:        { len: 1.3, h: 0.55, w: 0.52, leg: 0.45, legR: 0.15, head: 0.4, snout: 0.42, ears: 'redonda', tail: 'curta', neck: 0.15, skin: 'pelo' },
  javali:      { len: 1.15, h: 0.46, w: 0.42, leg: 0.36, legR: 0.1, head: 0.36, snout: 0.62, ears: 'pont', tail: 'curta', neck: 0.08, skin: 'pelo', tusks: true, mane: true },
  lagarto:     { len: 1.3, h: 0.25, w: 0.32, leg: 0.24, legR: 0.07, head: 0.28, snout: 0.62, ears: 'nada', tail: 'reptil', neck: 0.12, skin: 'escama', splay: true, slit: true },
  tartaruga:   { len: 1.05, h: 0.32, w: 0.55, leg: 0.24, legR: 0.11, head: 0.26, snout: 0.35, ears: 'nada', tail: 'curta', neck: 0.28, skin: 'escama', splay: true, shell: true },
  rinoceronte: { len: 1.45, h: 0.6, w: 0.52, leg: 0.45, legR: 0.15, head: 0.4, snout: 0.75, ears: 'pont', tail: 'curta', neck: 0.08, skin: 'couro', horn: true },
  mamute:      { len: 1.4, h: 0.72, w: 0.6, leg: 0.6, legR: 0.17, head: 0.48, snout: 0.15, ears: 'leque', tail: 'curta', neck: 0.08, skin: 'pelo', tusks: 'mamute', trunk: true },
  dragao:      { len: 1.3, h: 0.43, w: 0.42, leg: 0.52, legR: 0.1, head: 0.34, snout: 0.66, ears: 'nada', tail: 'reptil', neck: 0.6, skin: 'escama', wings: 'membrana', horns: true, spikes: true, slit: true },
  cavalo:      { len: 1.2, h: 0.4, w: 0.33, leg: 0.9, legR: 0.07, head: 0.27, snout: 0.85, ears: 'pont', tail: 'crina', neck: 0.65, skin: 'pelo', hmane: true },
  coelho:      { len: 0.75, h: 0.34, w: 0.32, leg: 0.3, legR: 0.07, head: 0.32, snout: 0.28, ears: 'coelho', tail: 'pompom', neck: 0.18, skin: 'pelo' },
  crocodilo:   { len: 1.5, h: 0.24, w: 0.36, leg: 0.22, legR: 0.08, head: 0.27, snout: 1.5, ears: 'nada', tail: 'reptil', neck: 0.05, skin: 'escama', splay: true, spikes: true, slit: true },
  hipopotamo:  { len: 1.35, h: 0.6, w: 0.62, leg: 0.34, legR: 0.17, head: 0.45, snout: 0.65, ears: 'redonda', tail: 'curta', neck: 0.05, skin: 'couro', tusks: true },
  lontra:      { len: 1.1, h: 0.28, w: 0.28, leg: 0.22, legR: 0.07, head: 0.27, snout: 0.35, ears: 'redonda', tail: 'reptil', neck: 0.25, skin: 'pelo' },
  porcoespinho:{ len: 0.85, h: 0.35, w: 0.36, leg: 0.22, legR: 0.07, head: 0.27, snout: 0.5, ears: 'redonda', tail: 'curta', neck: 0.05, skin: 'pelo', quills: true },
  grifo:       { len: 1.25, h: 0.43, w: 0.42, leg: 0.55, legR: 0.095, head: 0.34, snout: 0, ears: 'tufo', tail: 'fina', neck: 0.48, skin: 'pena', wings: 'penas', beak: true },
};

// ---------- montagem ----------
// spec: { sp } | { npc: {arch, cor, chapeu} } ; opts: { silhouette, shiny }
export function buildCreature(spec, opts = {}) {
  const b = new B(!!opts.silhouette);
  let arch, el, stage, seed, rar;
  if (spec.npc) { arch = spec.npc.arch; el = null; stage = 1; seed = 999 + arch.length; rar = 'comum'; }
  else { const s = SPECIES[spec.sp]; arch = s.arch; el = s.el; stage = s.stage; seed = s.fam * 7 + 3; rar = s.rar; }
  const rnd = mulberry(seed);
  // cores da família: variação dentro do elemento
  let [c1, c2, glow] = el ? ELEMENTS[el].cores : [spec.npc.cor, shade(spec.npc.cor, 0, -0.1, 0.15), '#ffffff'];
  const famObj = el ? FAMILIES[SPECIES[spec.sp].fam] : null;
  if (famObj?.cores) [c1, c2, glow] = famObj.cores;
  if (el) {
    const fi = FAMILIES.filter((f) => f.el === el).findIndex((f) => f.id === SPECIES[spec.sp].fam);
    if (!famObj.cores) c1 = shade(c1, ((fi * 7) % 6 - 2.5) * 0.022, (rnd() - 0.5) * 0.15, (fi % 3 - 1) * 0.07);
    if (opts.shiny) { c1 = shade(c1, 0.45, 0.1, 0.05); c2 = shade(c2, 0.4, 0, 0); glow = shade(glow, 0.3, 0, 0); }
  }
  const plan = PLAN[arch] || 'quad';
  const elSkin = el === 'pedra' && ['golem', 'tartaruga', 'rinoceronte', 'besouro', 'lagarto'].includes(arch) ? 'pedra'
    : el === 'fogo' && ['lagarto', 'dino', 'rinoceronte', 'javali'].includes(arch) ? 'lava'
    : el === 'gelo' && ['golem', 'aguaviva'].includes(arch) ? 'gelo' : null;
  const baseSkin = elSkin || (plan === 'quad' ? QUAD[arch].skin : { sapo: 'pele', pinguim: 'pena', macaco: 'pelo', golem: 'pedra', dino: 'escama', ave: 'pena', morcego: 'pelo', peixe: 'escama', arraia: 'pele', serpente: 'escama', enguia: 'pele', besouro: 'quitina', mariposa: 'pelo', aguaviva: 'gel', coruja: 'pena', tubarao: 'couro', escorpiao: 'quitina', polvo: 'pele' }[arch]);
  const pat = ['listras', 'manchas', 'nada'][Math.floor(rnd() * 3)];
  const over = el === 'eletrico' || el === 'cosmo' || el === 'gelo' || el === 'planta' ? el : null;
  const glossy = baseSkin === 'quitina' || baseSkin === 'gel' || baseSkin === 'gelo';
  const skinM = mat(c1, { kind: baseSkin, c2, over, pat: spec.npc ? 'nada' : pat, seed, rough: glossy ? 0.3 : baseSkin === 'escama' ? 0.55 : 0.85, metal: baseSkin === 'quitina' ? 0.25 : 0, op: baseSkin === 'gel' ? 0.82 : 0 });
  const secM = mat(c2, { rough: 0.8 });
  const darkM = mat(shade(c1, 0, -0.05, -0.25), { rough: 0.7 });
  const hornM = mat(el === 'gelo' ? '#e6fbff' : el === 'pedra' ? glow : el === 'eletrico' ? '#fff27a' : el === 'cosmo' ? '#d9c8ff' : '#f2e6cc', { rough: 0.35, glow: ['gelo', 'eletrico', 'cosmo', 'trovao'].includes(el) ? 0.35 : 0, emis: glow });
  const glowM = mat(glow, { glow: 1.6, rough: 0.4 });
  const ctx = { b, rnd, el, stage, rar, arch, c1, c2, glow, skinM, secM, darkM, hornM, glowM, npc: spec.npc, anim: { legs: [], tails: [], wings: [], eyes: [], spin: [], wave: [], flames: [], float: 0, head: null } };

  const root = new THREE.Group(); const body = b.g(root); ctx.body = body;
  const R = ({ quad: buildQuad, biped: buildBiped, bird: buildBird, fish: buildFish, serpent: buildSerpent, insect: buildInsect, spirit: buildSpirit })[plan](ctx);
  // R: { height, head, headR, top (ponto no alto da cabeça), back: [pontos das costas], tailTip, eyesFwd }
  if (!spec.npc) { elementParts(ctx, R); armor(ctx, R); }
  if (spec.npc) hat(b, R.head, R.headR, spec.npc.chapeu);
  if (famObj?.fantasia && !b.sil) for (const k of famObj.fantasia) costume(ctx, R, k);
  // aura de raridade alta no adulto
  if (!spec.npc && stage === 2 && ['epico', 'lendario', 'mitico'].includes(rar) && !b.sil) {
    const ring = b.m(root, G.ring, mat(rar === 'epico' ? '#ff6fb5' : rar === 'mitico' ? '#7df9ff' : '#ffc22e', { glow: 2 }), [0, 0.03, 0], [R.footR || 1, R.footR || 1, 1], [Math.PI / 2, 0, 0]);
    ring.castShadow = false; ctx.anim.spin.push({ g: ring, speed: 0.7, axis: 'z' });
  }
  if (opts.shiny && !b.sil) orbit(ctx, root, 5, R.height * 0.75, (R.footR || 0.9) * 1.1, (g) => { const s = b.m(g, SHAPES.star, mat('#fff6a8', { glow: 2 }), [0, 0, 0], 0.07); s.castShadow = false; }, 1.4);
  // sombra de contato (para quando não há sombra de verdade)
  if (!b.sil) {
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; sh.userData.base = R.footR || 0.8; sh.scale.setScalar(sh.userData.base); root.add(sh); ctx.anim.shadow = sh;
  }
  const sc = [0.62, 0.85, 1.12][stage];
  root.scale.setScalar(sc);
  const ctrl = controller(ctx, plan);
  root.userData = { ctrl, height: R.height * sc, sp: spec.sp, stage };
  return root;
}

// ---------- olhos (menores, com pálpebra: olhar decidido) ----------
function eyes(ctx, head, r, opts) {
  ctx.eyeAt ||= { ...opts, head, r };
  const { b } = ctx; const { x, y, z, size, slit, color, fierce = 0.35, glowEyes } = opts;
  for (const sx of [1, -1]) {
    const g = b.g(head, [sx * x, y, z], [0, sx * (opts.yaw ?? 0.45), 0]);
    const white = b.m(g, G.sph, mat('#f4f1ea', { rough: 0.25 }), [0, 0, 0], size);
    const iris = b.m(g, G.sph, b.sil ? SIL : (glowEyes ? mat(color, { glow: 1.8 }) : new THREE.MeshStandardMaterial({ map: irisTex(color, slit), roughness: 0.15 })), [0, 0, size * 0.42], glowEyes ? [size * 0.78, size * 0.78, size * 0.6] : [size * 0.6, size * 0.78, size * 0.78]);
    if (!glowEyes && !b.sil) iris.rotation.y = -Math.PI / 2; // centro da textura para frente
    // pálpebra de cima, inclinada para o meio (cara de bravo, mas fofo)
    const lid = b.m(g, G.lid, ctx.skinM, [0, size * 0.05, 0], size * 1.12, [-0.35, 0, sx * fierce]);
    ctx.anim.eyes.push(g);
  }
}

// ---------- corpo de 4 patas ----------
function buildQuad(ctx) {
  const { b, stage, arch } = ctx; const P = { ...QUAD[arch] };
  if (stage === 0) { P.head *= 1.32; P.leg *= 0.78; P.len *= 0.78; P.neck *= 0.7; P.snout *= 0.75; }
  if (stage === 2) { P.h *= 1.08; P.w *= 1.08; P.legR *= 1.15; }
  const legH = P.splay ? P.leg * 0.55 : P.leg;
  const ty = legH + P.h * 0.62;
  const body = b.g(ctx.body, [0, 0, 0]);
  b.m(body, G.sph, ctx.skinM, [0, ty, 0], [P.w, P.h, P.len * 0.5]);
  b.m(body, G.sph, ctx.skinM, [0, ty + P.h * 0.08, P.len * 0.3], [P.w * 1.06, P.h * 1.02, P.len * 0.27]);
  b.m(body, G.sph, ctx.secM, [0, ty - P.h * 0.35, P.len * 0.12], [P.w * 0.75, P.h * 0.55, P.len * 0.38]);
  // pernas (pivô no quadril: anima a caminhada)
  for (const [sx, sz, ph] of [[1, 1, 0], [-1, 1, Math.PI], [1, -1, Math.PI], [-1, -1, 0]]) {
    const hip = b.g(body, [sx * P.w * 0.62, ty - P.h * 0.25, sz * P.len * 0.32]);
    const foot = P.splay ? V(sx * P.leg * 0.5, -(ty - P.h * 0.25) + 0.06, sz * 0.05) : V(0, -(ty - P.h * 0.25) + 0.06, 0.02);
    const knee = foot.clone().multiplyScalar(0.5).add(V(0, 0, sz * 0.04));
    b.limb(hip, ctx.skinM, V(0, 0, 0), knee, P.legR * 1.15);
    b.limb(hip, ctx.skinM, knee, foot, P.legR);
    b.m(hip, G.sph, ctx.darkM, [foot.x, foot.y - 0.01, foot.z + 0.04], [P.legR * 1.4, P.legR * 0.8, P.legR * 1.8]);
    if (['felino', 'lobo', 'dragao', 'grifo', 'lagarto', 'urso'].includes(arch) && stage > 0) for (const cx of [-1, 0, 1]) b.m(hip, G.cone, ctx.hornM, [foot.x + cx * P.legR * 0.6, foot.y, foot.z + P.legR * 1.7], [P.legR * 0.18, P.legR * 0.6, P.legR * 0.18], [Math.PI / 2, 0, 0]);
    ctx.anim.legs.push({ g: hip, ph });
  }
  // pescoço e cabeça
  const neckBase = V(0, ty + P.h * 0.4, P.len * 0.42);
  const headPos = V(0, ty + P.h * 0.45 + P.neck * 0.9, P.len * 0.5 + P.neck * 0.35);
  if (P.neck > 0.12) b.limb(body, ctx.skinM, neckBase, headPos.clone().add(V(0, -P.head * 0.3, -P.head * 0.2)), P.head * 0.45);
  const head = b.g(body, headPos.toArray()); ctx.anim.head = head;
  const hr = P.head;
  b.m(head, G.sph, ctx.skinM, [0, 0, 0], [hr, hr * 0.9, hr * 1.05]);
  if (P.beak) {
    b.m(head, G.cone, mat('#e8b23a', { rough: 0.4 }), [0, -hr * 0.1, hr * 1.05], [hr * 0.32, hr * 0.7, hr * 0.38], [Math.PI / 2 + 0.35, 0, 0]);
  } else if (P.snout > 0.2) {
    const sl = hr * P.snout;
    b.m(head, G.sph, ctx.skinM, [0, -hr * 0.22, hr * 0.62 + sl * 0.35], [hr * 0.55, hr * 0.45, sl * 0.75]);
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.38, hr * 0.55 + sl * 0.3], [hr * 0.45, hr * 0.25, sl * 0.65]);
    b.m(head, G.sph, mat('#1c1620', { rough: 0.3 }), [0, -hr * 0.1, hr * 0.62 + sl * 1.05], [hr * 0.15, hr * 0.11, hr * 0.1]); ctx.nose = [0, -hr * 0.1, hr * 0.62 + sl * 1.05];
    if (['lobo', 'felino', 'dragao', 'lagarto', 'urso', 'raposa'].includes(arch) && stage > 0) for (const sx of [1, -1]) b.m(head, G.cone, mat('#ffffff', { rough: 0.3 }), [sx * hr * 0.2, -hr * 0.55, hr * 0.55 + sl * 0.85], [hr * 0.05, hr * 0.14, hr * 0.05], [Math.PI, 0, 0]);
  } else {
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.3, hr * 0.72], [hr * 0.52, hr * 0.36, hr * 0.36]);
    b.m(head, G.sph, mat('#1c1620', { rough: 0.3 }), [0, -hr * 0.12, hr * 1.02], [hr * 0.13, hr * 0.09, hr * 0.08]);
  }
  eyes(ctx, head, hr, { x: hr * 0.45, y: hr * 0.18, z: hr * 0.72, size: hr * (stage === 0 ? 0.24 : 0.19), slit: P.slit, color: ctx.el ? ctx.glow : '#6b4a2b', fierce: P.beak ? 0.5 : 0.35 });
  // orelhas
  const earM = ctx.skinM;
  const earFn = {
    pont: (sx) => { const e = b.m(head, SHAPES.ear, earM, [sx * hr * 0.5, hr * 0.72, -hr * 0.1], [hr * 0.42, hr * 0.62, hr], [-0.2, sx * 0.3, -sx * 0.35]); return e; },
    grande: (sx) => b.m(head, SHAPES.ear, earM, [sx * hr * 0.55, hr * 0.72, -hr * 0.15], [hr * 0.55, hr * 0.95, hr], [-0.15, sx * 0.35, -sx * 0.45]),
    redonda: (sx) => b.m(head, G.sph, earM, [sx * hr * 0.66, hr * 0.68, -hr * 0.1], [hr * 0.26, hr * 0.26, hr * 0.12]),
    cervo: (sx) => b.m(head, SHAPES.leaf, earM, [sx * hr * 0.75, hr * 0.45, -hr * 0.15], [hr * 0.5, hr * 0.6, hr], [0, sx * 0.4, -sx * 1.25]),
    leque: (sx) => b.m(head, G.sph, earM, [sx * hr * 0.95, hr * 0.05, -hr * 0.1], [hr * 0.08, hr * 0.7, hr * 0.55], [0, sx * 0.3, 0]),
    coelho: (sx) => b.m(head, SHAPES.leaf, earM, [sx * hr * 0.3, hr * 0.8, -hr * 0.1], [hr * 0.55, hr * 1.5, hr], [-0.15, sx * 0.25, -sx * 0.15]),
    tufo: (sx) => b.m(head, SHAPES.feather, earM, [sx * hr * 0.4, hr * 0.75, -hr * 0.3], [hr * 0.9, hr * 0.7, hr], [-0.6, 0, -sx * 0.5]),
  };
  if (earFn[P.ears]) for (const sx of [1, -1]) earFn[P.ears](sx);
  // cauda
  const tailBase = V(0, ty + P.h * 0.2, -P.len * 0.5);
  const tg = b.g(body, tailBase.toArray()); ctx.anim.tails.push(tg);
  let tailTip = V(0, ty + 0.4, -P.len - 0.3);
  const tl = (0.7 + stage * 0.2);
  if (P.tail === 'peluda') { b.m(tg, G.sph, ctx.skinM, [0, 0.12 * tl, -0.32 * tl], [0.16 * tl, 0.18 * tl, 0.42 * tl], [-0.55, 0, 0]); b.m(tg, G.sph, ctx.secM, [0, 0.3 * tl, -0.62 * tl], [0.12 * tl, 0.13 * tl, 0.16 * tl]); tailTip = tailBase.clone().add(V(0, 0.32 * tl, -0.66 * tl)); }
  if (P.tail === 'fina') { const pts = [V(0, 0, 0), V(0, 0.08, -0.3 * tl), V(0, 0.35 * tl, -0.55 * tl), V(0, 0.55 * tl, -0.5 * tl)]; b.m(tg, taperTube(pts, 0.05, 0.035), ctx.skinM); b.m(tg, G.sph, ctx.darkM, pts[3].toArray(), 0.07); tailTip = tailBase.clone().add(pts[3]); }
  if (P.tail === 'reptil') { const L = P.len * (0.9 + stage * 0.15); const pts = [V(0, 0, 0), V(0, -0.1, -L * 0.35), V(0.05, -0.2, -L * 0.7), V(0, -0.22, -L)]; b.m(tg, taperTube(pts, P.w * 0.5, 0.025), ctx.skinM); tailTip = tailBase.clone().add(pts[3]); ctx.tailPts = pts.map((p) => p.clone().add(tailBase)); }
  if (P.tail === 'crina') { const pts = [V(0, 0, 0), V(0, -0.1, -0.15), V(0, -0.4, -0.25), V(0, -0.65, -0.2)]; b.m(tg, taperTube(pts, 0.09, 0.05), ctx.darkM); tailTip = tailBase.clone().add(pts[3]); }
  if (P.tail === 'pompom') b.m(tg, G.sph, ctx.secM, [0, 0.05, -0.05], 0.13);
  if (P.tail === 'curta') b.m(tg, G.sph, ctx.skinM, [0, 0.02, -0.06], [0.07, 0.07, 0.14], [-0.6, 0, 0]);
  // peças especiais
  const back = [];
  for (let i = 0; i < 5; i++) { const z = P.len * (0.35 - i * 0.18); back.push(V(0, ty + P.h * (0.92 - Math.abs(i - 1.5) * 0.04), z)); }
  if (P.shell) {
    const shellM = mat(ctx.el === 'pedra' ? ctx.c2 : shade(ctx.c1, 0.08, -0.1, -0.12), { kind: ctx.el === 'pedra' ? 'pedra' : 'casco', seed: 5, rough: 0.6 });
    b.m(body, G.dome, shellM, [0, ty - P.h * 0.1, 0], [P.w * 1.18, P.h * 1.55, P.len * 0.62]);
    b.m(body, G.cyl, ctx.darkM, [0, ty - P.h * 0.1, 0], [P.w * 1.2, 0.05, P.len * 0.63]);
    back.length = 0; for (let i = 0; i < 3; i++) back.push(V(0, ty + P.h * 1.4, (i - 1) * P.len * 0.25));
  }
  if (P.horn) { b.m(head, G.cone, ctx.hornM, [0, hr * 0.15, hr * 0.62 + hr * P.snout * 0.7], [hr * 0.18, hr * (0.55 + stage * 0.25), hr * 0.18], [0.45, 0, 0]); if (stage > 0) b.m(head, G.cone, ctx.hornM, [0, hr * 0.32, hr * 0.68], [hr * 0.1, hr * 0.3, hr * 0.1], [0.2, 0, 0]); }
  if (P.tusks) for (const sx of [1, -1]) {
    if (P.tusks === 'mamute') b.m(head, taperTube([V(0, 0, 0), V(sx * 0.1, -0.25, 0.25), V(sx * 0.05, -0.15, 0.55), V(-sx * 0.05, 0.12, 0.62)].map((v) => v.multiplyScalar(hr * 1.6)), hr * 0.09, hr * 0.03), ctx.hornM, [sx * hr * 0.3, -hr * 0.35, hr * 0.5]);
    else b.m(head, G.cone, ctx.hornM, [sx * hr * 0.32, -hr * 0.35, hr * 0.95], [hr * 0.06, hr * 0.3, hr * 0.06], [-0.5, 0, sx * 0.4]);
  }
  if (P.trunk) { const pts = [V(0, 0, 0), V(0, -0.35, 0.3), V(0, -0.75, 0.32), V(0, -0.95, 0.5)].map((v) => v.multiplyScalar(hr)); const tr = b.m(head, taperTube(pts, hr * 0.22, hr * 0.1), ctx.skinM, [0, -hr * 0.1, hr * 0.85]); ctx.anim.tails.push(tr); }
  if (P.mane) for (let i = 0; i < 7; i++) b.m(body, G.cone, ctx.darkM, [0, ty + P.h * 0.85, P.len * (0.45 - i * 0.12)], [0.05, 0.22, 0.05], [-0.4, 0, 0]);
  if (P.antlers) antlers(ctx, head, hr);
  if (P.hmane) for (let i = 0; i < 7; i++) { const k = i / 6; const p = neckBase.clone().lerp(headPos, k); b.m(body, SHAPES.flame, ['fogo', 'eletrico', 'cosmo', 'trovao'].includes(ctx.el) ? mat(ctx.glow, { glow: 1.2 }) : ctx.darkM, [0, p.y + hr * 0.35, p.z - hr * 0.35], [0.22, 0.28 + stage * 0.06, 0.5], [-0.6, Math.PI / 2, 0]).castShadow = false; }
  if (arch === 'cavalo' && (['lendario', 'mitico'].includes(ctx.rar) || (ctx.el === 'cosmo' && stage === 2))) { b.m(head, G.cone, mat('#fff6c9', { glow: 0.8, emis: ctx.glow }), [0, hr * 0.75, hr * 0.55], [hr * 0.12, hr * (0.7 + stage * 0.3), hr * 0.12], [0.5, 0, 0]); if (stage === 2) wings(ctx, body, V(0, ty + P.h * 0.75, P.len * 0.15), 'penas', 1.2); }
  if (P.quills) for (let i = 0; i < 22 + stage * 8; i++) { const a = (i * 2.399) % (Math.PI * 2), e = 0.2 + (i % 5) * 0.16; const dir = V(Math.cos(a) * Math.cos(e) * 0.8, Math.sin(e) + 0.2, -Math.abs(Math.sin(a)) * Math.cos(e) - 0.2).normalize(); const q = b.m(body, G.cone, ctx.el === 'pedra' ? ctx.hornM : ctx.darkM, [dir.x * P.w, ty + dir.y * P.h, dir.z * P.len * 0.4], [0.035, 0.3 + stage * 0.08, 0.035]); b.aim(q, dir); }
  if (P.horns) for (const sx of [1, -1]) b.m(head, taperTube([V(0, 0, 0), V(sx * 0.05, 0.3, -0.12), V(sx * 0.08, 0.55, -0.35)].map((v) => v.multiplyScalar(hr * (1 + stage * 0.35))), hr * 0.1, hr * 0.02), ctx.hornM, [sx * hr * 0.42, hr * 0.55, -hr * 0.2]);
  if (P.spikes) for (const p of back) b.m(body, G.cone, ctx.hornM, [p.x, p.y + 0.04, p.z], [0.05 + stage * 0.015, 0.16 + stage * 0.06, 0.05 + stage * 0.015], [-0.3, 0, 0]);
  if (P.wings) wings(ctx, body, V(0, ty + P.h * 0.75, P.len * 0.15), P.wings, 0.9 + stage * 0.35);
  if (arch === 'felino' && ctx.el === 'fogo') mane(ctx, head, hr);
  return { height: headPos.y + hr * 1.2, head, headR: hr, top: V(0, hr * 0.95, 0), back, backParent: body, tailTip, tailParent: body, footR: Math.max(P.len * 0.65, P.w * 1.4), chest: V(0, ty + P.h * 0.1, P.len * 0.55), shoulders: [V(P.w * 0.85, ty + P.h * 0.55, P.len * 0.3), V(-P.w * 0.85, ty + P.h * 0.55, P.len * 0.3)], scaleRef: P.h };
}
function antlers(ctx, head, hr) {
  const { b, stage, el } = ctx; const crystal = el === 'gelo' || el === 'pedra';
  for (const sx of [1, -1]) {
    const g = b.g(head, [sx * hr * 0.32, hr * 0.72, -hr * 0.05], [0, 0, -sx * 0.35]);
    const L = hr * (0.7 + stage * 0.45);
    if (crystal) { b.m(g, G.oct, ctx.hornM, [0, L * 0.5, 0], [hr * 0.1, L * 0.5, hr * 0.1]); for (let i = 0; i < 1 + stage; i++) b.m(g, G.oct, ctx.hornM, [sx * hr * 0.15, L * (0.3 + i * 0.25), 0], [hr * 0.06, L * 0.25, hr * 0.06], [0, 0, -sx * 0.8]); continue; }
    b.m(g, taperTube([V(0, 0, 0), V(0, L * 0.5, -L * 0.1), V(sx * L * 0.15, L, -L * 0.2)], hr * 0.07, hr * 0.025), ctx.hornM);
    for (let i = 0; i < 1 + stage; i++) { const y = L * (0.35 + i * 0.25); b.m(g, taperTube([V(0, y, -L * 0.07), V(sx * L * 0.25, y + L * 0.2, -L * 0.02)], hr * 0.045, hr * 0.02), ctx.hornM); }
    if (el === 'planta') b.m(g, SHAPES.leaf, mat('#6fbf3a'), [sx * L * 0.15, L, -L * 0.2], hr * 0.35, [0, 0, -sx * 0.6]);
  }
}
function mane(ctx, head, hr) {
  const { b } = ctx;
  const g = b.g(head, [0, 0, -hr * 0.25]);
  const n = 10 + ctx.stage * 3;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2; const f = b.m(g, SHAPES.flame, mat(i % 2 ? '#ffb347' : '#ff6a2a', { glow: 1.2, emis: i % 2 ? '#ffb347' : '#ff5a1a' }), [Math.cos(a) * hr * 0.85, Math.sin(a) * hr * 0.85, 0], hr * (0.5 + ctx.stage * 0.1), [0, 0, a - Math.PI / 2]);
    f.castShadow = false; ctx.anim.flames.push(f);
  }
}
function wings(ctx, parent, at, kind, s) {
  const { b } = ctx;
  for (const sx of [1, -1]) {
    const g = b.g(parent, [at.x + sx * 0.18, at.y, at.z], [0, 0, 0]);
    if (kind === 'membrana') {
      const mm = mat(shade(ctx.c2, 0, 0, -0.05), { rough: 0.6, op: 0.95 });
      const w = b.m(g, SHAPES.membrane, mm, [0, 0, 0], [sx * s, s, s], [Math.PI / 2 - 0.2, 0, 0]);
      b.limb(g, ctx.skinM, V(0, 0, 0), V(sx * 1.2 * s, 0.05, -0.62 * s), 0.035 * s);
    } else {
      const fm = mat(ctx.c1, { kind: 'pena', c2: ctx.c2, seed: 9, rough: 0.8 });
      for (let i = 0; i < 7; i++) { const a = -0.1 + i * 0.13; b.m(g, SHAPES.feather, i < 2 ? ctx.secM : fm, [sx * (0.15 + i * 0.14) * s, 0.02, -0.05 * i * s], [0.6 * s, (0.8 + i * 0.05) * s, s], [Math.PI / 2 + 0.25, 0, sx * (-1.2 - a)]); }
    }
    ctx.anim.wings.push({ g, sx });
  }
}

// ---------- corpo de 2 patas ----------
function buildBiped(ctx) {
  const { b, stage, arch } = ctx; const st = stage;
  const s0 = st === 0;
  let height = 1.6, head, hr, top, back = [], tailTip = null, footR = 0.7;
  if (arch === 'sapo') {
    const by = 0.42; b.m(ctx.body, G.sph, ctx.skinM, [0, by, 0], [0.62, 0.42, 0.55]);
    b.m(ctx.body, G.sph, ctx.secM, [0, by - 0.1, 0.25], [0.5, 0.3, 0.35]);
    for (const sx of [1, -1]) { // pernas dobradas e mãos
      const hip = b.g(ctx.body, [sx * 0.45, 0.25, -0.1]); b.m(hip, G.sph, ctx.skinM, [0, 0, 0], [0.22, 0.24, 0.34]); b.m(hip, G.sph, ctx.darkM, [sx * 0.08, -0.2, 0.25], [0.18, 0.05, 0.22]); ctx.anim.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI });
      b.limb(ctx.body, ctx.skinM, V(sx * 0.35, 0.4, 0.3), V(sx * 0.4, 0.06, 0.45), 0.07); b.m(ctx.body, G.sph, ctx.darkM, [sx * 0.4, 0.03, 0.5], [0.1, 0.04, 0.12]);
    }
    head = b.g(ctx.body, [0, by + 0.35, 0.18]); hr = 0.46; ctx.anim.head = head;
    b.m(head, G.sph, ctx.skinM, [0, 0, 0], [hr * 1.15, hr * 0.7, hr]);
    b.m(head, G.cyl, mat('#2a1a24'), [0, -hr * 0.2, hr * 0.85], [hr * 0.7, 0.012, 0.02], [0, 0, Math.PI / 2]);
    for (const sx of [1, -1]) b.m(head, G.sph, ctx.skinM, [sx * hr * 0.55, hr * 0.5, hr * 0.25], hr * 0.32);
    eyes(ctx, head, hr, { x: hr * 0.55, y: hr * 0.55, z: hr * 0.45, size: hr * 0.24, slit: false, color: ctx.el ? ctx.glow : '#6b4a2b', fierce: 0.25, yaw: 0.35 });
    height = by + 0.35 + hr; top = V(0, hr * 0.75, -hr * 0.1); back = [V(0, by + 0.38, -0.15), V(0, by + 0.3, -0.35)]; footR = 0.75;
  } else if (arch === 'pinguim') {
    const by = 0.68; b.m(ctx.body, G.sph, ctx.skinM, [0, by, 0], [0.45, 0.62, 0.42]);
    b.m(ctx.body, G.sph, ctx.secM, [0, by - 0.05, 0.12], [0.36, 0.52, 0.34]);
    for (const sx of [1, -1]) { const f = b.g(ctx.body, [sx * 0.42, by + 0.15, 0]); b.m(f, G.sph, ctx.skinM, [sx * 0.05, -0.25, 0], [0.08, 0.36, 0.18], [0, 0, sx * 0.25]); ctx.anim.wings.push({ g: f, sx, flap: 0.3 });
      const ft = b.g(ctx.body, [sx * 0.18, 0.06, 0.12]); b.m(ft, G.sph, mat('#f0a020'), [0, 0, 0], [0.12, 0.05, 0.18]); ctx.anim.legs.push({ g: ft, ph: sx > 0 ? 0 : Math.PI }); }
    head = b.g(ctx.body, [0, by + 0.62, 0.02]); hr = s0 ? 0.36 : 0.3; ctx.anim.head = head;
    b.m(head, G.sph, ctx.skinM, [0, 0, 0], hr);
    b.m(head, G.cone, mat('#f0a020', { rough: 0.4 }), [0, -hr * 0.15, hr * 1.05], [hr * 0.22, hr * 0.6, hr * 0.18], [Math.PI / 2, 0, 0]);
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.1, hr * 0.55], [hr * 0.7, hr * 0.6, hr * 0.5]);
    eyes(ctx, head, hr, { x: hr * 0.4, y: hr * 0.2, z: hr * 0.78, size: hr * 0.2, color: ctx.el ? ctx.glow : '#3a2a1b', fierce: 0.45 });
    if (st >= 1) for (const sx of [1, -1]) b.m(head, SHAPES.feather, mat('#ffd23f', { rough: 0.6 }), [sx * hr * 0.5, hr * 0.45, hr * 0.3], [hr * 0.9, hr * 0.7, hr], [0, sx * 0.5, -sx * 1.1]);
    height = by + 0.62 + hr; top = V(0, hr, 0); back = [V(0, by + 0.4, -0.38), V(0, by, -0.42)]; footR = 0.55; ctx.chest = V(0, by + 0.15, 0.42);
  } else if (arch === 'macaco') {
    const by = 0.75; b.m(ctx.body, G.sph, ctx.skinM, [0, by, 0], [0.55, 0.5, 0.45]);
    b.m(ctx.body, G.sph, ctx.skinM, [0, by + 0.3, 0.05], [0.62, 0.38, 0.45]);
    b.m(ctx.body, G.sph, ctx.secM, [0, by + 0.05, 0.3], [0.38, 0.38, 0.22]);
    for (const sx of [1, -1]) { // braços longos até o chão
      const sh = b.g(ctx.body, [sx * 0.6, by + 0.45, 0.05]);
      b.limb(sh, ctx.skinM, V(0, 0, 0), V(sx * 0.18, -0.55, 0.15), 0.15); b.limb(sh, ctx.skinM, V(sx * 0.18, -0.55, 0.15), V(sx * 0.12, -by - 0.35, 0.3), 0.13);
      b.m(sh, G.sph, ctx.darkM, [sx * 0.12, -by - 0.38, 0.32], [0.17, 0.12, 0.2]); ctx.anim.wings.push({ g: sh, sx, flap: 0.12, axisX: true });
      const hip = b.g(ctx.body, [sx * 0.28, by - 0.3, -0.05]); b.limb(hip, ctx.skinM, V(0, 0, 0), V(0, -by + 0.36, 0.05), 0.14); b.m(hip, G.sph, ctx.darkM, [0, -by + 0.33, 0.12], [0.15, 0.08, 0.22]); ctx.anim.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI });
    }
    head = b.g(ctx.body, [0, by + 0.72, 0.18]); hr = s0 ? 0.4 : 0.32; ctx.anim.head = head;
    b.m(head, G.sph, ctx.skinM, [0, 0, 0], [hr, hr * 0.95, hr]);
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.25, hr * 0.62], [hr * 0.7, hr * 0.55, hr * 0.45]);
    b.m(head, G.box, ctx.darkM, [0, hr * 0.32, hr * 0.72], [hr * 1.3, hr * 0.18, hr * 0.3], [0.2, 0, 0]);
    b.m(head, G.sph, mat('#1c1620'), [0, -hr * 0.12, hr * 1.02], [hr * 0.18, hr * 0.1, hr * 0.08]);
    for (const sx of [1, -1]) b.m(head, G.sph, ctx.secM, [sx * hr * 0.95, 0, 0], [hr * 0.18, hr * 0.24, hr * 0.12]);
    eyes(ctx, head, hr, { x: hr * 0.36, y: hr * 0.1, z: hr * 0.78, size: hr * 0.17, color: ctx.el ? ctx.glow : '#6b4a2b', fierce: 0.15 });
    height = by + 0.72 + hr; top = V(0, hr * 0.95, 0); back = [V(0, by + 0.6, -0.3), V(0, by + 0.3, -0.42), V(0, by, -0.42)]; footR = 0.8; ctx.chest = V(0, by + 0.25, 0.42); ctx.shoulders = [V(0.62, by + 0.6, 0.05), V(-0.62, by + 0.6, 0.05)];
  } else if (arch === 'golem') {
    const by = 0.85; const chunk = (p, s, r) => b.m(ctx.body, G.dode, ctx.skinM, p, s, r);
    chunk([0, by, 0], [0.62, 0.55, 0.45], [0.2, 0.3, 0]); chunk([0, by + 0.45, 0], [0.8, 0.4, 0.5], [0, 0.6, 0.1]);
    b.m(ctx.body, G.oct, ctx.glowM, [0, by + 0.25, 0.42], [0.14, 0.18, 0.08]); // núcleo brilhante no peito
    for (const sx of [1, -1]) {
      const sh = b.g(ctx.body, [sx * 0.8, by + 0.5, 0]); chunk; b.m(sh, G.dode, ctx.skinM, [0, 0, 0], 0.26);
      b.m(sh, G.dode, ctx.skinM, [sx * 0.08, -0.42, 0.05], [0.2, 0.28, 0.2]); b.m(sh, G.dode, ctx.skinM, [sx * 0.1, -0.85, 0.12], [0.3, 0.26, 0.3], [0.5, 0.2, 0]); // punho
      ctx.anim.wings.push({ g: sh, sx, flap: 0.1, axisX: true });
      const hip = b.g(ctx.body, [sx * 0.3, by - 0.4, 0]); b.m(hip, G.dode, ctx.skinM, [0, -0.2, 0], [0.22, 0.25, 0.22]); b.m(hip, G.dode, ctx.skinM, [0, -by + 0.5, 0.05], [0.26, 0.15, 0.3]); ctx.anim.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI });
    }
    head = b.g(ctx.body, [0, by + 0.82, 0.05]); hr = s0 ? 0.32 : 0.26; ctx.anim.head = head;
    b.m(head, G.dode, ctx.skinM, [0, 0, 0], [hr * 1.1, hr, hr]);
    for (const sx of [1, -1]) b.m(head, G.sph, ctx.glowM, [sx * hr * 0.4, hr * 0.05, hr * 0.85], [hr * 0.17, hr * 0.1, hr * 0.06], [0, 0, sx * 0.3]);
    ctx.anim.eyes.push(head);
    ctx.shoulders = [V(0.8, by + 0.72, 0), V(-0.8, by + 0.72, 0)];
    height = by + 0.82 + hr; top = V(0, hr * 0.9, 0); back = [V(0, by + 0.75, -0.35), V(-0.4, by + 0.65, -0.3), V(0.4, by + 0.65, -0.3), V(0, by + 0.3, -0.45)]; footR = 0.95;
  } else { // dino (T-rex amigável)
    const hipY = 0.75; const body = b.g(ctx.body, [0, 0, 0], [0, 0, 0]);
    b.m(body, G.sph, ctx.skinM, [0, hipY + 0.2, 0], [0.42, 0.48, 0.6], [-0.5, 0, 0]);
    b.m(body, G.sph, ctx.secM, [0, hipY + 0.15, 0.28], [0.3, 0.36, 0.3], [-0.5, 0, 0]);
    for (const sx of [1, -1]) {
      const hip = b.g(body, [sx * 0.32, hipY, -0.1]);
      b.m(hip, G.sph, ctx.skinM, [0, -0.05, 0], [0.2, 0.32, 0.28]);
      b.limb(hip, ctx.skinM, V(0, -0.15, 0.05), V(0, -hipY + 0.12, -0.08), 0.11);
      b.m(hip, G.sph, ctx.darkM, [0, -hipY + 0.06, 0.08], [0.14, 0.07, 0.24]);
      for (const cx of [-1, 0, 1]) b.m(hip, G.cone, ctx.hornM, [cx * 0.07, -hipY + 0.05, 0.3], [0.025, 0.08, 0.025], [Math.PI / 2, 0, 0]);
      ctx.anim.legs.push({ g: hip, ph: sx > 0 ? 0 : Math.PI });
      b.limb(body, ctx.skinM, V(sx * 0.25, hipY + 0.45, 0.35), V(sx * 0.3, hipY + 0.25, 0.5), 0.045); // bracinhos
    }
    head = b.g(body, [0, hipY + 0.82, 0.48]); hr = s0 ? 0.38 : 0.3; ctx.anim.head = head;
    b.m(head, G.sph, ctx.skinM, [0, 0, 0], [hr, hr * 0.85, hr * 1.1]);
    b.m(head, G.sph, ctx.skinM, [0, -hr * 0.15, hr * 0.85], [hr * 0.75, hr * 0.55, hr * 0.75]);
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.45, hr * 0.75], [hr * 0.65, hr * 0.22, hr * 0.7]);
    for (let i = 0; i < 4; i++) for (const sx of [1, -1]) b.m(head, G.cone, mat('#ffffff', { rough: 0.3 }), [sx * hr * (0.45 - i * 0.04), -hr * 0.38, hr * (0.55 + i * 0.22)], [hr * 0.04, hr * 0.11, hr * 0.04], [Math.PI, 0, 0]);
    eyes(ctx, head, hr, { x: hr * 0.5, y: hr * 0.25, z: hr * 0.55, size: hr * 0.17, slit: true, color: ctx.glow, fierce: 0.45, yaw: 0.6 });
    const pts = [V(0, 0, 0), V(0, -0.1, -0.45), V(0.05, -0.25, -0.9), V(0, -0.4, -1.35 - st * 0.2)];
    const tg = b.g(body, [0, hipY + 0.15, -0.45]); b.m(tg, taperTube(pts, 0.3, 0.03), ctx.skinM); ctx.anim.tails.push(tg); tailTip = V(0, hipY - 0.25, -1.8);
    ctx.tailPts = pts.map((p) => p.clone().add(V(0, hipY + 0.15, -0.45)));
    ctx.chest = V(0, hipY + 0.3, 0.42);
    height = hipY + 0.82 + hr; top = V(0, hr * 0.85, -hr * 0.1); back = [V(0, hipY + 0.68, 0.15), V(0, hipY + 0.6, -0.1), V(0, hipY + 0.45, -0.35), V(0, hipY + 0.25, -0.6)]; footR = 1.0;
    for (const p of back) b.m(body, G.cone, ctx.hornM, [p.x, p.y, p.z], [0.06, 0.2 + st * 0.06, 0.06], [-0.4, 0, 0]);
  }
  return { height, head, headR: hr, top, back, backParent: ctx.body, tailTip, tailParent: ctx.body, footR, chest: ctx.chest, shoulders: ctx.shoulders };
}

// ---------- aves e morcegos (voam sobre o chão) ----------
function buildBird(ctx) {
  const { b, stage, arch } = ctx; const bat = arch === 'morcego', owl = arch === 'coruja';
  ctx.anim.float = owl ? 0.45 + stage * 0.1 : 0.75 + stage * 0.15;
  const body = b.g(ctx.body, [0, 0, 0]);
  b.m(body, G.sph, ctx.skinM, [0, 0, 0], [0.32, 0.36, 0.5], [0.25, 0, 0]);
  b.m(body, G.sph, ctx.secM, [0, -0.08, 0.15], [0.24, 0.26, 0.32], [0.25, 0, 0]);
  const head = b.g(body, owl ? [0, 0.42, 0.18] : [0, 0.32, 0.38]); const hr = (stage === 0 ? 0.32 : 0.26) * (owl ? 1.35 : 1); ctx.anim.head = head;
  b.m(head, G.sph, ctx.skinM, [0, 0, 0], hr);
  if (owl) {
    b.m(head, G.sph, ctx.secM, [0, -hr * 0.05, hr * 0.55], [hr * 0.85, hr * 0.7, hr * 0.5]);
    b.m(head, G.cone, mat('#e8b23a', { rough: 0.35 }), [0, -hr * 0.2, hr * 1.0], [hr * 0.12, hr * 0.3, hr * 0.12], [Math.PI / 2 + 0.6, 0, 0]);
    for (const sx of [1, -1]) b.m(head, SHAPES.feather, ctx.darkM, [sx * hr * 0.55, hr * 0.75, 0], [hr * 0.8, hr * (0.9 + stage * 0.3), hr], [0, 0, -sx * 0.4]);
  } else if (bat) {
    for (const sx of [1, -1]) b.m(head, SHAPES.ear, ctx.skinM, [sx * hr * 0.55, hr * 0.7, -hr * 0.1], [hr * 0.55, hr * 1.1, hr], [-0.2, sx * 0.3, -sx * 0.35]);
    b.m(head, G.sph, mat('#1c1620'), [0, -hr * 0.05, hr * 0.95], [hr * 0.14, hr * 0.1, hr * 0.08]);
    for (const sx of [1, -1]) b.m(head, G.cone, mat('#ffffff'), [sx * hr * 0.15, -hr * 0.42, hr * 0.82], [hr * 0.05, hr * 0.14, hr * 0.05], [Math.PI, 0, 0]);
  } else {
    const beakC = ctx.el === 'eletrico' ? '#3a3550' : '#e8b23a';
    b.m(head, G.cone, mat(beakC, { rough: 0.35 }), [0, -hr * 0.12, hr * 1.0], [hr * 0.25, hr * 0.65, hr * 0.28], [Math.PI / 2 + 0.3, 0, 0]);
    for (let i = 0; i < 3; i++) b.m(head, SHAPES.feather, ctx.skinM, [0, hr * 0.8, -hr * (0.1 + i * 0.25)], [hr * 0.9, hr * (1.1 - i * 0.2), hr], [-0.9 - i * 0.3, 0, 0]);
  }
  eyes(ctx, head, hr, { x: hr * (owl ? 0.38 : 0.45), y: hr * 0.15, z: hr * 0.72, size: hr * (owl ? 0.28 : 0.2), color: owl ? '#ffb020' : ctx.glow, fierce: owl ? 0.25 : 0.55 });
  wings(ctx, body, V(0, 0.15, 0.05), bat ? 'membrana' : 'penas', (0.8 + stage * 0.35) * (owl ? 0.8 : 1));
  // cauda de penas e garras
  ctx.chest = V(0, 0.05, 0.42);
  if (!bat) for (let i = 0; i < 5; i++) b.m(body, SHAPES.feather, i % 2 ? ctx.secM : ctx.skinM, [(i - 2) * 0.06, -0.05, -0.45], [0.35, 0.6 + stage * 0.15, 0.5], [-Math.PI / 2 - 0.3, 0, (i - 2) * 0.35]);
  for (const sx of [1, -1]) { const leg = b.g(body, [sx * 0.12, -0.3, 0.05]); b.limb(leg, mat('#e8b23a'), V(0, 0, 0), V(0, -0.18, 0.05), 0.035); for (const cx of [-1, 0, 1]) b.m(leg, G.cone, ctx.hornM, [cx * 0.04, -0.22, 0.1], [0.018, 0.08, 0.018], [Math.PI / 2, 0, 0]); ctx.anim.legs.push({ g: leg, ph: 0, tucked: true }); }
  const lift = ctx.anim.float;
  return { height: lift + 0.6 + (owl ? 0.25 : 0), head, headR: hr, top: V(0, hr, 0), back: [V(0, 0.3, -0.05), V(0, 0.25, -0.3)], backParent: body, tailTip: V(0, -0.1, -0.7), tailParent: body, footR: 0.7, chest: ctx.chest, bodyParent: body };
}

// ---------- peixes e arraias ----------
function buildFish(ctx) {
  const { b, stage, arch } = ctx; ctx.anim.float = 0.7 + stage * 0.1;
  const body = b.g(ctx.body, [0, 0, 0]);
  const finM = mat(ctx.c2, { rough: 0.4, op: 0.9, glow: 0.15, emis: ctx.glow });
  let head, hr;
  if (arch === 'arraia') {
    const w = 0.9 + stage * 0.25;
    b.m(body, G.sph, ctx.skinM, [0, 0, 0], [0.35, 0.12, 0.45]);
    for (const sx of [1, -1]) { const g = b.g(body, [sx * 0.2, 0, 0]); b.m(g, G.sph, ctx.skinM, [sx * w * 0.42, 0, -0.05], [w * 0.5, 0.05, 0.4], [0, sx * 0.25, 0]); ctx.anim.wings.push({ g, sx, flap: 0.35, slow: true }); }
    b.m(body, G.sph, ctx.secM, [0, -0.05, 0.05], [0.3, 0.06, 0.38]);
    const tail = b.g(body, [0, 0, -0.42]); b.m(tail, taperTube([V(0, 0, 0), V(0, 0.05, -0.4), V(0, 0.15, -0.9 - stage * 0.3)], 0.05, 0.01), ctx.skinM); ctx.anim.tails.push(tail);
    head = b.g(body, [0, 0.04, 0.4]); hr = 0.2; ctx.anim.head = head;
    eyes(ctx, head, hr, { x: hr * 0.6, y: hr * 0.25, z: 0, size: hr * 0.3, color: ctx.glow, fierce: 0.4, yaw: 0.9 });
    for (const sx of [1, -1]) b.m(head, G.cone, ctx.skinM, [sx * 0.12, 0, 0.12], [0.05, 0.2, 0.04], [Math.PI / 2, 0, -sx * 0.3]);
    return { height: ctx.anim.float + 0.3, head, headR: hr, top: V(0, hr, 0), back: [V(0, 0.12, 0), V(0, 0.1, -0.2)], backParent: body, tailTip: V(0, 0.15, -1.4), tailParent: body, footR: w * 0.9 };
  }
  const shark = arch === 'tubarao'; const L = (shark ? 0.85 : 0.6) + stage * 0.1;
  b.m(body, G.sph, ctx.skinM, [0, 0, 0], shark ? [0.32, 0.32, L] : [0.3, 0.38, L]);
  b.m(body, G.sph, ctx.secM, [0, -0.12, 0.05], [0.24, 0.24, L * 0.8]);
  b.m(body, SHAPES.fin, finM, [0, 0.28, shark ? -0.05 : 0.1], shark ? [0.9 + stage * 0.2, 0.9 + stage * 0.2, 1] : [0.5 + stage * 0.15, 0.5 + stage * 0.15, 1], [0, Math.PI / 2, shark ? 0.3 : 0]);
  for (const sx of [1, -1]) { const g = b.g(body, [sx * 0.27, -0.1, 0.15]); b.m(g, SHAPES.fin, finM, [0, 0, 0], 0.35, [0, sx * 1.2, -sx * 0.6]); ctx.anim.wings.push({ g, sx, flap: 0.4 }); }
  const tail = b.g(body, [0, 0, -L * 0.95]); ctx.anim.tails.push(tail);
  for (const sy of [1, -1]) b.m(tail, SHAPES.fin, finM, [0, 0, -0.05], [0.55 + stage * 0.2, sy * (0.55 + stage * 0.2), 1], [0, -Math.PI / 2, 0]);
  head = b.g(body, [0, 0.05, L * 0.55]); hr = 0.28; ctx.anim.head = head;
  eyes(ctx, head, hr, { x: hr * 0.75, y: hr * 0.2, z: hr * 0.35, size: hr * 0.25, color: ctx.glow, fierce: 0.4, yaw: 0.9 });
  b.m(head, G.sph, darkLip(ctx), [0, -hr * 0.2, hr * 0.9], [hr * 0.3, hr * 0.12, hr * 0.1]);
  if (shark) for (let i = 0; i < 5; i++) b.m(head, G.cone, mat('#ffffff', { rough: 0.3 }), [(i - 2) * hr * 0.12, -hr * 0.12, hr * 0.95], [hr * 0.04, hr * 0.1, hr * 0.04], [Math.PI, 0, 0]);
  ctx.chest = V(0, -0.05, L * 0.7);
  if (stage === 2) for (const sx of [1, -1]) b.m(head, G.cone, ctx.hornM, [sx * hr * 0.4, hr * 0.5, hr * 0.2], [0.04, 0.22, 0.04], [-0.4, 0, -sx * 0.4]);
  return { height: ctx.anim.float + 0.55, head, headR: hr, top: V(0, hr * 0.9, 0), back: [V(0, 0.35, 0), V(0, 0.32, -0.25)], backParent: body, tailTip: V(0, 0, -L - 0.3), tailParent: body, footR: 0.75 + (shark ? 0.2 : 0), chest: ctx.chest };
}
const darkLip = (ctx) => mat(shade(ctx.c1, 0, 0, -0.3));

// ---------- serpentes e enguias (corpo ondulando) ----------
function buildSerpent(ctx) {
  const { b, stage, arch } = ctx; ctx.anim.float = 0.35 + stage * 0.1;
  const n = 14 + stage * 4; const segs = [];
  const body = b.g(ctx.body, [0, 0, 0]);
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1); const r = (0.27 + stage * 0.03) * (1 - k * 0.72);
    const L = 1.5 + stage * 0.45;
    const m = b.m(body, G.sph, i % 3 === 0 ? ctx.secM : ctx.skinM, [Math.sin(k * 3.4) * 0.32 * k, 0.5 * (1 - k) * (1 - k), -k * L * 0.8], [r, r * 0.92, r * 1.25]);
    if (i % 3 === 0 && i > 1 && arch === 'serpente') { const f = b.m(m, SHAPES.fin, mat(ctx.c2, { op: 0.9, glow: 0.2, emis: ctx.glow }), [0, 0.7, 0], [0.9, 0.9, 1], [0, Math.PI / 2, 0]); }
    segs.push({ m, k, z: m.position.z });
  }
  ctx.anim.wave = segs;
  const head = b.g(body, [0, 0.62, 0.22]); const hr = 0.3 + stage * 0.03; ctx.anim.head = head;
  b.m(head, G.sph, ctx.skinM, [0, 0, 0], [hr, hr * 0.8, hr * 1.15]);
  b.m(head, G.sph, ctx.skinM, [0, -hr * 0.12, hr * 0.8], [hr * 0.6, hr * 0.45, hr * 0.6]);
  eyes(ctx, head, hr, { x: hr * 0.55, y: hr * 0.3, z: hr * 0.55, size: hr * 0.2, slit: true, color: ctx.glow, fierce: 0.5, yaw: 0.6 });
  if (arch === 'serpente') { // bigodes e chifres de dragão oriental
    for (const sx of [1, -1]) { b.m(head, taperTube([V(0, 0, 0), V(sx * 0.2, -0.05, 0.1), V(sx * 0.45, -0.2, -0.05)], 0.02, 0.008), ctx.hornM, [sx * hr * 0.3, -hr * 0.2, hr * 1.1]); b.m(head, taperTube([V(0, 0, 0), V(sx * 0.08, 0.2, -0.15), V(sx * 0.12, 0.35 + stage * 0.15, -0.4)], hr * 0.08, 0.01), ctx.hornM, [sx * hr * 0.35, hr * 0.55, -hr * 0.2]); }
  } else for (const sx of [1, -1]) b.m(head, SHAPES.fin, mat(ctx.c2, { glow: 0.3, emis: ctx.glow }), [sx * hr * 0.7, 0, -hr * 0.4], 0.3, [0, sx * 1.4, 0]);
  return { height: ctx.anim.float + 1.0, head, headR: hr, top: V(0, hr * 0.8, 0), back: segs.filter((s, i) => i % 4 === 2).map((s) => V(s.m.position.x, s.m.position.y + 0.2, s.z)), backParent: body, tailTip: V(0, 0, segs[n - 1].z - 0.1), tailParent: body, footR: 1.0, segs };
}

// ---------- insetos ----------
function buildInsect(ctx) {
  const { b, stage, arch } = ctx;
  if (arch === 'mariposa') {
    ctx.anim.float = 0.8;
    const body = b.g(ctx.body, [0, 0, 0]);
    b.m(body, G.sph, ctx.skinM, [0, 0, 0], [0.16, 0.18, 0.45]);
    b.m(body, G.sph, ctx.secM, [0, 0.05, 0.3], [0.2, 0.2, 0.2]);
    const head = b.g(body, [0, 0.08, 0.5]); const hr = 0.2; ctx.anim.head = head;
    b.m(head, G.sph, ctx.skinM, [0, 0, 0], hr);
    eyes(ctx, head, hr, { x: hr * 0.6, y: hr * 0.1, z: hr * 0.5, size: hr * 0.38, color: ctx.glow, fierce: 0.15, yaw: 0.8, glowEyes: true });
    for (const sx of [1, -1]) { const a = b.g(head, [sx * hr * 0.3, hr * 0.8, hr * 0.2]); b.m(a, taperTube([V(0, 0, 0), V(sx * 0.1, 0.25, 0.08), V(sx * 0.25, 0.4, 0)], 0.015, 0.008), ctx.darkM); for (let i = 0; i < 5; i++) b.m(a, SHAPES.feather, ctx.secM, [sx * (0.05 + i * 0.04), 0.15 + i * 0.05, 0.06], [0.12, 0.18, 0.2], [0, 0, -sx * 1.3]); }
    const wingM = mat(ctx.c1, { kind: 'pele', c2: ctx.c2, over: ctx.el === 'cosmo' ? 'cosmo' : null, pat: 'manchas', seed: 21, rough: 0.5, op: 0.95 });
    const s = 0.85 + stage * 0.35;
    for (const sx of [1, -1]) {
      const g = b.g(body, [sx * 0.1, 0.12, 0.15]);
      b.m(g, SHAPES.mothWing, wingM, [0, 0, 0], [sx * s, s, s], [0.25, -sx * 0.2, 0]);
      b.m(g, SHAPES.mothWing2, wingM, [0, -0.02, -0.03], [sx * s * 0.9, s * 0.9, s], [0.25, -sx * 0.2, 0]);
      b.m(g, G.sph, ctx.glowM, [sx * 0.6 * s, 0.5 * s, 0.03], [0.08 * s, 0.08 * s, 0.02]);
      ctx.anim.wings.push({ g, sx, flap: 0.5, axisZ: true });
    }
    return { height: 1.4, head, headR: hr, top: V(0, hr, 0), back: [V(0, 0.18, 0)], backParent: body, tailTip: V(0, 0, -0.5), tailParent: body, footR: 0.9 };
  }
  // besouro (chifre de rinoceronte)
  const body = b.g(ctx.body, [0, 0, 0]); const L = 0.62 + stage * 0.08; const y = 0.42;
  b.m(body, G.sph, ctx.darkM, [0, y - 0.05, 0], [0.42, 0.25, L]);
  const shellM = ctx.skinM;
  for (const sx of [1, -1]) { const e = b.g(body, [sx * 0.005, y + 0.02, -0.08]); b.m(e, G.dome, shellM, [0, 0, 0], [0.24, 0.42 + stage * 0.05, L * 0.95], [0, 0, 0]).position.x = sx * 0.2; ctx.anim.wings.push({ g: e, sx, flap: 0.05, axisZ: true }); }
  b.m(body, G.sph, ctx.skinM, [0, y + 0.05, L * 0.62], [0.32, 0.22, 0.22]);
  for (const sx of [1, -1]) for (const z of [-0.25, 0.05, 0.35]) { const leg = b.g(body, [sx * 0.32, y - 0.1, z * L]); b.limb(leg, ctx.darkM, V(0, 0, 0), V(sx * 0.25, 0.05, 0.05), 0.035); b.limb(leg, ctx.darkM, V(sx * 0.25, 0.05, 0.05), V(sx * 0.38, -y + 0.12, 0.1), 0.03); ctx.anim.legs.push({ g: leg, ph: (sx > 0 ? 0 : Math.PI) + z * 4 }); }
  const head = b.g(body, [0, y, L * 0.85]); const hr = 0.2; ctx.anim.head = head;
  b.m(head, G.sph, ctx.darkM, [0, 0, 0], hr);
  if (arch === 'escorpiao') {
    for (const sx of [1, -1]) { const cl = b.g(head, [sx * hr * 0.7, -hr * 0.1, hr * 0.3]); b.limb(cl, ctx.darkM, V(0, 0, 0), V(sx * 0.15, 0, 0.3), 0.05); for (const sy of [1, -1]) b.m(cl, G.cone, ctx.skinM, [sx * 0.15, sy * 0.05, 0.42], [0.06, 0.25 + stage * 0.06, 0.05], [Math.PI / 2 - sy * 0.3, 0, 0]); ctx.anim.wings.push({ g: cl, sx, flap: 0.15, axisZ: true }); }
    const tg = b.g(body, [0, y + 0.1, -L * 0.85]); const pts = [V(0, 0, 0), V(0, 0.35, -0.25), V(0, 0.8 + stage * 0.15, -0.05), V(0, 0.95 + stage * 0.2, 0.35)];
    b.m(tg, taperTube(pts, 0.1, 0.05), ctx.skinM); b.m(tg, G.cone, ctx.hornM, [0, 0.9 + stage * 0.2, 0.5], [0.06, 0.25, 0.06], [Math.PI / 2 + 0.8, 0, 0]); ctx.anim.tails.push(tg);
  } else b.m(head, taperTube([V(0, 0, 0), V(0, 0.15, 0.2), V(0, 0.45 + stage * 0.2, 0.25), V(0, 0.6 + stage * 0.25, 0.05)], 0.07, 0.015), ctx.hornM, [0, hr * 0.3, hr * 0.5]);
  if (stage >= 1 && arch !== 'escorpiao') b.m(body, taperTube([V(0, 0, 0), V(0, 0.15, 0.15), V(0, 0.25, 0.3)], 0.05, 0.01), ctx.hornM, [0, y + 0.22, L * 0.6]);
  eyes(ctx, head, hr, { x: hr * 0.62, y: hr * 0.15, z: hr * 0.6, size: hr * 0.25, color: ctx.glow, fierce: 0.3, yaw: 0.7, glowEyes: true });
  return { height: y + 0.6 + stage * 0.2 + (arch === 'escorpiao' ? 0.4 : 0), head, headR: hr, top: V(0, hr, 0), back: [V(0, y + 0.42, 0), V(-0.2, y + 0.38, -0.2), V(0.2, y + 0.38, -0.2)], backParent: body, tailTip: arch === 'escorpiao' ? null : V(0, y, -L), tailParent: body, footR: 0.85 };
}

// ---------- espírito (água-viva) ----------
function buildSpirit(ctx) {
  const { b, stage, arch } = ctx; const oct = arch === 'polvo'; ctx.anim.float = oct ? 0.75 : 0.9;
  const body = b.g(ctx.body, [0, 0, 0]);
  const R0 = (oct ? 0.5 : 0.45) + stage * 0.1;
  if (oct) b.m(body, G.sph, ctx.skinM, [0, R0 * 0.35, -R0 * 0.1], [R0, R0 * 1.15, R0 * 1.05], [-0.25, 0, 0]);
  else { b.m(body, G.dome, ctx.skinM, [0, 0, 0], [R0, R0 * 0.85, R0]); b.m(body, G.sph, ctx.glowM, [0, R0 * 0.2, 0], R0 * 0.35); }
  const head = b.g(body, [0, R0 * 0.3, R0 * 0.7]); ctx.anim.head = head;
  eyes(ctx, head, R0, { x: R0 * (oct ? 0.4 : 0.28), y: oct ? -R0 * 0.05 : 0, z: oct ? R0 * 0.2 : 0, size: R0 * (oct ? 0.2 : 0.14), color: ctx.glow, fierce: oct ? 0.45 : 0.2, yaw: 0.3, glowEyes: !oct, slit: oct });
  const tents = [];
  const n = oct ? 8 : 6 + stage * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2; const g = b.g(body, [Math.cos(a) * R0 * 0.7, 0, Math.sin(a) * R0 * 0.7]);
    if (oct) b.m(g, taperTube([V(0, 0, 0), V(Math.cos(a) * 0.25, -0.3, Math.sin(a) * 0.25), V(Math.cos(a) * 0.55, -0.55, Math.sin(a) * 0.55), V(Math.cos(a) * 0.75, -0.45 + stage * 0.05, Math.sin(a) * 0.75)].map((v) => v.multiplyScalar(1 + stage * 0.2)), 0.11, 0.025), ctx.skinM);
    else b.m(g, taperTube([V(0, 0, 0), V(Math.cos(a) * 0.05, -0.3, Math.sin(a) * 0.05), V(0, -0.6 - stage * 0.15, 0), V(Math.cos(a) * 0.08, -0.9 - stage * 0.25, Math.sin(a) * 0.08)], 0.05, 0.01), mat(ctx.c2, { op: 0.75, glow: 0.5, emis: ctx.glow }));
    tents.push({ g, ph: i });
  }
  ctx.anim.tentacles = tents;
  if (!oct) b.m(body, G.ring, ctx.glowM, [0, 0.02, 0], [R0 * 1.01, R0 * 1.01, 1], [Math.PI / 2, 0, 0]);
  return { height: 0.9 + R0, head: body, headR: R0, top: V(0, R0 * 0.85, 0), back: [V(0, R0 * 0.8, 0)], backParent: body, tailTip: null, footR: R0 * 1.3 };
}

// ---------- peças do elemento ----------
function orbit(ctx, parent, n, y, radius, fn, speed = 0.8) {
  const g = ctx.b.g(parent, [0, y, 0]);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const c = ctx.b.g(g, [Math.cos(a) * radius, Math.sin(i * 2.1) * 0.12, Math.sin(a) * radius]); fn(c, i); }
  ctx.anim.spin.push({ g, speed, axis: 'y' });
}
function elementParts(ctx, R) {
  const { b, el, stage } = ctx; const head = R.head, hr = R.headR; const backP = R.backParent;
  const top = R.top.toArray();
  const nb = Math.min(R.back.length, 2 + stage);
  const backs = R.back.slice(0, nb);
  switch (el) {
    case 'planta': {
      const lm = mat('#6fbf3a', { rough: 0.6 }); const lm2 = mat('#4f9d3a', { rough: 0.6 });
      const g = b.g(head, top); for (const sx of [1, -1]) b.m(g, SHAPES.leaf, sx > 0 ? lm : lm2, [0, 0, 0], hr * (0.6 + stage * 0.2), [0, 0, -sx * 0.5]);
      ctx.anim.spin.push({ g, wob: true });
      for (const p of backs) { const lg = b.g(backP, p.toArray()); for (let i = 0; i < 3; i++) b.m(lg, SHAPES.leaf, i % 2 ? lm : lm2, [0, 0, 0], 0.25 + stage * 0.1, [-0.6, (i / 3) * Math.PI * 2, 0.6]); }
      if (stage === 2) { const f = b.g(head, [hr * 0.5, hr * 0.6, hr * 0.2]); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; b.m(f, G.sph, mat('#ffd34d'), [Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0], [0.06, 0.06, 0.02]); } }
      break; }
    case 'agua': {
      const fm = mat('#9fe0ff', { rough: 0.3, op: 0.85, glow: 0.3, emis: '#6ff0ff' });
      if (!['peixe', 'arraia', 'serpente', 'enguia'].includes(ctx.arch)) { b.m(head, SHAPES.fin, fm, [0, hr * 0.7, -hr * 0.2], [hr * 1.1, hr * 1.1, 1], [0, Math.PI / 2, 0.3]); for (const p of backs) b.m(backP, SHAPES.fin, fm, p.toArray(), [0.35 + stage * 0.1, 0.35 + stage * 0.1, 1], [0, Math.PI / 2, 0]); }
      if (stage === 2) orbit(ctx, ctx.body, 5, R.height * 0.5, R.footR, (g, i) => b.m(g, G.sph, mat('#cdf3ff', { op: 0.5, rough: 0.1 }), [0, 0, 0], 0.06 + (i % 2) * 0.03));
      break; }
    case 'fogo': {
      const tip = R.tailTip;
      if (tip && R.tailParent) { const fg = b.g(R.tailParent, tip.toArray()); for (let i = 0; i < 3; i++) { const f = b.m(fg, SHAPES.flame, mat(i ? '#ffcc33' : '#ff5a1a', { glow: 1.6, emis: i ? '#ffcc33' : '#ff5a1a' }), [0, 0, 0], 0.25 + stage * 0.08 - i * 0.05, [0, i * 1.1, 0]); f.castShadow = false; ctx.anim.flames.push(f); } }
      if (!(ctx.arch === 'felino')) { const fg = b.g(head, top); for (let i = 0; i < 2 + stage; i++) { const f = b.m(fg, SHAPES.flame, mat(i % 2 ? '#ffcc33' : '#ff6a2a', { glow: 1.6, emis: '#ff7a1a' }), [(i - (1 + stage) / 2) * hr * 0.25, 0, -i * 0.03], hr * (0.6 + stage * 0.15), [0, 0, (i - (1 + stage) / 2) * 0.3]); f.castShadow = false; ctx.anim.flames.push(f); } }
      break; }
    case 'vento': {
      const wm = mat('#ffffff', { rough: 0.9 });
      for (const p of backs) { const c = b.g(backP, p.toArray()); for (let i = 0; i < 3; i++) b.m(c, G.sph, wm, [i * 0.1 - 0.1, 0.05, Math.sin(i) * 0.05], 0.1 + stage * 0.03); }
      if (!['ave', 'morcego', 'dragao', 'grifo', 'mariposa'].includes(ctx.arch)) for (const sx of [1, -1]) b.m(head, SHAPES.feather, wm, [sx * hr * 0.45, hr * 0.55, -hr * 0.2], [hr * 0.8, hr, hr], [-0.5, 0, -sx * 0.6]);
      if (stage >= 1) { const ring = b.m(ctx.body, G.ring, mat('#e8f7ff', { op: 0.5 }), [0, R.height * 0.45, 0], [R.footR * 0.9, R.footR * 0.9, 1], [Math.PI / 2.2, 0, 0]); ring.castShadow = false; ctx.anim.spin.push({ g: ring, speed: 1.4, axis: 'z' }); }
      break; }
    case 'gelo': {
      const im = mat('#dffaff', { rough: 0.1, op: 0.85, glow: 0.25, emis: '#b8f4ff' });
      for (const p of backs) { const g = b.g(backP, p.toArray()); for (let i = 0; i < 2 + stage; i++) b.m(g, G.oct, im, [(i - 1) * 0.08, 0.1, (i % 2) * 0.05], [0.06 + stage * 0.02, 0.18 + stage * 0.08, 0.06 + stage * 0.02], [0, 0, (i - 1) * 0.35]); }
      if (!ctx.arch.match(/cervo|golem/)) b.m(head, G.oct, im, top, [hr * 0.14, hr * (0.45 + stage * 0.2), hr * 0.14]);
      break; }
    case 'pedra': {
      const rm = mat(ctx.c2, { kind: 'pedra', seed: 7, rough: 0.9, flat: true });
      const gm = mat(ctx.glow, { glow: 0.7, rough: 0.2 });
      for (const p of backs) b.m(backP, G.dode, rm, [p.x, p.y + 0.03, p.z], [0.12 + stage * 0.04, 0.09 + stage * 0.03, 0.14 + stage * 0.04], [p.z * 3, p.z * 2, 0]);
      if (stage >= 1) b.m(head, G.oct, gm, [0, hr * 0.55, hr * 0.7], [hr * 0.12, hr * 0.16, hr * 0.08]);
      if (stage === 2 && backs[0]) b.m(backP, G.oct, gm, [backs[0].x, backs[0].y + 0.2, backs[0].z], [0.07, 0.2, 0.07]);
      break; }
    case 'eletrico': {
      const bm = mat('#fff27a', { glow: 1.4, emis: '#ffe23a', rough: 0.3 });
      const bg = b.g(head, top, [0, Math.PI / 2, 0]);
      const bolt = b.m(bg, SHAPES.bolt, bm, [0, hr * (0.25 + stage * 0.08), 0], hr * (0.35 + stage * 0.12)); bolt.castShadow = false;
      if (R.tailTip && R.tailParent) { const t = b.m(R.tailParent, SHAPES.bolt, bm, R.tailTip.toArray(), 0.22 + stage * 0.08, [0, Math.PI / 2, 0.6]); t.castShadow = false; ctx.anim.spin.push({ g: t, wob: true }); }
      ctx.sparks = true;
      break; }
    case 'cosmo': {
      const sm = mat('#fff6d6', { glow: 2 });
      orbit(ctx, ctx.body, 3 + stage * 2, R.height * 0.8, R.footR * 0.75, (g) => { const s = b.m(g, SHAPES.star, sm, [0, 0, 0], 0.05 + stage * 0.015); s.castShadow = false; }, 0.6);
      if (stage >= 1) { const ring = b.m(head, G.ring, mat('#c9b6ff', { glow: 0.8, op: 0.8 }), [0, hr * 0.2, 0], [hr * 1.5, hr * 1.5, 1], [Math.PI / 2 - 0.35, 0, 0.2]); ring.castShadow = false; }
      break; }
    case 'trovao': {
      const bm = mat('#7df9ff', { glow: 1.6, emis: '#7df9ff' });
      const g = b.g(head, top, [0, Math.PI / 2, 0]); for (let i = -1; i <= 1; i++) { const s = b.m(g, SHAPES.bolt, bm, [0, hr * 0.3, i * hr * 0.35], hr * (0.3 + stage * 0.1) * (i ? 0.7 : 1), [i * 0.3, 0, 0]); s.castShadow = false; }
      for (const p of backs) { const s = b.m(backP, SHAPES.bolt, bm, [p.x, p.y + 0.1, p.z], 0.14 + stage * 0.06, [0, Math.PI / 2, 0]); s.castShadow = false; }
      orbit(ctx, ctx.body, 4, R.height * 0.6, R.footR, (gg) => { const s = b.m(gg, SHAPES.bolt, bm, [0, 0, 0], 0.08); s.castShadow = false; }, 1.2);
      ctx.sparks = true;
      break; }
  }
}

// ---------- a evolução: crista no Jovem; armadura, emblema e marcas brilhantes no Adulto ----------
function armor(ctx, R) {
  const { b, stage, el } = ctx; if (stage === 0) return;
  const hr = R.headR; const head = R.head;
  const glowS = { glow: 1.6, emis: ctx.glow };
  // crista na cabeça (cresce no adulto)
  const crest = b.g(head, R.top.toArray());
  const n = stage === 1 ? 2 : 4;
  for (let i = 0; i < n; i++) b.m(crest, G.cone, ctx.hornM, [0, hr * 0.05, -i * hr * 0.25], [hr * 0.07, hr * (0.35 - i * 0.05) * (stage === 2 ? 1.6 : 1), hr * 0.07], [-0.5 - i * 0.25, 0, 0]);
  if (stage < 2) return;
  const armM = mat(shade(ctx.c1, 0.02, -0.15, -0.25), { rough: 0.3, metal: 0.75 });
  const trimM = mat(ctx.glow, glowS);
  // ombreiras / placas
  for (const p of R.shoulders || []) {
    const sh = b.m(R.backParent, G.dome, armM, p.toArray(), [0.2, 0.15, 0.22], [0, 0, p.x > 0 ? -0.5 : 0.5]);
    b.m(R.backParent, G.ring, trimM, p.toArray(), [0.2, 0.2, 1], [Math.PI / 2, 0, p.x > 0 ? -0.5 : 0.5]).castShadow = false;
  }
  // emblema do elemento no peito
  const shape = { planta: SHAPES.leaf, fogo: SHAPES.flame, eletrico: SHAPES.bolt, trovao: SHAPES.bolt, cosmo: SHAPES.star, vento: SHAPES.feather }[el];
  const at = R.chest || V(0, R.height * 0.45, 0.45);
  const em = shape ? b.m(R.backParent, shape, trimM, at.toArray(), 0.14) : b.m(R.backParent, el === 'pedra' ? G.dode : el === 'gelo' ? G.oct : G.sph, trimM, at.toArray(), [0.09, 0.12, 0.05]);
  em.castShadow = false;
  // placas brilhantes nas costas
  for (const p of R.back.slice(0, 3)) b.m(R.backParent, G.oct, trimM, [p.x, p.y + 0.02, p.z], [0.05, 0.12, 0.05]).castShadow = false;
  // faixa brilhante na testa
  b.m(head, G.box, trimM, [0, hr * 0.45, hr * 0.82], [hr * 0.5, hr * 0.06, hr * 0.06], [0.35, 0, 0]).castShadow = false;
  // aura de partículas subindo
  orbit(ctx, ctx.body, 6, R.height * 0.35, (R.footR || 0.8) * 0.85, (g) => { const s = b.m(g, G.oct, mat(ctx.glow, { glow: 2 }), [0, 0, 0], 0.04); s.castShadow = false; }, 1.1);
}
function hat(b, head, R, kind) {
  const t = R * 0.85;
  const m = (c) => mat(c, { rough: 0.7 });
  switch (kind) {
    case 'palha': b.m(head, G.cyl, m('#e8c46a'), [0, t, 0], [R * 1.2, 0.03, R * 1.2], [-0.1, 0, 0]); b.m(head, G.cyl, m('#e8c46a'), [0, t + 0.1, 0], [R * 0.6, 0.2, R * 0.6], [-0.1, 0, 0]); b.m(head, G.cyl, m('#c0392b'), [0, t + 0.04, 0], [R * 0.62, 0.05, R * 0.62], [-0.1, 0, 0]); break;
    case 'marinheiro': b.m(head, G.cyl, m('#ffffff'), [0, t + 0.04, 0], [R * 0.65, 0.16, R * 0.65], [-0.15, 0, 0]); b.m(head, G.cyl, m('#2b3550'), [0, t, R * 0.4], [R * 0.45, 0.03, R * 0.3], [0.2, 0, 0]); break;
    case 'bone': b.m(head, G.dome, m('#d9534f'), [0, t - 0.08, 0], [R * 0.78, R * 0.55, R * 0.78]); b.m(head, G.cyl, m('#d9534f'), [0, t - 0.08, R * 0.7], [R * 0.45, 0.03, R * 0.35], [0.1, 0, 0]); break;
    case 'touca': b.m(head, G.dome, m('#7a5a3a'), [0, t - 0.1, 0], [R * 0.85, R * 0.6, R * 0.85]); for (const sx of [1, -1]) b.m(head, G.sph, m('#3a5a7a'), [sx * R * 0.4, t + 0.05, R * 0.55], [R * 0.2, R * 0.12, R * 0.08]); break;
    case 'gorro': b.m(head, G.dome, m('#3a6fd1'), [0, t - 0.1, 0], [R * 0.85, R * 0.75, R * 0.85]); b.m(head, G.sph, m('#ffffff'), [0, t + R * 0.62, 0], R * 0.18); break;
    case 'capacete': b.m(head, G.dome, mat('#f2c21b', { rough: 0.35, metal: 0.3 }), [0, t - 0.1, 0], [R * 0.88, R * 0.6, R * 0.88]); b.m(head, G.cyl, mat('#fff6c2', { glow: 2 }), [0, t + 0.05, R * 0.78], [0.07, 0.05, 0.07], [Math.PI / 2, 0, 0]); break;
    case 'estrela': b.m(head, G.sph, mat('#cfe8ff', { op: 0.35, rough: 0.05 }), [0, 0, 0], R * 1.35); break;
  }
}

// ---------- fantasias dos bichos de época ----------
function costume(ctx, R, kind) {
  const { b } = ctx; const head = R.head, hr = R.headR; const t = hr * 0.85;
  const m = (c, o = {}) => mat(c, { rough: 0.6, ...o });
  const E = ctx.eyeAt && ctx.eyeAt.head === head ? ctx.eyeAt : { x: hr * 0.45, y: hr * 0.18, z: hr * 0.72, r: hr };
  switch (kind) {
    case 'gorro_natal': { const g = b.g(head, [0, t * 0.9, -hr * 0.05], [-0.35, 0, 0.2]); b.m(g, G.cone, m('#e2403a'), [0, hr * 0.45, 0], [hr * 0.72, hr * 1.1, hr * 0.72]); b.m(g, G.cyl, m('#ffffff', { rough: 0.95 }), [0, 0, 0], [hr * 0.78, hr * 0.22, hr * 0.78]); b.m(g, G.sph, m('#ffffff', { rough: 0.95 }), [0, hr * 1.02, 0], hr * 0.2); break; }
    case 'cachecol': { const r1 = b.m(head, G.ring, m('#e2403a'), [0, -hr * 0.78, -hr * 0.05], [hr * 0.72, hr * 0.72, 5], [Math.PI / 2, 0, 0]); r1.castShadow = false; b.m(head, G.box, m('#2f9a55'), [hr * 0.35, -hr * 1.05, hr * 0.45], [hr * 0.25, hr * 0.55, hr * 0.08], [0.2, 0, 0.15]); break; }
    case 'rena': { const n = ctx.nose || [0, -hr * 0.1, hr * 1.02]; b.m(head, G.sph, mat('#ff2a2a', { glow: 1.4, emis: '#ff2a2a', rough: 0.3 }), n, hr * 0.2).castShadow = false; b.m(head, G.sph, mat('#ffd34d', { metal: 0.8, rough: 0.25 }), [0, -hr * 0.95, hr * 0.3], hr * 0.18); break; }
    case 'oculos': { const fm = m('#e2403a', { rough: 0.3 }); for (const sx of [1, -1]) { b.m(head, G.cyl, mat('#141820', { rough: 0.1, metal: 0.4 }), [sx * E.x, E.y, E.z + hr * 0.08], [E.r * 0.24, 0.012, E.r * 0.2], [Math.PI / 2, 0, 0]).castShadow = false; b.m(head, G.ring, fm, [sx * E.x, E.y, E.z + hr * 0.09], [E.r * 0.25, E.r * 0.21, 1]).castShadow = false; } b.m(head, G.box, fm, [0, E.y + hr * 0.02, E.z + hr * 0.1], [E.x * 1.1, hr * 0.04, hr * 0.03]); break; }
    case 'boia': { const y = (R.height || 1) * 0.35; const ring = b.m(ctx.body, G.ring, m('#ff6a8a', { rough: 0.4 }), [0, y, 0], [(R.footR || 0.8) * 0.75, (R.footR || 0.8) * 0.75, 6], [Math.PI / 2, 0, 0]); ring.castShadow = false; break; }
    case 'colar_flores': for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; b.m(head, G.sph, m(['#ff4f8a', '#ffd34d', '#ffffff'][i % 3], { rough: 0.5 }), [Math.cos(a) * hr * 0.72, -hr * 0.82, Math.sin(a) * hr * 0.6], hr * 0.13).castShadow = false; } break;
    case 'plumas': { const g = b.g(head, [0, t, -hr * 0.1]); ['#ff4fb0', '#ffd34d', '#2fb5a0', '#7a5cff', '#ff8a2a'].forEach((c, i) => { const a = (i - 2) * 0.32; b.m(g, SHAPES.feather, m(c, { glow: 0.2, emis: c }), [Math.sin(a) * hr * 0.15, 0, 0], [hr * 0.9, hr * 1.3, hr * 0.9], [0, 0, -a]).castShadow = false; }); b.m(g, G.sph, m('#ffd34d', { metal: 0.7, rough: 0.2 }), [0, 0, hr * 0.15], hr * 0.16); break; }
    case 'mascara': { const mm = m('#ff4fb0', { rough: 0.3, metal: 0.2 }); for (const sx of [1, -1]) b.m(head, G.sph, mm, [sx * E.x, E.y, E.z + hr * 0.02], [E.r * 0.36, E.r * 0.26, hr * 0.12]).castShadow = false; b.m(head, G.box, mm, [0, E.y + hr * 0.04, E.z + hr * 0.04], [E.x * 1.2, hr * 0.12, hr * 0.06]); for (const sx of [1, -1]) b.m(head, SHAPES.feather, m('#ffd34d', { glow: 0.3 }), [sx * (E.x + hr * 0.3), E.y + hr * 0.25, E.z - hr * 0.1], hr * 0.5, [0, 0, -sx * 0.5]).castShadow = false; break; }
    case 'laco': { const g = b.g(head, [hr * 0.35, t * 0.95, hr * 0.05], [0, 0, -0.35]); const lm = m('#ff4f8a', { rough: 0.4 }); for (const sx of [1, -1]) b.m(g, G.cone, lm, [sx * hr * 0.24, 0, 0], [hr * 0.2, hr * 0.38, hr * 0.14], [0, 0, sx * Math.PI / 2]); b.m(g, G.sph, lm, [0, 0, 0], hr * 0.12); break; }
    case 'casca_ovo': { const g = b.g(head, [0, t * 0.8, -hr * 0.05], [-0.2, 0, 0.25]); b.m(g, G.dome, m('#fff8ec', { rough: 0.5 }), [0, 0, 0], [hr * 0.7, hr * 0.62, hr * 0.7]); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; b.m(g, G.cone, m('#fff8ec'), [Math.cos(a) * hr * 0.62, -hr * 0.02, Math.sin(a) * hr * 0.62], [hr * 0.12, hr * 0.18, hr * 0.06], [Math.PI, a, 0]); } break; }
    case 'palha': hat(b, head, hr, 'palha'); break;
    case 'bandana': { b.m(head, G.cone, m('#e2403a', { kind: 'pele', seed: 3 }), [0, -hr * 0.85, hr * 0.35], [hr * 0.55, hr * 0.5, hr * 0.12], [Math.PI + 0.4, 0, 0]).castShadow = false; break; }
    case 'abobora': { const g = b.g(head, [0, t * 0.85, 0], [-0.15, 0, 0.1]); const pm = m('#ff8a1c', { rough: 0.55 }); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, G.sph, pm, [Math.cos(a) * hr * 0.25, 0, Math.sin(a) * hr * 0.25], [hr * 0.38, hr * 0.42, hr * 0.38]); } b.m(g, G.cyl, m('#4a7a2a'), [0, hr * 0.42, 0], [hr * 0.07, hr * 0.22, hr * 0.07], [0, 0, 0.3]); b.m(g, SHAPES.leaf, m('#5fb84a'), [hr * 0.12, hr * 0.42, 0], hr * 0.35, [0, 0, -1.2]); for (const sx of [1, -1]) b.m(g, G.cone, mat('#ffe066', { glow: 1.6, emis: '#ffb020' }), [sx * hr * 0.17, hr * 0.06, hr * 0.6], [hr * 0.09, hr * 0.12, hr * 0.04], [Math.PI / 2, 0, 0]).castShadow = false; break; }
  }
}

// ---------- animação ----------
function controller(ctx, plan) {
  const A = ctx.anim; const ph = Math.random() * 10;
  let blinkT = 1 + Math.random() * 3, jumpT = -1, happyT = -1, walking = 0;
  const legBase = A.legs.map((l) => l.g.rotation.x);
  const wingBase = A.wings.map((w) => ({ x: w.g.rotation.x, y: w.g.rotation.y, z: w.g.rotation.z }));
  const segBase = (A.wave || []).map((s) => s.m.position.clone());
  const flameBase = A.flames.map((f) => f.scale.clone());
  return {
    jump() { jumpT = 0; }, happy() { happyT = 0; }, setWalking(v) { walking = v; },
    update(t, dt) {
      const tt = t + ph;
      let y = A.float ? A.float + Math.sin(tt * 1.6) * 0.08 : 0;
      if (jumpT >= 0) { jumpT += dt; const k = jumpT / 0.6; if (k >= 1) jumpT = -1; else y += Math.sin(k * Math.PI) * 0.55; }
      let spin = 0; if (happyT >= 0) { happyT += dt; const k = happyT / 1.2; if (k >= 1) happyT = -1; else { y += Math.abs(Math.sin(k * Math.PI * 2)) * 0.35; spin = k * Math.PI * 2; } }
      const breath = 1 + Math.sin(tt * 2.2) * 0.018;
      ctx.body.position.y = y; ctx.body.scale.set(1, breath, 1); ctx.body.rotation.y = spin;
      if (A.shadow) A.shadow.scale.setScalar(A.shadow.userData.base * (1 - Math.min(0.5, (y - (A.float || 0)) * 0.5)) * (A.float ? 0.7 : 1));
      if (A.head) { A.head.rotation.y = Math.sin(tt * 0.7) * 0.25; A.head.rotation.x = Math.sin(tt * 1.1) * 0.06; }
      blinkT -= dt; let eyeS = 1; if (blinkT < 0.12) eyeS = Math.max(0.1, Math.abs(blinkT - 0.06) / 0.06); if (blinkT < 0) blinkT = 2 + Math.random() * 3.5;
      for (const e of A.eyes) e.scale.y = eyeS;
      const wf = walking ? 7 : 0;
      A.legs.forEach((l, i) => { l.g.rotation.x = legBase[i] + (l.tucked ? 0.6 : Math.sin(tt * wf + l.ph) * (walking ? 0.5 : 0)); });
      for (const g of A.tails) g.rotation.y = Math.sin(tt * (walking ? 5 : 2)) * 0.3;
      A.wings.forEach((w, i) => {
        const b0 = wingBase[i]; const amp = w.flap ?? (plan === 'bird' ? 0.7 : 0.25); const sp = w.slow ? 2 : plan === 'bird' || plan === 'insect' ? 9 : 3;
        const f = Math.sin(tt * sp) * amp;
        if (w.axisX) w.g.rotation.x = b0.x + f * (walking ? 3 : 1);
        else if (w.axisZ) w.g.rotation.y = b0.y + f * w.sx;
        else w.g.rotation.z = b0.z + f * w.sx;
      });
      if (A.wave && A.wave.length) A.wave.forEach((s, i) => { const k = s.k; s.m.position.x = segBase[i].x + Math.sin(tt * 3 - k * 6) * 0.22 * k; s.m.position.y = segBase[i].y + Math.sin(tt * 2 - k * 4) * 0.08 * k; });
      if (A.tentacles) A.tentacles.forEach((te) => { te.g.rotation.x = Math.sin(tt * 2 + te.ph) * 0.25; te.g.rotation.z = Math.cos(tt * 1.7 + te.ph) * 0.2; });
      A.flames.forEach((f, i) => { const s = 1 + Math.sin(tt * 12 + i * 1.7) * 0.12; f.scale.set(flameBase[i].x * (2 - s), flameBase[i].y * s, flameBase[i].z); });
      for (const s of A.spin) { if (s.wob) s.g.rotation.z = Math.sin(tt * 2) * 0.15; else s.g.rotation[s.axis] += dt * s.speed; }
    },
  };
}

// ---------- núcleo (o "ovo" que sai da forja) ----------
export function buildEgg(el, rar) {
  const b = new B(false); const root = new THREE.Group(); const g = b.g(root);
  const c = el ? ELEMENTS[el].cores : ['#2b3a5c', '#e6ecff', '#7df9ff'];
  const rc = { comum: '#8fd46b', incomum: '#4fc3f7', raro: '#b18cff', epico: '#ff6fb5', lendario: '#ffc22e', mitico: '#7df9ff' }[rar] || '#ffffff';
  const crystalM = mat(c[0], { rough: 0.15, metal: 0.2, glow: 0.25, emis: c[2] });
  b.m(g, G.oct, crystalM, [0, 0.8, 0], [0.42, 0.78, 0.42]);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.m(g, G.oct, crystalM, [Math.cos(a) * 0.32, 0.38, Math.sin(a) * 0.32], [0.14, 0.32, 0.14], [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]); }
  b.m(g, G.sph, mat(rc, { glow: 2.2 }), [0, 0.8, 0], 0.18);
  const rock = mat('#4a4458', { kind: 'pedra', seed: 3, rough: 0.9, flat: true });
  b.m(g, G.dode, rock, [0, 0.12, 0], [0.55, 0.2, 0.55]);
  root.userData.shell = g;
  return root;
}

// ---------- item como figurinha flutuante (emoji num disco) ----------
const spriteCache = new Map();
export function itemTexture(emoji, ring = '#ffffff') {
  const k = emoji + ring;
  if (spriteCache.has(k)) return spriteCache.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 50, 10, 64, 64, 60); g.addColorStop(0, 'rgba(70,64,96,0.95)'); g.addColorStop(1, 'rgba(30,26,46,0.95)');
  x.fillStyle = g; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill();
  x.lineWidth = 7; x.strokeStyle = ring; x.stroke();
  x.font = '68px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; spriteCache.set(k, t); return t;
}
export function itemSprite(emoji, size = 0.6, ring) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: itemTexture(emoji, ring), depthTest: true, transparent: true, alphaTest: 0.05 }));
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
export { G as GEO, SHAPES, mat, B as Builder, taperTube, skin };
