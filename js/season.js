// Brilhinhos — as épocas do ano. O cenário e a Forja mudam com o calendário de
// verdade do aparelho; os bichos de época ficam para sempre na equipe.
export const THEMES = {
  natal:     { nome: 'Natal',            icone: '🎄', periodo: '15 de novembro a 6 de janeiro', item: 'enfeite', cor: '#e2403a', cor2: '#2f9a55', ceu: ['#9fc4ea', '#f4f8ff'] },
  ferias:    { nome: 'Férias de Verão',  icone: '🏖️', periodo: '7 a 31 de janeiro',             item: 'coco',    cor: '#ffb547', cor2: '#2fc4c9', ceu: ['#6fd0ff', '#fff3c8'] },
  carnaval:  { nome: 'Carnaval',         icone: '🎭', periodo: 'fevereiro',                      item: 'confete', cor: '#ff4fb0', cor2: '#7a5cff', ceu: ['#8fb8ff', '#ffe3f4'] },
  pascoa:    { nome: 'Páscoa',           icone: '🐣', periodo: 'março e abril',                  item: 'ovinho',  cor: '#ffb3d9', cor2: '#a8e6a0', ceu: ['#bfe3ff', '#fff6e0'] },
  junina:    { nome: 'Festa Junina',     icone: '🌽', periodo: '1º de junho a 10 de julho',      item: 'milho',   cor: '#ff8a2a', cor2: '#3a6fd1', ceu: ['#ffb27a', '#ffe8c0'] },
  halloween: { nome: 'Halloween Fofo',   icone: '🎃', periodo: 'outubro',                 item: 'abobora', cor: '#ff8a1c', cor2: '#8a5cd6', ceu: ['#6a5aa8', '#ffc58a'] },
};
export const THEME_ORDER = ['ferias', 'carnaval', 'pascoa', 'junina', 'halloween', 'natal'];
// Halloween aqui é só fantasia fofa (abóboras sorridentes, morceguinhos, doces) — nada de susto.

let forced = null;
try { const q = new URLSearchParams(globalThis.location?.search || '').get('tema'); if (q === 'nenhum' || THEMES[q]) forced = q; } catch {}
export const forceTheme = (k) => { forced = k; };

export function themeOn(d = new Date()) {
  if (forced) return forced === 'nenhum' ? null : forced;
  return realTheme(d);
}
function realTheme(d) {
  const m = d.getMonth() + 1, day = d.getDate();
  if ((m === 11 && day >= 15) || m === 12 || (m === 1 && day <= 6)) return 'natal';
  if (m === 1) return 'ferias';
  if (m === 2) return 'carnaval';
  if (m === 3 || m === 4) return 'pascoa';
  if (m === 6 || (m === 7 && day <= 10)) return 'junina';
  if (m === 10) return 'halloween';
  return null;
}
// a próxima época que vai chegar (para mostrar "volta em ...")
export function nextTheme(d = new Date()) {
  const t = new Date(d); for (let i = 1; i < 370; i++) { t.setDate(t.getDate() + 1); const k = realTheme(t); if (k && k !== realTheme(d)) return { k, data: new Date(t) }; }
  return null;
}
