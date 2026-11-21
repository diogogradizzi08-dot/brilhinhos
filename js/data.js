// Brilhinhos — todos os dados do jogo num lugar só: raridades, elementos, itens,
// as 150 espécies (450 no Códice, com as evoluções), regiões, resgates e conquistas.

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

// recursos da fazendinha (não têm elemento)
Object.assign(ITEMS, {
  madeira: { nome: 'Madeira',        emoji: '🪵', el: null, rar: 'comum', recurso: true },
  ferro:   { nome: 'Ferro Bruto',    emoji: '🔩', el: null, rar: 'comum', recurso: true },
  fruta:   { nome: 'Fruta Energética', emoji: '🍎', el: null, rar: 'comum', recurso: true },
  barra:   { nome: 'Barra de Metal', emoji: '🧱', el: null, rar: 'incomum', recurso: true },
  racao:   { nome: 'Ração Turbo', emoji: '🥗', el: null, rar: 'incomum', recurso: true, comida: 40, energia: 20, cocho: 25 },
  espetinho: { nome: 'Espetinho de Fruta', emoji: '🍢', el: null, rar: 'comum', recurso: true, energia: 25, cocho: 8 },
  mingau:  { nome: 'Mingau Quentinho', emoji: '🥣', el: null, rar: 'comum', recurso: true, energia: 35, cocho: 10 },
  torta:   { nome: 'Torta de Frutas', emoji: '🥧', el: null, rar: 'incomum', recurso: true, energia: 70, cocho: 20 },
  morango: { nome: 'Morango', emoji: '🍓', el: null, rar: 'comum', recurso: true, energia: 10, cocho: 4 },
  cenoura: { nome: 'Cenoura', emoji: '🥕', el: null, rar: 'comum', recurso: true, energia: 10, cocho: 4 },
  alface:  { nome: 'Alface', emoji: '🥬', el: null, rar: 'comum', recurso: true, energia: 8, cocho: 4 },
  tomate:  { nome: 'Tomate', emoji: '🍅', el: null, rar: 'comum', recurso: true, energia: 12, cocho: 5 },
  girassol: { nome: 'Girassol', emoji: '🌻', el: null, rar: 'incomum', recurso: true },
});
// o que dá para plantar no canteiro (cada um cresce no seu tempo e dá o seu item)
export const CROPS = {
  fruta:    { nome: 'Fruta Energética', emoji: '🍎', tipo: 'Fruta', item: 'fruta', tempo: 60000, nivel: 1, qtd: 1 },
  cenoura:  { nome: 'Cenoura', emoji: '🥕', tipo: 'Legume', item: 'cenoura', tempo: 75000, nivel: 1, qtd: 2 },
  alface:   { nome: 'Alface', emoji: '🥬', tipo: 'Verdura', item: 'alface', tempo: 45000, nivel: 2, qtd: 2 },
  morango:  { nome: 'Morango', emoji: '🍓', tipo: 'Fruta', item: 'morango', tempo: 60000, nivel: 2, qtd: 2 },
  tomate:   { nome: 'Tomate', emoji: '🍅', tipo: 'Legume', item: 'tomate', tempo: 90000, nivel: 3, qtd: 3 },
  girassol: { nome: 'Girassol', emoji: '🌻', tipo: 'Flor', item: 'girassol', tempo: 80000, nivel: 3, qtd: 2 },
};
// itens de época: só aparecem durante a época deles (e chamam os bichos especiais na Forja)
Object.assign(ITEMS, {
  enfeite: { nome: 'Enfeite de Natal', emoji: '🎄', el: null, rar: 'incomum', tema: 'natal' },
  coco:    { nome: 'Coco Gelado',      emoji: '🥥', el: null, rar: 'incomum', tema: 'ferias' },
  confete: { nome: 'Confete',          emoji: '🎊', el: null, rar: 'incomum', tema: 'carnaval' },
  ovinho:  { nome: 'Ovinho Pintado',   emoji: '🥚', el: null, rar: 'incomum', tema: 'pascoa' },
  milho:   { nome: 'Milho Verde',      emoji: '🌽', el: null, rar: 'incomum', tema: 'junina' },
  abobora: { nome: 'Abóbora Sorridente', emoji: '🎃', el: null, rar: 'incomum', tema: 'halloween' },
});
// itens especiais de época: prêmio das missões de época (raros, chamam bichos de época na Forja)
Object.assign(ITEMS, {
  sino:     { nome: 'Sino Dourado',      emoji: '🔔', el: null, rar: 'raro', tema: 'natal', especial: true },
  prancha:  { nome: 'Prancha de Surfe',  emoji: '🏄', el: null, rar: 'raro', tema: 'ferias', especial: true },
  mascara:  { nome: 'Máscara de Plumas', emoji: '🪅', el: null, rar: 'raro', tema: 'carnaval', especial: true },
  chocolate:{ nome: 'Ovo de Chocolate',  emoji: '🍫', el: null, rar: 'raro', tema: 'pascoa', especial: true },
  sanfona:  { nome: 'Sanfona',           emoji: '🪗', el: null, rar: 'raro', tema: 'junina', especial: true },
  pirulito: { nome: 'Pirulito Mágico',   emoji: '🍭', el: null, rar: 'raro', tema: 'halloween', especial: true },
});
export const SPECIAL_ITEM = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.especial).map(([id, it]) => [it.tema, id]));
export const THEME_ITEM = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.tema && !it.especial).map(([id, it]) => [it.tema, id]));

export const EL_ITEMS = {};
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.el) continue;
  (EL_ITEMS[it.el] ||= {})[it.rar] = id;
}

const ORDER = ['planta', 'agua', 'fogo', 'vento', 'gelo', 'pedra', 'eletrico', 'cosmo'];
export const ELEMENT_ORDER = ORDER;
const next = (el) => ORDER[(ORDER.indexOf(el) + 1) % ORDER.length];

// ---------- habilidades de trabalho (estilo Palworld) ----------
export const SKILLS = {
  semear:    { nome: 'Semear',    icone: '🌱', desc: 'Planta sementes nos canteiros' },
  regar:     { nome: 'Regar',     icone: '💦', desc: 'Rega os canteiros semeados' },
  cortar:    { nome: 'Cortar',    icone: '🪓', desc: 'Corta árvores e traz madeira' },
  minerar:   { nome: 'Minerar',   icone: '⛏️', desc: 'Quebra rochas e traz ferro e pedras' },
  acender:   { nome: 'Acender',   icone: '🔥', desc: 'Acende o Forno e funde ferro em barras' },
  coletar:   { nome: 'Coletar',   icone: '🧺', desc: 'Colhe as frutas prontas da plantação' },
  congelar:  { nome: 'Congelar',  icone: '❄️', desc: 'Guarda o frescor: as frutas colhidas rendem mais' },
  energizar: { nome: 'Energizar', icone: '⚡', desc: 'Dá energia: a fazendinha inteira trabalha mais rápido' },
  encantar:  { nome: 'Encantar',  icone: '✨', desc: 'Acha itens raros quando explora a região' },
};
const EL_SKILL = { planta: 'semear', agua: 'regar', fogo: 'acender', vento: 'coletar', gelo: 'congelar', pedra: 'minerar', eletrico: 'energizar', cosmo: 'encantar', trovao: 'energizar' };
const ARCH_SKILLS = {
  urso: ['cortar', 'coletar'], macaco: ['cortar', 'coletar'], golem: ['minerar', 'cortar'], rinoceronte: ['cortar', 'minerar'],
  mamute: ['cortar', 'minerar'], javali: ['minerar', 'coletar'], dino: ['cortar', 'minerar'], besouro: ['minerar', 'cortar'],
  escorpiao: ['minerar', 'cortar'], crocodilo: ['cortar', 'regar'], hipopotamo: ['regar', 'cortar'], lagarto: ['minerar', 'coletar'],
  tartaruga: ['minerar', 'regar'], lobo: ['coletar', 'cortar'], raposa: ['coletar', 'semear'], felino: ['coletar', 'cortar'],
  cavalo: ['coletar', 'cortar'], coelho: ['semear', 'coletar'], ave: ['coletar', 'semear'], morcego: ['coletar', 'semear'],
  coruja: ['coletar', 'semear'], mariposa: ['semear', 'coletar'], sapo: ['regar', 'coletar'], lontra: ['cortar', 'regar'],
  pinguim: ['regar', 'coletar'], peixe: ['regar'], tubarao: ['regar', 'coletar'], arraia: ['regar'], serpente: ['regar', 'coletar'],
  enguia: ['regar', 'energizar'], aguaviva: ['regar', 'encantar'], polvo: ['regar', 'coletar'], cervo: ['semear', 'coletar'],
  porcoespinho: ['semear', 'minerar'], grifo: ['coletar', 'cortar'], dragao: ['acender', 'cortar'],
};
const ALL_SKILLS = Object.keys(SKILLS);
export const SKILL_COUNT = { comum: 1, incomum: 2, raro: 2, epico: 3, lendario: 3, mitico: 4 };
const SKILL_BASE = { comum: 1, incomum: 1, raro: 2, epico: 2, lendario: 3, mitico: 4 };
// itens que cada tarefa rende, pela raridade (o estágio soma +25% por degrau)
export const YIELD = { comum: 1, incomum: 1.4, raro: 1.8, epico: 2.3, lendario: 3, mitico: 4 };

// ---------- as 150 espécies ----------
// por elemento: 6 comuns, 5 incomuns, 4 raras, 2 épicas e 1 lendária = 18; mais 6 do Trovão.
const ROSTER = {
  planta:   { c: ['coelho', 'sapo', 'besouro', 'porcoespinho', 'lagarto', 'mariposa'], i: ['cervo', 'macaco', 'coruja', 'javali', 'tartaruga'], r: ['urso', 'cavalo', 'crocodilo', 'escorpiao'], e: ['dino', 'golem'], l: ['dragao'],
    pre: ['Bro', 'Fol', 'Ram', 'Mus', 'Cipo', 'Galho', 'Hera', 'Selva', 'Flor', 'Raiz', 'Mato', 'Verde', 'Polen', 'Seiva', 'Lima', 'Orqui', 'Junco', 'Cacto'] },
  agua:     { c: ['peixe', 'sapo', 'tartaruga', 'lontra', 'aguaviva', 'pinguim'], i: ['arraia', 'lagarto', 'enguia', 'crocodilo', 'ave'], r: ['lobo', 'tubarao', 'hipopotamo', 'cavalo'], e: ['serpente', 'polvo'], l: ['dragao'],
    pre: ['Gota', 'Mare', 'Onda', 'Rio', 'Lago', 'Bruma', 'Coral', 'Abis', 'Ondi', 'Aqua', 'Marul', 'Tsuna', 'Perla', 'Delta', 'Fonte', 'Nau', 'Golfo', 'Hidro'] },
  fogo:     { c: ['lagarto', 'javali', 'raposa', 'ave', 'besouro', 'escorpiao'], i: ['felino', 'cavalo', 'macaco', 'coelho', 'lontra'], r: ['rinoceronte', 'lobo', 'crocodilo', 'golem'], e: ['dino', 'ave'], l: ['dragao'],
    pre: ['Brasa', 'Flama', 'Lava', 'Fumo', 'Pira', 'Igni', 'Calor', 'Magma', 'Ardi', 'Faro', 'Tocha', 'Fulgo', 'Pavio', 'Solar', 'Vulca', 'Rubi', 'Cinza', 'Infer'] },
  vento:    { c: ['ave', 'mariposa', 'coelho', 'morcego', 'raposa', 'porcoespinho'], i: ['felino', 'coruja', 'cavalo', 'lontra', 'serpente'], r: ['grifo', 'lobo', 'arraia', 'cervo'], e: ['dragao', 'ave'], l: ['serpente'],
    pre: ['Brisa', 'Sopro', 'Rajada', 'Nimbo', 'Cirro', 'Tufo', 'Ventu', 'Aero', 'Ciclo', 'Brisan', 'Asa', 'Zefi', 'Nuvo', 'Pluma', 'Ventan', 'Furac', 'Aura', 'Celes'] },
  gelo:     { c: ['pinguim', 'raposa', 'coelho', 'lontra', 'aguaviva', 'besouro'], i: ['urso', 'cervo', 'coruja', 'lobo', 'tartaruga'], r: ['golem', 'felino', 'polvo', 'cavalo'], e: ['dragao', 'tubarao'], l: ['mamute'],
    pre: ['Neve', 'Gela', 'Floco', 'Grani', 'Glaci', 'Iglu', 'Crio', 'Geada', 'Polar', 'Frio', 'Inver', 'Artico', 'Tundra', 'Nevas', 'Gelin', 'Aurora', 'Boreal', 'Icebe'] },
  pedra:    { c: ['tartaruga', 'besouro', 'porcoespinho', 'lagarto', 'macaco', 'escorpiao'], i: ['cervo', 'javali', 'crocodilo', 'coruja', 'urso'], r: ['rinoceronte', 'dino', 'hipopotamo', 'lobo'], e: ['mamute', 'dragao'], l: ['golem'],
    pre: ['Rocha', 'Seixo', 'Grani', 'Basal', 'Quartz', 'Mina', 'Geo', 'Pedre', 'Fossi', 'Calca', 'Monti', 'Rupe', 'Crista', 'Duro', 'Areia', 'Canion', 'Onix', 'Titan'] },
  eletrico: { c: ['enguia', 'raposa', 'coelho', 'besouro', 'ave', 'lagarto'], i: ['lobo', 'felino', 'mariposa', 'porcoespinho', 'morcego'], r: ['grifo', 'cavalo', 'dino', 'escorpiao'], e: ['dragao', 'tubarao'], l: ['ave'],
    pre: ['Volt', 'Watt', 'Choque', 'Faisca', 'Raio', 'Ampe', 'Ohm', 'Dina', 'Ion', 'Plasma', 'Neon', 'Tesla', 'Bobi', 'Surto', 'Pulso', 'Gera', 'Eletro', 'Zap'] },
  cosmo:    { c: ['aguaviva', 'macaco', 'mariposa', 'coruja', 'polvo', 'raposa'], i: ['felino', 'arraia', 'cervo', 'serpente', 'morcego'], r: ['lobo', 'urso', 'dragao', 'golem'], e: ['serpente', 'grifo'], l: ['cavalo'],
    pre: ['Astro', 'Luna', 'Nebu', 'Orbi', 'Cosmo', 'Galax', 'Plane', 'Cometa', 'Estel', 'Eclip', 'Quasa', 'Pulsa', 'Nova', 'Sidera', 'Zenit', 'Vacuo', 'Saturn', 'Meteo'] },
};
const THUNDER = [['lendario', 'grifo', 'Trovo'], ['lendario', 'lobo', 'Tempes'], ['lendario', 'cavalo', 'Fulmen'], ['mitico', 'dragao', 'Ragna'], ['mitico', 'serpente', 'Relamp'], ['mitico', 'golem', 'Tron']];
// o pedaço do nome que vem do animal, por estágio
const ARCH_NAMES = {
  lobo: ['lupi', 'lobo', 'uivante'], raposa: ['rapi', 'raposa', 'kitsuno'], felino: ['gatim', 'felis', 'leonar'], cervo: ['corcin', 'cervo', 'alcerion'],
  urso: ['ursim', 'urso', 'ursaltan'], javali: ['porqui', 'javal', 'javalorn'], lagarto: ['lagui', 'sauro', 'lagartex'], tartaruga: ['tartim', 'casco', 'fortudo'],
  rinoceronte: ['rinim', 'rino', 'rinotank'], mamute: ['mamim', 'mamut', 'mamutão'], dragao: ['dragui', 'draco', 'dragonix'], grifo: ['grifim', 'grifo', 'grifaltor'],
  cavalo: ['potri', 'corcel', 'pegasor'], coelho: ['pim', 'pulo', 'lebrão'], crocodilo: ['croqui', 'croco', 'crocodor'], hipopotamo: ['hipim', 'hipo', 'hipotanque'],
  lontra: ['lontrim', 'lontra', 'lontrax'], porcoespinho: ['espim', 'espinho', 'espinhor'], sapo: ['girin', 'sapo', 'saporrei'], pinguim: ['pingui', 'pinguim', 'pinguinator'],
  macaco: ['miqui', 'macaco', 'gorilon'], golem: ['pedrim', 'golem', 'colosso'], dino: ['dinim', 'dino', 'tiranor'], coruja: ['corujim', 'coruja', 'corujarca'],
  ave: ['piu', 'falco', 'aquilor'], morcego: ['morcim', 'morcego', 'noturnex'], peixe: ['peixim', 'barbo', 'peixarrão'], tubarao: ['tubarim', 'tubarão', 'tubarex'],
  arraia: ['arrai', 'arraia', 'arraiamante'], serpente: ['cobri', 'serpe', 'leviatã'], enguia: ['engui', 'enguia', 'enguilon'], besouro: ['besuri', 'besouro', 'escaravor'],
  mariposa: ['larvi', 'mariposa', 'mariposeon'], escorpiao: ['escorpim', 'escorpio', 'escorpiarca'], aguaviva: ['medusim', 'medusa', 'medusarca'], polvo: ['polvim', 'polvo', 'kraken'],
};
// evoluções que TRANSFORMAM: em metade das famílias destes animais, o adulto vira outro bicho
const EVO_ARCH = { lagarto: 'dragao', peixe: 'tubarao', raposa: 'lobo', coelho: 'cavalo', aguaviva: 'polvo', lontra: 'crocodilo', ave: 'grifo', enguia: 'serpente', besouro: 'escorpiao', porcoespinho: 'javali' };

const STAGE_NAMES = ['Filhote', 'Jovem', 'Adulto'];
export const EVOLVE_AT = [5, 12];
export const EVOLVE_COST = [1, 2];

const MOLDS = { comum: ['ccc', 'cco', 'ccn', 'ccm', 'ccf', 'cno'], incomum: ['ucc', 'uco', 'uuc', 'ucm', 'uci'], raro: ['ruc', 'rcc', 'ruu', 'rcb'], epico: ['rr*', 'ru*'], lendario: ['rL'] };
function recipeFor(el, mold) {
  const I = EL_ITEMS[el] || {}, N = EL_ITEMS[next(el)] || {};
  return ({
    ccc: [I.comum, I.comum, I.comum], cco: [I.comum, I.comum, 'orvalho'], ccn: [I.comum, I.comum, N.comum], ccm: [I.comum, I.comum, 'madeira'], ccf: [I.comum, I.comum, 'fruta'], cno: [I.comum, N.comum, 'orvalho'],
    ucc: [I.incomum, I.comum, I.comum], uco: [I.incomum, I.comum, 'orvalho'], uuc: [I.incomum, I.incomum, I.comum], ucm: [I.incomum, I.comum, 'madeira'], uci: [I.incomum, I.comum, 'ferro'],
    ruc: [I.raro, I.incomum, I.comum], rcc: [I.raro, I.comum, I.comum], ruu: [I.raro, I.incomum, I.incomum], rcb: [I.raro, I.comum, 'barra'],
    'rr*': [I.raro, N.raro, 'runa'], 'ru*': [I.raro, N.incomum, 'runa'], rL: [I.raro, 'coroa', 'runa'],
  })[mold] || null;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }

export const FAMILIES = [];
for (const el of ORDER) {
  const R = ROSTER[el]; let k = 0;
  for (const [key, rar] of [['c', 'comum'], ['i', 'incomum'], ['r', 'raro'], ['e', 'epico'], ['l', 'lendario']]) {
    R[key].forEach((arch, j) => {
      const id = FAMILIES.length; const pre = R.pre[k++];
      FAMILIES.push({ id, el, rar, arch, pre, receita: recipeFor(el, MOLDS[rar][j]), fusao: false });
    });
  }
}
for (const [rar, arch, pre] of THUNDER) FAMILIES.push({ id: FAMILIES.length, el: 'trovao', rar, arch, pre, receita: null, fusao: true });
export const BASE_FAMILIES = FAMILIES.length; // 150
export const CODEX_TOTAL = BASE_FAMILIES * 3;  // 450
// bichos de época: fantasias e cores especiais; ficam na equipe para sempre
const SEASONAL = {
  natal: [['comum', 'gelo', 'pinguim', ['Pinguinoel', 'Pinguinatal', 'Pinguinoelzão'], ['gorro_natal', 'cachecol'], ['#2b3550', '#ffffff', '#ff4a4a']],
    ['incomum', 'gelo', 'cervo', ['Renazinha', 'Renalume', 'Renaestrela'], ['rena', 'cachecol'], ['#9a6a44', '#f2e2c8', '#ff3a3a']],
    ['raro', 'gelo', 'urso', ['Ursinoel', 'Ursonevado', 'Ursonatalino'], ['gorro_natal', 'cachecol'], ['#f4f6fa', '#d9e6f2', '#ff4a4a']]],
  ferias: [['comum', 'agua', 'tartaruga', ['Tartapraia', 'Tartasurfe', 'Tartaverão'], ['oculos'], ['#3fb59a', '#f6e2a8', '#ffd34d']],
    ['incomum', 'agua', 'lontra', ['Lontraboia', 'Lontrasol', 'Lontramarola'], ['oculos', 'boia'], ['#a8744a', '#f4dcc0', '#ff6a8a']],
    ['raro', 'agua', 'tubarao', ['Tubarolinho', 'Tubasurfista', 'Tubaverãozão'], ['oculos', 'colar_flores'], ['#6aa0c8', '#eef6ff', '#ffd34d']]],
  carnaval: [['comum', 'vento', 'ave', ['Arafolinha', 'Arafolia', 'Arassambista'], ['plumas'], ['#2f7aff', '#ffd34d', '#ff4f8a']],
    ['incomum', 'planta', 'macaco', ['Miquifolia', 'Macacofolia', 'Gorilafolia'], ['mascara', 'colar_flores'], ['#8a5a3a', '#f2d2a8', '#ff4fb0']],
    ['raro', 'fogo', 'felino', ['Onçafolia', 'Onçapluma', 'Onçarainha'], ['plumas', 'mascara'], ['#f2a83a', '#fff2cc', '#ff4fb0']]],
  pascoa: [['comum', 'planta', 'coelho', ['Pascoelhinho', 'Pascoelho', 'Pascoelhão'], ['laco'], ['#ffd6e8', '#ffffff', '#ff8ac2']],
    ['incomum', 'vento', 'ave', ['Pintinhovo', 'Pintapasco', 'Galopascoal'], ['casca_ovo'], ['#ffe066', '#fff6c8', '#ffb347']],
    ['raro', 'planta', 'tartaruga', ['Tartovo', 'Tartachoco', 'Tartaovão'], ['laco'], ['#c9a6ff', '#fff0f8', '#9be6a8']]],
  junina: [['comum', 'planta', 'sapo', ['Sapojunino', 'Saporaiá', 'Sapoquadrilha'], ['palha', 'bandana'], ['#5fb84a', '#f2e28a', '#ff6a2a']],
    ['incomum', 'fogo', 'javali', ['Porquipipoca', 'Javapipoca', 'Javafogueira'], ['palha', 'bandana'], ['#f29aa8', '#ffe0d8', '#ff8a2a']],
    ['raro', 'fogo', 'cavalo', ['Potrojunino', 'Corcelarraiá', 'Pegasofogueira'], ['palha', 'bandana'], ['#b0703a', '#f2d2a8', '#ffcc33']]],
  halloween: [['comum', 'cosmo', 'morcego', ['Morcedoce', 'Morcebala', 'Morcegulosão'], ['laco'], ['#7a5cd6', '#ffb36b', '#ff8a1c']],
    ['incomum', 'cosmo', 'felino', ['Gatabóbora', 'Gatodoce', 'Leãobóbora'], ['abobora'], ['#2b2440', '#8a5cd6', '#ff8a1c']],
    ['raro', 'fogo', 'golem', ['Aboborim', 'Aboborão', 'Aborocolosso'], ['abobora'], ['#ff8a1c', '#ffd08a', '#ffe066']]],
};
for (const [tema, list] of Object.entries(SEASONAL)) {
  const T = Object.keys(ITEMS).find((k) => ITEMS[k].tema === tema);
  for (const [rar, el, arch, nomes, fantasia, cores] of list) {
    const I = EL_ITEMS[el];
    const receita = rar === 'comum' ? [T, I.comum, I.comum] : rar === 'incomum' ? [T, I.incomum, I.comum] : [T, T, I.raro];
    FAMILIES.push({ id: FAMILIES.length, el, rar, arch, pre: nomes[0], receita, fusao: false, tema, fantasia, cores, archs: [arch, arch, arch], nomes });
  }
}
export const isSeasonal = (spId) => !!FAMILIES[Math.floor(spId / 3)]?.tema;
for (const f of FAMILIES) {
  const to = EVO_ARCH[f.arch];
  f.archs ||= [f.arch, f.arch, to && hash(f.id + 7) < 0.55 ? to : f.arch];
  f.nomes ||= f.archs.map((a, s) => cap(f.pre.toLowerCase()) + ARCH_NAMES[a][s]);
  // habilidades: a do elemento primeiro, depois as do animal, depois sorteadas (sempre iguais para a família)
  const list = [EL_SKILL[f.el], ...(ARCH_SKILLS[f.arch] || [])];
  let s = f.id * 3;
  while (new Set(list).size < 6) { const sk = ALL_SKILLS[Math.floor(hash(++s) * ALL_SKILLS.length)]; list.push(sk); }
  f.skillPool = [...new Set(list)];
}

export const SPECIES = [];
for (const f of FAMILIES) for (let s = 0; s < 3; s++) {
  SPECIES.push({ id: f.id * 3 + s, fam: f.id, stage: s, nome: f.nomes[s], el: f.el, rar: f.rar, arch: f.archs[s], estagio: STAGE_NAMES[s] });
}
// habilidades de uma espécie: mais e mais fortes com raridade e estágio
export function skillsOf(spId) {
  const s = SPECIES[spId], f = FAMILIES[s.fam];
  const n = Math.min(f.skillPool.length, SKILL_COUNT[s.rar] + (s.stage === 2 ? 1 : 0));
  const lvl = SKILL_BASE[s.rar] + s.stage;
  return f.skillPool.slice(0, n).map((id, i) => ({ id, nivel: lvl + (i === 0 ? 1 : 0) }));
}
export const yieldOf = (spId) => YIELD[SPECIES[spId].rar] * (1 + SPECIES[spId].stage * 0.25);

export const FORGE_MIN = 3;
export const recipeKey = (items) => [...items].sort().join('+');
export const RECIPE_INDEX = {};
for (const f of FAMILIES) if (f.receita) RECIPE_INDEX[recipeKey(f.receita)] = f.id;
export const GUIDE_SPECIES = FAMILIES.find((f) => f.el === 'eletrico' && f.rar === 'lendario').id * 3;

// ---------- a base: bancada, forno e construções ----------
// cat: 'util' (muda o jogo) | 'enfeite' (decoração) | 'epoca' (só se constrói na época, fica para sempre)
// r = raio que ocupa no chão (metros); unico = só um no mundo; total = máximo no mundo; max = por fazendinha
export const BUILDINGS = {
  canteiro:  { nome: 'Canteiro',          icone: '🌱', cat: 'util', surv: true, porNivel: true, desc: 'Lugar para plantar: semeie, regue e colha frutas 🍎.', custo: { madeira: 2 }, r: 0.8, max: 12 },
  bancada:   { nome: 'Bancada de Trabalho', icone: '🛠️', cat: 'util', desc: 'Fabrica itens e libera as outras construções.', custo: { madeira: 6, ferro: 2 }, r: 1.1, unico: true },
  fogueira:  { nome: 'Fogueira',          icone: '🔥', cat: 'util', surv: true, desc: 'Cozinha comida simples (espetinho e mingau) e esquenta quando faz frio.', custo: { madeira: 3, seixo: 2 }, r: 0.85, max: 1 },
  fogao:     { nome: 'Forno de Barro',    icone: '🥧', cat: 'util', surv: true, desc: 'Cozinha comida caprichada (torta e ração turbo) para você e para os bichos.', custo: { madeira: 4, seixo: 6, ferro: 2 }, precisa: 'fogueira', r: 1.0, max: 1 },
  forno:     { nome: 'Fundição', icone: '🏭', cat: 'util', desc: 'Funde Ferro em Barras de Metal 🧱. Precisa de um companheiro com 🔥 Acender na mesma fazendinha.', custo: { madeira: 6, ferro: 6 }, precisa: 'bancada', r: 1.1, unico: true },
  comedouro: { nome: 'Comedouro',         icone: '🧺', cat: 'util', cocho: true, surv: true, desc: 'Cesta de palha: a comida colhida aqui fica guardada nela, e os bichos comem dela. Começa vazia.', custo: { madeira: 4, fruta: 2 }, r: 0.9, max: 1 },
  bebedouro: { nome: 'Bebedouro',         icone: '💧', cat: 'util', cocho: true, surv: true, desc: 'Barril de madeira com água fresquinha para os bichos. Sem ele, eles trabalham mais devagar.', custo: { madeira: 3, seixo: 2 }, r: 0.9, max: 1 },
  casinha:   { nome: 'Casinha da Equipe', icone: '🏠', cat: 'util', desc: '+1 lugar para companheiros em todas as fazendinhas (até 3 no mundo).', custo: { madeira: 12, barra: 3 }, precisa: 'bancada', r: 1.5, total: 3, nivel: 4 },
  totem:     { nome: 'Totem do Trovão',   icone: '🗿', cat: 'util', desc: 'Todos os companheiros trabalham 25% mais rápido.', custo: { barra: 6, runa: 1 }, precisa: 'forno', r: 0.7, unico: true, nivel: 6 },
  cerca:     { nome: 'Cerquinha',         icone: '🪵', cat: 'enfeite', desc: 'Um pedaço de cerca. Gire para fazer caminhos!', custo: { madeira: 1 }, r: 0.45 },
  flores:    { nome: 'Jardim de Flores',  icone: '🌷', cat: 'enfeite', desc: 'Flores coloridas que balançam com o vento.', custo: { trevo: 1, orvalho: 1 }, r: 0.6 },
  lanterna:  { nome: 'Lanterna',          icone: '🏮', cat: 'enfeite', desc: 'Um poste que acende sozinho.', custo: { madeira: 1, ferro: 1 }, r: 0.35 },
  banco:     { nome: 'Banquinho',         icone: '🪑', cat: 'enfeite', desc: 'Para descansar depois do trabalho.', custo: { madeira: 3 }, r: 0.75 },
  espantalho:{ nome: 'Espantalho',        icone: '👒', cat: 'enfeite', desc: 'Um espantalho sorridente que cuida da plantação.', custo: { madeira: 2, fruta: 1 }, r: 0.5 },
  balanco:   { nome: 'Balanço',           icone: '🎠', cat: 'enfeite', desc: 'Um balanço de madeira! Os bichos adoram.', custo: { madeira: 4, ferro: 1 }, r: 1.1, nivel: 3 },
  fonte:     { nome: 'Fonte',             icone: '⛲', cat: 'enfeite', desc: 'Uma fonte de água que brilha.', custo: { seixo: 4, barra: 1 }, r: 1.0, nivel: 5 },
  arvore_natal: { nome: 'Árvore de Natal', icone: '🎄', cat: 'epoca', tema: 'natal', desc: 'Pisca-pisca e estrela no topo!', custo: { madeira: 3, enfeite: 2 }, r: 0.9 },
  guarda_sol: { nome: 'Guarda-sol',       icone: '⛱️', cat: 'epoca', tema: 'ferias', desc: 'Sombra e água fresca!', custo: { madeira: 2, coco: 2 }, r: 0.9 },
  baloes:    { nome: 'Balões de Carnaval', icone: '🎈', cat: 'epoca', tema: 'carnaval', desc: 'Balões coloridos que flutuam.', custo: { confete: 2, fruta: 1 }, r: 0.6 },
  ninho_ovos: { nome: 'Ninho de Ovinhos', icone: '🪺', cat: 'epoca', tema: 'pascoa', desc: 'Ovinhos pintados num ninho de palha.', custo: { ovinho: 2, madeira: 1 }, r: 0.6 },
  fogueira_junina: { nome: 'Fogueira Junina',   icone: '🔥', cat: 'epoca', tema: 'junina', desc: 'Fogueira com bandeirinhas em volta.', custo: { madeira: 4, milho: 1 }, r: 1.0 },
  abobora_luz: { nome: 'Abóbora Iluminada', icone: '🎃', cat: 'epoca', tema: 'halloween', desc: 'Uma abóbora sorridente que brilha.', custo: { abobora: 2 }, r: 0.6 },
};
// comidas: na fogueira (simples) e no forno de barro (caprichada)
export const COOKS = {
  fogueira: [{ id: 'espetinho', custo: { fruta: 2, madeira: 1 }, qtd: 2 }, { id: 'mingau', custo: { fruta: 1, orvalho: 2, madeira: 1 }, qtd: 2 }],
  fogao: [{ id: 'torta', custo: { fruta: 4, orvalho: 1, madeira: 2 }, qtd: 1 }, { id: 'racao', custo: { fruta: 4, trevo: 1 }, qtd: 2 }],
};
export const CRAFTS = [
  { id: 'evo', nome: 'Cristal de Evolução', icone: '🔷', desc: 'Para evoluir companheiros', custo: { barra: 2, fruta: 3 }, dá: 'brilho' },
  { id: 'runa', nome: 'Runa do Trovão', icone: '💠', desc: 'Ingrediente épico da Forja', custo: { barra: 3, faisca: 2 }, dá: 'runa' },
  { id: 'coroa', nome: 'Coroa do Trovão', icone: '👑', desc: 'Ingrediente lendário da Forja', custo: { barra: 6, runa: 1, gema: 1 }, dá: 'coroa' },
  { id: 'racao', nome: 'Ração Turbo', icone: '🥗', desc: '3 frutas viram 1 ração (+40 de experiência)', custo: { fruta: 3 }, dá: 'racao' },
  { id: 'orvalho', nome: 'Gotas de Orvalho', icone: '💧', desc: '2 frutas viram 3 gotas', custo: { fruta: 2 }, dá: 'orvalho', qtd: 3 },
];

// Regiões: cada uma tem uma fazendinha, uma ponte de pedra rúnica para abrir e alguém para salvar.
export const REGIONS = [
  { id: 'floresta', el: 'planta', nome: 'Floresta Viva', chao: '#5aae2a', ceu: ['#6ccff5', '#e6f9ff'],
    ponte: null,
    resgate: { quem: 'Vovó Margarida', g: 'a', arch: 'sapo', cor: '#e8d7c0', chapeu: 'palha', armadilha: 'ilha',
      texto: 'A ponte de cipós arrebentou e a Vovó Margarida ficou ilhada do outro lado do riacho!',
      ajuda: 'Um companheiro de Planta faz os cipós crescerem e refaz a ponte.', precisa: { el: 'planta', estagio: 0 }, itens: { trevo: 3 } } },
  { id: 'lago', el: 'agua', nome: 'Lago Profundo', chao: '#4fae54', ceu: ['#5cc6f2', '#dcf6ff'],
    ponte: { moedas: 30, itens: { trevo: 4, orvalho: 2 }, amigos: 2 },
    resgate: { quem: 'Capitão Bigode', g: 'o', arch: 'macaco', cor: '#9fb5c9', chapeu: 'marinheiro', armadilha: 'redemoinho',
      texto: 'O barco do Capitão Bigode ficou preso girando num redemoinho!',
      ajuda: 'Um companheiro de Água nada até lá e empurra o barco.', precisa: { el: 'agua', estagio: 0 }, itens: { concha: 3 } } },
  { id: 'vulcao', el: 'fogo', nome: 'Vulcão Rubro', chao: '#3b2b2b', ceu: ['#d9763f', '#3b2238'],
    ponte: { moedas: 80, itens: { concha: 5, onda: 1 }, amigos: 4 },
    resgate: { quem: 'Ferreiro Tito', g: 'o', arch: 'urso', cor: '#8a5a3a', chapeu: 'capacete', armadilha: 'nuvem',
      texto: 'Uma nuvem de chuva apagou a fornalha do Ferreiro Tito, o mestre da Forja do Trovão!',
      ajuda: 'Um companheiro de Fogo reacende a fornalha.', precisa: { el: 'fogo', estagio: 0 }, itens: { brasa: 4 } } },
  { id: 'picos', el: 'vento', nome: 'Picos dos Ventos', chao: '#9cc678', ceu: ['#72c2f0', '#f2fbff'],
    ponte: { moedas: 160, itens: { brasa: 6, pimenta: 2 }, amigos: 6 },
    resgate: { quem: 'Aviadora Brisa', g: 'a', arch: 'raposa', cor: '#d9a36a', chapeu: 'touca', armadilha: 'alto',
      texto: 'O balão da Aviadora Brisa enroscou lá no alto do pico mais alto!',
      ajuda: 'Um companheiro de Vento (Jovem ou maior) voa até lá e solta o balão.', precisa: { el: 'vento', estagio: 1 }, itens: { pena: 5, nuvem: 1 } } },
  { id: 'geleira', el: 'gelo', nome: 'Geleira Eterna', chao: '#e4f2f7', ceu: ['#9cc9e8', '#eef8ff'],
    ponte: { moedas: 260, itens: { pena: 6, nuvem: 2, orvalho: 4 }, amigos: 8 },
    resgate: { quem: 'Explorador Pingo', g: 'o', arch: 'pinguim', cor: '#4a5a7a', chapeu: 'gorro', armadilha: 'gelo',
      texto: 'O Explorador Pingo escorregou e ficou congelado dentro de um bloco de gelo!',
      ajuda: 'Um companheiro de Fogo (Jovem ou maior) derrete o gelo com cuidado.', precisa: { el: 'fogo', estagio: 1 }, itens: { floco: 5, pimenta: 2 } } },
  { id: 'canion', el: 'pedra', nome: 'Cânion de Pedra', chao: '#d09a5a', ceu: ['#f0b070', '#fff0d0'],
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
  { id: 'cod25', nome: 'Colecionador', desc: 'Descubra 50 formas no Códice', icone: '📖' },
  { id: 'cod50', nome: 'Explorador', desc: 'Descubra 150 formas no Códice', icone: '🧭' },
  { id: 'cod100', nome: 'Sábio das Feras', desc: 'Descubra 300 formas no Códice', icone: '🎓' },
  { id: 'cod150', nome: 'Mestre do Códice', desc: 'Descubra as 450 formas', icone: '👑' },
  { id: 'construtor', nome: 'Construtor', desc: 'Construa a Bancada de Trabalho', icone: '🛠️' },
  { id: 'fazendeiro', nome: 'Fazendeiro', desc: 'Colha 20 frutas', icone: '🍎' },
  { id: 'lenhador', nome: 'Lenhador', desc: 'Junte 50 madeiras', icone: '🪓' },
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
