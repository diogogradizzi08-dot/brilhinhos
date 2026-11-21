// Teste rápido das regras: node dev/test-logic.mjs
import * as D from '../js/data.js';
import * as G from '../js/game.js';
import * as W from '../js/world.js';
import { forceTheme, themeOn } from '../js/season.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FALHOU:', m); } };
forceTheme('nenhum');
ok(D.BASE_FAMILIES === 150 && D.CODEX_TOTAL === 450, 'são 150 espécies e 450 formas no Códice');
ok(D.FAMILIES.filter((f) => f.tema).length === 18, '18 famílias de época (54 formas)');
const keys = D.FAMILIES.filter((f) => f.receita).map((f) => D.recipeKey(f.receita));
ok(new Set(keys).size === keys.length, 'receitas únicas');
ok(D.FAMILIES.every((f) => !f.receita || f.receita.every((i) => D.ITEMS[i])), 'itens das receitas existem');
ok(new Set(D.SPECIES.map((s) => s.nome)).size === D.SPECIES.length, 'nomes únicos');
ok(D.skillsOf(0).length === 1 && D.skillsOf(449).length >= 4, 'raridade dá mais habilidades');

G.setState(G.newState()); const S = G.S;
ok(G.obrasOf('floresta').filter((o) => o.tipo === 'canteiro').length === 2, 'começa com 2 canteiros');
const r = G.mix(['trevo', 'trevo', 'trevo']); ok(r && r.exato, 'receita exata funciona');
const planta = r.amigo; ok(G.skillLevel(planta, 'semear') > 0, 'companheiro de planta semeia');
G.addItem('concha', 3); const ag = G.mix(['concha', 'concha', 'concha']).amigo; ok(G.skillLevel(ag, 'regar') > 0, 'companheiro de água rega');
G.placeAmigo(planta, 'floresta'); G.placeAmigo(ag, 'floresta');
let t = Date.now();
for (let i = 0; i < 40; i++) { t += 5000; G.tick(t); }
const plots = () => G.obrasOf('floresta').filter((o) => o.tipo === 'canteiro');
ok(plots().some((c) => c.st !== 'vazio') || planta.bolsa.includes('fruta'), 'canteiros foram trabalhados: ' + plots().map((c) => c.st).join(','));
// o jogador: corta, minera, cata; o recurso some e volta em 5 minutos
G.setState(G.newState());
const res = G.resourcesOf('floresta'); ok(res.some((x) => x.tipo === 'arvore') && res.some((x) => x.tipo === 'rocha') && res.some((x) => x.tipo === 'arbusto'), 'lote do meio tem árvore, rocha e arbusto');
const tree = res.find((x) => x.tipo === 'arvore'); const got = G.playerGather('floresta', tree.id);
ok(got.itens?.includes('madeira'), 'cortar dá madeira: ' + JSON.stringify(got));
ok(!G.resAlive('floresta', tree.id), 'a árvore some depois de cortada');
ok(G.playerGather('floresta', tree.id).erro, 'não dá para cortar de novo na hora');
ok(G.resAlive('floresta', tree.id, Date.now() + G.RESPAWN + 10), 'a árvore volta em 5 minutos');
const plot = G.obrasOf('floresta').find((o) => o.tipo === 'canteiro');
ok(G.playerPlant('floresta', plot.uid) && G.playerWater('floresta', plot.uid), 'o jogador planta e rega');
G.tick(Date.now() + G.GROW_TIME + 10); ok(G.harvestPlot('floresta', plot.uid) > 0, 'o jogador colhe');
// construir: escolher o lugar
G.addItem('madeira', 30); G.addItem('ferro', 10);
ok(!G.canPlace('floresta', 'bancada', 30, 30).ok, 'não constrói fora da área liberada');
ok(!G.canPlace('floresta', 'bancada', tree.x, tree.z).ok, 'não constrói em cima de árvore');
const spot = G.findSpot('floresta', 'bancada', 2, 2); ok(spot && G.build('floresta', 'bancada', spot[0], spot[1]), 'constrói a bancada onde escolheu');
ok(G.S.base.bancada && !G.buildState('bancada', 'floresta').ok, 'a bancada é única');
ok(!G.canPlace('floresta', 'cerca', spot[0], spot[1]).ok, 'não sobrepõe construção');
const cerca = G.build('floresta', 'cerca', ...G.findSpot('floresta', 'cerca', -3, -1)); ok(cerca, 'constrói enfeite');
ok(G.removeObra('floresta', cerca.uid) && !G.obrasOf('floresta').includes(cerca), 'guarda o enfeite');
// aumentar: um lote vizinho de cada vez
ok(G.expandOptions('floresta').length === 4, '4 lotes vizinhos para abrir');
G.S.moedas = 999; G.addItem('trevo', 20); G.addItem('cogumelo', 5);
ok(!G.expand('floresta', '2,2'), 'não abre lote longe');
ok(G.expand('floresta', '1,0') && G.S.regioes.floresta.zonas.length === 2, 'abre o lote vizinho');
ok(G.resourcesOf('floresta').some((x) => x.id.startsWith('1,0:')), 'o lote novo tem recursos');
ok(W.ZONE_ORDER[0] === '0,0' && W.ZONE_ORDER.length === 25, 'grade de 25 lotes');
// sem semeador não planta
G.setState(G.newState()); G.addItem('concha', 3); const so = G.mix(['concha', 'concha', 'concha']).amigo; G.placeAmigo(so, 'floresta');
t = Date.now(); for (let i = 0; i < 20; i++) { t += 5000; G.tick(t); }
ok(plots().every((c) => c.st === 'vazio'), 'sem semeador não planta');
ok(so.bolsa.length > 0, 'trabalhou e trouxe itens: ' + so.bolsa.join(','));
// forja: mínimo de 3 itens, toda receita tem 3+, e o começo tem variedade de elementos
G.setState(G.newState()); ok(G.mix(['trevo']) === null && G.mix(['trevo', 'concha']) === null, 'forja exige 3 itens');
ok(D.FAMILIES.every((f) => !f.receita || f.receita.length >= 3), 'toda receita tem 3 itens');
{ const els = {}; for (let i = 0; i < 60; i++) { G.setState(G.newState()); const r2 = G.mix(['trevo', 'concha', 'brasa']); els[D.SPECIES[r2.amigo.sp].el] = 1; } ok(Object.keys(els).length >= 3, 'mistura dá elementos variados: ' + Object.keys(els).join(',')); }
{ const st = G.newState(); ok(new Set(Object.keys(st.itens).map((k) => D.ITEMS[k].el).filter(Boolean)).size >= 5, 'mochila inicial com vários elementos'); }
{ let up = 0; for (let i = 0; i < 400; i++) { G.setState(G.newState()); G.addItem('onda', 1); const r3 = G.mix(['onda', 'concha', 'brasa']); if (D.RARITY_ORDER.indexOf(D.SPECIES[r3.amigo.sp].rar) >= 1) up++; } ok(up > 110, 'item incomum puxa raridade: ' + up + '/400'); }
{ let tema = 0; for (let i = 0; i < 200; i++) { G.setState(G.newState()); const r4 = G.mix(['trevo', 'concha', 'brasa']); if (D.isSeasonal(r4.amigo.sp)) tema++; } ok(tema === 0, 'fora de época não sai bicho de época'); }
// época: com o item da época sai bicho especial, e ele fica para sempre
forceTheme('natal'); ok(themeOn() === 'natal', 'época forçada');
G.setState(G.newState()); G.addItem('enfeite', 3);
const n1 = G.mix(['enfeite', 'trevo', 'concha']); ok(n1 && D.FAMILIES[D.SPECIES[n1.amigo.sp].fam].tema === 'natal', 'item de Natal chama bicho de Natal');
ok(G.discoveredCount() === 0 && G.seasonalCount() === 1, 'bicho de época conta à parte do Códice');
forceTheme('nenhum'); ok(G.S.amigos.length === 1 && D.isSeasonal(G.S.amigos[0].sp), 'depois da época o bicho continua na equipe');
ok(G.mix(['enfeite', 'enfeite', 'trevo']) && !D.isSeasonal(G.S.amigos[1].sp), 'fora da época o enfeite vale como item comum');
// jogo antigo (versão 3) vira terreno em lotes
{
  const old = G.newState(); old.v = 3; old.regioes.floresta.fazenda = 3; old.regioes.floresta.cant = [{ st: 'pronto' }, { st: 'vazio' }, { st: 'regado', ate: 5 }]; old.base = { bancada: true, forno: true, casinha: 1, totem: false, fila: 2 };
  delete old.boneco; for (const k in old.regioes) { delete old.regioes[k].zonas; delete old.regioes[k].obras; delete old.regioes[k].rec; }
  globalThis.localStorage = { getItem: () => JSON.stringify(old), setItem() {} };
  const s = G.load();
  ok(s.v === 4 && s.regioes.floresta.zonas.length === 5, 'migra: nível 3 vira 5 lotes');
  ok(G.obrasOf('floresta').filter((o) => o.tipo === 'canteiro').length === 3 && G.obrasOf('floresta').some((o) => o.st === 'pronto'), 'migra: canteiros com o que estava plantado');
  ok(G.countBuilt('bancada') === 1 && G.countBuilt('forno') === 1 && G.countBuilt('casinha') === 1 && s.base.fila === 2, 'migra: construções no lugar');
  ok(s.boneco && !s.boneco.criado, 'migra: pede para criar o personagem');
}
console.log(fail ? `${fail} FALHA(S)` : 'tudo certo');
