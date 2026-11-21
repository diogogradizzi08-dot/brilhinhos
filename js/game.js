// Brilhinhos — as regras do jogo (sem tela): salvar, Forja, fazendinhas com trabalho
// automático (plantação, corte, mineração, forno), base (bancada e construções),
// evolução, pedidos, resgates, presente do dia e Fusão do Trovão.
import { ITEMS, RARITIES, RARITY_ORDER, FAMILIES, SPECIES, RECIPE_INDEX, recipeKey, REGIONS, EL_ITEMS,
  EVOLVE_AT, EVOLVE_COST, ACHIEVEMENTS, ELEMENT_ORDER, skillsOf, yieldOf, BUILDINGS, CROPS, CRAFTS, SKILLS, FORGE_MIN, CODEX_TOTAL, THEME_ITEM, SPECIAL_ITEM, COOKS } from './data.js';
import { zoneResources, neighbors, insideOpen, MAX_ZONES, NPC_SPOT, ZONE_ORDER, pondsOf } from './world.js';
import { themeOn, THEMES } from './season.js';
import { defaultKid, guessGender, fitGender } from './kidlook.js';

const KEY = 'brilhinhos-save-v3';
export const now = () => Date.now();
const rnd = Math.random;
const pick = (a) => a[Math.floor(rnd() * a.length)];
function weighted(entries) {
  const tot = entries.reduce((s, e) => s + e[1], 0);
  let r = rnd() * tot;
  for (const [v, w] of entries) { if ((r -= w) <= 0) return v; }
  return entries[entries.length - 1][0];
}
const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const BASE_REGION = 'floresta'; // onde ficam a bancada, o forno e as construções

function newRegion(open) { return { aberta: open, fazenda: 1, salvo: false, brilhos: 2, brilhoDesde: now(), zonas: ['0,0'], obras: [], rec: {} }; }
// item da época que está acontecendo agora (ou null)
export const themeItem = () => { const t = themeOn(); return t ? THEME_ITEM[t] : null; };
export { themeOn, THEMES };
export function newState() {
  const regioes = {};
  for (const r of REGIONS) regioes[r.id] = newRegion(r.id === BASE_REGION);
  return {
    v: 4, criado: now(), nextObra: 1, boneco: defaultKid(), moedas: 15, xp: 0, nivel: 1, brilho: 1,
    itens: { trevo: 3, concha: 3, brasa: 3, pena: 2, floco: 2, seixo: 2, faisca: 1, orvalho: 3, cogumelo: 1 },
    amigos: [], nextUid: 1, descobertos: {}, regioes, pedidos: [], conquistas: {},
    base: { bancada: false, forno: false, canteiros: 0, casinha: 0, totem: false, fila: 0 },
    diario: { ultimo: '', serie: 0, pendente: false }, tutorial: 0, fusao: null, avisos: [],
    stats: { nascimentos: 0, evolucoes: 0, fusoes: 0, coletas: 0, resgates: 0, frutas: 0, madeira: 0 },
    som: true, musica: true,
  };
}

export let S = null;
export function load() {
  try { const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : null; } catch { S = null; }
  if (S && S.v === 3) migrate3(S);
  if (!S || S.v !== 4) { S = newState(); starterPlots(BASE_REGION); }
  fixup();
  checkDaily();
  return S;
}
function fixup() {
  for (const r of REGIONS) { const g = (S.regioes[r.id] ||= newRegion(false)); g.zonas ||= ['0,0']; g.obras ||= []; g.rec ||= {}; }
  S.boneco ||= defaultKid(); if (S.boneco.criado && !S.boneco.genero) { S.boneco.genero = guessGender(S.boneco); fitGender(S.boneco); } S.nextObra ||= 1; S.epoca ||= {}; S.missoes ||= [];
  // fazendinhas antigas: o nível sai do tamanho que já tinham
  for (const r of REGIONS) { const g = S.regioes[r.id]; if (!g.flvl) { let l = 1; while (zonesForLevel(l) < g.zonas.length) l++; g.flvl = l; g.fxp = 0; } }
  for (const r of REGIONS) for (const o of S.regioes[r.id].obras) if (o.tipo === 'comedouro' || o.tipo === 'bebedouro') {
    if (o.tipo === 'comedouro' && !o.comida) { o.comida = {}; const n = Math.min(FEED_CAP, Math.round((o.estoque || 0) / 3)); if (n > 0) o.comida.fruta = n; }
    delete o.estoque; delete o.nivel;
  }
  S.missoes = S.missoes.filter((m) => m.tipo !== 'cocho');
  syncBase();
}
// jogos da versão 3 (ilha redonda) viram o terreno em lotes, sem perder nada
function migrate3(st) {
  const old = st; S = st;
  S.v = 4; S.nextObra = 1; S.boneco = defaultKid(); S.boneco.criado = false;
  const base = { ...(old.base || {}) };
  for (const r of REGIONS) {
    const g = S.regioes[r.id]; const cant = g.cant || []; const lvl = g.fazenda || 1;
    Object.assign(g, { zonas: ZONE_ORDER.slice(0, [1, 3, 5, 7, 9][lvl - 1] || 1), obras: [], rec: {} });
    delete g.arv; delete g.roc; delete g.cant;
    if (!g.aberta) continue;
    const plots = Math.max(2, cant.length);
    for (let i = 0; i < plots; i++) { const p = findSpot(r.id, 'canteiro', -2.6 + (i % 3) * 1.7, 2.6 + Math.floor(i / 3) * 1.7); if (!p) break; const o = addObra(r.id, 'canteiro', p[0], p[1]); const c = cant[i]; if (c && c.st !== 'vazio') { o.st = c.st; o.ate = c.ate || 0; } }
  }
  const put = (tipo, x, z) => { const p = findSpot(BASE_REGION, tipo, x, z); if (p) addObra(BASE_REGION, tipo, p[0], p[1]); };
  if (base.bancada) put('bancada', 2.6, 3);
  if (base.forno) put('forno', 4, 0.6);
  if (base.totem) put('totem', 0, -3.4);
  for (let i = 0; i < (base.casinha || 0); i++) put('casinha', -3.6 + i * 2.8, -3.6);
  for (const a of S.amigos) a.task = null;
  delete S.base.canteiros;
}
let saveTimer = 0;
export function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 150); }
export function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
export function resetGame() { S = newState(); starterPlots(BASE_REGION); fixup(); checkDaily(); saveNow(); }
export function setState(s) { S = s; fixup(); if (!S.regioes[BASE_REGION].obras.length) starterPlots(BASE_REGION); }

const notify = (a) => S.avisos.push(a);
export const takeNotices = () => S.avisos.splice(0);

// ---------- itens, moedas e níveis ----------
export const FOOD_IDS = ['fruta', 'morango', 'cenoura', 'alface', 'tomate', 'espetinho', 'mingau', 'torta', 'racao'];
export const isFood = (id) => FOOD_IDS.includes(id);
const troughs = () => REGIONS.map((r) => S.regioes[r.id]?.obras.find((o) => o.tipo === 'comedouro')).filter(Boolean);
// quanto você tem de um item: a mochila e, se for comida, o que está guardado nos comedouros
export const count = (id) => (id === 'brilho' ? S.brilho : (S.itens[id] || 0) + (isFood(id) ? troughs().reduce((t, c) => t + (c.comida?.[id] || 0), 0) : 0));
export const has = (id, n = 1) => count(id) >= n;
export function addItem(id, n = 1) {
  if (id === 'brilho') { S.brilho += n; return; }
  S.itens[id] = (S.itens[id] || 0) + n;
  if (id === 'madeira') { S.stats.madeira += n; if (S.stats.madeira >= 50) achieve('lenhador'); }
}
export function useItem(id, n = 1) {
  if (id === 'brilho') { S.brilho -= n; return; }
  const fromBag = Math.min(n, S.itens[id] || 0); S.itens[id] = (S.itens[id] || 0) - fromBag; if (S.itens[id] <= 0) delete S.itens[id]; n -= fromBag;
  for (const c of troughs()) { if (n <= 0) break; const k = Math.min(n, c.comida?.[id] || 0); if (k) { c.comida[id] -= k; if (!c.comida[id]) delete c.comida[id]; n -= k; } }
}
export const playerXpNeed = (n = S.nivel) => 10 + n * 8;
export function addXp(n) {
  S.xp += n;
  while (S.xp >= playerXpNeed()) {
    S.xp -= playerXpNeed(); S.nivel++;
    S.moedas += 10 * S.nivel; S.brilho += 1;
    notify({ tipo: 'nivel', nivel: S.nivel, premio: `+${10 * S.nivel} moedas e +1 Cristal de Evolução` + (S.nivel === 4 ? ' · A Forja ganhou um 4º espaço!' : S.nivel === 6 ? ' · Fusão do Trovão liberada!' : '') });
  }
}
export const nestSlots = () => (S.nivel >= 4 ? 4 : 3);
export const fusaoLiberada = () => S.nivel >= 6;

// ---------- companheiros ----------
export const sp = (a) => SPECIES[a.sp];
export const fam = (a) => FAMILIES[SPECIES[a.sp].fam];
export const amigoXpNeed = (a) => 4 + a.nivel * 2;
export const nomeDe = (a) => a.apelido || SPECIES[a.sp].nome;
export const busy = (a, t = now()) => (a.ocupadoAte || 0) > t;
export const skillLevel = (a, id) => (skillsOf(a.sp).find((s) => s.id === id)?.nivel || 0);
export const bagCap = (a) => 3 + RARITY_ORDER.indexOf(SPECIES[a.sp].rar) + SPECIES[a.sp].stage;

function createAmigo(spId, shiny) {
  const a = { uid: S.nextUid++, sp: spId, nivel: 1, xp: 0, shiny: !!shiny, apelido: '', local: null, task: null, bolsa: [], ocupadoAte: 0, carinho: 0 };
  S.amigos.push(a);
  const novo = !S.descobertos[spId];
  S.descobertos[spId] = true;
  S.stats.nascimentos++;
  const r = SPECIES[spId].rar;
  achieve('primeiro');
  if (S.amigos.length >= 10) achieve('dez');
  if (shiny) achieve('brilhante');
  if (r === 'epico') achieve('epico'); if (r === 'lendario') achieve('lendario'); if (r === 'mitico') achieve('mitico');
  if (novo) { S.moedas += 5 + 5 * RARITIES[r].estrelas; addXp(4 + 3 * RARITIES[r].estrelas); checkCodex(); }
  else addXp(2);
  return { amigo: a, novo };
}
export function amigoAddXp(a, n) {
  if (a.nivel >= 20) return;
  a.xp += n;
  while (a.nivel < 20 && a.xp >= amigoXpNeed(a)) { a.xp -= amigoXpNeed(a); a.nivel++; if (EVOLVE_AT.includes(a.nivel)) S.missaoNova = true; }
}
export function canEvolve(a) {
  const s = SPECIES[a.sp].stage;
  if (s >= 2) return { ok: false, motivo: 'Já é Adulto!' };
  if (a.nivel < EVOLVE_AT[s]) return { ok: false, motivo: `Precisa chegar ao nível ${EVOLVE_AT[s]}` };
  if (!a.evoOk?.[s]) return { ok: false, motivo: 'Complete a missão de evolução dele (no painel de Missões)', missao: true };
  if (S.brilho < EVOLVE_COST[s]) return { ok: false, motivo: `Precisa de ${EVOLVE_COST[s]} Cristal de Evolução` };
  return { ok: true, custo: EVOLVE_COST[s] };
}
export function evolve(a) {
  const c = canEvolve(a); if (!c.ok) return null;
  S.brilho -= c.custo;
  const antes = a.sp; a.sp += 1;
  const novo = !S.descobertos[a.sp];
  S.descobertos[a.sp] = true; S.stats.evolucoes++;
  achieve('evo1'); if (SPECIES[a.sp].stage === 2) achieve('evo2');
  if (novo) { S.moedas += 10; checkCodex(); }
  addXp(10); save();
  return { antes, depois: a.sp, novo };
}
export const PET_COOLDOWN = 3 * 60 * 1000;
export function pet(a) {
  if (now() - (a.carinho || 0) < PET_COOLDOWN) return false;
  a.carinho = now(); amigoAddXp(a, 3); addXp(1); save(); return true;
}
// dar comida: fruta (+12) ou ração (+40)
export function feed(a, item) {
  if (!has(item)) return false;
  useItem(item); amigoAddXp(a, item === 'racao' ? 40 : item === 'torta' ? 30 : ITEMS[item].energia ? 18 : 12); addXp(1); save(); return true;
}

// ---------- a Forja do Trovão ----------
export const magicPoints = (items) => items.reduce((s, id) => s + RARITIES[ITEMS[id].rar].pontos, 0);
export function rarityChances(items) {
  const M = magicPoints(items);
  const w = { comum: Math.max(10, 100 - 6 * M), incomum: 10 + 3 * M, raro: 2 + 1.2 * M, epico: 0.3 + 0.35 * M, lendario: M >= 15 ? 0.05 + 0.06 * M : 0.03 };
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  const out = {}; for (const k in w) out[k] = w[k] / tot;
  return out;
}
// receita conhecida? (as de época só valem durante a época)
export const RARITY_LEVEL = { epico: 5, lendario: 8 };
export const rarityOpen = (r) => S.nivel >= (RARITY_LEVEL[r] || 0);
function recipeFam(items) {
  const f = RECIPE_INDEX[recipeKey(items)];
  if (f === undefined) return undefined;
  if (FAMILIES[f].tema && FAMILIES[f].tema !== themeOn()) return undefined;
  if (!rarityOpen(FAMILIES[f].rar)) return undefined;
  return f;
}
// a mistura tem o item da época de agora? então sai um bicho de época
export const seasonalMix = (items) => { const t = themeOn(); return t && items.some((id) => ITEMS[id].tema === t) ? t : null; };
export function previewMix(items) {
  const f = recipeFam(items);
  return f !== undefined ? { exato: true, fam: f } : { exato: false, chances: rarityChances(items), tema: seasonalMix(items) };
}
export function mix(items) {
  if (items.length < FORGE_MIN || items.length > nestSlots()) return null;
  const need = {}; for (const id of items) need[id] = (need[id] || 0) + 1;
  for (const id in need) if (!has(id, need[id])) return null;
  for (const id in need) useItem(id, need[id]);
  let famId = recipeFam(items);
  const exato = famId !== undefined;
  if (!exato) { const tema = seasonalMix(items); famId = tema ? rollSeasonal(items, tema) : rollFamily(items); }
  const shiny = rnd() < (items.includes('runa') ? 1 / 18 : 1 / 40);
  const res = createAmigo(famId * 3, shiny);
  if (S.tutorial < 2) S.tutorial = 2;
  save();
  return { ...res, exato, fam: FAMILIES[famId] };
}
function rollSeasonal(items, tema) {
  const rar = weighted(Object.entries(rarityChances(items)).map(([k, v]) => [Math.min(2, RARITY_ORDER.indexOf(k)), v]));
  const c = FAMILIES.filter((f) => f.tema === tema);
  return (c.find((f) => RARITY_ORDER.indexOf(f.rar) === rar) || c[0]).id;
}
function rollFamily(items) {
  let rar = weighted(Object.entries(rarityChances(items)));
  while (!rarityOpen(rar)) rar = RARITY_ORDER[RARITY_ORDER.indexOf(rar) - 1];
  const el = weighted(Object.entries(elementChances(items)));
  for (let i = RARITY_ORDER.indexOf(rar); i >= 0; i--) {
    const c = FAMILIES.filter((f) => f.el === el && f.rar === RARITY_ORDER[i] && !f.fusao && !f.tema);
    if (c.length) return pick(c).id;
  }
  return pick(FAMILIES.filter((f) => f.el === el && !f.fusao && !f.tema)).id;
}
// chance de cada elemento: os itens puxam para o elemento deles; item sem elemento
// (orvalho, madeira, fruta...) abre para qualquer um; e sempre há um pouco de surpresa
export function elementChances(items) {
  const els = Object.keys(EL_ITEMS);
  const w = {}; for (const e of els) w[e] = 0.35;
  for (const id of items) {
    const it = ITEMS[id]; const pts = RARITIES[it.rar].pontos;
    if (it.el && w[it.el] !== undefined) w[it.el] += 3 * pts;
    else for (const e of els) w[e] += 0.8;
  }
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  for (const e in w) w[e] /= tot;
  return w;
}
const openElements = () => REGIONS.filter((r) => S.regioes[r.id].aberta).map((r) => r.el);

// ---------- códice ----------
export const discoveredCount = () => Object.keys(S.descobertos).filter((k) => +k < CODEX_TOTAL).length;
export const seasonalCount = () => Object.keys(S.descobertos).filter((k) => +k >= CODEX_TOTAL).length;
const CODEX_GOALS = [[25, 'brilho', 1], [75, 'runa', 1], [150, 'coroa', 1], [250, 'runa', 2], [350, 'coroa', 2], [450, 'coroa', 3]];
function checkCodex() {
  const n = discoveredCount();
  if (n >= 50) achieve('cod25'); if (n >= 150) achieve('cod50'); if (n >= 300) achieve('cod100'); if (n >= 450) achieve('cod150');
  S.codexPremios ||= {};
  for (const [meta, item, q] of CODEX_GOALS) {
    if (n >= meta && !S.codexPremios[meta]) {
      S.codexPremios[meta] = true; addItem(item, q);
      notify({ tipo: 'codice', meta, premio: `${q}× ${item === 'brilho' ? '🔷 Cristal de Evolução' : ITEMS[item].emoji + ' ' + ITEMS[item].nome}` });
    }
  }
}
export const codexGoals = () => CODEX_GOALS;

// ---------- fazendinhas: terreno em lotes, recursos que somem e voltam ----------
export const RESPAWN = 5 * 60 * 1000, GROW_TIME = 60000;
export const regionById = (rid) => REGIONS.find((r) => r.id === rid);
// nível da fazendinha (1 a 13): sobe trabalhando nela e cumprindo missões; cada nível libera lotes
export const FARM_MAX = 13;
export const zonesForLevel = (l) => Math.min(25, 1 + 2 * (l - 1));
export const farmXpNeed = (l) => 25 + 20 * (l - 1);
export const farmLevel = (rid) => S.regioes[rid].flvl || 1;
export const farmXp = (rid) => S.regioes[rid].fxp || 0;
// faixa de 1 a 5 usada para lugares e itens raros
export const farmTier = (rid) => Math.min(5, 1 + Math.floor((farmLevel(rid) - 1) / 2.5));
export function addFarmXp(rid, n) {
  const g = S.regioes[rid]; if (!g) return; g.flvl ||= 1; g.fxp = (g.fxp || 0) + n;
  while (g.flvl < FARM_MAX && g.fxp >= farmXpNeed(g.flvl)) {
    g.fxp -= farmXpNeed(g.flvl); g.flvl++; g.fazenda = farmTier(rid);
    notify({ tipo: 'fazenda', rid, nivel: g.flvl, lotes: zonesForLevel(g.flvl) });
  }
  if (g.flvl >= FARM_MAX) g.fxp = Math.min(g.fxp, farmXpNeed(g.flvl));
}
export function resourcesOf(rid) {
  const g = S.regioes[rid]; const el = regionById(rid).el;
  return g.zonas.flatMap((k) => zoneResources(rid, el, k));
}
export const resState = (rid, id) => (S.regioes[rid].rec[id] ||= { livre: 0, por: 0 });
export const resAlive = (rid, id, t = now()) => resState(rid, id).livre <= t;
export const obrasOf = (rid) => S.regioes[rid].obras;
export const countBuilt = (tipo, rid = null) => REGIONS.reduce((n, r) => n + (rid && r.id !== rid ? 0 : (S.regioes[r.id].obras || []).filter((o) => o.tipo === tipo).length), 0);
export const hasObra = (rid, tipo) => S.regioes[rid].obras.some((o) => o.tipo === tipo);
function syncBase() {
  S.base.bancada = countBuilt('bancada') > 0; S.base.forno = countBuilt('forno') > 0;
  S.base.totem = countBuilt('totem') > 0; S.base.casinha = countBuilt('casinha');
}
const canteiros = (rid) => S.regioes[rid].obras.filter((o) => o.tipo === 'canteiro');
export const farmSlots = (rid) => farmTier(rid) + 1 + S.base.casinha;
export const amigosEm = (rid) => S.amigos.filter((a) => a.local === rid);
export function placeAmigo(a, rid) {
  if (rid && rid !== a.local && amigosEm(rid).length >= farmSlots(rid)) return false;
  releaseTask(a); a.local = rid; a.task = null; save(); return true;
}
function nodeOf(rid, tipo, alvo) {
  if (['cortar', 'minerar', 'catar'].includes(tipo)) return resState(rid, alvo);
  if (['semear', 'regar', 'colher'].includes(tipo)) return S.regioes[rid].obras.find((o) => o.uid === alvo) || null;
  return null;
}
function releaseTask(a) {
  const t = a.task; if (!t || !a.local) return;
  const node = nodeOf(a.local, t.tipo, t.alvo);
  if (node && node.por === a.uid) node.por = 0;
  if (t.tipo === 'fundir') S.base.fila++;
}
// velocidade: nível da habilidade, totem e companheiros que energizam a fazendinha
function speedMul(rid) {
  let m = S.base.totem ? 0.75 : 1;
  const en = Math.max(0, ...amigosEm(rid).map((x) => skillLevel(x, 'energizar')));
  if (en) m *= Math.max(0.65, 1 - 0.06 * en);
  return m;
}
const BASE_DUR = { semear: 10000, regar: 8000, colher: 6000, fundir: 18000, cortar: 16000, minerar: 18000, catar: 9000, explorar: 28000 };
const TASK_SKILL = { semear: 'semear', regar: 'regar', colher: 'coletar', catar: 'coletar', fundir: 'acender', cortar: 'cortar', minerar: 'minerar' };
export const TASK_INFO = {
  semear: { nome: 'Semeando', icone: '🌱' }, regar: { nome: 'Regando', icone: '💦' }, colher: { nome: 'Colhendo', icone: '🧺' }, catar: { nome: 'Catando frutinhas', icone: '🫐' },
  fundir: { nome: 'Fundindo no forno', icone: '🔥' }, cortar: { nome: 'Cortando árvore', icone: '🪓' }, minerar: { nome: 'Minerando', icone: '⛏️' },
  explorar: { nome: 'Explorando a região', icone: '🔎' }, cheio: { nome: 'Bolsa cheia — toque em Pegar tudo!', icone: '🎒' },
};
export const FEED_CAP = 30; // a cesta guarda até 30 comidas
export const PET_EAT_MS = 180000; // cada bicho come 1 comida a cada 3 minutos
export const troughOf = (rid) => S.regioes[rid].obras.find((o) => o.tipo === 'comedouro') || null;
export const troughTotal = (c) => (c ? Object.values(c.comida || {}).reduce((t, n) => t + n, 0) : 0);
// comedouro (cesta) e bebedouro (barril): um de cada por fazendinha, sem níveis
export function cochoState(rid) {
  const pets = amigosEm(rid).length; const c = troughOf(rid); const beb = hasObra(rid, 'bebedouro');
  const comida = troughTotal(c); const vazio = !!c && comida <= 0;
  const fome = pets > 0 && (!c || vazio), sede = pets > 0 && !beb;
  return { pets, com: !!c, beb, comida, itens: { ...(c?.comida || {}) }, cap: FEED_CAP, vazio, ok: !fome && !sede, fome, sede };
}
// a comida colhida na fazendinha vai direto para a cesta (o que não couber vai para a mochila)
export function storeFood(rid, id, n = 1) {
  const c = rid && isFood(id) ? troughOf(rid) : null; let k = 0;
  if (c) { k = Math.max(0, Math.min(n, FEED_CAP - troughTotal(c))); if (k) { c.comida ||= {}; c.comida[id] = (c.comida[id] || 0) + k; } }
  if (n - k > 0) addItem(id, n - k);
  if (id === 'fruta') S.stats.frutas += n;
  return k;
}
// colocar comida da mochila na cesta, ou tirar da cesta para a mochila
export function fillTrough(rid, item, n = 1) {
  const c = troughOf(rid); if (!c || !isFood(item)) return 0;
  n = Math.min(n, S.itens[item] || 0, FEED_CAP - troughTotal(c)); if (n <= 0) return 0;
  S.itens[item] -= n; if (S.itens[item] <= 0) delete S.itens[item];
  c.comida ||= {}; c.comida[item] = (c.comida[item] || 0) + n; save(); return n;
}
export function takeFromTrough(rid, item, n = 1) {
  const c = troughOf(rid); n = Math.min(n, c?.comida?.[item] || 0); if (n <= 0) return 0;
  c.comida[item] -= n; if (!c.comida[item]) delete c.comida[item]; S.itens[item] = (S.itens[item] || 0) + n; save(); return n;
}
// ---------- a fome do jogador: trabalhar cansa, comer recupera ----------
export const ENERGY_MAX = 100;
export const energy = () => (S.energia ?? ENERGY_MAX);
export const tired = () => energy() <= 0;
const cold = (rid) => regionById(rid).el === 'gelo' && !hasObra(rid, 'fogueira');
export const isCold = cold;
function spend(rid, n) { S.energia = Math.max(0, energy() - n * (cold(rid) ? 2 : 1)); }
export function eat(item) {
  const e = ITEMS[item]?.energia || (item === 'fruta' ? 8 : 0); if (!e || !has(item)) return 0;
  useItem(item); S.energia = Math.min(ENERGY_MAX, energy() + e); addXp(1); save(); return e;
}
export function cook(rid, station, id) {
  const r = COOKS[station]?.find((x) => x.id === id); if (!r || !hasObra(rid, station) || !canPay({ itens: r.custo })) return 0;
  pay({ itens: r.custo }); storeFood(rid, id, r.qtd); addXp(2); addFarmXp(rid, 3); save(); return r.qtd;
}
function taskDur(a, tipo, rid) {
  let d = BASE_DUR[tipo];
  if (!cochoState(rid).ok) d *= 1.6; // com fome ou sede, trabalham mais devagar
  const sk = TASK_SKILL[tipo];
  if (sk) d /= 1 + 0.3 * (skillLevel(a, sk) - 1);
  else {
    const el = SPECIES[a.sp].el;
    if (el === regionById(rid).el) d *= 0.5; else if (el === 'trovao') d *= 0.6;
    d *= 1 - Math.min(a.nivel, 20) * 0.01;
  }
  return d * speedMul(rid);
}
// as ordens que dá para dar a um bicho (cada uma pede a habilidade certa)
export const COMMANDS = [
  { tipo: 'cortar', nome: 'Cortar árvore', icone: '🪓', sk: 'cortar', res: 'arvore' },
  { tipo: 'minerar', nome: 'Minerar pedra', icone: '⛏️', sk: 'minerar', res: 'rocha' },
  { tipo: 'catar', nome: 'Catar frutinhas', icone: '🫐', sk: 'coletar', res: 'arbusto' },
  { tipo: 'semear', nome: 'Plantar', icone: '🌱', sk: 'semear', plot: 'vazio' },
  { tipo: 'regar', nome: 'Regar', icone: '💦', sk: 'regar', plot: 'semeado' },
  { tipo: 'colher', nome: 'Colher', icone: '🧺', sk: 'coletar', plot: 'pronto' },
  { tipo: 'fundir', nome: 'Fundir no forno', icone: '🔥', sk: 'acender' },
  { tipo: 'explorar', nome: 'Explorar', icone: '🔎' },
];
// onde cada ordem pode ser feita agora (ids de recurso ou de canteiro livres)
export function commandTargets(rid, tipo, t = now()) {
  const c = COMMANDS.find((x) => x.tipo === tipo); if (!c) return [];
  if (c.res) return resourcesOf(rid).filter((r) => r.tipo === c.res && !resState(rid, r.id).por && resAlive(rid, r.id, t)).map((r) => r.id);
  if (c.plot) return canteiros(rid).filter((n) => !n.por && n.st === c.plot).map((n) => n.uid);
  if (tipo === 'fundir') return hasObra(rid, 'forno') && S.base.fila > 0 ? [-1] : [];
  return [-1];
}
export function petCommands(a) {
  const rid = a.local; if (!rid) return [];
  return COMMANDS.filter((c) => !c.sk || skillLevel(a, c.sk) > 0).map((c) => {
    const alvos = commandTargets(rid, c.tipo);
    const motivo = alvos.length ? '' : c.res ? 'Nenhuma livre agora' : c.plot ? { vazio: 'Nenhum canteiro vazio', semeado: 'Nada para regar', pronto: 'Nada pronto' }[c.plot] : c.tipo === 'fundir' ? (hasObra(rid, 'forno') ? 'Ponha ferro no forno' : 'Precisa da Fundição') : '';
    return { ...c, alvos, ok: alvos.length > 0, motivo };
  }).filter((c) => c.tipo !== 'explorar');
}
// explorar é o que o bicho faz sozinho; o jogador só liga ou desliga
export const explores = (a) => a.explora !== false;
export function setExplore(a, on) {
  a.explora = !!on;
  if (!on && a.task?.auto) { releaseTask(a); a.task = null; }
  save(); tick(); return a.explora;
}
const bagFull = (a) => (a.bolsa?.length || 0) >= bagCap(a);
function autoExplore(a, t) { const rid = a.local; return { tipo: 'explorar', alvo: -1, ini: t, fim: t + taskDur(a, 'explorar', rid), auto: true }; }
// dá a ordem: o bicho vai até lá, trabalha e o que ele pegar vai direto para o inventário
export function commandPet(a, tipo, alvo) {
  const rid = a.local; if (!rid || busy(a)) return false;
  const c = COMMANDS.find((x) => x.tipo === tipo); if (!c || (c.sk && skillLevel(a, c.sk) <= 0)) return false;
  const alvos = commandTargets(rid, tipo); if (alvo == null) alvo = alvos[0]; if (!alvos.includes(alvo)) return false;
  releaseTask(a); // para de explorar para fazer o que você pediu
  if (tipo === 'fundir') S.base.fila--;
  const node = nodeOf(rid, tipo, alvo); if (node) node.por = a.uid;
  const t = now(); a.task = { tipo, alvo, ini: t, fim: t + taskDur(a, tipo, rid) }; save(); return true;
}
export function stopPet(a) { releaseTask(a); a.task = null; save(); tick(); }
const yieldCount = (a) => { const y = yieldOf(a.sp); return Math.floor(y) + (rnd() < y % 1 ? 1 : 0); };
// o que os bichos terminam aparece para a tela (itens voando); no jogo já está no inventário
const doneQueue = [];
export const takeDone = () => doneQueue.splice(0);
function bagPush(a, item, n) { for (let i = 0; i < n; i++) a.bolsa.push(item); }
function regionDrop(rid, a) {
  const reg = regionById(rid); const lvl = farmTier(rid);
  const match = SPECIES[a.sp].el === reg.el || SPECIES[a.sp].el === 'trovao';
  const enc = skillLevel(a, 'encantar'); const I = EL_ITEMS[reg.el];
  const table = [[I.comum, 70], [I.incomum, 22 + lvl * 2 + enc * 4], [I.raro, (5 + lvl * 1.5 + enc * 3) * (match ? 1.7 : 1)], ['orvalho', 14]];
  if (lvl >= 3 || enc >= 3) table.push(['runa', 0.6 + Math.max(0, lvl - 3) * 0.4 + enc * 0.3]);
  const tema = themeItem(); if (tema) table.push([tema, 9]);
  return weighted(table);
}
const frostBonus = (rid) => (amigosEm(rid).some((x) => skillLevel(x, 'congelar') > 0) ? 1 : 0);
// o que sai de cada recurso (o jogador tira um pouco; companheiro tira pela raridade)
function resourceLoot(rid, tipo, n, mineLvl = 0) {
  const out = [];
  const I = EL_ITEMS[regionById(rid).el];
  if (tipo === 'arvore') { for (let i = 0; i < n + 1; i++) out.push('madeira'); if (rnd() < 0.15) out.push(I.comum); }
  if (tipo === 'rocha') { for (let i = 0; i < n; i++) out.push('ferro'); if (rnd() < 0.45) out.push('seixo'); if (rnd() < 0.05 + mineLvl * 0.02) out.push('gema'); }
  if (tipo === 'arbusto') { for (let i = 0; i < n; i++) out.push('fruta'); if (rnd() < 0.5) out.push(I.comum); const T = themeItem(); if (T && rnd() < 0.25) out.push(T); }
  return out;
}
function completeTask(a, rid) {
  const t = a.task; const g = S.regioes[rid]; const before = a.bolsa.length;
  const n = yieldCount(a); const node = nodeOf(rid, t.tipo, t.alvo);
  switch (t.tipo) {
    case 'semear': if (node) Object.assign(node, { st: 'semeado', planta: seedChoice() }); break;
    case 'regar': if (node) Object.assign(node, { st: 'regado', ini: t.fim, ate: t.fim + cropOf(node).tempo }); break;
    case 'colher': if (node) { const cp = cropOf(node); node.st = 'vazio'; bagPush(a, cp.item, n * cp.qtd + frostBonus(rid)); } break;
    case 'fundir': bagPush(a, 'barra', 1 + (n >= 3 ? 1 : 0)); break;
    case 'cortar': case 'minerar': case 'catar': {
      const tipo = t.tipo === 'cortar' ? 'arvore' : t.tipo === 'minerar' ? 'rocha' : 'arbusto';
      if (node && node.livre <= t.fim) { node.livre = t.fim + RESPAWN; for (const it of resourceLoot(rid, tipo, n, skillLevel(a, 'minerar'))) bagPush(a, it, 1); }
      break; }
    case 'explorar': for (let i = 0; i < n; i++) if (!bagFull(a)) a.bolsa.push(regionDrop(rid, a)); break;
  }
  if (node) node.por = 0;
  amigoAddXp(a, 2);
  // explorando, o que acha fica na bolsa dele (você pega com "Pegar tudo")
  if (t.auto) { a.task = null; return; }
  // tudo vai direto para o inventário (comida vai para a cesta do comedouro)
  const got = a.bolsa.splice(before);
  for (const it of got) { if (isFood(it)) storeFood(rid, it, 1); else addItem(it); }
  if (S.stats.frutas >= 20) achieve('fazendeiro');
  S.moedas += got.length; S.stats.coletas += got.length; addXp(got.length); addFarmXp(rid, Math.ceil(got.length / 2) + 1);
  doneQueue.push({ uid: a.uid, rid, tipo: t.tipo, itens: got, alvo: t.alvo });
  a.task = null;
  void g;
}
// avança tudo (também o tempo em que o jogo ficou fechado)
export function tick(t = now()) {
  let changed = false;
  for (const r of REGIONS) {
    const g = S.regioes[r.id]; if (!g.aberta) continue;
    for (const c of canteiros(r.id)) if (c.st === 'regado' && t >= c.ate) { c.st = 'pronto'; changed = true; }
    while (g.brilhos < 3 && t - g.brilhoDesde >= 30000) { g.brilhos++; g.brilhoDesde += 30000; changed = true; }
    if (g.brilhos >= 3) g.brilhoDesde = t;
  }
  for (const a of S.amigos) {
    if (!a.local) continue;
    a.bolsa ||= [];
    if (busy(a, t)) continue;
    for (let guard = 0; guard < 300; guard++) {
      if (a.task && t >= a.task.fim) { const fim = a.task.fim; completeTask(a, a.local); changed = true; for (const c of canteiros(a.local)) if (c.st === 'regado' && fim >= c.ate) c.st = 'pronto'; if (explores(a) && !bagFull(a)) { a.task = autoExplore(a, fim); continue; } }
      if (!a.task && explores(a) && !bagFull(a)) { a.task = autoExplore(a, t); changed = true; }
      break;
    }
  }
  if (S.fusao && S.fusao.ate <= t && !S.fusao.pronta) { S.fusao.pronta = true; changed = true; }
  const last = S.ultimoTick || t; const dt = Math.max(0, Math.min(t - last, 8 * 3600000)); S.ultimoTick = t;
  if (dt > 0) {
    for (const r of REGIONS) { // os bichos comem da cesta, a comida mais simples primeiro
      const pets = amigosEm(r.id).length; const c = troughOf(r.id); if (!pets || !c) continue;
      c.fomeAcc = (c.fomeAcc || 0) + pets * dt / PET_EAT_MS;
      while (c.fomeAcc >= 1) { const id = FOOD_IDS.find((f) => c.comida?.[f] > 0); if (!id) { c.fomeAcc = Math.min(c.fomeAcc, 1); break; } c.comida[id]--; if (!c.comida[id]) delete c.comida[id]; c.fomeAcc--; changed = true; }
    }
    S.energia = Math.min(ENERGY_MAX, energy() + dt / 120000); // +1 a cada 2 minutos descansando
  }
  if (changed) save();
  return changed;
}
export const taskOf = (a) => a.task?.tipo || (bagFull(a) ? 'cheio' : null);
// pega tudo o que está na bolsa do companheiro
export function collect(a) {
  if (!a.bolsa?.length) return [];
  const got = a.bolsa.splice(0);
  for (const it of got) { if (isFood(it)) storeFood(a.local, it, 1); else addItem(it); }
  if (S.stats.frutas >= 20) achieve('fazendeiro');
  S.moedas += got.length; S.stats.coletas += got.length; addXp(got.length); if (a.local) addFarmXp(a.local, Math.ceil(got.length / 2));
  tick(); save(); return got;
}

// ---------- o que o próprio jogador faz com as mãos ----------
export const PLAYER_ACTION = { arvore: 'cortar', rocha: 'minerar', arbusto: 'catar' };
// cortar, minerar ou catar: some do cenário e volta em 5 minutos
export function playerGather(rid, id) {
  const st = resState(rid, id); const res = resourcesOf(rid).find((r) => r.id === id);
  if (!res) return { erro: 'Isso não está aqui.' };
  if (st.livre > now()) return { erro: `Volta a crescer em ${Math.ceil((st.livre - now()) / 60000)} min.` };
  if (st.por) { const who = S.amigos.find((x) => x.uid === st.por); if (who) { releaseTask(who); who.task = null; } st.por = 0; }
  st.livre = now() + RESPAWN; spend(rid, 4);
  const got = resourceLoot(rid, res.tipo, 1);
  let cesta = 0; for (const it of got) { if (isFood(it)) cesta += storeFood(rid, it, 1); else addItem(it); }
  S.stats.coletas += got.length; addXp(1); addFarmXp(rid, 3); save();
  return { itens: got, cesta };
}
export function plotState(rid, uid) { return S.regioes[rid].obras.find((o) => o.uid === uid && o.tipo === 'canteiro'); }
// o que plantar: o jogador escolhe; os bichos plantam a última semente escolhida
export const cropOf = (c) => CROPS[c?.planta] || CROPS.fruta;
export const cropOpen = (id) => !!CROPS[id] && S.nivel >= CROPS[id].nivel;
export const seedChoice = () => (cropOpen(S.semente) ? S.semente : 'fruta');
export function playerPlant(rid, uid, crop = seedChoice()) { const c = plotState(rid, uid); if (!c || c.st !== 'vazio' || c.por || !CROPS[crop] || !cropOpen(crop)) return false; c.st = 'semeado'; c.planta = crop; S.semente = crop; spend(rid, 2); addXp(1); addFarmXp(rid, 2); save(); return true; }
export function playerWater(rid, uid) { const c = plotState(rid, uid); if (!c || c.st !== 'semeado' || c.por) return false; Object.assign(c, { st: 'regado', ini: now(), ate: now() + cropOf(c).tempo }); spend(rid, 2); addXp(1); addFarmXp(rid, 2); save(); return true; }
export function harvestPlot(rid, uid) {
  const c = plotState(rid, uid); if (!c || c.st !== 'pronto' || c.por) return 0;
  const cp = cropOf(c); c.st = 'vazio'; const n = cp.qtd + frostBonus(rid); if (isFood(cp.item)) storeFood(rid, cp.item, n); else addItem(cp.item, n); if (S.stats.frutas >= 20) achieve('fazendeiro');
  lastHarvest = cp.item; addXp(1); addFarmXp(rid, 2); save(); return n;
}
export let lastHarvest = 'fruta';
export function collectSparkle(rid) {
  const g = S.regioes[rid]; if (g.brilhos <= 0) return null;
  if (g.brilhos === 3) g.brilhoDesde = now();
  g.brilhos--; const reg = regionById(rid);
  const longe = EL_ITEMS[pick(Object.keys(EL_ITEMS))].comum; // às vezes o vento traz um item de outra região
  const table = [[EL_ITEMS[reg.el].comum, 60], [EL_ITEMS[reg.el].incomum, 16], ['orvalho', 18], [longe, 28], [EL_ITEMS[reg.el].raro, 2]];
  const T = themeItem(); if (T) table.push([T, 40]);
  const item = weighted(table);
  addItem(item); addFarmXp(rid, 1); save(); return item;
}
// os enfeites de época do chão (presentes, ovinhos, abóboras...): toque e ganhe o item da época
export function themePropAlive(rid, id, t = now()) { const st = S.regioes[rid].rec[id]; return !st || st.livre <= t; }
export function collectThemeProp(rid, id) {
  const T = themeItem(); if (!T || !themePropAlive(rid, id)) return null;
  S.regioes[rid].rec[id] = { livre: now() + RESPAWN, por: 0 };
  const got = [T]; if (rnd() < 0.35) got.push(T);
  for (const it of got) addItem(it); S.moedas += 2; addXp(1); addFarmXp(rid, 2); save(); return got;
}

// ---------- aumentar o terreno: um lote vizinho de cada vez ----------
export function expandOptions(rid) {
  const g = S.regioes[rid]; const out = new Set();
  for (const k of g.zonas) for (const n of neighbors(k)) if (!g.zonas.includes(n)) out.add(n);
  return [...out];
}
export function expandCost(rid) {
  const g = S.regioes[rid]; const n = g.zonas.length; if (n >= MAX_ZONES) return null;
  const idx = REGIONS.findIndex((r) => r.id === rid); const I = EL_ITEMS[REGIONS[idx].el];
  const itens = { [I.comum]: 2 + n }; if (n >= 3) itens[I.incomum] = Math.ceil((n - 2) / 2); if (n >= 4) itens.madeira = 2 * n; if (n >= 9) itens[I.raro] = Math.ceil((n - 8) / 4);
  return { moedas: Math.round(8 * n * n * (1 + idx * 0.6)), itens };
}
export function canPay(c) {
  if (S.moedas < (c.moedas || 0)) return false;
  for (const [id, n] of Object.entries(c.itens || {})) if (!has(id, n)) return false;
  return true;
}
function pay(c) { S.moedas -= c.moedas || 0; for (const [id, n] of Object.entries(c.itens || {})) useItem(id, n); }
// pode abrir mais um lote? só se o nível da fazendinha já permitir
export function expandState(rid) {
  const g = S.regioes[rid]; const n = g.zonas.length; const lvl = farmLevel(rid);
  if (n >= MAX_ZONES) return { ok: false, completo: true };
  if (n >= zonesForLevel(lvl)) { let need = lvl; while (zonesForLevel(need) <= n) need++; return { ok: false, precisa: need, motivo: `A fazendinha precisa chegar ao nível ${need}` }; }
  const c = expandCost(rid); return { ok: canPay(c), custo: c, motivo: canPay(c) ? null : 'Faltam moedas ou itens' };
}
export function expand(rid, k) {
  const c = expandCost(rid); if (!c || !expandState(rid).ok || !expandOptions(rid).includes(k)) return false;
  pay(c); S.regioes[rid].zonas.push(k); addXp(8); save(); return true;
}

// ---------- construir: escolher o que e ONDE ----------
export function buildState(id, rid) {
  const b = BUILDINGS[id]; const tema = themeOn();
  const n = b.unico || b.total ? countBuilt(id) : countBuilt(id, rid);
  const lim = b.unico ? 1 : b.total || (b.porNivel ? Math.min(b.max, 2 + farmLevel(rid)) : b.max) || 40;
  const done = n >= lim;
  const nivelFalta = b.nivel && S.nivel < b.nivel ? b.nivel : 0;
  const locked = (b.precisa && !countBuilt(b.precisa)) || (b.tema && b.tema !== tema) || !!nivelFalta;
  return { done, locked, nivelFalta, temaFora: b.tema && b.tema !== tema, ok: !done && !locked && canPay({ itens: b.custo }) && S.regioes[rid].obras.length < 60, count: n, lim };
}
// o lugar está livre? (dentro do terreno liberado e sem bater em nada)
export function canPlace(rid, tipo, x, z, ignore = null) {
  const g = S.regioes[rid]; const r = BUILDINGS[tipo].r;
  if (!insideOpen(g.zonas, x, z, r * 0.9)) return { ok: false, motivo: 'Fora da área liberada' };
  for (const res of resourcesOf(rid)) if (Math.hypot(res.x - x, res.z - z) < res.r + r + 0.1) return { ok: false, motivo: 'Tem uma árvore ou pedra aqui' };
  for (const o of g.obras) if (o.uid !== ignore && Math.hypot(o.x - x, o.z - z) < BUILDINGS[o.tipo].r + r + 0.05) return { ok: false, motivo: 'Já tem uma construção aqui' };
  if (Math.hypot(NPC_SPOT[0] - x, NPC_SPOT[1] - z) < 1.4 + r) return { ok: false, motivo: 'Aqui mora quem pede ajuda' };
  for (const p of pondsOf(rid, g.zonas)) if (Math.hypot(p.x - x, p.z - z) < p.r + r + 0.1) return { ok: false, motivo: 'Aqui é água' };
  return { ok: true };
}
function addObra(rid, tipo, x, z, rot = 0) {
  const o = { uid: S.nextObra++, tipo, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, rot };
  if (tipo === 'canteiro') Object.assign(o, { st: 'vazio', ate: 0, por: 0 });
  if (tipo === 'comedouro') o.comida = {}; // a cesta começa vazia
  S.regioes[rid].obras.push(o); syncBase(); return o;
}
export function build(rid, id, x, z, rot = 0) {
  const st = buildState(id, rid); if (!st.ok) return null;
  if (!canPlace(rid, id, x, z).ok) return null;
  pay({ itens: BUILDINGS[id].custo });
  const o = addObra(rid, id, x, z, rot);
  if (id === 'bancada') achieve('construtor');
  addXp(BUILDINGS[id].cat === 'util' ? 12 : 3); addFarmXp(rid, BUILDINGS[id].cat === 'util' ? 8 : 3); fillMissions(rid); save(); return o;
}
export function moveObra(rid, uid, x, z, rot) {
  const o = S.regioes[rid].obras.find((q) => q.uid === uid); if (!o) return false;
  if (!canPlace(rid, o.tipo, x, z, uid).ok) return false;
  Object.assign(o, { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, rot }); save(); return true;
}
// guardar (desmontar) um enfeite: devolve metade do material
export function removeObra(rid, uid) {
  const g = S.regioes[rid]; const o = g.obras.find((q) => q.uid === uid); if (!o) return null;
  const b = BUILDINGS[o.tipo]; if (b.cat === 'util' && o.tipo !== 'canteiro') return null;
  if (o.por) { const who = S.amigos.find((x) => x.uid === o.por); if (who) { releaseTask(who); who.task = null; } }
  g.obras = g.obras.filter((q) => q !== o);
  const back = {}; for (const [id, n] of Object.entries(b.custo)) { const k = Math.floor(n / 2); if (k) { addItem(id, k); back[id] = k; } }
  syncBase(); save(); return back;
}
// procura um lugar livre perto de um ponto (para colocar coisas automaticamente)
export function findSpot(rid, tipo, nx = 0, nz = 0) {
  for (let ring = 0; ring < 30; ring++) for (let i = 0; i < Math.max(1, ring * 6); i++) {
    const a = (i / Math.max(1, ring * 6)) * Math.PI * 2; const x = nx + Math.cos(a) * ring * 0.7, z = nz + Math.sin(a) * ring * 0.7;
    if (canPlace(rid, tipo, x, z).ok) return [x, z];
  }
  return null;
}
export function craft(id) {
  const c = CRAFTS.find((x) => x.id === id); if (!S.base.bancada || !canPay({ itens: c.custo })) return false;
  pay({ itens: c.custo }); addItem(c.dá, c.qtd || 1); addXp(3); save(); return true;
}
export function addToForno(n) { n = Math.min(n, S.itens.ferro || 0); if (!S.base.forno || n <= 0) return 0; useItem('ferro', n); S.base.fila += n; save(); return n; }
export const BASE_REGION_ID = BASE_REGION;
function starterPlots(rid) { for (const [x, z] of [[-2.6, 2.6], [-1.0, 2.9]]) { const p = findSpot(rid, 'canteiro', x, z); if (p) addObra(rid, 'canteiro', p[0], p[1]); } }

// ---------- pontes rúnicas e resgates ----------
export function bridgeState(rid) {
  const i = REGIONS.findIndex((r) => r.id === rid); const reg = REGIONS[i];
  if (S.regioes[rid].aberta) return { aberta: true };
  const prev = REGIONS[i - 1]; const p = reg.ponte; const prevSalvo = S.regioes[prev.id].salvo;
  return { aberta: false, prev, prevSalvo, ok: prevSalvo && canPay(p) && S.amigos.length >= p.amigos, ponte: p };
}
export function openBridge(rid) {
  const b = bridgeState(rid); if (b.aberta || !b.ok) return false;
  pay(b.ponte); S.regioes[rid].aberta = true; S.regioes[rid].brilhos = 3; S.regioes[rid].brilhoDesde = now(); if (!S.regioes[rid].obras.some((o) => o.tipo === 'canteiro')) starterPlots(rid);
  addXp(15); if (REGIONS.every((r) => S.regioes[r.id].aberta)) achieve('mapa');
  save(); return true;
}
export function rescueHelpers(rid) {
  const res = REGIONS.find((r) => r.id === rid).resgate;
  return S.amigos.filter((a) => (SPECIES[a.sp].el === res.precisa.el || SPECIES[a.sp].el === 'trovao') && SPECIES[a.sp].stage >= res.precisa.estagio && !busy(a));
}
export function canRescue(rid) {
  const g = S.regioes[rid]; const res = REGIONS.find((r) => r.id === rid).resgate;
  return g.aberta && !g.salvo && rescueHelpers(rid).length > 0 && canPay({ itens: res.itens });
}
export function rescue(rid, helper) {
  if (!canRescue(rid)) return null;
  const res = REGIONS.find((r) => r.id === rid).resgate;
  pay({ itens: res.itens }); S.regioes[rid].salvo = true; S.stats.resgates++;
  const premio = { moedas: 30 + 25 * S.stats.resgates, brilho: 1, coroa: S.stats.resgates >= 3 ? 1 : 0, runa: 1 };
  S.moedas += premio.moedas; S.brilho += premio.brilho; addItem('runa', premio.runa); if (premio.coroa) addItem('coroa');
  if (helper) amigoAddXp(helper, 15);
  addXp(25); achieve('heroi'); if (S.stats.resgates >= 8) achieve('herois');
  fillOrders(); save();
  return premio;
}

// ---------- pedidos de quem foi salvo ----------
const rescued = () => REGIONS.filter((r) => S.regioes[r.id].salvo);
export function fillOrders() {
  const quem = rescued(); if (!quem.length) return;
  while (S.pedidos.length < Math.min(3, quem.length + 1)) S.pedidos.push(makeOrder(pick(quem)));
}
function makeOrder(reg) {
  const open = REGIONS.filter((r) => S.regioes[r.id].aberta);
  const tipo = weighted([['itens', 45], ['recurso', S.base.bancada ? 20 : 8], ['amigo', 25], ['descobrir', 12]]);
  const id = Math.random().toString(36).slice(2, 8);
  let o;
  if (tipo === 'itens') {
    const r = pick(open); const rar = weighted([['comum', 70], ['incomum', 26], ['raro', 4]]);
    const item = EL_ITEMS[r.el][rar]; const qtd = rar === 'comum' ? 3 + Math.floor(rnd() * 4) : rar === 'incomum' ? 1 + Math.floor(rnd() * 2) : 1;
    o = { tipo: 'itens', item, qtd, valor: qtd * RARITIES[rar].pontos };
  } else if (tipo === 'recurso') {
    const item = pick(S.base.forno ? ['madeira', 'ferro', 'fruta', 'barra'] : ['madeira', 'ferro', 'fruta']); const qtd = item === 'barra' ? 2 : 4 + Math.floor(rnd() * 5);
    o = { tipo: 'itens', item, qtd, valor: qtd * (item === 'barra' ? 3 : 1) };
  } else if (tipo === 'amigo') {
    const own = [...new Set(S.amigos.map((a) => SPECIES[a.sp].el))];
    const el = rnd() < 0.7 && own.length ? pick(own) : pick(open).el;
    const estagio = S.nivel >= 8 && rnd() < 0.4 ? 1 : 0;
    o = { tipo, el, estagio, valor: 4 + estagio * 6 };
  } else o = { tipo, alvo: discoveredCount() + 1, valor: 8 };
  o.id = id; o.quem = reg.resgate.quem; o.regiao = reg.id;
  o.premio = { moedas: 8 + o.valor * 3, xp: 6 + o.valor * 2 };
  const extra = weighted([['brilho', 40], ['nada', 40], ['runa', 14], ['coroa', S.nivel >= 5 ? 6 : 0]]);
  if (extra !== 'nada') o.premio[extra] = 1;
  return o;
}
export function orderReady(o) {
  if (o.tipo === 'itens') return has(o.item, o.qtd);
  if (o.tipo === 'amigo') return orderHelpers(o).length > 0;
  return discoveredCount() >= o.alvo;
}
export const orderHelpers = (o) => S.amigos.filter((a) => SPECIES[a.sp].el === o.el && SPECIES[a.sp].stage >= o.estagio && !busy(a));
export function deliver(o, helper) {
  if (!orderReady(o)) return null;
  if (o.tipo === 'itens') useItem(o.item, o.qtd);
  if (o.tipo === 'amigo') { const h = helper || orderHelpers(o)[0]; releaseTask(h); h.task = null; h.ocupadoAte = now() + 90000; amigoAddXp(h, 8); }
  const p = o.premio; S.moedas += p.moedas; addXp(p.xp);
  if (p.brilho) S.brilho += 1; if (p.runa) addItem('runa'); if (p.coroa) addItem('coroa');
  S.pedidos = S.pedidos.filter((x) => x.id !== o.id); fillOrders(); save();
  return p;
}
export function skipOrder(o) { S.pedidos = S.pedidos.filter((x) => x.id !== o.id); fillOrders(); save(); }

// ---------- presente do dia ----------
function checkDaily() {
  const t = today(); const d = S.diario;
  if (d.ultimo === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  d.serie = d.ultimo === today(y) ? d.serie + 1 : 1;
  d.ultimo = t; d.pendente = true;
}
export function claimDaily() {
  const d = S.diario; if (!d.pendente) return null;
  d.pendente = false;
  const open = REGIONS.filter((r) => S.regioes[r.id].aberta);
  const itens = { orvalho: 2, madeira: 2, fruta: 1 };
  for (let i = 0; i < 3 + Math.min(d.serie, 5); i++) { const r = i % 2 ? pick(open) : pick(REGIONS); const it = EL_ITEMS[r.el][weighted([['comum', 75], ['incomum', 22], ['raro', 3]])]; itens[it] = (itens[it] || 0) + 1; }
  if (d.serie % 7 === 0) itens.runa = 1;
  const T = themeItem(); if (T) itens[T] = 2;
  for (const [k, n] of Object.entries(itens)) addItem(k, n);
  const moedas = 15 + d.serie * 5; S.moedas += moedas; S.brilho += 1;
  save();
  return { serie: d.serie, moedas, itens, brilho: 1 };
}

// ---------- Fusão do Trovão ----------
export const fusaoCandidates = () => S.amigos.filter((a) => SPECIES[a.sp].stage === 2 && !busy(a));
export function startFusao(a, b) {
  if (!fusaoLiberada() || S.fusao || a === b) return false;
  if (SPECIES[a.sp].stage !== 2 || SPECIES[b.sp].stage !== 2 || busy(a) || busy(b)) return false;
  const ate = now() + 60000;
  for (const x of [a, b]) { releaseTask(x); x.task = null; x.ocupadoAte = ate; }
  S.fusao = { a: a.uid, b: b.uid, ate, pronta: false };
  achieve('fusao'); S.stats.fusoes++; save(); return true;
}
export function hatchFusao() {
  const f = S.fusao; if (!f || !f.pronta) return null;
  const A = S.amigos.find((x) => x.uid === f.a), B = S.amigos.find((x) => x.uid === f.b);
  S.fusao = null;
  const ra = RARITY_ORDER.indexOf(SPECIES[A.sp].rar), rb = RARITY_ORDER.indexOf(SPECIES[B.sp].rar);
  const ea = SPECIES[A.sp].el, eb = SPECIES[B.sp].el;
  let famId;
  if (ra >= 4 && rb >= 4 && rnd() < 0.35) famId = pick(FAMILIES.filter((x) => x.rar === 'mitico')).id;
  else if (ea !== eb && Math.min(ra, rb) >= 2 && rnd() < 0.3) famId = pick(FAMILIES.filter((x) => x.el === 'trovao' && x.rar === 'lendario')).id;
  else {
    let target = Math.max(ra, rb) + (rnd() < 0.5 ? 1 : 0);
    const el = rnd() < 0.5 ? ea : eb;
    const pool = (tg) => FAMILIES.filter((x) => x.el === el && !x.fusao && !x.tema && RARITY_ORDER.indexOf(x.rar) === tg);
    while (target > 0 && !pool(target).length) target--;
    const p = pool(target); famId = p.length ? pick(p).id : pick(FAMILIES.filter((x) => x.el === el && !x.fusao && !x.tema)).id;
  }
  const res = createAmigo(famId * 3, rnd() < 1 / 12);
  save();
  return { ...res, fam: FAMILIES[famId] };
}

// ---------- conquistas ----------
export function achieve(id) {
  if (S.conquistas[id]) return;
  S.conquistas[id] = now();
  const a = ACHIEVEMENTS.find((x) => x.id === id); if (!a) return;
  S.moedas += 10; notify({ tipo: 'conquista', a });
}
export const ownedElements = () => new Set(S.amigos.map((a) => SPECIES[a.sp].el));
export { ELEMENT_ORDER, SKILLS };

// ---------- missões ----------
// tipos: fazenda (juntar recursos da fazendinha) · epoca (item especial da época) ·
// construir (fazer uma construção) · evolucao (ajudar um bicho a evoluir)
const FARM_TITLES = [['Estoque da fazendinha', '📦'], ['Cerca nova', '🪵'], ['Festa da colheita', '🧺'], ['Caixa de ferramentas', '🧰'], ['Piquenique', '🧺'], ['Reforma do celeiro', '🏚️']];
const SEASON_MIS = {
  natal: ['Enfeitar o Natal', '🎄', { enfeite: 2, madeira: 3, fruta: 2 }], ferias: ['Dia de praia', '🏖️', { coco: 2, fruta: 3, orvalho: 2 }],
  carnaval: ['Bloco de Carnaval', '🎭', { confete: 2, pena: 2, fruta: 2 }], pascoa: ['Caça aos ovinhos', '🐣', { ovinho: 2, trevo: 2, fruta: 2 }],
  junina: ['Arraiá da fazendinha', '🌽', { milho: 2, madeira: 3, fruta: 2 }], halloween: ['Doces ou travessuras', '🎃', { abobora: 2, fruta: 3, orvalho: 2 }],
};
const mid = () => Math.random().toString(36).slice(2, 8);
export const missions = () => (S.missoes ||= []);
export function fillMissions(cur) {
  const list = missions(); const t = themeOn();
  // tira o que deixou de fazer sentido
  S.missoes = list.filter((m) => {
    if (m.tipo === 'evolucao') { const a = S.amigos.find((x) => x.uid === m.uid); return a && SPECIES[a.sp].stage === m.stage && !a.evoOk?.[m.stage]; }
    if (m.tipo === 'epoca') return m.tema === t;
    if (m.tipo === 'cocho') return false;
    return true;
  });
  const has = (f) => S.missoes.some(f);
  // evolução: cada bicho que chegou no nível pede ajuda
  for (const a of S.amigos) {
    const st = SPECIES[a.sp].stage; if (st >= 2 || a.nivel < EVOLVE_AT[st] || a.evoOk?.[st] || has((m) => m.tipo === 'evolucao' && m.uid === a.uid)) continue;
    const I = EL_ITEMS[SPECIES[a.sp].el] || EL_ITEMS.cosmo;
    const pede = st === 0 ? { [I.comum]: 4, fruta: 3, madeira: 2 } : { [I.incomum]: 2, [I.comum]: 5, barra: 2, fruta: 4 };
    S.missoes.push({ id: mid(), tipo: 'evolucao', uid: a.uid, stage: st, titulo: `${nomeDe(a)} quer evoluir!`, icone: '🧬', pede, premio: { moedas: 10 + 15 * st, xp: 8 + 6 * st } });
  }
  for (const r of REGIONS) {
    const g = S.regioes[r.id]; if (!g.aberta) continue;
    const pets = amigosEm(r.id).length;
    // primeiro construir o comedouro e o bebedouro
    for (const ob of ['comedouro', 'bebedouro']) {
      const o = g.obras.find((x) => x.tipo === ob);
      if (!o && pets && !has((m) => m.tipo === 'construir' && m.rid === r.id && m.obra === ob)) S.missoes.push({ id: mid(), tipo: 'construir', rid: r.id, obra: ob, titulo: `${BUILDINGS[ob].nome} em ${r.nome}`, icone: BUILDINGS[ob].icone, pede: {}, premio: { moedas: 12, xp: 6, fxp: 12 } });
    }
  }
  // uma missão da fazendinha onde você está
  if (cur && S.regioes[cur]?.aberta && !has((m) => m.tipo === 'fazenda' && m.rid === cur)) {
    const lvl = farmLevel(cur); const I = EL_ITEMS[regionById(cur).el]; const [titulo, icone] = pick(FARM_TITLES);
    const pool = [['madeira', 2 + lvl], ['ferro', 1 + Math.ceil(lvl / 2)], ['fruta', 2 + lvl], [I.comum, 2 + lvl], ['seixo', 1 + Math.ceil(lvl / 3)]];
    if (lvl >= 3) pool.push([I.incomum, 1 + Math.floor(lvl / 4)]);
    const pede = {}; for (const [id, n] of [...pool].sort(() => rnd() - 0.5).slice(0, 3)) pede[id] = n;
    const extra = weighted([['brilho', 30], [I.incomum, 30], ['orvalho', 25], ['runa', lvl >= 5 ? 15 : 0]]);
    S.missoes.push({ id: mid(), tipo: 'fazenda', rid: cur, titulo, icone, pede, premio: { moedas: 10 + lvl * 6, xp: 6 + lvl * 2, fxp: Math.ceil(farmXpNeed(lvl) * 0.45), itens: { [extra]: 1 } } });
  }
  // a missão da época: junta itens e ganha o item especial
  if (t && !has((m) => m.tipo === 'epoca')) {
    const [titulo, icone, pede] = SEASON_MIS[t]; const special = SPECIAL_ITEM[t];
    S.missoes.push({ id: mid(), tipo: 'epoca', tema: t, titulo, icone, pede: { ...pede }, premio: { moedas: 20, xp: 10, itens: { [special]: 1 } } });
  }
  S.missaoNova = false;
  return S.missoes;
}
// o que falta em cada missão
export function missionRows(m) {
  const rows = Object.entries(m.pede || {}).map(([id, n]) => ({ id, n, tem: count(id) }));
  for (const r of rows) r.ok = r.tem >= r.n;
  if (m.tipo === 'construir') rows.push({ obra: m.obra, n: 1, tem: hasObra(m.rid, m.obra) ? 1 : 0, ok: hasObra(m.rid, m.obra) });
  return rows;
}
export const missionReady = (m) => missionRows(m).every((r) => r.ok);
export function completeMission(id) {
  const m = missions().find((x) => x.id === id); if (!m || !missionReady(m)) return null;
  for (const [it, n] of Object.entries(m.pede || {})) useItem(it, n);
  const p = m.premio || {};
  S.moedas += p.moedas || 0; if (p.xp) addXp(p.xp); if (p.fxp && m.rid) addFarmXp(m.rid, p.fxp);
  for (const [it, n] of Object.entries(p.itens || {})) addItem(it, n);
  let efeito = null;
  if (m.tipo === 'evolucao') { const a = S.amigos.find((x) => x.uid === m.uid); if (a) { (a.evoOk ||= {})[m.stage] = true; amigoAddXp(a, 10); efeito = { tipo: 'evolucao', amigo: a }; } }
  S.missoes = S.missoes.filter((x) => x !== m); S.stats.missoes = (S.stats.missoes || 0) + 1;
  fillMissions(m.rid); save();
  return { ...p, efeito, m };
}
export function skipMission(id) { const m = missions().find((x) => x.id === id); if (!m || m.tipo !== 'fazenda') return; S.missoes = S.missoes.filter((x) => x !== m); fillMissions(m.rid); save(); }
