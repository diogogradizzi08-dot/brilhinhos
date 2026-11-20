// Brilhinhos — todos os dados do jogo num lugar só: raridades, elementos, itens,
// as 150 espécies (50 famílias × 3 estágios), regiões, resgates e conquistas.

export const RARITIES = {
  comum:    { nome: 'Comum',    cor: '#8fd46b', estrelas: 1, pontos: 1 },
  incomum:  { nome: 'Incomum',  cor: '#4fc3f7', estrelas: 2, pontos: 3 },
  raro:     { nome: 'Raro',     cor: '#b18cff', estrelas: 3, pontos: 8 },
  epico:    { nome: 'Épico',    cor: '#ff7fc8', estrelas: 4, pontos: 20 },
  lendario: { nome: 'Lendário', cor: '#ffc22e', estrelas: 5, pontos: 40 },
  mitico:   { nome: 'Mítico',   cor: '#ff9bf0', estrelas: 6, pontos: 80 },
};
export const RARITY_ORDER = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico'];

// [cor principal, barriga, detalhe]
export const ELEMENTS = {
  planta: { nome: 'Planta', cores: ['#7ed46a', '#effad8', '#ff8fb6'], dom: 'Faz crescer', icone: '🌱' },
  agua:   { nome: 'Água',   cores: ['#5ab8f6', '#e3f4ff', '#ffd36b'], dom: 'Nada',         icone: '💧' },
  sol:    { nome: 'Sol',    cores: ['#ffa24a', '#fff1cc', '#ff6f6f'], dom: 'Aquece',       icone: '☀️' },
  vento:  { nome: 'Vento',  cores: ['#9fd3ff', '#ffffff', '#ffb3d9'], dom: 'Voa',          icone: '🪶' },
  gelo:   { nome: 'Gelo',   cores: ['#b4eef5', '#ffffff', '#6fc0ea'], dom: 'Esfria',       icone: '❄️' },
  pedra:  { nome: 'Pedra',  cores: ['#b39a80', '#f2e6d6', '#b57bff'], dom: 'É forte',      icone: '🪨' },
  sonho:  { nome: 'Sonho',  cores: ['#c6a6f2', '#f7eeff', '#ffd1ec'], dom: 'Acalma',       icone: '🌙' },
  luz:    { nome: 'Luz',    cores: ['#ffdc5c', '#fffbe8', '#ff9fcf'], dom: 'Ilumina',      icone: '✨' },
  arco:   { nome: 'Arco-íris', cores: ['#ff9ad5', '#ffffff', '#8be0ff'], dom: 'Ajuda em todo lugar', icone: '🌈' },
};

// Itens: rar = raridade do item (vale "pontos de magia" no Ninho).
export const ITEMS = {
  orvalho:  { nome: 'Gota de Orvalho',  emoji: '💧', el: null,     rar: 'comum' },
  trevo:    { nome: 'Trevo',            emoji: '🍀', el: 'planta', rar: 'comum' },
  tulipa:   { nome: 'Tulipa',           emoji: '🌷', el: 'planta', rar: 'incomum' },
  mel:      { nome: 'Mel Dourado',      emoji: '🍯', el: 'planta', rar: 'raro' },
  concha:   { nome: 'Concha',           emoji: '🐚', el: 'agua',   rar: 'comum' },
  onda:     { nome: 'Onda Mansa',       emoji: '🌊', el: 'agua',   rar: 'incomum' },
  lotus:    { nome: 'Flor de Lótus',    emoji: '🪷', el: 'agua',   rar: 'raro' },
  laranja:  { nome: 'Laranjinha',       emoji: '🍊', el: 'sol',    rar: 'comum' },
  girassol: { nome: 'Girassol',         emoji: '🌻', el: 'sol',    rar: 'incomum' },
  raio:     { nome: 'Raio de Sol',      emoji: '☀️', el: 'sol',    rar: 'raro' },
  pena:     { nome: 'Pena Leve',        emoji: '🪶', el: 'vento',  rar: 'comum' },
  nuvem:    { nome: 'Algodão de Nuvem', emoji: '☁️', el: 'vento',  rar: 'incomum' },
  sino:     { nome: 'Sino dos Ventos',  emoji: '🎐', el: 'vento',  rar: 'raro' },
  floco:    { nome: 'Floco de Neve',    emoji: '❄️', el: 'gelo',   rar: 'comum' },
  boneco:   { nome: 'Bonequinho de Neve', emoji: '⛄', el: 'gelo', rar: 'incomum' },
  cristal:  { nome: 'Cristal de Gelo',  emoji: '🧊', el: 'gelo',   rar: 'raro' },
  seixo:    { nome: 'Pedrinha Lisa',    emoji: '🪨', el: 'pedra',  rar: 'comum' },
  cogumelo: { nome: 'Cogumelo Brilhante', emoji: '🍄', el: 'pedra', rar: 'incomum' },
  gema:     { nome: 'Gema Brilhante',   emoji: '💎', el: 'pedra',  rar: 'raro' },
  petala:   { nome: 'Flor de Sonho',    emoji: '🌸', el: 'sonho',  rar: 'comum' },
  lua:      { nome: 'Gota de Lua',      emoji: '🌙', el: 'sonho',  rar: 'incomum' },
  poeira:   { nome: 'Poeira de Sonho',  emoji: '💫', el: 'sonho',  rar: 'raro' },
  pozinho:  { nome: 'Pozinho Brilhante', emoji: '✨', el: 'luz',   rar: 'comum' },
  lanterna: { nome: 'Lanterninha',      emoji: '🏮', el: 'luz',    rar: 'incomum' },
  estrela:  { nome: 'Pedaço de Estrela', emoji: '⭐', el: 'luz',   rar: 'raro' },
  arcoiris: { nome: 'Pó de Arco-íris',  emoji: '🌈', el: null,     rar: 'epico' },
  coracao:  { nome: 'Coração de Amizade', emoji: '💖', el: null,   rar: 'lendario' },
};
// Brilho de Crescer não vai no Ninho: serve para evoluir.
export const GROW_ITEM = { nome: 'Brilho de Crescer', emoji: '🌟' };

// itens de cada elemento por raridade
export const EL_ITEMS = {};
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.el) continue;
  (EL_ITEMS[it.el] ||= {})[it.rar] = id;
}

const ORDER = ['planta', 'agua', 'sol', 'vento', 'gelo', 'pedra', 'sonho', 'luz'];
export const ELEMENT_ORDER = ORDER;
const next = (el) => ORDER[(ORDER.indexOf(el) + 1) % ORDER.length];

// 50 famílias: [elemento, raridade, arquétipo, nomes dos 3 estágios, molde da receita]
const LINES = [
  ['planta', 'comum', 'coelho', 'Brotelho', 'Ramelho', 'Florelho', 'cc'],
  ['planta', 'comum', 'ourico', 'Espinhim', 'Cactuço', 'Cactuzão', 'co'],
  ['planta', 'incomum', 'sapo', 'Pingoflor', 'Sapetal', 'Rainhaflor', 'uc'],
  ['planta', 'incomum', 'cervo', 'Musguinho', 'Musgalho', 'Cervoreal', 'uu'],
  ['planta', 'raro', 'urso', 'Ursemente', 'Ursilvo', 'Ursequoia', 'ruc'],
  ['planta', 'epico', 'dragao', 'Dragafolha', 'Dragarvore', 'Florandrago', 'rr*'],
  ['agua', 'comum', 'peixe', 'Gotelim', 'Gotelão', 'Maregrão', 'cc'],
  ['agua', 'comum', 'foca', 'Foquinha', 'Focarina', 'Focaçu', 'co'],
  ['agua', 'incomum', 'tartaruga', 'Tartagota', 'Tartaonda', 'Tartamaré', 'uc'],
  ['agua', 'incomum', 'axolote', 'Axolinho', 'Axolago', 'Axolírio', 'uu'],
  ['agua', 'raro', 'raposa', 'Raposágua', 'Rapomaré', 'Rapoceano', 'ruc'],
  ['agua', 'epico', 'dragao', 'Marinhito', 'Marinhaço', 'Dragamar', 'rr*'],
  ['sol', 'comum', 'rato', 'Faisquinha', 'Faiscão', 'Faiscolar', 'cc'],
  ['sol', 'comum', 'passaro', 'Pintossol', 'Pintolume', 'Galossol', 'co'],
  ['sol', 'incomum', 'raposa', 'Raposol', 'Raposolar', 'Raposolstício', 'uc'],
  ['sol', 'incomum', 'gato', 'Solgatinho', 'Solgato', 'Solgatarca', 'uu'],
  ['sol', 'raro', 'carneiro', 'Novelsol', 'Novelouro', 'Novelastro', 'ruc'],
  ['sol', 'epico', 'dragao', 'Dragolim', 'Dragolar', 'Dragaurora', 'rr*'],
  ['vento', 'comum', 'passaro', 'Piuzinho', 'Piuvoa', 'Piurrei', 'cc'],
  ['vento', 'comum', 'esquilo', 'Planinho', 'Planador', 'Planacéu', 'co'],
  ['vento', 'incomum', 'coruja', 'Coruvinha', 'Coruventa', 'Coruceleste', 'uc'],
  ['vento', 'incomum', 'coelho', 'Algodinho', 'Algodelho', 'Algodorei', 'uu'],
  ['vento', 'raro', 'gato', 'Brisinha', 'Brisgata', 'Brisarquesa', 'ruc'],
  ['vento', 'epico', 'dragao', 'Nimbinho', 'Nimbão', 'Nimbodrago', 'rr*'],
  ['gelo', 'comum', 'pinguim', 'Gelim', 'Gelinguim', 'Pinguimperador', 'cc'],
  ['gelo', 'comum', 'foca', 'Floquinho', 'Flocudo', 'Flocorei', 'co'],
  ['gelo', 'incomum', 'raposa', 'Nevinha', 'Nevarapa', 'Nevarainha', 'uc'],
  ['gelo', 'incomum', 'urso', 'Polarito', 'Polarão', 'Polaurso', 'uu'],
  ['gelo', 'raro', 'cervo', 'Renazinha', 'Renagelo', 'Renaurora', 'ruc'],
  ['gelo', 'epico', 'dragao', 'Glacim', 'Glacirão', 'Glacidrago', 'rr*'],
  ['pedra', 'comum', 'tartaruga', 'Seixinho', 'Seixudo', 'Seixolosso', 'cc'],
  ['pedra', 'comum', 'rato', 'Cavinho', 'Cavudo', 'Cavernauta', 'co'],
  ['pedra', 'incomum', 'ourico', 'Quartzinho', 'Quartzão', 'Quartzorei', 'uc'],
  ['pedra', 'incomum', 'urso', 'Rochito', 'Rochursso', 'Rochedão', 'uu'],
  ['pedra', 'raro', 'cervo', 'Gemelim', 'Gemelino', 'Gemelorde', 'ruc'],
  ['pedra', 'epico', 'dragao', 'Rubinho', 'Rubidrago', 'Rubirrei', 'rr*'],
  ['sonho', 'comum', 'carneiro', 'Cochilim', 'Cochilã', 'Cochilorde', 'cc'],
  ['sonho', 'comum', 'gato', 'Miaulua', 'Miauluar', 'Miaucrescente', 'co'],
  ['sonho', 'incomum', 'coruja', 'Pijaminha', 'Pijamuja', 'Pijamarca', 'uc'],
  ['sonho', 'raro', 'coelho', 'Lunelho', 'Lunelar', 'Lunelestial', 'ruc'],
  ['sonho', 'raro', 'panda', 'Pandorminho', 'Pandormente', 'Pandormestre', 'rcc'],
  ['sonho', 'lendario', 'raposa', 'Nebulinha', 'Nébula', 'Nebulária', 'rL'],
  ['luz', 'comum', 'passaro', 'Brilhinho', 'Brilhão', 'Brilhastro', 'cc'],
  ['luz', 'comum', 'esquilo', 'Cintilim', 'Cintilado', 'Cintilorde', 'co'],
  ['luz', 'incomum', 'cervo', 'Lumi', 'Lumino', 'Luminário', 'uc'],
  ['luz', 'raro', 'gato', 'Astrogatinho', 'Astrogato', 'Astrogaláctico', 'ruc'],
  ['luz', 'raro', 'axolote', 'Cometinho', 'Cometote', 'Cometarca', 'rcc'],
  ['luz', 'lendario', 'dragao', 'Estrelim', 'Estrelaço', 'Estreladrago', 'rL'],
  ['arco', 'lendario', 'cervo', 'Irizinho', 'Irizado', 'Iridalis', 'festa'],
  ['arco', 'mitico', 'raposa', 'Encantim', 'Encantado', 'Encantária', 'festa'],
];

const STAGE_NAMES = ['Filhote', 'Jovem', 'Adulto'];
export const EVOLVE_AT = [5, 12];   // nível para virar Jovem e Adulto
export const EVOLVE_COST = [1, 2];  // Brilhos de Crescer

function recipeFor(el, mold) {
  const I = EL_ITEMS[el] || {};
  switch (mold) {
    case 'cc': return [I.comum, I.comum];
    case 'co': return [I.comum, 'orvalho'];
    case 'uc': return [I.incomum, I.comum];
    case 'uu': return [I.incomum, I.incomum];
    case 'ruc': return [I.raro, I.incomum, I.comum];
    case 'rcc': return [I.raro, I.comum, I.comum];
    case 'rr*': return [I.raro, EL_ITEMS[next(el)].raro, 'arcoiris'];
    case 'rL': return [I.raro, 'coracao', 'arcoiris'];
    default: return null; // só na Festa da Amizade
  }
}

export const FAMILIES = LINES.map((l, i) => ({
  id: i, el: l[0], rar: l[1], arch: l[2], nomes: [l[3], l[4], l[5]],
  receita: recipeFor(l[0], l[6]), festa: l[6] === 'festa',
}));

// 150 espécies: id = família*3 + estágio
export const SPECIES = [];
for (const f of FAMILIES) {
  for (let s = 0; s < 3; s++) {
    SPECIES.push({ id: f.id * 3 + s, fam: f.id, stage: s, nome: f.nomes[s], el: f.el, rar: f.rar, arch: f.arch, estagio: STAGE_NAMES[s] });
  }
}
export const recipeKey = (items) => [...items].sort().join('+');
export const RECIPE_INDEX = {};
for (const f of FAMILIES) if (f.receita) RECIPE_INDEX[recipeKey(f.receita)] = f.id;

// Regiões: cada uma tem uma fazendinha, uma ponte arco-íris para abrir e alguém para salvar.
export const REGIONS = [
  { id: 'prado', el: 'planta', nome: 'Prado Florido', chao: '#8fdc6e', ceu: ['#bff1ff', '#e9fff0'],
    ponte: null,
    resgate: { quem: 'Vovó Margarida', g: 'a', arch: 'carneiro', cor: '#fff6ea', chapeu: 'palha', armadilha: 'ilha',
      texto: 'A ponte de flores murchou e a Vovó Margarida ficou sozinha do outro lado do riacho!',
      ajuda: 'Um amigo de Planta faz as flores da ponte crescerem de novo.', precisa: { el: 'planta', estagio: 0 }, itens: { trevo: 3 } } },
  { id: 'lago', el: 'agua', nome: 'Lago Cristalino', chao: '#7fd6c0', ceu: ['#a8e4ff', '#e8f8ff'],
    ponte: { moedas: 30, itens: { trevo: 4, orvalho: 2 }, amigos: 2 },
    resgate: { quem: 'Capitão Bigodinho', g: 'o', arch: 'foca', cor: '#9fb5c9', chapeu: 'marinheiro', armadilha: 'redemoinho',
      texto: 'O barquinho do Capitão Bigodinho ficou girando num redemoinho!',
      ajuda: 'Um amigo de Água nada até lá e empurra o barquinho.', precisa: { el: 'agua', estagio: 0 }, itens: { concha: 3 } } },
  { id: 'sol', el: 'sol', nome: 'Vale do Sol', chao: '#f6d77a', ceu: ['#ffe3b3', '#fff6e0'],
    ponte: { moedas: 80, itens: { concha: 5, onda: 1 }, amigos: 4 },
    resgate: { quem: 'Pipoca', g: 'o', arch: 'passaro', cor: '#ffe36b', chapeu: 'bone', armadilha: 'nuvem',
      texto: 'Uma nuvem de chuva parou em cima do Pipoca e ele está todo molhadinho e com frio!',
      ajuda: 'Um amigo de Sol aquece e seca o Pipoca.', precisa: { el: 'sol', estagio: 0 }, itens: { laranja: 4 } } },
  { id: 'vento', el: 'vento', nome: 'Ilhas das Nuvens', chao: '#cdeeff', ceu: ['#c9e6ff', '#ffffff'],
    ponte: { moedas: 160, itens: { laranja: 6, girassol: 2 }, amigos: 6 },
    resgate: { quem: 'Tia Brisa', g: 'a', arch: 'coruja', cor: '#d9c2a3', chapeu: 'touca', armadilha: 'alto',
      texto: 'O balão da Tia Brisa enroscou lá no alto da Torre das Nuvens!',
      ajuda: 'Um amigo de Vento (Jovem ou maior) voa até lá e solta o balão.', precisa: { el: 'vento', estagio: 1 }, itens: { pena: 5, nuvem: 1 } } },
  { id: 'gelo', el: 'gelo', nome: 'Montanha Nevada', chao: '#eefbff', ceu: ['#d6f2ff', '#f7fdff'],
    ponte: { moedas: 260, itens: { pena: 6, nuvem: 2, orvalho: 4 }, amigos: 8 },
    resgate: { quem: 'Pingo', g: 'o', arch: 'pinguim', cor: '#4a5a7a', chapeu: 'gorro', armadilha: 'gelo',
      texto: 'O Pingo escorregou e ficou preso dentro de um bloco de gelo!',
      ajuda: 'Um amigo de Sol (Jovem ou maior) derrete o gelo bem devagarinho.', precisa: { el: 'sol', estagio: 1 }, itens: { floco: 5, girassol: 2 } } },
  { id: 'pedra', el: 'pedra', nome: 'Caverna Brilhante', chao: '#d2c0a6', ceu: ['#e7d9ff', '#fff3e6'],
    ponte: { moedas: 400, itens: { floco: 8, boneco: 2 }, amigos: 10 },
    resgate: { quem: 'Mestre Toupeira', g: 'o', arch: 'rato', cor: '#a07a5a', chapeu: 'capacete', armadilha: 'pedras',
      texto: 'Pedras rolaram e fecharam a saída da casinha do Mestre Toupeira!',
      ajuda: 'Um amigo de Pedra (Jovem ou maior) é forte e tira as pedras do caminho.', precisa: { el: 'pedra', estagio: 1 }, itens: { seixo: 6, cogumelo: 2 } } },
  { id: 'sonho', el: 'sonho', nome: 'Bosque da Lua', chao: '#c7b8ee', ceu: ['#b8b0f0', '#f3e6ff'],
    ponte: { moedas: 600, itens: { seixo: 8, cogumelo: 3, gema: 1 }, amigos: 12 },
    resgate: { quem: 'Bebê Coala', g: 'o', arch: 'urso', cor: '#b5b9c4', chapeu: 'dormir', armadilha: 'nevoa',
      texto: 'O Bebê Coala se perdeu no meio de uma névoa fofinha e não acha o caminho de casa!',
      ajuda: 'Um amigo de Vento (Jovem ou maior) sopra a névoa para longe.', precisa: { el: 'vento', estagio: 1 }, itens: { petala: 6, lua: 2 } } },
  { id: 'luz', el: 'luz', nome: 'Jardim das Estrelas', chao: '#fff0b8', ceu: ['#ffd9f2', '#fffbe0'],
    ponte: { moedas: 900, itens: { petala: 8, lua: 3, poeira: 1 }, amigos: 14 },
    resgate: { quem: 'Estrelinha', g: 'a', arch: 'gato', cor: '#ffe680', chapeu: 'estrela', armadilha: 'bolha',
      texto: 'A Estrelinha caiu do céu, ficou com medo e se escondeu dentro de uma bolha!',
      ajuda: 'Um amigo de Sonho Adulto canta uma canção de ninar e acalma a Estrelinha.', precisa: { el: 'sonho', estagio: 2 }, itens: { pozinho: 6, lanterna: 2, coracao: 1 } } },
];
export const REGION_BY_EL = Object.fromEntries(REGIONS.map((r) => [r.el, r]));

// Conquistas (medalhas)
export const ACHIEVEMENTS = [
  { id: 'primeiro', nome: 'Primeiro Amigo', desc: 'Faça nascer seu primeiro Brilhinho', icone: '🥚' },
  { id: 'dez', nome: 'Turminha', desc: 'Tenha 10 amigos', icone: '👫' },
  { id: 'cod25', nome: 'Colecionador', desc: 'Descubra 25 espécies', icone: '📖' },
  { id: 'cod50', nome: 'Explorador', desc: 'Descubra 50 espécies', icone: '🧭' },
  { id: 'cod100', nome: 'Sábio dos Brilhinhos', desc: 'Descubra 100 espécies', icone: '🎓' },
  { id: 'cod150', nome: 'Mestre do Códice', desc: 'Descubra as 150 espécies', icone: '👑' },
  { id: 'evo1', nome: 'Crescendo!', desc: 'Evolua um amigo pela primeira vez', icone: '🌟' },
  { id: 'evo2', nome: 'Tudo Grande!', desc: 'Leve um amigo até Adulto', icone: '🏅' },
  { id: 'brilhante', nome: 'Que Brilho!', desc: 'Encontre um Brilhinho cintilante', icone: '💎' },
  { id: 'epico', nome: 'Uau, Épico!', desc: 'Faça nascer um Épico', icone: '🎉' },
  { id: 'lendario', nome: 'Lenda Viva', desc: 'Faça nascer um Lendário', icone: '🏆' },
  { id: 'mitico', nome: 'Encantado', desc: 'Faça nascer o Mítico', icone: '🦄' },
  { id: 'heroi', nome: 'Pequeno Herói', desc: 'Salve alguém em perigo', icone: '🦸' },
  { id: 'herois', nome: 'Herói de Todos', desc: 'Salve as 8 pessoas', icone: '🌈' },
  { id: 'mapa', nome: 'Viajante', desc: 'Abra todas as pontes arco-íris', icone: '🗺️' },
  { id: 'festa', nome: 'Festa da Amizade', desc: 'Faça uma Festa da Amizade', icone: '🎈' },
];
