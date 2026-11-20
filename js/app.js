// Brilhinhos — as telas: Mapa, Ninho Arco-íris, Fazendinha, Amigos, Códice e Pedidos.
import * as G from './game.js';
import { ITEMS, RARITIES, RARITY_ORDER, ELEMENTS, ELEMENT_ORDER, FAMILIES, SPECIES, REGIONS, ACHIEVEMENTS, EVOLVE_AT, EVOLVE_COST, GROW_ITEM, EL_ITEMS } from './data.js';
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
const rarColor = (r) => (r === 'mitico' ? '#ff9bf0' : RARITIES[r].cor);
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
    if (n.tipo === 'nivel') modal((box, close) => { play('fanfare'); box.append(h('div', { class: 'big' }, '🎉'), h('h2', {}, `Nível ${n.nivel}!`), h('p', {}, 'Você está ficando um ótimo cuidador!'), h('p', { class: 'muted' }, n.premio), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Oba!'))); });
    if (n.tipo === 'conquista') modal((box, close) => { play('fanfare'); box.append(h('div', { class: 'big' }, n.a.icone), h('h2', {}, 'Medalha nova!'), h('p', {}, h('b', {}, n.a.nome)), h('p', { class: 'muted' }, n.a.desc + ' · +10 🪙'), h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: close }, 'Uhuu!'))); });
    if (n.tipo === 'codice') modal((box, close) => { play('hatch', 3); box.append(h('div', { class: 'big' }, '📖'), h('h2', {}, `${n.meta} espécies no Códice!`), h('p', {}, 'Presente da coleção: ', h('b', {}, n.premio)), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Que legal!'))); });
  }
  updateHud();
}

// ---------- navegação ----------
let screen = '', farmRid = 'prado', cleanup = null;
const NO3D = new Set(['mapa', 'codice', 'amigos', 'pedidos']);
function go(name, arg) {
  if (cleanup) { cleanup(); cleanup = null; }
  $('#sky').style.background = '';
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
  sc.append(h('div', { class: 'title' }, '🗺️ Vale dos Brilhinhos', h('small', {}, 'toque numa região')));
  const grid = h('div', { class: 'map' });
  REGIONS.forEach((r, i) => {
    const g = S().regioes[r.id];
    const fam = FAMILIES.find((f) => f.el === r.el);
    const card = h('button', { class: 'region' + (g.aberta ? '' : ' locked'), style: `background:linear-gradient(160deg, ${r.ceu[0]}, ${r.chao})` },
      h('div', { class: 'rname' }, `${ELEMENTS[r.el].icone} ${r.nome}`),
      h('img', { class: 'mascot', src: thumb(fam.id * 3, { size: 200 }), alt: '' }));
    const info = h('div', { class: 'info' });
    if (g.aberta) {
      info.append(h('span', { class: 'chip' }, `🏡 Fazendinha nível ${g.fazenda}`), h('span', { class: 'chip' }, `💞 ${G.amigosEm(r.id).length}/${G.farmSlots(r.id)} amigos`));
      info.append(g.salvo ? h('span', { class: 'badge-ok' }, `✓ ${r.resgate.quem} salv${r.resgate.g}`) : h('span', { class: 'badge-help' }, `Socorro! ${r.resgate.quem}`));
      card.onclick = () => { play('tap'); farmRid = r.id; go('fazenda'); };
    } else {
      const b = G.bridgeState(r.id);
      info.append(h('span', { class: 'lockico' }, '🌈'), h('span', { class: 'chip' }, b.ok ? '✨ Pronta para abrir!' : 'Ponte Arco-íris quebrada'));
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
    box.append(h('div', { class: 'big' }, '🌈'), h('h2', {}, `Ponte para ${r.nome}`), h('p', {}, 'Para consertar a ponte arco-íris, precisamos de:'));
    const req = h('div', { class: 'req' },
      reqRow(b.prevSalvo, `Salvar ${b.prev.resgate.quem} (${b.prev.nome})`),
      reqRow(s.amigos.length >= p.amigos, `💞 ${s.amigos.length}/${p.amigos} amigos`),
      reqRow(s.moedas >= p.moedas, `🪙 ${s.moedas}/${p.moedas}`),
      ...Object.entries(p.itens).map(([id, n]) => reqRow(G.has(id, n), `${ITEMS[id].emoji} ${s.itens[id] || 0}/${n} ${ITEMS[id].nome}`)));
    box.append(req, h('div', { class: 'actions' },
      h('button', { class: 'btn ghost', onclick: close }, 'Depois'),
      h('button', { class: 'btn green', disabled: !b.ok, onclick: () => {
        if (!G.openBridge(r.id)) return; play('fanfare'); close();
        modal((bx, cl) => { bx.append(h('div', { class: 'big' }, '🌈✨'), h('h2', {}, 'Ponte consertada!'), h('p', {}, `Agora você pode visitar ${r.nome}! Lá tem itens novos e alguém precisando de ajuda.`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { cl(); farmRid = r.id; go('fazenda'); } }, 'Vamos lá!'))); });
        flushNotices(); if (screen === 'mapa') go('mapa');
      } }, 'Consertar!')));
  });
}

// =========================== NINHO ===========================
let pendingFesta = false;
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
      top.append(h('div', { class: 'nest-hint' }, chosen.length ? 'Coloque até ' + G.nestSlots() + ' itens e toque em Misturar!' : 'Toque nos itens para jogar no Ninho Arco-íris'));
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
      const mixBtn = h('button', { class: 'btn', disabled: !chosen.length, onclick: startStir }, '🌈 Misturar!');
      if (S().tutorial < 2 && chosen.filter((x) => x === 'trevo').length >= 2) mixBtn.classList.add('pointing');
      bottom.append(h('div', { class: 'row' }, chosen.length ? h('button', { class: 'btn ghost small', onclick: () => { chosen = []; play('pop'); draw(); } }, 'Limpar') : null, mixBtn), tray);
    } else if (phase === 'stir') {
      top.append(h('div', { class: 'nest-hint' }, '🌀 Gire o dedo em volta do ninho! (ou toque várias vezes)'));
      const bar = h('div', { class: 'progress' }, h('i', { style: `width:${stirP * 100}%` }));
      bottom.append(bar);
    } else if (phase === 'egg') {
      top.append(h('div', { class: 'nest-hint' }, eggTaps ? `Mais ${3 - eggTaps}!` : '🥚 Toque no ovo para ele nascer!'));
    } else if (phase === 'reveal') {
      top.append(h('div'));
      bottom.append(revealCard(result));
    }
  }
  function previewEl() {
    const p = G.previewMix(chosen);
    if (p.exato) {
      const f = FAMILIES[p.fam]; const known = S().descobertos[f.id * 3];
      return h('div', { class: 'chance' }, '💡', known ? `Receita do ${f.nomes[0]}!` : 'Combinação certinha! Vai nascer um amigo especial!');
    }
    const ch = p.chances; const good = (ch.raro + ch.epico + ch.lendario) * 100;
    const bar = h('div', { class: 'row', style: 'gap:2px;width:160px' }, ...['comum', 'incomum', 'raro', 'epico', 'lendario'].map((r) => h('i', { style: `width:${Math.max(ch[r] * 100, ch[r] > 0.001 ? 3 : 0)}%;background:${rarColor(r)}` })));
    return h('div', { class: 'chance' }, '🍀 Sorte:', bar, h('b', {}, good < 5 ? 'pouca' : good < 15 ? 'boa' : good < 30 ? 'ótima' : 'incrível!'));
  }
  // --- mexer ---
  let zone = null;
  function startStir() {
    if (!chosen.length) return;
    phase = 'stir'; stirP = 0; play('tap'); draw();
    zone = h('div', { class: 'stirzone' }, h('div', { class: 'stirring' }), h('div', { class: 'stir-hand' }, '👆'));
    document.body.append(zone);
    let last = null, acc = 0, lastSound = 0;
    const center = () => { const r = zone.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const add = (d) => {
      stirP = Math.min(1, stirP + d); nest.setStir(stirP); $('.progress i', bottom).style.width = stirP * 100 + '%';
      if (performance.now() - lastSound > 140) { play('stir'); lastSound = performance.now(); }
      if (stirP >= 1) finishStir();
    };
    zone.onpointerdown = (e) => { zone.setPointerCapture(e.pointerId); const [cx, cy] = center(); last = Math.atan2(e.clientY - cy, e.clientX - cx); add(0.06); };
    zone.onpointermove = (e) => {
      if (last == null) return; const [cx, cy] = center(); const a = Math.atan2(e.clientY - cy, e.clientX - cx);
      let d = a - last; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; last = a;
      acc += Math.abs(d); if (acc > 0.05) { add(acc / (Math.PI * 4)); acc = 0; }
    };
    zone.onpointerup = () => { last = null; };
  }
  function finishStir() {
    if (phase !== 'stir') return;
    zone?.remove(); zone = null;
    result = G.mix(chosen); chosen = [];
    if (!result) { phase = 'pick'; draw(); return; }
    toEgg();
  }
  function toEgg() {
    const s = SPECIES[result.amigo.sp];
    phase = 'egg'; eggTaps = 0; nest.setStir(0.3); nest.showEgg(s.el, s.rar); play('hatch', 1); draw();
    nest.onTap = (r) => {
      if (phase !== 'egg') return;
      eggTaps++; nest.tapEgg(); play('wobble');
      if (eggTaps >= 3) {
        const lvl = RARITIES[s.rar].estrelas;
        nest.reveal(result.amigo.sp, result.amigo.shiny, s.rar); play('hatch', lvl); nest.setStir(0);
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
      res.novo && !res.exato && res.fam.receita ? h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Que sorte! A receita dele agora está no Códice 📖') : null,
      h('div', { class: 'row wrap', style: 'justify-content:center;margin-top:10px' },
        h('button', { class: 'btn ghost small', onclick: () => renameModal(a, () => draw()) }, '✏️ Dar nome'),
        h('button', { class: 'btn green small', onclick: () => placeModal(a, (rid) => { farmRid = rid; go('fazenda'); }) }, '🏡 Levar para a fazendinha'),
        h('button', { class: 'btn small', onclick: () => { nest.clearCreature(); phase = 'pick'; draw(); } }, '🌈 Fazer outro')));
    return card;
  }
  if (arg?.festa) { result = G.hatchFesta(); if (result) toEgg(); else draw(); }
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
    box.append(h('h2', {}, `Para onde vai ${G.nomeDe(a)}?`), h('p', { class: 'muted' }, 'Na região do mesmo elemento ele colhe 2× mais rápido ⚡'));
    const list = h('div', { class: 'req', style: 'flex-direction:column' });
    for (const r of REGIONS) {
      const g = S().regioes[r.id]; if (!g.aberta) continue;
      const n = G.amigosEm(r.id).length, cap = G.farmSlots(r.id); const here = a.local === r.id;
      const match = r.el === s.el || s.el === 'arco';
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
function renderFazenda(sc) {
  if (!S().regioes[farmRid]?.aberta) farmRid = 'prado';
  const r = REGIONS.find((x) => x.id === farmRid); const g = S().regioes[r.id];
  const bubbleEmoji = ITEMS[EL_ITEMS[r.el].comum].emoji;
  const amigos = G.amigosEm(r.id);
  $('#sky').style.background = `linear-gradient(180deg, ${r.ceu[0]} 0%, ${r.ceu[1]} 70%)`;
  const farm = farmScene(r, { nivel: g.fazenda, amigos: amigos.map((a) => ({ uid: a.uid, spId: a.sp, shiny: a.shiny, prontos: a.prontos, bubbleEmoji })), brilhos: g.brilhos, resgate: { salvo: g.salvo } });
  setScene(farm);
  // chips das regiões
  const chips = h('div', { class: 'farm-top' });
  for (const rr of REGIONS) {
    if (!S().regioes[rr.id].aberta) continue;
    const ready = G.amigosEm(rr.id).some((a) => a.prontos > 0);
    chips.append(h('button', { class: 'farm-chip' + (rr.id === r.id ? ' on' : ''), onclick: () => { play('tap'); farmRid = rr.id; go('fazenda'); } }, ELEMENTS[rr.el].icone, rr.nome, ready && rr.id !== r.id ? h('i', { class: 'dot' }) : null));
  }
  const info = h('div', { class: 'farm-info' });
  const actions = h('div', { class: 'farm-actions' });
  sc.append(chips, info, h('div', { class: 'grow passthru' }), actions);
  function drawUi() {
    info.innerHTML = ''; actions.innerHTML = '';
    const am = G.amigosEm(r.id); const ready = am.reduce((t, a) => t + a.prontos, 0);
    info.append(h('span', { class: 'chip' }, `🏡 Nível ${g.fazenda}`), h('span', { class: 'chip' }, `💞 ${am.length}/${G.farmSlots(r.id)}`), h('span', { class: 'chip' }, `Colhe: ${['comum', 'incomum', 'raro'].map((k) => ITEMS[EL_ITEMS[r.el][k]].emoji).join(' ')}`));
    if (!g.salvo) info.append(h('button', { class: 'rescue-banner', onclick: () => rescueModal(r, farm) }, h('img', { src: thumb(0, { npc: r.resgate, size: 128 }) }), h('b', {}, `Socorro! Ajude ${r.resgate.quem}!`)));
    const place = h('button', { class: 'btn green', onclick: () => pickAmigoModal(r) }, '➕ Colocar amigo');
    if (S().tutorial === 2 && !am.length) place.classList.add('pointing');
    actions.append(place);
    actions.append(h('button', { class: 'btn gold', disabled: !ready, onclick: collectAll }, `🧺 Colher tudo${ready ? ` (${ready})` : ''}`));
    const ec = G.expandCost(r.id);
    if (ec) actions.append(h('button', { class: 'btn blue', onclick: () => expandModal(r) }, '🌱 Aumentar'));
  }
  function collectOne(a, obj) {
    const item = G.collect(a); if (!item) return;
    play('collect'); const p = toScreen(obj); toast(`+1 ${ITEMS[item].emoji}`, p.x, p.y); fly(ITEMS[item].emoji, p.x, p.y);
    farm.setAmigoBubbles(a.uid, a.prontos, bubbleEmoji); farm.popAt(obj);
    if (S().tutorial === 3) S().tutorial = 4;
    drawUi(); flushNotices(); updateGuide();
  }
  function collectAll() {
    let i = 0;
    for (const w of farm.walkers) {
      const a = S().amigos.find((x) => x.uid === w.uid); if (!a) continue;
      for (let k = 0; k < a.prontos; k++) setTimeout(() => collectOne(a, w.bubbles[w.bubbles.length - 1] || w.c), 140 * i++);
    }
  }
  // tocar / arrastar no 3D
  const cv = $('#stage'); let down = null;
  const pd = (e) => { down = { x: e.clientX, y: e.clientY, moved: 0 }; };
  const pm = (e) => { if (!down) return; const dx = e.clientX - down.x; down.moved += Math.abs(dx) + Math.abs(e.clientY - down.y); farm.rotate(dx); down.x = e.clientX; down.y = e.clientY; };
  const pu = (e) => {
    if (!down) return; const moved = down.moved; down = null; if (moved > 12) return;
    let hit = farm.pick(rayAt(e.clientX, e.clientY));
    if (!hit) { // dedinho de criança: vale tocar perto do amigo
      let best = null, bd = 90;
      for (const w of farm.walkers) { const p = toScreen(w.c, w.c.userData.height * 0.6); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = w; } }
      if (best) hit = { tipo: 'amigo', walker: best, obj: best.c };
    }
    if (!hit) return;
    if (hit.tipo === 'bolha' || (hit.tipo === 'amigo' && S().amigos.find((x) => x.uid === hit.walker.uid)?.prontos > 0)) {
      const a = S().amigos.find((x) => x.uid === hit.walker.uid); collectOne(a, hit.tipo === 'bolha' ? hit.obj : hit.walker.c);
    } else if (hit.tipo === 'amigo') {
      const a = S().amigos.find((x) => x.uid === hit.walker.uid); hit.walker.c.userData.ctrl.jump();
      if (G.pet(a)) { play('heart'); const p = toScreen(hit.walker.c, hit.walker.c.userData.height); toast('💕 +3', p.x, p.y); }
      else play('pop');
      amigoMiniModal(a);
    } else if (hit.tipo === 'brilho') {
      const item = G.collectSparkle(r.id); if (!item) return;
      play('coin'); const p = toScreen(hit.obj); toast(`+1 ${ITEMS[item].emoji}`, p.x, p.y); fly(ITEMS[item].emoji, p.x, p.y); farm.popAt(hit.obj, '#fff3a0'); farm.removeSparkle(hit.obj);
    } else if (hit.tipo === 'npc') {
      if (!g.salvo) rescueModal(r, farm); else { hit.obj.userData.ctrl.happy(); play('heart'); }
    }
  };
  const wheel = (e) => farm.zoomBy(e.deltaY > 0 ? 1.08 : 0.92);
  cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); cv.addEventListener('wheel', wheel, { passive: true });
  farmSync = () => {
    for (const w of farm.walkers) { const a = S().amigos.find((x) => x.uid === w.uid); if (a && w.bubbles.length !== a.prontos) farm.setAmigoBubbles(a.uid, a.prontos, bubbleEmoji); }
    drawUi();
  };
  let lastSpark = g.brilhos;
  farmSparkSync = () => { if (g.brilhos !== lastSpark) { lastSpark = g.brilhos; farm.setSparkles(g.brilhos); } };
  cleanup = () => { cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); cv.removeEventListener('wheel', wheel); farmSync = null; farmSparkSync = null; };
  drawUi();
}
let farmSync = null, farmSparkSync = null;
function amigoMiniModal(a) {
  modal((box, close) => {
    const s = SPECIES[a.sp]; const c = G.cycleTime(a, a.local);
    box.append(h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 160 }), style: 'width:130px' }), h('h2', {}, G.nomeDe(a)),
      h('p', {}, `Nível ${a.nivel} · ${s.estagio} · `, h('span', { class: 'stars' }, stars(s.rar))),
      h('p', { class: 'muted' }, a.prontos >= G.farmCap(a.local) ? 'Cestinha cheia! Colha as bolhas 🧺' : `Colhe 1 item a cada ${fmtTime(c)}`),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost small', onclick: () => { close(); go('perfil', a.uid); } }, '👀 Ver amigo'),
        h('button', { class: 'btn ghost small', onclick: () => { G.placeAmigo(a, null); close(); go('fazenda'); } }, '🏠 Descansar'),
        h('button', { class: 'btn small', onclick: close }, 'OK')));
  });
}
function pickAmigoModal(r) {
  modal((box, close) => {
    const n = G.amigosEm(r.id).length, cap = G.farmSlots(r.id);
    box.append(h('h2', {}, `Quem vai para ${r.nome}?`), h('p', { class: 'muted' }, `${n}/${cap} lugares · ⚡ = do mesmo elemento, colhe mais rápido`));
    if (n >= cap) box.append(h('p', {}, '🏡 A fazendinha está cheia. Toque em 🌱 Aumentar para caber mais amigos!'));
    const list = S().amigos.filter((a) => a.local !== r.id).sort((a, b) => (SPECIES[b.sp].el === r.el) - (SPECIES[a.sp].el === r.el) || b.nivel - a.nivel);
    if (!list.length) box.append(h('p', {}, 'Todos os seus amigos já estão aqui. Faça mais amigos no Ninho! 🌈'));
    const grid = h('div', { class: 'pickgrid' });
    for (const a of list) grid.append(monCard(a, () => {
      if (n >= cap) { play('sad'); return; }
      if (G.placeAmigo(a, r.id)) { play('collect'); if (S().tutorial < 3) S().tutorial = 3; close(); go('fazenda'); }
    }, { tag: SPECIES[a.sp].el === r.el || SPECIES[a.sp].el === 'arco' ? '⚡' : a.local ? '🏡' : '' }));
    box.append(grid, h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Fechar')));
  });
}
function expandModal(r) {
  modal((box, close) => {
    const c = G.expandCost(r.id); const s = S();
    box.append(h('div', { class: 'big' }, '🌱🏡'), h('h2', {}, 'Aumentar a fazendinha'), h('p', {}, `Nível ${s.regioes[r.id].fazenda} → ${s.regioes[r.id].fazenda + 1}: mais 1 lugar para amigos, a ilha cresce e os itens raros aparecem mais!`),
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
      reqRow(helpers.length > 0, `${ELEMENTS[res.precisa.el].icone} Amigo de ${ELEMENTS[res.precisa.el].nome}${res.precisa.estagio ? ` (${stage} ou maior)` : ''}`),
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
          bx.append(h('img', { src: thumb(0, { npc: res, size: 192 }), style: 'width:150px' }), h('h2', {}, `${res.quem} está salv${res.g}! 🎉`), h('p', {}, `“Muito obrigad${res.g}, ${G.nomeDe(chosen)}! Vou te pedir umas coisinhas de vez em quando, tá?”`),
            h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${premio.moedas}`), h('div', { class: 'r ok' }, '🌟 +1 Brilho de Crescer'), h('div', { class: 'r ok' }, '🌈 +1 Pó de Arco-íris'), premio.coracao ? h('div', { class: 'r ok' }, '💖 +1 Coração de Amizade') : null),
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
  const head = h('div', { class: 'title' }, '💞 Meus amigos', h('small', {}, `${s.amigos.length} amigos`));
  const festaBtn = h('button', { class: 'btn small ' + (s.festa?.pronta ? 'gold pointing' : 'ghost'), onclick: festaModal }, s.festa?.pronta ? '🎈 Ovo da Festa pronto!' : '🎈 Festa da Amizade');
  sc.append(h('div', { class: 'row wrap' }, head, h('div', { class: 'grow' }), festaBtn));
  const tabs = h('div', { class: 'tabs' });
  const els = [...G.ownedElements()];
  for (const [k, label] of [['todos', 'Todos'], ['fazenda', '🏡 Trabalhando'], ['livres', '🏠 Descansando'], ...ELEMENT_ORDER.concat('arco').filter((e) => els.includes(e)).map((e) => [e, ELEMENTS[e].icone + ' ' + ELEMENTS[e].nome])])
    tabs.append(h('button', { class: 'tab' + (amigosTab === k ? ' on' : ''), onclick: () => { amigosTab = k; play('tap'); go('amigos'); } }, label));
  sc.append(tabs);
  let list = s.amigos.slice();
  if (amigosTab === 'fazenda') list = list.filter((a) => a.local); else if (amigosTab === 'livres') list = list.filter((a) => !a.local); else if (amigosTab !== 'todos') list = list.filter((a) => SPECIES[a.sp].el === amigosTab);
  list.sort((a, b) => RARITY_ORDER.indexOf(SPECIES[b.sp].rar) - RARITY_ORDER.indexOf(SPECIES[a.sp].rar) || b.nivel - a.nivel);
  const grid = h('div', { class: 'grid' });
  if (!s.amigos.length) grid.append(h('div', { class: 'card' }, 'Você ainda não tem amigos. Vá ao 🌈 Ninho e misture itens para fazer o primeiro!'));
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
      s.stage < 2 ? h('p', { class: 'muted', style: 'margin:0' }, `🌟 Evolui no nível ${EVOLVE_AT[s.stage]} com ${EVOLVE_COST[s.stage]} Brilho de Crescer → vira ${S().descobertos[a.sp + 1] ? SPECIES[a.sp + 1].nome : '???'}`) : h('p', { class: 'muted', style: 'margin:0' }, '🏅 Já é Adulto! Pode ir à Festa da Amizade.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn ghost small', disabled: petLeft > 0, onclick: () => { if (G.pet(a)) { show.hearts(); show.happy(); play('heart'); draw(); } } }, petLeft > 0 ? `💕 Carinho em ${fmtTime(petLeft)}` : '💕 Fazer carinho'),
        h('button', { class: 'btn green small', onclick: () => placeModal(a, () => draw()) }, '🏡 Fazendinha'),
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
    box.append(h('div', { class: 'big' }, '🎈🎉'), h('h2', {}, 'Festa da Amizade'));
    if (!G.festaLiberada()) { box.append(h('p', {}, 'Quando você chegar ao nível 6, dois amigos Adultos poderão fazer uma festa e ganhar um ovo especial!'), h('p', { class: 'muted' }, 'Só na festa nascem os amigos Arco-íris 🌈 e o Mítico 🦄!'), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Entendi'))); return; }
    if (s.festa) {
      if (s.festa.pronta) { box.append(h('p', {}, 'A festa acabou e deixou um ovo especial! 🥚'), h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: () => { close(); go('ninho', { festa: true }); } }, '🥚 Chocar no Ninho'))); }
      else box.append(h('p', {}, `A festa está acontecendo! Volte em ${fmtTime(s.festa.ate - Date.now())}.`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK')));
      return;
    }
    const cand = G.festaCandidates();
    box.append(h('p', {}, 'Escolha 2 amigos Adultos. Eles brincam por 1 minuto e deixam um ovo especial! (Eles não vão embora 💞)'), h('p', { class: 'muted' }, 'Elementos diferentes e raros podem fazer nascer um Arco-íris. Dois Lendários... talvez o Mítico!'));
    if (cand.length < 2) { box.append(h('p', {}, `Você tem ${cand.length} Adulto(s) livre(s). Precisa de 2!`), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK'))); return; }
    const sel = []; const grid = h('div', { class: 'pickgrid' });
    const go2 = h('button', { class: 'btn gold', disabled: true, onclick: () => { if (G.startFesta(sel[0], sel[1])) { play('fanfare'); close(); flushNotices(); go('amigos'); } } }, '🎈 Começar a festa!');
    for (const a of cand) { const c = monCard(a, () => { const i = sel.indexOf(a); if (i >= 0) { sel.splice(i, 1); c.style.outline = ''; } else if (sel.length < 2) { sel.push(a); c.style.outline = '5px solid #ff8fc8'; } go2.disabled = sel.length !== 2; play('tap'); }); grid.append(c); }
    box.append(grid, h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Depois'), go2));
  });
}

// =========================== CÓDICE ===========================
let codexTab = 'todos';
function renderCodice(sc) {
  const n = G.discoveredCount();
  sc.append(h('div', { class: 'title' }, '📖 Códice dos Brilhinhos', h('small', {}, `${n}/150 descobertos`)));
  const goals = h('div', { class: 'goals' }, h('div', { class: 'codex-bar' }, h('i', { style: `width:${(n / 150) * 100}%` })));
  for (const [meta, item, q] of G.codexGoals()) goals.append(h('span', { class: 'goal' + (n >= meta ? ' done' : '') }, `${meta}: ${item === 'brilho' ? '🌟' : ITEMS[item].emoji}×${q}`));
  sc.append(goals);
  const tabs = h('div', { class: 'tabs' });
  for (const [k, label] of [['todos', 'Todos'], ...ELEMENT_ORDER.concat('arco').map((e) => [e, ELEMENTS[e].icone + ' ' + ELEMENTS[e].nome])]) {
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
  if (f.festa) return h('div', { class: 'sub' }, '🎈 Festa da Amizade');
  if (s.stage > 0) return h('div', { class: 'sub' }, `🌟 Evolui no Nv ${EVOLVE_AT[s.stage - 1]}`);
  return h('div', { class: 'recipe' }, ...f.receita.map((id) => h('span', { class: G.has(id) ? '' : 'miss', title: ITEMS[id].nome }, ITEMS[id].emoji)));
}
function codexModal(s) {
  play('tap');
  modal((box, close) => {
    const known = !!S().descobertos[s.id]; const f = FAMILIES[s.fam];
    box.append(h('img', { src: thumb(s.id, { silhouette: !known, size: 256 }), style: 'width:200px' }), h('h2', {}, known ? s.nome : '??? (ainda não descoberto)'),
      h('div', { class: 'row wrap', style: 'justify-content:center' }, rarBadge(s.rar), elChip(s.el), h('span', { class: 'chip' }, s.estagio)));
    if (f.festa) box.append(h('p', {}, '🎈 Este amigo só nasce na Festa da Amizade!'));
    else if (s.stage > 0) box.append(h('p', {}, `🌟 Evolui de ${S().descobertos[s.id - 1] ? SPECIES[s.id - 1].nome : '???'} no nível ${EVOLVE_AT[s.stage - 1]}.`));
    else {
      box.append(h('p', {}, 'Receita para o Ninho Arco-íris:'), h('div', { class: 'row', style: 'justify-content:center;gap:14px' }, ...f.receita.map((id) => token(id, S().itens[id] || 0, null, G.has(id) ? '' : 'off'))));
      const where = [...new Set(f.receita.map((id) => ITEMS[id].el ? regionOf(ITEMS[id].el).nome : id === 'orvalho' ? 'todo lugar' : 'baús, pedidos e resgates'))];
      box.append(h('p', { class: 'muted' }, '📍 Onde achar: ', where.join(' · ')));
    }
    box.append(h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}

// =========================== PEDIDOS ===========================
function renderPedidos(sc) {
  sc.append(h('div', { class: 'title' }, '📜 Pedidos dos amigos', h('small', {}, 'ajude e ganhe prêmios')));
  const wrap = h('div', { class: 'scroll grow' });
  if (S().diario.pendente) wrap.append(h('div', { class: 'card row', style: 'margin-bottom:14px' }, h('span', { style: 'font-size:54px' }, '🎁'), h('div', { class: 'grow' }, h('b', { style: 'font-size:22px' }, 'Presente do dia!'), h('div', { class: 'muted' }, `Você veio ${S().diario.serie} dia(s) seguidos 🔥`)), h('button', { class: 'btn gold', onclick: dailyModal }, 'Abrir')));
  G.fillOrders();
  if (!S().pedidos.length) wrap.append(h('div', { class: 'card' }, h('p', { style: 'font-size:20px' }, '🦸 Salve alguém em perigo no Mapa! Quem você salvar vai te fazer pedidos com prêmios.')));
  const list = h('div', { class: 'orders' });
  for (const o of S().pedidos) {
    const reg = REGIONS.find((r) => r.id === o.regiao);
    let want;
    if (o.tipo === 'itens') want = `Me traz ${o.qtd} ${ITEMS[o.item].emoji} ${ITEMS[o.item].nome}? (você tem ${S().itens[o.item] || 0})`;
    else if (o.tipo === 'amigo') want = `Um amigo de ${ELEMENTS[o.el].icone} ${ELEMENTS[o.el].nome}${o.estagio ? ' (Jovem ou maior)' : ''} pode me ajudar um pouquinho?`;
    else want = `Descubra ${o.alvo} espécies no Códice! (agora: ${G.discoveredCount()})`;
    const p = o.premio;
    const ready = G.orderReady(o);
    list.append(h('div', { class: 'card order' }, h('img', { src: thumb(0, { npc: reg.resgate, size: 160 }) }),
      h('div', { class: 'grow' }, h('div', { class: 'who' }, o.quem), h('div', { class: 'want' }, want),
        h('div', { class: 'prize' }, h('span', { class: 'chip' }, `🪙 ${p.moedas}`), h('span', { class: 'chip' }, `⭐ ${p.xp} xp`), p.brilho ? h('span', { class: 'chip' }, '🌟 1') : null, p.arcoiris ? h('span', { class: 'chip' }, '🌈 1') : null, p.coracao ? h('span', { class: 'chip' }, '💖 1') : null),
        h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn green small' + (ready ? ' pointing' : ''), disabled: !ready, onclick: () => deliver(o) }, ready ? '🎁 Entregar' : 'Ainda não'), h('button', { class: 'btn ghost small', onclick: () => { G.skipOrder(o); play('pop'); go('pedidos'); } }, '🔄 Trocar')))));
  }
  wrap.append(list); sc.append(wrap);
}
function deliver(o) {
  const finish = (helper) => {
    const p = G.deliver(o, helper); if (!p) return; play('coin'); play('fanfare');
    modal((box, close) => { box.append(h('div', { class: 'big' }, '💝'), h('h2', {}, `${o.quem} adorou!`), h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${p.moedas}`), h('div', { class: 'r ok' }, `⭐ +${p.xp}`), p.brilho ? h('div', { class: 'r ok' }, '🌟 +1') : null, p.arcoiris ? h('div', { class: 'r ok' }, '🌈 +1') : null, p.coracao ? h('div', { class: 'r ok' }, '💖 +1') : null), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Oba!'))); });
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
      h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${g.moedas}`), h('div', { class: 'r ok' }, '🌟 +1'), ...Object.entries(g.itens).map(([id, n]) => h('div', { class: 'r ok' }, `${ITEMS[id].emoji} +${n}`))),
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
      h('p', { class: 'muted' }, 'Ganhe experiência colhendo, descobrindo espécies, evoluindo, salvando amigos e entregando pedidos.'),
      h('p', {}, s.nivel < 4 ? '🔓 Nível 4: 4º espaço no Ninho' : s.nivel < 6 ? '🔓 Nível 6: Festa da Amizade' : '🎉 Tudo liberado! Continue subindo para ganhar presentes.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK')));
  });
}
function optionsModal() {
  modal((box, close) => {
    const s = S();
    const sfx = h('button', { class: 'btn ' + (s.som ? 'green' : 'ghost'), onclick: () => { s.som = !s.som; setSfx(s.som); G.save(); close(); optionsModal(); } }, s.som ? '🔊 Sons ligados' : '🔈 Sons desligados');
    const mus = h('button', { class: 'btn ' + (s.musica ? 'green' : 'ghost'), onclick: () => { s.musica = !s.musica; setMusic(s.musica); G.save(); close(); optionsModal(); } }, s.musica ? '🎵 Música ligada' : '🎵 Música desligada');
    box.append(h('h2', {}, '⚙️ Ajustes'), h('div', { class: 'actions' }, sfx, mus),
      h('p', { class: 'muted', style: 'margin-top:20px' }, 'Brilhinhos não tem propaganda nem compras. Tudo se ganha jogando! 💖'),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost small', onclick: () => { close(); resetModal(); } }, '🗑️ Começar de novo'), h('button', { class: 'btn', onclick: close }, 'Fechar')));
  });
}
function resetModal() {
  modal((box, close) => {
    box.append(h('div', { class: 'big' }, '⚠️'), h('h2', {}, 'Começar tudo de novo?'), h('p', {}, 'Todos os amigos, itens e o Códice serão apagados. Peça ajuda a um adulto!'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Não, voltar'), h('button', { class: 'btn ghost', onclick: () => { G.resetGame(); close(); go('mapa'); } }, 'Sim, apagar tudo')));
  });
}

// =========================== GUIA (tutorial) ===========================
function updateGuide() {
  const s = S(); const gEl = $('#guide');
  document.querySelectorAll('#nav .pointing').forEach((b) => b.classList.remove('pointing'));
  let text = null, nav = null;
  const placed = s.amigos.some((a) => a.local);
  if (s.tutorial < 2) { if (screen !== 'ninho') { text = 'Oi! Eu sou o Brilhinho! Vamos criar seu primeiro amigo no Ninho Arco-íris? 🌈'; nav = 'ninho'; } else text = 'Toque em 2 Trevos 🍀 e depois em Misturar!'; }
  else if (s.tutorial === 2 && !placed) { if (screen !== 'fazenda' && screen !== 'ninho') { text = 'Leve seu amigo para a Fazendinha! 🏡'; nav = 'fazenda'; } else if (screen === 'fazenda') text = 'Toque em ➕ Colocar amigo!'; }
  else if (s.tutorial <= 3 && placed) { if (screen === 'fazenda') text = 'Seu amigo vai colher itens. Quando aparecer uma bolha em cima dele, toque nela! Os brilhos no chão também dão itens ✨'; else { text = 'Vá até a Fazendinha colher itens! 🧺'; nav = 'fazenda'; } }
  else if (s.tutorial === 4 && !s.regioes.prado.salvo) { if (screen === 'fazenda') text = 'A Vovó Margarida precisa de ajuda! Junte 3 Trevos e toque nela 🐑'; else { text = 'A Vovó Margarida está pedindo socorro no Prado Florido!'; nav = 'fazenda'; } }
  else if (s.tutorial === 5) { text = 'Você é um herói! Agora veja os 📜 Pedidos, descubra receitas no 📖 Códice e conserte as pontes 🌈 no Mapa!'; setTimeout(() => { if (S().tutorial === 5) { S().tutorial = 6; G.save(); updateGuide(); } }, 9000); }
  if (modalOpen) text = null;
  document.body.classList.toggle('guiding', !!text);
  if (!text) { gEl.hidden = true; return; }
  gEl.hidden = false; $('p', gEl).textContent = text; $('img', gEl).src = thumb(126, { size: 128 });
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
    if (screen === 'fazenda') { if (changed) farmSync?.(); farmSparkSync?.(); }
    updateHud();
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) G.tick(); else G.save(); });
  go(S().amigos.length ? 'mapa' : 'ninho');
  setTimeout(() => $('#splash').classList.add('hide'), 300); setTimeout(() => $('#splash').remove(), 1000);
  flushNotices();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !location.hostname.match(/^(localhost|127\.)/)) navigator.serviceWorker.register('sw.js');
}
start();
