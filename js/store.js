// Хранение: всё лежит в localStorage этого устройства. Никаких серверов.
import { LANDS, FREQS } from './data.js';

const KEY = 'gobelen.v1';

export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), x = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${x}`;
}
export function parseDay(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(k, n) { const d = parseDay(k); d.setDate(d.getDate() + n); return dayKey(d); }
export function daysBetween(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }
export const uid = () => Math.random().toString(36).slice(2, 10);

export function blank() {
  return {
    v: 1,
    created: dayKey(),
    lastActive: null,
    hero: 'f',
    name: '',
    onboarded: false,
    firstDaySeen: false,
    lands: [],
    wall: [],
    days: {},
    steps: [],
    journal: [],
    treasury: { mode: 0, hideSums: false, chests: [], wallet: null, spends: [] },
    spells: [],
    witch: { lastVisit: null, pending: null, lastCard: null, history: [], echoed: [] },
    threads: { decided: {}, list: [] },
    chapters: [],
    settings: { morning: '08:30', evening: '21:30', backupRemind: true, lastBackup: null }
  };
}

export let S = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* пусто */ }
  return blank();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); }
}

export function replaceAll(obj) {
  S = Object.assign(blank(), obj);
  save();
}

export function resetAll() { S = blank(); save(); }

// ——— земли и стежки ———
export const landDef = (id) => LANDS.find((l) => l.id === id);
export function landOf(id) { return S.lands.find((l) => l.id === id); }
export function landName(l) { return l.customName || landDef(l.id)?.name || 'Своя земля'; }
export function landShort(l) { return l.customName || landDef(l.id)?.short || 'Своя земля'; }
export function emblemSrc(l) { return landDef(l.id) ? `img/emblem/${l.id}.webp` : null; }
export function sceneSrc(l) { return landDef(l.id) ? `img/scene/${l.id}.webp` : null; }

export function weeklyLoad(patterns) {
  return patterns.reduce((s, p) => s + p.load * FREQS[p.freq][1], 0);
}
export function tierTarget(patterns) {
  return Math.max(24, Math.round(weeklyLoad(patterns) * 6));
}
export function activeLands() { return S.lands.filter((l) => l.status !== 'hung'); }

export function addStep(landId, pattern, date = dayKey()) {
  const l = landOf(landId);
  if (!l) return 0;
  const n = pattern ? pattern.load : 1;
  S.steps.push({ date, landId, patternId: pattern?.id || null, name: pattern?.name || 'Шаг', stitches: n, tier: l.tier });
  l.stitches += n;
  return n;
}
export function landProgress(l) { return Math.min(1, l.stitches / l.target); }

// ——— заклинания ———
export function spellStats(sp) {
  const days = [...new Set(sp.casts.map((c) => c.date))].sort();
  let returns = 0;
  for (let i = 1; i < days.length; i++) if (daysBetween(days[i - 1], days[i]) >= 2) returns++;
  return { total: days.length, returns };
}

// ——— сокровищница ———
export const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
