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
export const TOPS = [['camiseta', 'Camiseta'], ['regata', 'Regata'], ['camisa', 'Camisa de botão'], ['blusa', 'Blusa de manga longa'], ['moletom', 'Moletom com capuz'], ['vestido', 'Vestido']];
export const BOTTOMS = [['short', 'Short'], ['bermuda', 'Bermuda'], ['calca', 'Calça'], ['saia', 'Saia']];
export const SHOES = [['tenis', 'Tênis'], ['chinelo', 'Chinelo'], ['bota', 'Bota'], ['sandalia', 'Sandália']];
export const PATTERNS = [['liso', 'Liso'], ['listras', 'Listras'], ['bolinhas', 'Bolinhas'], ['xadrez', 'Xadrez'], ['estrelas', 'Estrelinhas'], ['raios', 'Raios'], ['coracoes', 'Corações'], ['camuflado', 'Camuflado']];
// acessórios: cada um liga/desliga e tem cor
export const ACCESSORIES = [
  ['bone', 'Boné', '🧢'], ['chapeu', 'Chapéu de sol', '👒'], ['oculos_sol', 'Óculos de sol', '🕶️'], ['oculos', 'Óculos de grau', '👓'],
  ['mochila', 'Mochila', '🎒'], ['colar', 'Colar', '📿'], ['relogio', 'Relógio', '⌚'], ['pulseira', 'Pulseira', '💫'],
  ['laco', 'Laço', '🎀'], ['fones', 'Fones de ouvido', '🎧'], ['cachecol', 'Cachecol', '🧣'],
];
// modelos de cada acessório (o formato muda de verdade) e quais aceitam estampa
export const ACC_STYLES = {
  bone: [['classico', 'Clássico'], ['tela', 'Com telinha'], ['aba_reta', 'Aba reta'], ['virado', 'Virado pra trás']],
  chapeu: [['sol', 'De sol'], ['pescador', 'Pescador'], ['palha', 'De palha'], ['vaqueiro', 'Vaqueiro']],
  oculos_sol: [['redondo', 'Redondo'], ['quadrado', 'Quadrado'], ['coracao', 'Coração'], ['estrela', 'Estrela']],
  oculos: [['redondo', 'Redondo'], ['quadrado', 'Quadrado'], ['gatinho', 'Gatinho']],
  mochila: [['classica', 'Clássica'], ['bolsos', 'Com bolsos'], ['bichinho', 'Bichinho'], ['bolsinha', 'Bolsinha de lado']],
  colar: [['estrela', 'Estrela'], ['coracao', 'Coração'], ['concha', 'Concha'], ['contas', 'Continhas']],
  relogio: [['redondo', 'De ponteiro'], ['digital', 'Digital']],
  pulseira: [['contas', 'Continhas'], ['fita', 'Fitinha'], ['amizade', 'Da amizade']],
  laco: [['laco', 'Lacinho'], ['tiara', 'Tiara'], ['flor', 'Presilha de flor']],
  fones: [['grande', 'Grandão'], ['gatinho', 'Orelhinha de gato']],
  cachecol: [['curto', 'Curtinho'], ['comprido', 'Comprido']],
};
export const ACC_PATTERN = ['bone', 'chapeu', 'mochila', 'cachecol', 'laco'];
// desenho grande no peito da camiseta
export const PRINTS = [['nenhum', 'Sem desenho', ''], ['dino', 'Dinossauro', '🦖'], ['urso', 'Ursinho', '🐻'], ['estrela', 'Estrela', '⭐'], ['coracao', 'Coração', '💖'], ['raio', 'Raio', '⚡'], ['sol', 'Solzinho', '🌞'], ['foguete', 'Foguete', '🚀'], ['gato', 'Gatinho', '🐱'], ['bola', 'Bola', '⚽']];
// menino ou menina (escolhido ao criar o personagem): o que é só de um deles não aparece para o outro
export const GENDERS = [['menino', 'Menino', '👦'], ['menina', 'Menina', '👧']];
const ONLY = {
  menina: ['cabelo:rabo', 'cabelo:chiquinhas', 'cabelo:coque', 'cabelo:comprido', 'topo:vestido', 'baixo:saia', 'acess:laco', 'colar:coracao', 'colar:contas', 'oculos:gatinho', 'oculos_sol:coracao', 'fones:gatinho', 'pulseira:amizade', 'desenho:coracao', 'estampa:coracoes', 'boca:linguinha'],
  menino: ['cabelo:moicano', 'cabelo:careca'],
};
export const allowed = (genero, grupo, id) => !genero || !ONLY[genero === 'menino' ? 'menina' : 'menino'].includes(`${grupo}:${id}`);
// deixa o visual de acordo com o menino/menina escolhido (troca o que não combina)
export function fitGender(k) {
  const g = k.genero; if (!g) return k;
  if (!allowed(g, 'cabelo', k.cabelo.estilo)) k.cabelo.estilo = g === 'menina' ? 'rabo' : 'curto';
  if (!allowed(g, 'topo', k.topo.tipo)) k.topo.tipo = 'camiseta';
  if (!allowed(g, 'baixo', k.baixo.tipo)) k.baixo.tipo = 'short';
  if (!allowed(g, 'desenho', k.topo.desenho)) k.topo.desenho = 'nenhum';
  for (const part of [k.topo, k.baixo]) if (!allowed(g, 'estampa', part.estampa)) part.estampa = 'liso';
  if (!allowed(g, 'boca', k.boca)) k.boca = 'sorriso';
  for (const [id, v] of Object.entries(k.acess || {})) {
    if (!allowed(g, 'acess', id)) { delete k.acess[id]; continue; }
    if (v.estilo && !allowed(g, id, v.estilo)) v.estilo = ACC_STYLES[id][0][0];
    if (v.estampa && !allowed(g, 'estampa', v.estampa)) v.estampa = 'liso';
  }
  return k;
}
// quem já tinha personagem antes da escolha: adivinha pelo visual (e pede para confirmar)
export const guessGender = (k) => (['rabo', 'chiquinhas', 'coque', 'comprido'].includes(k.cabelo?.estilo) || k.baixo?.tipo === 'saia' || k.acess?.laco?.on ? 'menina' : 'menino');
// chapéus não combinam entre si (e tiram o espaço do cabelo de cima)
export const HEADWEAR = ['bone', 'chapeu', 'fones', 'laco'];
export function defaultKid() {
  return {
    criado: false, nome: '',
    pele: SKIN[1], cabelo: { estilo: 'curto', cor: HAIR_COLORS[1] },
    olhos: { tipo: 'redondo', cor: EYE_COLORS[0] }, boca: 'sorriso', sobrancelha: 'normal', sardas: false, bochechas: true,
    topo: { tipo: 'camiseta', cor: '#4fc3f7', estampa: 'liso', desenho: 'nenhum' },
    baixo: { tipo: 'short', cor: '#3f63e0', estampa: 'liso' },
    calcado: { tipo: 'tenis', cor: '#e2403a' },
    acess: { mochila: { on: true, cor: '#ff8a2a', estilo: 'classica' } },
  };
}
// um visual sorteado (botão "Surpresa!")
export function randomKid(base = defaultKid(), level = 99) {
  const pick0 = (a) => a[Math.floor(Math.random() * a.length)];
  const gen = base.genero;
  const p = (a, g) => { const ok = (g ? a.filter((x) => lockLevel(g, x[0]) <= level) : a).filter((x) => !g || allowed(gen, g, x[0])); return pick0(ok.length ? ok : a); };
  const k = structuredClone(base);
  k.pele = p(SKIN); k.cabelo = { estilo: p(HAIR, 'cabelo')[0], cor: p(level >= LOCKS.corCabelo ? HAIR_COLORS : HAIR_COLORS.slice(0, FUN_HAIR_FROM)) };
  k.olhos = { tipo: p(EYES)[0], cor: p(EYE_COLORS) }; k.boca = p(MOUTH)[0]; k.sobrancelha = p(BROWS)[0];
  k.sardas = Math.random() < 0.35; k.bochechas = Math.random() < 0.7;
  k.topo = { tipo: p(TOPS, 'topo')[0], cor: p(COLORS), estampa: Math.random() < 0.5 ? 'liso' : p(PATTERNS, 'estampa')[0], desenho: Math.random() < 0.5 ? p(PRINTS)[0] : 'nenhum' };
  k.baixo = { tipo: p(BOTTOMS, 'baixo')[0], cor: p(COLORS), estampa: Math.random() < 0.7 ? 'liso' : p(PATTERNS, 'estampa')[0] };
  k.calcado = { tipo: p(SHOES, 'calcado')[0], cor: p(COLORS) };
  const accOk = (id) => lockLevel('acess', id) <= level;
  k.acess = {}; const head = pick0([...HEADWEAR.filter(accOk).filter((id) => allowed(gen, 'acess', id)), null, null]); if (head) k.acess[head] = { on: true, cor: p(COLORS) };
  for (const [id] of ACCESSORIES) if (!HEADWEAR.includes(id) && accOk(id) && allowed(gen, 'acess', id) && Math.random() < 0.25) k.acess[id] = { on: true, cor: p(COLORS) };
  for (const [id, v] of Object.entries(k.acess)) if (ACC_STYLES[id]) v.estilo = pick0(ACC_STYLES[id])[0];
  if (k.acess.oculos_sol && k.acess.oculos) delete k.acess.oculos;
  return fitGender(k);
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
