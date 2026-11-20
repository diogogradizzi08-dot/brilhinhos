// Teste rápido das regras: node dev/test-logic.mjs
import * as D from '../js/data.js';
import * as G from '../js/game.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FALHOU:', m); } };
ok(D.FAMILIES.length === 150 && D.SPECIES.length === 450, 'são 150 espécies e 450 formas');
const keys = D.FAMILIES.filter((f) => f.receita).map((f) => D.recipeKey(f.receita));
ok(new Set(keys).size === keys.length, 'receitas únicas');
ok(D.FAMILIES.every((f) => !f.receita || f.receita.every((i) => D.ITEMS[i])), 'itens das receitas existem');
ok(new Set(D.SPECIES.map((s) => s.nome)).size === 450, 'nomes únicos');
ok(D.skillsOf(0).length === 1 && D.skillsOf(D.SPECIES.length - 1).length >= 4, 'raridade dá mais habilidades');

G.setState(G.newState()); const S = G.S;
const r = G.mix(['trevo', 'trevo']); ok(r && r.exato, 'receita exata funciona');
const planta = r.amigo; ok(G.skillLevel(planta, 'semear') > 0, 'companheiro de planta semeia');
G.addItem('concha', 2); const ag = G.mix(['concha', 'concha']).amigo; ok(G.skillLevel(ag, 'regar') > 0, 'companheiro de água rega');
G.placeAmigo(planta, 'floresta'); G.placeAmigo(ag, 'floresta');
let t = Date.now();
for (let i = 0; i < 40; i++) { t += 5000; G.tick(t); }
const cant = S.regioes.floresta.cant;
ok(cant.some((c) => c.st !== 'vazio'), 'canteiros foram trabalhados: ' + cant.map((c) => c.st).join(','));
t += 120000; G.tick(t);
ok(cant.some((c) => c.st === 'pronto'), 'frutas ficaram prontas: ' + cant.map((c) => c.st).join(','));
const idx = cant.findIndex((c) => c.st === 'pronto' && !c.por); ok(idx < 0 || G.harvestPlot('floresta', idx) > 0, 'o jogador colhe');
G.setState(G.newState()); G.addItem('concha', 2); const so = G.mix(['concha', 'concha']).amigo; G.placeAmigo(so, 'floresta');
t = Date.now(); for (let i = 0; i < 20; i++) { t += 5000; G.tick(t); }
ok(G.S.regioes.floresta.cant.every((c) => c.st === 'vazio'), 'sem semeador não planta');
ok(so.bolsa.length > 0, 'explorou e trouxe itens: ' + so.bolsa.join(','));
console.log(fail ? `${fail} FALHA(S)` : 'tudo certo');
