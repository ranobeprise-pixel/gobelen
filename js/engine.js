// Логика Странствующей, колоды, нитей наблюдений и глав.
import { S, dayKey, addDays, daysBetween, activeLands, landName, landOf } from './store.js';
import { VISITS, CARDS } from './data.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const g = (forms) => (S.hero === 'm' && forms[1] ? forms[1] : forms[0]);

function evenings(n = 30) {
  const out = [];
  const t = dayKey();
  for (let i = 0; i < n; i++) {
    const k = addDays(t, -i);
    const e = S.days[k]?.evening;
    if (e) out.push({ date: k, ...e });
  }
  return out; // от свежих к старым
}
function stepsSince(k) { return S.steps.filter((s) => s.date >= k); }
const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);

// Состояние для подбора карт и тона: 'safety' | 'down' | 'up' | 'even'
export function mood() {
  const ev = evenings(14);
  const t = dayKey();
  const lowDays = ev.filter((e) => e.energy <= 1 && daysBetween(e.date, t) < 14).length;
  if (ev.length >= 8 && lowDays >= 8 && ev.slice(0, 5).every((e) => e.energy <= 1)) return 'safety';
  const recent = ev.slice(0, 5).map((e) => e.energy);
  const a = avg(recent);
  if (a === null) return 'even';
  if (a <= 1.5) return 'down';
  if (a >= 3) return 'up';
  return 'even';
}

export function weekMoonLabel() {
  const m = mood();
  return { safety: 'Состояние за неделю: тяжело', down: 'Состояние за неделю: туман', up: 'Состояние за неделю: ясно', even: 'Состояние за неделю: облака' }[m];
}

function makeVisit(type, extra = {}) {
  const bank = VISITS[type];
  const qi = Math.floor(Math.random() * bank.qs.length);
  let line = g(bank.line);
  if (extra.landName) line = line.replace('{land}', extra.landName);
  const vow = bank.vow ? (bank.vow.includes('|') ? bank.vow.split('|')[S.hero === 'm' ? 1 : 0] : bank.vow) : null;
  return { type, qi, line, q: g(bank.qs[qi]), vow, date: dayKey(), ...extra };
}

// Решает, ждёт ли Странствующая у костра. Вызывается при каждом открытии.
export function evaluateVisit(gapDays) {
  const w = S.witch;
  const t = dayKey();
  if (!S.onboarded) return;
  if (w.pending && daysBetween(w.pending.date, t) <= 3) return;
  w.pending = null;
  const m = mood();
  if (m === 'safety') { w.pending = { type: 'safety', date: t }; return; }
  const freq = S.settings.witchFreq || 'auto';
  if (freq === 'call') return; // приходит только когда позовут (кроме заботы о безопасности выше)
  const rare = freq === 'rare';
  if (gapDays >= 3 && S.steps.length + Object.keys(S.days).length > 0) { w.pending = makeVisit('back'); return; }
  if (w.lastVisit && daysBetween(w.lastVisit, t) < (rare ? 14 : 5)) return;
  if (daysBetween(S.created, t) < 2) return;

  const ev = evenings(30);
  const base = avg(ev.map((e) => e.energy)) ?? 2;
  const last3 = ev.slice(0, 3);
  if (last3.length === 3 && daysBetween(last3[2].date, t) <= 4 && last3.every((e) => e.energy <= Math.min(1, base - 1) || e.energy <= 1)) {
    w.pending = makeVisit('low', { card: Math.random() < 0.5 }); return;
  }
  for (const l of activeLands()) {
    const lastStep = S.steps.filter((s) => s.landId === l.id).map((s) => s.date).sort().pop() || l.since;
    if (daysBetween(lastStep, t) >= 14) { w.pending = makeVisit('abandoned', { landId: l.id, landName: landName(l) }); return; }
  }
  const wk = stepsSince(addDays(t, -6));
  const last5 = ev.filter((e) => daysBetween(e.date, t) < 5);
  const early = ev.filter((e) => daysBetween(e.date, t) >= 3 && daysBetween(e.date, t) < 7);
  if (wk.length >= 6 && last5.length >= 3 && early.length >= 2 && avg(last5.slice(0, 3).map((e) => e.energy)) <= avg(early.map((e) => e.energy)) - 1) {
    w.pending = makeVisit('rush'); return;
  }
  if (last5.length >= 4 && avg(last5.map((e) => e.energy)) >= 3 && wk.length === 0) { w.pending = makeVisit('still'); return; }
  if (goldTrigger()) { w.pending = makeVisit('gold'); return; }
  if (last5.length >= 5 && last5.every((e) => e.energy >= 3) && stepsSince(addDays(t, -4)).length >= 3) {
    w.pending = makeVisit('rise', { card: Math.random() < 0.4 }); return;
  }
  const echo = echoCandidate();
  if (echo && Math.random() < 0.5) { w.pending = { ...makeVisit('echo'), echo }; return; }
  const since = w.lastVisit || S.created;
  if (daysBetween(since, t) >= (rare ? 21 : 10) || (!w.lastVisit && daysBetween(S.created, t) >= 3)) {
    w.pending = makeVisit('random', { card: Math.random() < 0.5 });
  }
}

function goldTrigger() {
  const t = dayKey();
  const sp = S.treasury.spends;
  const wk = sp.filter((s) => daysBetween(s.date, t) < 7);
  if (wk.length < 3) return false;
  const share = (list) => { const all = list.reduce((a, s) => a + s.amount, 0); return all ? list.filter((s) => s.tag === 2).reduce((a, s) => a + s.amount, 0) / all : 0; };
  const before = sp.filter((s) => daysBetween(s.date, t) >= 7 && daysBetween(s.date, t) < 35);
  return share(wk) >= 0.3 && share(wk) > share(before) + 0.1;
}

function echoCandidate() {
  const t = dayKey();
  return S.journal.find((j) => j.kind === 'witch' && j.answer && daysBetween(j.date, t) >= 21 && !S.witch.echoed.includes(j.id)) || null;
}

// Позвать Странствующую самой
export function callWitch() {
  const m = mood();
  const type = m === 'down' ? 'low' : 'random';
  S.witch.pending = makeVisit(type, { card: Math.random() < 0.4, called: true });
  return S.witch.pending;
}

// ——— колода ———
export function cardName(c) { return S.hero === 'm' && c.nameM ? c.nameM : c.name; }
export function cardImg(c) { return c.id === '02' ? `img/card/02${S.hero === 'm' ? 'm' : 'f'}.webp` : `img/card/${c.id}.webp`; }
export function cardQs(c) { return S.hero === 'm' && c.qm ? c.qm : c.q; }

export function drawCard(exclude = []) {
  const m = mood();
  let pool = CARDS.filter((c) => (m === 'down' ? c.soft : true) && !exclude.includes(c.id));
  const recent = S.journal.filter((j) => j.kind === 'card').slice(-4).map((j) => j.cardId);
  const fresh = pool.filter((c) => !recent.includes(c.id));
  if (fresh.length) pool = fresh;
  return pick(pool);
}
export function canAskCard() {
  const l = S.witch.lastCard;
  return !l || daysBetween(l, dayKey()) >= 7;
}
export function nextCardDay() { return S.witch.lastCard ? addDays(S.witch.lastCard, 7) : dayKey(); }

// ——— нити наблюдений ———
// Только факты и вопросы. Никаких толкований и ярлыков.
export function detectThreads() {
  const found = [];
  const ev = evenings(60);
  if (ev.length < 7) return found;
  const stepDays = {};
  for (const s of S.steps) (stepDays[s.landId] ||= new Set()).add(s.date);
  const good = (e) => e.sky >= 3;
  for (const l of S.lands) {
    const set = stepDays[l.id];
    if (!set) continue;
    const withL = ev.filter((e) => set.has(e.date));
    const without = ev.filter((e) => !set.has(e.date));
    if (withL.length < 4 || without.length < 3) continue;
    const a = withL.filter(good).length, b = without.filter(good).length;
    const ra = a / withL.length, rb = b / without.length;
    const key = `sky:${l.id}`;
    if (S.threads.decided[key]) continue;
    if (ra >= 0.7 && rb <= 0.4) {
      found.push({
        key,
        fact: `В ${a} из ${withL.length} вечеров после шагов к земле «${landName(l)}» ты отмечала небо «Ясно» или «Звёзды». В остальные вечера — в ${b} из ${without.length}.`,
        factM: `В ${a} из ${withL.length} вечеров после шагов к земле «${landName(l)}» ты отмечал небо «Ясно» или «Звёзды». В остальные вечера — в ${b} из ${without.length}.`,
        dates: withL.slice(0, 5).map((e) => e.date),
        landId: l.id
      });
    } else if (ra <= 0.25 && rb >= 0.6) {
      found.push({
        key,
        fact: `В ${withL.length - a} из ${withL.length} вечеров после шагов к земле «${landName(l)}» небо у тебя было «Туман», «Дождь» или «Облака». В остальные вечера — в ${without.length - b} из ${without.length}.`,
        dates: withL.slice(0, 5).map((e) => e.date),
        landId: l.id
      });
    }
  }
  // Рассыпанные монеты и силы
  const spillDays = new Set(S.treasury.spends.filter((s) => s.tag === 2).map((s) => s.date));
  const key = 'spill:energy';
  if (spillDays.size >= 3 && !S.threads.decided[key]) {
    const withS = ev.filter((e) => spillDays.has(e.date));
    const without = ev.filter((e) => !spillDays.has(e.date));
    if (withS.length >= 3 && without.length >= 3) {
      const a = withS.filter((e) => e.energy <= 1).length, b = without.filter((e) => e.energy <= 1).length;
      if (a / withS.length >= 0.66 && b / without.length <= 0.3) {
        found.push({ key, fact: `В ${a} из ${withS.length} дней, когда монеты рассыпались по дороге, вечером сил было мало. В остальные дни — в ${b} из ${without.length}.`, dates: withS.slice(0, 5).map((e) => e.date) });
      }
    }
  }
  // Заклинания и силы
  for (const sp of S.spells) {
    const k = `spell:${sp.id}`;
    if (S.threads.decided[k]) continue;
    const cast = new Set(sp.casts.map((c) => c.date));
    const withC = ev.filter((e) => cast.has(e.date)), without = ev.filter((e) => !cast.has(e.date));
    if (withC.length < 4 || without.length < 3) continue;
    const a = withC.filter((e) => e.energy >= 3).length, b = without.filter((e) => e.energy >= 3).length;
    if (a / withC.length >= 0.7 && b / without.length <= 0.35) {
      found.push({ key: k, fact: `В ${a} из ${withC.length} дней с заклинанием «${sp.name}» вечером сил было «Хорошо» или больше. В остальные дни — в ${b} из ${without.length}.`, dates: withC.slice(0, 5).map((e) => e.date) });
    }
  }
  return found;
}

export function threadFact(t) { return S.hero === 'm' && t.factM ? t.factM : t.fact; }

// ——— главы ———
export const CHAPTER_DAYS = 42;
export function chapterDue() {
  const n = S.chapters.length;
  const start = n ? S.chapters[n - 1].to : S.created;
  if (daysBetween(start, dayKey()) < CHAPTER_DAYS) return null;
  return { n: n + 1, from: n ? addDays(start, 1) : start, to: dayKey() };
}

export function rangeStats(from, to) {
  const inR = (k) => k >= from && k <= to;
  const evs = Object.entries(S.days).filter(([k, d]) => inR(k) && d.evening).length;
  const st = S.steps.filter((s) => inR(s.date));
  const lands = new Set(st.map((s) => s.landId)).size;
  let returns = 0;
  const actDays = [...new Set([...Object.keys(S.days), ...S.steps.map((s) => s.date)])].filter(inR).sort();
  for (let i = 1; i < actDays.length; i++) if (daysBetween(actDays[i - 1], actDays[i]) >= 3) returns++;
  const threads = S.threads.list.filter((t) => t.status === 'woven' && inR(t.date)).length;
  return { evs, stitches: st.reduce((a, s) => a + s.stitches, 0), lands, returns, threads };
}

export { landOf };
