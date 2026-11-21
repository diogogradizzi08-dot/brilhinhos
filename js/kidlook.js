// Brilhinhos — as opções do personagem do jogador (sem 3D): o que dá para escolher.
export const SKIN = ['#ffe0c7', '#f6caa4', '#e8ae7e', '#c98a5a', '#a86a40', '#7a4a2c', '#5a3420'];
export const HAIR_COLORS = ['#2a1d16', '#5a3a22', '#8a5a34', '#d9a54a', '#f2d27a', '#c2502a', '#e8e4dc', '#4f7dff', '#ff7ab8', '#4fbf7a', '#9a6aff'];
export const COLORS = ['#e2403a', '#ff8a2a', '#ffd34d', '#5fd27a', '#2fb5a0', '#4fc3f7', '#3f63e0', '#8a5cd6', '#ff7ab8', '#ffffff', '#9aa3b5', '#2b2f3a', '#8a5a34', '#f2e2c8'];
export const EYE_COLORS = ['#3a2416', '#1a1a1a', '#5a8a3a', '#3a7ad6', '#b07a2a'];
export const HAIR = [
  ['curto', 'Curtinho'], ['espetado', 'Espetado'], ['franja', 'Franjinha'], ['cacheado', 'Cacheado'], ['afro', 'Black power'],
  ['comprido', 'Comprido'], ['rabo', 'Rabo de cavalo'], ['chiquinhas', 'Maria-chiquinha'], ['coque', 'Coque'], ['moicano', 'Moicano'], ['careca', 'Raspadinho'],
];
export const EYES = [['redondo', 'Redondos'], ['grande', 'Grandões brilhantes'], ['amendoa', 'Amendoados'], ['feliz', 'Sorrindo (^^)'], ['sonolento', 'Sonolentos']];
export const MOUTH = [['sorriso', 'Sorriso'], ['sorrisao', 'Sorrisão'], ['banguela', 'Banguela'], ['linguinha', 'Linguinha'], ['surpreso', 'Uau!'], ['timido', 'Tímido']];
export const BROWS = [['normal', 'Normais'], ['alegre', 'Alegres'], ['decidido', 'Decididos'], ['grossa', 'Grossas']];
export const TOPS = [['camiseta', 'Camiseta'], ['regata', 'Regata'], ['camisa', 'Camisa de botão'], ['blusa', 'Blusa de manga longa'], ['moletom', 'Moletom com capuz']];
export const BOTTOMS = [['short', 'Short'], ['bermuda', 'Bermuda'], ['calca', 'Calça'], ['saia', 'Saia']];
export const SHOES = [['tenis', 'Tênis'], ['chinelo', 'Chinelo'], ['bota', 'Bota'], ['sandalia', 'Sandália']];
export const PATTERNS = [['liso', 'Liso'], ['listras', 'Listras'], ['bolinhas', 'Bolinhas'], ['xadrez', 'Xadrez'], ['estrelas', 'Estrelinhas'], ['raios', 'Raios'], ['coracoes', 'Corações'], ['camuflado', 'Camuflado']];
// acessórios: cada um liga/desliga e tem cor
export const ACCESSORIES = [
  ['bone', 'Boné', '🧢'], ['chapeu', 'Chapéu de sol', '👒'], ['oculos_sol', 'Óculos de sol', '🕶️'], ['oculos', 'Óculos de grau', '👓'],
  ['mochila', 'Mochila', '🎒'], ['colar', 'Colar', '📿'], ['relogio', 'Relógio', '⌚'], ['pulseira', 'Pulseira', '💫'],
  ['laco', 'Laço', '🎀'], ['fones', 'Fones de ouvido', '🎧'], ['cachecol', 'Cachecol', '🧣'],
];
// chapéus não combinam entre si (e tiram o espaço do cabelo de cima)
export const HEADWEAR = ['bone', 'chapeu', 'fones', 'laco'];
export function defaultKid() {
  return {
    criado: false, nome: '',
    pele: SKIN[1], cabelo: { estilo: 'curto', cor: HAIR_COLORS[1] },
    olhos: { tipo: 'redondo', cor: EYE_COLORS[0] }, boca: 'sorriso', sobrancelha: 'normal', sardas: false, bochechas: true,
    topo: { tipo: 'camiseta', cor: '#4fc3f7', estampa: 'liso' },
    baixo: { tipo: 'short', cor: '#3f63e0', estampa: 'liso' },
    calcado: { tipo: 'tenis', cor: '#e2403a' },
    acess: { mochila: { on: true, cor: '#ff8a2a' } },
  };
}
// um visual sorteado (botão "Surpresa!")
export function randomKid(base = defaultKid(), level = 99) {
  const pick0 = (a) => a[Math.floor(Math.random() * a.length)];
  const p = (a, g) => { const ok = g ? a.filter((x) => lockLevel(g, x[0]) <= level) : a; return pick0(ok.length ? ok : a); };
  const k = structuredClone(base);
  k.pele = p(SKIN); k.cabelo = { estilo: p(HAIR, 'cabelo')[0], cor: p(level >= LOCKS.corCabelo ? HAIR_COLORS : HAIR_COLORS.slice(0, FUN_HAIR_FROM)) };
  k.olhos = { tipo: p(EYES)[0], cor: p(EYE_COLORS) }; k.boca = p(MOUTH)[0]; k.sobrancelha = p(BROWS)[0];
  k.sardas = Math.random() < 0.35; k.bochechas = Math.random() < 0.7;
  k.topo = { tipo: p(TOPS, 'topo')[0], cor: p(COLORS), estampa: p(PATTERNS, 'estampa')[0] };
  k.baixo = { tipo: p(BOTTOMS, 'baixo')[0], cor: p(COLORS), estampa: Math.random() < 0.7 ? 'liso' : p(PATTERNS, 'estampa')[0] };
  k.calcado = { tipo: p(SHOES, 'calcado')[0], cor: p(COLORS) };
  const accOk = (id) => lockLevel('acess', id) <= level;
  k.acess = {}; const head = pick0([...HEADWEAR.filter(accOk), null, null]); if (head) k.acess[head] = { on: true, cor: p(COLORS) };
  for (const [id] of ACCESSORIES) if (!HEADWEAR.includes(id) && accOk(id) && Math.random() < 0.25) k.acess[id] = { on: true, cor: p(COLORS) };
  if (k.acess.oculos_sol && k.acess.oculos) delete k.acess.oculos;
  return k;
}

// o que cada nível do jogador libera no visual (o resto já vem liberado)
export const LOCKS = {
  cabelo: { espetado: 2, chiquinhas: 2, coque: 3, moicano: 4 },
  topo: { camisa: 2, blusa: 3, moletom: 4 },
  baixo: { calca: 2, saia: 2 },
  calcado: { sandalia: 2, bota: 3 },
  estampa: { listras: 2, bolinhas: 2, xadrez: 3, estrelas: 4, coracoes: 4, raios: 5, camuflado: 6 },
  acess: { laco: 2, bone: 2, colar: 3, oculos_sol: 3, chapeu: 4, pulseira: 4, fones: 5, cachecol: 5, relogio: 6 },
  corCabelo: 3, // as cores divertidas (azul, rosa, verde, roxo)
};
export const FUN_HAIR_FROM = 7;
export const lockLevel = (grupo, id) => (LOCKS[grupo] && LOCKS[grupo][id]) || 0;
const NAMES = Object.fromEntries([...HAIR, ...TOPS, ...BOTTOMS, ...SHOES, ...PATTERNS, ...ACCESSORIES.map((a) => [a[0], a[1]])]);
export function lookUnlocksAt(level) {
  const out = [];
  for (const [g, map] of Object.entries(LOCKS)) { if (g === 'corCabelo') { if (map === level) out.push('🎨 Cabelo azul, rosa, verde e roxo'); continue; } for (const [id, l] of Object.entries(map)) if (l === level) out.push(`${{ cabelo: '💇', topo: '👕', baixo: '👖', calcado: '👟', estampa: '🎨 Estampa', acess: '🎒' }[g]} ${NAMES[id] || id}`); }
  return out;
}
