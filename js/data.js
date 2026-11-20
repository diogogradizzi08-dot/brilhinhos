// Brilhinhos — todos os dados do jogo num lugar só: raridades, elementos, itens,
// as 150 espécies (50 famílias × 3 estágios), regiões, resgates e conquistas.

export const RARITIES = {
  comum:    { nome: 'Comum',    cor: '#8fd46b', estrelas: 1, pontos: 1 },
  incomum:  { nome: 'Incomum',  cor: '#4fc3f7', estrelas: 2, pontos: 3 },
  raro:     { nome: 'Raro',     cor: '#b18cff', estrelas: 3, pontos: 8 },
  epico:    { nome: 'Épico',    cor: '#ff6fb5', estrelas: 4, pontos: 20 },
  lendario: { nome: 'Lendário', cor: '#ffc22e', estrelas: 5, pontos: 40 },
  mitico:   { nome: 'Mítico',   cor: '#7df9ff', estrelas: 6, pontos: 80 },
};
export const RARITY_ORDER = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico'];

// cores: [principal, secundária (barriga/detalhe), brilho/energia]
export const ELEMENTS = {
  planta:   { nome: 'Planta',   cores: ['#62b84a', '#d6ec8a', '#ffd34d'], dom: 'Faz crescer', icone: '🌿' },
  agua:     { nome: 'Água',     cores: ['#3b93e8', '#aee6ff', '#6ff0ff'], dom: 'Nada',         icone: '💧' },
  fogo:     { nome: 'Fogo',     cores: ['#e35a32', '#ffc06a', '#ffcc33'], dom: 'Esquenta',     icone: '🔥' },
  vento:    { nome: 'Vento',    cores: ['#8cc2e8', '#f2f8ff', '#bff4ff'], dom: 'Voa',          icone: '🌪️' },
  gelo:     { nome: 'Gelo',     cores: ['#a3def0', '#f6feff', '#8fe8ff'], dom: 'Congela',      icone: '❄️' },
  pedra:    { nome: 'Pedra',    cores: ['#9c8770', '#d6c6aa', '#ff9a3c'], dom: 'É forte',      icone: '🪨' },
  eletrico: { nome: 'Elétrico', cores: ['#f7cf2a', '#4a4560', '#fff66b'], dom: 'Dá choque',    icone: '⚡' },
  cosmo:    { nome: 'Cósmico',  cores: ['#4d3a96', '#a98cff', '#ff7df2'], dom: 'Viaja no espaço', icone: '🌌' },
  trovao:   { nome: 'Trovão',   cores: ['#4a6aa8', '#e6ecff', '#7df9ff'], dom: 'Comanda os raios', icone: '🌩️' },
};

// Itens: rar = raridade do item (vale "pontos de energia" na Forja).
export const ITEMS = {
  orvalho:  { nome: 'Gota de Orvalho',  emoji: '💧', el: null,       rar: 'comum' },
  trevo:    { nome: 'Trevo',            emoji: '🍀', el: 'planta',   rar: 'comum' },
  cogumelo: { nome: 'Cogumelo da Mata', emoji: '🍄', el: 'planta',   rar: 'incomum' },
  semente:  { nome: 'Semente Ancestral', emoji: '🌰', el: 'planta',  rar: 'raro' },
  concha:   { nome: 'Concha',           emoji: '🐚', el: 'agua',     rar: 'comum' },
  onda:     { nome: 'Onda Brava',       emoji: '🌊', el: 'agua',     rar: 'incomum' },
  tridente: { nome: 'Tridente das Marés', emoji: '🔱', el: 'agua',   rar: 'raro' },
  brasa:    { nome: 'Brasa',            emoji: '🔥', el: 'fogo',     rar: 'comum' },
  pimenta:  { nome: 'Pimenta Ardente',  emoji: '🌶️', el: 'fogo',     rar: 'incomum' },
  vulcao:   { nome: 'Pedra Vulcânica',  emoji: '🌋', el: 'fogo',     rar: 'raro' },
  pena:     { nome: 'Pena Veloz',       emoji: '🪶', el: 'vento',    rar: 'comum' },
  nuvem:    { nome: 'Nuvem Carregada',  emoji: '☁️', el: 'vento',    rar: 'incomum' },
  tornado:  { nome: 'Mini Tornado',     emoji: '🌪️', el: 'vento',    rar: 'raro' },
  floco:    { nome: 'Floco de Neve',    emoji: '❄️', el: 'gelo',     rar: 'comum' },
  neve:     { nome: 'Neve Eterna',      emoji: '🏔️', el: 'gelo',     rar: 'incomum' },
  cristal:  { nome: 'Cristal de Gelo',  emoji: '🧊', el: 'gelo',     rar: 'raro' },
  seixo:    { nome: 'Pedregulho',       emoji: '🪨', el: 'pedra',    rar: 'comum' },
  fossil:   { nome: 'Fóssil',           emoji: '🦴', el: 'pedra',    rar: 'incomum' },
  gema:     { nome: 'Gema Bruta',       emoji: '💎', el: 'pedra',    rar: 'raro' },
  faisca:   { nome: 'Faísca',           emoji: '⚡', el: 'eletrico', rar: 'comum' },
  ima:      { nome: 'Ímã',              emoji: '🧲', el: 'eletrico', rar: 'incomum' },
  tempestade: { nome: 'Nuvem de Trovão', emoji: '🌩️', el: 'eletrico', rar: 'raro' },
  poeira:   { nome: 'Poeira Estelar',   emoji: '✨', el: 'cosmo',    rar: 'comum' },
  lua:      { nome: 'Pedra da Lua',     emoji: '🌙', el: 'cosmo',    rar: 'incomum' },
  cometa:   { nome: 'Cometa',           emoji: '☄️', el: 'cosmo',    rar: 'raro' },
  runa:     { nome: 'Runa do Trovão',   emoji: '💠', el: null,       rar: 'epico' },
  coroa:    { nome: 'Coroa do Trovão',  emoji: '👑', el: null,       rar: 'lendario' },
};
// Cristal de Evolução não vai na Forja: serve para evoluir.
export const GROW_ITEM = { nome: 'Cristal de Evolução', emoji: '🔷' };

export const EL_ITEMS = {};
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.el) continue;
  (EL_ITEMS[it.el] ||= {})[it.rar] = id;
}

const ORDER = ['planta', 'agua', 'fogo', 'vento', 'gelo', 'pedra', 'eletrico', 'cosmo'];
export const ELEMENT_ORDER = ORDER;
const next = (el) => ORDER[(ORDER.indexOf(el) + 1) % ORDER.length];

// 50 famílias: [elemento, raridade, arquétipo, nomes dos 3 estágios, molde da receita]
// arquétipo = o animal de referência; o tipo de corpo sai dele (4 patas, 2 patas, ave,
// peixe, serpente, inseto, espírito flutuante).
const LINES = [
  ['planta', 'comum', 'besouro', 'Brotoso', 'Folhabesouro', 'Carvalhoplo', 'cc'],
  ['planta', 'comum', 'sapo', 'Musgapo', 'Sapolodo', 'Pantanorrei', 'co'],
  ['planta', 'incomum', 'cervo', 'Galhito', 'Ramacervo', 'Bosquerreal', 'uc'],
  ['planta', 'incomum', 'lagarto', 'Camaleaf', 'Camufolha', 'Selvagarto', 'uu'],
  ['planta', 'raro', 'urso', 'Ursomusgo', 'Ursilvestre', 'Ursequoia', 'ruc'],
  ['planta', 'epico', 'dragao', 'Draconeiro', 'Dracofloresta', 'Draquerubim', 'rr*'],
  ['agua', 'comum', 'peixe', 'Barbatim', 'Barbatanha', 'Mareforte', 'cc'],
  ['agua', 'comum', 'tartaruga', 'Cascorrente', 'Cascomaré', 'Cascofundo', 'co'],
  ['agua', 'incomum', 'arraia', 'Arraiinha', 'Arraiazul', 'Abissarraia', 'uc'],
  ['agua', 'incomum', 'lagarto', 'Axoloto', 'Axolago', 'Axorrei', 'uu'],
  ['agua', 'raro', 'lobo', 'Lobondas', 'Lobomarinho', 'Lobotsunami', 'ruc'],
  ['agua', 'epico', 'serpente', 'Serpentágua', 'Leviagua', 'Leviatrom', 'rr*'],
  ['fogo', 'comum', 'lagarto', 'Brasinha', 'Brasagarto', 'Salamandrax', 'cc'],
  ['fogo', 'comum', 'javali', 'Javabrasa', 'Javalume', 'Javulcano', 'co'],
  ['fogo', 'incomum', 'felino', 'Leãozito', 'Leãochama', 'Leonferno', 'uc'],
  ['fogo', 'incomum', 'ave', 'Fagulhinho', 'Fenixito', 'Fênixar', 'uu'],
  ['fogo', 'raro', 'rinoceronte', 'Rinolava', 'Rinomagma', 'Rinovulcão', 'ruc'],
  ['fogo', 'epico', 'dino', 'Tiranito', 'Tiranochama', 'Tiranorrex', 'rr*'],
  ['vento', 'comum', 'ave', 'Ventinho', 'Falcavento', 'Falcorrajada', 'cc'],
  ['vento', 'comum', 'mariposa', 'Brisaposa', 'Mariventa', 'Mariciclone', 'co'],
  ['vento', 'incomum', 'morcego', 'Morcevento', 'Morceguilho', 'Morcetufão', 'uc'],
  ['vento', 'incomum', 'felino', 'Linceleve', 'Linceágil', 'Lincefuracão', 'uu'],
  ['vento', 'raro', 'serpente', 'Serpenuvem', 'Nimbosserpe', 'Celestinguin', 'ruc'],
  ['vento', 'epico', 'dragao', 'Draguinho', 'Dragoventos', 'Dragotufão', 'rr*'],
  ['gelo', 'comum', 'pinguim', 'Pinguelo', 'Pinguerreiro', 'Pinguimperador', 'cc'],
  ['gelo', 'comum', 'raposa', 'Raponeve', 'Raponevasca', 'Raporártica', 'co'],
  ['gelo', 'incomum', 'urso', 'Polarito', 'Polarão', 'Polartitã', 'uc'],
  ['gelo', 'incomum', 'aguaviva', 'Geleia', 'Geleiaviva', 'Glaciomedusa', 'uu'],
  ['gelo', 'raro', 'cervo', 'Renagelo', 'Renaglacial', 'Renaurora', 'ruc'],
  ['gelo', 'epico', 'mamute', 'Mamutinho', 'Mamutelo', 'Mamutundra', 'rr*'],
  ['pedra', 'comum', 'tartaruga', 'Tatupedra', 'Tatumuralha', 'Tatufortaleza', 'cc'],
  ['pedra', 'comum', 'besouro', 'Rochibesouro', 'Chifrerocha', 'Titanbesouro', 'co'],
  ['pedra', 'incomum', 'macaco', 'Gorilito', 'Gorirocha', 'Gorilavalanche', 'uc'],
  ['pedra', 'incomum', 'lagarto', 'Quartzagarto', 'Geodragarto', 'Cristalossauro', 'uu'],
  ['pedra', 'raro', 'rinoceronte', 'Rinorrocha', 'Rinogranito', 'Rinomonólito', 'ruc'],
  ['pedra', 'epico', 'golem', 'Golemzinho', 'Golemuro', 'Golemontanha', 'rr*'],
  ['eletrico', 'comum', 'enguia', 'Choquinho', 'Enguivolt', 'Enguitrovão', 'cc'],
  ['eletrico', 'comum', 'raposa', 'Faiscaposa', 'Raposvolt', 'Raposcurto', 'co'],
  ['eletrico', 'incomum', 'lagarto', 'Voltagarto', 'Dinamagarto', 'Megavolt', 'uc'],
  ['eletrico', 'raro', 'lobo', 'Lobovolt', 'Lobotrovão', 'Lobotempestade', 'ruc'],
  ['eletrico', 'raro', 'ave', 'Trovinho', 'Falcotrom', 'Pássaro-Trovão', 'rcc'],
  ['eletrico', 'lendario', 'dragao', 'Raiozinho', 'Raiodrago', 'Fulminatrix', 'rL'],
  ['cosmo', 'comum', 'aguaviva', 'Nebulim', 'Nebulosa', 'Supernova', 'cc'],
  ['cosmo', 'comum', 'macaco', 'Astromico', 'Astronauto', 'Galactogorila', 'co'],
  ['cosmo', 'incomum', 'mariposa', 'Lunaposa', 'Eclipsosa', 'Mariposideral', 'uc'],
  ['cosmo', 'raro', 'felino', 'Pantestrela', 'Pantegaláxia', 'Panterástro', 'ruc'],
  ['cosmo', 'raro', 'arraia', 'Cometarraia', 'Orbitarraia', 'Arraiacósmica', 'rcc'],
  ['cosmo', 'lendario', 'serpente', 'Orbitim', 'Orbiserpente', 'Constelaçon', 'rL'],
  ['trovao', 'lendario', 'grifo', 'Grifinho', 'Grifotrom', 'Grifo-Tempestade', 'fusao'],
  ['trovao', 'mitico', 'dragao', 'Trovãozinho', 'Trovardrago', 'Ragnatrovão', 'fusao'],
];

const STAGE_NAMES = ['Filhote', 'Jovem', 'Adulto'];
export const EVOLVE_AT = [5, 12];   // nível para virar Jovem e Adulto
export const EVOLVE_COST = [1, 2];  // Cristais de Evolução

function recipeFor(el, mold) {
  const I = EL_ITEMS[el] || {};
  switch (mold) {
    case 'cc': return [I.comum, I.comum];
    case 'co': return [I.comum, 'orvalho'];
    case 'uc': return [I.incomum, I.comum];
    case 'uu': return [I.incomum, I.incomum];
    case 'ruc': return [I.raro, I.incomum, I.comum];
    case 'rcc': return [I.raro, I.comum, I.comum];
    case 'rr*': return [I.raro, EL_ITEMS[next(el)].raro, 'runa'];
    case 'rL': return [I.raro, 'coroa', 'runa'];
    default: return null; // só na Fusão do Trovão
  }
}

export const FAMILIES = LINES.map((l, i) => ({
  id: i, el: l[0], rar: l[1], arch: l[2], nomes: [l[3], l[4], l[5]],
  receita: recipeFor(l[0], l[6]), fusao: l[6] === 'fusao',
}));

export const SPECIES = [];
for (const f of FAMILIES) {
  for (let s = 0; s < 3; s++) {
    SPECIES.push({ id: f.id * 3 + s, fam: f.id, stage: s, nome: f.nomes[s], el: f.el, rar: f.rar, arch: f.arch, estagio: STAGE_NAMES[s] });
  }
}
export const recipeKey = (items) => [...items].sort().join('+');
export const RECIPE_INDEX = {};
for (const f of FAMILIES) if (f.receita) RECIPE_INDEX[recipeKey(f.receita)] = f.id;
// espécie que o guia mostra (o raio-filhote)
export const GUIDE_SPECIES = FAMILIES.find((f) => f.nomes[0] === 'Raiozinho').id * 3;

// Regiões: cada uma tem uma fazendinha, uma ponte de pedra rúnica para abrir e alguém para salvar.
export const REGIONS = [
  { id: 'floresta', el: 'planta', nome: 'Floresta Viva', chao: '#5f9e3f', ceu: ['#8fc9e8', '#e3f3d8'],
    ponte: null,
    resgate: { quem: 'Vovó Margarida', g: 'a', arch: 'sapo', cor: '#e8d7c0', chapeu: 'palha', armadilha: 'ilha',
      texto: 'A ponte de cipós arrebentou e a Vovó Margarida ficou ilhada do outro lado do riacho!',
      ajuda: 'Um companheiro de Planta faz os cipós crescerem e refaz a ponte.', precisa: { el: 'planta', estagio: 0 }, itens: { trevo: 3 } } },
  { id: 'lago', el: 'agua', nome: 'Lago Profundo', chao: '#5aa68a', ceu: ['#6fb3e0', '#d8eefa'],
    ponte: { moedas: 30, itens: { trevo: 4, orvalho: 2 }, amigos: 2 },
    resgate: { quem: 'Capitão Bigode', g: 'o', arch: 'macaco', cor: '#9fb5c9', chapeu: 'marinheiro', armadilha: 'redemoinho',
      texto: 'O barco do Capitão Bigode ficou preso girando num redemoinho!',
      ajuda: 'Um companheiro de Água nada até lá e empurra o barco.', precisa: { el: 'agua', estagio: 0 }, itens: { concha: 3 } } },
  { id: 'vulcao', el: 'fogo', nome: 'Vulcão Rubro', chao: '#3b2b2b', ceu: ['#d9763f', '#3b2238'],
    ponte: { moedas: 80, itens: { concha: 5, onda: 1 }, amigos: 4 },
    resgate: { quem: 'Ferreiro Tito', g: 'o', arch: 'urso', cor: '#8a5a3a', chapeu: 'capacete', armadilha: 'nuvem',
      texto: 'Uma nuvem de chuva apagou a fornalha do Ferreiro Tito, o mestre da Forja do Trovão!',
      ajuda: 'Um companheiro de Fogo reacende a fornalha.', precisa: { el: 'fogo', estagio: 0 }, itens: { brasa: 4 } } },
  { id: 'picos', el: 'vento', nome: 'Picos dos Ventos', chao: '#8aa39a', ceu: ['#7ab4e6', '#f2f7ff'],
    ponte: { moedas: 160, itens: { brasa: 6, pimenta: 2 }, amigos: 6 },
    resgate: { quem: 'Aviadora Brisa', g: 'a', arch: 'raposa', cor: '#d9a36a', chapeu: 'touca', armadilha: 'alto',
      texto: 'O balão da Aviadora Brisa enroscou lá no alto do pico mais alto!',
      ajuda: 'Um companheiro de Vento (Jovem ou maior) voa até lá e solta o balão.', precisa: { el: 'vento', estagio: 1 }, itens: { pena: 5, nuvem: 1 } } },
  { id: 'geleira', el: 'gelo', nome: 'Geleira Eterna', chao: '#e4f2f7', ceu: ['#9cc9e8', '#eef8ff'],
    ponte: { moedas: 260, itens: { pena: 6, nuvem: 2, orvalho: 4 }, amigos: 8 },
    resgate: { quem: 'Explorador Pingo', g: 'o', arch: 'pinguim', cor: '#4a5a7a', chapeu: 'gorro', armadilha: 'gelo',
      texto: 'O Explorador Pingo escorregou e ficou congelado dentro de um bloco de gelo!',
      ajuda: 'Um companheiro de Fogo (Jovem ou maior) derrete o gelo com cuidado.', precisa: { el: 'fogo', estagio: 1 }, itens: { floco: 5, pimenta: 2 } } },
  { id: 'canion', el: 'pedra', nome: 'Cânion de Pedra', chao: '#b0784a', ceu: ['#e8a86a', '#fbe6c8'],
    ponte: { moedas: 400, itens: { floco: 8, neve: 2 }, amigos: 10 },
    resgate: { quem: 'Mestre Toupeira', g: 'o', arch: 'macaco', cor: '#a07a5a', chapeu: 'capacete', armadilha: 'pedras',
      texto: 'Um deslizamento fechou a entrada da mina do Mestre Toupeira!',
      ajuda: 'Um companheiro de Pedra (Jovem ou maior) é forte e tira as pedras.', precisa: { el: 'pedra', estagio: 1 }, itens: { seixo: 6, fossil: 2 } } },
  { id: 'raios', el: 'eletrico', nome: 'Planalto dos Raios', chao: '#4a4f63', ceu: ['#2c3458', '#6a6f9a'],
    ponte: { moedas: 600, itens: { seixo: 8, fossil: 3, gema: 1 }, amigos: 12 },
    resgate: { quem: 'Engenheira Volta', g: 'a', arch: 'raposa', cor: '#e0c060', chapeu: 'bone', armadilha: 'nevoa',
      texto: 'Uma tempestade enorme cobriu a torre da Engenheira Volta e ela não consegue sair!',
      ajuda: 'Um companheiro de Vento (Jovem ou maior) sopra a tempestade para longe.', precisa: { el: 'vento', estagio: 1 }, itens: { faisca: 6, ima: 2 } } },
  { id: 'cosmo', el: 'cosmo', nome: 'Cratera Cósmica', chao: '#2e2650', ceu: ['#0f0b2e', '#4a2d7a'],
    ponte: { moedas: 900, itens: { faisca: 8, ima: 3, tempestade: 1 }, amigos: 14 },
    resgate: { quem: 'Astronauta Estela', g: 'a', arch: 'macaco', cor: '#f0f0f8', chapeu: 'estrela', armadilha: 'bolha',
      texto: 'A nave da Astronauta Estela caiu na cratera e ficou sem energia!',
      ajuda: 'Um companheiro Elétrico Adulto carrega a bateria da nave.', precisa: { el: 'eletrico', estagio: 2 }, itens: { poeira: 6, lua: 2, coroa: 1 } } },
];
export const REGION_BY_EL = Object.fromEntries(REGIONS.map((r) => [r.el, r]));

// Conquistas (medalhas)
export const ACHIEVEMENTS = [
  { id: 'primeiro', nome: 'Primeira Forja', desc: 'Forje seu primeiro companheiro', icone: '🔨' },
  { id: 'dez', nome: 'Equipe Formada', desc: 'Tenha 10 companheiros', icone: '🛡️' },
  { id: 'cod25', nome: 'Colecionador', desc: 'Descubra 25 espécies', icone: '📖' },
  { id: 'cod50', nome: 'Explorador', desc: 'Descubra 50 espécies', icone: '🧭' },
  { id: 'cod100', nome: 'Sábio das Feras', desc: 'Descubra 100 espécies', icone: '🎓' },
  { id: 'cod150', nome: 'Mestre do Códice', desc: 'Descubra as 150 espécies', icone: '👑' },
  { id: 'evo1', nome: 'Evolução!', desc: 'Evolua um companheiro pela primeira vez', icone: '🔷' },
  { id: 'evo2', nome: 'Forma Final', desc: 'Leve um companheiro até Adulto', icone: '🏅' },
  { id: 'brilhante', nome: 'Raro de Verdade', desc: 'Encontre um companheiro cintilante', icone: '💎' },
  { id: 'epico', nome: 'Épico!', desc: 'Forje um Épico', icone: '🎉' },
  { id: 'lendario', nome: 'Lenda Viva', desc: 'Forje um Lendário', icone: '🏆' },
  { id: 'mitico', nome: 'Senhor do Trovão', desc: 'Forje o Mítico', icone: '🌩️' },
  { id: 'heroi', nome: 'Herói', desc: 'Salve alguém em perigo', icone: '🦸' },
  { id: 'herois', nome: 'Herói do Vale', desc: 'Salve as 8 pessoas', icone: '🛡️' },
  { id: 'mapa', nome: 'Desbravador', desc: 'Abra todas as pontes rúnicas', icone: '🗺️' },
  { id: 'fusao', nome: 'Fusão do Trovão', desc: 'Faça uma fusão na Forja', icone: '⚡' },
];
