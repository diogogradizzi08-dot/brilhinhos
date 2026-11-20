// Brilhinhos — as telas: Mapa, Forja do Trovão, Fazendinha, Equipe, Códice e Pedidos.
import * as G from './game.js';
import { ITEMS, RARITIES, RARITY_ORDER, ELEMENTS, ELEMENT_ORDER, FAMILIES, SPECIES, REGIONS, ACHIEVEMENTS, EVOLVE_AT, EVOLVE_COST, GROW_ITEM, EL_ITEMS, GUIDE_SPECIES, SKILLS, skillsOf, yieldOf, BUILDINGS, CRAFTS, SKILL_COUNT } from './data.js';
import { initStage, setScene, nestScene, farmScene, showcaseScene, thumb, rayAt, toScreen } from './stage3d.js';
import { play, setMusic, setSfx, unlockAudio } from './audio.js';

// ---------- utilidades de tela ----------
const $ = (s, el = document) => el.querySelector(s);
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
const S = () => G.S;
const rarColor = (r) => RARITIES[r].cor;
const stars = (r) => '★'.repeat(RARITIES[r].estrelas);
const rarBadge = (r) => h('span', { class: 'rar-badge' + (r === 'mitico' ? ' rar-mitico' : ''), style: `background:${rarColor(r)}` }, RARITIES[r].nome);
const elChip = (el) => h('span', { class: 'chip' }, ELEMENTS[el].icone, ' ', ELEMENTS[el].nome);
const itemRing = (id) => rarColor(ITEMS[id].rar);
const regionOf = (el) => REGIONS.find((r) => r.el === el);
const fmtTime = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)}min ${s % 60}s` : `${s}s`; };

function token(id, n, onClick, cls = '') {
  return h('button', { class: 'token ' + cls, style: `--rc:${itemRing(id)}`, title: ITEMS[id].nome, onclick: onClick }, ITEMS[id].emoji, n != null ? h('span', { class: 'n' }, String(n)) : null);
}
function monCard(a, onClick, extra = {}) {
  const s = SPECIES[a.sp];
  const loc = a.local ? '🏡' : '';
  return h('button', { class: 'mon', style: `--rc:${rarColor(s.rar)};--bg:${ELEMENTS[s.el].cores[1]}`, onclick: onClick },
    h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 160 }), alt: '' }),
    h('div', { class: 'nm' }, G.nomeDe(a)),
    h('div', { class: 'sub' }, `Nv ${a.nivel} · ${s.estagio}`, a.shiny ? ' ✨' : ''),
    skillChips(a.sp, true),
    loc || G.busy(a) ? h('span', { class: 'corner' }, G.busy(a) ? '⏳' : loc) : null,
    extra.tag ? h('span', { class: 'corner2' }, extra.tag) : null);
}

// ---------- janelas (uma de cada vez, em fila) ----------
const modalQueue = []; let modalOpen = false;
function modal(build, opts = {}) {
  modalQueue.push({ build, opts }); if (!modalOpen) nextModal();
}
function nextModal() {
  const m = modalQueue.shift(); if (!m) { modalOpen = false; updateGuide(); return; }
  modalOpen = true;
  const close = () => { bg.remove(); m.opts.onClose?.(); nextModal(); };
  const box = h('div', { class: 'modal' });
  const bg = h('div', { class: 'modal-bg', onclick: (e) => { if (e.target === bg && !m.opts.locked) { play('tap'); close(); } } }, box);
  m.build(box, close);
  $('#modal-root').append(bg);
}
function toast(text, x, y) {
  const el = h('div', { class: 'floattxt', style: `left:${x - 40}px;top:${y - 20}px` }, text);
  $('#fx').append(el); setTimeout(() => el.remove(), 1200);
}
function fly(emoji, x, y, target = '#hud-bag') {
  const t = $(target).getBoundingClientRect();
  const el = h('div', { class: 'fly', style: `left:${x - 20}px;top:${y - 20}px` }, emoji);
  $('#fx').append(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${t.left + t.width / 2 - x}px, ${t.top + t.height / 2 - y}px) scale(.5)`; el.style.opacity = '0.3'; }));
  setTimeout(() => { el.remove(); $(target).animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 250 }); }, 720);
}

// ---------- barra de cima ----------
function updateHud() {
  const s = S();
  $('#hud-lvl').textContent = s.nivel;
  $('#hud-xp').style.width = Math.min(100, (s.xp / G.playerXpNeed()) * 100) + '%';
  $('#hud-coins').textContent = s.moedas;
  $('#hud-grow').textContent = s.brilho;
  $('#hud-gift').hidden = !s.diario.pendente;
  $('#nav [data-go=pedidos] .dot').hidden = !s.pedidos.some((o) => G.orderReady(o));
}
function flushNotices() {
  for (const n of G.takeNotices()) {
    if (n.tipo === 'nivel') modal((box, close) => { play('fanfare'); box.append(h('div', { class: 'big' }, '🎉'), h('h2', {}, `Nível ${n.nivel}!`), h('p', {}, 'Você está ficando um grande mestre da forja!'), h('p', { class: 'muted' }, n.premio), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Oba!'))); });
    if (n.tipo === 'conquista') modal((box, close) => { play('fanfare'); box.append(h('div', { class: 'big' }, n.a.icone), h('h2', {}, 'Medalha nova!'), h('p', {}, h('b', {}, n.a.nome)), h('p', { class: 'muted' }, n.a.desc + ' · +10 🪙'), h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: close }, 'Uhuu!'))); });
    if (n.tipo === 'codice') modal((box, close) => { play('hatch', 3); box.append(h('div', { class: 'big' }, '📖'), h('h2', {}, `${n.meta} espécies no Códice!`), h('p', {}, 'Presente da coleção: ', h('b', {}, n.premio)), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Que legal!'))); });
  }
  updateHud();
}

// ---------- navegação ----------
let screen = '', farmRid = 'floresta', cleanup = null;
const NO3D = new Set(['mapa', 'codice', 'amigos', 'pedidos']);

function go(name, arg) {
  if (cleanup) { cleanup(); cleanup = null; }
  $('#sky').style.background = name === 'ninho' ? 'linear-gradient(180deg, #0e1228 0%, #2b2a52 55%, #6a3a3a 100%)' : name === 'perfil' ? 'radial-gradient(circle at 50% 40%, #3d5a8f, #141c38)' : '';
  screen = name;
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === name || (name === 'perfil' && b.dataset.go === 'amigos')));
  document.body.classList.toggle('no3d', NO3D.has(name));
  if (NO3D.has(name)) setScene(null);
  const sc = $('#screen'); sc.innerHTML = '';
  ({ mapa: renderMapa, ninho: renderNinho, fazenda: renderFazenda, amigos: renderAmigos, codice: renderCodice, pedidos: renderPedidos, perfil: renderPerfil })[name](sc, arg);
  updateHud(); updateGuide();
}

// =========================== MAPA ===========================
function renderMapa(sc) {
  sc.append(h('div', { class: 'title' }, '🗺️ Vale das Feras', h('small', {}, 'toque numa região')));
  const grid = h('div', { class: 'map' });
  REGIONS.forEach((r, i) => {
    const g = S().regioes[r.id];
    const fam = FAMILIES.find((f) => f.el === r.el);
    const card = h('button', { class: 'region' + (g.aberta ? '' : ' locked'), style: `background:linear-gradient(160deg, ${r.ceu[0]}, ${r.chao})` },
      h('div', { class: 'rname' }, `${ELEMENTS[r.el].icone} ${r.nome}`),
      h('img', { class: 'mascot', src: thumb(fam.id * 3, { size: 200 }), alt: '' }));
    const info = h('div', { class: 'info' });
    if (g.aberta) {
      info.append(h('span', { class: 'chip' }, `🏡 Fazendinha nível ${g.fazenda}`), h('span', { class: 'chip' }, `🐾 ${G.amigosEm(r.id).length}/${G.farmSlots(r.id)} companheiros`));
      info.append(g.salvo ? h('span', { class: 'badge-ok' }, `✓ ${r.resgate.quem} salv${r.resgate.g}`) : h('span', { class: 'badge-help' }, `Socorro! ${r.resgate.quem}`));
      card.onclick = () => { play('tap'); farmRid = r.id; go('fazenda'); };
    } else {
      const b = G.bridgeState(r.id);
      info.append(h('span', { class: 'lockico' }, '🔒'), h('span', { class: 'chip' }, b.ok ? '✨ Pronta para abrir!' : 'Ponte rúnica quebrada'));
      card.onclick = () => { play('tap'); bridgeModal(r); };
      if (b.ok) card.classList.add('pointing');
    }
    card.append(info); grid.append(card);
  });
  sc.append(h('div', { class: 'scroll grow' }, grid));
}
function reqRow(ok, ...txt) { return h('div', { class: 'r ' + (ok ? 'ok' : 'no') }, ok ? '✅' : '⬜', ...txt); }
function bridgeModal(r) {
  modal((box, close) => {
    const b = G.bridgeState(r.id); const p = b.ponte; const s = S();
    box.append(h('div', { class: 'big' }, '🌉'), h('h2', {}, `Ponte para ${r.nome}`), h('p', {}, 'Para consertar a ponte de pedras rúnicas, precisamos de:'));
    const req = h('div', { class: 'req' },
      reqRow(b.prevSalvo, `Salvar ${b.prev.resgate.quem} (${b.prev.nome})`),
      reqRow(s.amigos.length >= p.amigos, `🐾 ${s.amigos.length}/${p.amigos} companheiros`),
      reqRow(s.moedas >= p.moedas, `🪙 ${s.moedas}/${p.moedas}`),
      ...Object.entries(p.itens).map(([id, n]) => reqRow(G.has(id, n), `${ITEMS[id].emoji} ${s.itens[id] || 0}/${n} ${ITEMS[id].nome}`)));
    box.append(req, h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: close }, 'Depois'),
      h('button', { class: 'btn green', disabled: !b.ok, onclick: () => {
        if (!G.openBridge(r.id)) return; play('fanfare'); close();
        modal((bx, cl) => { bx.append(h('div', { class: 'big' }, '🌉⚡'), h('h2', {}, 'Ponte consertada!'), h('p', {}, `Agora você pode visitar ${r.nome}! Lá tem itens novos e alguém precisando de ajuda.`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { cl(); farmRid = r.id; go('fazenda'); } }, 'Vamos lá!'))); });
        flushNotices(); if (screen === 'mapa') go('mapa');
      } }, 'Consertar!')));
  });
}

// =========================== NINHO ===========================
function renderNinho(sc, arg) {
  const nest = nestScene(); setScene(nest);
  let chosen = [], phase = 'pick', stirP = 0, eggTaps = 0, result = null;
  const top = h('div', { class: 'nest-top' });
  const bottom = h('div', { class: 'nest-bottom' });
  sc.append(top, h('div', { class: 'grow passthru' }), bottom);

  function counts() { const c = {}; for (const id of chosen) c[id] = (c[id] || 0) + 1; return c; }
  function draw() {
    top.innerHTML = ''; bottom.innerHTML = ''; updateGuide();
    if (phase === 'pick') {
      top.append(h('div', { class: 'nest-hint' }, chosen.length ? 'Coloque até ' + G.nestSlots() + ' itens e toque em Forjar!' : 'Toque nos itens para colocar na bigorna da Forja'));
      const slots = h('div', { class: 'slots' });
      for (let i = 0; i < G.nestSlots(); i++) {
        const id = chosen[i];
        slots.append(h('button', { class: 'slot' + (id ? ' full' : ''), style: id ? `--rc:${itemRing(id)}` : '', onclick: () => { if (!id) return; play('pop'); chosen.splice(i, 1); draw(); } }, id ? ITEMS[id].emoji : ''));
      }
      top.append(slots);
      if (chosen.length) top.append(previewEl());
      const c = counts();
      const ids = Object.keys(ITEMS).filter((id) => (S().itens[id] || 0) > 0)
        .sort((a, b) => (ELEMENT_ORDER.indexOf(ITEMS[a].el) - ELEMENT_ORDER.indexOf(ITEMS[b].el)) || (RARITY_ORDER.indexOf(ITEMS[a].rar) - RARITY_ORDER.indexOf(ITEMS[b].rar)));
      const tray = h('div', { class: 'tray' });
      if (!ids.length) tray.append(h('div', { class: 'muted', style: 'padding:14px;font-size:19px' }, 'Sua mochila está vazia. Colha itens na Fazendinha! 🏡'));
      for (const id of ids) {
        const left = S().itens[id] - (c[id] || 0);
        const t = token(id, left, () => {
          if (left <= 0 || chosen.length >= G.nestSlots()) { play('sad'); return; }
          chosen.push(id); play('drop'); nest.dropItem(ITEMS[id].emoji, itemRing(id)); setTimeout(() => play('splash'), 330); draw();
        }, left <= 0 ? 'off' : '');
        if (S().tutorial < 2 && id === 'trevo' && chosen.length < 2) t.classList.add('pointing');
        tray.append(t);
      }
      const mixBtn = h('button', { class: 'btn', disabled: !chosen.length, onclick: startStir }, '🔨 Forjar!');
      if (S().tutorial < 2 && chosen.filter((x) => x === 'trevo').length >= 2) mixBtn.classList.add('pointing');
      bottom.append(h('div', { class: 'row' }, chosen.length ? h('button', { class: 'btn ghost small', onclick: () => { chosen = []; play('pop'); draw(); } }, 'Limpar') : null, mixBtn), tray);
    } else if (phase === 'stir') {
      top.append(h('div', { class: 'nest-hint' }, `🔨 Bata o martelo na bigorna! Toque ${HITS} vezes`));
      const bar = h('div', { class: 'progress' }, h('i', { style: `width:${stirP * 100}%` }));
      bottom.append(bar);
    } else if (phase === 'egg') {
      top.append(h('div', { class: 'nest-hint' }, eggTaps ? `Mais ${3 - eggTaps}!` : '💎 Toque no cristal para quebrar!'));
    } else if (phase === 'reveal') {
      top.append(h('div'));
      bottom.append(revealCard(result));
    }
  }
  function previewEl() {
    const p = G.previewMix(chosen);
    if (p.exato) {
      const f = FAMILIES[p.fam]; const known = S().descobertos[f.id * 3];
      return h('div', { class: 'chance' }, '💡', known ? `Receita do ${f.nomes[0]}!` : 'Combinação perfeita! Vai sair um companheiro de receita!');
    }
    const ch = p.chances; const good = (ch.raro + ch.epico + ch.lendario) * 100;
    const bar = h('div', { class: 'row', style: 'gap:2px;width:160px' }, ...['comum', 'incomum', 'raro', 'epico', 'lendario'].map((r) => h('i', { style: `width:${Math.max(ch[r] * 100, ch[r] > 0.001 ? 3 : 0)}%;background:${rarColor(r)}` })));
    return h('div', { class: 'chance' }, '⚡ Energia:', bar, h('b', {}, good < 5 ? 'fraca' : good < 15 ? 'boa' : good < 30 ? 'forte' : 'máxima!'));
  }
  // --- martelar na bigorna ---
  let zone = null; const HITS = 6;
  function startStir() {
    if (!chosen.length) return;
    phase = 'stir'; stirP = 0; play('tap'); draw();
    zone = h('div', { class: 'stirzone' }, h('div', { class: 'stir-hand' }, '🔨'));
    document.body.append(zone);
    let busy = false, hits = 0;
    nest.onHit = () => {
      hits++; stirP = hits / HITS; nest.setStir(0.3 + stirP * 0.7); play('anvil', hits); const bar = $('.progress i', bottom); if (bar) bar.style.width = stirP * 100 + '%';
      if (navigator.vibrate) try { navigator.vibrate(30); } catch {}
      if (hits >= HITS) setTimeout(finishStir, 250);
    };
    zone.onpointerdown = () => { if (busy || phase !== 'stir') return; busy = true; nest.strike(); setTimeout(() => { busy = false; }, 380); };
  }
  function finishStir() {
    if (phase !== 'stir') return;
    zone?.remove(); zone = null; nest.onHit = null;
    result = G.mix(chosen); chosen = [];
    if (!result) { phase = 'pick'; draw(); return; }
    play('thunder'); toEgg();
  }
  function toEgg() {
    const s = SPECIES[result.amigo.sp];
    phase = 'egg'; eggTaps = 0; nest.showEgg(s.el, s.rar); play('hatch', 1); draw();
    nest.onTap = (r) => {
      if (phase !== 'egg') return;
      eggTaps++; nest.tapEgg(); play('wobble');
      if (eggTaps >= 3) {
        const lvl = RARITIES[s.rar].estrelas;
        nest.reveal(result.amigo.sp, result.amigo.shiny, s.rar); play('thunder'); play('hatch', lvl);
        phase = 'reveal'; draw();
        nest.onTap = (rr) => { if (nest.scene) { play('heart'); } };
        setTimeout(flushNotices, 900);
      } else draw();
    };
  }
  function revealCard(res) {
    const a = res.amigo; const s = SPECIES[a.sp];
    const card = h('div', { class: 'card reveal' },
      h('div', { class: 'row wrap', style: 'justify-content:center' }, res.novo ? h('span', { class: 'tag-new' }, 'NOVO!') : null, rarBadge(s.rar), h('span', { class: 'stars', style: 'font-size:24px' }, stars(s.rar)), a.shiny ? h('span', { class: 'chip' }, '✨ Cintilante!') : null),
      h('div', { class: 'name' }, G.nomeDe(a)),
      h('div', { class: 'row wrap', style: 'justify-content:center' }, elChip(s.el), h('span', { class: 'chip' }, '⚡ ', ELEMENTS[s.el].dom)),
      res.novo && !res.exato && res.fam.receita ? h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Descoberta! A receita dele agora está no Códice 📖') : null,
      h('div', { class: 'row wrap', style: 'justify-content:center;margin-top:10px' },
        h('button', { class: 'btn ghost small', onclick: () => renameModal(a, () => draw()) }, '✏️ Dar nome'),
        h('button', { class: 'btn green small', onclick: () => placeModal(a, (rid) => { farmRid = rid; go('fazenda'); }) }, '🏡 Mandar para a fazendinha'),
        h('button', { class: 'btn small', onclick: () => { nest.clearCreature(); phase = 'pick'; draw(); } }, '🔨 Forjar outro')));
    return card;
  }
  if (arg?.fusao) { result = G.hatchFusao(); if (result) toEgg(); else draw(); }
  else draw();
  cleanup = () => { zone?.remove(); nest.clearItems(); };
}

function renameModal(a, done) {
  modal((box, close) => {
    const inp = h('input', { class: 'namebox', maxlength: 14, value: G.nomeDe(a) });
    box.append(h('h2', {}, '✏️ Qual vai ser o nome?'), h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 160 }), style: 'width:140px' }), inp,
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: () => { a.apelido = ''; G.save(); close(); done?.(); } }, 'Nome original'),
        h('button', { class: 'btn', onclick: () => { a.apelido = inp.value.trim().slice(0, 14); if (a.apelido === SPECIES[a.sp].nome) a.apelido = ''; G.save(); play('heart'); close(); done?.(); } }, 'Pronto!')));
    setTimeout(() => inp.focus(), 100);
  });
}
// escolher fazendinha para um amigo
function placeModal(a, done) {
  modal((box, close) => {
    const s = SPECIES[a.sp];
    box.append(h('h2', {}, `Para onde vai ${G.nomeDe(a)}?`), h('p', { class: 'muted' }, 'Na região do mesmo elemento ele trabalha 2× mais rápido ⚡'));
    const list = h('div', { class: 'req', style: 'flex-direction:column' });
    for (const r of REGIONS) {
      const g = S().regioes[r.id]; if (!g.aberta) continue;
      const n = G.amigosEm(r.id).length, cap = G.farmSlots(r.id); const here = a.local === r.id;
      const match = r.el === s.el || s.el === 'trovao';
      list.append(h('button', { class: 'btn ' + (match ? 'gold' : 'ghost'), disabled: !here && n >= cap, onclick: () => {
        if (here) { close(); done?.(r.id); return; }
        if (G.placeAmigo(a, r.id)) { play('collect'); if (S().tutorial < 3) S().tutorial = 3; close(); done?.(r.id); }
      } }, `${ELEMENTS[r.el].icone} ${r.nome} (${n}/${cap})`, match ? ' ⚡' : '', here ? ' ✓' : ''));
    }
    if (a.local) list.append(h('button', { class: 'btn ghost small', onclick: () => { G.placeAmigo(a, null); close(); done?.(null); } }, '🏠 Tirar da fazendinha (descansar)'));
    box.append(list);
  });
}

// =========================== FAZENDINHA ===========================
const skillChips = (spId, small) => h('span', { class: 'skills' + (small ? ' small' : '') }, ...skillsOf(spId).map((k) => h('span', { class: 'sk', title: `${SKILLS[k.id].nome} nível ${k.nivel}` }, SKILLS[k.id].icone, h('b', {}, k.nivel))));
function nodesView(rid) {
  const g = S().regioes[rid]; const t = Date.now();
  return {
    arv: g.arv.map((n) => ({ vivo: n.livre <= t })), roc: g.roc.map((n) => ({ vivo: n.livre <= t })),
    cant: g.cant.map((n) => ({ st: n.st, grow: n.st === 'regado' ? Math.min(1, 1 - (n.ate - t) / G.GROW_TIME) : 0 })),
  };
}
function renderFazenda(sc) {
  if (!S().regioes[farmRid]?.aberta) farmRid = 'floresta';
  const r = REGIONS.find((x) => x.id === farmRid); const g = S().regioes[r.id];
  const isBase = r.id === G.BASE_REGION_ID;
  const amigos = G.amigosEm(r.id);
  $('#sky').style.background = `linear-gradient(180deg, ${r.ceu[0]} 0%, ${r.ceu[1]} 70%)`;
  const bagEmoji = (a) => (a.bolsa?.length ? ITEMS[a.bolsa[a.bolsa.length - 1]]?.emoji : '🎁');
  const farm = farmScene(r, { nivel: g.fazenda, amigos: amigos.map((a) => ({ uid: a.uid, spId: a.sp, shiny: a.shiny, bolsa: a.bolsa?.length || 0, emoji: bagEmoji(a) })), brilhos: g.brilhos, resgate: { salvo: g.salvo }, nodes: nodesView(r.id), base: isBase ? S().base : null });
  setScene(farm);
  const chips = h('div', { class: 'farm-top' });
  for (const rr of REGIONS) {
    if (!S().regioes[rr.id].aberta) continue;
    const ready = G.amigosEm(rr.id).some((a) => a.bolsa?.length);
    chips.append(h('button', { class: 'farm-chip' + (rr.id === r.id ? ' on' : ''), onclick: () => { play('tap'); farmRid = rr.id; go('fazenda'); } }, ELEMENTS[rr.el].icone, rr.nome, rr.id === G.BASE_REGION_ID ? ' 🛠️' : '', ready && rr.id !== r.id ? h('i', { class: 'dot' }) : null));
  }
  const info = h('div', { class: 'farm-info' });
  const workers = h('div', { class: 'workers' });
  const actions = h('div', { class: 'farm-actions' });
  sc.append(chips, info, h('div', { class: 'grow passthru' }, workers), actions);
  function drawUi() {
    info.innerHTML = ''; actions.innerHTML = ''; workers.innerHTML = '';
    const am = G.amigosEm(r.id); const ready = am.reduce((t, a) => t + (a.bolsa?.length || 0), 0);
    const nv = nodesView(r.id);
    info.append(h('span', { class: 'chip' }, `🏡 Nível ${g.fazenda}`), h('span', { class: 'chip' }, `🐾 ${am.length}/${G.farmSlots(r.id)}`),
      nv.arv.length ? h('span', { class: 'chip', title: 'Árvores (precisa de 🪓 Cortar)' }, `🌳 ${nv.arv.filter((x) => x.vivo).length}/${nv.arv.length}`) : null,
      h('span', { class: 'chip', title: 'Rochas (precisa de ⛏️ Minerar)' }, `⛰️ ${nv.roc.filter((x) => x.vivo).length}/${nv.roc.length}`),
      h('span', { class: 'chip', title: 'Canteiros: 🌱 Semear → 💦 Regar → 🍎 colher' }, `🌱 ${nv.cant.filter((x) => x.st === 'pronto').length} prontos / ${nv.cant.length}`));
    if (!g.salvo) info.append(h('button', { class: 'rescue-banner', onclick: () => rescueModal(r, farm) }, h('img', { src: thumb(0, { npc: r.resgate, size: 128 }) }), h('b', {}, `Socorro! Ajude ${r.resgate.quem}!`)));
    // o que cada um está fazendo
    for (const a of am) {
      const tk = G.taskOf(a); const ti = G.TASK_INFO[tk] || { icone: '💤', nome: 'Descansando' };
      workers.append(h('button', { class: 'worker' + (tk === 'cheio' ? ' full' : ''), onclick: () => amigoMiniModal(a) }, h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 96 }) }), h('span', {}, ti.icone), a.bolsa?.length ? h('i', { class: 'n' }, a.bolsa.length) : null));
    }
    const place = h('button', { class: 'btn green', onclick: () => pickAmigoModal(r) }, '➕ Colocar');
    if (S().tutorial === 2 && !am.length) place.classList.add('pointing');
    actions.append(place, h('button', { class: 'btn gold' + (ready && S().tutorial === 3 ? ' pointing' : ''), disabled: !ready, onclick: collectAll }, `🎒 Pegar tudo${ready ? ` (${ready})` : ''}`));
    if (isBase) actions.append(h('button', { class: 'btn' + (G.buildState('bancada').ok ? ' pointing' : ''), onclick: () => bancadaModal(farm) }, S().base.bancada ? '🛠️ Bancada' : '🛠️ Construir'));
    if (G.expandCost(r.id)) actions.append(h('button', { class: 'btn blue', onclick: () => expandModal(r) }, '🌱 Aumentar'));
  }
  function collectFrom(a, obj) {
    const got = G.collect(a); if (!got.length) return;
    play('collect'); const p = toScreen(obj);
    const cnt = {}; for (const it of got) cnt[it] = (cnt[it] || 0) + 1;
    toast(Object.entries(cnt).map(([id, n]) => `+${n} ${ITEMS[id].emoji}`).join(' '), p.x, p.y); fly(ITEMS[got[0]].emoji, p.x, p.y);
    farm.setAmigoBubbles(a.uid, 0); farm.popAt(obj);
    if (S().tutorial === 3) S().tutorial = 4;
    sync(); flushNotices(); updateGuide();
  }
  function collectAll() { let i = 0; for (const w of farm.walkers) { const a = S().amigos.find((x) => x.uid === w.uid); if (a?.bolsa?.length) setTimeout(() => collectFrom(a, w.c), 160 * i++); } }
  const cv = $('#stage'); let down = null;
  const pd = (e) => { down = { x: e.clientX, y: e.clientY, moved: 0 }; };
  const pm = (e) => { if (!down) return; const dx = e.clientX - down.x; down.moved += Math.abs(dx) + Math.abs(e.clientY - down.y); farm.rotate(dx); down.x = e.clientX; down.y = e.clientY; };
  const pu = (e) => {
    if (!down) return; const moved = down.moved; down = null; if (moved > 12) return;
    let hit = farm.pick(rayAt(e.clientX, e.clientY));
    if (!hit || hit.tipo === 'canteiro' || hit.tipo === 'arvore' || hit.tipo === 'rocha') {
      let best = null, bd = 80;
      for (const w of farm.walkers) { const p = toScreen(w.c, w.c.userData.height * 0.6); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = w; } }
      if (best && (!hit || bd < 45)) hit = { tipo: 'amigo', walker: best, obj: best.c };
    }
    if (!hit) return;
    const amigo = hit.walker && S().amigos.find((x) => x.uid === hit.walker.uid);
    if ((hit.tipo === 'bolha' || hit.tipo === 'amigo') && amigo?.bolsa?.length) collectFrom(amigo, hit.walker.c);
    else if (hit.tipo === 'amigo') { hit.walker.c.userData.ctrl.jump(); if (G.pet(amigo)) { play('heart'); const p = toScreen(hit.walker.c, hit.walker.c.userData.height); toast('💕 +3', p.x, p.y); } else play('pop'); amigoMiniModal(amigo); }
    else if (hit.tipo === 'brilho') { const item = G.collectSparkle(r.id); if (!item) return; play('coin'); const p = toScreen(hit.obj); toast(`+1 ${ITEMS[item].emoji}`, p.x, p.y); fly(ITEMS[item].emoji, p.x, p.y); farm.popAt(hit.obj, '#fff3a0'); farm.removeSparkle(hit.obj); }
    else if (hit.tipo === 'npc') { if (!g.salvo) rescueModal(r, farm); else { hit.obj.userData.ctrl.happy(); play('heart'); } }
    else if (hit.tipo === 'canteiro') {
      const c = g.cant[hit.idx];
      if (c.st === 'pronto') { const n = G.harvestPlot(r.id, hit.idx); if (n) { play('collect'); const p = toScreen(hit.obj, 0.8); toast(`+${n} 🍎`, p.x, p.y); fly('🍎', p.x, p.y); farm.popAt(hit.obj, ['#ff6a5a', '#8ee07a']); sync(); flushNotices(); } }
      else nodeModal('canteiro', c);
    } else if (hit.tipo === 'arvore') nodeModal('arvore', g.arv[hit.idx]);
    else if (hit.tipo === 'rocha') nodeModal('rocha', g.roc[hit.idx]);
    else if (hit.tipo === 'bancada') bancadaModal(farm);
    else if (hit.tipo === 'forno') fornoModal();
  };
  const wheel = (e) => farm.zoomBy(e.deltaY > 0 ? 1.08 : 0.92);
  cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); cv.addEventListener('wheel', wheel, { passive: true });
  function sync() {
    for (const w of farm.walkers) {
      const a = S().amigos.find((x) => x.uid === w.uid); if (!a) continue;
      const n = a.bolsa?.length || 0; if (w.bubbles.length !== Math.min(3, n)) farm.setAmigoBubbles(a.uid, n, bagEmoji(a));
      const tk = G.taskOf(a); farm.setJob(a.uid, tk === 'explorar' ? null : tk, a.task?.alvo);
    }
    farm.setNodes(nodesView(r.id));
    farm.setForno(isBase && G.amigosEm(r.id).some((a) => a.task?.tipo === 'fundir'));
    drawUi();
  }
  farmSync = sync;
  let lastSpark = g.brilhos;
  farmSparkSync = () => { if (g.brilhos !== lastSpark) { lastSpark = g.brilhos; farm.setSparkles(g.brilhos); } farm.setNodes(nodesView(r.id)); };
  cleanup = () => { cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); cv.removeEventListener('wheel', wheel); farmSync = null; farmSparkSync = null; };
  sync();
}
let farmSync = null, farmSparkSync = null;
function nodeModal(tipo, n) {
  play('tap');
  const t = Date.now();
  modal((box, close) => {
    if (tipo === 'arvore') box.append(h('div', { class: 'big' }, n.livre <= t ? '🌳' : '🪵'), h('h2', {}, 'Árvore'), h('p', {}, n.livre <= t ? 'Um companheiro com 🪓 Cortar transforma ela em Madeira 🪵.' : `Cortada! Volta a crescer em ${fmtTime(n.livre - t)}.`));
    if (tipo === 'rocha') box.append(h('div', { class: 'big' }, '⛰️'), h('h2', {}, 'Rocha com minério'), h('p', {}, n.livre <= t ? 'Um companheiro com ⛏️ Minerar tira Ferro Bruto 🔩, pedras e às vezes uma gema 💎.' : `Quebrada! A rocha volta em ${fmtTime(n.livre - t)}.`));
    if (tipo === 'canteiro') {
      const txt = { vazio: 'Vazio. Só um companheiro com 🌱 Semear pode plantar aqui (geralmente os de Planta).', semeado: 'Semeado! Agora precisa de um companheiro com 💦 Regar (geralmente os de Água).', regado: `Crescendo... fica pronto em ${fmtTime(n.ate - t)}.` }[n.st];
      box.append(h('div', { class: 'big' }, { vazio: '🟫', semeado: '🌰', regado: '🌱' }[n.st] || '🍎'), h('h2', {}, 'Canteiro'), h('p', {}, txt), h('p', { class: 'muted' }, 'Quando ficar pronto, você ou um companheiro com 🧺 Coletar colhe as frutas 🍎.'));
    }
    box.append(h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Entendi')));
  });
}
function bancadaModal(farm) {
  play('tap');
  modal((box, close) => {
    const s = S(); const reqs = (c) => h('div', { class: 'req' }, ...Object.entries(c).map(([id, n]) => reqRow(G.has(id, n), `${id === 'brilho' ? '🔷' : ITEMS[id].emoji} ${id === 'brilho' ? s.brilho : s.itens[id] || 0}/${n}`)));
    box.append(h('h2', {}, '🛠️ Base da Floresta'), h('p', { class: 'muted' }, 'Madeira 🪵 vem das árvores, Ferro 🔩 das rochas, Frutas 🍎 da plantação e Barras 🧱 do Forno.'));
    box.append(h('h3', { style: 'text-align:left;margin:10px 0 4px' }, 'Construir'));
    for (const [id, b] of Object.entries(BUILDINGS)) {
      const st = G.buildState(id);
      box.append(h('div', { class: 'craft' }, h('span', { class: 'ci' }, b.icone), h('div', { class: 'grow' }, h('b', {}, b.nome, b.max ? ` (${st.count}/${b.max})` : ''), h('div', { class: 'muted' }, b.desc), st.done ? h('div', { class: 'badge-ok' }, '✓ Construído') : st.locked ? h('div', { class: 'muted' }, `🔒 Precisa: ${BUILDINGS[b.precisa].nome}`) : reqs(b.custo)),
        st.done || st.locked ? null : h('button', { class: 'btn green small', disabled: !st.ok, onclick: () => { if (G.build(id)) { play('fanfare'); close(); flushNotices(); go('fazenda'); } } }, 'Construir')));
    }
    if (s.base.bancada) {
      box.append(h('h3', { style: 'text-align:left;margin:14px 0 4px' }, 'Fabricar'));
      for (const c of CRAFTS) {
        box.append(h('div', { class: 'craft' }, h('span', { class: 'ci' }, c.icone), h('div', { class: 'grow' }, h('b', {}, c.nome), h('div', { class: 'muted' }, c.desc), reqs(c.custo)),
          h('button', { class: 'btn small', disabled: !G.canPay({ itens: c.custo }), onclick: () => { if (G.craft(c.id)) { play('anvil'); updateHud(); close(); bancadaModal(farm); } } }, 'Fazer')));
      }
      if (s.base.forno) box.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: () => { close(); fornoModal(); } }, '🏭 Abrir o Forno')));
    }
    box.append(h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Fechar')));
  });
}
function fornoModal() {
  play('tap');
  modal((box, close) => {
    const s = S(); const fire = G.amigosEm(G.BASE_REGION_ID).filter((a) => G.skillLevel(a, 'acender') > 0);
    box.append(h('div', { class: 'big' }, '🏭'), h('h2', {}, 'Forno de Fundição'), h('p', {}, 'Coloque Ferro Bruto 🔩 aqui. Um companheiro com 🔥 Acender na Floresta Viva derrete e faz Barras de Metal 🧱.'),
      h('div', { class: 'req' }, h('div', { class: 'r' }, `Na fila: 🔩 ${s.base.fila}`), h('div', { class: 'r' }, `Você tem: 🔩 ${s.itens.ferro || 0}`), h('div', { class: 'r ' + (fire.length ? 'ok' : 'no') }, fire.length ? `🔥 ${fire.length} acendedor(es)` : '🔥 Ninguém para acender')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', disabled: !s.itens.ferro, onclick: () => { G.addToForno(1); play('drop'); close(); fornoModal(); } }, '+1 🔩'),
        h('button', { class: 'btn gold', disabled: !s.itens.ferro, onclick: () => { G.addToForno(99); play('drop'); close(); fornoModal(); } }, 'Colocar todo o ferro'),
        h('button', { class: 'btn ghost', onclick: close }, 'Fechar')));
  });
}
function amigoMiniModal(a) {
  modal((box, close) => {
    const s = SPECIES[a.sp]; const tk = G.taskOf(a); const ti = G.TASK_INFO[tk] || { icone: '💤', nome: 'Descansando' };
    box.append(h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 160 }), style: 'width:130px' }), h('h2', {}, G.nomeDe(a)),
      h('p', {}, `Nível ${a.nivel} · ${s.estagio} · `, h('span', { class: 'stars' }, stars(s.rar))),
      h('p', {}, h('b', {}, `${ti.icone} ${ti.nome}`)), skillChips(a.sp),
      h('p', { class: 'muted' }, `Bolsa: ${a.bolsa?.length || 0}/${G.bagCap(a)} · rende ~${yieldOf(a.sp).toFixed(1)} itens por tarefa`),
      h('div', { class: 'actions' },
        a.bolsa?.length ? h('button', { class: 'btn gold small', onclick: () => { close(); const got = G.collect(a); play('collect'); flushNotices(); if (farmSync) farmSync(); updateHud(); toast(got.map((i) => ITEMS[i].emoji).join(''), innerWidth / 2, innerHeight / 2); } }, '🎒 Pegar itens') : null,
        h('button', { class: 'btn ghost small', onclick: () => { close(); go('perfil', a.uid); } }, '👀 Ver ficha'),
        h('button', { class: 'btn ghost small', onclick: () => { G.collect(a); G.placeAmigo(a, null); close(); go('fazenda'); } }, '🏠 Descansar'),
        h('button', { class: 'btn small', onclick: close }, 'OK')));
  });
}
function pickAmigoModal(r) {
  modal((box, close) => {
    const n = G.amigosEm(r.id).length, cap = G.farmSlots(r.id);
    box.append(h('h2', {}, `Quem vai trabalhar em ${r.nome}?`), h('p', { class: 'muted' }, `${n}/${cap} lugares · ⚡ = mesmo elemento (explora 2× mais rápido). Veja as habilidades de cada um!`));
    if (n >= cap) box.append(h('p', {}, '🏡 A fazendinha está cheia. Aumente a fazendinha ou construa Casinhas na Bancada!'));
    const list = S().amigos.filter((a) => a.local !== r.id).sort((a, b) => (SPECIES[b.sp].el === r.el) - (SPECIES[a.sp].el === r.el) || b.nivel - a.nivel);
    if (!list.length) box.append(h('p', {}, 'Todos os seus companheiros já estão aqui. Forje mais na Forja! 🔨'));
    const grid = h('div', { class: 'pickgrid' });
    for (const a of list) grid.append(monCard(a, () => {
      if (n >= cap) { play('sad'); return; }
      if (G.placeAmigo(a, r.id)) { play('collect'); if (S().tutorial < 3) S().tutorial = 3; G.tick(); close(); go('fazenda'); }
    }, { tag: SPECIES[a.sp].el === r.el || SPECIES[a.sp].el === 'trovao' ? '⚡' : a.local ? '🏡' : '' }));
    box.append(grid, h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Fechar')));
  });
}
function expandModal(r) {
  modal((box, close) => {
    const c = G.expandCost(r.id); const s = S();
    box.append(h('div', { class: 'big' }, '🌱🏡'), h('h2', {}, 'Aumentar a fazendinha'), h('p', {}, `Nível ${s.regioes[r.id].fazenda} → ${s.regioes[r.id].fazenda + 1}: mais 1 lugar para companheiros, a ilha cresce e os itens raros aparecem mais!`),
      h('div', { class: 'req' }, reqRow(s.moedas >= c.moedas, `🪙 ${s.moedas}/${c.moedas}`), ...Object.entries(c.itens).map(([id, n]) => reqRow(G.has(id, n), `${ITEMS[id].emoji} ${s.itens[id] || 0}/${n}`))),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Depois'),
        h('button', { class: 'btn green', disabled: !G.canPay(c), onclick: () => { if (G.expand(r.id)) { play('fanfare'); close(); flushNotices(); go('fazenda'); } } }, 'Aumentar!')));
  });
}
function rescueModal(r, farm) {
  modal((box, close) => {
    const res = r.resgate; const helpers = G.rescueHelpers(r.id); const s = S();
    let chosen = helpers[0];
    box.append(h('img', { src: thumb(0, { npc: res, size: 192 }), style: 'width:150px' }), h('h2', {}, `${res.quem} precisa de ajuda!`), h('p', {}, res.texto), h('p', { class: 'muted' }, '💡 ', res.ajuda));
    const stage = ['Filhote', 'Jovem', 'Adulto'][res.precisa.estagio];
    box.append(h('div', { class: 'req' },
      reqRow(helpers.length > 0, `${ELEMENTS[res.precisa.el].icone} Companheiro de ${ELEMENTS[res.precisa.el].nome}${res.precisa.estagio ? ` (${stage} ou maior)` : ''}`),
      ...Object.entries(res.itens).map(([id, n]) => reqRow(G.has(id, n), `${ITEMS[id].emoji} ${s.itens[id] || 0}/${n} ${ITEMS[id].nome}`))));
    if (helpers.length > 1) {
      const grid = h('div', { class: 'pickgrid' });
      const cards = helpers.map((a) => { const c = monCard(a, () => { chosen = a; cards.forEach((x) => x.style.outline = ''); c.style.outline = '5px solid #ffd25a'; }); return c; });
      cards[0].style.outline = '5px solid #ffd25a'; grid.append(...cards); box.append(h('p', {}, 'Quem vai ajudar?'), grid);
    }
    box.append(h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Depois'),
      h('button', { class: 'btn green', disabled: !G.canRescue(r.id), onclick: () => {
        const premio = G.rescue(r.id, chosen); if (!premio) return; close();
        farm?.freeNpc(); play('fanfare'); if (S().tutorial < 5) S().tutorial = 5;
        modal((bx, cl) => {
          bx.append(h('img', { src: thumb(0, { npc: res, size: 192 }), style: 'width:150px' }), h('h2', {}, `${res.quem} está salv${res.g}! 🎉`), h('p', {}, `“Valeu, ${G.nomeDe(chosen)}! Te devo essa. De vez em quando vou te pedir uma ajuda.”`),
            h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${premio.moedas}`), h('div', { class: 'r ok' }, '🔷 +1 Cristal de Evolução'), h('div', { class: 'r ok' }, '💠 +1 Runa do Trovão'), premio.coroa ? h('div', { class: 'r ok' }, '👑 +1 Coroa do Trovão') : null),
            h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { cl(); go(screen === 'fazenda' ? 'fazenda' : screen); } }, 'Oba!')));
        });
        flushNotices();
      } }, '🦸 Salvar!')));
  });
}

// =========================== AMIGOS ===========================
let amigosTab = 'todos';
function renderAmigos(sc) {
  const s = S();
  const head = h('div', { class: 'title' }, '🛡️ Minha equipe', h('small', {}, `${s.amigos.length} companheiros`));
  const festaBtn = h('button', { class: 'btn small ' + (s.fusao?.pronta ? 'gold pointing' : 'ghost'), onclick: festaModal }, s.fusao?.pronta ? '💎 Cristal da Fusão pronto!' : '⚡ Fusão do Trovão');
  sc.append(h('div', { class: 'row wrap' }, head, h('div', { class: 'grow' }), festaBtn));
  const tabs = h('div', { class: 'tabs' });
  const els = [...G.ownedElements()];
  for (const [k, label] of [['todos', 'Todos'], ['fazenda', '🏡 Trabalhando'], ['livres', '🏠 Descansando'], ...ELEMENT_ORDER.concat('trovao').filter((e) => els.includes(e)).map((e) => [e, ELEMENTS[e].icone + ' ' + ELEMENTS[e].nome])])
    tabs.append(h('button', { class: 'tab' + (amigosTab === k ? ' on' : ''), onclick: () => { amigosTab = k; play('tap'); go('amigos'); } }, label));
  sc.append(tabs);
  let list = s.amigos.slice();
  if (amigosTab === 'fazenda') list = list.filter((a) => a.local); else if (amigosTab === 'livres') list = list.filter((a) => !a.local); else if (amigosTab !== 'todos') list = list.filter((a) => SPECIES[a.sp].el === amigosTab);
  list.sort((a, b) => RARITY_ORDER.indexOf(SPECIES[b.sp].rar) - RARITY_ORDER.indexOf(SPECIES[a.sp].rar) || b.nivel - a.nivel);
  const grid = h('div', { class: 'grid' });
  if (!s.amigos.length) grid.append(h('div', { class: 'card' }, 'Você ainda não tem companheiros. Vá à 🔨 Forja e forje o primeiro!'));
  for (const a of list) {
    const c = G.canEvolve(a);
    grid.append(monCard(a, () => { play('tap'); go('perfil', a.uid); }, { tag: c.ok ? '🌟 Evoluir!' : '' }));
  }
  sc.append(h('div', { class: 'scroll grow' }, grid));
}
function renderPerfil(sc, uid) {
  const a = S().amigos.find((x) => x.uid === uid); if (!a) return go('amigos');
  const show = showcaseScene(a.sp, a.shiny); setScene(show);
  sc.append(h('button', { class: 'btn ghost small back', onclick: () => go('amigos') }, '⬅ Voltar'));
  const card = h('div', { class: 'card profile' }); sc.append(h('div', { class: 'grow passthru' }), card);
  let dragX = null; const cv = $('#stage');
  const pd = (e) => { dragX = e.clientX; }; const pm = (e) => { if (dragX != null) { show.turn(e.clientX - dragX); dragX = e.clientX; } }; const pu = () => { dragX = null; };
  cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
  show.onCreatureTap = () => { if (G.pet(a)) { show.hearts(); play('heart'); draw(); } else play('pop'); };
  cleanup = () => { cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
  function draw() {
    const s = SPECIES[a.sp]; const ev = G.canEvolve(a); card.innerHTML = '';
    const petLeft = G.PET_COOLDOWN - (Date.now() - (a.carinho || 0));
    card.append(
      h('div', { class: 'head' }, h('span', { class: 'name' }, G.nomeDe(a)), h('button', { class: 'btn ghost small', onclick: () => renameModal(a, draw) }, '✏️'), rarBadge(s.rar), h('span', { class: 'stars', style: 'font-size:22px' }, stars(s.rar)), a.shiny ? h('span', { class: 'chip' }, '✨ Cintilante') : null),
      h('div', { class: 'row wrap' }, elChip(s.el), h('span', { class: 'chip' }, '⚡ ', ELEMENTS[s.el].dom), h('span', { class: 'chip' }, `${s.estagio}${a.apelido ? ' · ' + s.nome : ''}`), h('span', { class: 'chip' }, a.local ? `🏡 ${REGIONS.find((r) => r.id === a.local).nome}` : '🏠 Descansando')),
      h('div', { class: 'row' }, h('b', {}, `Nível ${a.nivel}`), h('div', { class: 'bar grow' }, h('i', { style: `width:${a.nivel >= 20 ? 100 : (a.xp / G.amigoXpNeed(a)) * 100}%` })), h('span', { class: 'muted' }, a.nivel >= 20 ? 'máximo' : `${a.xp}/${G.amigoXpNeed(a)}`)),
      h('div', { class: 'row wrap' }, h('b', {}, 'Trabalho:'), ...skillsOf(a.sp).map((k) => h('span', { class: 'chip', title: SKILLS[k.id].desc }, SKILLS[k.id].icone, ' ', SKILLS[k.id].nome, ' ', h('span', { class: 'stars' }, '★'.repeat(Math.min(7, k.nivel))))), h('span', { class: 'chip' }, `🎒 ~${yieldOf(a.sp).toFixed(1)} itens/tarefa`)),
      s.stage < 2 ? h('p', { class: 'muted', style: 'margin:0' }, `🔷 Evolui no nível ${EVOLVE_AT[s.stage]} com ${EVOLVE_COST[s.stage]} Cristal de Evolução → vira ${S().descobertos[a.sp + 1] ? SPECIES[a.sp + 1].nome : '???'}${SPECIES[a.sp + 1].arch !== s.arch ? ' (muda de forma!)' : ''}: habilidades +1 nível${s.stage === 1 ? ', +1 habilidade nova, armadura e emblema' : ', crista e mais força'}.`) : h('p', { class: 'muted', style: 'margin:0' }, '🏅 Forma final! Pode entrar numa Fusão do Trovão.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost small', disabled: petLeft > 0, onclick: () => { if (G.pet(a)) { show.hearts(); show.happy(); play('heart'); draw(); } } }, petLeft > 0 ? `💕 Carinho em ${fmtTime(petLeft)}` : '💕 Fazer carinho'),
        h('button', { class: 'btn green small', onclick: () => placeModal(a, () => draw()) }, '🏡 Fazendinha'),
        h('button', { class: 'btn ghost small', disabled: !G.has('fruta') && !G.has('racao'), onclick: () => { if (G.feed(a, G.has('racao') ? 'racao' : 'fruta')) { show.hearts(); show.happy(); play('heart'); draw(); } } }, G.has('racao') ? `🥗 Ração (${S().itens.racao})` : `🍎 Dar fruta (${S().itens.fruta || 0})`),
        s.stage < 2 ? h('button', { class: 'btn gold small' + (ev.ok ? ' pointing' : ''), disabled: !ev.ok, title: ev.motivo || '', onclick: () => doEvolve() }, ev.ok ? '🌟 Evoluir!' : `🌟 ${ev.motivo}`) : null));
  }
  function doEvolve() {
    const old = SPECIES[a.sp].nome; const res = G.evolve(a); if (!res) return;
    play('hatch', 5); show.evolveFx(res.depois, a.shiny); draw();
    setTimeout(() => modal((box, close) => { box.append(h('div', { class: 'big' }, '🌟'), h('h2', {}, 'Evoluiu!'), h('p', {}, `${old} virou `, h('b', {}, SPECIES[res.depois].nome), '!'), res.novo ? h('p', {}, h('span', { class: 'tag-new' }, 'NOVO NO CÓDICE!')) : null, h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Incrível!'))); }), 1300);
    setTimeout(flushNotices, 1400);
  }
  draw();
}
function festaModal() {
  modal((box, close) => {
    const s = S();
    box.append(h('div', { class: 'big' }, '⚡🔨'), h('h2', {}, 'Fusão do Trovão'));
    if (!G.fusaoLiberada()) { box.append(h('p', {}, 'No nível 6 a Forja libera a Fusão: dois companheiros Adultos emprestam energia para forjar um cristal especial.'), h('p', { class: 'muted' }, 'Só pela Fusão saem as feras do Trovão ⚡ e o Mítico!'), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Entendi'))); return; }
    if (s.fusao) {
      if (s.fusao.pronta) box.append(h('p', {}, 'A Fusão terminou e deixou um cristal especial! 💎'), h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: () => { close(); go('ninho', { fusao: true }); } }, '🔨 Quebrar na Forja')));
      else box.append(h('p', {}, `A Fusão está carregando! Volte em ${fmtTime(s.fusao.ate - Date.now())}.`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK')));
      return;
    }
    const cand = G.fusaoCandidates();
    box.append(h('p', {}, 'Escolha 2 companheiros Adultos. Eles carregam a Forja por 1 minuto e sai um cristal especial. Eles continuam na sua equipe!'), h('p', { class: 'muted' }, 'Elementos diferentes e raros podem gerar uma fera do Trovão. Dois Lendários... talvez o Mítico!'));
    if (cand.length < 2) { box.append(h('p', {}, `Você tem ${cand.length} Adulto(s) livre(s). Precisa de 2!`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK'))); return; }
    const sel = []; const grid = h('div', { class: 'pickgrid' });
    const go2 = h('button', { class: 'btn gold', disabled: true, onclick: () => { if (G.startFusao(sel[0], sel[1])) { play('thunder'); close(); flushNotices(); go('amigos'); } } }, '⚡ Começar a Fusão!');
    for (const a of cand) { const c = monCard(a, () => { const i = sel.indexOf(a); if (i >= 0) { sel.splice(i, 1); c.style.outline = ''; } else if (sel.length < 2) { sel.push(a); c.style.outline = '5px solid #7df9ff'; } go2.disabled = sel.length !== 2; play('tap'); }); grid.append(c); }
    box.append(grid, h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Depois'), go2));
  });
}

// =========================== CÓDICE ===========================
let codexTab = 'todos';
function renderCodice(sc) {
  const n = G.discoveredCount();
  sc.append(h('div', { class: 'title' }, '📖 Códice das Feras', h('small', {}, `${n}/450 formas descobertas`)));
  const goals = h('div', { class: 'goals' }, h('div', { class: 'codex-bar' }, h('i', { style: `width:${(n / 450) * 100}%` })));
  for (const [meta, item, q] of G.codexGoals()) goals.append(h('span', { class: 'goal' + (n >= meta ? ' done' : '') }, `${meta}: ${item === 'brilho' ? '🔷' : ITEMS[item].emoji}×${q}`));
  sc.append(goals);
  const tabs = h('div', { class: 'tabs' });
  for (const [k, label] of [['todos', 'Todos'], ...ELEMENT_ORDER.concat('trovao').map((e) => [e, ELEMENTS[e].icone + ' ' + ELEMENTS[e].nome])]) {
    const tot = SPECIES.filter((s) => k === 'todos' || s.el === k); const got = tot.filter((s) => S().descobertos[s.id]).length;
    tabs.append(h('button', { class: 'tab' + (codexTab === k ? ' on' : ''), onclick: () => { codexTab = k; play('tap'); go('codice'); } }, `${label} ${got}/${tot.length}`));
  }
  sc.append(tabs);
  const grid = h('div', { class: 'grid' });
  const queue = [];
  for (const s of SPECIES) {
    if (codexTab !== 'todos' && s.el !== codexTab) continue;
    const known = !!S().descobertos[s.id]; const f = FAMILIES[s.fam];
    const img = h('img', { alt: '' });
    queue.push(() => { img.src = thumb(s.id, { silhouette: !known, size: 160 }); });
    const card = h('button', { class: 'mon' + (known ? '' : ' unknown'), style: `--rc:${rarColor(s.rar)};--bg:${known ? ELEMENTS[s.el].cores[1] : '#f1ecf8'}`, onclick: () => codexModal(s) },
      img, h('span', { class: 'corner2' }, '#' + String(s.id + 1).padStart(3, '0')),
      h('div', { class: 'nm' }, known ? s.nome : '???'), h('div', { class: 'sub stars' }, stars(s.rar)));
    if (!known) card.append(recipeHint(s, f));
    grid.append(card);
  }
  sc.append(h('div', { class: 'scroll grow' }, grid));
  // desenha as figurinhas aos poucos, sem travar a tela
  let alive = true; cleanup = () => { alive = false; };
  const step = () => { if (!alive) return; const t = performance.now(); while (queue.length && performance.now() - t < 14) queue.shift()(); if (queue.length) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function recipeHint(s, f) {
  if (f.fusao) return h('div', { class: 'sub' }, '⚡ Fusão do Trovão');
  if (s.stage > 0) return h('div', { class: 'sub' }, `🌟 Evolui no Nv ${EVOLVE_AT[s.stage - 1]}`);
  return h('div', { class: 'recipe' }, ...f.receita.map((id) => h('span', { class: G.has(id) ? '' : 'miss', title: ITEMS[id].nome }, ITEMS[id].emoji)));
}
function codexModal(s) {
  play('tap');
  modal((box, close) => {
    const known = !!S().descobertos[s.id]; const f = FAMILIES[s.fam];
    box.append(h('img', { src: thumb(s.id, { silhouette: !known, size: 256 }), style: 'width:200px' }), h('h2', {}, known ? s.nome : '??? (ainda não descoberto)'),
      h('div', { class: 'row wrap', style: 'justify-content:center' }, rarBadge(s.rar), elChip(s.el), h('span', { class: 'chip' }, s.estagio)), h('p', {}, 'Habilidades: '), skillChips(s.id), h('p', { class: 'muted' }, `Rende ~${yieldOf(s.id).toFixed(1)} itens por tarefa`));
    if (f.fusao) box.append(h('p', {}, '⚡ Esta espécie só sai de uma Fusão do Trovão!'));
    else if (s.stage > 0) box.append(h('p', {}, `🌟 Evolui de ${S().descobertos[s.id - 1] ? SPECIES[s.id - 1].nome : '???'} no nível ${EVOLVE_AT[s.stage - 1]}.`));
    else {
      box.append(h('p', {}, 'Receita para a Forja do Trovão:'), h('div', { class: 'row', style: 'justify-content:center;gap:14px' }, ...f.receita.map((id) => token(id, S().itens[id] || 0, null, G.has(id) ? '' : 'off'))));
      const where = [...new Set(f.receita.map((id) => ITEMS[id].el ? regionOf(ITEMS[id].el).nome : id === 'orvalho' ? 'todo lugar' : 'baús, pedidos e resgates'))];
      box.append(h('p', { class: 'muted' }, '📍 Onde achar: ', where.join(' · ')));
    }
    box.append(h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}

// =========================== PEDIDOS ===========================
function renderPedidos(sc) {
  sc.append(h('div', { class: 'title' }, '📜 Pedidos', h('small', {}, 'ajude e ganhe prêmios')));
  const wrap = h('div', { class: 'scroll grow' });
  if (S().diario.pendente) wrap.append(h('div', { class: 'card row', style: 'margin-bottom:14px' }, h('span', { style: 'font-size:54px' }, '🎁'), h('div', { class: 'grow' }, h('b', { style: 'font-size:22px' }, 'Presente do dia!'), h('div', { class: 'muted' }, `Você veio ${S().diario.serie} dia(s) seguidos 🔥`)), h('button', { class: 'btn gold', onclick: dailyModal }, 'Abrir')));
  G.fillOrders();
  if (!S().pedidos.length) wrap.append(h('div', { class: 'card' }, h('p', { style: 'font-size:20px' }, '🦸 Salve alguém em perigo no Mapa! Quem você salvar vai te fazer pedidos com prêmios.')));
  const list = h('div', { class: 'orders' });
  for (const o of S().pedidos) {
    const reg = REGIONS.find((r) => r.id === o.regiao);
    let want;
    if (o.tipo === 'itens') want = `Me traz ${o.qtd} ${ITEMS[o.item].emoji} ${ITEMS[o.item].nome}? (você tem ${S().itens[o.item] || 0})`;
    else if (o.tipo === 'amigo') want = `Um companheiro de ${ELEMENTS[o.el].icone} ${ELEMENTS[o.el].nome}${o.estagio ? ' (Jovem ou maior)' : ''} pode me ajudar um pouquinho?`;
    else want = `Descubra ${o.alvo} espécies no Códice! (agora: ${G.discoveredCount()})`;
    const p = o.premio;
    const ready = G.orderReady(o);
    list.append(h('div', { class: 'card order' }, h('img', { src: thumb(0, { npc: reg.resgate, size: 160 }) }),
      h('div', { class: 'grow' }, h('div', { class: 'who' }, o.quem), h('div', { class: 'want' }, want),
        h('div', { class: 'prize' }, h('span', { class: 'chip' }, `🪙 ${p.moedas}`), h('span', { class: 'chip' }, `⭐ ${p.xp} xp`), p.brilho ? h('span', { class: 'chip' }, '🔷 1') : null, p.runa ? h('span', { class: 'chip' }, '💠 1') : null, p.coroa ? h('span', { class: 'chip' }, '👑 1') : null),
        h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn green small' + (ready ? ' pointing' : ''), disabled: !ready, onclick: () => deliver(o) }, ready ? '🎁 Entregar' : 'Ainda não'), h('button', { class: 'btn ghost small', onclick: () => { G.skipOrder(o); play('pop'); go('pedidos'); } }, '🔄 Trocar')))));
  }
  wrap.append(list); sc.append(wrap);
}
function deliver(o) {
  const finish = (helper) => {
    const p = G.deliver(o, helper); if (!p) return; play('coin'); play('fanfare');
    modal((box, close) => { box.append(h('div', { class: 'big' }, '💝'), h('h2', {}, `${o.quem} adorou!`), h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${p.moedas}`), h('div', { class: 'r ok' }, `⭐ +${p.xp}`), p.brilho ? h('div', { class: 'r ok' }, '🔷 +1') : null, p.runa ? h('div', { class: 'r ok' }, '💠 +1') : null, p.coroa ? h('div', { class: 'r ok' }, '👑 +1') : null), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Oba!'))); });
    flushNotices(); go('pedidos');
  };
  if (o.tipo !== 'amigo') return finish();
  modal((box, close) => {
    box.append(h('h2', {}, 'Quem vai ajudar?'), h('p', { class: 'muted' }, 'Ele volta em 1 minuto e meio, com mais experiência!'));
    const grid = h('div', { class: 'pickgrid' });
    for (const a of G.orderHelpers(o)) grid.append(monCard(a, () => { close(); finish(a); }));
    box.append(grid);
  });
}
function dailyModal() {
  const g = G.claimDaily(); if (!g) return;
  play('fanfare');
  modal((box, close) => {
    box.append(h('div', { class: 'big', style: 'animation:bounce .6s' }, '🎁'), h('h2', {}, 'Presente do dia!'), h('p', {}, `${g.serie} dia(s) seguido(s) 🔥 — volte amanhã para um presente maior!`),
      h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${g.moedas}`), h('div', { class: 'r ok' }, '🔷 +1'), ...Object.entries(g.itens).map(([id, n]) => h('div', { class: 'r ok' }, `${ITEMS[id].emoji} +${n}`))),
      h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { close(); if (screen === 'pedidos') go('pedidos'); } }, 'Obrigado!')));
  });
  updateHud();
}

// =========================== MOCHILA, MEDALHAS, AJUSTES ===========================
function bagModal() {
  modal((box, close) => {
    box.append(h('h2', {}, '🎒 Mochila'), h('p', { class: 'muted' }, 'Toque num item para saber onde achar.'));
    const info = h('p', { style: 'min-height:28px' });
    const wrap = h('div', { class: 'row wrap', style: 'justify-content:center;gap:14px' });
    const ids = Object.keys(ITEMS).sort((a, b) => (ELEMENT_ORDER.indexOf(ITEMS[a].el) - ELEMENT_ORDER.indexOf(ITEMS[b].el)) || RARITY_ORDER.indexOf(ITEMS[a].rar) - RARITY_ORDER.indexOf(ITEMS[b].rar));
    for (const id of ids) {
      const it = ITEMS[id]; const n = S().itens[id] || 0;
      wrap.append(token(id, n, () => { play('tap'); info.textContent = `${it.emoji} ${it.nome} — ${RARITIES[it.rar].nome}. ${it.el ? 'Colhido em ' + regionOf(it.el).nome + '.' : id === 'orvalho' ? 'Aparece em todas as fazendinhas.' : 'Ganho em pedidos, resgates, presentes e no Códice.'}`; }, n ? 'mini' : 'mini off'));
    }
    box.append(h('p', {}, `${GROW_ITEM.emoji} ${GROW_ITEM.nome}: `, h('b', {}, String(S().brilho)), h('span', { class: 'muted' }, ' (usado para evoluir)')), wrap, info, h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}
function medalsModal() {
  modal((box, close) => {
    const got = Object.keys(S().conquistas).length;
    box.append(h('h2', {}, `🏅 Medalhas ${got}/${ACHIEVEMENTS.length}`));
    const g = h('div', { class: 'medals' });
    for (const a of ACHIEVEMENTS) g.append(h('div', { class: 'medal' + (S().conquistas[a.id] ? '' : ' off') }, h('div', { class: 'i' }, a.icone), h('b', {}, a.nome), h('small', {}, a.desc)));
    box.append(g, h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}
function levelModal() {
  modal((box, close) => {
    const s = S();
    box.append(h('div', { class: 'big' }, '⭐'), h('h2', {}, `Nível ${s.nivel}`), h('p', {}, `${s.xp}/${G.playerXpNeed()} de experiência para o próximo nível.`),
      h('p', { class: 'muted' }, 'Ganhe experiência colhendo, descobrindo espécies, evoluindo, salvando pessoas e entregando pedidos.'),
      h('p', {}, s.nivel < 4 ? '🔓 Nível 4: 4º espaço na Forja' : s.nivel < 6 ? '🔓 Nível 6: Fusão do Trovão' : '🎉 Tudo liberado! Continue subindo para ganhar presentes.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK')));
  });
}
function optionsModal() {
  modal((box, close) => {
    const s = S();
    const sfx = h('button', { class: 'btn ' + (s.som ? 'green' : 'ghost'), onclick: () => { s.som = !s.som; setSfx(s.som); G.save(); close(); optionsModal(); } }, s.som ? '🔊 Sons ligados' : '🔈 Sons desligados');
    const mus = h('button', { class: 'btn ' + (s.musica ? 'green' : 'ghost'), onclick: () => { s.musica = !s.musica; setMusic(s.musica); G.save(); close(); optionsModal(); } }, s.musica ? '🎵 Música ligada' : '🎵 Música desligada');
    box.append(h('h2', {}, '⚙️ Ajustes'), h('div', { class: 'actions' }, sfx, mus),
      h('p', { class: 'muted', style: 'margin-top:20px' }, 'Brilhinhos não tem propaganda nem compras. Tudo se ganha jogando!'),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost small', onclick: () => { close(); resetModal(); } }, '🗑️ Começar de novo'), h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}
function resetModal() {
  modal((box, close) => {
    box.append(h('div', { class: 'big' }, '⚠️'), h('h2', {}, 'Começar tudo de novo?'), h('p', {}, 'Todos os companheiros, itens e o Códice serão apagados. Peça ajuda a um adulto!'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Não, voltar'), h('button', { class: 'btn ghost', onclick: () => { G.resetGame(); close(); go('mapa'); } }, 'Sim, apagar tudo')));
  });
}

// =========================== GUIA (tutorial) ===========================
function updateGuide() {
  const s = S(); const gEl = $('#guide');
  document.querySelectorAll('#nav .pointing').forEach((b) => b.classList.remove('pointing'));
  let text = null, nav = null;
  const placed = s.amigos.some((a) => a.local);
  if (s.tutorial < 2) { if (screen !== 'ninho') { text = 'E aí! Eu sou o Raiozinho ⚡ Vamos forjar seu primeiro companheiro na Forja do Trovão?'; nav = 'ninho'; } else text = 'Coloque 2 Trevos 🍀 na bigorna e toque em Forjar!'; }
  else if (s.tutorial === 2 && !placed) { if (screen !== 'fazenda' && screen !== 'ninho') { text = 'Mande seu companheiro para a Fazendinha! 🏡'; nav = 'fazenda'; } else if (screen === 'fazenda') text = 'Toque em ➕ Colocar companheiro!'; }
  else if (s.tutorial <= 3 && placed) { if (screen === 'fazenda') text = 'Ele trabalha sozinho conforme as habilidades dele (🌱 semear, 💦 regar, 🪓 cortar, ⛏️ minerar...). Quando aparecer a bolha, toque nele para pegar os itens!'; else { text = 'Vá até a Fazendinha colher itens! 🧺'; nav = 'fazenda'; } }
  else if (s.tutorial === 4 && !s.regioes.floresta.salvo) { if (screen === 'fazenda') text = 'A Vovó Margarida precisa de ajuda! Junte 3 Trevos e toque nela'; else { text = 'A Vovó Margarida está pedindo socorro na Floresta Viva!'; nav = 'fazenda'; } }
  else if (s.tutorial === 5) { text = 'Você é um herói! Agora veja os 📜 Pedidos, descubra receitas no 📖 Códice e conserte as pontes 🌉 no Mapa!'; setTimeout(() => { if (S().tutorial === 5) { S().tutorial = 6; G.save(); updateGuide(); } }, 9000); }
  if (modalOpen) text = null;
  document.body.classList.toggle('guiding', !!text);
  if (!text) { gEl.hidden = true; return; }
  gEl.hidden = false; $('p', gEl).textContent = text; $('img', gEl).src = thumb(GUIDE_SPECIES, { size: 128 });
  if (nav) $(`#nav [data-go=${nav}]`).classList.add('pointing');
}

// =========================== INÍCIO ===========================
function start() {
  G.load();
  window.__brilhinhos = G; // ajuda nos testes
  setSfx(S().som);
  initStage($('#stage'));
  document.querySelectorAll('#nav button').forEach((b) => b.addEventListener('click', () => { play('tap'); go(b.dataset.go); }));
  $('#hud-bag').onclick = () => { play('tap'); bagModal(); };
  $('#hud-medals').onclick = () => { play('tap'); medalsModal(); };
  $('#hud-opts').onclick = () => { play('tap'); optionsModal(); };
  $('#hud-gift').onclick = () => { dailyModal(); };
  $('#hud-level').onclick = () => { play('tap'); levelModal(); };
  // o áudio só pode começar depois do primeiro toque
  const first = () => { unlockAudio(); setMusic(S().musica); window.removeEventListener('pointerdown', first); };
  window.addEventListener('pointerdown', first);
  setInterval(() => {
    const changed = G.tick();
    if (screen === 'fazenda') { farmSync?.(); farmSparkSync?.(); }
    updateHud();
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) G.tick(); else G.save(); });
  go(S().amigos.length ? 'mapa' : 'ninho');
  setTimeout(() => $('#splash').classList.add('hide'), 300); setTimeout(() => $('#splash').remove(), 1000);
  flushNotices();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !location.hostname.match(/^(localhost|127\.)/)) navigator.serviceWorker.register('sw.js');
}
start();
