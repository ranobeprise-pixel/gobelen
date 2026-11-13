// Звуки экранов, нарисованные кодом (Web Audio) — без файлов и лицензий.
// Костёр на привале, пещера в сокровищнице, арфа и ветер на карте, птицы утром; короткие звуки стежка и находки.
let ctx = null, master = null, scene = null, sceneName = null, enabled = false;
// общая мелодия приложения: файл audio/theme.mp3 (если есть), играет по кругу и притихает на экранах с деталями
const MUSIC_URL = 'audio/theme.mp3';
const MUSIC_SEC = 63.6; // длина круга мелодии без тишины MP3
const MUSIC_VOL = { fire: 0.22, morning: 0.32, map: 0.38, cave: 0.24, none: 0.5 };
let music = null, musicGain = null, musicLoading = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // «ambient» на iPhone уважает беззвучный режим
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* нет — не страшно */ }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

const bufCache = {};
function noise(type, sec = 4) {
  const key = type + sec;
  if (bufCache[key]) return bufCache[key];
  const c = ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return (bufCache[key] = b);
}
// щипок струны (Карплус — Стронг): лютня и арфа
function pluckBuf(freq) {
  const key = 'p' + Math.round(freq);
  if (bufCache[key]) return bufCache[key];
  const c = ctx, sr = c.sampleRate, n = Math.floor(sr * 2.2), b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq)), line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1;
  for (let i = 0, j = 0; i < n; i++, j = (j + 1) % N) { const v = line[j]; d[i] = v; line[j] = 0.5 * (v + line[(j + 1) % N]) * 0.996; }
  return (bufCache[key] = b);
}
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function out(dest, gain) { const g = ctx.createGain(); g.gain.value = gain; g.connect(dest); return g; }
function echo(dest, time = 0.28, fb = 0.35, mix = 0.35) {
  const inp = ctx.createGain(), d = ctx.createDelay(1.5), f = ctx.createGain(), w = ctx.createGain();
  d.delayTime.value = time; f.gain.value = fb; w.gain.value = mix;
  inp.connect(dest); inp.connect(d); d.connect(f); f.connect(d); d.connect(w); w.connect(dest);
  return inp;
}
function loopNoise(type, dest, gain, filter) {
  const s = ctx.createBufferSource(); s.buffer = noise(type); s.loop = true;
  let node = s;
  if (filter) { const f = ctx.createBiquadFilter(); Object.assign(f, { type: filter[0] }); f.frequency.value = filter[1]; if (filter[2]) f.Q.value = filter[2]; s.connect(f); node = f; }
  node.connect(out(dest, gain)); s.start();
  return s;
}
function burst(dest, dur, freq, gain) {
  const s = ctx.createBufferSource(); s.buffer = noise('white', 1);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  const g = ctx.createGain(), t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.8, dur + 0.05);
}
function pluck(dest, midi, gain = 0.3, when = 0) {
  const s = ctx.createBufferSource(); s.buffer = pluckBuf(hz(midi));
  const g = ctx.createGain(); g.gain.value = gain; s.connect(g); g.connect(dest); s.start(ctx.currentTime + when);
}
function tone(dest, f0, f1, dur, gain, type = 'sine', when = 0) {
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}

// повторять fn через случайные промежутки [a, b] мс
function every(sc, a, b, fn) {
  const tick = () => { if (scene !== sc) return; fn(); sc.timers.push(setTimeout(tick, a + Math.random() * (b - a))); };
  sc.timers.push(setTimeout(tick, a * Math.random()));
}

const PENTA = [0, 3, 5, 7, 10, 12, 15];
// протяжка нити: мягкий шорох, который поднимается вверх
function thread(dest) {
  const s = ctx.createBufferSource(); s.buffer = noise('white', 1);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5;
  const g = ctx.createGain(), t = ctx.currentTime, dur = 0.22 + Math.random() * 0.12;
  f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.7, dur + 0.05);
}
const SCENES = {
  fire(sc, bus) {
    sc.src.push(loopNoise('brown', bus, 0.07, ['lowpass', 500]));
    every(sc, 40, 260, () => burst(bus, 0.01 + Math.random() * 0.03, 1500 + Math.random() * 3000, 0.05 + Math.random() * 0.25));
    every(sc, 1500, 4000, () => burst(bus, 0.06, 900, 0.35));
  },
  cave(sc, bus) {
    sc.src.push(loopNoise('brown', bus, 0.12, ['lowpass', 260]));
    const room = echo(bus, 0.42, 0.45, 0.5);
    every(sc, 1400, 4200, () => { const f = 900 + Math.random() * 700; tone(room, f, f * 0.55, 0.07, 0.1); });
    every(sc, 6000, 13000, () => { tone(room, 2600, 2550, 0.25, 0.03); tone(room, 3900, 3850, 0.18, 0.018, 'sine', 0.06); });
  },
  map(sc, bus) {
    // игла проходит через ткань: короткий «прокол» и протяжка нити
    every(sc, 1800, 4200, () => {
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const d = i * 0.42;
        setTimeout(() => { if (scene) { burst(bus, 0.012, 3200, 0.12); } }, d * 1000);
        setTimeout(() => { if (scene) { thread(bus); } }, d * 1000 + 70);
      }
    });
  },
  morning(sc, bus) {
    sc.src.push(loopNoise('white', bus, 0.008, ['bandpass', 600, 0.5]));
    every(sc, 2500, 6500, () => {
      const n = 2 + Math.floor(Math.random() * 3), base = 2400 + Math.random() * 1400;
      for (let i = 0; i < n; i++) tone(bus, base, base * (1.25 + Math.random() * 0.3), 0.09, 0.05, 'sine', i * 0.13);
    });
  },
};

function stopScene(fade = 0.6) {
  if (!scene) return;
  const sc = scene; scene = null; sceneName = null;
  sc.timers.forEach(clearTimeout);
  if (ctx) {
    const t = ctx.currentTime;
    sc.bus.gain.cancelScheduledValues(t); sc.bus.gain.setValueAtTime(sc.bus.gain.value, t); sc.bus.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => { sc.src.forEach((s) => { try { s.stop(); } catch (e) { /* уже */ } }); sc.bus.disconnect(); }, fade * 1000 + 100);
  }
}

async function startMusic() {
  if (music || musicLoading || !ac()) return;
  musicLoading = true;
  try {
    const res = await fetch(MUSIC_URL);
    if (!res.ok) return;
    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
    if (!enabled) return;
    // MP3 добавляет в начало немного тишины — пропускаем её, чтобы круг замыкался без паузы
    const d = buf.getChannelData(0); let off = 0;
    while (off < Math.min(d.length, 6000) && Math.abs(d[off]) < 0.002) off++;
    const start = off / buf.sampleRate;
    music = ctx.createBufferSource(); music.buffer = buf; music.loop = true;
    music.loopStart = start; music.loopEnd = Math.min(buf.duration, start + MUSIC_SEC);
    music.connect(musicGain); music.start(0, start);
    duck(sceneName);
  } catch (e) { /* файла нет или не прочитался — играют только детали */ } finally { musicLoading = false; }
}
function duck(name) {
  if (!musicGain) return;
  const t = ctx.currentTime, v = enabled ? (MUSIC_VOL[name] ?? MUSIC_VOL.none) : 0;
  musicGain.gain.cancelScheduledValues(t); musicGain.gain.setValueAtTime(musicGain.gain.value, t); musicGain.gain.linearRampToValueAtTime(v, t + 1.5);
}
export function setScene(name) {
  if (enabled && ctx) duck(SCENES[name] ? name : 'none');
  if (!enabled || !SCENES[name]) { if (!SCENES[name]) stopScene(); return; }
  if (name === sceneName) return;
  if (!ac()) return;
  stopScene();
  const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(master);
  bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  const sc = { bus, src: [], timers: [] };
  scene = sc; sceneName = name;
  SCENES[name](sc, bus);
}

export function setSound(on, name) {
  enabled = !!on;
  if (!enabled) { stopScene(0.3); if (ctx) duck('none'); return; }
  ac(); startMusic(); setScene(name); duck(SCENES[name] ? name : 'none');
}
export const soundEnabled = () => enabled;

// короткие звуки
export function sfx(kind, r) {
  if (!enabled || !ac()) return;
  const bus = echo(master, 0.22, 0.25, 0.25);
  if (kind === 'stitch') { pluck(bus, 76, 0.22); pluck(bus, 83, 0.15, 0.08); }
  if (kind === 'find') {
    const notes = r === 'm' ? [72, 76, 79, 84, 88, 91] : r === 'r' ? [72, 76, 79, 84] : [76, 79, 84];
    notes.forEach((m, i) => tone(bus, hz(m), hz(m) * 1.001, 0.9, r === 'm' ? 0.09 : 0.07, 'sine', i * 0.09));
    if (r === 'm') for (let i = 0; i < 8; i++) tone(bus, 4000 + Math.random() * 2500, 5000, 0.12, 0.025, 'sine', 0.5 + i * 0.07);
  }
}
