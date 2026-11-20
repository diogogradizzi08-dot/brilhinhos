// Brilhinhos — sons fofinhos feitos na hora (sem arquivos) e uma caixinha de música.
let ctx = null, master = null, musicGain = null, musicOn = true, sfxOn = true, musicTimer = 0;
function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.12; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, t0, dur, { type = 'sine', vol = 0.3, slide = 0, out = null } = {}) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(out || master); o.start(t0); o.stop(t0 + dur + 0.02);
}
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
export const SFX = {
  tap() { const t = ac().currentTime; tone(880, t, 0.08, { type: 'triangle', vol: 0.18 }); },
  pop() { const t = ac().currentTime; tone(600, t, 0.12, { vol: 0.3, slide: 2.2 }); },
  drop() { const t = ac().currentTime; tone(1200, t, 0.18, { vol: 0.2, slide: 0.4 }); tone(300, t + 0.12, 0.15, { type: 'triangle', vol: 0.25, slide: 1.6 }); },
  splash() { const t = ac().currentTime; for (let i = 0; i < 5; i++) tone(500 + Math.random() * 900, t + i * 0.025, 0.1, { vol: 0.08 }); },
  stir() { const t = ac().currentTime; tone(N(72 + Math.floor(Math.random() * 12)), t, 0.25, { type: 'sine', vol: 0.1 }); },
  collect() { const t = ac().currentTime; tone(N(84), t, 0.1, { type: 'triangle', vol: 0.2 }); tone(N(91), t + 0.07, 0.16, { type: 'triangle', vol: 0.2 }); },
  coin() { const t = ac().currentTime; tone(N(88), t, 0.08, { type: 'square', vol: 0.06 }); tone(N(95), t + 0.06, 0.18, { type: 'square', vol: 0.06 }); },
  wobble() { const t = ac().currentTime; tone(300, t, 0.15, { type: 'triangle', vol: 0.25, slide: 1.5 }); },
  hatch(level = 1) {
    const t = ac().currentTime; const seq = [72, 76, 79, 84, 88, 91].slice(0, 3 + Math.min(3, level));
    seq.forEach((n, i) => tone(N(n), t + i * 0.09, 0.4, { type: 'triangle', vol: 0.22 }));
    if (level >= 3) seq.forEach((n, i) => tone(N(n + 12), t + 0.6 + i * 0.07, 0.3, { vol: 0.12 }));
  },
  fanfare() { const t = ac().currentTime; [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.55], [84, 0.68]].forEach(([n, d]) => { tone(N(n), t + d, 0.35, { type: 'triangle', vol: 0.22 }); tone(N(n - 12), t + d, 0.35, { vol: 0.1 }); }); },
  sad() { const t = ac().currentTime; tone(N(67), t, 0.2, { type: 'triangle', vol: 0.15 }); tone(N(64), t + 0.18, 0.3, { type: 'triangle', vol: 0.15 }); },
  heart() { const t = ac().currentTime; tone(N(79), t, 0.12, { vol: 0.2 }); tone(N(83), t + 0.1, 0.2, { vol: 0.2 }); },
};
export function play(name, ...a) { if (!sfxOn) return; try { SFX[name]?.(...a); } catch {} }
export function setSfx(v) { sfxOn = v; }

// caixinha de música: uma melodia pentatônica calma que se repete
const MELODY = [72, 76, 79, 81, 79, 76, 74, 76, 72, 74, 76, 79, 76, 74, 72, 67];
const BASS = [48, 48, 55, 55, 52, 52, 55, 55];
export function setMusic(v) {
  musicOn = v;
  if (!v) { clearTimeout(musicTimer); return; }
  startMusic();
}
function startMusic() {
  if (!musicOn) return;
  clearTimeout(musicTimer);
  const c = ac(); const beat = 0.42; const t0 = c.currentTime + 0.1;
  MELODY.forEach((n, i) => { if (Math.random() < 0.9) tone(N(n), t0 + i * beat, beat * 1.6, { type: 'sine', vol: 0.5, out: musicGain }); });
  BASS.forEach((n, i) => tone(N(n), t0 + i * beat * 2, beat * 2.2, { type: 'triangle', vol: 0.35, out: musicGain }));
  musicTimer = setTimeout(startMusic, MELODY.length * beat * 1000 + 1600);
}
export function unlockAudio() { ac(); }
