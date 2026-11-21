// Brilhinhos — o terreno de cada fazendinha (sem 3D: o jogo e a tela usam as mesmas contas).
// A fazendinha é uma grade de 5×5 lotes de 10 m. Começa só com o lote do meio liberado;
// "Aumentar" libera um lote vizinho de cada vez. Cada lote tem árvores, rochas e arbustos
// sempre no mesmo lugar (sorteados pela região e pela posição do lote).
export const ZONE = 10, HALF = 2, MAX_ZONES = 25;
export const zkey = (x, z) => `${x},${z}`;
export const parseKey = (k) => k.split(',').map(Number);
export const zoneCenter = (k) => { const [x, z] = parseKey(k); return [x * ZONE, z * ZONE]; };
export const zoneAt = (px, pz) => zkey(Math.round(px / ZONE), Math.round(pz / ZONE));
export const inGrid = (x, z) => Math.abs(x) <= HALF && Math.abs(z) <= HALF;
export const ALL_ZONES = []; for (let z = -HALF; z <= HALF; z++) for (let x = -HALF; x <= HALF; x++) ALL_ZONES.push(zkey(x, z));
// ordem "em espiral" a partir do meio (usada para converter jogos antigos)
export const ZONE_ORDER = [...ALL_ZONES].sort((a, b) => { const [ax, az] = parseKey(a), [bx, bz] = parseKey(b); return (Math.abs(ax) + Math.abs(az)) - (Math.abs(bx) + Math.abs(bz)) || (Math.max(Math.abs(ax), Math.abs(az)) - Math.max(Math.abs(bx), Math.abs(bz))) || (Math.atan2(az, ax) - Math.atan2(bz, bx)); });
export const neighbors = (k) => { const [x, z] = parseKey(k); return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]).filter(([a, b]) => inGrid(a, b)).map(([a, b]) => zkey(a, b)); };

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const zoneRng = (rid, k, salt = 0) => rng(hashStr(rid + ':' + k + ':' + salt));

// quanto de cada recurso por lote, pelo bioma: [árvores, rochas, arbustos]
const BIOME = { planta: [4, 1, 2], agua: [3, 1, 2], fogo: [1, 3, 1], vento: [2, 2, 2], gelo: [2, 2, 1], pedra: [1, 4, 1], eletrico: [2, 3, 1], cosmo: [1, 3, 2] };
export const RES_R = { arvore: 0.8, rocha: 0.85, arbusto: 0.55 };
// lugares fixos do lote do meio: onde o jogador nasce e onde fica quem pede socorro
export const SPAWN = [0, 2], NPC_SPOT = [3.4, -3.2];
const RESERVED = [[...SPAWN, 2.2], [...NPC_SPOT, 1.8]];

// lagoinhas azul-turquesa espalhadas pelos lotes (nunca no lote do meio)
const pondCache = new Map();
export function zonePond(rid, k) {
  const ck = rid + '|' + k; if (pondCache.has(ck)) return pondCache.get(ck);
  let out = null;
  if (k !== '0,0') { const r = zoneRng(rid, k, 31); if (r() < 0.35 || k === '0,-1' || k === '-1,-1') { const [cx, cz] = zoneCenter(k); out = { x: cx + (r() - 0.5) * 4, z: cz + (r() - 0.5) * 4, r: 1.5 + r() * 1.1, seed: Math.floor(r() * 1000) }; } }
  pondCache.set(ck, out); return out;
}
export const pondsOf = (rid, zonas) => zonas.map((k) => zonePond(rid, k)).filter(Boolean);
const zoneCache = new Map();
export function zoneResources(rid, el, k) {
  const ck = rid + '|' + k; if (zoneCache.has(ck)) return zoneCache.get(ck);
  const rnd = zoneRng(rid, k); const [cx, cz] = zoneCenter(k); const center = k === '0,0';
  const [nt, nr, nb] = BIOME[el] || [2, 2, 1];
  const want = [];
  for (let i = 0; i < (center ? Math.min(2, nt) : nt + (rnd() < 0.5 ? 1 : 0)); i++) want.push('arvore');
  for (let i = 0; i < (center ? 1 : nr); i++) want.push('rocha');
  for (let i = 0; i < (center ? 1 : nb + (rnd() < 0.4 ? 1 : 0)); i++) want.push('arbusto');
  const out = []; let n = 0; const pond = zonePond(rid, k);
  for (const tipo of want) {
    for (let tries = 0; tries < 40; tries++) {
      let x = cx + (rnd() - 0.5) * (ZONE - 2), z = cz + (rnd() - 0.5) * (ZONE - 2);
      if (center) { // no lote do meio os recursos ficam nas bordas, para sobrar espaço para construir
        const a = rnd() * Math.PI * 2, r = 3.4 + rnd() * 1.2; x = Math.cos(a) * r; z = Math.sin(a) * r;
      }
      const r = RES_R[tipo];
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 1.1)) continue;
      if (center && RESERVED.some(([ax, az, ar]) => Math.hypot(ax - x, az - z) < ar + r)) continue;
      if (pond && Math.hypot(pond.x - x, pond.z - z) < pond.r + r + 0.6) continue;
      out.push({ id: `${k}:${n++}`, tipo, x, z, r, s: 0.85 + rnd() * 0.35, rot: rnd() * 6.28 });
      break;
    }
  }
  zoneCache.set(ck, out); return out;
}
// enfeites do lote (pedrinhas, flores, cogumelos...): só visual, somem se você construir em cima
export function zoneProps(rid, k, n = 5) {
  const rnd = zoneRng(rid, k, 7); const [cx, cz] = zoneCenter(k); const out = [];
  for (let i = 0; i < n; i++) out.push({ x: cx + (rnd() - 0.5) * (ZONE - 1), z: cz + (rnd() - 0.5) * (ZONE - 1), s: 0.5 + rnd() * 0.5, v: rnd() });
  return out;
}
// o ponto está todo dentro da área liberada?
export function insideOpen(zonas, x, z, r = 0) {
  const pts = [[x, z], [x + r, z], [x - r, z], [x, z + r], [x, z - r]];
  return pts.every(([px, pz]) => zonas.includes(zoneAt(px, pz)) && inGrid(...parseKey(zoneAt(px, pz))));
}
// mantém um ponto dentro da área liberada (o jogador não anda no que está bloqueado)
export function clampOpen(zonas, x, z, margin = 0.4) {
  if (insideOpen(zonas, x, z, margin)) return [x, z];
  let best = null, bd = 1e9;
  for (const k of zonas) {
    const [cx, cz] = zoneCenter(k); const h = ZONE / 2 - margin;
    const px = Math.max(cx - h, Math.min(cx + h, x)), pz = Math.max(cz - h, Math.min(cz + h, z));
    const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = [px, pz]; }
  }
  return best || [0, 0];
}
