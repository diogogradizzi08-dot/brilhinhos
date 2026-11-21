// Brilhinhos — a natureza da fazendinha com mais capricho (ainda com cara de jogo infantil):
// árvores com tronco de verdade e copa em camadas iluminadas, pinheiros com neve, pedras com musgo,
// arbustos cheinhos, grama em lâminas que balançam com o vento, chão com variação, céu com nuvens,
// sombrinhas de contato e texturas de madeira, telha e pedra para as construções.
import * as THREE from './vendor/three.module.js';
import { shade } from './creature3d.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h) => new THREE.Color(h);
export const WIND = { value: 0 }; // o tempo do vento (a cena atualiza)

// ---------- texturas (canvas, em cache) ----------
const tex = new Map();
function canvasTex(key, w, h, draw, rep = [1, 1]) {
  if (tex.has(key)) return tex.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; tex.set(key, t); return t;
}
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
export function barkTex(color) {
  return canvasTex('bark|' + color, 128, 256, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h); const r = rng(11);
    for (let i = 0; i < 46; i++) { const px = r() * w; x.strokeStyle = shade(color, 0, 0, -0.12 - r() * 0.12); x.lineWidth = 2 + r() * 4; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(px, 0); for (let y = 0; y <= h; y += 32) x.lineTo(px + Math.sin(y * 0.05 + i) * 4, y); x.stroke(); }
    for (let i = 0; i < 60; i++) { x.globalAlpha = 0.35; x.fillStyle = shade(color, 0, 0, 0.1); x.fillRect(r() * w, r() * h, 2 + r() * 6, 1.5); }
  }, [2, 1]);
}
export function woodTex(color) { // tábuas com veios
  return canvasTex('wood|' + color, 256, 256, (x, w, h) => {
    const r = rng(5); const n = 4;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * h; x.fillStyle = shade(color, (r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.08); x.fillRect(0, y0, w, h / n);
      for (let k = 0; k < 14; k++) { x.strokeStyle = shade(color, 0, 0, -0.1 - r() * 0.08); x.globalAlpha = 0.45; x.lineWidth = 1; x.beginPath(); const yy = y0 + r() * h / n; x.moveTo(0, yy); x.bezierCurveTo(w * 0.3, yy + (r() - 0.5) * 8, w * 0.6, yy + (r() - 0.5) * 8, w, yy + (r() - 0.5) * 6); x.stroke(); }
      x.globalAlpha = 1; x.fillStyle = shade(color, 0, 0, -0.25); x.fillRect(0, y0, w, 3);
      if (r() < 0.6) { x.fillStyle = shade(color, 0, 0, -0.2); x.beginPath(); x.ellipse(r() * w, y0 + h / n / 2, 6, 3, 0, 0, 7); x.fill(); }
      for (const px of [10, w - 10]) { x.fillStyle = '#5a5a62'; x.beginPath(); x.arc(px, y0 + h / n / 2, 3, 0, 7); x.fill(); }
    }
  });
}
export function roofTex(color) { // telhas em fileiras
  return canvasTex('roof|' + color, 256, 256, (x, w, h) => {
    x.fillStyle = shade(color, 0, 0, -0.1); x.fillRect(0, 0, w, h);
    for (let row = 0; row < 8; row++) for (let i = 0; i < 9; i++) {
      const cx = i * 32 + (row % 2) * 16, cy = row * 32;
      const g = x.createLinearGradient(0, cy, 0, cy + 32); g.addColorStop(0, shade(color, 0, 0, 0.06)); g.addColorStop(1, shade(color, 0, 0, -0.14));
      x.fillStyle = g; x.beginPath(); x.moveTo(cx - 16, cy); x.lineTo(cx + 16, cy); x.lineTo(cx + 16, cy + 22); x.quadraticCurveTo(cx, cy + 34, cx - 16, cy + 22); x.closePath(); x.fill();
    }
  }, [2, 2]);
}
export function stoneTex(color) { // parede de pedras
  return canvasTex('stone|' + color, 256, 256, (x, w, h) => {
    x.fillStyle = shade(color, 0, 0, -0.22); x.fillRect(0, 0, w, h); const r = rng(9);
    for (let row = 0; row < 6; row++) for (let i = 0; i < 5; i++) {
      const cx = i * 54 + (row % 2) * 27 + r() * 6, cy = row * 44 + 22 + r() * 4;
      x.fillStyle = shade(color, (r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.14); x.beginPath(); x.ellipse(cx, cy, 24 + r() * 4, 18 + r() * 3, r() * 0.3, 0, 7); x.fill();
      x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(cx - 6, cy - 6, 10, 5, 0, 0, 7); x.fill();
    }
  }, [3, 1.5]);
}
export function soilTex() { // terra com sulcos
  return canvasTex('soil', 256, 256, (x, w, h) => {
    x.fillStyle = '#5a3a24'; x.fillRect(0, 0, w, h); const r = rng(3);
    for (let i = 0; i < 6; i++) { const y = i * (h / 6); const g = x.createLinearGradient(0, y, 0, y + h / 6); g.addColorStop(0, '#6e4a2e'); g.addColorStop(0.5, '#4a2e1c'); g.addColorStop(1, '#6e4a2e'); x.fillStyle = g; x.fillRect(0, y, w, h / 6); }
    for (let i = 0; i < 400; i++) { x.fillStyle = r() < 0.5 ? '#3a2416' : '#7a5636'; x.globalAlpha = 0.5; x.fillRect(r() * w, r() * h, 2, 2); }
  });
}
// sombrinha redonda e suave no chão (dá "peso" às coisas)
let blobM = null;
export function contactShadow(parent, r = 1, opacity = 0.32) {
  blobM ||= new THREE.MeshBasicMaterial({ map: canvasTex('blob', 128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }), transparent: true, depthWrite: false, opacity });
  const m = new THREE.Mesh(blobGeo(), blobM); m.rotation.x = -Math.PI / 2; m.position.y = 0.035; m.scale.setScalar(r); m.castShadow = false; m.renderOrder = 1; parent.add(m); return m;
}
let _bg = null; const blobGeo = () => (_bg ||= new THREE.CircleGeometry(1, 24));

// ---------- vento: balança o que está acima de uma altura ----------
export function windy(m, amp = 0.05, minY = 1.0, speed = 1.0) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec4 wp0 = modelMatrix * vec4(position, 1.0);
        #ifdef USE_INSTANCING
          wp0 = modelMatrix * instanceMatrix * vec4(position, 1.0);
        #endif
        float hh = max(0.0, position.y - ${minY.toFixed(3)});
        transformed.x += sin(uWind * ${(1.6 * speed).toFixed(3)} + wp0.x * 0.55 + wp0.z * 0.35) * ${amp.toFixed(4)} * hh;
        transformed.z += cos(uWind * ${(1.25 * speed).toFixed(3)} + wp0.z * 0.5 + wp0.x * 0.2) * ${(amp * 0.7).toFixed(4)} * hh; }`);
  };
  m.customProgramCacheKey = () => `wind${amp}|${minY}|${speed}`;
  return m;
}
// material de cor por vértice (cada face com seu tom: luz em cima, sombra embaixo)
const vcCache = new Map();
export function vcMat(o = {}) {
  const k = JSON.stringify(o); if (vcCache.has(k)) return vcCache.get(k);
  let m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: o.flat ?? true, roughness: o.rough ?? 0.82, metalness: o.metal ?? 0, emissive: o.emis ? C(o.emis) : C('#000'), emissiveIntensity: o.glow || 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
  if (o.wind) m = windy(m, o.wind, o.windY ?? 1.0, o.windS ?? 1);
  vcCache.set(k, m); return m;
}

// ---------- geometria orgânica: desloca os vértices com ruído e pinta face por face ----------
function noise3(x, y, z, s) { const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s * 4.1) * 43758.5453; return h - Math.floor(h); }
function lumpy(geo, amt, seed) {
  const p = geo.attributes.position; const v = V(0, 0, 0); const keyMap = new Map();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const k = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let f = keyMap.get(k); if (f === undefined) { f = 1 + (noise3(v.x, v.y, v.z, seed) - 0.5) * amt; keyMap.set(k, f); }
    p.setXYZ(i, v.x * f, v.y * f, v.z * f);
  }
  return geo;
}
// pinta cada triângulo: fn(centro, normal, índice) -> cor
function paint(geo, fn) {
  if (geo.index) geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  const p = geo.attributes.position; const col = new Float32Array(p.count * 3);
  const a = V(0, 0, 0), b = V(0, 0, 0), c = V(0, 0, 0), ctr = V(0, 0, 0), n = V(0, 0, 0);
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    ctr.copy(a).add(b).add(c).multiplyScalar(1 / 3); n.copy(b).sub(a).cross(c.clone().sub(a)).normalize();
    const cc = fn(ctr, n, i / 3);
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = cc.r; col[(i + k) * 3 + 1] = cc.g; col[(i + k) * 3 + 2] = cc.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
}
const geoCache = new Map();
const cached = (k, f) => { if (!geoCache.has(k)) geoCache.set(k, f()); return geoCache.get(k); };
// um "tufo" de folhas: bola macia e irregular, escura embaixo e iluminada em cima (cor por vértice)
export function foliageGeo(color, variant = 0, light = 0.16) {
  return cached(`fol2|${color}|${variant}|${light}`, () => {
    const g = lumpy(new THREE.SphereGeometry(1, 11, 8), 0.24, variant * 7 + 1); g.computeVertexNormals();
    const base = C(color), dark = C(shade(color, 0.01, 0.04, -0.09)), lite = C(shade(color, -0.025, 0.02, light + 0.04));
    const p = g.attributes.position; const col = new Float32Array(p.count * 3); const v = V(0, 0, 0);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const t = THREE.MathUtils.clamp(v.y * 0.55 + 0.5 + (noise3(v.x * 3, v.y * 3, v.z * 3, variant) - 0.5) * 0.28, 0, 1);
      const c = dark.clone().lerp(base, Math.min(1, t * 1.7)).lerp(lite, Math.max(0, t - 0.6) * 2.2);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
  });
}
// cone de pinheiro com neve na ponta das camadas
export function pineGeo(color, snow, variant = 0) {
  return cached(`pine|${color}|${snow}|${variant}`, () => {
    const g = lumpy(new THREE.ConeGeometry(1, 1, 9, 2), 0.18, variant + 3);
    const base = C(color), dark = C(shade(color, 0, 0.05, -0.14)), white = C('#f4fbff');
    return paint(g, (ctr, n, i) => { const top = n.y > 0.35 && snow; const cc = dark.clone().lerp(base, THREE.MathUtils.clamp(ctr.y + 0.6, 0, 1)); if (top && (ctr.y > 0.05 || noise3(i, 2, variant, 5) < 0.4)) cc.lerp(white, 0.85); return cc.offsetHSL(0, 0, (noise3(i, 4, 1, 9) - 0.5) * 0.04); });
  });
}
// pedra: facetada, com musgo, neve ou areia no topo e fendas mais escuras
export function rockGeo(color, top, variant = 0) {
  return cached(`rock|${color}|${top}|${variant}`, () => {
    const g = lumpy(new THREE.DodecahedronGeometry(1, 1), 0.34, variant * 5 + 2); g.scale(1, 0.72, 1);
    const base = C(color), dark = C(shade(color, 0, 0, -0.18)), lite = C(shade(color, 0, -0.03, 0.12)); const tc = top ? C(top) : null;
    return paint(g, (ctr, n, i) => { let cc = dark.clone().lerp(base, THREE.MathUtils.clamp(ctr.y + 0.75, 0, 1)); if (n.y > 0.2) cc.lerp(lite, n.y * 0.6); if (tc && n.y > 0.62 && noise3(i, 1, variant, 2) > 0.25) cc = tc.clone().offsetHSL(0, 0, (noise3(i, 6, 1, 1) - 0.5) * 0.08); return cc.offsetHSL(0, 0, (noise3(i, 3, variant, 7) - 0.5) * 0.06); });
  });
}
// tronco com raízes (torno), afinando para cima
export function trunkGeo(h = 2.0, r0 = 0.16) {
  return cached(`trunk|${h}|${r0}`, () => {
    const pts = [[r0 * 2.2, 0], [r0 * 1.45, 0.08], [r0 * 1.1, 0.25], [r0, 0.6], [r0 * 0.85, h * 0.6], [r0 * 0.7, h * 0.92], [r0 * 0.55, h]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 12); return lumpy(g, 0.08, 4);
  });
}
// lâmina de grama: fininha, escura na base e clara na ponta
export function bladeGeo() {
  return cached('blade', () => {
    const g = new THREE.BufferGeometry(); const h = 0.38, w = 0.045;
    const pos = [-w, 0, 0, w, 0, 0, -w * 0.7, h * 0.45, 0.02, w * 0.7, h * 0.45, 0.02, -w * 0.3, h * 0.8, 0.05, w * 0.3, h * 0.8, 0.05, 0, h, 0.09];
    const idx = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
    const col = []; for (let i = 0; i < 7; i++) { const t = pos[i * 3 + 1] / h; const cc = C('#3a6a24').lerp(C('#d8f0a0'), t * 0.85); col.push(cc.r, cc.g, cc.b); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  });
}

// ---------- o céu: degradê, sol e nuvens fofas ----------
export function skyDome(scene, top, horizon, sunDir = V(0.4, 0.6, -0.7)) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cTop: { value: C(top) }, cHor: { value: C(horizon) }, sunD: { value: sunDir.clone().normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cTop; uniform vec3 cHor; uniform vec3 sunD; varying vec3 vD; void main(){ float t = clamp(vD.y * 1.6, 0.0, 1.0); vec3 c = mix(cHor, cTop, pow(t, 0.8)); float s = max(dot(vD, sunD), 0.0); c += vec3(1.0,0.95,0.8) * (pow(s, 64.0) * 0.8 + pow(s, 6.0) * 0.12); gl_FragColor = vec4(c, 1.0); }',
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(230, 32, 16), m); dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
  // nuvens: grupos de bolinhas brancas achatadas
  const cloudM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: C('#ffffff'), emissiveIntensity: 0.25, flatShading: false });
  const clouds = new THREE.Group(); scene.add(clouds); const r = rng(21);
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Group(); const a = r() * Math.PI * 2, d = 70 + r() * 70; c.position.set(Math.cos(a) * d, 26 + r() * 18, Math.sin(a) * d);
    for (let k = 0; k < 5; k++) { const s = 4 + r() * 4; const b = new THREE.Mesh(cached('cl', () => new THREE.SphereGeometry(1, 14, 10)), cloudM); b.position.set((k - 2) * 4.2 + r() * 2, Math.sin(k) * 1.2, r() * 3); b.scale.set(s, s * 0.6, s * 0.8); c.add(b); }
    c.lookAt(0, c.position.y, 0); clouds.add(c);
  }
  return { dome, clouds, update(dt, at) { dome.position.copy(at); clouds.position.set(at.x, 0, at.z); clouds.rotation.y += dt * 0.004; } };
}
// variação grande no chão (manchas mais claras e mais escuras), sem repetir a textura de forma óbvia
export function groundVariation(m, strength = 0.14) {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev?.(sh, r);
    sh.vertexShader = 'varying vec3 vGW;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'varying vec3 vGW;\nfloat gHash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }\nfloat gNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(gHash(i), gHash(i+vec2(1,0)), f.x), mix(gHash(i+vec2(0,1)), gHash(i+vec2(1,1)), f.x), f.y); }\n' +
      sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        { float nA = gNoise(vGW.xz * 0.09) * 0.65 + gNoise(vGW.xz * 0.31) * 0.35; diffuseColor.rgb *= mix(${(1 - strength).toFixed(3)}, ${(1 + strength * 0.8).toFixed(3)}, nA);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.06, 1.02, 0.86), smoothstep(0.62, 0.8, gNoise(vGW.xz * 0.05 + 11.0)) * 0.6); }`);
  };
  m.customProgramCacheKey = () => 'groundvar' + strength;
  return m;
}

// =========================== rodada 9: estilo ilha tropical ===========================
// palha trançada (a cesta do comedouro)
export function strawTex(color) {
  return canvasTex('straw|' + color, 256, 256, (x, w, h) => {
    x.fillStyle = shade(color, 0, 0, -0.18); x.fillRect(0, 0, w, h); const r = rng(9); const n = 8, m = 16;
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { // trama: tiras que passam por cima e por baixo
      const over = (i + j) % 2 === 0; const cx = (j + 0.5) * (w / n), cy = (i + 0.5) * (h / m);
      const g = x.createLinearGradient(0, cy - h / m / 2, 0, cy + h / m / 2); const c0 = shade(color, (r() - 0.5) * 0.02, 0, over ? 0.08 : -0.06);
      g.addColorStop(0, shade(c0, 0, 0, -0.16)); g.addColorStop(0.5, c0); g.addColorStop(1, shade(c0, 0, 0, -0.2)); x.fillStyle = g;
      x.beginPath(); x.ellipse(cx, cy, w / n * 0.56, h / m * 0.46, 0, 0, 7); x.fill();
    }
    for (let i = 0; i < 160; i++) { x.globalAlpha = 0.35; x.strokeStyle = shade(color, 0, 0, 0.18); x.lineWidth = 1; const px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 8 + r() * 10, py + (r() - 0.5) * 2); x.stroke(); }
  }, [3, 1]);
}
// aduelas de barril: tábuas em pé
export function staveTex(color) {
  return canvasTex('stave|' + color, 256, 128, (x, w, h) => {
    const r = rng(13); const n = 10;
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * w; x.fillStyle = shade(color, (r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.1); x.fillRect(x0, 0, w / n, h);
      for (let k = 0; k < 6; k++) { x.strokeStyle = shade(color, 0, 0, -0.12 - r() * 0.08); x.globalAlpha = 0.5; x.lineWidth = 1; x.beginPath(); const xx = x0 + r() * w / n; x.moveTo(xx, 0); x.bezierCurveTo(xx + (r() - 0.5) * 4, h * 0.4, xx + (r() - 0.5) * 4, h * 0.6, xx + (r() - 0.5) * 3, h); x.stroke(); }
      x.globalAlpha = 1; x.fillStyle = shade(color, 0, 0, -0.3); x.fillRect(x0, 0, 2, h);
    }
  }, [2, 1]);
}
// caminho de areia com bordas macias
function sandTex(color) {
  return canvasTex('sand|' + color, 64, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.22, '#000'); g.addColorStop(0.78, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = color; x.fillRect(0, 0, w, h); const r = rng(17);
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? shade(color, 0, 0, -0.1) : shade(color, 0, 0, 0.08); x.fillRect(r() * w, r() * h, 1.5, 1.5); }
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
  }, [1, 1]);
}
const SAND = { planta: '#e9c27a', agua: '#ecca86', vento: '#e4cc96', pedra: '#e8b872', gelo: '#e8f4fa', fogo: '#8a5a48', eletrico: '#a09ab8', cosmo: '#8a78c8' };
// caminhos de areia ligando os lotes liberados (como as trilhas de uma ilha) e uma pracinha no meio
export function sandPaths(world, el, zonas, ZONE, zoneCenter, parseKey) {
  const col = SAND[el] || '#f1d79a';
  const m = new THREE.MeshStandardMaterial({ map: sandTex(col), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 });
  const g = new THREE.Group(); world.add(g);
  const ribbon = (a, b, wid, seed) => {
    const pts = []; const N = 14; const dx = b[0] - a[0], dz = b[1] - a[1]; const len = Math.hypot(dx, dz); const nx = -dz / len, nz = dx / len;
    for (let i = 0; i <= N; i++) { const t = i / N; const off = Math.sin(t * Math.PI * 2 + seed) * 0.7 * Math.sin(t * Math.PI); pts.push([a[0] + dx * t + nx * off, a[1] + dz * t + nz * off]); }
    const pos = [], uv = [], idx = [];
    pts.forEach(([px, pz], i) => {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(N, i + 1)]; let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const w2 = wid * (0.85 + 0.15 * Math.sin(i * 1.7 + seed)) / 2;
      pos.push(px - tz * w2, 0, pz + tx * w2, px + tz * w2, 0, pz - tx * w2); uv.push(0, i / N * len / 3, 1, i / N * len / 3);
      if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, m); mesh.position.y = 0.022; mesh.receiveShadow = true; mesh.renderOrder = 1; g.add(mesh);
  };
  const open = new Set(zonas); let seed = 1;
  for (const k of open) {
    const [cx, cz] = zoneCenter(k); const [zx, zz] = parseKey(k);
    for (const [dx, dz] of [[1, 0], [0, 1]]) if (open.has(`${zx + dx},${zz + dz}`)) ribbon([cx, cz], [cx + dx * ZONE, cz + dz * ZONE], 1.7, seed++);
  }
  // pracinha redonda onde o personagem começa
  const plazaTex = canvasTex('plaza|' + col, 128, 128, (x, w) => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, col); gr.addColorStop(0.72, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); const r = rng(4); for (let i = 0; i < 120; i++) { x.globalAlpha = 0.4; x.fillStyle = shade(col, 0, 0, r() < 0.5 ? -0.1 : 0.08); x.fillRect(16 + r() * 96, 16 + r() * 96, 2, 2); } });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), new THREE.MeshStandardMaterial({ map: plazaTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.021, 1.2); plaza.renderOrder = 1; plaza.receiveShadow = true; g.add(plaza);
  return g;
}
// a lagoa azul-turquesa além da borda norte da fazendinha (cada região com a sua água)
const WATER = { planta: ['#6ff0e0', '#16a6d8'], agua: ['#7af2e8', '#1594d6'], vento: ['#8ff0f0', '#3aa8e0'], pedra: ['#7fe8d8', '#2a9ac8'], gelo: ['#d8fbff', '#6ac8e8'], fogo: ['#ffd04a', '#e8400a'], eletrico: ['#9ab8ff', '#2a3a9a'], cosmo: ['#d8a8ff', '#4a2a9a'] };
export function lagoon(world, el, edgeZ, fogColor) {
  const [shallow, deep] = WATER[el] || WATER.planta; const glow = el === 'fogo' ? 1.0 : 0.0;
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: WIND, cS: { value: C(shallow) }, cD: { value: C(deep) }, cF: { value: C(fogColor) }, uEdge: { value: edgeZ }, uGlow: { value: glow } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform vec3 cS; uniform vec3 cD; uniform vec3 cF; uniform float uEdge; uniform float uGlow; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }',
      'void main(){',
      '  float shore = (uEdge - vW.z) + sin(vW.x * 0.35 + uT * 0.8) * 0.6;',
      '  vec3 c = mix(cS, cD, smoothstep(0.5, 14.0, shore));',
      '  float w = n(vW.xz * 0.5 + vec2(uT * 0.25, uT * 0.18)) * 0.6 + n(vW.xz * 1.3 - vec2(uT * 0.3, 0.0)) * 0.4;',
      '  c += vec3(1.0) * smoothstep(0.72, 0.9, w) * 0.22 * (1.0 - smoothstep(10.0, 40.0, shore));',
      '  float foam = smoothstep(1.2, 0.2, abs(shore - 0.9 - sin(uT * 1.3) * 0.35)) * 0.85;',
      '  c = mix(c, vec3(1.0), foam * (1.0 - uGlow * 0.5));',
      '  c *= 1.0 + uGlow * 0.6;',
      '  c = mix(c, cF, smoothstep(40.0, 110.0, length(cameraPosition - vW)));',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <colorspace_fragment>',
      '}'].join('\n'),
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(320, 160, 1, 1), m); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.045, edgeZ - 80 - 2.5); water.renderOrder = 2; world.add(water);
  // praia de areia entre a fazendinha e a água
  const col = SAND[el] || '#f1d79a';
  const beachTex = canvasTex('beach|' + col, 64, 64, (x, w, hh) => { x.fillStyle = col; x.fillRect(0, 0, w, hh); const r = rng(8); for (let i = 0; i < 90; i++) { x.fillStyle = shade(col, 0, 0, r() < 0.5 ? -0.08 : 0.06); x.fillRect(r() * w, r() * hh, 1.5, 1.5); } }, [40, 2]);
  const beach = new THREE.Mesh(new THREE.PlaneGeometry(320, 5.5), new THREE.MeshStandardMaterial({ map: beachTex, roughness: 1 })); beach.rotation.x = -Math.PI / 2; beach.position.set(0, 0.04, edgeZ - 2.75 + 0.3); beach.receiveShadow = true; world.add(beach);
  return water;
}

// lagoinha redonda com margem de areia, água que brilha e (onde é verde) folhas de vitória-régia
const pondMats = new Map();
function pondMat(el, fogColor, dimmed) {
  const k = el + fogColor + dimmed; if (pondMats.has(k)) return pondMats.get(k);
  const [shallow, deep] = WATER[el] || WATER.planta; const glow = el === 'fogo' ? 1.0 : 0.0;
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: WIND, cS: { value: C(shallow) }, cD: { value: C(deep) }, cF: { value: C(fogColor) }, uGlow: { value: glow }, uDim: { value: dimmed ? 0.5 : 1.0 } },
    vertexShader: 'attribute float aShore; varying float vS; varying vec3 vW; void main(){ vS = aShore; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: [
      'uniform float uT; uniform vec3 cS; uniform vec3 cD; uniform vec3 cF; uniform float uGlow; uniform float uDim; varying float vS; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }',
      'void main(){',
      '  vec3 c = mix(cS, cD, smoothstep(0.05, 0.85, vS));',
      '  float w = n(vW.xz * 1.6 + vec2(uT * 0.3, uT * 0.22)) * 0.6 + n(vW.xz * 3.1 - vec2(uT * 0.35, 0.0)) * 0.4;',
      '  c += vec3(1.0) * smoothstep(0.7, 0.9, w) * 0.25;',
      '  c = mix(c, vec3(1.0), smoothstep(0.16, 0.0, vS - 0.04 * sin(uT * 1.5 + vW.x * 2.0)) * 0.8 * (1.0 - uGlow * 0.4));',
      '  c *= (1.0 + uGlow * 0.6) * uDim;',
      '  c = mix(c, cF, smoothstep(40.0, 110.0, length(cameraPosition - vW)));',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <colorspace_fragment>',
      '}'].join('\n'),
  });
  pondMats.set(k, m); return m;
}
export function pond(world, el, p, open, fogColor) {
  const r = rng(p.seed + 3); const N = 40; const rad = []; for (let i = 0; i < N; i++) rad.push(p.r * (0.86 + 0.14 * Math.sin(i * 0.9 + p.seed) + (r() - 0.5) * 0.08));
  const shape = (scale, add) => { const pos = [0, 0, 0], sh = [1], idx = []; for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; const rr = rad[i] * scale + add; pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr); sh.push(0); idx.push(0, ((i + 1) % N) + 1, i + 1); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aShore', new THREE.Float32BufferAttribute(sh, 1)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  const grp = new THREE.Group(); grp.position.set(p.x, 0, p.z); world.add(grp);
  const col = SAND[el] || '#f1d79a'; const sandM = new THREE.MeshStandardMaterial({ color: open ? col : shade(col, 0, -0.2, -0.3), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  const shore = new THREE.Mesh(shape(1, 0.55), sandM); shore.position.y = 0.025; shore.receiveShadow = true; grp.add(shore);
  const water = new THREE.Mesh(shape(1, 0), pondMat(el, fogColor, !open)); water.position.y = 0.05; grp.add(water);
  if (['planta', 'agua', 'vento'].includes(el)) { // vitórias-régias e uma florzinha
    const padM = new THREE.MeshStandardMaterial({ color: open ? '#4fb83a' : '#2e5a2a', roughness: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) { const a = r() * 6.28, d = p.r * (0.25 + r() * 0.45); const pad = new THREE.Mesh(new THREE.CircleGeometry(0.22 + r() * 0.12, 12, 0.4, Math.PI * 2 - 0.5), padM); pad.rotation.set(-Math.PI / 2, 0, r() * 6); pad.position.set(Math.cos(a) * d, 0.065, Math.sin(a) * d); grp.add(pad);
      if (i === 0 && open) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#ff8ac8', roughness: 0.5 })); fl.position.set(pad.position.x, 0.11, pad.position.z); grp.add(fl); } }
  }
  // pedrinhas na margem
  const stoneM = new THREE.MeshStandardMaterial({ color: open ? '#a8a2a0' : '#4a4848', roughness: 0.9, flatShading: true });
  for (let i = 0; i < 5; i++) { const a = r() * 6.28; const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + r() * 0.12, 0), stoneM); const rr = rad[Math.floor((a / 6.28) * N) % N] + 0.35; st.position.set(Math.cos(a) * rr, 0.06, Math.sin(a) * rr); st.scale.y = 0.6; st.castShadow = open; grp.add(st); }
  return grp;
}
