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
    v: 2,
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
    treasury: { mode: 0, hideSums: false, chests: [], wallet: null, spends: [], regular: [] },
    seen: {},
    seenStitches: {},
    spells: [],
    witch: { lastVisit: null, pending: null, lastCard: null, history: [], echoed: [] },
    threads: { decided: {}, list: [] },
    chapters: [],
    settings: { morning: '08:30', evening: '21:30', backupRemind: true, lastBackup: null, witchFreq: 'auto' }
  };
}

export let S = load();

function migrate(o) {
  const b = blank();
  o = Object.assign(b, o);
  o.treasury = Object.assign(blank().treasury, o.treasury);
  o.settings = Object.assign(blank().settings, o.settings);
  o.seen = o.seen || {};
  o.seenStitches = o.seenStitches || {};
  o.settings.witchFreq = o.settings.witchFreq || 'auto';
  // v2: в частоты добавлены «1×/мес» и «2×/мес» — сдвигаем старые индексы
  if ((o.v || 1) < 2) {
    for (const l of o.lands || []) for (const p of l.patterns || []) if (p.freq >= 1) p.freq += 2;
    o.v = 2;
  }
  // заклинания: строка → { what, amount, unit }
  for (const sp of o.spells || []) {
    for (const k of ['small', 'great']) if (typeof sp[k] === 'string') sp[k] = { what: sp[k], amount: '', unit: '' };
  }
  return o;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* пусто */ }
  return blank();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); }
}

export function replaceAll(obj) {
  S = migrate(obj);
  save();
}

export function resetAll() { S = blank(); save(); }

// ——— земли и стежки ———
export const landDef = (id) => LANDS.find((l) => l.id === id);
export function landOf(id) { return S.lands.find((l) => l.id === id); }
export function landName(l) { return l.customName || landDef(l.id)?.name || 'Своя земля'; }
export function landShort(l) { return l.customName || landDef(l.id)?.short || 'Своя земля'; }
// Своя земля может взять облик одной из готовых земель (l.art)
export function lookOf(l) { return landDef(l.id) || (l.art ? landDef(l.art) : null); }
export function emblemSrc(l) { const d = lookOf(l); return d ? `img/emblem/${d.id}.webp` : null; }
export function sceneSrc(l) { const d = lookOf(l); return d ? `img/scene/${d.id}.webp` : null; }

export function weeklyLoad(patterns) {
  return patterns.reduce((s, p) => s + p.load * FREQS[p.freq][1], 0);
}
export function tierTarget(patterns) {
  return Math.max(24, Math.round(weeklyLoad(patterns) * 6));
}
export function activeLands() { return S.lands.filter((l) => l.status === 'active'); }

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
// Постоянные траты (аренда, связь, подписки) сами записываются как «Провизия» в свой день месяца.
export function applyRegular() {
  const T = S.treasury;
  const t = dayKey();
  const now = parseDay(t);
  let added = 0;
  for (const r of T.regular || []) {
    const start = r.last ? parseDay(r.last) : parseDay(r.since);
    // идём по месяцам от последней записи до сегодня
    let y = start.getFullYear(), m = start.getMonth();
    if (r.last) m += 1;
    for (let guard = 0; guard < 24; guard++) {
      const dim = new Date(y, m + 1, 0).getDate();
      const due = new Date(y, m, Math.min(r.day, dim));
      if (due > now) break;
      const k = dayKey(due);
      if (!r.last || k > r.last) {
        if (k >= r.since) {
          T.spends.push({ id: uid(), date: k, amount: r.amount, note: r.name, tag: 1, regular: r.id });
          if (T.wallet !== null) T.wallet -= r.amount;
          added++;
        }
        r.last = k;
      }
      m += 1; if (m > 11) { m = 0; y += 1; }
    }
  }
  return added;
}
export const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
