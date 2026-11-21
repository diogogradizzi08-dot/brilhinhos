// Brilhinhos — o personagem do jogador em 3D: uma criança (cerca de 1,15 m) feita de
// peças, com rosto desenhado, cabelos, roupas com cor e estampa, acessórios, e um
// "animador" que mistura andar, correr e as ações (cortar, minerar, colher, plantar,
// regar, dar carinho, construir, pegar, comemorar e acenar), com a ferramenta na mão.
import * as THREE from './vendor/three.module.js';
import { GEO, mat, Builder, shade } from './creature3d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
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
function clothMat(color, pat = 'liso') {
  const k = `cloth|${color}|${pat}`; if (texCache.has(k)) return texCache.get(k);
  const m = new THREE.MeshStandardMaterial({ color: pat === 'liso' ? color : '#ffffff', map: pat === 'liso' ? null : patternTex(color, pat), roughness: 0.85 });
  texCache.set(k, m); return m;
}
// ---------- o rosto (desenhado num pedaço da cabeça) ----------
function faceTex(look, closed, happy) {
  const o = look.olhos; const k = ['face', o.tipo, o.cor, look.boca, look.sobrancelha, look.sardas, look.bochechas, look.cabelo.cor, look.pele, closed, happy].join('|');
  return canvasTex(k, 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h); x.lineCap = 'round'; x.lineJoin = 'round';
    const ex = [86, 170], ey = 124;
    const dark = '#2a1a14';
    // bochechas e sardas
    if (look.bochechas) for (const cx of [62, 194]) { const g = x.createRadialGradient(cx, 160, 2, cx, 160, 24); g.addColorStop(0, 'rgba(255,120,140,.55)'); g.addColorStop(1, 'rgba(255,120,140,0)'); x.fillStyle = g; x.fillRect(cx - 26, 134, 52, 52); }
    if (look.sardas) { x.fillStyle = shade(look.pele, 0, 0.1, -0.28); for (const [fx, fy] of [[70, 146], [80, 156], [62, 156], [186, 146], [176, 156], [194, 156]]) { x.beginPath(); x.arc(fx, fy, 3, 0, 7); x.fill(); } }
    // sobrancelhas
    x.strokeStyle = shade(look.cabelo.cor === '#e8e4dc' ? '#9a8a7a' : look.cabelo.cor, 0, 0, -0.08); x.lineWidth = look.sobrancelha === 'grossa' ? 11 : 7;
    for (const [i, cx] of ex.entries()) {
      const s = i ? 1 : -1; x.beginPath();
      if (look.sobrancelha === 'alegre') { x.moveTo(cx - 18, 82); x.quadraticCurveTo(cx, 68, cx + 18, 82); }
      else if (look.sobrancelha === 'decidido') { x.moveTo(cx - 18 * s * -1, 74); x.lineTo(cx + 18 * s * -1, 86); }
      else { x.moveTo(cx - 17, 80); x.quadraticCurveTo(cx, 73, cx + 17, 80); }
      x.stroke();
    }
    // olhos
    const shut = closed || happy || o.tipo === 'feliz';
    for (const cx of ex) {
      if (shut) { x.strokeStyle = dark; x.lineWidth = 7; x.beginPath(); x.arc(cx, ey + 6, 15, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); continue; }
      const big = o.tipo === 'grande' ? 1.25 : 1, sl = o.tipo === 'sonolento';
      const ry = (o.tipo === 'amendoa' ? 15 : 21) * big, rx = 16 * big;
      x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(cx, ey, rx, ry, 0, 0, 7); x.fill();
      x.fillStyle = o.cor; x.beginPath(); x.ellipse(cx + 1, ey + 3, rx * 0.72, ry * 0.78, 0, 0, 7); x.fill();
      x.fillStyle = '#120c0a'; x.beginPath(); x.ellipse(cx + 1, ey + 4, rx * 0.38, ry * 0.42, 0, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx - 5, ey - 6, 6 * big, 0, 7); x.fill(); x.beginPath(); x.arc(cx + 6, ey + 9, 2.6, 0, 7); x.fill();
      x.strokeStyle = dark; x.lineWidth = 4; x.beginPath(); x.ellipse(cx, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
      if (sl) { x.fillStyle = look.pele; x.fillRect(cx - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 0.9); x.strokeStyle = dark; x.beginPath(); x.moveTo(cx - rx, ey - ry * 0.1); x.lineTo(cx + rx, ey - ry * 0.1); x.stroke(); }
    }
    // boca
    const mx = 128, my = 182; x.strokeStyle = '#7a2a2a'; x.fillStyle = '#7a2030'; x.lineWidth = 6;
    const b = happy ? 'sorrisao' : look.boca;
    if (b === 'sorriso') { x.beginPath(); x.arc(mx, my - 12, 20, Math.PI * 0.18, Math.PI * 0.82); x.stroke(); }
    else if (b === 'sorrisao' || b === 'banguela' || b === 'linguinha') {
      x.beginPath(); x.moveTo(mx - 26, my - 8); x.quadraticCurveTo(mx, my + 34, mx + 26, my - 8); x.closePath(); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(mx - 18, my - 8, 36, 7);
      if (b === 'banguela') { x.fillStyle = '#7a2030'; x.fillRect(mx - 4, my - 8, 8, 8); }
      if (b === 'linguinha') { x.fillStyle = '#ff7a8a'; x.beginPath(); x.ellipse(mx + 4, my + 10, 10, 9, 0, 0, 7); x.fill(); }
    } else if (b === 'surpreso') { x.beginPath(); x.ellipse(mx, my, 11, 14, 0, 0, 7); x.fill(); }
    else if (b === 'timido') { x.beginPath(); x.arc(mx, my - 6, 10, Math.PI * 0.2, Math.PI * 0.8); x.stroke(); }
    // nariz
    x.strokeStyle = shade(look.pele, 0, 0.05, -0.18); x.lineWidth = 4; x.beginPath(); x.arc(mx, 150, 6, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
  });
}

// ---------- montagem ----------
function limbMesh(b, parent, m, len, r, y0 = 0) {
  const mesh = new THREE.Mesh(capGeo(r, len), m); mesh.position.y = y0 - len / 2; mesh.castShadow = true; parent.add(mesh); return mesh;
}
const halfRing = new THREE.TorusGeometry(1, 0.08, 8, 28, Math.PI);
const capCache = new Map();
function capGeo(r, len) { const k = r.toFixed(3) + '|' + len.toFixed(3); if (!capCache.has(k)) capCache.set(k, new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 5, 12)); return capCache.get(k); }

export function buildKid(look, opts = {}) {
  const b = new Builder(false);
  const skinM = mat(look.pele, { rough: 0.6 });
  const hairM = mat(look.cabelo.cor, { rough: 0.55 });
  const top = look.topo, bot = look.baixo, sh = look.calcado, A = look.acess || {};
  const topM = clothMat(top.cor, top.estampa), botM = clothMat(bot.cor, bot.estampa);
  const on = (id) => A[id]?.on;
  const acM = (id, def) => mat(A[id]?.cor || def, { rough: 0.5 });
  const root = new THREE.Group(); const body = b.g(root); // body sobe e desce
  const J = {}; // juntas
  // quadril e pernas
  const hipY = 0.5;
  J.pelvis = b.g(body, [0, hipY, 0]);
  b.m(J.pelvis, GEO.sph, botM, [0, 0, 0], [0.145, 0.095, 0.105]);
  const legLen = [0.22, 0.24];
  for (const sx of [1, -1]) {
    const side = sx > 0 ? 'L' : 'R';
    const up = b.g(J.pelvis, [sx * 0.075, -0.02, 0]); J['leg' + side] = up;
    const cover1 = bot.tipo === 'saia' ? skinM : botM;
    const thighM = bot.tipo === 'short' ? skinM : cover1;
    // coxa: o short cobre só o começo
    limbMesh(b, up, thighM, legLen[0], 0.058, 0);
    if (bot.tipo === 'short') limbMesh(b, up, botM, 0.12, 0.066, 0.01);
    const knee = b.g(up, [0, -legLen[0], 0]); J['knee' + side] = knee;
    const shinM = bot.tipo === 'calca' ? botM : skinM;
    limbMesh(b, knee, shinM, legLen[1], 0.05, 0);
    if (bot.tipo === 'bermuda') limbMesh(b, knee, botM, 0.06, 0.06, 0.02);
    const foot = b.g(knee, [0, -legLen[1] + 0.02, 0.025]);
    const shoeM = mat(sh.cor, { rough: 0.6 }), soleM = mat('#f4f4f4', { rough: 0.8 });
    if (sh.tipo === 'tenis') { b.m(foot, GEO.sph, shoeM, [0, 0.02, 0.02], [0.058, 0.045, 0.095]); b.m(foot, GEO.box, soleM, [0, -0.018, 0.02], [0.11, 0.025, 0.19]); b.m(foot, GEO.box, mat('#ffffff'), [0, 0.05, 0.05], [0.07, 0.01, 0.04], [0.5, 0, 0]); }
    else if (sh.tipo === 'bota') { b.m(foot, GEO.cyl, shoeM, [0, 0.07, -0.005], [0.06, 0.14, 0.06]); b.m(foot, GEO.sph, shoeM, [0, 0.02, 0.03], [0.06, 0.045, 0.095]); b.m(foot, GEO.box, mat('#4a3020'), [0, -0.018, 0.02], [0.115, 0.028, 0.19]); }
    else { // chinelo / sandália: o pé aparece
      b.m(foot, GEO.sph, skinM, [0, 0.015, 0.03], [0.045, 0.03, 0.085]);
      b.m(foot, GEO.box, shoeM, [0, -0.02, 0.025], [0.1, 0.02, 0.19]);
      if (sh.tipo === 'chinelo') { b.m(foot, GEO.box, mat(shade(sh.cor, 0, 0, -0.15)), [0, 0.02, 0.06], [0.08, 0.012, 0.014], [0, 0, 0]); b.m(foot, GEO.box, mat(shade(sh.cor, 0, 0, -0.15)), [0, 0.012, 0.075], [0.012, 0.03, 0.012]); }
      else for (const zz of [0.0, 0.07]) b.m(foot, GEO.box, mat(shade(sh.cor, 0, 0, -0.1)), [0, 0.02, zz], [0.1, 0.014, 0.02]);
    }
  }
  if (bot.tipo === 'saia') b.m(J.pelvis, GEO.cone, botM, [0, -0.07, 0], [0.2, 0.24, 0.17]);
  // tronco
  J.torso = b.g(body, [0, hipY + 0.03, 0]);
  const chest = b.m(J.torso, GEO.sph, topM, [0, 0.14, 0], [0.15, 0.19, 0.115]);
  if (top.tipo === 'regata') { chest.scale.x = 0.14; }
  if (top.tipo === 'camisa') { for (const sx of [1, -1]) b.m(J.torso, GEO.box, mat('#ffffff'), [sx * 0.035, 0.29, 0.07], [0.06, 0.02, 0.05], [0.4, sx * 0.5, sx * 0.3]); for (let i = 0; i < 3; i++) b.m(J.torso, GEO.sph, mat('#f4f4f4'), [0, 0.22 - i * 0.07, 0.113], 0.011); }
  if (top.tipo === 'moletom') { b.m(J.torso, GEO.sph, topM, [0, 0.28, -0.07], [0.12, 0.07, 0.07]); b.m(J.torso, GEO.box, mat(shade(top.cor, 0, 0, -0.08)), [0, 0.06, 0.1], [0.14, 0.06, 0.02]); for (const sx of [1, -1]) b.m(J.torso, GEO.cyl, mat('#ffffff'), [sx * 0.03, 0.2, 0.112], [0.005, 0.07, 0.005]); }
  if (top.tipo === 'regata') for (const sx of [1, -1]) b.m(J.torso, GEO.box, topM, [sx * 0.07, 0.28, 0], [0.04, 0.04, 0.11]);
  // braços
  for (const sx of [1, -1]) {
    const side = sx > 0 ? 'L' : 'R';
    const sh0 = b.g(J.torso, [sx * 0.165, 0.25, 0]); J['arm' + side] = sh0;
    const sleeve = top.tipo === 'regata' ? skinM : topM;
    limbMesh(b, sh0, sleeve, 0.15, 0.045, 0.02);
    const el = b.g(sh0, [0, -0.13, 0]); J['elbow' + side] = el;
    const longS = top.tipo === 'blusa' || top.tipo === 'moletom';
    limbMesh(b, el, longS ? topM : skinM, 0.13, 0.04, 0.01);
    const hand = b.g(el, [0, -0.13, 0]); J['hand' + side] = hand;
    b.m(hand, GEO.sph, skinM, [0, -0.01, 0], [0.042, 0.048, 0.038]);
  }
  // cabeça
  J.neck = b.g(J.torso, [0, 0.31, 0]);
  b.m(J.neck, GEO.cyl, skinM, [0, 0.02, 0], [0.04, 0.06, 0.04]);
  J.head = b.g(J.neck, [0, 0.17, 0.0]);
  const HR = 0.19;
  b.m(J.head, GEO.sph, skinM, [0, 0, 0], [HR, HR * 0.96, HR * 0.94]);
  for (const sx of [1, -1]) b.m(J.head, GEO.sph, skinM, [sx * HR * 0.97, -0.01, 0], [0.035, 0.05, 0.03]);
  b.m(J.head, GEO.sph, mat(shade(look.pele, 0, 0.05, -0.04), { rough: 0.6 }), [0, 0.012, HR * 0.93], [0.02, 0.016, 0.018]);
  const faceGeo = new THREE.SphereGeometry(HR * 1.004, 40, 24, Math.PI / 2 - 0.95, 1.9, 0.62, 1.38);
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex(look, false, false), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(faceGeo, faceMat); face.scale.set(1, 0.96, 0.94); face.renderOrder = 2; J.head.add(face);
  hair(b, J.head, HR, look.cabelo.estilo, hairM, skinM);
  // acessórios
  if (on('bone')) { const m = acM('bone', '#e2403a'); b.m(J.head, GEO.dome, m, [0, HR * 0.28, -0.005], [HR * 1.06, HR * 0.72, HR * 1.04], [-0.12, 0, 0]); b.m(J.head, GEO.cyl, m, [0, HR * 0.4, HR * 0.95], [HR * 0.62, 0.012, HR * 0.5], [0.12, 0, 0]); b.m(J.head, GEO.sph, mat('#ffffff'), [0, HR * 1.0, -0.01], 0.018); }
  if (on('chapeu')) { const m = acM('chapeu', '#f2d27a'); b.m(J.head, GEO.cyl, m, [0, HR * 0.55, 0], [HR * 1.75, 0.014, HR * 1.75], [-0.08, 0, 0]); b.m(J.head, GEO.dome, m, [0, HR * 0.5, 0], [HR * 0.98, HR * 0.85, HR * 0.98], [-0.08, 0, 0]); b.m(J.head, GEO.cyl, mat('#e2403a'), [0, HR * 0.6, 0], [HR * 0.99, 0.03, HR * 0.99], [-0.08, 0, 0]); }
  if (on('fones')) { const m = acM('fones', '#2b2f3a'); b.m(J.head, halfRing, m, [0, 0.02, -0.01], [HR * 1.1, HR * 1.12, 1.2]); for (const sx of [1, -1]) b.m(J.head, GEO.cyl, m, [sx * HR * 1.02, -0.01, 0], [0.05, 0.035, 0.05], [0, 0, Math.PI / 2]); }
  if (on('laco')) { const m = acM('laco', '#ff7ab8'); const g = b.g(J.head, [HR * 0.55, HR * 0.78, 0.02], [0, 0, -0.4]); for (const sx of [1, -1]) b.m(g, GEO.cone, m, [sx * 0.045, 0, 0], [0.04, 0.08, 0.03], [0, 0, sx * Math.PI / 2]); b.m(g, GEO.sph, m, [0, 0, 0], 0.022); }
  if (on('oculos') || on('oculos_sol')) {
    const sol = on('oculos_sol'); const fm = sol ? acM('oculos_sol', '#2b2f3a') : acM('oculos', '#3f63e0');
    for (const sx of [1, -1]) {
      const rim = b.m(J.head, GEO.ring, fm, [sx * 0.058, 0.05, HR * 0.96], [0.046, 0.046, 0.9]); rim.castShadow = false;
      if (sol) b.m(J.head, GEO.cyl, mat('#141820', { rough: 0.15, metal: 0.3 }), [sx * 0.058, 0.05, HR * 0.96], [0.044, 0.004, 0.044], [Math.PI / 2, 0, 0]);
      else b.m(J.head, GEO.cyl, mat('#cfe8ff', { op: 0.25, rough: 0.05 }), [sx * 0.058, 0.05, HR * 0.96], [0.044, 0.003, 0.044], [Math.PI / 2, 0, 0]);
      b.m(J.head, GEO.box, fm, [sx * HR * 0.72, 0.055, HR * 0.55], [0.008, 0.008, HR * 0.75], [0, sx * 0.35, 0]);
    }
    b.m(J.head, GEO.box, fm, [0, 0.055, HR * 0.99], [0.03, 0.008, 0.008]);
  }
  if (on('mochila')) { const m = acM('mochila', '#ff8a2a'); b.m(J.torso, GEO.box, m, [0, 0.15, -0.155], [0.22, 0.24, 0.09]); b.m(J.torso, GEO.sph, m, [0, 0.27, -0.155], [0.11, 0.04, 0.045]); b.m(J.torso, GEO.box, mat(shade(A.mochila?.cor || '#ff8a2a', 0, 0, -0.12)), [0, 0.1, -0.205], [0.15, 0.1, 0.03]); for (const sx of [1, -1]) b.m(J.torso, GEO.box, mat('#3a3a44'), [sx * 0.08, 0.2, 0.0], [0.025, 0.2, 0.235], [0, 0, 0]); }
  if (on('colar')) { const m = acM('colar', '#ffd34d'); const r = b.m(J.torso, GEO.ring, m, [0, 0.28, 0.02], [0.085, 0.085, 1.4], [Math.PI / 2 + 0.35, 0, 0]); r.castShadow = false; b.m(J.torso, GEO.oct, mat(A.colar?.cor || '#ffd34d', { metal: 0.6, rough: 0.25 }), [0, 0.22, 0.118], 0.02); }
  if (on('cachecol')) { const m = acM('cachecol', '#e2403a'); b.m(J.torso, GEO.ring, m, [0, 0.3, 0], [0.09, 0.09, 4], [Math.PI / 2, 0, 0]).scale.set(0.09, 0.09, 4); b.m(J.torso, GEO.box, m, [0.05, 0.2, 0.1], [0.05, 0.16, 0.02], [0.1, 0, 0.1]); }
  if (on('relogio')) { const m = acM('relogio', '#2b2f3a'); b.m(J.handL, GEO.cyl, m, [0, 0.04, 0], [0.044, 0.02, 0.044]); b.m(J.handL, GEO.cyl, mat('#ffffff'), [0, 0.04, 0.038], [0.02, 0.006, 0.02], [Math.PI / 2, 0, 0]); }
  if (on('pulseira')) { const m = acM('pulseira', '#ff7ab8'); const r = b.m(J.handR, GEO.ring, m, [0, 0.04, 0], [0.042, 0.042, 2], [Math.PI / 2, 0, 0]); r.scale.set(0.042, 0.042, 2.5); }
  // sombra no chão
  if (!opts.noShadow) { const shm = new THREE.Mesh(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false })); shm.rotation.x = -Math.PI / 2; shm.position.y = 0.012; root.add(shm); J.shadow = shm; }
  const faces = { open: faceTex(look, false, false), closed: faceTex(look, true, false), happy: faceTex(look, false, true) };
  const ctrl = kidController(J, body, faceMat, faces);
  root.userData = { ctrl, height: 1.15, kid: true, joints: J };
  return root;
}
function hair(b, head, R, style, m, skinM) {
  const cap = (s = 1.07, tilt = -0.32) => b.m(head, GEO.dome, m, [0, R * 0.05, -R * 0.04], [R * s, R * s * 0.98, R * s * 1.02], [tilt, 0, 0]);
  switch (style) {
    case 'careca': b.m(head, GEO.dome, mat(m.color.getStyle(), { rough: 0.95 }), [0, R * 0.02, -R * 0.02], [R * 1.012, R * 0.98, R * 0.97], [-0.42, 0, 0]); break;
    case 'curto': cap(); for (const sx of [1, -1]) b.m(head, GEO.sph, m, [sx * R * 0.82, R * 0.25, -R * 0.1], [R * 0.3, R * 0.45, R * 0.5]); break;
    case 'espetado': cap(1.05); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; b.m(head, GEO.cone, m, [Math.cos(a) * R * 0.45, R * 0.92, Math.sin(a) * R * 0.45 - R * 0.1], [R * 0.2, R * 0.55, R * 0.2], [Math.sin(a) * 0.6 - 0.3, 0, -Math.cos(a) * 0.6]); } break;
    case 'franja': cap(1.08); b.m(head, GEO.sph, m, [0, R * 0.55, R * 0.62], [R * 0.85, R * 0.32, R * 0.36], [0.5, 0, 0]); for (const sx of [1, -1]) b.m(head, GEO.sph, m, [sx * R * 0.85, R * 0.05, -R * 0.05], [R * 0.28, R * 0.7, R * 0.6]); break;
    case 'cacheado': cap(1.08); for (let i = 0; i < 26; i++) { const a = Math.PI * (-0.3 + (i % 9) / 8 * 1.6), row = Math.floor(i / 9); const y = [0.85, 0.45, 0.0][row]; const rr = R * (row === 0 ? 0.62 : 0.98); b.m(head, GEO.sph, m, [Math.cos(a) * rr, R * y, Math.sin(a) * rr * -1 - R * 0.05], R * 0.25); } b.m(head, GEO.sph, m, [0, R * 0.95, -R * 0.05], [R * 0.55, R * 0.25, R * 0.6]); break;
    case 'afro': b.m(head, GEO.sph, m, [0, R * 0.32, -R * 0.12], [R * 1.42, R * 1.28, R * 1.32]); b.m(head, GEO.sph, skinM, [0, -R * 0.12, R * 0.35], [R * 0.86, R * 0.78, R * 0.7]); break;
    case 'comprido': cap(1.08); b.m(head, GEO.sph, m, [0, -R * 0.45, -R * 0.55], [R * 0.95, R * 1.25, R * 0.45]); for (const sx of [1, -1]) b.m(head, GEO.sph, m, [sx * R * 0.82, -R * 0.4, R * 0.05], [R * 0.25, R * 0.95, R * 0.35]); break;
    case 'rabo': { cap(1.07); const g = b.g(head, [0, R * 0.55, -R * 0.85], [0.6, 0, 0]); b.m(g, GEO.sph, m, [0, -R * 0.55, -R * 0.12], [R * 0.32, R * 0.85, R * 0.32]); b.m(g, GEO.ring, mat('#ff7ab8'), [0, 0, 0], [R * 0.2, R * 0.2, 2], [Math.PI / 2, 0, 0]); break; }
    case 'chiquinhas': cap(1.07); for (const sx of [1, -1]) { const g = b.g(head, [sx * R * 0.9, R * 0.35, -R * 0.25], [0, 0, sx * 0.5]); b.m(g, GEO.sph, m, [sx * R * 0.25, -R * 0.45, 0], [R * 0.3, R * 0.65, R * 0.3]); b.m(g, GEO.sph, mat('#ff7ab8'), [0, 0, 0], R * 0.14); } break;
    case 'coque': cap(1.07); b.m(head, GEO.sph, m, [0, R * 1.05, -R * 0.2], R * 0.42); b.m(head, GEO.ring, mat('#ff7ab8'), [0, R * 0.8, -R * 0.15], [R * 0.3, R * 0.3, 2], [Math.PI / 2 - 0.2, 0, 0]); break;
    case 'moicano': b.m(head, GEO.dome, mat(m.color.getStyle(), { rough: 0.95 }), [0, R * 0.02, -R * 0.02], [R * 1.012, R * 0.98, R * 0.97], [-0.42, 0, 0]); for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.42; b.m(head, GEO.cone, m, [0, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95], [R * 0.09, R * 0.55, R * 0.28], [a, 0, 0]); } break;
    default: cap();
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
      if (happy) setFace('happy'); else if (blink < 0.12) setFace('closed'); else setFace('open');
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
