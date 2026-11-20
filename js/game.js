// Brilhinhos — as regras do jogo (sem tela): salvar, Forja, fazendinhas com trabalho
// automático (plantação, corte, mineração, forno), base (bancada e construções),
// evolução, pedidos, resgates, presente do dia e Fusão do Trovão.
import { ITEMS, RARITIES, RARITY_ORDER, FAMILIES, SPECIES, RECIPE_INDEX, recipeKey, REGIONS, EL_ITEMS,
  EVOLVE_AT, EVOLVE_COST, ACHIEVEMENTS, ELEMENT_ORDER, skillsOf, yieldOf, BUILDINGS, CRAFTS, SKILLS } from './data.js';

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

function newRegion(open) { return { aberta: open, fazenda: 1, salvo: false, brilhos: 2, brilhoDesde: now(), arv: [], roc: [], cant: [] }; }
export function newState() {
  const regioes = {};
  for (const r of REGIONS) regioes[r.id] = newRegion(r.id === BASE_REGION);
  return {
    v: 3, criado: now(), moedas: 15, xp: 0, nivel: 1, brilho: 1,
    itens: { trevo: 4, orvalho: 3, cogumelo: 1 },
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
  if (!S || S.v !== 3) S = newState();
  for (const r of REGIONS) { S.regioes[r.id] ||= newRegion(false); ensureNodes(r.id); }
  checkDaily();
  return S;
}
let saveTimer = 0;
export function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 150); }
export function saveNow() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
export function resetGame() { S = newState(); ensureNodes(BASE_REGION); checkDaily(); saveNow(); }
export function setState(s) { S = s; for (const r of REGIONS) ensureNodes(r.id); }

const notify = (a) => S.avisos.push(a);
export const takeNotices = () => S.avisos.splice(0);

// ---------- itens, moedas e níveis ----------
export const has = (id, n = 1) => (id === 'brilho' ? S.brilho : (S.itens[id] || 0)) >= n;
export function addItem(id, n = 1) {
  if (id === 'brilho') { S.brilho += n; return; }
  S.itens[id] = (S.itens[id] || 0) + n;
  if (id === 'madeira') { S.stats.madeira += n; if (S.stats.madeira >= 50) achieve('lenhador'); }
}
export function useItem(id, n = 1) { if (id === 'brilho') { S.brilho -= n; return; } S.itens[id] = (S.itens[id] || 0) - n; if (S.itens[id] <= 0) delete S.itens[id]; }
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
  while (a.nivel < 20 && a.xp >= amigoXpNeed(a)) { a.xp -= amigoXpNeed(a); a.nivel++; }
}
export function canEvolve(a) {
  const s = SPECIES[a.sp].stage;
  if (s >= 2) return { ok: false, motivo: 'Já é Adulto!' };
  if (a.nivel < EVOLVE_AT[s]) return { ok: false, motivo: `Precisa chegar ao nível ${EVOLVE_AT[s]}` };
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
  useItem(item); amigoAddXp(a, item === 'racao' ? 40 : 12); addXp(1); save(); return true;
}

// ---------- a Forja do Trovão ----------
export const magicPoints = (items) => items.reduce((s, id) => s + RARITIES[ITEMS[id].rar].pontos, 0);
export function rarityChances(items) {
  const M = magicPoints(items);
  const w = { comum: Math.max(15, 100 - 2 * M), incomum: 15 + 1.6 * M, raro: 3 + 0.9 * M, epico: 0.5 + 0.3 * M, lendario: M >= 15 ? 0.05 + 0.06 * M : 0.03 };
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  const out = {}; for (const k in w) out[k] = w[k] / tot;
  return out;
}
export function previewMix(items) {
  const f = RECIPE_INDEX[recipeKey(items)];
  return f !== undefined ? { exato: true, fam: f } : { exato: false, chances: rarityChances(items) };
}
export function mix(items) {
  if (!items.length || items.length > nestSlots()) return null;
  const need = {}; for (const id of items) need[id] = (need[id] || 0) + 1;
  for (const id in need) if (!has(id, need[id])) return null;
  for (const id in need) useItem(id, need[id]);
  let famId = RECIPE_INDEX[recipeKey(items)];
  const exato = famId !== undefined;
  if (!exato) famId = rollFamily(items);
  const shiny = rnd() < (items.includes('runa') ? 1 / 18 : 1 / 40);
  const res = createAmigo(famId * 3, shiny);
  if (S.tutorial < 2) S.tutorial = 2;
  save();
  return { ...res, exato, fam: FAMILIES[famId] };
}
function rollFamily(items) {
  const rar = weighted(Object.entries(rarityChances(items)));
  const elW = {};
  for (const id of items) { const it = ITEMS[id]; if (it.el) elW[it.el] = (elW[it.el] || 0) + RARITIES[it.rar].pontos; }
  const el = Object.keys(elW).length ? weighted(Object.entries(elW)) : pick(openElements());
  for (let i = RARITY_ORDER.indexOf(rar); i >= 0; i--) {
    const c = FAMILIES.filter((f) => f.el === el && f.rar === RARITY_ORDER[i] && !f.fusao);
    if (c.length) return pick(c).id;
  }
  return pick(FAMILIES.filter((f) => f.el === el && !f.fusao)).id;
}
const openElements = () => REGIONS.filter((r) => S.regioes[r.id].aberta).map((r) => r.el);

// ---------- códice ----------
export const discoveredCount = () => Object.keys(S.descobertos).length;
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

// ---------- fazendinhas: recursos que renascem ----------
const BIOME = { planta: [3, 1], agua: [2, 1], fogo: [0, 3], vento: [1, 2], gelo: [1, 2], pedra: [0, 4], eletrico: [1, 3], cosmo: [0, 3] };
export const TREE_RESPAWN = 90000, ROCK_RESPAWN = 120000, GROW_TIME = 60000;
export function nodeCounts(rid) {
  const reg = REGIONS.find((r) => r.id === rid); const lvl = S.regioes[rid].fazenda; const [a0, r0] = BIOME[reg.el];
  return { arv: a0 ? a0 + lvl - 1 : 0, roc: r0 + Math.floor((lvl - 1) / 2), cant: 1 + lvl + (rid === BASE_REGION ? S.base.canteiros * 2 : 0) };
}
export function ensureNodes(rid) {
  const g = S.regioes[rid]; if (!g) return;
  g.arv ||= []; g.roc ||= []; g.cant ||= [];
  const n = nodeCounts(rid);
  while (g.arv.length < n.arv) g.arv.push({ livre: 0, por: 0 });
  while (g.roc.length < n.roc) g.roc.push({ livre: 0, por: 0 });
  while (g.cant.length < n.cant) g.cant.push({ st: 'vazio', ate: 0, por: 0 });
}
export const farmSlots = (rid) => S.regioes[rid].fazenda + 1 + S.base.casinha;
export const amigosEm = (rid) => S.amigos.filter((a) => a.local === rid);
export function placeAmigo(a, rid) {
  if (rid && rid !== a.local && amigosEm(rid).length >= farmSlots(rid)) return false;
  releaseTask(a); a.local = rid; a.task = null; save(); return true;
}
function releaseTask(a) {
  const t = a.task; if (!t || !a.local) return;
  const g = S.regioes[a.local]; const node = t.tipo === 'cortar' ? g.arv[t.alvo] : t.tipo === 'minerar' ? g.roc[t.alvo] : ['semear', 'regar', 'colher'].includes(t.tipo) ? g.cant[t.alvo] : null;
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
const BASE_DUR = { semear: 10000, regar: 8000, colher: 6000, fundir: 18000, cortar: 16000, minerar: 18000, explorar: 28000 };
const TASK_SKILL = { semear: 'semear', regar: 'regar', colher: 'coletar', fundir: 'acender', cortar: 'cortar', minerar: 'minerar' };
export const TASK_INFO = {
  semear: { nome: 'Semeando', icone: '🌱' }, regar: { nome: 'Regando', icone: '💦' }, colher: { nome: 'Colhendo', icone: '🧺' },
  fundir: { nome: 'Fundindo no forno', icone: '🔥' }, cortar: { nome: 'Cortando árvore', icone: '🪓' }, minerar: { nome: 'Minerando', icone: '⛏️' },
  explorar: { nome: 'Explorando a região', icone: '🔎' }, cheio: { nome: 'Bolsa cheia — toque para pegar!', icone: '🎒' },
};
function taskDur(a, tipo, rid) {
  let d = BASE_DUR[tipo];
  const sk = TASK_SKILL[tipo];
  if (sk) d /= 1 + 0.3 * (skillLevel(a, sk) - 1);
  else {
    const reg = REGIONS.find((r) => r.id === rid); const el = SPECIES[a.sp].el;
    if (el === reg.el) d *= 0.5; else if (el === 'trovao') d *= 0.6;
    d *= 1 - Math.min(a.nivel, 20) * 0.01;
  }
  return d * speedMul(rid);
}
function pickTask(a, rid, t) {
  const g = S.regioes[rid];
  const can = (sk) => skillLevel(a, sk) > 0;
  const freeIdx = (arr, ok) => arr.findIndex((n) => !n.por && ok(n));
  const opts = [];
  if (can('semear')) { const i = freeIdx(g.cant, (n) => n.st === 'vazio'); if (i >= 0) opts.push(['semear', i]); }
  if (can('regar')) { const i = freeIdx(g.cant, (n) => n.st === 'semeado'); if (i >= 0) opts.push(['regar', i]); }
  if (can('coletar')) { const i = freeIdx(g.cant, (n) => n.st === 'pronto'); if (i >= 0) opts.push(['colher', i]); }
  if (can('acender') && rid === BASE_REGION && S.base.forno && S.base.fila > 0) opts.push(['fundir', -1]);
  if (can('cortar')) { const i = freeIdx(g.arv, (n) => n.livre <= t); if (i >= 0) opts.push(['cortar', i]); }
  if (can('minerar')) { const i = freeIdx(g.roc, (n) => n.livre <= t); if (i >= 0) opts.push(['minerar', i]); }
  const [tipo, alvo] = opts[0] || ['explorar', -1];
  if (tipo === 'fundir') S.base.fila--;
  const node = tipo === 'cortar' ? g.arv[alvo] : tipo === 'minerar' ? g.roc[alvo] : ['semear', 'regar', 'colher'].includes(tipo) ? g.cant[alvo] : null;
  if (node) node.por = a.uid;
  return { tipo, alvo, ini: t, fim: t + taskDur(a, tipo, rid) };
}
const yieldCount = (a) => { const y = yieldOf(a.sp); return Math.floor(y) + (rnd() < y % 1 ? 1 : 0); };
function bagPush(a, item, n) { for (let i = 0; i < n && a.bolsa.length < bagCap(a); i++) a.bolsa.push(item); }
function regionDrop(rid, a) {
  const reg = REGIONS.find((r) => r.id === rid); const lvl = S.regioes[rid].fazenda;
  const match = SPECIES[a.sp].el === reg.el || SPECIES[a.sp].el === 'trovao';
  const enc = skillLevel(a, 'encantar'); const I = EL_ITEMS[reg.el];
  const table = [[I.comum, 70], [I.incomum, 22 + lvl * 2 + enc * 4], [I.raro, (5 + lvl * 1.5 + enc * 3) * (match ? 1.7 : 1)], ['orvalho', 14]];
  if (lvl >= 3 || enc >= 3) table.push(['runa', 0.6 + Math.max(0, lvl - 3) * 0.4 + enc * 0.3]);
  return weighted(table);
}
function completeTask(a, rid) {
  const t = a.task; const g = S.regioes[rid];
  const n = yieldCount(a);
  switch (t.tipo) {
    case 'semear': g.cant[t.alvo].st = 'semeado'; break;
    case 'regar': Object.assign(g.cant[t.alvo], { st: 'regado', ate: t.fim + GROW_TIME }); break;
    case 'colher': g.cant[t.alvo].st = 'vazio'; bagPush(a, 'fruta', n + frostBonus(rid)); break;
    case 'fundir': bagPush(a, 'barra', 1 + (n >= 3 ? 1 : 0)); break;
    case 'cortar': g.arv[t.alvo].livre = t.fim + TREE_RESPAWN; bagPush(a, 'madeira', n + 1); break;
    case 'minerar': {
      g.roc[t.alvo].livre = t.fim + ROCK_RESPAWN; bagPush(a, 'ferro', n);
      if (rnd() < 0.4) bagPush(a, 'seixo', 1);
      if (rnd() < 0.06 + skillLevel(a, 'minerar') * 0.02) bagPush(a, 'gema', 1);
      break; }
    case 'explorar': for (let i = 0; i < n; i++) bagPush(a, regionDrop(rid, a), 1); break;
  }
  const node = t.tipo === 'cortar' ? g.arv[t.alvo] : t.tipo === 'minerar' ? g.roc[t.alvo] : ['semear', 'regar', 'colher'].includes(t.tipo) ? g.cant[t.alvo] : null;
  if (node) node.por = 0;
  amigoAddXp(a, 2);
  a.task = null;
}
const frostBonus = (rid) => (amigosEm(rid).some((x) => skillLevel(x, 'congelar') > 0) ? 1 : 0);
// avança tudo (também o tempo em que o jogo ficou fechado)
export function tick(t = now()) {
  let changed = false;
  for (const r of REGIONS) {
    const g = S.regioes[r.id]; if (!g.aberta) continue;
    for (const c of g.cant) if (c.st === 'regado' && t >= c.ate) { c.st = 'pronto'; changed = true; }
    while (g.brilhos < 3 && t - g.brilhoDesde >= 30000) { g.brilhos++; g.brilhoDesde += 30000; changed = true; }
    if (g.brilhos >= 3) g.brilhoDesde = t;
  }
  for (const a of S.amigos) {
    if (!a.local) continue;
    a.bolsa ||= [];
    if (busy(a, t)) continue;
    for (let guard = 0; guard < 400; guard++) {
      if (a.task && t >= a.task.fim) {
        const fim = a.task.fim; completeTask(a, a.local); changed = true;
        // plantas que ficaram prontas durante o tempo simulado
        for (const c of S.regioes[a.local].cant) if (c.st === 'regado' && fim >= c.ate) c.st = 'pronto';
        if (a.bolsa.length >= bagCap(a)) break;
        a.task = pickTask(a, a.local, fim);
        continue;
      }
      if (!a.task && a.bolsa.length < bagCap(a)) { a.task = pickTask(a, a.local, t); changed = true; }
      break;
    }
  }
  if (S.fusao && S.fusao.ate <= t && !S.fusao.pronta) { S.fusao.pronta = true; changed = true; }
  if (changed) save();
  return changed;
}
export const taskOf = (a) => (a.bolsa?.length >= bagCap(a) ? 'cheio' : a.task?.tipo || null);
// pega tudo o que está na bolsa do companheiro
export function collect(a) {
  if (!a.bolsa?.length) return [];
  const got = a.bolsa.splice(0);
  for (const it of got) { addItem(it); if (it === 'fruta') S.stats.frutas++; }
  if (S.stats.frutas >= 20) achieve('fazendeiro');
  S.moedas += got.length; S.stats.coletas += got.length; addXp(got.length);
  tick(); save(); return got;
}
// o jogador colhe com a mão (semear e regar só os companheiros fazem)
export function harvestPlot(rid, i) {
  const c = S.regioes[rid].cant[i]; if (!c || c.st !== 'pronto' || c.por) return 0;
  c.st = 'vazio'; const n = 1 + frostBonus(rid); addItem('fruta', n); S.stats.frutas += n; if (S.stats.frutas >= 20) achieve('fazendeiro');
  addXp(1); save(); return n;
}
export function collectSparkle(rid) {
  const g = S.regioes[rid]; if (g.brilhos <= 0) return null;
  if (g.brilhos === 3) g.brilhoDesde = now();
  g.brilhos--; const reg = REGIONS.find((r) => r.id === rid);
  const item = weighted([[EL_ITEMS[reg.el].comum, 75], [EL_ITEMS[reg.el].incomum, 18], ['orvalho', 22], [EL_ITEMS[reg.el].raro, 2]]);
  addItem(item); save(); return item;
}
export function expandCost(rid) {
  const lvl = S.regioes[rid].fazenda; if (lvl >= 5) return null;
  const idx = REGIONS.findIndex((r) => r.id === rid); const I = EL_ITEMS[REGIONS[idx].el];
  const itens = { [I.comum]: 3 * lvl }; if (lvl >= 2) itens[I.incomum] = lvl - 1; if (lvl >= 3) itens.madeira = 4 * lvl; if (lvl >= 4) itens[I.raro] = 1;
  return { moedas: Math.round(15 * lvl * lvl * (1 + idx * 0.6)), itens };
}
export function canPay(c) {
  if (S.moedas < (c.moedas || 0)) return false;
  for (const [id, n] of Object.entries(c.itens || {})) if (!has(id, n)) return false;
  return true;
}
function pay(c) { S.moedas -= c.moedas || 0; for (const [id, n] of Object.entries(c.itens || {})) useItem(id, n); }
export function expand(rid) {
  const c = expandCost(rid); if (!c || !canPay(c)) return false;
  pay(c); S.regioes[rid].fazenda++; ensureNodes(rid); addXp(8); save(); return true;
}

// ---------- base: construções, fabricação e forno ----------
export function buildState(id) {
  const b = BUILDINGS[id]; const cur = S.base[id];
  const done = b.max ? cur >= b.max : !!cur;
  const locked = b.precisa && !S.base[b.precisa];
  return { done, locked, ok: !done && !locked && canPay({ itens: b.custo }), count: typeof cur === 'number' ? cur : cur ? 1 : 0 };
}
export function build(id) {
  const st = buildState(id); if (!st.ok) return false;
  pay({ itens: BUILDINGS[id].custo });
  if (BUILDINGS[id].max) S.base[id]++; else S.base[id] = true;
  if (id === 'bancada') achieve('construtor');
  ensureNodes(BASE_REGION); addXp(12); save(); return true;
}
export function craft(id) {
  const c = CRAFTS.find((x) => x.id === id); if (!S.base.bancada || !canPay({ itens: c.custo })) return false;
  pay({ itens: c.custo }); addItem(c.dá, c.qtd || 1); addXp(3); save(); return true;
}
export function addToForno(n) { n = Math.min(n, S.itens.ferro || 0); if (!S.base.forno || n <= 0) return 0; useItem('ferro', n); S.base.fila += n; save(); return n; }
export const BASE_REGION_ID = BASE_REGION;

// ---------- pontes rúnicas e resgates ----------
export function bridgeState(rid) {
  const i = REGIONS.findIndex((r) => r.id === rid); const reg = REGIONS[i];
  if (S.regioes[rid].aberta) return { aberta: true };
  const prev = REGIONS[i - 1]; const p = reg.ponte; const prevSalvo = S.regioes[prev.id].salvo;
  return { aberta: false, prev, prevSalvo, ok: prevSalvo && canPay(p) && S.amigos.length >= p.amigos, ponte: p };
}
export function openBridge(rid) {
  const b = bridgeState(rid); if (b.aberta || !b.ok) return false;
  pay(b.ponte); S.regioes[rid].aberta = true; S.regioes[rid].brilhos = 3; S.regioes[rid].brilhoDesde = now(); ensureNodes(rid);
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
  for (let i = 0; i < 3 + Math.min(d.serie, 5); i++) { const r = pick(open); const it = EL_ITEMS[r.el][weighted([['comum', 75], ['incomum', 22], ['raro', 3]])]; itens[it] = (itens[it] || 0) + 1; }
  if (d.serie % 7 === 0) itens.runa = 1;
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
    const pool = (tg) => FAMILIES.filter((x) => x.el === el && !x.fusao && RARITY_ORDER.indexOf(x.rar) === tg);
    while (target > 0 && !pool(target).length) target--;
    const p = pool(target); famId = p.length ? pick(p).id : pick(FAMILIES.filter((x) => x.el === el && !x.fusao)).id;
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
