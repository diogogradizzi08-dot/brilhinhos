// Brilhinhos — as telas: Mapa, Forja do Trovão, Fazendinha, Equipe, Códice e Pedidos.
import * as G from './game.js';
import { ITEMS, RARITIES, RARITY_ORDER, ELEMENTS, ELEMENT_ORDER, FAMILIES, SPECIES, REGIONS, ACHIEVEMENTS, EVOLVE_AT, EVOLVE_COST, GROW_ITEM, EL_ITEMS, GUIDE_SPECIES, SKILLS, skillsOf, yieldOf, BUILDINGS, CRAFTS, SKILL_COUNT, FORGE_MIN, CODEX_TOTAL, THEME_ITEM, isSeasonal } from './data.js';
import { initStage, setScene, nestScene, showcaseScene, thumb, rayAt, toScreen, kidShowcaseScene, kidThumb } from './stage3d.js';
import { farmScene } from './farm3d.js';
import { ALL_ZONES, zoneResources } from './world.js';
import { THEMES } from './season.js';
import { SKIN, HAIR_COLORS, COLORS, EYE_COLORS, HAIR, EYES, MOUTH, BROWS, TOPS, BOTTOMS, SHOES, PATTERNS, ACCESSORIES, HEADWEAR, randomKid } from './kidlook.js';
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
  const me = $('#hud-me img'); const src = kidThumb(s.boneco, 96); if (me.getAttribute('src') !== src) me.src = src;
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
  sc.className = '';
  ({ mapa: renderMapa, ninho: renderNinho, fazenda: renderFazenda, amigos: renderAmigos, codice: renderCodice, pedidos: renderPedidos, perfil: renderPerfil, boneco: renderBoneco })[name](sc, arg);
  updateHud(); updateGuide();
}

// =========================== MAPA (mundo aberto) ===========================
// posição de cada região no mapa (em %), ligadas por uma trilha com as pontes rúnicas
const MAP_POS = { floresta: [15, 72], lago: [33, 84], vulcao: [52, 72], picos: [40, 46], geleira: [20, 28], canion: [47, 17], raios: [71, 27], cosmo: [83, 60] };
const MAP_DECO = { floresta: ['🌳', '🌲', '🍄', '🌳'], lago: ['🌊', '🐟', '🌊', '⛵'], vulcao: ['🌋', '🔥', '🪨'], picos: ['☁️', '⛰️', '🪁'], geleira: ['🏔️', '❄️', '⛄'], canion: ['🏜️', '🪨', '🌵'], raios: ['⚡', '🗼', '🌩️'], cosmo: ['🌙', '✨', '🪐'] };
const THEME_DECO = { natal: ['🎄', '🎁', '⛄', '🦌'], ferias: ['🌴', '🏖️', '🐚', '☀️'], carnaval: ['🎭', '🎊', '🎈', '🥁'], pascoa: ['🥚', '🐰', '🌷', '🐣'], junina: ['🌽', '🔥', '🎏', '🎪'], halloween: ['🎃', '🍬', '👻', '🦇'] };
function renderMapa(sc) {
  const tema = G.themeOn();
  sc.append(h('div', { class: 'title' }, '🗺️ Vale das Feras', h('small', {}, 'toque numa região para viajar'), tema ? h('button', { class: 'chip theme-chip', style: `--tc:${THEMES[tema].cor};--tc2:${THEMES[tema].cor2};margin-left:auto`, onclick: () => themeModal(tema) }, THEMES[tema].icone, ' ', THEMES[tema].nome) : null));
  const wrap = h('div', { class: 'wm-wrap grow' }); const map = h('div', { class: 'wm' });
  // fundo desenhado: mar, a ilha grande, a trilha
  const ids = REGIONS.map((r) => r.id); const pts = ids.map((id) => MAP_POS[id]);
  const trail = pts.map(([x, y], i) => (i ? 'L' : 'M') + (x * 10) + ' ' + (y * 6.4)).join(' ');
  const blobs = REGIONS.map((r) => { const [x, y] = MAP_POS[r.id]; return `<radialGradient id="g-${r.id}"><stop offset="0" stop-color="${r.chao}"/><stop offset=".72" stop-color="${r.chao}" stop-opacity=".9"/><stop offset="1" stop-color="${r.chao}" stop-opacity="0"/></radialGradient><ellipse cx="${x * 10}" cy="${y * 6.4}" rx="150" ry="105" fill="url(#g-${r.id})"/>`; }).join('');
  map.innerHTML = `<svg viewBox="0 0 1000 640" preserveAspectRatio="none" class="wm-svg">
    <defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fc3ff"/><stop offset="1" stop-color="#2f7ad6"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter><pattern id="waves" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 q15 -10 30 0 t30 0" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="3"/></pattern></defs>
    <rect width="1000" height="640" fill="url(#sea)"/><rect width="1000" height="640" fill="url(#waves)"/>
    <path d="M60 470 C 40 300 120 120 300 90 C 470 50 640 40 800 110 C 960 180 980 380 930 470 C 880 590 700 620 520 600 C 340 585 120 610 60 470 Z" fill="#f3e2b4" stroke="#fff6dc" stroke-width="10"/>
    <g filter="url(#soft)">${blobs}</g>
    <path d="${trail}" fill="none" stroke="#8a5a34" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 18" opacity=".75"/>
  </svg>`;
  // pontes entre as regiões
  REGIONS.forEach((r, i) => {
    if (!i) return; const [x0, y0] = MAP_POS[REGIONS[i - 1].id], [x1, y1] = MAP_POS[r.id]; const open = S().regioes[r.id].aberta;
    map.append(h('span', { class: 'wm-bridge' + (open ? ' ok' : ''), style: `left:${(x0 + x1) / 2}%;top:${(y0 + y1) / 2}%`, title: open ? 'Ponte consertada' : 'Ponte rúnica quebrada' }, open ? '🌉' : '🧱'));
  });
  // enfeites de cada região (e da época)
  REGIONS.forEach((r, i) => {
    const [x, y] = MAP_POS[r.id]; const list = [...MAP_DECO[r.id], ...(tema ? THEME_DECO[tema].slice(i % 2, i % 2 + 2) : [])];
    list.forEach((e, k) => { const a = k * 2.3 + i, d = 9 + (k % 2) * 3; map.append(h('span', { class: 'wm-deco', style: `left:${x + Math.cos(a) * d}%;top:${y + Math.sin(a) * d * 1.3}%;animation-delay:${k * 0.4}s` }, e)); });
  });
  REGIONS.forEach((r) => {
    const g = S().regioes[r.id]; const [x, y] = MAP_POS[r.id];
    const fam = FAMILIES.find((f) => f.el === r.el);
    const node = h('button', { class: 'wm-node' + (g.aberta ? '' : ' locked') + (r.id === farmRid && g.aberta ? ' here' : ''), style: `left:${x}%;top:${y}%;--c1:${ELEMENTS[r.el].cores[0]};--c2:${ELEMENTS[r.el].cores[1]}` },
      h('span', { class: 'wm-face' }, h('img', { src: thumb(fam.id * 3, { size: 128, silhouette: !g.aberta }), alt: '' })),
      h('span', { class: 'wm-name' }, `${ELEMENTS[r.el].icone} ${r.nome}`));
    if (g.aberta) {
      node.append(h('span', { class: 'wm-tags' }, h('span', {}, `🧱${g.zonas.length}`), h('span', {}, `🐾${G.amigosEm(r.id).length}`), g.salvo ? null : h('span', { class: 'help' }, '❗')));
      node.onclick = () => { play('tap'); farmRid = r.id; go('fazenda'); };
    } else {
      const b = G.bridgeState(r.id); node.append(h('span', { class: 'wm-cloud' }), h('span', { class: 'wm-lock' }, b.ok ? '✨' : '🔒'));
      node.onclick = () => { play('tap'); bridgeModal(r); }; if (b.ok) node.classList.add('pointing');
    }
    map.append(node);
  });
  // você está aqui
  const here = MAP_POS[S().regioes[farmRid]?.aberta ? farmRid : 'floresta'];
  map.append(h('span', { class: 'wm-me', style: `left:${here[0]}%;top:${here[1]}%` }, h('img', { src: kidThumb(S().boneco, 96) }), h('i', {}, S().boneco.nome || 'Você')));
  map.append(h('span', { class: 'wm-compass' }, '🧭'));
  wrap.append(map); sc.append(wrap);
  const fit = () => { const W = wrap.clientWidth, H = wrap.clientHeight; const k = Math.min(W / 1000, H / 640); map.style.width = 1000 * k + 'px'; map.style.height = 640 * k + 'px'; };
  requestAnimationFrame(fit); const ro = new ResizeObserver(fit); ro.observe(wrap); cleanup = () => ro.disconnect();
}

// =========================== MEU PERSONAGEM ===========================
let kidTab = 'cabelo';
function renderBoneco(sc, arg = {}) {
  const look = structuredClone(S().boneco); const first = !look.criado;
  const show = kidShowcaseScene(look); setScene(show);
  $('#sky').style.background = 'radial-gradient(circle at 30% 45%, #8fd0ff, #3a5aa8 70%, #24345e)';
  const panel = h('div', { class: 'kid-panel' });
  sc.append(h('div', { class: 'title kid-title' }, first ? '✨ Crie seu personagem!' : '👤 Meu personagem', h('small', {}, 'arraste para girar · troque quando quiser')), h('div', { class: 'grow passthru' }), panel);
  sc.classList.add('kid-screen');
  const changed = (react = true) => { show.set(look, react); };
  const sw = (cur, colors, set) => h('div', { class: 'swatches' }, ...colors.map((c) => h('button', { class: 'sw' + (c === cur ? ' on' : ''), style: `background:${c}`, onclick: () => { set(c); play('tap'); changed(); draw(); } })));
  const chips = (cur, list, set, extra) => h('div', { class: 'opts' }, ...list.map(([k, label, ico]) => h('button', { class: 'opt' + (k === cur ? ' on' : ''), onclick: () => { set(k); play('tap'); changed(); draw(); } }, ico ? h('span', {}, ico) : null, label, extra?.(k))));
  const patStyle = (p, c) => ({ liso: c, listras: `repeating-linear-gradient(0deg, ${c} 0 7px, #fff 7px 11px)`, bolinhas: `radial-gradient(#fff 3px, transparent 3.5px) 0 0/12px 12px, ${c}`, xadrez: `linear-gradient(90deg, #ffffff66 50%, transparent 50%) 0 0/14px 14px, linear-gradient(#ffffff66 50%, transparent 50%) 0 0/14px 14px, ${c}`, camuflado: `radial-gradient(circle at 30% 30%, #0003 25%, transparent 26%) 0 0/16px 16px, radial-gradient(circle at 70% 60%, #fff3 22%, transparent 23%) 0 0/18px 18px, ${c}` }[p] || c);
  const pats = (cur, color, set) => h('div', { class: 'opts' }, ...PATTERNS.map(([k, label]) => h('button', { class: 'opt pat' + (k === cur ? ' on' : ''), onclick: () => { set(k); play('tap'); changed(); draw(); } }, h('i', { style: `background:${patStyle(k, color)}` }, { estrelas: '★', raios: '⚡', coracoes: '♥' }[k] || ''), label)));
  const sec = (t, ...kids) => h('div', { class: 'kid-sec' }, h('div', { class: 'sec-h' }, t), ...kids);
  function draw() {
    panel.innerHTML = '';
    const tabs = h('div', { class: 'tabs kid-tabs' });
    for (const [k, label] of [['nome', '✏️ Nome'], ['cabelo', '💇 Cabelo'], ['rosto', '😊 Rosto'], ['roupa', '👕 Roupas'], ['pes', '👟 Calçados'], ['acess', '🎒 Acessórios']]) tabs.append(h('button', { class: 'tab' + (kidTab === k ? ' on' : ''), onclick: () => { kidTab = k; play('tap'); draw(); } }, label));
    const body = h('div', { class: 'kid-body' });
    if (kidTab === 'nome') {
      const inp = h('input', { class: 'kid-name', maxlength: 14, placeholder: 'Seu nome aqui', value: look.nome || '' });
      inp.addEventListener('input', () => { look.nome = inp.value.trim(); }); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
      body.append(sec('Como você quer ser chamado?', inp), sec('Sem ideia?', h('button', { class: 'btn ghost', onclick: () => { Object.assign(look, randomKid(look), { nome: look.nome, criado: look.criado }); play('hatch', 2); changed(); draw(); } }, '🎲 Visual surpresa!')));
      setTimeout(() => first && inp.focus(), 50);
    } else if (kidTab === 'cabelo') {
      body.append(sec('Corte', chips(look.cabelo.estilo, HAIR, (k) => { look.cabelo.estilo = k; })), sec('Cor do cabelo', sw(look.cabelo.cor, HAIR_COLORS, (c) => { look.cabelo.cor = c; })));
    } else if (kidTab === 'rosto') {
      body.append(sec('Cor da pele', sw(look.pele, SKIN, (c) => { look.pele = c; })),
        sec('Olhos', chips(look.olhos.tipo, EYES, (k) => { look.olhos.tipo = k; }), sw(look.olhos.cor, EYE_COLORS, (c) => { look.olhos.cor = c; })),
        sec('Boca', chips(look.boca, MOUTH, (k) => { look.boca = k; })),
        sec('Sobrancelhas', chips(look.sobrancelha, BROWS, (k) => { look.sobrancelha = k; })),
        sec('Detalhes', h('div', { class: 'opts' }, h('button', { class: 'opt' + (look.sardas ? ' on' : ''), onclick: () => { look.sardas = !look.sardas; play('tap'); changed(); draw(); } }, '🟤 Sardinhas'), h('button', { class: 'opt' + (look.bochechas ? ' on' : ''), onclick: () => { look.bochechas = !look.bochechas; play('tap'); changed(); draw(); } }, '🌸 Bochechas rosadas'))));
    } else if (kidTab === 'roupa') {
      body.append(sec('Parte de cima', chips(look.topo.tipo, TOPS, (k) => { look.topo.tipo = k; }), sw(look.topo.cor, COLORS, (c) => { look.topo.cor = c; }), pats(look.topo.estampa, look.topo.cor, (k) => { look.topo.estampa = k; })),
        sec('Parte de baixo', chips(look.baixo.tipo, BOTTOMS, (k) => { look.baixo.tipo = k; }), sw(look.baixo.cor, COLORS, (c) => { look.baixo.cor = c; }), pats(look.baixo.estampa, look.baixo.cor, (k) => { look.baixo.estampa = k; })));
    } else if (kidTab === 'pes') {
      body.append(sec('Calçado', chips(look.calcado.tipo, SHOES, (k) => { look.calcado.tipo = k; })), sec('Cor', sw(look.calcado.cor, COLORS, (c) => { look.calcado.cor = c; })));
    } else {
      look.acess ||= {};
      for (const [id, label, ico] of ACCESSORIES) {
        const on = !!look.acess[id]?.on;
        const row = h('div', { class: 'acc-row' + (on ? ' on' : '') }, h('button', { class: 'opt' + (on ? ' on' : ''), onclick: () => {
          if (on) delete look.acess[id];
          else { if (HEADWEAR.includes(id)) for (const hw of HEADWEAR) delete look.acess[hw]; if (id === 'oculos') delete look.acess.oculos_sol; if (id === 'oculos_sol') delete look.acess.oculos; look.acess[id] = { on: true, cor: look.acess[id]?.cor || COLORS[(ACCESSORIES.findIndex((a) => a[0] === id) * 3) % COLORS.length] }; }
          play('tap'); changed(); draw();
        } }, h('span', {}, ico), label, h('b', {}, on ? ' ✓' : '')));
        if (on && !['relogio'].includes('x')) row.append(sw(look.acess[id].cor, COLORS, (c) => { look.acess[id].cor = c; }));
        body.append(row);
      }
    }
    panel.append(tabs, body, h('div', { class: 'actions kid-actions' },
      h('button', { class: 'btn ghost small', onclick: () => { Object.assign(look, randomKid(look), { nome: look.nome, criado: look.criado }); play('hatch', 2); changed(); draw(); } }, '🎲 Surpresa'),
      first ? null : h('button', { class: 'btn ghost small', onclick: () => { play('tap'); go(arg.back || 'mapa'); } }, 'Cancelar'),
      h('button', { class: 'btn green', onclick: () => {
        look.criado = true; if (!look.nome) look.nome = 'Aventureiro';
        S().boneco = look; G.save(); play('fanfare'); show.cheer(); updateHud();
        setTimeout(() => go(first ? (S().amigos.length ? 'mapa' : 'ninho') : (arg.back || 'mapa')), 700);
      } }, first ? '✔ Começar a aventura!' : '✔ Pronto!')));
  }
  draw();
  // girar o personagem arrastando
  const cv = $('#stage'); let down = null;
  const pd = (e) => { down = { x: e.clientX }; }, pm = (e) => { if (!down) return; show.turn(e.clientX - down.x); down.x = e.clientX; }, pu = () => { if (down) { down = null; } };
  const tap = (e) => { if (show.onTap(rayAt(e.clientX, e.clientY))) play('heart'); };
  cv.addEventListener('pointerdown', pd); cv.addEventListener('click', tap); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu);
  cleanup = () => { sc.classList.remove('kid-screen'); cv.removeEventListener('pointerdown', pd); cv.removeEventListener('click', tap); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); };
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
      top.append(h('div', { class: 'nest-hint' }, chosen.length < FORGE_MIN ? `Coloque ${FORGE_MIN - chosen.length} ${FORGE_MIN - chosen.length === 1 ? 'item' : 'itens'} na bigorna (mínimo ${FORGE_MIN})` : 'Pronto! Toque em Forjar' + (chosen.length < G.nestSlots() ? ` (cabe mais ${G.nestSlots() - chosen.length})` : '')));
      const slots = h('div', { class: 'slots' });
      for (let i = 0; i < G.nestSlots(); i++) {
        const id = chosen[i];
        slots.append(h('button', { class: 'slot' + (id ? ' full' : ''), style: id ? `--rc:${itemRing(id)}` : '', onclick: () => { if (!id) return; play('pop'); chosen.splice(i, 1); draw(); } }, id ? ITEMS[id].emoji : ''));
      }
      top.append(slots);
      if (chosen.length >= FORGE_MIN) top.append(previewEl());
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
        if (S().tutorial < 2 && chosen.length < FORGE_MIN && ['trevo', 'concha', 'brasa'].includes(id)) t.classList.add('pointing');
        tray.append(t);
      }
      const mixBtn = h('button', { class: 'btn', disabled: chosen.length < FORGE_MIN, onclick: startStir }, '🔨 Forjar!');
      if (S().tutorial < 2 && chosen.length >= FORGE_MIN) mixBtn.classList.add('pointing');
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
    if (p.tema) { const T = THEMES[p.tema]; return h('div', { class: 'chance theme-chance', style: `--tc:${T.cor};--tc2:${T.cor2}` }, T.icone, h('b', {}, `Vai sair um bicho de ${T.nome}!`), h('span', { class: 'muted' }, 'fica com você para sempre')); }
    const ch = p.chances; const good = (ch.raro + ch.epico + ch.lendario) * 100;
    const bar = h('div', { class: 'row', style: 'gap:2px;width:160px' }, ...['comum', 'incomum', 'raro', 'epico', 'lendario'].map((r) => h('i', { style: `width:${Math.max(ch[r] * 100, ch[r] > 0.001 ? 3 : 0)}%;background:${rarColor(r)}` })));
    const els = Object.entries(G.elementChances(chosen)).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 0.05).slice(0, 4);
    return h('div', { class: 'chance' }, '⚡', bar, h('b', {}, good < 5 ? 'fraca' : good < 15 ? 'boa' : good < 30 ? 'forte' : 'máxima!'),
      h('span', { class: 'elodds', title: 'Elementos que podem sair' }, ...els.map(([e, v]) => h('span', { title: ELEMENTS[e].nome, style: `font-size:${15 + Math.round(v * 18)}px` }, ELEMENTS[e].icone)), h('span', { class: 'muted' }, '+?')));
  }
  // --- martelar na bigorna ---
  let zone = null; const HITS = 6;
  function startStir() {
    if (chosen.length < FORGE_MIN) return;
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
    const a = res.amigo; const s = SPECIES[a.sp]; const rc = rarColor(s.rar);
    const wide = innerWidth >= 900 && innerWidth / innerHeight > 1.2;
    top.append(h('div', { class: 'reveal-banner' + (wide ? ' left' : ''), style: `--rc:${rc}` },
      h('small', {}, res.novo ? (res.exato ? 'RECEITA CERTA!' : 'NOVA DESCOBERTA!') : 'MAIS UM PARA A EQUIPE!'),
      h('b', {}, G.nomeDe(a))));
    cleanupRays();
    nest.setPresent(wide ? 1.1 : 0, wide ? 0 : 0.42);
    const rays = h('div', { class: 'rays r-' + s.rar + (wide ? ' left' : ''), style: `--rc:${rc}` }); document.body.append(rays);
    cleanupRays = () => { rays.remove(); cleanupRays = () => {}; };
    const st = h('span', { class: 'stars pop-stars', style: 'font-size:28px' }, ...Array.from({ length: RARITIES[s.rar].estrelas }, (_, i) => h('i', { style: `animation-delay:${0.3 + i * 0.2}s` }, '★')));
    const card = h('div', { class: 'card reveal' + (wide ? ' side' : ''), style: `--rc:${rc}` },
      h('div', { class: 'row wrap', style: 'justify-content:center' },
        h('span', { class: 'chip num' }, '#' + String(s.id + 1).padStart(3, '0') + ' / 450'),
        res.novo ? h('span', { class: 'tag-new' }, 'NOVO!') : null, rarBadge(s.rar), st, a.shiny ? h('span', { class: 'chip shiny' }, '✨ Cintilante!') : null),
      h('div', { class: 'row wrap', style: 'justify-content:center;margin-top:6px' }, elChip(s.el), h('span', { class: 'chip' }, '⚡ ', ELEMENTS[s.el].dom), h('span', { class: 'chip' }, s.estagio)),
      workPanel(a.sp),
      evoLine(a.sp, null),
      res.novo && !res.exato && res.fam.receita ? h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'A receita dele agora está no Códice 📖') : null,
      h('div', { class: 'row wrap', style: 'justify-content:center;margin-top:10px' },
        h('button', { class: 'btn ghost small', onclick: () => renameModal(a, () => { top.innerHTML = ''; bottom.innerHTML = ''; bottom.append(revealCard(res)); }) }, '✏️ Dar nome'),
        h('button', { class: 'btn green small', onclick: () => { cleanupRays(); placeModal(a, (rid) => { farmRid = rid; go('fazenda'); }); } }, '🏡 Mandar trabalhar'),
        h('button', { class: 'btn small', onclick: () => { cleanupRays(); nest.clearCreature(); phase = 'pick'; draw(); } }, '🔨 Forjar outro')));
    return card;
  }
  let cleanupRays = () => {};
  if (arg?.fusao) { result = G.hatchFusao(); if (result) toEgg(); else draw(); }
  else draw();
  cleanup = () => { zone?.remove(); cleanupRays(); nest.clearItems(); };
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
const kidSpot = {}; // onde o personagem estava em cada fazendinha (para voltar no mesmo lugar)
function resourcesView(r) {
  const g = S().regioes[r.id]; const t = Date.now(); const out = [];
  for (const k of ALL_ZONES) {
    const open = g.zonas.includes(k);
    for (const res of zoneResources(r.id, r.el, k)) {
      const st = g.rec[res.id]; const vivo = !open || !st || st.livre <= t;
      out.push({ ...res, vivo, bloqueado: !open, cresce: vivo || !st ? 1 : Math.max(0, 1 - (st.livre - t) / G.RESPAWN) });
    }
  }
  return out;
}
function obrasView(rid) { const t = Date.now(); return G.obrasOf(rid).map((o) => ({ ...o, grow: o.st === 'regado' ? Math.min(1, 1 - (o.ate - t) / G.GROW_TIME) : 0 })); }
// barra lateral: um atalho para cada fazendinha
function farmRail(cur) {
  const rail = h('div', { class: 'farm-rail' }, h('button', { class: 'rail-map', title: 'Mapa do Vale', onclick: () => { play('tap'); go('mapa'); } }, '🗺️', h('small', {}, 'Mapa')));
  let shownLocked = false;
  for (const rr of REGIONS) {
    const open = S().regioes[rr.id].aberta;
    if (!open && shownLocked) continue;
    const fam = FAMILIES.find((f) => f.el === rr.el);
    const ready = open && G.amigosEm(rr.id).some((a) => a.bolsa?.length);
    const help = open && !S().regioes[rr.id].salvo;
    const btn = h('button', { class: 'rail-btn' + (rr.id === cur ? ' on' : '') + (open ? '' : ' locked'), style: `--c1:${ELEMENTS[rr.el].cores[0]};--c2:${ELEMENTS[rr.el].cores[1]}`, title: rr.nome,
      onclick: () => { play('tap'); if (!open) return bridgeModal(rr); if (rr.id !== cur) { farmRid = rr.id; go('fazenda'); } } },
      h('span', { class: 'rail-face' }, h('img', { src: thumb(fam.id * 3, { size: 96, silhouette: !open }), alt: '' })),
      h('span', { class: 'rail-el' }, open ? ELEMENTS[rr.el].icone : '🔒'),
      h('span', { class: 'rail-name' }, rr.nome),
      ready ? h('i', { class: 'dot' }) : help ? h('i', { class: 'rail-help' }, '!') : null);
    if (!open) shownLocked = true;
    rail.append(btn);
  }
  return rail;
}
function renderFazenda(sc, arg) {
  if (!S().regioes[farmRid]?.aberta) farmRid = 'floresta';
  const r = REGIONS.find((x) => x.id === farmRid); const g = S().regioes[r.id];
  const amigos = G.amigosEm(r.id); const tema = G.themeOn();
  $('#sky').style.background = `linear-gradient(180deg, ${r.ceu[0]} 0%, ${r.ceu[1]} 70%)`;
  const bagEmoji = (a) => (a.bolsa?.length ? ITEMS[a.bolsa[a.bolsa.length - 1]]?.emoji : '🎁');
  const farm = farmScene(r, {
    zonas: g.zonas, abriveis: G.expandOptions(r.id).map((k) => ({ key: k })), recursos: resourcesView(r), obras: obrasView(r.id),
    amigos: amigos.map((a) => ({ uid: a.uid, spId: a.sp, shiny: a.shiny, arch: SPECIES[a.sp].arch, stage: SPECIES[a.sp].stage, bolsa: a.bolsa?.length || 0, emoji: bagEmoji(a) })),
    brilhos: g.brilhos, resgate: { salvo: g.salvo }, tema, kid: S().boneco, reveal: arg?.reveal, spawn: kidSpot[r.id],
  });
  setScene(farm);
  // ---------- interface ----------
  const rail = farmRail(r.id);
  const info = h('div', { class: 'farm-info' });
  const workers = h('div', { class: 'workers' });
  const side = h('div', { class: 'farm-side' });
  const build = h('div', { class: 'build-panel', hidden: true });
  sc.append(rail, info, side, h('div', { class: 'grow passthru' }), workers, build);
  sc.classList.add('farm-screen'); const unclass = () => sc.classList.remove('farm-screen');
  function drawUi() {
    info.innerHTML = ''; side.innerHTML = ''; workers.innerHTML = '';
    const am = G.amigosEm(r.id); const ready = am.reduce((t, a) => t + (a.bolsa?.length || 0), 0);
    info.append(h('span', { class: 'chip farm-title', style: `--c1:${ELEMENTS[r.el].cores[0]}` }, ELEMENTS[r.el].icone, ' ', r.nome),
      h('span', { class: 'chip', title: 'Lotes liberados' }, `🧱 Nível ${G.farmLevel(r.id)} · ${g.zonas.length}/25 lotes`),
      h('span', { class: 'chip', title: 'Companheiros trabalhando aqui' }, `🐾 ${am.length}/${G.farmSlots(r.id)}`));
    if (tema) info.append(h('button', { class: 'chip theme-chip', style: `--tc:${THEMES[tema].cor};--tc2:${THEMES[tema].cor2}`, onclick: () => themeModal(tema) }, THEMES[tema].icone, ' ', THEMES[tema].nome));
    if (!g.salvo) info.append(h('button', { class: 'rescue-banner', onclick: () => goNpc() }, h('img', { src: thumb(0, { npc: r.resgate, size: 128 }) }), h('b', {}, `Socorro! Ajude ${r.resgate.quem}!`)));
    for (const a of am) {
      const tk = G.taskOf(a); const ti = G.TASK_INFO[tk] || { icone: '💤', nome: 'Descansando' };
      workers.append(h('button', { class: 'worker' + (tk === 'cheio' ? ' full' : ''), title: `${G.nomeDe(a)}: ${ti.nome}`, onclick: () => amigoMiniModal(a) }, h('img', { src: thumb(a.sp, { shiny: a.shiny, size: 96 }) }), h('span', {}, ti.icone), a.bolsa?.length ? h('i', { class: 'n' }, a.bolsa.length) : null));
    }
    const sideBtn = (ico, label, cls, onclick, extra) => h('button', { class: 'side-btn ' + cls, onclick }, h('span', { class: 'ico' }, ico), h('span', { class: 'lb' }, label), extra || null);
    const place = sideBtn('➕', 'Bicho', 'green', () => pickAmigoModal(r));
    if (S().tutorial === 2 && !am.length) place.classList.add('pointing');
    const getAll = sideBtn('🎒', 'Pegar tudo', 'gold' + (ready && S().tutorial === 3 ? ' pointing' : ''), collectAll, ready ? h('i', { class: 'n' }, ready) : null); if (!ready) getAll.disabled = true;
    const canBuild = Object.keys(BUILDINGS).some((id) => G.buildState(id, r.id).ok);
    side.append(sideBtn('🔨', 'Construir', 'blue' + (canBuild && S().tutorial >= 4 && !S().base.bancada ? ' pointing' : ''), () => openBuild()), place, getAll,
      sideBtn('🧱', 'Aumentar', 'violet', () => { play('tap'); const ab = G.expandOptions(r.id); toast('Toque num cadeado dourado 🔒✨', innerWidth / 2 - 60, innerHeight / 2); if (ab.length === 1) expandZoneModal(r, ab[0]); }),
      sideBtn(h('img', { src: kidThumb(S().boneco, 96) }), 'Visual', 'ghost', () => { play('tap'); go('boneco', { back: 'fazenda' }); }));
  }
  // ---------- o personagem faz as coisas ----------
  const busy = () => farm.kidBusy;
  const say = (txt, obj, dy = 1) => { const p = obj ? toScreen(obj, dy) : { x: innerWidth / 2, y: innerHeight / 2 }; toast(txt, p.x, p.y); };
  const flyItems = (got, obj) => {
    const cnt = {}; for (const it of got) cnt[it] = (cnt[it] || 0) + 1;
    const p = obj?.isVector3 ? toScreenV(obj) : toScreen(obj || farm.kid, 1.2);
    toast(Object.entries(cnt).map(([id, n]) => `+${n} ${ITEMS[id].emoji}`).join(' '), p.x, p.y);
    Object.keys(cnt).forEach((id, i) => setTimeout(() => fly(ITEMS[id].emoji, p.x, p.y), i * 120));
  };
  const toScreenV = (v) => { const o = new farm.kid.constructor(); o.position.copy(v); farm.world.add(o); o.updateMatrixWorld(); const p = toScreen(o); farm.world.remove(o); return p; };
  function goNpc() {
    farm.walkTo(farm.npcPos.x, farm.npcPos.z, { stopAt: 1.2, onArrive: () => { if (!S().regioes[r.id].salvo) rescueModal(r, farm); else { play('heart'); farm.kidAct('acenar', 1.2); } } });
  }
  function gather(hit) {
    const res = hit.data; const acao = G.PLAYER_ACTION[res.tipo];
    if (!hit.vivo) { const st = g.rec[res.id]; say(`⏳ volta em ${fmtTime((st?.livre || 0) - Date.now())}`, hit.obj, 0.6); play('pop'); return; }
    farm.walkTo(res.x, res.z, { stopAt: res.r + 0.42, marker: false, onArrive: () => {
      const dur = { cortar: 2.25, minerar: 2.55, catar: 1.8 }[acao];
      farm.kidAct(acao, dur, () => { play(acao === 'minerar' ? 'anvil' : 'pop', 1); farm.popAt(new farm.kid.position.constructor(res.x, acao === 'cortar' ? 0.9 : 0.5, res.z), acao === 'cortar' ? ['#c9a06a', '#8a6a44'] : acao === 'minerar' ? ['#c0c8d8', '#ffd27a'] : ['#ff6a5a', '#8ee07a'], 8); },
        () => { const out = G.playerGather(r.id, res.id); if (out.erro) { say(out.erro, farm.kid, 1.4); return; } farm.removeResource(res.id); play('collect'); flyItems(out.itens, farm.kid); if (out.itens.length) farm.kidAct('comemorar', 0.5); flushNotices(); sync(); });
    } });
  }
  function plotAction(uid) {
    const pos = farm.obraPos(uid); if (!pos) return;
    const c = G.plotState(r.id, uid); if (!c) return;
    if (c.por) { const who = S().amigos.find((a) => a.uid === c.por); say(`${who ? G.nomeDe(who) : 'Um companheiro'} está cuidando daqui`, farm.obraObj(uid), 1); return; }
    if (c.st === 'regado') { say(`🌱 crescendo… ${fmtTime(c.ate - Date.now())}`, farm.obraObj(uid), 1); return; }
    const acao = { vazio: 'plantar', semeado: 'regar', pronto: 'colher' }[c.st];
    farm.walkTo(pos.x, pos.z, { stopAt: 1.05, marker: false, onArrive: () => {
      const dur = { plantar: 1.6, regar: 2.4, colher: 1.8 }[acao];
      let water = null;
      if (acao === 'regar') water = setInterval(() => { const tip = farm.kid.userData.ctrl.toolTip; if (tip) farm.popAt(tip, ['#8fd8ff', '#ffffff'], 4); }, 140);
      farm.kidAct(acao, dur, () => { if (acao !== 'regar') { play('pop'); farm.popAt(pos.clone().setY(0.3), acao === 'plantar' ? ['#d9b070', '#8ee07a'] : ['#ff6a5a', '#8ee07a'], 8); } }, () => {
        clearInterval(water);
        if (acao === 'plantar' && G.playerPlant(r.id, uid)) { play('drop'); say('🌰 Plantado!', farm.obraObj(uid), 0.8); }
        if (acao === 'regar' && G.playerWater(r.id, uid)) { play('splash'); say('💦 Regado!', farm.obraObj(uid), 0.8); }
        if (acao === 'colher') { const n = G.harvestPlot(r.id, uid); if (n) { play('collect'); flyItems(Array(n).fill('fruta'), farm.kid); farm.kidAct('comemorar', 0.5); } }
        flushNotices(); sync();
      });
    } });
  }
  function petAction(w) {
    farm.walkTo(w.c.position.x, w.c.position.z, { follow: () => farm.walkerPos(w.uid), stopAt: w.r + 0.55, marker: false, onArrive: () => {
      const a = S().amigos.find((x) => x.uid === w.uid); if (!a) return;
      const pp = farm.walkerPos(w.uid); if (pp) { farm.kid.rotation.y = Math.atan2(pp.x - farm.kid.position.x, pp.z - farm.kid.position.z); }
      if (a.bolsa?.length) {
        farm.kidAct('pegar', 0.9, null, () => { const got = G.collect(a); if (!got.length) return; play('collect'); farm.setAmigoBubbles(a.uid, 0); flyItems(got, farm.kid); farm.petHappy(a.uid); if (S().tutorial === 3) S().tutorial = 4; flushNotices(); sync(); updateGuide(); });
      } else {
        farm.kidAct('carinho', 1.6, null, () => { farm.petHappy(a.uid); if (G.pet(a)) { play('heart'); say('💕 +3', farm.kid, 1.3); } else { play('heart'); say('💕', farm.kid, 1.3); } sync(); });
      }
    } });
  }
  function obraAction(hit) {
    const pos = farm.obraPos(hit.uid); const B = BUILDINGS[hit.obra];
    if (hit.obra === 'canteiro') return plotAction(hit.uid);
    farm.walkTo(pos.x, pos.z, { stopAt: B.r + 0.45, marker: false, onArrive: () => {
      if (hit.obra === 'bancada') bancadaModal(r);
      else if (hit.obra === 'forno') fornoModal(r);
      else { play('heart'); farm.kidAct(hit.obra === 'banco' || hit.obra === 'balanco' ? 'comemorar' : 'acenar', 1.1); say(`${B.icone} ${B.nome}`, hit.obj, 1.5); }
    } });
  }
  function collectFrom(a) { const got = G.collect(a); if (!got.length) return; play('collect'); farm.setAmigoBubbles(a.uid, 0); const p = farm.walkerPos(a.uid); if (p) farm.popAt(p.clone().setY(1)); flyItems(got, p || farm.kid); if (S().tutorial === 3) S().tutorial = 4; sync(); flushNotices(); updateGuide(); }
  function collectAll() { let i = 0; for (const w of farm.walkers) { const a = S().amigos.find((x) => x.uid === w.uid); if (a?.bolsa?.length) setTimeout(() => collectFrom(a), 160 * i++); } if (i) farm.kidAct('pegar', 0.9); }
  // ---------- construir: escolher o que e onde ----------
  let bm = null; // { tipo, x, z, rot, mover: uid }
  let buildTab = 'util';
  function openBuild(tab) {
    play('tap'); if (tab) buildTab = tab; bm = null; farm.setGhost(null); build.hidden = false; side.hidden = true; workers.hidden = true; drawBuild();
  }
  function closeBuild() { bm = null; farm.setGhost(null); build.hidden = true; side.hidden = false; workers.hidden = false; }
  function drawBuild() {
    build.innerHTML = '';
    if (bm) { // escolhendo o lugar
      const okPlace = bm.mover ? G.canPlace(r.id, bm.tipo, bm.x, bm.z, bm.mover) : G.canPlace(r.id, bm.tipo, bm.x, bm.z);
      farm.setGhost(bm.tipo, bm.x, bm.z, bm.rot, okPlace.ok);
      const B = BUILDINGS[bm.tipo];
      build.append(h('div', { class: 'place-bar' },
        h('div', { class: 'place-what' }, h('span', { class: 'ci' }, B.icone), h('div', {}, h('b', {}, bm.mover ? `Mover: ${B.nome}` : B.nome), h('div', { class: okPlace.ok ? 'ok-txt' : 'bad-txt' }, okPlace.ok ? '✅ Lugar livre! Toque no chão para mudar.' : `⛔ ${okPlace.motivo}`))),
        h('button', { class: 'btn ghost small', onclick: () => { bm.rot = (bm.rot + Math.PI / 4) % (Math.PI * 2); play('tap'); drawBuild(); } }, '↻ Girar'),
        bm.mover && B.cat !== 'util' || bm.mover && bm.tipo === 'canteiro' ? h('button', { class: 'btn ghost small', onclick: () => { const back = G.removeObra(r.id, bm.mover); if (back) { play('pop'); farm.setObras(obrasView(r.id)); say(`📦 Guardado! Voltou: ${Object.entries(back).map(([id, n]) => `${n}${ITEMS[id].emoji}`).join(' ') || 'nada'}`); flushNotices(); } bm = null; farm.setGhost(null); drawBuild(); } }, '📦 Guardar') : null,
        h('button', { class: 'btn green', disabled: !okPlace.ok, onclick: confirmPlace }, bm.mover ? '✔ Mover aqui' : '✔ Construir aqui'),
        h('button', { class: 'btn ghost small', onclick: () => { bm = null; farm.setGhost(null); play('tap'); drawBuild(); } }, '✖')));
      return;
    }
    const tabs = h('div', { class: 'tabs build-tabs' });
    const cats = [['util', '🛠️ Úteis'], ['enfeite', '🌷 Enfeites'], ...(tema ? [['epoca', `${THEMES[tema].icone} ${THEMES[tema].nome}`]] : []), ['mover', '✋ Mover ou guardar']];
    for (const [k, label] of cats) tabs.append(h('button', { class: 'tab' + (buildTab === k ? ' on' : ''), onclick: () => { buildTab = k; play('tap'); drawBuild(); } }, label));
    const list = h('div', { class: 'build-list' });
    if (buildTab === 'mover') list.append(h('p', { class: 'muted', style: 'margin:6px 10px' }, '👆 Toque numa construção da fazendinha para mudar de lugar, girar ou guardar.'));
    else for (const [id, B] of Object.entries(BUILDINGS)) {
      if (B.cat !== buildTab) continue;
      const st = G.buildState(id, r.id);
      const cost = h('div', { class: 'req mini' }, ...Object.entries(B.custo).map(([it, n]) => h('span', { class: 'c ' + (G.has(it, n) ? 'ok' : 'no') }, `${ITEMS[it].emoji}${S().itens[it] || 0}/${n}`)));
      list.append(h('button', { class: 'build-card' + (st.ok ? '' : ' off'), onclick: () => {
        if (!st.ok) { play('sad'); say(st.done ? 'Já tem o máximo!' : st.locked ? (st.temaFora ? 'Só na época certa!' : `Precisa: ${BUILDINGS[B.precisa].nome}`) : 'Faltam materiais'); return; }
        play('tap'); const f = farm.kidPos; const a = farm.camAng; let x = f.x - Math.sin(a) * 2.2, z = f.z - Math.cos(a) * 2.2; const sp = G.findSpot(r.id, id, x, z) || [x, z]; bm = { tipo: id, x: sp[0], z: sp[1], rot: 0 }; drawBuild();
      } }, h('span', { class: 'ci' }, B.icone), h('b', {}, B.nome), h('small', {}, B.desc), st.done ? h('span', { class: 'badge-ok' }, '✓ Máximo') : st.locked ? h('span', { class: 'muted' }, st.temaFora ? `${THEMES[B.tema].icone} Só na época` : `🔒 ${BUILDINGS[B.precisa].nome}`) : cost,
        st.lim > 1 && st.lim < 40 ? h('span', { class: 'cnt' }, `${st.count}/${st.lim}`) : null));
    }
    build.append(h('div', { class: 'build-head' }, h('b', {}, '🔨 Construir'), h('span', { class: 'muted' }, 'escolha e depois toque onde quer colocar'), h('button', { class: 'btn ghost small', onclick: () => { play('tap'); closeBuild(); } }, 'Fechar')), tabs, list);
  }
  function confirmPlace() {
    if (!bm) return;
    if (bm.mover) { if (G.moveObra(r.id, bm.mover, bm.x, bm.z, bm.rot)) { play('drop'); farm.setObras(obrasView(r.id)); farm.popAt(new farm.kid.position.constructor(bm.x, 0.4, bm.z), ['#ffffff', '#ffd25a'], 20); } bm = null; farm.setGhost(null); drawBuild(); return; }
    const o = G.build(r.id, bm.tipo, bm.x, bm.z, bm.rot); if (!o) { play('sad'); return; }
    const tipo = bm.tipo; bm = null; farm.setGhost(null); closeBuild();
    farm.setObras(obrasView(r.id)); farm.hideObra(o.uid); updateHud();
    const B = BUILDINGS[tipo]; let done = false;
    const finish = () => { if (done) return; done = true; farm.revealObra(o.uid); play('fanfare'); farm.kidAct('comemorar', 0.9); say(`${B.icone} ${B.nome} pronto!`, farm.obraObj(o.uid), 1.6); flushNotices(); sync(); };
    farm.walkTo(o.x, o.z, { stopAt: B.r + 0.5, marker: false, onArrive: () => farm.kidAct('construir', 2.2, () => { play('anvil', 2); farm.popAt(new farm.kid.position.constructor(o.x, 0.3, o.z), ['#c9a06a', '#ffffff', '#ffd25a'], 10); }, finish), onFail: finish });
  }
  // ---------- toques na tela ----------
  const cv = $('#stage'); const ptrs = new Map(); let drag = null, pinch = 0;
  const pd = (e) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() }; else { drag = null; const [a, b2] = [...ptrs.values()]; pinch = Math.hypot(a.x - b2.x, a.y - b2.y); } };
  const pm = (e) => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { const [a, b2] = [...ptrs.values()]; const d = Math.hypot(a.x - b2.x, a.y - b2.y); if (pinch) farm.zoomBy(pinch / d); pinch = d; return; }
    if (!drag) return; const dx = e.clientX - drag.x; drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y); if (drag.moved > 12) farm.rotate(dx); drag.x = e.clientX; drag.y = e.clientY;
  };
  const pu = (e) => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
    if (!drag || e.target !== cv) { drag = null; return; } const moved = drag.moved; drag = null; if (moved > 12) return;
    let hit = farm.pick(rayAt(e.clientX, e.clientY)); if (!hit) return;
    unlockAudio();
    // os companheiros são pequenos: um toque perto deles conta como toque neles
    if (build.hidden && !['brilho', 'npc', 'bolha', 'amigo', 'eu'].includes(hit.tipo)) {
      let best = null, bd = 56;
      for (const w of farm.walkers) { const p = toScreen(w.c, w.c.userData.height * 0.5); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = w; } }
      if (best) hit = { tipo: 'amigo', walker: best, obj: best.c };
    }
    if (!build.hidden) { // modo construir
      if (hit.tipo === 'obra' && (buildTab === 'mover' || bm?.mover)) { const o = G.obrasOf(r.id).find((q) => q.uid === hit.uid); bm = { tipo: o.tipo, x: o.x, z: o.z, rot: o.rot || 0, mover: o.uid }; play('tap'); drawBuild(); return; }
      const p = farm.groundAt(rayAt(e.clientX, e.clientY));
      if (bm && p) { bm.x = Math.round(p.x * 4) / 4; bm.z = Math.round(p.z * 4) / 4; play('tap'); drawBuild(); }
      return;
    }
    if (busy() && hit.tipo !== 'eu') { farm.kid.userData.ctrl.stop(); }
    switch (hit.tipo) {
      case 'eu': play('heart'); farm.kidAct('acenar', 1.2); say(`Oi! Eu sou ${S().boneco.nome || 'você'} 👋`, farm.kid, 1.5); break;
      case 'chao': play('tap'); farm.walkTo(hit.x, hit.z); break;
      case 'longe': play('pop'); say('🌲 Lá é mata fechada!'); break;
      case 'lote': play('tap'); if (G.expandOptions(r.id).includes(hit.key)) expandZoneModal(r, hit.key); else say('🔒 Abra primeiro um lote vizinho a este'); break;
      case 'recurso': gather(hit); break;
      case 'obra': obraAction(hit); break;
      case 'amigo': case 'bolha': petAction(hit.walker); break;
      case 'brilho': { const obj = hit.obj; farm.walkTo(obj.position.x, obj.position.z, { stopAt: 0.5, marker: false, onArrive: () => farm.kidAct('catar', 0.7, null, () => { if (!obj.parent) return; const item = G.collectSparkle(r.id); if (!item) return; play('coin'); farm.popAt(obj, '#fff3a0'); farm.setSparkles(S().regioes[r.id].brilhos); lastSpark = S().regioes[r.id].brilhos; flyItems([item], farm.kid); }) }); break; }
      case 'npc': play('tap'); goNpc(); break;
    }
  };
  const wheel = (e) => farm.zoomBy(e.deltaY > 0 ? 1.08 : 0.92);
  cv.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu); cv.addEventListener('wheel', wheel, { passive: true });
  function sync() {
    for (const w of farm.walkers) {
      const a = S().amigos.find((x) => x.uid === w.uid); if (!a) continue;
      const n = a.bolsa?.length || 0; if (w.bubbles.length !== Math.min(3, n)) farm.setAmigoBubbles(a.uid, n, bagEmoji(a));
      const tk = G.taskOf(a); farm.setJob(a.uid, tk === 'explorar' ? null : tk, a.task?.alvo);
    }
    farm.setResources(resourcesView(r).filter((x) => !x.bloqueado));
    farm.setObras(obrasView(r.id));
    farm.setForno(G.amigosEm(r.id).some((a) => a.task?.tipo === 'fundir'));
    drawUi(); if (!build.hidden && !bm) drawBuild();
  }
  farmSync = sync;
  let lastSpark = g.brilhos;
  farmSparkSync = () => { if (g.brilhos !== lastSpark) { lastSpark = g.brilhos; farm.setSparkles(g.brilhos); } };
  cleanup = () => { kidSpot[r.id] = [farm.kidPos.x, farm.kidPos.z]; unclass(); cv.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); cv.removeEventListener('wheel', wheel); farmSync = null; farmSparkSync = null; farmApi = null; };
  farmApi = { farm, openBuild, region: r }; window.__farm = farm; // ajuda nos testes
  sync();
  if (arg?.reveal) { play('fanfare'); setTimeout(() => say('🎉 Lote novo liberado!'), 300); }
  if (tema && !S().epoca[tema + new Date().getFullYear()]) { S().epoca[tema + new Date().getFullYear()] = true; G.save(); setTimeout(() => themeModal(tema), 600); }
}
let farmSync = null, farmSparkSync = null, farmApi = null;
function themeModal(tema) {
  const T = THEMES[tema]; const fams = FAMILIES.filter((f) => f.tema === tema);
  modal((box, close) => {
    box.classList.add('theme-modal'); box.style.setProperty('--tc', T.cor); box.style.setProperty('--tc2', T.cor2);
    box.append(h('div', { class: 'big' }, T.icone), h('h2', {}, `É época de ${T.nome}!`), h('p', {}, `De ${T.periodo} o Vale fica enfeitado e aparecem bichos especiais. Eles ficam com você para sempre!`),
      h('div', { class: 'theme-row' }, ...fams.map((f) => h('div', { class: 'theme-mon' }, h('img', { src: thumb(f.id * 3, { size: 128, silhouette: !S().descobertos[f.id * 3] }) }), h('small', {}, S().descobertos[f.id * 3] ? f.nomes[0] : '???'), h('span', { class: 'stars' }, stars(f.rar))))),
      h('p', { class: 'muted' }, `Ache ${ITEMS[THEME_ITEM[tema]].emoji} ${ITEMS[THEME_ITEM[tema]].nome} nos brilhos, arbustos e presentes, e coloque na Forja com outros itens. Na aba 🔨 Construir tem enfeite de época também!`),
      h('div', { class: 'actions' }, h('button', { class: 'btn gold', onclick: close }, 'Oba!')));
  });
}
function bancadaModal(r) {
  play('tap');
  modal((box, close) => {
    const s = S(); const reqs = (c) => h('div', { class: 'req' }, ...Object.entries(c).map(([id, n]) => reqRow(G.has(id, n), `${id === 'brilho' ? '🔷' : ITEMS[id].emoji} ${id === 'brilho' ? s.brilho : s.itens[id] || 0}/${n}`)));
    box.append(h('div', { class: 'big' }, '🛠️'), h('h2', {}, 'Bancada de Trabalho'), h('p', { class: 'muted' }, 'Madeira 🪵 vem das árvores, Ferro 🔩 das rochas, Frutas 🍎 dos canteiros e arbustos, Barras 🧱 do Forno. Para construir, use o botão 🔨 Construir da fazendinha.'));
    for (const c of CRAFTS) {
      box.append(h('div', { class: 'craft' }, h('span', { class: 'ci' }, c.icone), h('div', { class: 'grow' }, h('b', {}, c.nome), h('div', { class: 'muted' }, c.desc), reqs(c.custo)),
        h('button', { class: 'btn small', disabled: !G.canPay({ itens: c.custo }), onclick: () => { if (G.craft(c.id)) { play('anvil'); updateHud(); close(); farmApi?.farm.kidAct('construir', 1.2); bancadaModal(r); } } }, 'Fazer')));
    }
    box.append(h('div', { class: 'actions' }, s.base.forno ? h('button', { class: 'btn gold', onclick: () => { close(); fornoModal(); } }, '🏭 Abrir o Forno') : null, h('button', { class: 'btn ghost', onclick: close }, 'Fechar')));
  });
}
function fornoModal() {
  play('tap');
  modal((box, close) => {
    const s = S(); const home = REGIONS.find((x) => G.hasObra(x.id, 'forno')); const fire = home ? G.amigosEm(home.id).filter((a) => G.skillLevel(a, 'acender') > 0) : [];
    box.append(h('div', { class: 'big' }, '🏭'), h('h2', {}, 'Forno de Fundição'), h('p', {}, `Coloque Ferro Bruto 🔩 aqui. Um companheiro com 🔥 Acender${home ? ' em ' + home.nome : ''} derrete e faz Barras de Metal 🧱.`),
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
        h('button', { class: 'btn small', onclick: () => { close(); const w = farmApi?.farm.walkers.find((x) => x.uid === a.uid); if (w) farmApi.farm.walkTo(w.c.position.x, w.c.position.z, { follow: () => farmApi.farm.walkerPos(a.uid), stopAt: w.r + 0.6 }); } }, '🏃 Ir até ele'),
        h('button', { class: 'btn ghost small', onclick: () => { close(); go('perfil', a.uid); } }, '👀 Ver ficha'),
        h('button', { class: 'btn ghost small', onclick: () => { G.collect(a); G.placeAmigo(a, null); close(); go('fazenda'); } }, '🏠 Descansar'),
        h('button', { class: 'btn ghost small', onclick: close }, 'OK')));
  });
}
function pickAmigoModal(r) {
  modal((box, close) => {
    const n = G.amigosEm(r.id).length, cap = G.farmSlots(r.id);
    box.append(h('h2', {}, `Quem vai trabalhar em ${r.nome}?`), h('p', { class: 'muted' }, `${n}/${cap} lugares · ⚡ = mesmo elemento (explora 2× mais rápido). Veja as habilidades de cada um!`));
    if (n >= cap) box.append(h('p', {}, '🏡 A fazendinha está cheia. Abra mais lotes ou construa Casinhas!'));
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
function expandZoneModal(r, key) {
  modal((box, close) => {
    const c = G.expandCost(r.id); const s = S(); const g = s.regioes[r.id];
    if (!c) { box.append(h('h2', {}, 'A fazendinha está completa! 🎉'), h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'OK'))); return; }
    const lvlNow = G.farmLevel(r.id), lvlNext = Math.min(5, 1 + Math.floor(g.zonas.length / 3));
    box.append(h('div', { class: 'big' }, '🔓🌱'), h('h2', {}, 'Abrir este lote?'),
      h('p', {}, 'O lote sai da sombra e ganha cores: árvores, pedras e arbustos novos para você e seus companheiros, e mais espaço para construir!'),
      ...(lvlNext > lvlNow ? [h('p', { class: 'badge-ok' }, `⭐ A fazendinha sobe para o nível ${lvlNext}: +1 lugar para companheiros e itens raros aparecem mais!`)] : []),
      h('div', { class: 'req' }, reqRow(s.moedas >= c.moedas, `🪙 ${s.moedas}/${c.moedas}`), ...Object.entries(c.itens).map(([id, n]) => reqRow(G.has(id, n), `${ITEMS[id].emoji} ${s.itens[id] || 0}/${n} ${ITEMS[id].nome}`))),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: close }, 'Depois'),
        h('button', { class: 'btn green', disabled: !G.canPay(c), onclick: () => { if (G.expand(r.id, key)) { close(); flushNotices(); go('fazenda', { reveal: key }); } } }, '🔓 Abrir!')));
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
        farm?.freeNpc(); farm?.kidAct('comemorar', 1.8); play('fanfare'); if (S().tutorial < 5) S().tutorial = 5;
        modal((bx, cl) => {
          bx.append(h('img', { src: thumb(0, { npc: res, size: 192 }), style: 'width:150px' }), h('h2', {}, `${res.quem} está salv${res.g}! 🎉`), h('p', {}, `“Valeu, ${S().boneco.nome || 'amigo'} e ${G.nomeDe(chosen)}! Te devo essa. De vez em quando vou te pedir uma ajuda.”`),
            h('div', { class: 'req' }, h('div', { class: 'r ok' }, `🪙 +${premio.moedas}`), h('div', { class: 'r ok' }, '🔷 +1 Cristal de Evolução'), h('div', { class: 'r ok' }, '💠 +1 Runa do Trovão'), premio.coroa ? h('div', { class: 'r ok' }, '👑 +1 Coroa do Trovão') : null),
            h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { cl(); if (screen === 'fazenda') farmSync?.(); } }, 'Oba!')));
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
  const inTab = (s, k) => (k === 'epoca' ? isSeasonal(s.id) : s.id < CODEX_TOTAL && (k === 'todos' || s.el === k));
  for (const [k, label] of [['todos', 'Todos'], ...ELEMENT_ORDER.concat('trovao').map((e) => [e, ELEMENTS[e].icone + ' ' + ELEMENTS[e].nome]), ['epoca', '🎉 Época']]) {
    const tot = SPECIES.filter((s) => inTab(s, k)); const got = tot.filter((s) => S().descobertos[s.id]).length;
    tabs.append(h('button', { class: 'tab' + (codexTab === k ? ' on' : ''), onclick: () => { codexTab = k; play('tap'); go('codice'); } }, `${label} ${got}/${tot.length}`));
  }
  sc.append(tabs);
  const grid = h('div', { class: 'grid' });
  const queue = [];
  if (codexTab === 'epoca') { const t = G.themeOn(); sc.append(h('p', { class: 'muted', style: 'margin:4px 6px' }, t ? `${THEMES[t].icone} Agora é época de ${THEMES[t].nome}! Bichos de época ficam com você para sempre.` : '🎉 Cada época do ano (Natal, Férias, Carnaval, Páscoa, Festa Junina e Halloween) traz bichos especiais. Eles ficam para sempre!')); }
  for (const s of SPECIES) {
    if (!inTab(s, codexTab)) continue;
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
  if (f.tema && s.stage === 0) return h('div', { class: 'sub' }, `${THEMES[f.tema].icone} ${G.themeOn() === f.tema ? 'Agora!' : THEMES[f.tema].periodo}`);
  if (s.stage > 0) return h('div', { class: 'sub' }, `🌟 Evolui no Nv ${EVOLVE_AT[s.stage - 1]}`);
  return h('div', { class: 'recipe' }, ...f.receita.map((id) => h('span', { class: G.has(id) ? '' : 'miss', title: ITEMS[id].nome }, ITEMS[id].emoji)));
}
// painel de trabalho: habilidades com nome e estrelas, bolsa e rendimento
function workPanel(spId, hide) {
  const sp = SPECIES[spId];
  const bag = 3 + RARITY_ORDER.indexOf(sp.rar) + sp.stage;
  return h('div', { class: 'work' },
    h('div', { class: 'sec-h' }, '🛠️ Trabalho na fazendinha'),
    h('div', { class: 'work-list' }, ...skillsOf(spId).map((k) => h('div', { class: 'wsk', title: SKILLS[k.id].desc },
      h('span', { class: 'ic' }, SKILLS[k.id].icone), h('span', { class: 'nm' }, hide ? '???' : SKILLS[k.id].nome), h('span', { class: 'stars' }, '★'.repeat(Math.min(7, k.nivel)))))),
    h('div', { class: 'row wrap', style: 'justify-content:center;gap:6px;margin-top:6px' }, h('span', { class: 'chip' }, `🎒 Bolsa: ${bag}`), h('span', { class: 'chip' }, `📦 ~${yieldOf(spId).toFixed(1)} itens por tarefa`)));
}
// linha da evolução: as 3 formas, as não descobertas em silhueta
function evoLine(spId, onPick) {
  const sp = SPECIES[spId]; const base = sp.fam * 3;
  const parts = [];
  for (let st = 0; st < 3; st++) {
    const id = base + st; const known = !!S().descobertos[id];
    if (st) parts.push(h('div', { class: 'evo-arrow' }, '➜', h('small', {}, `Nv ${EVOLVE_AT[st - 1]}`), SPECIES[id].arch !== SPECIES[id - 1].arch ? h('small', { class: 'morph' }, 'muda!') : null));
    const img = h('img', { alt: '' }); setTimeout(() => { img.src = thumb(id, { silhouette: !known, size: 128 }); }, 30 + st * 40);
    parts.push(h(onPick ? 'button' : 'div', { class: 'evo' + (id === spId ? ' on' : ''), onclick: onPick ? () => onPick(SPECIES[id]) : null }, img, h('span', {}, known ? SPECIES[id].nome : '???'), h('small', {}, SPECIES[id].estagio)));
  }
  return h('div', { class: 'evoline' }, ...parts);
}
function codexModal(s) {
  play('tap');
  modal((box, close) => {
    box.classList.add('sheet');
    const known = !!S().descobertos[s.id]; const f = FAMILIES[s.fam]; const el = ELEMENTS[s.el];
    const owned = S().amigos.filter((a) => a.sp === s.id).length;
    box.style.setProperty('--ec', el.cores[0]); box.style.setProperty('--ec2', el.cores[2]); box.style.setProperty('--rc', rarColor(s.rar));
    box.append(
      h('div', { class: 'sheet-head' },
        h('span', { class: 'num' }, '#' + String(s.id + 1).padStart(3, '0')),
        h('span', { class: 'el-big' }, el.icone),
        h('div', { class: 'sheet-art' + (known ? '' : ' unk') }, h('img', { src: thumb(s.id, { silhouette: !known, size: 256 }) })),
        h('h2', {}, known ? s.nome : '???'),
        h('div', { class: 'row wrap', style: 'justify-content:center' }, rarBadge(s.rar), h('span', { class: 'stars', style: 'font-size:22px' }, stars(s.rar)), elChip(s.el), h('span', { class: 'chip' }, s.estagio)),
        h('p', { class: 'owned' }, !known ? 'Ainda não descoberto' : owned ? `Você tem ${owned} na equipe` : 'Já descoberto · nenhum na equipe agora')),
    );
    const body = h('div', { class: 'sheet-body' },
      h('div', { class: 'sheet-sec' }, h('div', { class: 'sec-h' }, '🧬 Evolução'), evoLine(s.id, (o) => { close(); codexModal(o); })),
      h('div', { class: 'sheet-sec' }, workPanel(s.id, !known)));
    box.append(body);
    const how = h('div', { class: 'sheet-sec' }, h('div', { class: 'sec-h' }, '🔨 Como conseguir'));
    if (f.tema) how.append(h('p', {}, `${THEMES[f.tema].icone} Bicho de ${THEMES[f.tema].nome}: só aparece na Forja de ${THEMES[f.tema].periodo}, usando ${ITEMS[THEME_ITEM[f.tema]].emoji} ${ITEMS[THEME_ITEM[f.tema]].nome}. Depois fica com você para sempre!`));
    if (f.tema && s.stage > 0) { /* evolução normal */ }
    if (f.fusao) how.append(h('p', {}, '⚡ Só sai de uma Fusão do Trovão (dois Adultos na Forja).'));
    else if (s.stage > 0) how.append(h('p', {}, `🔷 Evolui de ${S().descobertos[s.id - 1] ? SPECIES[s.id - 1].nome : '???'} no nível ${EVOLVE_AT[s.stage - 1]}, com ${EVOLVE_COST[s.stage - 1]} Cristal de Evolução.`));
    else {
      how.append(h('div', { class: 'row', style: 'justify-content:center;gap:14px' }, ...f.receita.map((id) => token(id, S().itens[id] || 0, null, G.has(id) ? '' : 'off'))));
      const where = [...new Set(f.receita.map((id) => ITEMS[id].el ? regionOf(ITEMS[id].el).nome : id === 'orvalho' ? 'brilhos e Bancada' : ITEMS[id].recurso ? 'fazendinha e Bancada' : 'pedidos e resgates'))];
      how.append(h('p', { class: 'muted' }, '📍 Onde achar: ', where.join(' · ')));
    }
    const reg = regionOf(s.el);
    how.append(h('p', { class: 'muted', style: 'margin:2px 0 0' }, reg ? `🏞️ Trabalha 2× mais rápido em ${reg.nome}` : '🌩️ Fera da Fusão: forte em qualquer lugar'));
    body.append(how, h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: close }, 'Fechar')));
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
    const ids = Object.keys(ITEMS).filter((id) => !ITEMS[id].tema || S().itens[id]).sort((a, b) => (ELEMENT_ORDER.indexOf(ITEMS[a].el) - ELEMENT_ORDER.indexOf(ITEMS[b].el)) || RARITY_ORDER.indexOf(ITEMS[a].rar) - RARITY_ORDER.indexOf(ITEMS[b].rar));
    for (const id of ids) {
      const it = ITEMS[id]; const n = S().itens[id] || 0;
      wrap.append(token(id, n, () => { play('tap'); info.textContent = `${it.emoji} ${it.nome} — ${RARITIES[it.rar].nome}. ${it.tema ? `Item da época de ${THEMES[it.tema].nome} (${THEMES[it.tema].periodo}): chama bichos especiais na Forja.` : it.el ? 'Colhido em ' + regionOf(it.el).nome + '.' : id === 'orvalho' ? 'Aparece em todas as fazendinhas.' : it.recurso ? 'Vem das árvores, rochas, arbustos, canteiros ou do Forno.' : 'Ganho em pedidos, resgates, presentes e no Códice.'}`; }, n ? 'mini' : 'mini off'));
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
  if (screen === 'boneco' && !s.boneco.criado) text = 'Monte o seu personagem do jeitinho que quiser! Depois é só tocar em Começar.';
  else if (s.tutorial < 2) { if (screen !== 'ninho') { text = 'E aí! Eu sou o Raiozinho ⚡ Vamos forjar seu primeiro companheiro na Forja do Trovão?'; nav = 'ninho'; } else text = 'Coloque 3 itens na bigorna (experimente misturar 🍀 🐚 🔥) e toque em Forjar!'; }
  else if (s.tutorial === 2 && !placed) { if (screen !== 'fazenda' && screen !== 'ninho') { text = 'Mande seu companheiro para a Fazendinha! 🏡'; nav = 'fazenda'; } else if (screen === 'fazenda') text = 'Toque em ➕ Bicho para colocar seu companheiro aqui!'; }
  else if (s.tutorial <= 3 && placed) { if (screen === 'fazenda') text = 'Toque no chão para andar! Toque numa árvore 🌳, pedra ⛰️ ou arbusto para pegar recursos. Quando aparecer a bolha no companheiro, toque nele para pegar os itens!'; else { text = 'Vá até a Fazendinha colher itens! 🧺'; nav = 'fazenda'; } }
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
  $('#hud-me').onclick = () => { play('tap'); if (screen !== 'boneco') go('boneco', { back: screen === 'perfil' ? 'amigos' : screen }); };
  go(!S().boneco.criado ? 'boneco' : S().amigos.length ? 'mapa' : 'ninho');
  setTimeout(() => $('#splash').classList.add('hide'), 300); setTimeout(() => $('#splash').remove(), 1000);
  flushNotices();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !location.hostname.match(/^(localhost|127\.)/)) navigator.serviceWorker.register('sw.js');
}
start();
