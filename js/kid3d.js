// Brilhinhos — o personagem do jogador em 3D, no estilo de animação: cabeça grande e lisa,
// olhos 3D brilhantes, bochechas cheias, cabelo esculpido em mechas, roupas macias (tecido
// com estampa), tênis gordinhos. ~1,2 m. O "animador" mistura andar, correr e as ações
// (cortar, minerar, colher, plantar, regar, carinho, construir, pegar, comemorar e acenar).
import * as THREE from './vendor/three.module.js';
import { GEO, mat, Builder, shade } from './creature3d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
const texCache = new Map();
function canvasTex(key, w, h, draw, rep = 1) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4;
  texCache.set(key, t); return t;
}
const lum = (hex) => { const c = new THREE.Color(hex); return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; };
// ---------- estampas ----------
function patternTex(color, pat) {
  return canvasTex(`pat|${color}|${pat}`, 128, 128, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    const ink = lum(color) > 0.6 ? shade(color, 0, 0.1, -0.35) : '#ffffff';
    x.fillStyle = ink; x.strokeStyle = ink; x.globalAlpha = 0.85;
    const star = (cx, cy, r) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); };
    const heart = (cx, cy, r) => { x.beginPath(); x.moveTo(cx, cy + r * 0.8); x.bezierCurveTo(cx - r * 1.4, cy - r * 0.2, cx - r * 0.5, cy - r * 1.2, cx, cy - r * 0.35); x.bezierCurveTo(cx + r * 0.5, cy - r * 1.2, cx + r * 1.4, cy - r * 0.2, cx, cy + r * 0.8); x.fill(); };
    switch (pat) {
      case 'listras': for (let i = 0; i < 4; i++) x.fillRect(0, i * 32 + 4, w, 12); break;
      case 'bolinhas': for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(i * 32 + (j % 2) * 16 + 8, j * 32 + 16, 6, 0, 7); x.fill(); } break;
      case 'xadrez': x.globalAlpha = 0.35; for (let i = 0; i < 4; i++) { x.fillRect(i * 32, 0, 14, h); x.fillRect(0, i * 32, w, 14); } break;
      case 'estrelas': for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) star(i * 43 + (j % 2) * 21 + 14, j * 43 + 20, 9); break;
      case 'raios': x.lineWidth = 7; for (let i = 0; i < 3; i++) { const ox = i * 43 + 8; x.beginPath(); x.moveTo(ox + 14, 6); x.lineTo(ox + 4, 50); x.lineTo(ox + 20, 56); x.lineTo(ox + 8, 120); x.stroke(); } break;
      case 'coracoes': for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) heart(i * 43 + (j % 2) * 21 + 14, j * 43 + 22, 9); break;
      case 'camuflado': x.globalAlpha = 0.5; for (let i = 0; i < 18; i++) { x.fillStyle = [shade(color, 0, 0, -0.2), shade(color, 0.05, 0, 0.12), shade(color, -0.05, 0, -0.35)][i % 3]; x.beginPath(); x.ellipse((i * 37) % w, (i * 53) % h, 18, 11, i, 0, 7); x.fill(); } break;
    }
  }, 2);
}
// tecido: um pouco de "fiapo" na textura para não parecer plástico
const matCache = new Map();
function clothMat(color, pat = 'liso') {
  const k = `cloth|${color}|${pat}`; if (matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: pat === 'liso' ? color : '#ffffff', map: pat === 'liso' ? null : patternTex(color, pat), roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
  matCache.set(k, m); return m;
}
function skinMat(c) {
  const k = 'skin|' + c; if (matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, emissive: new THREE.Color(c).multiplyScalar(0.07) });
  matCache.set(k, m); return m;
}
const soft = (c, o = {}) => { const k = 'soft|' + c + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, transparent: !!o.op, opacity: o.op ?? 1, depthWrite: !o.op, side: THREE.DoubleSide })); return matCache.get(k); };

// ---------- formas lisas (torno) ----------
const geoCache = new Map();
const cached = (k, f) => { if (!geoCache.has(k)) geoCache.set(k, f()); return geoCache.get(k); };
const lathe = (k, pts, seg = 32) => cached('l' + k, () => { const q = pts[0][1] > pts[pts.length - 1][1] ? [...pts].reverse() : pts; return new THREE.LatheGeometry(q.map(([r, y]) => V2(Math.max(0, r), y)), seg); });
// membro arredondado: do ponto da junta (y=0) até -len, raio r0 em cima e r1 embaixo
function limbGeo(len, r0, r1) {
  return cached(`limb${len.toFixed(3)}|${r0.toFixed(3)}|${r1.toFixed(3)}`, () => {
    const pts = []; const n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(V2(Math.cos(a) * r1, -len + r1 + Math.sin(a) * r1)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(V2(Math.cos(a) * r0, -r0 + Math.sin(a) * r0)); }
    return new THREE.LatheGeometry(pts, 24);
  });
}
const SPH = cached('sph', () => new THREE.SphereGeometry(1, 28, 20));
const SPHm = cached('sphm', () => new THREE.SphereGeometry(1, 14, 10));
const torus = (r, t, seg = 40, arc = Math.PI * 2) => cached(`t${r}|${t}|${seg}|${arc}`, () => new THREE.TorusGeometry(r, t, 12, seg, arc));
function roundBox(w, h, d, r) {
  return cached(`rb${w}|${h}|${d}|${r}`, () => {
    const g = new THREE.BoxGeometry(w, h, d, 6, 6, 6); const p = g.attributes.position; const v = new THREE.Vector3(); const inner = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const c = new THREE.Vector3(Math.max(-inner.x, Math.min(inner.x, v.x)), Math.max(-inner.y, Math.min(inner.y, v.y)), Math.max(-inner.z, Math.min(inner.z, v.z))); const dlt = v.clone().sub(c); if (dlt.lengthSq() > 0) dlt.setLength(r); v.copy(c).add(dlt); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  });
}
function mesh(parent, geo, m, p = [0, 0, 0], s = 1, r = [0, 0, 0]) {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); if (Array.isArray(s)) o.scale.set(...s); else o.scale.setScalar(s); o.rotation.set(...r); o.castShadow = true; parent.add(o); return o;
}
const grp = (parent, p = [0, 0, 0], r = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); parent.add(g); return g; };

// ---------- o rosto: sobrancelhas, boca, bochechas e sardas (os olhos são 3D) ----------
function faceTex(look, happy) {
  const k = ['face3', look.olhos.tipo, look.boca, look.sobrancelha, look.sardas, look.bochechas, look.cabelo.cor, look.pele, happy].join('|');
  return canvasTex(k, 512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.lineCap = 'round'; x.lineJoin = 'round';
    const ex = [159, 353], browY = 120, eyeY = 279, my = 398; const dark = '#3a2018';
    if (look.bochechas) for (const cx of [100, 412]) { const g = x.createRadialGradient(cx, 330, 2, cx, 330, 46); g.addColorStop(0, 'rgba(255,110,130,.5)'); g.addColorStop(1, 'rgba(255,110,130,0)'); x.fillStyle = g; x.fillRect(cx - 50, 280, 100, 100); }
    if (look.sardas) { x.fillStyle = shade(look.pele, 0, 0.12, -0.25); for (const [fx, fy] of [[126, 312], [142, 326], [118, 330], [386, 312], [370, 326], [394, 330], [134, 300], [378, 300]]) { x.beginPath(); x.arc(fx, fy, 5, 0, 7); x.fill(); } }
    const bc = shade(look.cabelo.cor === '#e8e4dc' ? '#9a8a7a' : look.cabelo.cor, 0, 0, -0.06);
    for (const [i, cx] of ex.entries()) {
      const s = i ? 1 : -1; x.strokeStyle = bc; x.lineWidth = look.sobrancelha === 'grossa' ? 24 : 15;
      x.beginPath();
      if (look.sobrancelha === 'alegre') { x.moveTo(cx - 36, browY + 6); x.quadraticCurveTo(cx, browY - 30, cx + 36, browY + 2); }
      else if (look.sobrancelha === 'decidido') { x.moveTo(cx - 36 * s, browY - 14); x.quadraticCurveTo(cx, browY - 6, cx + 36 * s, browY + 14); }
      else { x.moveTo(cx - 34, browY + 6); x.quadraticCurveTo(cx, browY - 18, cx + 34, browY + 2); }
      x.stroke();
    }
    if (happy || look.olhos.tipo === 'feliz') for (const cx of ex) { x.strokeStyle = dark; x.lineWidth = 14; x.beginPath(); x.arc(cx, eyeY + 22, 32, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
    const mx = 256; x.strokeStyle = '#8a3a34'; x.fillStyle = '#7a2030'; x.lineWidth = 11;
    const b = happy ? 'sorrisao' : look.boca;
    if (b === 'sorriso') { x.beginPath(); x.moveTo(mx - 42, my - 18); x.quadraticCurveTo(mx, my + 26, mx + 42, my - 18); x.stroke(); x.lineWidth = 7; for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(mx + sx * 40, my - 26); x.quadraticCurveTo(mx + sx * 50, my - 18, mx + sx * 44, my - 8); x.stroke(); } }
    else if (b === 'sorrisao' || b === 'banguela' || b === 'linguinha') {
      x.beginPath(); x.moveTo(mx - 52, my - 22); x.quadraticCurveTo(mx, my + 66, mx + 52, my - 22); x.quadraticCurveTo(mx, my - 10, mx - 52, my - 22); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(mx - 42, my - 17); x.quadraticCurveTo(mx, my - 6, mx + 42, my - 17); x.lineTo(mx + 34, my - 2); x.quadraticCurveTo(mx, my + 6, mx - 34, my - 2); x.fill();
      if (b === 'banguela') { x.fillStyle = '#7a2030'; x.fillRect(mx - 8, my - 16, 16, 16); }
      if (b === 'linguinha') { x.fillStyle = '#ff7a8a'; x.beginPath(); x.ellipse(mx + 4, my + 30, 22, 22, 0, 0, 7); x.fill(); x.strokeStyle = '#d9505e'; x.lineWidth = 3; x.beginPath(); x.moveTo(mx + 4, my + 14); x.lineTo(mx + 4, my + 36); x.stroke(); }
    } else if (b === 'surpreso') { x.beginPath(); x.ellipse(mx, my, 18, 24, 0, 0, 7); x.fill(); }
    else if (b === 'timido') { x.beginPath(); x.moveTo(mx - 22, my - 6); x.quadraticCurveTo(mx, my + 8, mx + 22, my - 6); x.stroke(); }
  });
}
// íris pintada num olho redondo: o mapa da esfera tem a frente em u=0,25
function eyeTex(color, big) {
  return canvasTex(`eye|${color}|${big}`, 512, 256, (x, w, h) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    const cx = w * 0.25, cy = h * 0.5, R = (big ? 50 : 44);
    const g = x.createRadialGradient(cx, cy + 6, 4, cx, cy, R); g.addColorStop(0, shade(color, 0, 0.15, 0.28)); g.addColorStop(0.65, color); g.addColorStop(1, shade(color, 0, 0, -0.32));
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, R, R * 1.08, 0, 0, 7); x.fill();
    x.fillStyle = '#0c0808'; x.beginPath(); x.ellipse(cx, cy + 2, R * 0.48, R * 0.52, 0, 0, 7); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx - R * 0.32, cy - R * 0.35, R * 0.24, R * 0.28, 0, 0, 7); x.fill(); x.beginPath(); x.arc(cx + R * 0.3, cy + R * 0.32, R * 0.1, 0, 7); x.fill();
  });
}

export function buildKid(look, opts = {}) {
  const sk = skinMat(look.pele);
  const hairM = new THREE.MeshStandardMaterial({ color: look.cabelo.cor, roughness: 0.48, emissive: new THREE.Color(look.cabelo.cor).multiplyScalar(0.05) });
  const top = look.topo, bot = look.baixo, sh = look.calcado, A = look.acess || {};
  const topM = clothMat(top.cor, top.estampa), botM = clothMat(bot.cor, bot.estampa);
  const trimC = lum(top.cor) > 0.72 ? shade(top.cor, 0, 0, -0.12) : shade(top.cor, 0, -0.05, 0.12);
  const trimM = clothMat(trimC);
  const on = (id) => A[id]?.on; const acC = (id, def) => A[id]?.cor || def;
  const root = new THREE.Group(); const body = grp(root);
  const J = { eyes: [] };
  const hipY = 0.44;
  // ---------- pernas ----------
  J.pelvis = grp(body, [0, hipY, 0]);
  const longLeg = bot.tipo === 'calca';
  for (const sx of [1, -1]) {
    const side = sx > 0 ? 'L' : 'R';
    const up = grp(J.pelvis, [sx * 0.074, -0.01, 0]); J['leg' + side] = up;
    const thighM = bot.tipo === 'saia' ? sk : (bot.tipo === 'short' || bot.tipo === 'bermuda' || longLeg) ? botM : sk;
    mesh(up, limbGeo(0.2, 0.066, 0.056), longLeg || bot.tipo === 'bermuda' ? botM : sk);
    if (bot.tipo === 'short') mesh(up, limbGeo(0.11, 0.076, 0.072), botM, [0, 0.01, 0]); // perninha do short, um pouco folgada
    if (bot.tipo === 'bermuda') mesh(up, limbGeo(0.18, 0.076, 0.07), botM, [0, 0.01, 0]);
    const knee = grp(up, [0, -0.18, 0]); J['knee' + side] = knee;
    mesh(knee, limbGeo(0.22, 0.054, 0.045), longLeg ? botM : sk);
    if (longLeg) mesh(knee, torus(1, 0.25), clothMat(shade(bot.cor, 0, 0, -0.08)), [0, -0.17, 0], [0.05, 0.05, 0.05], [Math.PI / 2, 0, 0]);
    if (bot.tipo === 'bermuda') mesh(knee, limbGeo(0.04, 0.066, 0.066), botM, [0, 0.03, 0]);
    // meia e calçado
    const foot = grp(knee, [0, -0.195, 0.01]);
    if (sh.tipo === 'tenis' && !longLeg) mesh(foot, limbGeo(0.07, 0.045, 0.045), soft('#f6f6f2', { rough: 0.9 }), [0, 0.06, 0]);
    const shoeM = soft(sh.cor, { rough: 0.55 }), soleM = soft('#f8f8f4', { rough: 0.7 });
    if (sh.tipo === 'tenis') {
      mesh(foot, SPH, shoeM, [0, 0.0, 0.025], [0.058, 0.05, 0.098]);
      mesh(foot, SPH, soleM, [0, -0.028, 0.03], [0.064, 0.024, 0.112]);
      mesh(foot, SPH, soleM, [0, -0.008, 0.095], [0.048, 0.03, 0.04]);
      mesh(foot, torus(1, 0.3), soleM, [0, 0.035, -0.005], [0.044, 0.044, 0.044], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 2; i++) mesh(foot, roundBox(0.05, 0.008, 0.012, 0.004), soleM, [0, 0.038 - i * 0.006, 0.05 + i * 0.02], 1, [0.5, 0, 0]);
    } else if (sh.tipo === 'bota') {
      mesh(foot, limbGeo(0.14, 0.052, 0.054), shoeM, [0, 0.12, 0]);
      mesh(foot, SPH, shoeM, [0, 0.0, 0.03], [0.058, 0.05, 0.095]);
      mesh(foot, SPH, soft('#4a3020', { rough: 0.8 }), [0, -0.03, 0.03], [0.064, 0.022, 0.108]);
      mesh(foot, torus(1, 0.35), soft(shade(sh.cor, 0, 0, 0.12)), [0, 0.12, 0], [0.056, 0.056, 0.056], [Math.PI / 2, 0, 0]);
    } else { // chinelo e sandália: o pezinho aparece em cima de uma sola com o formato do pé
      const fg = grp(foot, [sx * 0.004, 0, 0], [0, -sx * 0.06, 0]);
      mesh(fg, SPH, sk, [0, -0.004, 0.02], [0.042, 0.03, 0.08]); // o peito do pé
      mesh(fg, SPH, sk, [0, -0.004, -0.035], [0.036, 0.03, 0.04]); // calcanhar
      [[-0.026, 0.083, 0.0125], [-0.009, 0.092, 0.0105], [0.007, 0.091, 0.0098], [0.021, 0.086, 0.009], [0.032, 0.077, 0.008]].forEach(([x, z, r]) => mesh(fg, SPHm, sk, [x * -sx, -0.012, z], [r, r * 0.85, r]));
      mesh(fg, cached('sola', () => { const sh2 = new THREE.Shape(); sh2.moveTo(0, -0.07); sh2.bezierCurveTo(0.042, -0.072, 0.044, -0.02, 0.04, 0.02); sh2.bezierCurveTo(0.042, 0.075, 0.03, 0.112, 0, 0.112); sh2.bezierCurveTo(-0.036, 0.112, -0.05, 0.075, -0.046, 0.02); sh2.bezierCurveTo(-0.048, -0.02, -0.042, -0.072, 0, -0.07); const gg = new THREE.ExtrudeGeometry(sh2, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 24 }); gg.rotateX(Math.PI / 2); return gg; }), shoeM, [0, -0.026, 0], [-sx, 1, 1]);
      const strap = soft(shade(sh.cor, 0, 0, -0.2), { rough: 0.55 });
      const tube = (pts, rad = 0.0055) => { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => V(x * -sx, y, z))), 24, rad, 8), strap); t.castShadow = true; fg.add(t); };
      if (sh.tipo === 'chinelo') { // a tira em "Y" que sai do meio dos dedos
        tube([[-0.016, -0.02, 0.082], [-0.012, 0.012, 0.055], [0.025, 0.012, 0.025], [0.042, -0.018, 0.012]]);
        tube([[-0.016, -0.02, 0.082], [-0.02, 0.012, 0.055], [-0.04, 0.008, 0.028], [-0.046, -0.018, 0.012]]);
      } else { // sandália: duas tiras em cima e uma atrás do calcanhar
        for (const z of [0.05, -0.0]) tube([[0.044, -0.02, z], [0.03, 0.022, z], [0, 0.032, z], [-0.03, 0.022, z], [-0.048, -0.02, z]], 0.0075);
        tube([[0.042, -0.012, -0.02], [0.03, 0.02, -0.062], [0, 0.028, -0.075], [-0.03, 0.02, -0.062], [-0.044, -0.012, -0.02]], 0.006);
      }
    }
  }
  // ---------- quadril (parte de baixo) ----------
  if (bot.tipo === 'saia') mesh(J.pelvis, lathe('saia', [[0, 0.06], [0.14, 0.06], [0.15, 0.02], [0.18, -0.06], [0.2, -0.13], [0.19, -0.145], [0, -0.14]]), botM, [0, 0, 0], [1, 1, 0.86]);
  else mesh(J.pelvis, lathe('quadril', [[0, 0.07], [0.135, 0.07], [0.148, 0.02], [0.152, -0.04], [0.13, -0.085], [0.07, -0.1], [0, -0.1]]), botM, [0, 0, 0], [1, 1, 0.82]);
  mesh(J.pelvis, torus(1, 0.1), clothMat(shade(bot.cor, 0, 0, -0.1)), [0, 0.065, 0], [0.138, 0.138, 0.138 * 0.82 / 0.82], [Math.PI / 2, 0, 0]).scale.set(0.138, 0.113, 0.1);
  // ---------- tronco ----------
  J.torso = grp(body, [0, hipY + 0.035, 0]);
  const puff = top.tipo === 'moletom' ? 1.06 : 1;
  const narrow = top.tipo === 'regata' ? 0.94 : 1;
  const torsoPts = [[0, -0.02], [0.13, -0.015], [0.146, 0.04], [0.156, 0.11], [0.154, 0.18], [0.14 * narrow, 0.245], [0.11 * narrow, 0.285], [0.065, 0.305], [0, 0.31]].map(([r, y]) => [r * puff, y]);
  mesh(J.torso, lathe('torso' + puff + narrow, torsoPts), topM, [0, 0, 0], [1, 1, 0.8]);
  if (top.tipo === 'moletom') {
    mesh(J.torso, torus(1, 0.16), clothMat(shade(top.cor, 0, 0, -0.07)), [0, 0.0, 0], [0.142, 0.142, 0.142], [Math.PI / 2, 0, 0]).scale.set(0.14, 0.114, 0.1);
    mesh(J.torso, roundBox(0.17, 0.08, 0.03, 0.014), topM, [0, 0.075, 0.118], 1, [-0.08, 0, 0]); // bolso canguru
    mesh(J.torso, roundBox(0.12, 0.006, 0.006, 0.003), trimM, [0, 0.115, 0.134], 1, [-0.08, 0, 0]);
    mesh(J.torso, torus(1, 0.3, 32, Math.PI * 1.25), topM, [0, 0.29, -0.035], [0.085, 0.085, 0.085], [Math.PI / 2 - 0.25, 0, Math.PI * 1.375]); // capuz dobrado
    for (const sx of [1, -1]) { mesh(J.torso, limbGeo(0.08, 0.005, 0.005), soft('#f6f6f2', { rough: 0.8 }), [sx * 0.03, 0.265, 0.104], 1, [0.18, 0, 0]); mesh(J.torso, SPHm, soft('#f6f6f2'), [sx * 0.03, 0.19, 0.118], 0.009); }
  } else if (top.tipo === 'camisa') {
    for (const sx of [1, -1]) mesh(J.torso, SPH, soft('#ffffff', { rough: 0.7 }), [sx * 0.04, 0.285, 0.07], [0.05, 0.014, 0.035], [0.5, sx * 0.55, sx * 0.25]);
    for (let i = 0; i < 3; i++) mesh(J.torso, SPHm, soft('#f4f4f4'), [0, 0.225 - i * 0.065, 0.122], [0.011, 0.011, 0.005]);
    mesh(J.torso, torus(1, 0.12), clothMat(shade(top.cor, 0, 0, -0.08)), [0, 0.008, 0], [0.13, 0.106, 0.1], [Math.PI / 2, 0, 0]);
  } else if (top.tipo !== 'regata') mesh(J.torso, torus(1, 0.18), trimM, [0, 0.3, 0.004], [0.062, 0.055, 0.062], [Math.PI / 2 - 0.15, 0, 0]); // gola
  if (top.tipo === 'regata') for (const sx of [1, -1]) mesh(J.torso, roundBox(0.035, 0.06, 0.16, 0.014), topM, [sx * 0.075, 0.275, 0], 1, [0, 0, sx * 0.25]);
  // ---------- braços ----------
  const longS = top.tipo === 'blusa' || top.tipo === 'moletom';
  for (const sx of [1, -1]) {
    const side = sx > 0 ? 'L' : 'R';
    const sh0 = grp(J.torso, [sx * 0.158, 0.25, 0]); J['arm' + side] = sh0;
    mesh(sh0, SPH, top.tipo === 'regata' ? sk : topM, [-sx * 0.012, -0.005, 0], [0.05, 0.05, 0.048]); // ombro arredondado
    mesh(sh0, limbGeo(0.16, 0.05, 0.043), top.tipo === 'regata' ? sk : (longS ? topM : sk));
    if (!longS && top.tipo !== 'regata') mesh(sh0, lathe('manga', [[0, 0.03], [0.056, 0.02], [0.06, -0.04], [0.058, -0.085], [0.05, -0.09], [0.04, -0.085]], 24), topM, [0, 0, 0]);
    const el = grp(sh0, [0, -0.135, 0]); J['elbow' + side] = el;
    mesh(el, limbGeo(0.14, 0.043, 0.038), longS ? topM : sk);
    if (longS) mesh(el, torus(1, 0.32), trimM, [0, -0.125, 0], [0.04, 0.04, 0.04], [Math.PI / 2, 0, 0]);
    const hand = grp(el, [0, -0.15, 0]); J['hand' + side] = hand;
    mesh(hand, SPH, sk, [0, -0.012, 0], [0.04, 0.046, 0.034]);
    mesh(hand, SPHm, sk, [-sx * 0.028, 0.0, 0.016], [0.014, 0.022, 0.014], [0.4, 0, sx * 0.5]); // polegar
  }
  // ---------- cabeça ----------
  J.neck = grp(J.torso, [0, 0.305, 0]);
  mesh(J.neck, limbGeo(0.07, 0.045, 0.048), sk, [0, 0.06, 0]);
  J.head = grp(J.neck, [0, 0.185, 0.005]);
  const HR = 0.205;
  mesh(J.head, SPH, sk, [0, 0, 0], [HR, HR * 0.96, HR * 0.93]);
  for (const sx of [1, -1]) { const e = mesh(J.head, SPH, sk, [sx * HR * 0.98, -HR * 0.06, -HR * 0.02], [0.03, 0.048, 0.022], [0, sx * 0.3, 0]); mesh(J.head, SPHm, skinMat(shade(look.pele, 0, 0.05, -0.08)), [sx * HR * 1.01, -HR * 0.06, -HR * 0.01], [0.012, 0.028, 0.01]); void e; }
  mesh(J.head, SPH, skinMat(shade(look.pele, 0, 0.04, -0.03)), [0, -HR * 0.12, HR * 0.94], [0.024, 0.019, 0.02]); // nariz
  // rosto desenhado (sobrancelhas, boca, bochechas) numa casca rente à cabeça
  const faceGeo = cached('face', () => new THREE.SphereGeometry(1, 48, 36, Math.PI / 2 - 0.95, 1.9, 0.62, 1.78));
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex(look, false), transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = mesh(J.head, faceGeo, faceMat, [0, 0, 0], [HR * 1.006, HR * 0.966, HR * 0.94]); face.castShadow = false; face.renderOrder = 2;
  // olhos 3D: brilhantes, com íris pintada
  const ot = look.olhos.tipo; const big = ot === 'grande';
  const eyeR = big ? 0.05 : 0.044; const eyeM = new THREE.MeshStandardMaterial({ map: eyeTex(look.olhos.cor, big), roughness: 0.12, metalness: 0 });
  J.eyeGroup = grp(J.head, [0, 0, 0]); J.eyesShown = ot !== 'feliz'; J.eyeGroup.visible = J.eyesShown;
  for (const sx of [1, -1]) {
    const eg = grp(J.eyeGroup, [sx * 0.072, -HR * 0.02, HR * 0.79], [0, sx * 0.16, 0]);
    const ball = mesh(eg, SPH, eyeM, [0, 0, 0], [eyeR, eyeR * (ot === 'amendoa' ? 0.78 : 1.04), eyeR * 0.82]); ball.castShadow = false; // a íris pintada em u=0,25 já fica para a frente
    eg.userData.sy = 1; J.eyes.push(eg);
    if (ot === 'sonolento') mesh(eg, cached('lid', () => new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)), sk, [0, 0.002, 0.003], [eyeR * 1.08, eyeR * 1.1, eyeR * 0.92], [0.55, 0, 0]);
    // cílios: um tracinho na pálpebra
    mesh(eg, torus(1, 0.06, 20, Math.PI * 0.8), soft('#2a1a14', { rough: 0.6 }), [0, eyeR * 0.15, eyeR * 0.25], [eyeR * 1.02, eyeR * 1.0, eyeR], [0.35, 0, Math.PI * 0.1]).castShadow = false;
  }
  hair(J.head, HR, look.cabelo.estilo, hairM, sk);
  // ---------- acessórios ----------
  if (on('bone')) { const m = soft(acC('bone', '#e2403a'), { rough: 0.7 }); const g = grp(J.head, [0, HR * 0.1, -HR * 0.02], [-0.5, 0, 0]); mesh(g, cached('capdome', () => new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.52)), m, [0, 0, 0], [HR * 1.08, HR * 0.86, HR * 1.06]); mesh(g, SPH, m, [0, HR * 0.12, HR * 1.0], [HR * 0.62, HR * 0.06, HR * 0.52], [0.4, 0, 0]); mesh(g, SPHm, soft('#ffffff'), [0, HR * 0.86, 0], HR * 0.07); }
  if (on('chapeu')) { const m = soft(acC('chapeu', '#f2d27a'), { rough: 0.8 }); const g = grp(J.head, [0, HR * 0.42, 0], [-0.1, 0, 0]); mesh(g, lathe('aba', [[0, 0.005], [0.2, 0.004], [0.32, 0.012], [0.345, 0.03], [0.34, 0.035], [0.3, 0.018], [0.2, 0.014], [0, 0.016]], 40), m, [0, 0, 0], [HR / 0.205, 1, HR / 0.205]); mesh(g, lathe('copa', [[0, 0.14], [0.11, 0.135], [0.17, 0.1], [0.19, 0.02], [0.19, 0], [0, 0]], 40), m, [0, 0, 0], [HR / 0.205, 1, HR / 0.205]); mesh(g, torus(1, 0.1), soft('#e2403a', { rough: 0.6 }), [0, 0.03, 0], [0.192, 0.192, 0.3], [Math.PI / 2, 0, 0]); }
  if (on('fones')) { const m = soft(acC('fones', '#2b2f3a'), { rough: 0.4 }); mesh(J.head, torus(1, 0.06, 40, Math.PI), m, [0, 0.01, -0.01], [HR * 1.12, HR * 1.12, HR * 1.12]); for (const sx of [1, -1]) { mesh(J.head, SPH, m, [sx * HR * 1.04, -0.02, 0], [0.022, 0.05, 0.048]); mesh(J.head, torus(1, 0.3), soft('#f4f4f4', { rough: 0.9 }), [sx * HR * 1.0, -0.02, 0], [0.036, 0.036, 0.036], [0, Math.PI / 2, 0]); } }
  if (on('laco')) { const m = soft(acC('laco', '#ff7ab8'), { rough: 0.5 }); const g = grp(J.head, [HR * 0.5, HR * 0.82, HR * 0.05], [0.2, 0, -0.45]); for (const sx of [1, -1]) mesh(g, SPH, m, [sx * 0.042, 0, 0], [0.042, 0.03, 0.016], [0, 0, sx * 0.35]); mesh(g, SPH, m, [0, 0, 0.004], [0.016, 0.018, 0.016]); }
  if (on('oculos') || on('oculos_sol')) {
    const sol = on('oculos_sol'); const fm = soft(sol ? acC('oculos_sol', '#2b2f3a') : acC('oculos', '#3f63e0'), { rough: 0.3 });
    const g = grp(J.head, [0, -HR * 0.02, HR * 0.86]);
    for (const sx of [1, -1]) {
      const rr = sol ? 0.05 : 0.046;
      mesh(g, torus(1, sol ? 0.12 : 0.08, 40), fm, [sx * 0.072, 0, 0], [rr, rr * (sol ? 0.86 : 0.95), rr]).castShadow = false; // aro fino
      mesh(g, cached('lens', () => new THREE.CircleGeometry(1, 32)), sol ? soft('#141820', { rough: 0.1, metal: 0.3, op: 0.88 }) : soft('#dff0ff', { rough: 0.05, op: 0.22 }), [sx * 0.072, 0, 0.002], [rr * 0.94, rr * (sol ? 0.8 : 0.9), 1]).castShadow = false;
      mesh(g, limbGeo(0.15, 0.0045, 0.0045), fm, [sx * 0.118, 0.005, -0.075], 1, [Math.PI / 2, 0, 0]).castShadow = false; // haste até a orelha
    }
    mesh(g, torus(1, 0.18, 16, Math.PI), fm, [0, 0.006, 0.002], [0.022, 0.016, 0.022]).castShadow = false; // ponte
  }
  if (on('mochila')) { const c = acC('mochila', '#ff8a2a'); const m = soft(c, { rough: 0.7 }), m2 = soft(shade(c, 0, 0, -0.14), { rough: 0.7 }); mesh(J.torso, roundBox(0.22, 0.25, 0.1, 0.04), m, [0, 0.15, -0.165]); mesh(J.torso, roundBox(0.16, 0.1, 0.04, 0.02), m2, [0, 0.09, -0.225]); mesh(J.torso, roundBox(0.012, 0.012, 0.03, 0.005), soft('#d8d8d8', { metal: 0.6, rough: 0.3 }), [0.05, 0.13, -0.245]); for (const sx of [1, -1]) mesh(J.torso, torus(1, 0.1, 24, Math.PI * 1.1), soft('#3a3a44', { rough: 0.7 }), [sx * 0.085, 0.18, -0.03], [0.13, 0.12, 0.13], [0, Math.PI / 2, -0.55]); }
  if (on('colar')) {
    const m = soft(acC('colar', '#ffd34d'), { rough: 0.25, metal: 0.6 }); const k = top.tipo === 'moletom' ? 1.06 : 1;
    const pts = [[0, 0.312, -0.06], [0.06, 0.305, -0.035], [0.09, 0.292, 0.012], [0.075, 0.27, 0.07], [0.04, 0.245, 0.108], [0, 0.236, 0.122], [-0.04, 0.245, 0.108], [-0.075, 0.27, 0.07], [-0.09, 0.292, 0.012], [-0.06, 0.305, -0.035]].map(([x, y, z]) => V(x * k, y, z * k));
    const chain = new THREE.Mesh(cached('colar' + k, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.0042, 6, true)), m); chain.castShadow = false; J.torso.add(chain);
    for (let i = 0; i < 18; i++) { const q = new THREE.CatmullRomCurve3(pts, true).getPointAt(i / 18); mesh(J.torso, SPHm, m, [q.x, q.y, q.z], 0.0058).castShadow = false; } // os elos
    const pend = grp(J.torso, [0, 0.222, 0.124 * k], [-0.25, 0, 0]); mesh(pend, cached('star', () => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 0.45 : 1; const fn = i ? 'lineTo' : 'moveTo'; sh[fn](Math.cos(a) * rr, -Math.sin(a) * rr); } return new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 2 }); }), m, [0, 0, 0], 0.017).castShadow = false;
  }
  if (on('cachecol')) { const m = clothMat(acC('cachecol', '#e2403a')); mesh(J.torso, torus(1, 0.32), m, [0, 0.3, 0.005], [0.075, 0.068, 0.075], [Math.PI / 2 - 0.1, 0, 0]); mesh(J.torso, roundBox(0.05, 0.15, 0.022, 0.01), m, [0.045, 0.21, 0.115], 1, [0.12, 0, 0.12]); mesh(J.torso, roundBox(0.052, 0.012, 0.024, 0.005), clothMat('#ffffff'), [0.047, 0.15, 0.122], 1, [0.12, 0, 0.12]); }
  if (on('relogio')) { const m = soft(acC('relogio', '#2b2f3a'), { rough: 0.5 }); mesh(J.handL, torus(1, 0.18), m, [0, 0.03, 0], [0.04, 0.04, 0.04], [Math.PI / 2, 0, 0]); mesh(J.handL, cached('wf', () => new THREE.CylinderGeometry(1, 1, 1, 24)), soft('#ffffff', { rough: 0.2 }), [0, 0.03, 0.042], [0.016, 0.006, 0.016], [Math.PI / 2, 0, 0]); }
  if (on('pulseira')) { const m = soft(acC('pulseira', '#ff7ab8'), { rough: 0.3 }); mesh(J.handR, torus(1, 0.14), m, [0, 0.035, 0], [0.04, 0.04, 0.04], [Math.PI / 2, 0, 0]); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; mesh(J.handR, SPHm, soft(['#ffffff', acC('pulseira', '#ff7ab8')][i % 2]), [Math.cos(a) * 0.04, 0.035, Math.sin(a) * 0.04], 0.007).castShadow = false; } }
  // sombra no chão
  if (!opts.noShadow) { const shm = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false })); shm.rotation.x = -Math.PI / 2; shm.position.y = 0.012; root.add(shm); J.shadow = shm; }
  const faces = { open: faceTex(look, false), happy: faceTex(look, true) };
  const ctrl = kidController(J, body, faceMat, faces);
  root.userData = { ctrl, height: 1.14, kid: true, joints: J };
  return root;
}
// textura de fios: listras finas claras e escuras e uma faixa de brilho
function hairTex(color) {
  return canvasTex('hair|' + color, 256, 256, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 420; i++) { const px = rnd() * w; x.strokeStyle = rnd() < 0.5 ? shade(color, 0, 0.04, -0.12 - rnd() * 0.08) : shade(color, 0, -0.02, 0.08 + rnd() * 0.08); x.globalAlpha = 0.35 + rnd() * 0.35; x.lineWidth = 0.6 + rnd() * 1.4; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + (rnd() - 0.5) * 8, h * 0.35, px + (rnd() - 0.5) * 8, h * 0.65, px + (rnd() - 0.5) * 10, h); x.stroke(); }
    x.globalAlpha = 1; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0.18, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,255,255,0.28)'); g.addColorStop(0.42, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
}
// mecha em gota: larga perto da raiz (y=0) e afinando até a ponta (y=-1)
const DROP = cached('drop', () => new THREE.LatheGeometry([[0, -1], [0.06, -0.94], [0.18, -0.78], [0.34, -0.55], [0.46, -0.3], [0.5, -0.12], [0.45, 0.02], [0.3, 0.1], [0, 0.13]].map(([r, y]) => V2(r, y)), 28));
// cabelo esculpido: um volume liso que acompanha a cabeça e mechas que afinam na ponta
function hair(head, R, style, m0, sk) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: hairTex(m0.color.getStyle()), roughness: 0.42, emissive: m0.emissive, side: THREE.DoubleSide });
  const L = (p, sc, r = [0, 0, 0]) => mesh(head, SPH, m, p, sc, r);
  // mecha: posição da raiz, comprimento, largura, direção (rotações)
  const lock = (p, len, wid, r, dep = wid * 0.7) => mesh(head, DROP, m, p, [wid, len, dep], r);
  const capGeo = cached('hcap', () => new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.56));
  const cap = (sc = 1.06, tilt = -0.72) => mesh(head, capGeo, m, [0, R * 0.02, -R * 0.03], [R * sc, R * sc * 0.98, R * sc * 1.0], [tilt, 0, 0]);
  const buzz = () => mesh(head, capGeo, new THREE.MeshStandardMaterial({ color: m0.color, roughness: 0.95, map: hairTex(m0.color.getStyle()) }), [0, R * 0.01, -R * 0.02], [R * 1.015, R * 0.985, R * 0.95], [-0.75, 0, 0]);
  const sides = () => { for (const sx of [1, -1]) lock([sx * R * 0.86, R * 0.5, -R * 0.1], R * 0.62, R * 0.36, [0.15, 0, sx * 0.12]); };
  const back = (len = 0.7) => lock([0, R * 0.55, -R * 0.62], R * len, R * 1.25, [0.45, 0, 0], R * 0.5);
  switch (style) {
    case 'careca': buzz(); break;
    case 'curto': { cap(1.07); sides(); back(0.55);
      L([R * 0.06, R * 0.6, R * 0.28], [R * 0.9, R * 0.36, R * 0.74], [-0.32, 0, -0.12]);
      lock([R * 0.1, R * 0.9, R * 0.25], R * 0.62, R * 0.42, [-1.9, 0.2, -0.55]); lock([-R * 0.25, R * 0.86, R * 0.28], R * 0.5, R * 0.36, [-1.9, -0.2, 0.35]);
      break; }
    case 'espetado': cap(1.04); sides(); back(0.5); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; lock([Math.cos(a) * R * 0.42, R * 0.82, Math.sin(a) * R * 0.42 - R * 0.08], R * 0.55, R * 0.32, [Math.PI + Math.sin(a) * 0.55 - 0.35, 0, -Math.cos(a) * 0.55]); } break;
    case 'franja': cap(1.07); sides(); back(0.6); for (let i = 0; i < 6; i++) { const x = (i - 2.5) * R * 0.27; lock([x, R * 0.86 - Math.abs(i - 2.5) * R * 0.05, R * 0.55], R * 0.42, R * 0.3, [-0.35, 0, (i - 2.5) * -0.1]); } break;
    case 'cacheado': cap(1.08); for (let i = 0; i < 30; i++) { const row = Math.floor(i / 10), k = i % 10; const a = Math.PI * (-0.3 + k / 9 * 1.6); const y = [0.86, 0.5, 0.1][row]; const rr = R * [0.72, 1.0, 0.98][row]; const g = grp(head, [Math.cos(a) * rr, R * y, -Math.sin(a) * rr - R * 0.05], [a, a * 0.7, 0]); mesh(g, torus(1, 0.42, 18), m, [0, 0, 0], R * 0.15); } for (let i = 0; i < 6; i++) { const g = grp(head, [(i - 2.5) * R * 0.24, R * 0.8, R * 0.48], [0.3 * i, 0.9, 0]); mesh(g, torus(1, 0.42, 18), m, [0, 0, 0], R * 0.13); } break;
    case 'afro': { const g = grp(head, [0, R * 0.36, -R * 0.12]); for (const [x, y, z, k] of [[0, 0.1, 0, 1.25], [-0.42, -0.05, 0.05, 0.95], [0.42, -0.05, 0.05, 0.95], [0, 0.35, 0.25, 0.9], [-0.3, 0.3, -0.35, 0.95], [0.3, 0.3, -0.35, 0.95], [0, -0.2, -0.45, 1.0]]) mesh(g, SPH, m, [x * R, y * R, z * R], R * k); break; }
    case 'comprido': cap(1.07); lock([0, R * 0.62, -R * 0.55], R * 1.75, R * 1.3, [0.18, 0, 0], R * 0.55); for (const sx of [1, -1]) lock([sx * R * 0.84, R * 0.45, R * 0.02], R * 1.35, R * 0.4, [0.05, 0, sx * 0.06]); L([0, R * 0.74, R * 0.56], [R * 0.75, R * 0.2, R * 0.34], [-0.4, 0, 0]); break;
    case 'rabo': { cap(1.06); sides(); L([0, R * 0.74, R * 0.56], [R * 0.7, R * 0.2, R * 0.34], [-0.4, 0, 0]); const g = grp(head, [0, R * 0.5, -R * 0.95], [0.35, 0, 0]); mesh(g, torus(1, 0.35), soft('#ff7ab8'), [0, 0, 0], R * 0.13, [Math.PI / 2 - 0.35, 0, 0]); mesh(g, DROP, m, [0, 0, -R * 0.05], [R * 0.5, R * 1.35, R * 0.42]); break; }
    case 'chiquinhas': cap(1.06); back(0.6); L([0, R * 0.74, R * 0.56], [R * 0.7, R * 0.2, R * 0.34], [-0.4, 0, 0]); for (const sx of [1, -1]) { const g = grp(head, [sx * R * 0.92, R * 0.36, -R * 0.22], [0, 0, sx * 0.4]); mesh(g, torus(1, 0.35), soft('#ff7ab8'), [0, 0, 0], R * 0.12, [0, Math.PI / 2, 0]); mesh(g, DROP, m, [sx * R * 0.06, -R * 0.02, 0], [R * 0.4, R * 1.05, R * 0.36]); } break;
    case 'coque': cap(1.06); sides(); back(0.5); L([0, R * 0.74, R * 0.56], [R * 0.7, R * 0.2, R * 0.34], [-0.4, 0, 0]); { const g = grp(head, [0, R * 1.06, -R * 0.24], [0.4, 0, 0]); mesh(g, SPH, m, [0, 0, 0], R * 0.4); mesh(g, torus(1, 0.3, 32), m, [0, -R * 0.05, 0], R * 0.3, [Math.PI / 2, 0, 0]); } mesh(head, torus(1, 0.3), soft('#ff7ab8'), [0, R * 0.84, -R * 0.17], R * 0.28, [Math.PI / 2 - 0.3, 0, 0]); break;
    case 'moicano': buzz(); for (let i = 0; i < 7; i++) { const a = -0.95 + i * 0.36; lock([0, Math.cos(a) * R * 0.98, Math.sin(a) * R * 0.98], R * 0.42, R * 0.26, [Math.PI + a, 0, 0], R * 0.12); } break;
    default: cap(); sides();
  }
}
// ---------- ferramentas ----------
const toolCache = {};
function tool(kind) {
  const b = new Builder(false); const g = new THREE.Group();
  const wood = mat('#8a5a34', { rough: 0.8 }), steel = mat('#c4ccd8', { metal: 0.8, rough: 0.3 });
  switch (kind) {
    case 'machado': b.m(g, GEO.cyl, wood, [0, -0.12, 0.0], [0.016, 0.34, 0.016]); b.m(g, GEO.box, steel, [0, -0.27, 0.055], [0.02, 0.09, 0.1]); b.m(g, GEO.box, mat('#e2403a'), [0, -0.27, 0.0], [0.03, 0.05, 0.03]); break;
    case 'picareta': b.m(g, GEO.cyl, wood, [0, -0.12, 0], [0.016, 0.36, 0.016]); for (const sz of [1, -1]) b.m(g, GEO.cone, steel, [0, -0.29, sz * 0.09], [0.022, 0.16, 0.022], [sz * Math.PI / 2, 0, 0]); break;
    case 'martelo': b.m(g, GEO.cyl, wood, [0, -0.1, 0], [0.016, 0.26, 0.016]); b.m(g, GEO.box, steel, [0, -0.23, 0.02], [0.05, 0.06, 0.12]); break;
    case 'regador': { const m = mat('#4fc3f7', { rough: 0.4, metal: 0.3 }); b.m(g, GEO.cyl, m, [0, -0.08, 0.05], [0.07, 0.13, 0.07]); b.m(g, GEO.cyl, m, [0, -0.06, 0.16], [0.012, 0.18, 0.012], [Math.PI / 2 + 0.6, 0, 0]); b.m(g, GEO.cyl, m, [0, -0.0, 0.235], [0.03, 0.02, 0.03], [0.6, 0, 0]); const hnd = b.m(g, GEO.ring, m, [0, 0.0, 0.0], [0.05, 0.05, 2]); hnd.rotation.y = Math.PI / 2; g.userData.spout = V(0, 0.0, 0.25); break; }
    case 'sementes': b.m(g, GEO.sph, mat('#c9a06a', { rough: 0.9 }), [0, -0.06, 0.03], [0.06, 0.07, 0.05]); b.m(g, GEO.cyl, mat('#8a5a34'), [0, -0.0, 0.03], [0.03, 0.02, 0.03]); break;
    case 'cesta': b.m(g, GEO.cyl, mat('#c9a06a', { rough: 0.9 }), [0, -0.1, 0.06], [0.08, 0.07, 0.08]); b.m(g, GEO.ring, mat('#8a5a34'), [0, -0.04, 0.06], [0.07, 0.08, 2]).rotation.y = Math.PI / 2; for (let i = 0; i < 3; i++) b.m(g, GEO.sph, mat('#e8322a', { rough: 0.3 }), [(i - 1) * 0.04, -0.06, 0.06], 0.025); break;
  }
  return g;
}

// ---------- o animador ----------
const TOOL_OF = { cortar: 'machado', minerar: 'picareta', construir: 'martelo', regar: 'regador', plantar: 'sementes', colher: 'cesta', catar: 'cesta' };
const CYCLE = { cortar: 0.75, minerar: 0.85, construir: 0.55, colher: 0.9, catar: 0.9, plantar: 0.8, regar: 1.2, carinho: 0.7, pegar: 0.8, comemorar: 0.9, acenar: 0.5 };
function kidController(J, body, faceMat, faces) {
  let speed = 0, walkPh = 0, act = null, blink = 2 + Math.random() * 2, faceMode = 'open', lastHit = -1, carry = null;
  const setFace = (k) => { if (faceMode !== k) { faceMode = k; faceMat.map = faces[k]; faceMat.needsUpdate = true; } };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const P = {}; // pose atual (para suavizar)
  const keys = ['armLx', 'armLz', 'armRx', 'armRz', 'armRy', 'elbowL', 'elbowR', 'legL', 'legR', 'kneeL', 'kneeR', 'torsoX', 'torsoY', 'headX', 'headY', 'bodyY', 'handRz'];
  for (const k of keys) P[k] = 0;
  function attachTool(kind) {
    if (carry) { carry.parent?.remove(carry); carry = null; }
    if (!kind) return;
    carry = (toolCache[kind] ||= tool(kind)).clone(); J.handR.add(carry);
  }
  return {
    get busy() { return !!act; },
    get action() { return act?.tipo || null; },
    setMove(v) { speed = v; },
    // tipo: uma das ações; dur: segundos; onHit: chamado a cada golpe; onEnd: no fim
    act(tipo, dur = 1.6, onHit, onEnd) { act = { tipo, t: 0, dur, onHit, onEnd }; lastHit = -1; attachTool(TOOL_OF[tipo]); },
    stop() { if (act) { const e = act.onEnd; act = null; attachTool(null); e?.(); } },
    update(t, dt) {
      const T = {}; for (const k of keys) T[k] = 0;
      // respira
      const br = Math.sin(t * 2.4);
      T.armLz = 0.12 + br * 0.02; T.armRz = -0.12 - br * 0.02; T.elbowL = -0.15; T.elbowR = -0.15; T.headX = Math.sin(t * 0.9) * 0.04; T.headY = Math.sin(t * 0.6) * 0.12;
      if (speed > 0.05 && !act) {
        walkPh += dt * (4 + speed * 2.6);
        const s = Math.sin(walkPh), run = Math.min(1, speed / 3.5);
        const amp = 0.45 + run * 0.35;
        T.legL = s * amp; T.legR = -s * amp;
        T.kneeL = Math.max(0, -Math.cos(walkPh)) * (0.6 + run * 0.6); T.kneeR = Math.max(0, Math.cos(walkPh)) * (0.6 + run * 0.6);
        T.armLx = -s * (0.5 + run * 0.4); T.armRx = s * (0.5 + run * 0.4); T.elbowL = -0.4 - run * 0.6; T.elbowR = -0.4 - run * 0.6;
        T.bodyY = Math.abs(Math.cos(walkPh)) * (0.025 + run * 0.035); T.torsoX = 0.06 + run * 0.14; T.headY = 0;
      }
      if (act) {
        act.t += dt; const c = CYCLE[act.tipo] || 0.8; const ph = (act.t % c) / c; const n = Math.floor(act.t / c);
        const hitAt = { cortar: 0.55, minerar: 0.6, construir: 0.6, colher: 0.7, catar: 0.7, plantar: 0.65, regar: 0.5, carinho: 0.5, pegar: 0.6, comemorar: 0.45, acenar: 0.5 }[act.tipo] ?? 0.5;
        if (ph >= hitAt && n !== lastHit) { lastHit = n; act.onHit?.(n); }
        const sw = ph < hitAt ? ease(ph / hitAt) : 1 - ease((ph - hitAt) / (1 - hitAt)); // vai e volta
        const crouch = (k) => { T.legL = -0.7 * k; T.legR = -0.7 * k; T.kneeL = 1.3 * k; T.kneeR = 1.3 * k; T.bodyY = -0.16 * k; T.torsoX = 0.35 * k; };
        switch (act.tipo) {
          case 'cortar': T.armRx = lerp(-2.5, -1.1, sw < 1 && ph < hitAt ? sw : 1 - sw); T.armRz = lerp(-0.9, 0.25, ph < hitAt ? sw : 1 - sw); T.armLx = -1.2; T.armLz = 0.3; T.elbowR = -0.3; T.torsoY = lerp(-0.4, 0.35, ph < hitAt ? sw : 1 - sw); T.legL = 0.25; T.legR = -0.2; break;
          case 'minerar': case 'construir': { const k = ph < hitAt ? ease(ph / hitAt) : 1 - ease((ph - hitAt) / (1 - hitAt)); const up = 1 - k; T.armRx = lerp(-1.0, -2.9, up); T.armLx = act.tipo === 'minerar' ? lerp(-1.0, -2.8, up) : -0.9; T.armLz = act.tipo === 'minerar' ? -0.2 : 0.3; T.armRz = act.tipo === 'minerar' ? 0.2 : -0.1; T.elbowR = -0.2; T.elbowL = -0.2; T.torsoX = lerp(0.45, -0.1, up); if (act.tipo === 'construir') crouch(0.55), T.armRx = lerp(-0.6, -2.4, up), T.torsoX = lerp(0.6, 0.2, up); break; }
          case 'colher': case 'catar': crouch(0.6 + Math.sin(ph * Math.PI) * 0.15); T.armRx = -1.2 - Math.sin(ph * Math.PI * 2) * 0.25; T.armLx = -1.1 - Math.cos(ph * Math.PI * 2) * 0.25; T.armLz = 0.25; T.armRz = -0.25; T.elbowL = -0.4; T.elbowR = -0.5; break;
          case 'plantar': T.legL = -1.2; T.kneeL = 1.6; T.legR = 0.2; T.kneeR = 1.9; T.bodyY = -0.22; T.torsoX = 0.4; T.armRx = -0.9 - sw * 0.5; T.elbowR = -0.6 + sw * 0.4; T.armLx = -0.5; T.armLz = 0.3; break;
          case 'regar': T.armRx = -1.25; T.armRz = -0.05; T.elbowR = -0.2; T.handRz = 0.4 + Math.sin(act.t * 3) * 0.2; T.armLx = -0.3; T.torsoX = 0.15; break;
          case 'carinho': crouch(0.45); T.armRx = -1.35; T.armRy = Math.sin(act.t * 9) * 0.35; T.elbowR = -0.2; T.armLx = -0.6; T.armLz = 0.4; break;
          case 'pegar': T.armRx = lerp(-1.3, -2.8, sw); T.armLx = lerp(-1.3, -2.8, sw); T.armLz = -0.2; T.armRz = 0.2; T.bodyY = Math.sin(ph * Math.PI) * 0.06; break;
          case 'comemorar': { const j = Math.sin(ph * Math.PI); T.bodyY = j * 0.28; T.legL = -0.5 * j; T.legR = -0.5 * j; T.kneeL = 1.0 * j; T.kneeR = 1.0 * j; T.armLx = -2.9; T.armRx = -2.9; T.armLz = 0.5 + j * 0.3; T.armRz = -0.5 - j * 0.3; T.elbowL = -0.2; T.elbowR = -0.2; break; }
          case 'acenar': T.armRx = -2.7; T.armRz = -0.5 + Math.sin(act.t * 12) * 0.35; T.elbowR = -0.5; T.headX = -0.1; break;
        }
        if (act.t >= act.dur) { const e = act.onEnd; act = null; attachTool(null); e?.(); }
      }
      // pisca, e cara feliz em ações de carinho e festa
      blink -= dt;
      const happy = act && ['carinho', 'comemorar', 'pegar'].includes(act.tipo);
      setFace(happy ? 'happy' : 'open');
      if (J.eyeGroup) { J.eyeGroup.visible = !happy && J.eyesShown !== false; const bl = blink < 0.12 ? 0.12 : 1; for (const e of J.eyes) e.scale.y += (bl - e.scale.y) * Math.min(1, dt * 30); }
      if (blink < 0) blink = 2 + Math.random() * 3;
      // suaviza e aplica
      const k = Math.min(1, dt * (act ? 16 : 12));
      for (const key of keys) P[key] += (T[key] - P[key]) * k;
      J.armL.rotation.set(P.armLx, 0, P.armLz); J.armR.rotation.set(P.armRx, P.armRy, P.armRz);
      J.elbowL.rotation.x = P.elbowL; J.elbowR.rotation.x = P.elbowR; J.handR.rotation.z = P.handRz;
      J.legL.rotation.x = P.legL; J.legR.rotation.x = P.legR; J.kneeL.rotation.x = P.kneeL; J.kneeR.rotation.x = P.kneeR;
      J.torso.rotation.set(P.torsoX, P.torsoY, 0); J.head.rotation.set(P.headX - P.torsoX * 0.6, P.headY, 0);
      body.position.y = P.bodyY; body.scale.set(1, 1 + br * 0.008, 1);
      if (J.shadow) J.shadow.scale.setScalar(1 - Math.max(0, P.bodyY) * 1.2);
    },
    get toolTip() { if (!carry) return null; const v = new THREE.Vector3(); (carry.userData.spout ? carry : J.handR).localToWorld(v.copy(carry.userData.spout || V(0, -0.2, 0))); return v; },
  };
}
