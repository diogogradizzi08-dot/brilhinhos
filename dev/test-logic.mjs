// Teste rápido das regras: node dev/test-logic.mjs
import * as D from '../js/data.js';
import * as G from '../js/game.js';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FALHOU:', m); } };
ok(D.SPECIES.length === 150, 'são 150 espécies: ' + D.SPECIES.length);
const keys = D.FAMILIES.filter(f => f.receita).map(f => D.recipeKey(f.receita));
ok(new Set(keys).size === keys.length, 'receitas únicas');
ok(D.FAMILIES.every(f => !f.receita || f.receita.every(i => D.ITEMS[i])), 'itens das receitas existem');
const names = D.SPECIES.map(s => s.nome); ok(new Set(names).size === 150, 'nomes únicos');
const cnt = {}; for (const f of D.FAMILIES) cnt[f.rar] = (cnt[f.rar] || 0) + 3; console.log('espécies por raridade', cnt);
G.setState(G.newState());
const S = G.S;
const r = G.mix(['trevo', 'trevo']); ok(r && r.exato && r.amigo.sp === 0, 'receita exata dá Brotelho');
// chances com itens simples x raros
const p = (it) => Object.fromEntries(Object.entries(G.rarityChances(it)).map(([k, v]) => [k, (v * 100).toFixed(1) + '%']));
console.log('2 comuns', p(['trevo', 'orvalho'])); console.log('3 incomuns', p(['cogumelo', 'onda', 'pimenta'])); console.log('3 raros+runa', p(['semente', 'gema', 'cometa', 'runa']));
// sorteio aleatório: distribuição
S.itens = { orvalho: 99999, trevo: 99999 }; S.nivel = 1;
const dist = {}; for (let i = 0; i < 20000; i++) { const m = G.mix(['trevo', 'orvalho', 'orvalho']); dist[D.SPECIES[m.amigo.sp].rar] = (dist[D.SPECIES[m.amigo.sp].rar] || 0) + 1; }
console.log('20 mil misturas trevo+orvalho+orvalho', dist);
// fazendinha
G.setState(G.newState()); G.mix(['trevo', 'trevo']); const a = G.S.amigos[0];
G.placeAmigo(a, 'floresta'); a.desde -= 60000; G.tick(); ok(a.prontos >= 2, 'produziu na fazendinha: ' + a.prontos);
const it = G.collect(a); ok(!!it, 'coletou ' + it);
G.addItem('trevo', 5); ok(G.canRescue('floresta'), 'pode resgatar Vovó');
ok(!!G.rescue('floresta', a), 'resgate'); ok(G.S.pedidos.length > 0, 'pedidos surgem: ' + G.S.pedidos.length);
console.log(fail ? `${fail} FALHA(S)` : 'tudo certo');
