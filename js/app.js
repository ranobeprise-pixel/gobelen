import { LANDS, EMBLEM_SLOTS, LOADS, LOAD_HINT, FREQS, SKY_HINT, ENERGY, ENERGY_M, SKIES, WAKES, TAGS, SPELL_SEEDS, UNITS, CARDS, FIRST_GREETING, OWN_GOALS } from './data.js';
import { S, save, dayKey, addDays, daysBetween, parseDay, uid, landDef, landOf, landName, landShort, emblemSrc, sceneSrc, lookOf, applyRegular,
  weeklyLoad, tierTarget, activeLands, addStep, landProgress, spellStats, money, cur, replaceAll, resetAll } from './store.js';
import { g, mood, weekMoonLabel, evaluateVisit, cardName, cardImg, cardQs, drawCard, canAskCard, nextCardDay,
  detectThreads, threadFact, chapterDue, rangeStats, callWitch } from './engine.js';

const $app = document.getElementById('app');
const APP_URL = location.origin + location.pathname;
const PSY_LINK = 'https://t.me/linapsyc';

// ——— утилиты ———
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const w = (f, m) => (S.hero === 'm' ? m : f);
const today = () => dayKey();
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MON3 = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const fmtDay = (k) => { const d = parseDay(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const fmtShort = (k) => { const d = parseDay(k); return `${d.getDate()} ${MON3[d.getMonth()]}`; };
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
const stitchW = (n) => `${n} ${plural(n, 'стежок', 'стежка', 'стежков')}`;
const threadW = (n) => `${n} ${plural(n, 'нить', 'нити', 'нитей')}`;
const clone = (o) => JSON.parse(JSON.stringify(o));
const energyName = (i) => (S.hero === 'm' ? ENERGY_M : ENERGY)[i];

const I = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="#9A7E62" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plus: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#9A7E62" stroke-width="2" stroke-linecap="round"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" fill="none" stroke="#FFF8EC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bag: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10l1.5 11a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#CDBFA8" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  pen: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" fill="none" stroke="#FFF8EC" stroke-width="2" stroke-linejoin="round"/></svg>',
  thread: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M4 22c5-2 5-14 10-14s5 12 10 10" fill="none" stroke="#B8862E" stroke-width="2.2" stroke-linecap="round"/><circle cx="14" cy="8" r="2.6" fill="#B8862E"/></svg>',
  spindle: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c4-2 4-8 8-8s4 6 8 4M12 12V3" fill="none" stroke="#E9C77B" stroke-width="2" stroke-linecap="round"/></svg>',
  heart: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" fill="none" stroke="#E58FA6" stroke-width="2" stroke-linejoin="round"/></svg>',
  fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9zM5 21h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10a8 5 0 0 1 16 0M11 13h2v3h-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 8h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  scroll: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a3 3 0 0 1-3-3V6M5 6a2 2 0 0 1 2-2M9 9h7M9 13h7M9 17h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const backBtn = (to, label = 'Назад') => `<button class="back" data-a="go" data-to="${to}" aria-label="${label}">${I.back}</button>`;

// ——— маршруты и состояние экрана ———
let route = 'start', P = {}, ui = {};
let ob = null; // черновик первого входа
const stack = [];

function go(r, params = {}, keepUi = false) {
  if (r !== route) document.querySelectorAll('.toast').forEach((t) => { if (!t.querySelector('.toastundo')) t.remove(); });
  route = r; P = params;
  if (!keepUi) ui = {};
  render(true);
}
function render(top = false) {
  const y = window.scrollY;
  const fn = SCR[route] || SCR.map;
  $app.innerHTML = fn();
  window.scrollTo(0, top ? 0 : y);
  if (ui.focus) { const el = document.getElementById(ui.focus); if (el) el.focus(); ui.focus = null; }
  if (route === 'map') animateStitches();
}
// Игла проходит по эмблеме: новые стежки проявляются на гобелене
function animateStitches() {
  const els = [...document.querySelectorAll('[data-anim-to]')];
  if (!els.length) return;
  els.forEach((el, i) => {
    S.seenStitches[el.dataset.key] = Number(el.dataset.st);
    setTimeout(() => {
      el.style.transition = 'clip-path 1.8s cubic-bezier(.3,.7,.3,1)';
      el.style.clipPath = `inset(${100 - Number(el.dataset.animTo)}% 0 0 0)`;
      const slot = el.closest('.slot');
      if (!slot) return;
      slot.classList.add('glow');
      const g = Number(el.dataset.gain);
      const b = document.createElement('span');
      b.className = 'gain'; b.textContent = `+${stitchW(g)}`;
      slot.appendChild(b);
      setTimeout(() => { slot.classList.remove('glow'); b.remove(); }, 2600);
    }, 450 + i * 800);
  });
  save();
}
function toast(msg, undo) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status');
  const span = document.createElement('span'); span.textContent = msg; t.appendChild(span);
  if (undo) {
    const b = document.createElement('button');
    b.className = 'toastundo'; b.textContent = 'Вернуть';
    b.addEventListener('click', (e) => { e.stopPropagation(); undo(); t.remove(); });
    t.appendChild(b);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), undo ? 5000 : 2300);
}
// удаление с возможностью вернуть: снимок всего состояния до действия
function withUndo(msg, fn) {
  const snap = JSON.stringify(S);
  fn(); save(); render();
  toast(msg, () => { replaceAll(JSON.parse(snap)); render(); toast('Вернула как было'); });
}
// ——— путеводитель: подсказки при первом заходе на экран ———
function HINTS() {
  return {
    map: ['Как устроен гобелен', [
      'Каждая эмблема на карте — <b>земля</b>, сфера жизни, которую ты ' + w('выбрала', 'выбрал') + '. Пока земля в карандаше, она серая; с каждым шагом эмблема проступает цветом снизу вверх.',
      'Нажми на землю — откроются её <b>узоры</b>, конкретные дела. Там же можно отметить шаг.',
      'Внизу пять вкладок: <b>Привал</b> — утренние сборы и вечерний костёр, <b>Сокровищница</b> — деньги, <b>Карта</b> — этот гобелен, <b>Заклинания</b> — маленькие привычки, <b>Летопись</b> — всё, что ты ' + w('оставила', 'оставил') + ' на пути.',
      '<b>Котомка</b> справа вверху — настройки, копии и путеводитель. Знак «?» в углу экрана снова покажет эту подсказку.']],
    evening: ['Как устроен привал', [
      'Полминуты вечером: сколько сил (луны), какое небо над тобой — так здесь отмечается настроение, — и к какой земле был шаг.',
      'Каждый отмеченный узор вплетает в землю стежки: лёгкий — 1, средний — 2, тяжёлый — 3. «Просто день» — тоже нормально.',
      'Пропуски ничего не обнуляют. По твоим привалам Странствующая понимает, когда прийти к костру и о чём спросить.']],
    morning: ['Как устроены сборы', [
      'Утром можно отметить, как ' + w('проснулась', 'проснулся') + ', выбрать один узор на день и слово дня — ориентир, а не задачу.',
      'Выбранный узор сам подсветится вечером у костра. Сборы можно пропускать.']],
    land: ['Как устроена земля', [
      '<b>Узоры</b> — дела, из которых складывается путь к этой земле. Нажми на кнопку рядом с узором, когда что-то сделано: в землю вплетутся стежки. Если нажала по ошибке, стежок можно убрать в списке «Последние стежки».',
      'Когда стежков наберётся на всю эмблему, земля вышита. Тогда можно надстроить новый ярус или повесить её на стену Летописи.',
      '«Изменить узоры» — добавить, убрать, поменять нагрузку и частоту.']],
    treasury: ['Как устроена сокровищница', [
      '<b>Сундуки</b> — накопления на цели: подушка, поездка, учёба. Это не ежемесячные конверты: деньги лежат в сундуке, пока ты сама не решишь их взять. Нажми на сундук, чтобы положить или взять.',
      'Каждая трата получает один из трёх видов: <b>Провизия</b> — необходимое и регулярное: аренда, продукты, проезд, связь. <b>Снаряжение</b> — то, что ты ценишь и во что вкладываешься. <b>Рассыпано</b> — на автопилоте или «не помню на что».',
      '<b>Конверты</b> — сколько ты разрешаешь себе потратить на что-то за месяц: кафе, такси. Выбираешь конверт при записи траты и видишь, сколько осталось. Каждый месяц конверты наполняются заново.',
      '<b>Постоянные траты</b> (аренда, подписки) можно завести один раз — они сами запишутся как провизия в свой день месяца.',
      '<b>Кошель</b> — сколько денег у тебя на руках. Сверь его: приложение запомнит сумму и дальше будет вычитать траты. Если при следующей сверке денег меньше, разница уйдёт в «рассыпано» — без упрёков.']],
    spells: ['Как устроены заклинания', [
      'Заклинания — маленькие регулярные привычки: движение, чтение, вода, тишина.',
      'У каждого есть <b>малая</b> версия на трудный день и <b>великая</b> на хороший. Обе считаются возвращением к привычке.',
      'Нажми на версию, впиши, сколько сделано сегодня (минуты, страницы, килограммы — что угодно), и нажми «Прочитать». Если заклинание привязано к земле, в неё вплетётся стежок: малое — 1, великое — 2.',
      'Здесь не считают дни подряд — считают <b>возвращения</b>: каждый раз, когда ты ' + w('вернулась', 'вернулся') + ' к заклинанию после паузы.']],
    journal: ['Как устроена летопись', [
      'Сюда само собой складывается всё: утро, привалы, шаги, ответы Странствующей и карты. «Записать» — добавить свою запись.',
      '<b>Колода Пути</b> — 22 карты с вопросами. Одну карту в неделю можно вытянуть самой, иногда её приносит Странствующая.',
      '<b>Нити наблюдений</b> — повторы, которые приложение заметило в записях. Это только факты и вопросы, никаких выводов о тебе: смысл решаешь ты.']]
  };
}
const SHORT = () => ({
  map: ['Эмблемы — твои <b>земли</b>, сферы жизни. С каждым шагом эмблема проступает цветом. Нажми на землю, чтобы увидеть её дела.', 'Настройки и Путеводитель — в <b>Котомке</b> справа вверху.'],
  evening: ['Отметь силы, настроение (небо) и к какой земле был шаг. Каждый узор вплетает в землю стежки. Пропуски ничего не обнуляют.'],
  morning: ['Как ' + w('проснулась', 'проснулся') + ', одно дело на день и слово-ориентир. Можно пропускать.'],
  land: ['<b>Узоры</b> — дела этой земли. Отмечай сделанное — в землю вплетутся стежки. Цель помогает видеть не только усилия, но и результат.'],
  treasury: ['<b>Сундуки</b> — накопления на цели. <b>Конверты</b> — сколько можно потратить на что-то за месяц. Траты бывают трёх видов: необходимое, ценное и «на автопилоте».', 'Подробнее — в Путеводителе в Котомке.'],
  spells: ['Маленькие привычки. Малое — на трудный день, великое — на хороший, засчитываются оба. Считаются не дни подряд, а возвращения.'],
  journal: ['Сюда само собой складывается всё, что было на пути. Раз в неделю можно вытянуть карту с вопросами.']
});
function hint(key) {
  if (S.seen?.[key] && !ui.hint) return '';
  const title = HINTS()[key][0];
  const ps = SHORT()[key];
  return `<div class="hintbox" role="note"><span class="goth" style="font-size:20px">${title}</span>${ps.map((x) => `<p>${x}</p>`).join('')}
    <button class="btn" style="min-height:42px;font-size:15px" data-a="hintOk" data-k="${key}">Понятно</button></div>`;
}
const helpBtn = (key) => (S.seen?.[key] && !ui.hint ? `<button class="helpbtn" data-a="toggle" data-k="hint" aria-label="Как это устроено">?</button>` : '');

function campRoute() {
  const d = S.days[today()];
  return new Date().getHours() < 15 && !d?.morning ? 'morning' : 'evening';
}

function tabbar(active, night = false) {
  const tabs = [['camp', 'Привал', I.fire], ['treasury', 'Сокровищница', I.chest], ['map', 'Карта', I.map], ['spells', 'Заклинания', I.book], ['journal', 'Летопись', I.scroll]];
  return `<nav class="tabbar ${night ? 'nightbar' : ''}" aria-label="Разделы">${tabs.map(([id, label, ic]) =>
    `<button data-a="tab" data-to="${id}" class="${active === id ? 'on' : ''}" ${active === id ? 'aria-current="page"' : ''}>${ic}${label}</button>`).join('')}</nav>`;
}

// ——— картинка земли (эмблема или своя) ———
function emblemHtml(l, size, extra = '') {
  const src = emblemSrc(l);
  if (src) return `<img src="${src}" alt="" style="width:${size}px;height:${size}px;border-radius:50%;flex:0 0 ${size}px;${extra}">`;
  const letter = esc((l.customName || '?').trim()[0] || '?');
  return `<span style="width:${size}px;height:${size}px;flex:0 0 ${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Brahms Gotisch',serif;font-size:${Math.round(size * 0.42)}px;color:#F3EBDD;background:radial-gradient(circle,#7A4A2E 0,#4A2A1A 70%);box-shadow:inset 0 0 0 3px #C7A257;${extra}">${letter}</span>`;
}

// =========================================================
// ЭКРАНЫ
// =========================================================
const SCR = {};

// ——— Первый вход ———
SCR.start = () => `
<div class="scr darkbg">
  <img src="img/tapestry.webp" alt="" style="width:100%;display:block;opacity:.9">
  <div style="margin-top:-140px;position:relative;border-radius:24px 24px 0 0;background:var(--dark);padding:28px 24px calc(28px + var(--safe-b));display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;flex:1">
    <h1 style="font-size:46px;line-height:1;color:#F3EBDD">Гобелен пути</h1>
    <p style="margin:0;font-size:17px;line-height:1.35;color:#CDBFA8">Вышивай жизнь, которую выбираешь.<br>Стежок за стежком, без спешки.</p>
    <button class="btn moon" data-a="obStart" style="margin-top:12px">Начать путь</button>
    <button class="link" data-a="restorePick" style="color:#CDBFA8">У меня уже есть гобелен — восстановить из копии</button>
    <input type="file" id="restoreFile" accept="application/json,.json" class="hide">
  </div>
</div>`;

SCR.hero = () => {
  const edit = P.mode === 'edit';
  const src = edit ? ui : ob;
  if (edit && ui.hero === undefined) { ui.hero = S.hero; ui.name = S.name; }
  const card = (on) => `padding:8px 8px 12px;border-radius:14px;display:flex;flex-direction:column;align-items:center;gap:10px;background:${on ? '#F6F1E6' : 'transparent'};border:2px solid ${on ? '#9A4A2A' : '#CBB99B'};width:100%`;
  return `
<div class="scr paper"><div class="pad">
  <div class="topbar">${backBtn(edit ? 'settings' : 'start')}<span class="step">${edit ? '' : 'шаг 1 из 4'}</span></div>
  <h1>Кто отправляется в путь?</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <button data-a="pickHero" data-v="f" aria-pressed="${src.hero === 'f'}" style="${card(src.hero === 'f')}">
      <img src="img/scene/hero_f.webp" alt="Странница в сливовом плаще с капюшоном" style="display:block;width:100%;height:min(280px,40vh);object-fit:cover;object-position:center 40%;border-radius:10px">
      <span style="font-size:18px;font-weight:700">Странница</span></button>
    <button data-a="pickHero" data-v="m" aria-pressed="${src.hero === 'm'}" style="${card(src.hero === 'm')}">
      <img src="img/scene/hero_m.webp" alt="Странник в зелёном плаще с солнцем на доспехе" style="display:block;width:100%;height:min(280px,40vh);object-fit:cover;object-position:center 40%;border-radius:10px">
      <span style="font-size:18px;font-weight:700">Странник</span></button>
  </div>
  <p class="sub" style="margin:0">В пути тебя будет навещать <b>Странствующая</b> — мудрая путница. Иногда она приходит к твоему костру с одним вопросом.</p>
  <label class="col">Как ей к тебе обращаться?
    <input class="field" type="text" data-m="${edit ? 'ui' : 'ob'}.name" value="${esc(src.name)}" placeholder="Имя или прозвище" autocomplete="given-name"></label>
  <button class="btn mt-auto" data-a="${edit ? 'heroSave' : 'heroNext'}">${edit ? 'Сохранить' : 'Дальше: выбрать земли'}</button>
</div></div>`;
};

SCR.lands = () => {
  const edit = P.mode === 'edit';
  const src = edit ? ui : ob;
  if (edit && !ui.picked) {
    ui.picked = activeLands().map((l) => l.id);
    ui.customs = S.lands.filter((l) => !landDef(l.id) && l.status !== 'hung').map((l) => ({ id: l.id, name: l.customName, art: l.art }));
  }
  const all = LANDS.map((l) => ({ id: l.id, name: l.name, about: l.about, src: `img/emblem/${l.id}.webp` }))
    .concat(src.customs.map((c) => ({ id: c.id, name: c.name, own: true, art: c.art, about: 'своя земля' })));
  const hung = new Set(S.lands.filter((l) => l.status === 'hung').map((l) => l.id));
  const n = src.picked.length;
  const counter = n === 0 ? 'Пока ничего не выбрано — отметь хотя бы одну землю' : n === 4 ? 'Выбрано 4 из 4 — чтобы заменить, сними отметку' : `Выбрано ${n} из 4`;
  return `
<div class="scr paper"><div class="pad">
  <div class="topbar">${backBtn(edit ? 'settings' : 'hero')}<span class="step">${edit ? '' : 'шаг 2 из 4'}</span></div>
  <div class="row" style="align-items:flex-start">
    <div class="ava s56" role="img" aria-label="Странствующая"></div>
    <p class="box" style="margin:0;font-size:15px;line-height:1.35;padding:10px 12px">${edit ? 'Можно сменить земли. Снятая земля уснёт и сохранит свои стежки, к ней можно вернуться.' : 'Выбери до четырёх земель. Остальные подождут под тканью.'}</p>
  </div>
  <h1 style="font-size:30px">Куда ведёт твой путь?</h1>
  <p class="sub">Земля — большая сфера жизни: дело, путешествия, дом, тело.${edit ? '' : ' На следующем шаге в каждую землю ты вошьёшь <b>узоры</b> — конкретные дела, из которых складывается путь туда.'}</p>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 10px">
    ${all.map((l) => {
      const sel = src.picked.includes(l.id);
      const isHung = hung.has(l.id);
      const pic = l.own
        ? emblemHtml({ customName: l.name, art: l.art }, 74, sel ? 'border:3px solid #9A4A2A;box-sizing:border-box' : 'filter:grayscale(1) contrast(.6) brightness(1.15);opacity:.75')
        : `<img src="${l.src}" alt="" style="display:block;width:74px;height:74px;border-radius:50%;border:3px solid ${sel ? '#9A4A2A' : 'transparent'};${sel ? '' : 'filter:grayscale(1) contrast(.6) brightness(1.15);opacity:.75'}">`;
      return `<button data-a="toggleLand" data-id="${l.id}" aria-pressed="${sel}" ${isHung ? 'disabled' : ''} style="background:none;border:none;padding:0;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:13px;line-height:1.15;text-align:center;min-height:108px;${isHung ? 'opacity:.5' : ''}">
        <span style="position:relative;display:block;width:74px;height:74px">${pic}
        ${sel ? `<span aria-hidden="true" style="position:absolute;right:-2px;top:-2px;width:22px;height:22px;border-radius:50%;background:#9A4A2A;display:flex;align-items:center;justify-content:center">${I.check}</span>` : ''}</span>
        <span style="font-weight:700">${esc(l.name)}</span><span style="font-size:12px;color:var(--muted)">${esc(l.about)}</span>${isHung ? '<span class="small">на стене</span>' : ''}</button>`;
    }).join('')}
    <button data-a="ownLandOpen" style="background:none;border:none;padding:0;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:13px;min-height:108px">
      <span style="width:74px;height:74px;border-radius:50%;border:2px dashed #9A7E62;display:flex;align-items:center;justify-content:center">${I.plus}</span>Своя земля</button>
  </div>
  ${ui.ownOpen ? `<div class="box col"><label class="col">Как назовёшь свою землю?<input id="ownName" class="field" maxlength="24" data-m="ui.ownName" placeholder="Например: Остров музыки" value="${esc(ui.ownName || '')}"></label>
    <span class="step">Выбери, как она будет выглядеть на карте</span>
    <div class="artpick">${LANDS.map((x) => `<button data-a="ownArt" data-v="${x.id}" aria-pressed="${(ui.ownArt || 'observatory') === x.id}" aria-label="${esc(x.name)}"><img src="img/emblem/${x.id}.webp" alt=""></button>`).join('')}</div>
    <div class="row"><button class="btn" data-a="ownLandAdd" style="min-height:44px">Нанести на карту</button><button class="btn ghost" data-a="ownLandClose" style="min-height:44px">Отмена</button></div></div>` : ''}
  <div class="col mt-auto">
    <span class="step center">${counter}</span>
    <button class="btn" data-a="${edit ? 'landsSave' : 'landsNext'}" ${n ? '' : 'disabled'}>${edit ? 'Сохранить земли' : 'Дальше: вшить узоры'}</button>
  </div>
</div></div>`;
};

function landById(id) {
  const c = (ob && ob.customs.find((x) => x.id === id)) || (ui.customs && ui.customs.find((x) => x.id === id));
  return landOf(id) || (c ? { id, customName: c.name, art: c.art } : { id });
}

SCR.weave = () => {
  // P.mode: 'ob' (первый вход), 'edit' (одна земля), P.queue — список земель
  const queue = P.queue;
  const idx = P.idx || 0;
  const id = queue[idx];
  const l = landById(id);
  const def = landDef(id);
  if (!ui.pats) ui.pats = clone(P.mode === 'ob' ? (ob.patterns[id] || []) : (landOf(id)?.patterns || []));
  const pats = ui.pats;
  const hints = (def?.hints || ['Маленький шаг', 'Час на это', 'Поговорить с кем-то', 'Почитать', 'Попробовать новое']).filter((h) => !pats.some((p) => p.name === h));
  const total = weeklyLoad(pats);
  const heavy = total > 12;
  const isLast = idx === queue.length - 1;
  const nextLabel = P.mode === 'ob' ? (isLast ? 'Дальше: сундуки' : `Дальше: ${landShort(landById(queue[idx + 1]))}`) : (isLast ? 'Готово' : `Дальше: ${landShort(landById(queue[idx + 1]))}`);
  return `
<div class="scr paper"><div class="pad">
  <div class="topbar">${backBtn('weaveBack')}<span class="step">${P.mode === 'ob' ? `шаг 3 из 4 · земля ${idx + 1} из ${queue.length}` : queue.length > 1 ? `земля ${idx + 1} из ${queue.length}` : ''}</span></div>
  <div class="row">${emblemHtml(l, 56)}<div class="col" style="gap:0"><span class="step">Вшей узоры земли</span><h1 style="font-size:28px">${esc(landName(l))}</h1></div></div>
  ${def?.leads ? `<p class="sub" style="color:var(--ink)">${esc(def.about)}. ${esc(def.leads)}</p>` : ''}
  <p class="sub">Узоры — конкретные дела, из которых складывается путь сюда. Для каждого выбери, сколько сил он забирает и как часто ты хочешь его делать.</p>
  <div class="col">
  ${pats.map((p, i) => `
    <div class="box col" style="padding:10px 12px">
      <div class="row" style="justify-content:space-between"><span style="font-size:17px;font-weight:700">${esc(p.name)}</span>
        <button data-a="patDel" data-i="${i}" aria-label="Убрать узор ${esc(p.name)}" style="width:32px;height:32px;border:none;background:none;color:var(--muted)">${I.x}</button></div>
      <div role="group" aria-label="Сколько сил забирает" class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:4px">
        ${LOADS.map((lb, k) => `<button class="tile ${p.load === k + 1 ? 'on' : ''}" style="min-height:44px;padding:0;font-size:15px" data-a="patLoad" data-i="${i}" data-v="${k + 1}" aria-pressed="${p.load === k + 1}">${lb}</button>`).join('')}
      </div>
      <div class="row" style="justify-content:space-between">
        <span style="font-size:13px;color:var(--muted)">${LOAD_HINT[p.load - 1]} · +${stitchW(p.load)}</span>
        <div class="row" style="gap:2px">
          <button class="tile" style="width:44px;min-height:44px;padding:0;font-size:18px" data-a="patFreq" data-i="${i}" data-v="-1" aria-label="Реже">−</button>
          <span style="min-width:72px;text-align:center;font-size:14px">${FREQS[p.freq][0]}</span>
          <button class="tile" style="width:44px;min-height:44px;padding:0;font-size:18px" data-a="patFreq" data-i="${i}" data-v="1" aria-label="Чаще">+</button>
        </div>
      </div>
    </div>`).join('')}
  </div>
  ${hints.length ? `<div class="col" style="gap:6px"><span class="step">Подсказки — нажми, чтобы добавить</span>
    <div class="row" style="flex-wrap:wrap;gap:6px">${hints.slice(0, 6).map((h) => `<button class="chip add" data-a="patAdd" data-name="${esc(h)}">+ ${esc(h)}</button>`).join('')}</div></div>` : ''}
  <div class="row"><input id="ownPat" class="field grow" data-m="ui.newPat" value="${esc(ui.newPat || '')}" placeholder="Свой узор, например: час на проект" style="height:44px"><button class="btn" style="width:auto;min-height:44px" data-a="patAddOwn">Вшить</button></div>
  <div class="col mt-auto">
    ${pats.length ? `<div role="status" class="note ${heavy ? 'warn' : 'ok'}">Узоры этой земли — до ${stitchW(total)} в неделю${heavy ? '. Тяжеловато — оставь себе запас сил.' : '. По силам.'}</div>` : '<div class="note ok">Можно начать и без узоров: шаги к этой земле можно отмечать у вечернего костра.</div>'}
    <button class="btn" data-a="weaveNext">${nextLabel}</button>
  </div>
</div></div>`;
};

function chestSuggestions(landIds) {
  const out = [['Подушка безопасности', 'всегда пригодится']];
  for (const id of landIds) { const d = landDef(id); if (d) out.push(d.chest); }
  return out;
}

SCR.tsetup = () => {
  const edit = P.mode === 'edit';
  if (!ui.chests) {
    if (edit) ui.chests = S.treasury.chests.map((c) => ({ ...c, on: true }));
    else ui.chests = chestSuggestions(ob.picked).map(([name, why]) => ({ id: uid(), name, why, goal: '', saved: 0, on: true }));
    ui.mode = edit ? S.treasury.mode : 0;
    ui.cur = S.treasury.currency || '₽';
    if (edit) for (const [name, why] of chestSuggestions(activeLands().map((l) => l.id))) if (!ui.chests.some((c) => c.name === name)) ui.chests.push({ id: uid(), name, why, goal: '', saved: 0, on: false });
  }
  const modes = [['Вношу сама|Вношу сам', 'каждую трату, в пару касаний'], ['Сверяю кошель', 'раз в неделю; что не учтено — рассыпанные монеты']];
  return `
<div class="scr tre"><div class="pad">
  <div class="topbar">${backBtn(edit ? 'settings' : 'weaveFromTreasury')}<span class="step">${edit ? '' : 'шаг 4 из 4'}</span></div>
  <h1 style="font-size:30px">Сундуки сокровищницы</h1>
  <p class="sub">${edit ? 'Сундуки — это цели, на которые копишь. Сумму цели можно не ставить.' : 'Мы подобрали сундуки под твои земли. Оставь нужные, сумму цели можно не ставить.'}</p>
  <div class="col">
  ${ui.chests.map((c, i) => `
    <div style="padding:6px 12px 10px;border-radius:12px;display:flex;flex-direction:column;gap:6px;border:1px solid ${c.on ? '#E8B04A' : '#5C4632'};background:${c.on ? '#36261A' : 'transparent'}">
      <button data-a="chestToggle" data-i="${i}" aria-pressed="${c.on}" style="display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:0;border:none;background:none;text-align:left">
        <span aria-hidden="true" style="flex:0 0 24px;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;${c.on ? 'background:#E8B04A;color:#2A1D12' : 'border:1.5px solid #8A6E52'}">${c.on ? '✓' : ''}</span>
        <span class="col" style="gap:0"><span style="font-size:17px;font-weight:700">${esc(c.name)}</span>${c.why ? `<span style="font-size:13px;color:#C9B49A">${esc(c.why)}</span>` : ''}</span>
      </button>
      ${c.on ? `<input class="field" style="height:40px" inputmode="numeric" data-m="chest.${i}" value="${c.goal ? esc(c.goal) : ''}" aria-label="Цель для сундука ${esc(c.name)}" placeholder="цель, ${cur()} — можно оставить пустым">` : ''}
    </div>`).join('')}
    <div class="row"><input class="field grow" style="height:44px" data-m="ui.newChest" value="${esc(ui.newChest || '')}" placeholder="Свой сундук, например: новый ноутбук"><button class="btn amber" style="width:auto;min-height:44px" data-a="chestAdd">Добавить</button></div>
  </div>
  <div class="row" style="justify-content:space-between"><span class="lbl">Валюта</span><div class="row" style="gap:6px">${['₽', '$', '€'].map((c) => `<button class="tile ${ui.cur === c ? 'on' : ''}" style="width:52px;min-height:40px;font-size:18px" data-a="setCur" data-v="${c}" aria-pressed="${ui.cur === c}">${c}</button>`).join('')}</div></div>
  <div class="col" style="gap:6px"><span class="lbl">Как будешь вести траты?</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    ${modes.map((m, i) => `<button data-a="tmode" data-v="${i}" aria-pressed="${ui.mode === i}" style="min-height:84px;padding:10px;border-radius:12px;text-align:left;display:flex;flex-direction:column;gap:4px;${ui.mode === i ? 'background:#E8B04A;color:#2A1D12;border:1px solid #E8B04A' : 'background:transparent;color:#F3E7CF;border:1px solid #5C4632'}"><span style="font-size:15px;font-weight:700">${i === 0 ? w('Вношу сама', 'Вношу сам') : m[0]}</span><span style="font-size:13px;opacity:.85">${m[1]}</span></button>`).join('')}
    </div></div>
  <button class="btn amber mt-auto" data-a="${edit ? 'tsetupSave' : 'obFinish'}">${edit ? 'Сохранить' : 'Вышить карту'}</button>
</div></div>`;
};

// ——— Карта ———
SCR.map = () => {
  const t = new Date();
  const lands = activeLands();
  const firstDay = !S.firstDaySeen;
  const pending = S.witch.pending;
  const chap = chapterDue();
  const slots = [0, 1, 2, 3].map((i) => {
    const [x, y] = EMBLEM_SLOTS[i];
    const pos = `left:${(x / 390) * 100}%;top:${(y / 699) * 100}%`;
    const l = lands.find((q) => q.slot === i);
    if (!l) {
      return `<button class="slot" style="${pos}" data-a="go" data-to="landsEdit" aria-label="Свободное место: выбрать землю"><span class="plus">${I.plus}</span><span class="pill free">Свободная земля</span></button>`;
    }
    const p = landProgress(l);
    const pct = Math.round(p * 100);
    const done = p >= 1;
    const src = emblemSrc(l);
    // анимация новых стежков: показываем прошлый уровень и дотягиваем до нового
    const key = l.id + ':' + l.tier;
    if (S.seenStitches[key] === undefined) S.seenStitches[key] = l.stitches;
    const prev = Math.min(S.seenStitches[key], l.stitches);
    const gain = l.stitches - prev;
    const startPct = gain > 0 ? Math.round(Math.min(1, prev / l.target) * 100) : pct;
    const anim = gain > 0 ? `data-anim-to="${pct}" data-key="${key}" data-st="${l.stitches}" data-gain="${gain}"` : '';
    const art = src
      ? `<img class="pencil" src="${src}" alt=""><img src="${src}" alt="" ${anim} style="clip-path:inset(${100 - startPct}% 0 0 0)">`
      : `<span class="ownland" style="filter:grayscale(1);opacity:.5">${esc((l.customName || '?')[0])}</span><span class="ownland" ${anim} style="clip-path:inset(${100 - startPct}% 0 0 0)">${esc((l.customName || '?')[0])}</span>`;
    return `<button class="slot" style="${pos}" data-a="openLand" data-id="${l.id}" aria-label="${esc(landName(l))}, вышито ${pct} процентов">${art}<span class="pill ${done ? 'done' : ''}">${esc(landShort(l))} · ${done ? 'вышито' : pct + '%'}</span></button>`;
  }).join('');
  return `
<div class="scr tabbed darkbg">
  <header class="maphead">
    <div class="col" style="gap:0;width:84px">${!firstDay ? helpBtn('map').replace('class="helpbtn"', 'class="helpbtn" style="color:#CDBFA8;width:24px;height:24px;flex-basis:24px;font-size:13px;margin-bottom:2px"') : ''}<span style="font-size:13px;color:#CDBFA8">${t.toLocaleDateString('ru-RU', { weekday: 'long' })}</span><span style="font-size:16px;color:#F3EBDD">${t.getDate()} ${MONTHS[t.getMonth()]}</span></div>
    <h1>Гобелен пути</h1>
    <div class="row" style="width:84px;justify-content:flex-end;gap:4px">
      <button class="bagbtn" data-a="go" data-to="settings">${I.bag}<span>Котомка</span></button>
      <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="${weekMoonLabel()}"><path d="M15 3a9 9 0 1 0 6 15A7.5 7.5 0 0 1 15 3z" fill="${mood() === 'up' ? '#E9C77B' : 'none'}" stroke="#E9C77B" stroke-width="2" stroke-linejoin="round"/></svg>
    </div>
  </header>
  ${!firstDay ? `<div style="padding:0 16px">${hint('map')}</div>` : ''}
  <div class="mapwrap">
    <img class="tap" src="img/tapestry.webp" alt="Вышитая карта: золотой город в центре, к нему ведут тропы от земель">
    ${slots}
    ${!firstDay && (chap || pending) ? `<div class="mapbanners">
      ${pending ? `<button class="mapbanner" data-a="go" data-to="visit">${I.spindle} У костра тебя кто-то ждёт</button>` : ''}
      ${chap ? `<button class="mapbanner" data-a="go" data-to="chapter">${I.spindle} Глава ${chap.n} завершена</button>` : ''}</div>` : ''}
    ${firstDay ? `<div class="dialog" role="dialog" aria-label="Приветствие Странствующей">
      <div class="row"><div class="ava" role="img" aria-label=""></div><span class="goth" style="font-size:20px;color:var(--gold)">Добро пожаловать в путь${S.name ? ', ' + esc(S.name) : ''}</span></div>
      <p style="margin:0;font-size:16px;font-style:italic;line-height:1.4;color:#E9DFF0">${g(FIRST_GREETING)}</p>
      <button class="btn gold" data-a="firstSeen">Буду ждать вечера</button></div>` : ''}
  </div>
  ${tabbar('map')}
</div>`;
};

// ——— Земля ———
const HORIZONS = [['месяц', 1], ['3 месяца', 3], ['полгода', 6], ['год', 12]];
function goalCard(l) {
  const g0 = l.goal;
  const td = today();
  const muted = 'color:#B9AECB';
  if (ui.goalForm) {
    const ex = landDef(l.id)?.goals || OWN_GOALS;
    const L = (letter, title, q) => `<span class="row" style="gap:8px;align-items:baseline"><b style="flex:0 0 22px;height:22px;border-radius:6px;background:var(--moon);color:#1E1530;display:inline-flex;align-items:center;justify-content:center;font-size:13px">${letter}</b><span style="font-size:15px"><b>${title}</b> <span style="${muted}">· ${q}</span></span></span>`;
    return `<div class="col" style="gap:10px;padding:14px;border-radius:14px;background:rgba(255,255,255,.07)">
      <span style="font-size:17px;color:var(--moon)">Цель для этой земли</span>
      ${L('S', 'Конкретно', 'что именно хочу?')}
      <input id="gText" class="field" style="height:44px" data-m="ui.gText" value="${esc(ui.gText || '')}" placeholder="${esc(ex[0] || 'Например: прочитать 12 книг')}">
      ${ex.length ? `<div class="row" style="flex-wrap:wrap;gap:4px">${ex.map((x, i) => `<button class="chip" style="min-height:30px;font-size:12px;padding:0 10px;color:#EFE7F7;border-color:#4E3D73" data-a="goalEx" data-i="${i}">${esc(x)}</button>`).join('')}</div>` : ''}
      ${L('M', 'Измеримо', 'как пойму, что получилось?')}
      <div class="row"><input class="field" style="height:44px;width:96px" inputmode="decimal" data-m="ui.gTarget" value="${esc(ui.gTarget || '')}" placeholder="12"><input class="field grow" style="height:44px" data-m="ui.gUnit" value="${esc(ui.gUnit || '')}" placeholder="книг, клиентов, раз…"></div>
      ${L('A', 'Достижимо', 'хватит ли сил?')}
      <span style="font-size:14px;${muted}">Сейчас узоры этой земли — до ${stitchW(weeklyLoad(l.patterns))} в неделю. Если цель большая, раздели её или дай больше времени.</span>
      ${L('R', 'Значимо', 'зачем это мне?')}
      <input class="field" style="height:44px" data-m="ui.gWhy" value="${esc(ui.gWhy || '')}" placeholder="Чтобы… (можно пропустить)">
      ${L('T', 'Ограничено', 'к какому сроку?')}
      <div class="row" style="flex-wrap:wrap;gap:6px">${HORIZONS.map(([t, m]) => `<button class="chip ${ui.gMonths === m ? 'on' : ''}" style="color:${ui.gMonths === m ? '#1E1530' : '#EFE7F7'};border-color:#4E3D73;${ui.gMonths === m ? 'background:var(--moon);border-color:var(--moon)' : ''}" data-a="set" data-k="gMonths" data-v="${m}">${t}</button>`).join('')}</div>
      <div class="row"><button class="btn moon" style="min-height:46px" data-a="goalSave">Поставить цель</button><button class="btn ghost" style="min-height:46px;width:auto;color:#EFE7F7;border-color:#4E3D73" data-a="toggle" data-k="goalForm">Отмена</button></div>
    </div>`;
  }
  if (!g0) {
    return `<button data-a="goalOpen" class="row" style="padding:12px 14px;border-radius:14px;border:1px dashed #6E5F94;background:none;color:#EFE7F7;text-align:left">
      <span class="col grow" style="gap:2px"><span style="font-size:16px;font-weight:700">Поставить цель</span><span style="font-size:13px;${muted}">конкретную, со сроком — чтобы видеть не только усилия, но и результат</span></span><span style="font-size:22px;color:var(--moon)">+</span></button>`;
  }
  const left = daysBetween(td, g0.due);
  const pct = g0.target ? Math.min(100, Math.round((g0.current / g0.target) * 100)) : 0;
  const done = !!g0.doneAt;
  return `<div class="col ${ui.flash === 'goal' ? 'flash' : ''}" style="gap:8px;padding:14px;border-radius:14px;background:rgba(255,255,255,.07);${done ? 'box-shadow:inset 0 0 0 2px var(--moon)' : ''}">
    <div class="row" style="justify-content:space-between;align-items:baseline"><span style="font-size:13px;color:var(--moon);letter-spacing:.5px">${done ? 'ЦЕЛЬ ДОСТИГНУТА' : 'ЦЕЛЬ'}</span>
      <span style="font-size:13px;${muted}">${done ? fmtDay(g0.doneAt) : left > 0 ? `осталось ${left} ${plural(left, 'день', 'дня', 'дней')} · до ${fmtShort(g0.due)}` : left === 0 ? 'срок сегодня' : 'срок прошёл'}</span></div>
    <span style="font-size:17px;line-height:1.3">${esc(g0.text)}</span>
    ${g0.why ? `<span style="font-size:14px;font-style:italic;${muted}">${esc(g0.why)}</span>` : ''}
    ${g0.target ? `<div class="row"><div class="prog grow" style="background:rgba(255,255,255,.08)"><div style="width:${pct}%"></div></div><span style="font-size:14px;white-space:nowrap">${g0.current} из ${g0.target} ${esc(g0.unit || '')}</span></div>
      ${done ? '' : `<div class="row" style="gap:6px"><button class="btn ghost" style="min-height:40px;width:auto;padding:0 14px;color:#EFE7F7;border-color:#4E3D73" data-a="goalStep" data-v="-1" aria-label="Минус один">−1</button><button class="btn moon" style="min-height:40px;font-size:15px" data-a="goalStep" data-v="1">+1 — ещё на шаг ближе</button></div>`}`
    : done ? '' : `<button class="btn moon" style="min-height:42px;font-size:15px" data-a="goalDone">Цель достигнута</button>`}
    ${!done && left < 0 ? `<span style="font-size:14px;${muted}">Срок прошёл — это не провал. Можно продлить, изменить цель или отпустить её.</span>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="chip" style="color:#EFE7F7;border-color:#4E3D73" data-a="goalExtend">+1 месяц</button><button class="chip" style="color:#EFE7F7;border-color:#4E3D73" data-a="goalEdit">Изменить</button><button class="chip" style="color:#EFE7F7;border-color:#4E3D73" data-a="goalDrop">Отпустить</button></div>`
    : `<div class="row" style="gap:12px"><button class="link" style="padding:0;font-size:13px;color:#B9AECB" data-a="goalEdit">${done ? 'Новая цель' : 'Изменить'}</button>${done ? '' : `<button class="link" style="padding:0;font-size:13px;color:#B9AECB" data-a="goalDrop">Отпустить</button>`}</div>`}
  </div>`;
}

SCR.land = () => {
  const l = landOf(P.id);
  if (!l) return SCR.map();
  const def = lookOf(l);
  const own = landDef(l.id);
  const p = landProgress(l);
  const pct = Math.round(p * 100);
  const td = today();
  const recent = S.steps.filter((s) => s.landId === l.id && s.tier === l.tier).slice(-5).reverse();
  const tint = def?.tint || '#24170F';
  return `
<div class="scr violet" style="background:${tint}">
  ${sceneSrc(l) ? `<img class="hero-img" src="${sceneSrc(l)}" alt="" style="height:min(340px,40vh);object-position:center 35%">` : `<div style="height:200px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 60%,#5A3A26,${tint})">${emblemHtml(l, 120)}</div>`}
  <button class="back" data-a="go" data-to="map" aria-label="Назад к карте" style="position:absolute;left:16px;top:calc(16px + var(--safe-t));background:${tint};border-color:#4E3D73;color:#EFE7F7">${I.back}</button>
  <div class="sheetup" style="background:${tint};padding:18px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:14px">
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div class="col" style="gap:2px"><h1>${esc(landName(l))}</h1><span style="font-size:15px;color:#B9AECB">${esc(own?.about || 'Своя земля')}${l.tier > 1 ? ` · ${def?.tier || 'ярус'} ${l.tier}` : ''}</span></div>
      <span class="row" style="gap:8px;font-size:15px;color:var(--moon);white-space:nowrap">${pct}%${helpBtn('land')}</span>
    </div>
    ${own?.leads ? `<p style="margin:0;font-size:14px;line-height:1.4;color:#D9D0E8">${esc(own.leads)}</p>` : ''}
    ${hint('land')}
    ${goalCard(l)}
    ${(l.goalHistory || []).length ? `<div class="col" style="gap:4px">
      <button data-a="toggle" data-k="histOpen" aria-expanded="${!!ui.histOpen}" class="row" style="justify-content:space-between;background:none;border:none;padding:0;color:#D9D0E8;text-align:left;min-height:32px"><span style="font-size:15px">Прошлые цели · достигнуто ${l.goalHistory.filter((x) => x.status === 'done').length} из ${l.goalHistory.length}</span><span style="font-size:13px">${ui.histOpen ? '▴' : '▾'}</span></button>
      ${ui.histOpen ? [...l.goalHistory].reverse().map((x) => `<div class="row" style="align-items:flex-start;font-size:14px;line-height:1.35;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.05)"><span style="color:${x.status === 'done' ? 'var(--moon)' : '#B9AECB'}">${x.status === 'done' ? '✓' : '○'}</span><span class="col grow" style="gap:0"><span>${esc(x.text)}</span><span style="font-size:12px;color:#B9AECB">${x.status === 'done' ? 'достигнута' : 'отпущена'} ${fmtDay(x.closedAt)}${x.target ? ` · ${x.current} из ${x.target} ${esc(x.unit || '')}` : ''}</span></span></div>`).join('') : ''}
    </div>` : ''}
    <div class="col" style="gap:4px"><div class="prog" role="img" aria-label="Вышито ${pct} процентов" style="background:rgba(255,255,255,.08)"><div style="width:${pct}%"></div></div>
    <span style="font-size:13px;color:#B9AECB">Вовлечённость: ${stitchW(l.stitches)} из ${l.target}${l.patterns.length ? ' — примерно 6 недель по твоему плану узоров' : ''}</span></div>
    ${p >= 1 ? `<button class="btn moon" data-a="go" data-to="complete" data-id="${l.id}">Земля вышита — что дальше?</button>` : ''}
    <div class="row" style="justify-content:space-between;align-items:baseline"><span style="font-size:16px;color:var(--moon)">Узоры — дела этой земли</span>
      <button class="link" style="color:#D9D0E8;padding:6px 0" data-a="weaveEdit" data-id="${l.id}">Изменить узоры</button></div>
    <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">
    ${l.patterns.length ? l.patterns.map((pt) => {
      const n = S.steps.filter((s) => s.date === td && s.patternId === pt.id).length;
      const ask = ui.confirmStep === pt.id;
      return `<li style="display:flex;flex-direction:column;gap:6px;padding:6px 12px;border-radius:12px;background:rgba(255,255,255,.07)">
        <div class="row" style="min-height:40px"><span class="col grow" style="gap:0"><span style="font-size:16px">${esc(pt.name)}</span><span style="font-size:13px;color:#B9AECB">${FREQS[pt.freq][0]} · ${LOAD_HINT[pt.load - 1]} · +${stitchW(pt.load)}</span></span>
        <button data-a="stepDo" data-land="${l.id}" data-p="${pt.id}" style="flex:0 0 auto;height:38px;padding:0 12px;border-radius:10px;font-size:14px;border:1px solid var(--moon);${n ? 'background:transparent;color:var(--moon)' : 'background:var(--moon);color:#1E1530'}">${n ? `Сегодня ×${n} · ещё` : w('Сделала', 'Сделал')}</button></div>
        ${ask ? `<div class="row" style="gap:6px;font-size:14px"><span class="grow">Только что отмечено. Ещё раз?</span><button class="chip" style="color:#1E1530;background:var(--moon);border-color:var(--moon)" data-a="stepDo" data-land="${l.id}" data-p="${pt.id}" data-force="1">Да</button><button class="chip" style="color:#EFE7F7;border-color:#4E3D73" data-a="set" data-k="confirmStep" data-v="0">Нет</button></div>` : ''}
      </li>`;
    }).join('') : `<li style="font-size:15px;color:#B9AECB">Узоров пока нет. <button class="link" style="color:#D9D0E8;padding:0" data-a="weaveEdit" data-id="${l.id}">Вшить узоры</button></li>`}
    </ul>
    ${recent.length ? `<div class="col" style="gap:2px"><span style="font-size:14px;color:#B9AECB">Последние стежки — лишний можно убрать</span>${recent.map((s) => `<div class="row" style="font-size:14px;justify-content:space-between"><span>${fmtShort(s.date)} · ${esc(s.name)} · +${s.stitches}</span><button data-a="stepUndo" data-i="${S.steps.indexOf(s)}" aria-label="Убрать стежок" style="width:36px;height:32px;border:none;background:none;color:#B9AECB">${I.x}</button></div>`).join('')}</div>` : ''}
  </div>
</div>`;
};

SCR.complete = () => {
  const l = landOf(P.id);
  if (!l) return SCR.map();
  const def = lookOf(l);
  const steps = S.steps.filter((s) => s.landId === l.id && s.tier === l.tier);
  const first = steps[0]?.date || l.since;
  const months = Math.max(1, Math.round(daysBetween(first, today()) / 30));
  const tint = def?.tint || '#24170F';
  return `
<div class="scr violet" style="background:${tint}">
  <div style="position:relative">
    ${sceneSrc(l) ? `<img class="hero-img" src="${sceneSrc(l)}" alt="" style="height:min(340px,42vh);object-position:center 30%">` : `<div style="height:220px"></div>`}
    <div style="position:absolute;left:50%;bottom:-60px;transform:translateX(-50%);border-radius:50%;box-shadow:0 0 0 4px var(--moon)">${emblemHtml(l, 120)}</div>
  </div>
  <div style="padding:76px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:14px;text-align:center;flex:1">
    <span style="font-size:15px;color:var(--moon)">Последний ${esc(def?.tier || 'ярус')} вышит</span>
    <h1 style="font-size:34px">${esc(landName(l))}</h1>
    <p style="margin:0;font-size:16px;line-height:1.4;color:#D9D0E8">За ${months} ${plural(months, 'месяц', 'месяца', 'месяцев')} — ${stitchW(l.stitches)}. Земля не заканчивается: решай, что дальше.</p>
    <button data-a="landGrow" data-id="${l.id}" style="min-height:64px;padding:8px 16px;border-radius:12px;border:none;background:var(--moon);color:#1E1530;display:flex;flex-direction:column;gap:2px;text-align:left"><span style="font-size:17px;font-weight:700">Надстроить новый ${esc(def?.tier || 'ярус')}</span><span style="font-size:14px">новые узоры, та же земля — путь продолжается</span></button>
    <button data-a="landHang" data-id="${l.id}" style="min-height:64px;padding:8px 16px;border-radius:12px;border:1px solid #4E3D73;background:rgba(255,255,255,.06);color:#EFE7F7;display:flex;flex-direction:column;gap:2px;text-align:left"><span style="font-size:17px;font-weight:700">Повесить на стену Летописи</span><span style="font-size:14px;color:#B9AECB">эмблема останется золотой, место на карте освободится</span></button>
    <button class="link" style="color:#B9AECB" data-a="go" data-to="map">Решу позже</button>
  </div>
</div>`;
};

// ——— Утро и вечер ———
SCR.morning = () => {
  const d = S.days[today()]?.morning;
  if (ui.wake === undefined) { ui.wake = d?.wake ?? 0; ui.pid = d?.patternId ?? null; ui.word = d?.word ?? ''; }
  const pats = activeLands().flatMap((l) => l.patterns.map((p) => ({ ...p, land: l })));
  return `
<div class="scr tabbed dawn">
  <div style="position:relative"><img class="hero-img" src="img/scene/morning_${S.hero}.webp" alt="Рассвет на поляне: ${w('странница', 'странник')} сворачивает спальник у палатки" style="height:200px;object-position:center 72%">
    <div role="group" aria-label="Время дня" style="position:absolute;right:12px;top:calc(12px + var(--safe-t));display:flex;padding:3px;border-radius:999px;background:#3B2418">
      <span aria-current="page" style="height:34px;padding:0 14px;border-radius:999px;background:#F6C98B;color:#3B2418;display:flex;align-items:center;font-size:14px">Утро</span>
      <button data-a="go" data-to="evening" style="height:34px;padding:0 14px;border-radius:999px;color:#F3EBDD;background:none;border:none;font-size:14px">Вечер</button></div></div>
  <div class="pad nt">
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div class="col" style="gap:2px"><h1>Утренние сборы</h1><p class="sub" style="color:#7A5A4A">Три касания — и в путь. Можно пропустить.</p></div>${helpBtn('morning')}</div>
    ${hint('morning')}
    <div class="col" style="gap:6px"><span class="lbl">${w('Как ты проснулась?', 'Как ты проснулся?')}</span>
      <div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${WAKES.map((x, i) => `<button class="tile ${ui.wake === i ? 'on' : ''}" data-a="set" data-k="wake" data-v="${i}" aria-pressed="${ui.wake === i}">${x}</button>`).join('')}</div></div>
    ${pats.length ? `<div class="col" style="gap:6px"><span class="lbl">Один узор на сегодня</span>
      ${pats.slice(0, 8).map((p) => `<button data-a="setS" data-k="pid" data-v="${p.id}" aria-pressed="${ui.pid === p.id}" style="min-height:44px;padding:4px 12px 4px 6px;border-radius:12px;font-size:15px;display:flex;align-items:center;gap:10px;${ui.pid === p.id ? 'background:#F6C98B;border:1px solid #C98E2E' : 'background:#FFF8F2;border:1px solid #E6CCBD'}">
        ${emblemHtml(p.land, 32)}<span class="grow" style="text-align:left">${esc(p.name)}</span><span style="font-size:13px;opacity:.8">${esc(landShort(p.land))}</span></button>`).join('')}</div>` : ''}
    <label class="col" style="color:#A3462F">Слово дня<input class="field" data-m="ui.word" value="${esc(ui.word)}" placeholder="например: мягкость, смелость, тишина"></label>
    <button class="btn dawnb" data-a="morningSave">В путь</button>
  </div>
  ${tabbar('camp')}
</div>`;
};

SCR.evening = () => {
  const td = today();
  const prev = S.days[td]?.evening;
  const morn = S.days[td]?.morning;
  const lands = activeLands();
  if (ui.energy === undefined) {
    // форма начинается заново; утренний узор подсказывает землю
    ui.energy = 2; ui.sky = 2; ui.lands = []; ui.pids = []; ui.note = '';
    if (morn?.patternId) { const l = lands.find((q) => q.patterns.some((p) => p.id === morn.patternId)); if (l) { ui.lands = [l.id]; ui.pids = [morn.patternId]; } }
  }
  if (ui.done) return eveningDone();
  const carried = S.witch.carried;
  const isSunday = new Date().getDay() === 0;
  const needBackup = S.settings.backupRemind && isSunday && daysBetween(S.created, td) >= 7 && (!S.settings.lastBackup || daysBetween(S.settings.lastBackup, td) >= 6);
  const chosen = lands.filter((l) => ui.lands.includes(l.id));
  const prevLands = prev ? (prev.landIds || (prev.landId ? [prev.landId] : [])).map((id) => landOf(id)).filter(Boolean) : [];
  return `
<div class="scr tabbed night">
  <div style="position:relative"><img class="hero-img" src="img/scene/rest_${S.hero}.webp" alt="${w('Странница', 'Странник')} отдыхает босиком у костра с кружкой чая" style="height:220px;object-position:center 74%">
    <div role="group" aria-label="Время дня" style="position:absolute;right:12px;top:calc(12px + var(--safe-t));display:flex;padding:3px;border-radius:999px;background:#0E1226;border:1px solid #3A4270">
      <button data-a="go" data-to="morning" style="height:34px;padding:0 14px;border-radius:999px;color:#F1E9D8;background:none;border:none;font-size:14px">Утро</button>
      <span aria-current="page" style="height:34px;padding:0 14px;border-radius:999px;background:var(--gold);color:var(--night);display:flex;align-items:center;font-size:14px">Вечер</span></div></div>
  <div class="pad nt">
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div class="col" style="gap:2px"><h1>Вечерний привал</h1><p class="sub">Полминуты у огня. Пропуски ничего не обнуляют.</p></div>${helpBtn('evening')}</div>
    ${hint('evening')}
    ${prev && !ui.editing ? `<div class="box col" style="gap:6px;border-color:var(--gold)"><span class="lbl">Сегодня уже вплетено</span>
      <span style="font-size:15px;line-height:1.35">Силы: ${energyName(prev.energy).toLowerCase()} · небо: ${SKIES[prev.sky].toLowerCase()}${prevLands.length ? ` · шаг: ${prevLands.map((l) => esc(landShort(l))).join(', ')}` : ''}</span>
      ${prev.note ? `<span style="font-size:14px;font-style:italic;color:var(--lav)">«${esc(prev.note)}»</span>` : ''}
      <button class="btn ghost" style="min-height:44px;font-size:15px" data-a="eveEdit">Поправить сегодняшний привал</button>
      <span class="small" style="color:var(--nmuted)">Если заполнишь форму ниже заново, она заменит эту запись.</span></div>` : ''}
    ${carried ? `<div class="box col"><span class="lbl">Вопрос из котомки</span><span style="font-size:16px;line-height:1.35">${esc(carried.q)}</span>
      <textarea class="field" rows="2" data-m="ui.carriedAns" placeholder="Можно пару слов — или оставить">${esc(ui.carriedAns || '')}</textarea></div>` : ''}
    ${needBackup ? `<button class="box row" data-a="go" data-to="backup" style="text-align:left;color:inherit"><span class="grow" style="font-size:15px">Воскресенье. Сохранишь копию летописи?</span>${I.chev}</button>` : ''}
    <div class="col" style="gap:6px"><span class="lbl">Сколько в тебе сил</span>
      <div class="row" style="justify-content:space-between">${[2, 5, 8, 11, 13].map((r, i) => `<button data-a="set" data-k="energy" data-v="${i}" aria-label="${energyName(i)}" aria-pressed="${ui.energy === i}" style="width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;background:${ui.energy === i ? '#232C55' : 'transparent'};border:2px solid ${ui.energy === i ? 'var(--pink)' : 'transparent'}"><svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="none" stroke="#C9B26A" stroke-width="1.5"/><circle cx="15" cy="15" r="${r}" fill="#E9C77B"/></svg></button>`).join('')}</div>
      <span class="small center" style="color:var(--nmuted)">${energyName(ui.energy)}</span></div>
    <div class="col" style="gap:6px"><span class="lbl">Небо над тобой</span>
      <div class="seg" style="grid-template-columns:repeat(5,minmax(0,1fr))">${SKIES.map((s, i) => `<button class="chip ${ui.sky === i ? 'on' : ''}" style="padding:4px 2px;border-radius:14px;min-height:50px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1" data-a="set" data-k="sky" data-v="${i}" aria-pressed="${ui.sky === i}">${s}<span style="font-size:11px;opacity:.8">${SKY_HINT[i]}</span></button>`).join('')}</div></div>
    <div class="col"><span class="lbl">Шаги дня — к каким землям?</span>
      <div style="display:grid;grid-template-columns:repeat(${Math.min(5, lands.length + 1)},minmax(0,1fr));gap:6px">
      ${lands.map((l) => { const on = ui.lands.includes(l.id); return `<button data-a="eveLand" data-v="${l.id}" aria-pressed="${on}" style="background:none;border:none;padding:0;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:13px">${emblemHtml(l, 54, `box-sizing:border-box;border:3px solid ${on ? 'var(--pink)' : 'transparent'};opacity:${on ? 1 : 0.7}`)}${esc(landShort(l))}</button>`; }).join('')}
      <button data-a="eveLand" data-v="none" aria-pressed="${!ui.lands.length}" style="background:none;border:none;padding:0;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:13px"><span style="display:block;width:54px;height:54px;border-radius:50%;border:3px dashed ${!ui.lands.length ? 'var(--pink)' : '#3A4270'}"></span>Просто день</button>
      </div>
      <span class="small" style="color:var(--nmuted)">Можно выбрать несколько земель</span>
      ${chosen.filter((l) => l.patterns.length).map((l) => `<div class="col" style="gap:4px"><span style="font-size:13px;color:var(--gold)">${esc(landShort(l))}</span><div class="row" style="flex-wrap:wrap;gap:6px">${l.patterns.map((p) => `<button class="chip gold ${ui.pids.includes(p.id) ? 'on' : ''}" data-a="evePat" data-v="${p.id}" aria-pressed="${ui.pids.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div></div>`).join('')}
      ${chosen.some((l) => l.patterns.length) ? '<span class="small" style="color:var(--nmuted)">Отметь, что именно сделано. Если ничего не отмечено, в землю ляжет один стежок</span>' : ''}
    </div>
    <label class="col">Пара слов о дне (необязательно)<textarea class="field" rows="2" data-m="ui.note" placeholder="Что было важным сегодня?">${esc(ui.note)}</textarea></label>
    <button class="btn gold" data-a="eveningSave">Вплести в гобелен</button>
  </div>
  ${tabbar('camp', true)}
</div>`;
};

function eveningDone() {
  const n = ui.done.stitches;
  const pending = S.witch.pending;
  return `
<div class="scr tabbed night">
  <img class="hero-img" src="img/scene/rest_${S.hero}.webp" alt="" style="height:260px;object-position:center 74%">
  <div class="pad nt" style="text-align:center;align-items:center;justify-content:center">
    <span class="goth" style="font-size:30px;color:var(--moon)">${n ? `+${stitchW(n)}` : 'Привал вплетён'}</span>
    <p style="margin:0;font-size:17px;line-height:1.4;color:var(--lav)">${n ? 'Нить легла в гобелен. Отдыхай — огонь присмотрит за дорогой.' : 'Даже день без шагов — часть пути. Отдыхай.'}</p>
    ${pending ? `<button class="btn gold" data-a="go" data-to="visit">У костра тебя кто-то ждёт</button>` : ''}
    <button class="btn ${pending ? 'ghost' : 'gold'}" data-a="go" data-to="map">${n ? 'Посмотреть, как легли стежки' : 'К гобелену'}</button>
  </div>
  ${tabbar('camp', true)}
</div>`;
}

// ——— Странствующая ———
SCR.visit = () => {
  const v = S.witch.pending;
  if (!ui.done && !v) return SCR.map();
  if (v && v.type === 'safety') return SCR.safety();
  if (ui.done) {
    return `
<div class="scr night">
  <img class="hero-img" src="img/scene/witch_${S.hero}.webp" alt="" style="height:min(470px,52vh);object-position:center 58%">
  <div class="sheetup" style="background:var(--night);border-top:1px solid var(--gold);padding:22px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:14px">
    <p class="box" style="margin:0;font-size:15px;line-height:1.4">${ui.done === 'carry' ? 'Вопрос лёг в твою котомку. Он подождёт тебя у вечернего костра.' : 'Ответ сохранён в Летописи.'}</p>
    ${ui.cardNext ? `<p style="margin:0;font-size:16px;font-style:italic;color:var(--lav)">«Подожди, не уходи. У меня с собой колода».</p><button class="btn gold" data-a="go" data-to="card" data-src="visit">Вытянуть карту</button>` : `<button class="btn gold" data-a="go" data-to="map">Вернуться к гобелену</button>`}
  </div>
</div>`;
  }
  const echo = v.echo;
  return `
<div class="scr night">
  <img class="hero-img" src="img/scene/witch_${S.hero}.webp" alt="Седая Странствующая с посохом-веретеном стоит у костра напротив ${w('путницы', 'путника')}" style="height:min(380px,34vh);object-position:center 58%">
  <div class="sheetup" style="background:var(--night);border-top:1px solid var(--gold);padding:22px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:14px">
    <span class="goth" style="font-size:18px;color:var(--gold)">Странствующая у огня</span>
    <p style="margin:0;font-size:17px;font-style:italic;color:var(--lav)">${esc(v.line)}</p>
    ${echo ? `<p class="box" style="margin:0;font-size:15px;line-height:1.4">${fmtDay(echo.date)} на вопрос «${esc(echo.q)}» ты ${w('ответила', 'ответил')}: <i>«${esc(echo.answer)}»</i></p>` : ''}
    <h2 style="margin:0;font-weight:400;font-size:23px;line-height:1.25">${esc(v.q)}</h2>
    <label class="col" style="font-size:13px">Твой ответ (необязательно)<textarea class="field" rows="3" data-m="ui.ans" placeholder="Можно пару слов…">${esc(ui.ans || '')}</textarea></label>
    ${v.vow ? `<button class="chip gold ${ui.vow ? 'on' : ''}" data-a="toggle" data-k="vow" aria-pressed="${!!ui.vow}" style="align-self:flex-start;text-align:left;min-height:44px;border-radius:12px;padding:6px 12px;line-height:1.3">${ui.vow ? '✓ ' : ''}Малый обет на неделю: ${esc(v.vow)}</button>` : ''}
    <div class="row"><button class="btn gold" style="font-size:15px" data-a="visitWeave">Вплести ответ</button><button class="btn ghost" style="font-size:15px" data-a="visitCarry">Подумаю позже</button></div>
    <span class="small center" style="color:var(--nmuted)">«Подумаю позже» — вопрос подождёт тебя вечером у костра</span>
    <button class="link" data-a="go" data-to="map">Не сейчас</button>
  </div>
</div>`;
};

SCR.card = () => {
  if (!ui.card) {
    const dr = S.witch.cardDraft;
    if (dr && daysBetween(dr.date, today()) < 7) { ui.card = CARDS.find((c) => c.id === dr.id); ui.step = 1; }
    else { ui.card = drawCard(); ui.step = 0; }
  }
  const c = ui.card;
  const down = mood() === 'down';
  const greeting = down ? '«Не нужно никуда спешить. Вытяни карту — просто посмотрим».' : '«Ветер тебе в спину. Посмотрим, что приготовила дорога».';
  const q = cardQs(c);
  let body = '';
  if (ui.step === 0) {
    body = `<div class="col" style="flex:1;align-items:center;justify-content:center;gap:28px">
      <div class="cards3">${[-10, 0, 10].map((r, i) => `<button data-a="cardPick" aria-label="Вытянуть карту ${i + 1}" style="left:calc(50% - 75px + ${(i - 1) * 85}px);top:${i === 1 ? 10 : 32}px;transform:rotate(${r}deg)"><img src="img/card/back.webp" alt=""></button>`).join('')}</div>
      <p style="margin:0;font-size:18px;text-align:center">Вытяни одну. Не думай долго</p>
      <button class="link" data-a="go" data-to="${P.src === 'ask' ? 'journal' : 'map'}">Не сейчас</button></div>`;
  } else if (ui.step === 1) {
    body = `<div class="col" style="flex:1;align-items:center;gap:14px">
      <img class="cardimg" src="${cardImg(c)}" alt="Карта Колоды Пути" style="width:min(236px,60vw)">
      <label class="col" style="align-self:stretch;font-size:17px;color:#F1E9D8">Что ты видишь на карте?<textarea class="field" rows="2" data-m="ui.seen" placeholder="Первое, что приходит в голову…">${esc(ui.seen || '')}</textarea></label>
      <button class="btn gold mt-auto" data-a="cardReveal">Узнать имя карты</button></div>`;
  } else {
    body = `<div class="col" style="flex:1;gap:16px">
      <div class="row" style="align-items:flex-start;gap:14px"><img class="cardimg" src="${cardImg(c)}" alt="${esc(cardName(c))}" style="flex:0 0 140px;width:140px"><span class="goth" style="font-size:32px;line-height:1.05;padding-top:4px">${esc(cardName(c))}</span></div>
      <p style="margin:0;font-size:20px;line-height:1.3">${esc(q[0])}</p>
      <p style="margin:0;font-size:17px;line-height:1.35;color:var(--lav)">${esc(q[1])}</p>
      <textarea class="field" rows="3" data-m="ui.cans" placeholder="Можно ответить — или просто подумать">${esc(ui.cans || '')}</textarea>
      <div class="col mt-auto"><button class="btn gold" data-a="cardSave" data-v="weave">Вплести в Летопись</button><button class="btn ghost" data-a="cardSave" data-v="carry">Подумаю позже</button><span class="small center" style="color:var(--nmuted)">Карта сохранится в Летописи, а её вопрос подождёт тебя вечером у костра</span></div></div>`;
  }
  return `
<div class="scr night"><div class="pad">
  <div class="row"><div class="ava" role="img" aria-label="Странствующая"></div>
    <div class="col" style="gap:0"><span class="goth" style="font-size:20px;color:var(--gold)">Странствующая у огня</span><span style="font-size:15px;font-style:italic;color:var(--lav)">${greeting}</span></div></div>
  ${body}
</div></div>`;
};

// ——— Сокровищница ———
SCR.treasury = () => {
  const T = S.treasury;
  const td = today();
  if (ui.tag === undefined) ui.tag = 0;
  const wk = T.spends.filter((s) => daysBetween(s.date, td) < 7);
  const sum = (arr) => arr.reduce((a, s) => a + s.amount, 0);
  const wkSum = sum(wk);
  const shares = [0, 1, 2].map((t) => (wkSum ? Math.round((sum(wk.filter((s) => s.tag === t)) / wkSum) * 100) : 0));
  const hide = T.hideSums;
  const recent = T.spends.slice(-6).reverse();
  return `
<div class="scr tabbed tre">
  <img class="hero-img" src="img/scene/treasury.webp" alt="Пещера-сокровищница: сундуки с самоцветами, свечи" style="height:190px;object-position:center 66%">
  <div class="sheetup" style="background:var(--tre);padding:16px 20px 20px;display:flex;flex-direction:column;gap:12px">
    <div class="row" style="justify-content:space-between"><h1 style="line-height:1">Сокровищница</h1>
      <span class="row" style="gap:8px"><button class="link" style="padding:4px 0;font-size:14px" data-a="hideSums">${hide ? 'Показать суммы' : 'Скрыть суммы'}</button>${helpBtn('treasury')}</span></div>
    <p class="sub" style="margin-top:-6px">Накопления, траты и кошель</p>
    ${hint('treasury')}
    <button data-a="toggle" data-k="chestHelp" aria-expanded="${!!ui.chestHelp}" class="row" style="justify-content:space-between;background:none;border:none;padding:0;color:#E8C27A;text-align:left;min-height:32px"><span style="font-size:16px">Сундуки</span><span style="font-size:13px;color:#C9B49A">${ui.chestHelp ? 'скрыть' : 'что это?'} ${ui.chestHelp ? '▴' : '▾'}</span></button>
    ${ui.chestHelp ? `<p style="margin:0;font-size:14px;line-height:1.4;color:#D8C7AC">Сундук — это накопление на цель. «Положить» — отложить деньги сюда${T.wallet !== null ? ' (они уйдут из кошеля)' : ''}. «Взять» — достать обратно, например чтобы потратить на эту цель.</p>` : ''}
    <div class="col">
      ${T.chests.length ? T.chests.map((c) => {
        const goal = Number(c.goal) || 0;
        const pct = goal ? Math.min(100, Math.round((c.saved / goal) * 100)) : null;
        const val = hide ? (pct !== null ? pct + '%' : '•••') : (goal ? `${money(c.saved)} из ${money(goal)}` : money(c.saved));
        return `<button data-a="chestOpen" data-id="${c.id}" aria-expanded="${ui.chest === c.id}" style="display:flex;flex-direction:column;gap:3px;background:none;border:none;padding:4px 0;min-height:44px;text-align:left;color:inherit">
          <span class="row" style="justify-content:space-between;width:100%;font-size:15px"><span>${esc(c.name)} <span style="color:#C9B49A;font-size:13px">${ui.chest === c.id ? '▴' : '▾'}</span></span><span style="color:#E8C27A">${val}</span></span>
          <span class="prog" role="img" aria-label="${esc(c.name)}" style="display:block;width:100%"><span style="display:block;height:100%;width:${pct ?? (c.saved ? 100 : 0)}%;background:repeating-linear-gradient(90deg,#E8B04A 0 6px,#C98E2E 6px 8px)"></span></span></button>
          ${ui.chest === c.id ? `<div class="row"><input class="field grow" style="height:44px" inputmode="numeric" data-m="ui.chestAmt" placeholder="${cur()}" value="${esc(ui.chestAmt || '')}"><button class="btn amber" style="width:auto;min-height:44px;font-size:15px" data-a="chestMove" data-v="1">Положить</button><button class="btn ghost" style="width:auto;min-height:44px;font-size:15px" data-a="chestMove" data-v="-1">Взять</button></div>` : ''}`;
      }).join('') : '<p class="sub">Сундуков пока нет. Их можно завести в Котомке.</p>'}
    </div>
    ${(() => {
      const ym = today().slice(0, 7);
      const envs = T.envelopes || [];
      return `<button data-a="toggle" data-k="envHelp" aria-expanded="${!!ui.envHelp}" class="row" style="justify-content:space-between;background:none;border:none;padding:0;color:#E8C27A;text-align:left;min-height:32px;border-top:1px solid #4A3626;padding-top:10px"><span style="font-size:16px">Конверты на месяц</span><span style="font-size:13px;color:#C9B49A">${ui.envHelp ? 'скрыть ▴' : 'что это? ▾'}</span></button>
      ${ui.envHelp ? `<p style="margin:0;font-size:14px;line-height:1.4;color:#D8C7AC">Конверт — сколько ты разрешаешь себе потратить на что-то за месяц: кафе, такси, одежду. Записывая трату, выбери конверт — и увидишь, сколько в нём осталось. Первого числа каждый конверт наполняется заново.</p>` : ''}
      ${envs.map((e) => {
        const spent = T.spends.filter((x) => x.envId === e.id && x.date.slice(0, 7) === ym).reduce((a, x) => a + x.amount, 0);
        const left = e.limit - spent;
        const pct = e.limit ? Math.min(100, Math.round((spent / e.limit) * 100)) : 0;
        const over = left < 0;
        return `<div class="col" style="gap:3px">
          <div class="row" style="justify-content:space-between;font-size:15px"><span>${esc(e.name)}</span><span class="row" style="gap:2px"><span style="color:${over ? '#F0A07A' : '#E8C27A'}">${hide ? pct + '%' : over ? `сверх на ${money(-left)}` : `осталось ${money(left)}`}</span>${ui.envEdit ? `<button data-a="envDel" data-id="${e.id}" aria-label="Убрать конверт" style="width:30px;height:30px;border:none;background:none;color:#C9B49A">${I.x}</button>` : ''}</span></div>
          <span class="prog" style="display:block"><span style="display:block;height:100%;width:${pct}%;background:${over ? '#C0603A' : 'repeating-linear-gradient(90deg,#A88C6A 0 6px,#8A7050 6px 8px)'}"></span></span>
          <span style="font-size:12px;color:#C9B49A">${hide ? '' : `потрачено ${money(spent)} из ${money(e.limit)}`}</span></div>`;
      }).join('')}
      ${ui.envAdd ? `<div class="row"><input class="field grow" style="height:42px" data-m="ui.envName" value="${esc(ui.envName || '')}" placeholder="на что: кафе"><input class="field" style="height:42px;width:110px" inputmode="decimal" data-m="ui.envLimit" value="${esc(ui.envLimit || '')}" placeholder="в месяц"></div>
        <div class="row"><button class="btn amber" style="min-height:42px;font-size:15px" data-a="envAdd">Завести конверт</button><button class="btn ghost" style="min-height:42px;font-size:15px;width:auto" data-a="toggle" data-k="envAdd">Отмена</button></div>`
      : `<div class="row" style="gap:14px"><button class="link" style="padding:2px 0;font-size:14px" data-a="toggle" data-k="envAdd">+ Новый конверт</button>${envs.length ? `<button class="link" style="padding:2px 0;font-size:14px" data-a="toggle" data-k="envEdit">${ui.envEdit ? 'готово' : 'изменить'}</button>` : ''}</div>`}`;
    })()}
    ${T.wallet !== null ? `<div class="row ${ui.flash === 'wallet' ? 'flash' : ''}" style="justify-content:space-between;font-size:15px;padding:6px 8px;margin:0 -8px;border-radius:8px"><span>В кошеле${ui.flash === 'wallet' ? ' · запомнено' : ''}</span><span style="color:#E8C27A">${hide ? '•••' : money(T.wallet)}</span></div>` : ''}
    <div class="col" style="gap:8px;border-top:1px solid #4A3626;padding-top:10px">
      <span class="lbl">Новая трата</span>
      <div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px">
        <input class="field" style="height:44px" inputmode="decimal" aria-label="Сумма" data-m="ui.amt" value="${esc(ui.amt || '')}" placeholder="${cur()}">
        <input class="field" style="height:44px" aria-label="На что" data-m="ui.what" value="${esc(ui.what || '')}" placeholder="на что (необязательно)"></div>
      <div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${TAGS.map((t, i) => `<button class="tile ${ui.tag === i ? 'on' : ''}" style="min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px" data-a="set" data-k="tag" data-v="${i}" aria-pressed="${ui.tag === i}"><span style="font-size:15px;font-weight:700">${t[0]}</span><span style="font-size:12px;opacity:.85">${t[1]}</span></button>`).join('')}</div>
      ${(T.envelopes || []).length ? `<div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><span style="font-size:13px;color:#C9B49A">из конверта:</span>${T.envelopes.map((e) => `<button class="chip ${ui.env === e.id ? 'on' : ''}" style="min-height:34px;font-size:13px;border-color:#5C4632;${ui.env === e.id ? 'background:#E8B04A;color:#2A1D12;border-color:#E8B04A' : ''}" data-a="pickEnv" data-v="${e.id}">${esc(e.name)}</button>`).join('')}</div>` : ''}
      <button class="btn amber" style="min-height:46px" data-a="spendAdd">Записать трату</button>
    </div>
    <div class="box col" style="gap:8px;padding:10px 12px">
      ${ui.checking ? `<label class="row" style="font-size:14px;color:#D8C7AC">${T.wallet === null ? 'Сколько сейчас в кошеле?' : 'Сколько в кошеле на самом деле?'}<input class="field grow" style="height:40px" inputmode="decimal" data-m="ui.real" placeholder="${cur()}"></label>
        <span style="font-size:14px;line-height:1.3">${T.wallet === null ? 'Сумма запомнится, и дальше траты будут вычитаться из неё.' : 'Разница уйдёт в «Рассыпано по дороге» с пометкой «не помню на что». Без упрёков.'}</span>
        <div class="row"><button class="btn amber" style="min-height:42px;font-size:15px" data-a="walletCheck">Сверить</button><button class="btn ghost" style="min-height:42px;font-size:15px" data-a="toggle" data-k="checking">Отмена</button></div>`
      : `<div class="row" style="justify-content:space-between"><span style="font-size:14px;line-height:1.3;color:#D8C7AC">${T.wallet === null ? 'Хочешь, чтобы приложение помнило, сколько в кошеле?' : 'Монет меньше, чем помнишь? Не помнишь, на что ушли?'}</span><button class="btn ghost" style="width:auto;min-height:40px;font-size:14px" data-a="toggle" data-k="checking">Сверить кошель</button></div>
        ${T.wallet !== null ? `${ui.income ? `<div class="row"><input class="field grow" style="height:40px" inputmode="decimal" data-m="ui.inc" placeholder="${cur()}"><button class="btn amber" style="width:auto;min-height:40px;font-size:14px" data-a="incomeAdd">Положить в кошель</button></div>` : `<button class="link" style="align-self:flex-start;padding:2px 0;font-size:14px" data-a="toggle" data-k="income">+ Пришли монеты</button>`}` : ''}`}
    </div>
    <div class="box col" style="gap:8px;padding:10px 12px">
      <button data-a="toggle" data-k="regOpen" class="row" style="justify-content:space-between;background:none;border:none;padding:0;color:inherit;text-align:left;min-height:32px"><span class="col" style="gap:0"><span style="font-size:15px;font-weight:700">Постоянные траты${T.regular.length ? ` · ${T.regular.length}` : ''}</span><span style="font-size:13px;color:#C9B49A">аренда, связь, подписки — запишутся сами как провизия</span></span><span style="font-size:20px">${ui.regOpen ? '−' : '+'}</span></button>
      ${ui.regOpen ? `${T.regular.map((r) => `<div class="row" style="font-size:14px;justify-content:space-between"><span class="grow">${esc(r.name)} · ${r.day} числа</span><span>${hide ? '•••' : money(r.amount)}</span><button data-a="regDel" data-id="${r.id}" aria-label="Убрать постоянную трату" style="width:32px;height:32px;border:none;background:none;color:#C9B49A">${I.x}</button></div>`).join('')}
        <input class="field" style="height:42px" data-m="ui.regName" value="${esc(ui.regName || '')}" placeholder="Что это, например: аренда">
        <div class="row"><input class="field grow" style="height:42px" inputmode="decimal" data-m="ui.regAmt" value="${esc(ui.regAmt || '')}" placeholder="сумма, ${cur()}"><input class="field" style="height:42px;width:110px" inputmode="numeric" data-m="ui.regDay" value="${esc(ui.regDay || '')}" placeholder="число"></div>
        <button class="btn amber" style="min-height:42px;font-size:15px" data-a="regAdd">Добавить постоянную трату</button>
        <span style="font-size:13px;color:#C9B49A">Первая запись появится в ближайшее указанное число. То, что уже оплачено в этом месяце, не задвоится.</span>` : ''}
    </div>
    ${wkSum ? `<div class="col" style="gap:5px"><span style="font-size:14px;color:#E8C27A">Куда ушло золото за неделю${hide ? '' : ` · ${money(wkSum)}`}</span>
      <div role="img" aria-label="Снаряжение ${shares[0]} процентов, провизия ${shares[1]}, рассыпано ${shares[2]}" style="display:flex;height:12px;border-radius:3px;overflow:hidden;gap:2px">
        ${shares[0] ? `<div style="flex:${shares[0]} 1 0;background:#E8B04A"></div>` : ''}${shares[1] ? `<div style="flex:${shares[1]} 1 0;background:#A88C6A"></div>` : ''}${shares[2] ? `<div style="flex:${shares[2]} 1 0;background:#6B5A4C"></div>` : ''}</div>
      <div class="row" style="justify-content:space-between;font-size:13px;color:#D8C7AC"><span>Снаряжение ${shares[0]}%</span><span>Провизия ${shares[1]}%</span><span>Рассыпано ${shares[2]}%</span></div></div>` : ''}
    ${recent.length ? `<div class="col" style="gap:4px"><span style="font-size:14px;color:#E8C27A">Последние траты</span>
      ${recent.map((s) => `<div class="row" style="font-size:14px;justify-content:space-between"><span class="grow">${fmtShort(s.date)} · ${esc(s.note || TAGS[s.tag][0])}</span><span>${hide ? '•••' : money(s.amount)}</span><button data-a="spendDel" data-id="${s.id}" aria-label="Удалить трату" style="width:32px;height:32px;border:none;background:none;color:#C9B49A">${I.x}</button></div>`).join('')}</div>` : ''}
  </div>
  ${tabbar('treasury')}
</div>`;
};

// ——— Книга заклинаний ———
const UNIT_FORMS = { 'минут': ['минута', 'минуты', 'минут'], 'страниц': ['страница', 'страницы', 'страниц'], 'шагов': ['шаг', 'шага', 'шагов'], 'стаканов': ['стакан', 'стакана', 'стаканов'], 'раз': ['раз', 'раза', 'раз'] };
const unitW = (n, u) => { const f = UNIT_FORMS[u]; if (!f || !Number.isInteger(Number(n))) return u || ''; return plural(Number(n), f[0], f[1], f[2]); };
const qty = (n, u) => `${n} ${unitW(n, u)}`.trim();
const spellPart = (v) => (v.amount ? `${v.what} · ${qty(v.amount, v.unit)}` : v.what);
SCR.spells = () => {
  const td = today();
  const castToday = S.spells.filter((sp) => sp.casts.some((c) => c.date === td)).length;
  const lands = activeLands();
  const unitChips = (key) => `<div class="row" style="flex-wrap:wrap;gap:4px">${UNITS.map((u) => `<button class="chip ${ui[key] === u ? 'on' : ''}" style="min-height:32px;font-size:13px;padding:0 10px" data-a="setUnit" data-k="${key}" data-v="${u}">${u}</button>`).join('')}</div>`;
  return `
<div class="scr tabbed paper"><div class="pad">
  <div class="row" style="justify-content:space-between;align-items:flex-start">
    <div class="col" style="gap:4px"><h1>Книга заклинаний</h1><p class="sub" style="font-size:14px">${S.spells.length ? `Сегодня прочитано ${castToday} из ${S.spells.length}. Малое — на трудный день, великое — на хороший, засчитываются оба.` : 'Маленькие привычки, которые питают твои земли.'}</p></div>${helpBtn('spells')}</div>
  ${hint('spells')}
  <div class="col" style="gap:10px">
  ${S.spells.map((sp) => {
    const todays = sp.casts.filter((x) => x.date === td);
    const c = todays[todays.length - 1];
    const st = spellStats(sp);
    const l = sp.landId ? landOf(sp.landId) : null;
    const month = sp.casts.filter((x) => daysBetween(x.date, td) < 30);
    const sums = {};
    for (const x of month) { const v = sp[x.kind]; if (x.amount && v.unit) sums[v.unit] = (sums[v.unit] || 0) + Number(x.amount); }
    const sumTxt = Object.entries(sums).map(([u, n]) => qty(Math.round(n * 10) / 10, u)).join(' · ');
    const casting = ui.casting && ui.casting.id === sp.id;
    const b = (kind, label) => `<button data-a="castOpen" data-id="${sp.id}" data-v="${kind}" style="flex:1 1 0;min-height:56px;padding:6px 10px;border-radius:10px;font-size:14px;text-align:left;display:flex;flex-direction:column;gap:2px;${casting && ui.casting.kind === kind ? 'background:#F7EBCB;border:1px solid #C9A24A' : 'background:transparent;border:1px solid #CBB99B'}"><span style="font-size:11px;opacity:.85">${label}</span>${esc(spellPart(sp[kind]))}</button>`;
    return `<div class="box col ${ui.flash === sp.id ? 'flash' : ''}" style="gap:10px;${c ? 'border-color:#C9A24A;background:#FBF3DE' : ''}">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <span class="row" style="gap:8px">${l ? emblemHtml(l, 28) : ''}<span class="col" style="gap:0"><span style="font-size:17px;font-weight:700">${esc(sp.name)}</span>${l ? `<span style="font-size:12px;color:var(--muted)">питает землю «${esc(landShort(l))}»</span>` : ''}</span></span>
        <span class="row" style="gap:4px"><span style="font-size:12px;color:var(--muted);text-align:right">${st.total ? `${st.total} ${plural(st.total, 'раз', 'раза', 'раз')} · возвращений: ${st.returns}` : 'ещё не звучало'}</span>
        ${ui.edit ? `<button data-a="spellDel" data-id="${sp.id}" aria-label="Удалить заклинание ${esc(sp.name)}" style="width:32px;height:32px;border:none;background:none;color:var(--muted)">${I.x}</button>` : ''}</span></div>
      ${c ? `<div class="row" style="justify-content:space-between;font-size:14px;color:#6B4A12"><span>✦ Сегодня${todays.length > 1 ? ' ×' + todays.length : ''}: ${todays.map((x) => (x.kind === 'great' ? 'великое' : 'малое') + (x.amount ? ` ${qty(x.amount, sp[x.kind].unit)}` : '')).join(', ')}</span><button class="link" style="padding:0;font-size:13px" data-a="castUndo" data-id="${sp.id}">отменить последнее</button></div>` : ''}
      <div class="row" style="gap:8px">${b('small', c ? 'ещё малое' : 'малое')}${b('great', c ? 'ещё великое' : 'великое')}</div>
      ${casting ? `<div class="col" style="gap:8px"><label class="row" style="font-size:15px">Сколько сегодня?<input id="castAmt" class="field grow" style="height:44px" inputmode="decimal" data-m="ui.castAmt" value="${esc(ui.castAmt ?? '')}" placeholder="можно не писать"><span>${esc(sp[ui.casting.kind].unit || '')}</span></label>
        <div class="row"><button class="btn" style="min-height:46px" data-a="castDo">Прочитать заклинание</button><button class="btn ghost" style="min-height:46px;width:auto" data-a="castCancel">Отмена</button></div></div>` : ''}
      ${sumTxt ? `<span style="font-size:13px;color:var(--muted)">За 30 дней: ${sumTxt}</span>` : ''}
    </div>`;
  }).join('')}
  </div>
  ${ui.adding ? `<div class="box col">
      <div class="row" style="flex-wrap:wrap;gap:6px">${SPELL_SEEDS.filter((x) => !S.spells.some((y) => y.name === x.name)).map((x) => `<button class="chip add" data-a="spellSeed" data-i="${SPELL_SEEDS.indexOf(x)}">+ ${x.name}</button>`).join('')}</div>
      <label class="col">Название заклинания<input id="spName" class="field" data-m="ui.spName" value="${esc(ui.spName || '')}" placeholder="Например: Движение"></label>
      <div class="col" style="gap:6px"><span class="lbl">Малое — на трудный день</span>
        <input class="field" data-m="ui.sW" value="${esc(ui.sW || '')}" placeholder="что делаю: растяжка">
        <input class="field" inputmode="decimal" data-m="ui.sA" value="${esc(ui.sA || '')}" placeholder="сколько обычно: 2">${unitChips('sU')}</div>
      <div class="col" style="gap:6px"><span class="lbl">Великое — на хороший день</span>
        <input class="field" data-m="ui.gW" value="${esc(ui.gW || '')}" placeholder="что делаю: тренировка">
        <input class="field" inputmode="decimal" data-m="ui.gA" value="${esc(ui.gA || '')}" placeholder="сколько обычно: 40">${unitChips('gU')}</div>
      <div class="col" style="gap:6px"><span class="lbl">Какую землю питает</span>
        <div class="row" style="flex-wrap:wrap;gap:6px">${lands.map((l) => `<button class="chip ${ui.spLand === l.id ? 'on' : ''}" data-a="setS" data-k="spLand" data-v="${l.id}">${esc(landShort(l))}</button>`).join('')}<button class="chip ${!ui.spLand ? 'on' : ''}" data-a="setS" data-k="spLand" data-v="">никакую</button></div>
        <span style="font-size:13px;color:var(--muted)">Каждое прочтение вплетёт в эту землю стежок: малое — 1, великое — 2.</span></div>
      <div class="row"><button class="btn" style="min-height:46px" data-a="spellAdd">Вписать в книгу</button><button class="btn ghost" style="min-height:46px" data-a="toggle" data-k="adding">Отмена</button></div></div>`
    : `<button class="btn dash" data-a="toggle" data-k="adding" data-focus="spName">+ Новое заклинание</button>`}
  ${S.spells.length ? `<button class="link" data-a="toggle" data-k="edit">${ui.edit ? 'Готово' : 'Изменить книгу'}</button>` : ''}
</div>${tabbar('spells')}</div>`;
};

// ——— Летопись ———
function journalItems() {
  const items = {}; // date -> []
  const push = (d, it) => (items[d] ||= []).push(it);
  for (const [k, d] of Object.entries(S.days)) {
    if (d.morning) {
      const pat = S.lands.flatMap((l) => l.patterns).find((p) => p.id === d.morning.patternId);
      const parts = [d.morning.word ? `Слово дня — «${d.morning.word}».` : `${w('Проснулась', 'Проснулся')}: ${WAKES[d.morning.wake].toLowerCase()}.`];
      if (pat) parts.push(`Узор: ${pat.name}.`);
      push(k, { t: 'morning', ord: 1, text: parts.join(' ') });
    }
    if (d.evening) push(k, { t: 'evening', ord: 4, text: `Силы: ${energyName(d.evening.energy).toLowerCase()}. Небо: ${SKIES[d.evening.sky].toLowerCase()}.`, quote: d.evening.note });
  }
  const byDayLand = {};
  for (const s of S.steps) {
    const key = s.date + '|' + s.landId + '|' + s.name;
    if (byDayLand[key]) { byDayLand[key].n += s.stitches; byDayLand[key].c++; continue; }
    const l = landOf(s.landId);
    byDayLand[key] = { date: s.date, land: l ? landShort(l) : 'Земля', name: s.name, n: s.stitches, c: 1 };
  }
  for (const v of Object.values(byDayLand)) push(v.date, { t: 'step', ord: 2, text: `${v.land} · ${v.name}${v.c > 1 ? ' ×' + v.c : ''} · +${stitchW(v.n)}` });
  for (const j of S.journal) {
    if (j.kind === 'witch') push(j.date, { t: 'witch', ord: 3, text: j.q, quote: j.answer ? `«${j.answer}»` : j.carried ? 'унесено с собой' : '', vow: j.vow });
    if (j.kind === 'card') { const c = CARDS.find((x) => x.id === j.cardId); push(j.date, { t: 'card', ord: 3, text: `Карта «${c ? cardName(c) : ''}»${j.seen ? ` — ${w('увидела', 'увидел')}: ${j.seen}` : ''}`, quote: j.answer ? `«${j.answer}»` : '', img: c ? cardImg(c) : null }); }
    if (j.kind === 'note') push(j.date, { t: 'note', ord: 5, text: j.text });
    if (j.kind === 'thread') push(j.date, { t: 'thread', ord: 3, text: `Нить «${j.name || 'без имени'}»`, quote: j.fact });
    if (j.kind === 'chapter') push(j.date, { t: 'chapter', ord: 0, text: `Глава ${j.n} «${j.name || 'без имени'}» завершена` });
    if (j.kind === 'land') push(j.date, { t: 'land', ord: 2, text: j.text });
  }
  return items;
}
const KINDS = {
  morning: ['Утро', '#9A4A2A', 2], step: ['Шаг', '#4E5A2A', 2], witch: ['Странствующая', '#7A5A12', 1], card: ['Карта', '#7A5A12', 1],
  evening: ['Привал', '#3A4270', 2], note: ['Запись', '#6E5545', 3], thread: ['Нить', '#B8862E', 1], chapter: ['Глава', '#7A5A12', 1], land: ['Земля', '#4E5A2A', 2]
};

SCR.journal = () => {
  const td = today();
  if (ui.filter === undefined) ui.filter = 0;
  const items = journalItems();
  const woven = S.threads.list.filter((t) => t.status === 'woven');
  const threadDays = new Set(woven.flatMap((t) => t.dates));
  const newThread = detectThreads()[0];
  const dates = Object.keys(items).sort().reverse().slice(0, 90);
  const title = (k) => (k === td ? `Сегодня, ${fmtDay(k)}` : k === addDays(td, -1) ? `Вчера, ${fmtDay(k)}` : fmtDay(k));
  const wall = S.wall;
  const filters = ['Всё', 'Странствующая', 'Шаги', 'Записи'];
  return `
<div class="scr tabbed paper"><div class="pad" style="padding-bottom:90px">
  <div class="row" style="justify-content:space-between;align-items:flex-start"><div class="col" style="gap:2px"><h1>Летопись странствий</h1><span class="sub">Всё, что ты ${w('оставила', 'оставил')} на пути</span></div>${helpBtn('journal')}</div>
  ${hint('journal')}
  ${newThread ? `<button data-a="go" data-to="thread" data-key="${newThread.key}" class="goldbox row" style="text-align:left;color:inherit">${I.thread}<span class="grow" style="font-size:15px;line-height:1.3">Кажется, появилась одна повторяющаяся нить. Хочешь на неё посмотреть?</span>${I.chev}</button>` : ''}
  ${S.witch.cardDraft ? `<button class="goldbox row" data-a="go" data-to="card" data-src="ask" style="text-align:left;color:inherit"><img src="img/card/back.webp" alt="" style="width:34px;height:55px;border-radius:4px"><span class="grow col" style="gap:0"><span style="font-size:16px;font-weight:700">Твоя карта ждёт</span><span class="small">${w('ты её вытянула', 'ты её вытянул')}, но ещё не ${w('ответила', 'ответил')}</span></span>${I.chev}</button>` : canAskCard() ? `<button class="box row" data-a="go" data-to="card" data-src="ask" style="text-align:left;color:inherit"><img src="img/card/back.webp" alt="" style="width:34px;height:55px;border-radius:4px"><span class="grow col" style="gap:0"><span style="font-size:16px;font-weight:700">Вытянуть карту</span><span class="small">одна карта в неделю</span></span>${I.chev}</button>`
    : `<span class="small" style="color:var(--muted)">Следующую карту можно вытянуть с ${fmtDay(nextCardDay())}</span>`}
  ${S.witch.pending ? `<button class="box row" data-a="go" data-to="visit" style="text-align:left;color:inherit"><div class="ava" role="img" aria-label=""></div><span class="grow" style="font-size:16px">Странствующая ждёт тебя у костра</span>${I.chev}</button>`
    : S.settings.witchFreq !== 'call' || S.witch.lastVisit === today() ? '' : `<button class="box row" data-a="callWitch" style="text-align:left;color:inherit"><div class="ava" role="img" aria-label=""></div><span class="grow col" style="gap:0"><span style="font-size:16px;font-weight:700">Позвать Странствующую</span><span class="small">она задаст один вопрос</span></span>${I.chev}</button>`}
  ${wall.length ? `<div class="col" style="gap:6px"><span class="lbl">Стена Летописи</span><div class="row" style="flex-wrap:wrap;gap:12px">${wall.map((x) => `<span class="col" style="align-items:center;gap:2px;font-size:12px;width:72px;text-align:center">${emblemHtml(x, 56, 'box-shadow:0 0 0 3px #E9C77B')}${esc(x.customName || landDef(x.id)?.short || '')}</span>`).join('')}</div></div>` : ''}
  <div role="group" aria-label="Что показывать" class="row" style="flex-wrap:wrap;gap:6px">${filters.map((f, i) => `<button class="chip ${ui.filter === i ? 'on' : ''}" style="min-height:36px" data-a="set" data-k="filter" data-v="${i}" aria-pressed="${ui.filter === i}">${f}</button>`).join('')}</div>
  ${ui.writing ? `<div class="box col"><textarea id="noteTa" class="field" rows="4" data-m="ui.noteText" placeholder="Что хочется оставить в летописи?">${esc(ui.noteText || '')}</textarea>
    <div class="row"><button class="btn" style="min-height:46px" data-a="noteSave">Вплести</button><button class="btn ghost" style="min-height:46px" data-a="toggle" data-k="writing">Отмена</button></div></div>` : ''}
  <div class="col" style="gap:14px">
  ${dates.length ? dates.map((k) => {
    const its = items[k].filter((it) => ui.filter === 0 || KINDS[it.t][2] === ui.filter).sort((a, b) => a.ord - b.ord);
    if (!its.length) return '';
    return `<section class="col"><h2 class="dayh">${title(k)}</h2>
    ${its.map((it) => {
      const inT = threadDays.has(k) && (it.t === 'step' || it.t === 'evening');
      const cls = ['witch', 'card', 'chapter'].includes(it.t) ? 'w' : inT || it.t === 'thread' ? 't' : '';
      return `<div class="row" style="align-items:stretch;gap:8px"><span aria-hidden="true" class="list-rail ${inT ? 'on' : ''}">${inT ? '<span class="dot"></span>' : ''}</span>
        <div class="entry ${cls}"><span style="font-size:12px;letter-spacing:.5px;color:${KINDS[it.t][1]}">${KINDS[it.t][0]}</span>
        <div class="row" style="align-items:flex-start">${it.img ? `<img src="${it.img}" alt="" style="width:40px;border-radius:4px;aspect-ratio:480/780">` : ''}<span style="font-size:15px;line-height:1.35">${esc(it.text)}</span></div>
        ${it.quote ? `<span style="font-size:15px;line-height:1.35;font-style:italic;color:#6B4A12">${esc(it.quote)}</span>` : ''}
        ${it.vow ? `<span class="small">Обет: ${esc(it.vow)}</span>` : ''}</div></div>`;
    }).join('')}</section>`;
  }).join('') : `<p class="sub">Летопись пока пустая. Первая запись появится после вечернего привала.</p>`}
  </div>
</div>
${ui.writing ? '' : `<button class="fab" data-a="toggle" data-k="writing" data-focus="noteTa">${I.pen} Записать</button>`}
${tabbar('journal')}</div>`;
};

SCR.thread = () => {
  const t = detectThreads().find((x) => x.key === P.key) || S.threads.list.find((x) => x.key === P.key);
  if (!t) return SCR.journal();
  if (ui.done) {
    return `<div class="scr paper"><div class="pad"><div class="topbar">${backBtn('journal', 'Назад к Летописи')}</div>
      <p class="box" role="status" style="margin:0;font-size:16px;line-height:1.4">${ui.done === 'no' ? 'Хорошо. Эта нить больше не будет всплывать. Её можно вернуть в Котомке, в разделе «Нити наблюдений».' : 'Нить вплетена. Она будет тихо светиться на полях Летописи там, где проходит.'}</p>
      <button class="btn" data-a="go" data-to="journal">Вернуться в Летопись</button></div></div>`;
  }
  const entries = t.dates.map((d) => {
    const st = S.steps.filter((s) => s.date === d);
    const ev = S.days[d]?.evening;
    return { date: fmtShort(d), what: st.length ? st.map((s) => `${landShort(landOf(s.landId) || { id: s.landId })} · ${s.name}`).filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'день без шагов', sky: ev ? `${SKIES[ev.sky].toLowerCase()}, ${energyName(ev.energy).toLowerCase()}` : '' };
  });
  return `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('journal', 'Назад к Летописи')}<p style="margin:0;font-size:15px;font-style:italic;line-height:1.3;color:#6B4A12">«Кажется, в твоём путешествии появилась одна повторяющаяся нить».</p></div>
  <h1>${esc(t.name || 'Нить без имени')}</h1>
  <div class="goldbox" style="font-size:16px;line-height:1.4">${esc(threadFact(t))}</div>
  <div class="col" style="gap:4px"><span class="step">Записи, через которые она проходит</span>
    <ul style="margin:0;padding:0 0 0 14px;list-style:none;border-left:2px solid #C9A24A;display:flex;flex-direction:column;gap:6px">
    ${entries.map((e) => `<li class="row" style="justify-content:space-between;font-size:15px;line-height:1.3;align-items:flex-start"><span><span style="color:var(--rust)">${e.date}</span> · ${esc(e.what)}</span><span style="white-space:nowrap;color:var(--muted)">${e.sky}</span></li>`).join('')}
    </ul></div>
  <div class="col" style="gap:6px;font-size:17px;line-height:1.3"><span>Что ты замечаешь, глядя на эти записи?</span><span style="color:var(--muted)">Похоже ли это на тебя? Хочешь что-то с этим сделать — или просто знать?</span></div>
  ${t.status ? `<p class="sub">Нить ${t.status === 'woven' ? 'вплетена' : 'отложена'} ${fmtDay(t.date)}.</p>
    ${t.status !== 'woven' ? `<button class="btn" data-a="threadDecide" data-v="woven" data-key="${t.key}">Всё-таки вплести</button>` : ''}`
  : `<div class="col mt-auto" style="gap:10px">
    <label class="col">Как ты назовёшь эту нить?<input class="field" data-m="ui.tname" value="${esc(ui.tname || '')}" placeholder="Своими словами — или оставь пустым"></label>
    <button class="btn" data-a="threadDecide" data-v="woven" data-key="${t.key}">Вплести нить в Летопись</button>
    <button class="btn ghost" data-a="threadDecide" data-v="no" data-key="${t.key}">Это не про меня</button></div>`}
</div></div>`;
};

SCR.chapter = () => {
  const ch = chapterDue();
  if (!ch) return SCR.map();
  if (!ui.spread) { const a = drawCard(); const b = drawCard([a.id]); const c = drawCard([a.id, b.id]); ui.spread = [a, b, c]; }
  const st = rangeStats(ch.from, ch.to);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][ch.n - 1] || ch.n;
  const stats = [[st.evs, plural(st.evs, 'привал у костра', 'привала у костра', 'привалов у костра')], [st.stitches, `${plural(st.stitches, 'стежок', 'стежка', 'стежков')} на ${st.lands} ${plural(st.lands, 'земле', 'землях', 'землях')}`], [st.returns, plural(st.returns, 'возвращение после паузы', 'возвращения после пауз', 'возвращений после пауз')], [st.threads, plural(st.threads, 'вплетённая нить', 'вплетённые нити', 'вплетённых нитей')]];
  const slots = ['Что пройдено', 'Что сейчас', 'Куда иду'];
  return `
<div class="scr night"><div class="pad">
  <div class="topbar">${backBtn('map')}<span></span></div>
  <div class="col center" style="gap:2px"><span style="font-size:15px;color:var(--gold)">Глава ${roman} · ${fmtDay(ch.from)} — ${fmtDay(ch.to)}</span><h1 style="font-size:34px">Глава завершена</h1></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${stats.map((s) => `<div class="box col" style="gap:0;padding:10px 12px"><span style="font-size:24px;font-weight:700;color:var(--moon)">${s[0]}</span><span style="font-size:14px;color:#C9C3D6">${s[1]}</span></div>`).join('')}</div>
  <div class="col"><span style="font-size:16px">Расклад главы</span>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">${ui.spread.map((c, i) => `<figure style="margin:0;display:flex;flex-direction:column;gap:4px;text-align:center"><img class="cardimg" src="${cardImg(c)}" alt="${esc(cardName(c))}" style="width:100%;border-radius:8px"><figcaption class="col" style="gap:0"><span style="font-size:12px;color:var(--gold)">${slots[i]}</span><span style="font-size:14px">${esc(cardName(c))}</span></figcaption></figure>`).join('')}</div>
    <p class="sub" style="font-size:14px">Что эта глава тебе дала? Где ты стоишь на карте? Что возьмёшь в следующую главу?</p></div>
  <label class="col mt-auto" style="color:#F1E9D8">Как ты назовёшь эту главу?<input class="field" data-m="ui.cname" value="${esc(ui.cname || '')}" placeholder="Например: «Глава, где я перестала спешить»"></label>
  <button class="btn gold" data-a="chapterSave">Вышить обложку главы</button>
</div></div>`;
};

// ——— Котомка ———
SCR.settings = () => {
  const rows = [
    ['Путеводитель', 'Как всё устроено: земли, привалы, сокровищница, заклинания', 'guide'],
    ['Странствующая', { auto: 'Приходит, когда это нужно', rare: 'Приходит редко', call: 'Приходит, только когда позовёшь' }[S.settings.witchFreq || 'auto'], 'witchset'],
    ['Напоминания', 'Утренние сборы и привал в Календаре', 'reminders'],
    ['Герой и имя', `${S.hero === 'm' ? 'Странник' : 'Странница'}${S.name ? ' · ' + esc(S.name) : ''}`, 'heroEdit'],
    ['Мои земли', 'Сменить, усыпить, добавить свою', 'landsEdit'],
    ['Узоры земель', 'Выбрать землю и поменять её узоры', 'weavePick'],
    ['Сокровищница', 'Сундуки и режим учёта', 'tsetupEdit'],
    ['Нити наблюдений', `${S.threads.list.filter((t) => t.status === 'woven').length} вплетено · ${S.threads.list.filter((t) => t.status !== 'woven').length} отложено`, 'threads'],
    ['Резервные копии', S.settings.lastBackup ? `Последняя копия: ${fmtDay(S.settings.lastBackup)}` : 'Копий ещё не было', 'backup']
  ];
  return `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('map', 'Назад к карте')}<h1>Котомка</h1></div>
  <p class="sub">Всё, что можно переложить по-своему.</p>
  <div class="col">${rows.map((r) => `<button data-a="go" data-to="${r[2]}" class="row" style="min-height:58px;padding:8px 14px;border-radius:12px;background:var(--card);border:1px solid var(--line2);text-align:left;color:inherit">
    <span class="col grow" style="gap:1px"><span style="font-size:17px;font-weight:700">${r[0]}</span><span style="font-size:14px;color:var(--muted)">${r[1]}</span></span>${I.chev}</button>`).join('')}</div>
  <button data-a="go" data-to="safety" class="row mt-auto" style="min-height:58px;padding:8px 14px;border-radius:12px;background:var(--night2);color:#F1E9D8;border:none;text-align:left">${I.heart}
    <span class="col grow" style="gap:0"><span style="font-size:17px;font-weight:700">Если тяжело</span><span style="font-size:14px;color:#C9C3D6">Близкие люди и помощь, всегда под рукой</span></span></button>
  <p class="small center" style="margin:0;color:var(--muted)">Шрифты: Gatchina — Dimitri Antonov / Blue Curve Designstudio (CC BY 4.0), Brahms Gotisch — Sasha Pavljenko.</p>
</div></div>`;
};

SCR.witchset = () => {
  const opts = [['auto', 'Как сама решит', 'Приходит, когда это нужно.'],
    ['rare', 'Редко', 'Не чаще раза в две недели и только с важным.'],
    ['call', 'Только когда позову', 'Сама не приходит. Позвать её можно в Летописи. В исключительных случаях может прийти к тебе с помощью.']];
  const cur = S.settings.witchFreq || 'auto';
  return `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Странствующая</h1></div>
  <p class="sub">Как часто ей приходить к твоему костру?</p>
  <div class="col">${opts.map(([k, t, d]) => `<button data-a="witchFreq" data-v="${k}" aria-pressed="${cur === k}" class="col" style="gap:2px;padding:12px 14px;border-radius:12px;text-align:left;color:inherit;${cur === k ? 'background:#F7EBCB;border:2px solid #9A4A2A' : 'background:var(--card);border:1px solid var(--line2)'}"><span style="font-size:17px;font-weight:700">${t}</span><span style="font-size:14px;color:var(--muted)">${d}</span></button>`).join('')}</div>
</div></div>`;
};

SCR.weavePick = () => `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Узоры земель</h1></div>
  <p class="sub">Выбери землю, чьи узоры хочешь поменять.</p>
  <div class="col">${activeLands().map((l) => `<button data-a="weaveEdit" data-id="${l.id}" data-back="weavePick" class="row" style="min-height:64px;padding:8px 14px;border-radius:12px;background:var(--card);border:1px solid var(--line2);text-align:left;color:inherit">
    ${emblemHtml(l, 44)}<span class="col grow" style="gap:1px"><span style="font-size:17px;font-weight:700">${esc(landName(l))}</span><span style="font-size:14px;color:var(--muted)">${l.patterns.length ? l.patterns.map((p) => esc(p.name)).join(', ') : 'узоров пока нет'}</span></span>${I.chev}</button>`).join('')}</div>
</div></div>`;

SCR.guide = () => {
  const H = HINTS();
  return `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Путеводитель</h1></div>
  <p class="sub">Гобелен — не надсмотрщик, а дорога. Здесь нет серий, которые сгорают, и упрёков за пропуски. Всё, что ты отмечаешь, нужно, чтобы лучше видеть себя.</p>
  ${['map', 'morning', 'evening', 'land', 'treasury', 'spells', 'journal'].map((k) => `<section class="box col" style="gap:6px;font-size:15px;line-height:1.4"><span class="goth" style="font-size:20px">${H[k][0]}</span>${H[k][1].map((x) => `<p style="margin:0">${x}</p>`).join('')}</section>`).join('')}
  <section class="box col" style="gap:6px;font-size:15px;line-height:1.4"><span class="goth" style="font-size:20px">Странствующая</span>
    <p style="margin:0">Она приходит сама, не чаще раза в несколько дней: когда сил мало, когда ты ${w('вернулась', 'вернулся')} после паузы, когда тропа к земле заросла или когда всё идёт в гору. Она задаёт один вопрос. Ответить можно, можно унести вопрос с собой до вечера, можно отказаться.</p>
    <p style="margin:0">Если тебе долго тяжело, она не задаёт вопросов, а напоминает о близких и о помощи. Этот экран всегда есть в Котомке: «Если тяжело».</p></section>
  <section class="box col" style="gap:6px;font-size:15px;line-height:1.4"><span class="goth" style="font-size:20px">Главы</span>
    <p style="margin:0">Каждые шесть недель глава завершается: ты видишь, сколько было привалов и стежков, получаешь расклад из трёх карт и даёшь главе имя.</p></section>
  <button class="btn ghost" data-a="hintsReset">Снова показывать подсказки на экранах</button>
</div></div>`;
};

SCR.threads = () => `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Нити наблюдений</h1></div>
  <p class="sub">Приложение замечает повторы в твоих записях и показывает только факты. Смысл решаешь ты.</p>
  ${S.threads.list.length ? S.threads.list.map((t) => `<button class="box col" data-a="go" data-to="thread" data-key="${t.key}" style="text-align:left;color:inherit;gap:4px"><span style="font-weight:700">${esc(t.name || 'Нить без имени')} · ${t.status === 'woven' ? 'вплетена' : 'отложена'}</span><span class="small">${esc(threadFact(t))}</span></button>`).join('') : '<p class="sub">Нитей пока не было. Они появляются, когда накопится хотя бы пара недель привалов.</p>'}
</div></div>`;

SCR.reminders = () => {
  if (ui.m === undefined) { ui.m = S.settings.morning; ui.e = S.settings.evening; }
  const slots = (from, to) => { const o = []; for (let k = from * 2; k <= to * 2; k++) { const h = Math.floor(k / 2) % 24, m = k % 2 ? '30' : '00'; o.push(`${String(h).padStart(2, '0')}:${m}`); } return o; };
  const sel = (key, list) => `<select class="field" style="width:120px" data-m="ui.${key}">${list.map((t) => `<option ${ui[key] === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const file = (kind, t) => `ics/${kind}-${t.replace(':', '')}.ics`;
  return `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Когда звать тебя</h1></div>
  <p class="box" style="margin:0;font-size:15px;line-height:1.4">Приложения с экрана «Домой» не могут сами будить уведомлениями без сервера, а твои данные на сервер не уходят. Поэтому напоминания живут в твоём Календаре: тихое ежедневное событие со звуком. Нажмёшь на него — откроется гобелен.</p>
  <div class="row" style="justify-content:space-between;font-size:17px"><span>Утренние сборы</span>${sel('m', slots(5, 12))}</div>
  <a class="btn" href="${file('morning', ui.m)}" target="_blank" rel="noopener" data-a="remSave">Добавить утро в Календарь</a>
  <div class="row" style="justify-content:space-between;font-size:17px"><span>Вечерний привал</span>${sel('e', slots(17, 23.5))}</div>
  <a class="btn" href="${file('evening', ui.e)}" target="_blank" rel="noopener" data-a="remSave">Добавить вечер в Календарь</a>
  <section class="box col" style="gap:6px;font-size:15px;line-height:1.4"><b>Что произойдёт</b>
    <p style="margin:0">iPhone покажет окно с событием — нажми «Добавить все» или «Добавить в Календарь». На Android файл откроется в Google Календаре или скачается: открой его из уведомления о загрузке.</p>
    <b>Если окно не появилось</b>
    <p style="margin:0">Создай событие в Календаре вручную: название «Вечерний привал», время ${esc(ui.e)}, «Повтор» — каждый день, «Напоминание» — во время события. Так же для утра.</p></section>
  <p class="sub" style="font-size:14px">Если пропустишь привал, ничего не обнулится. Странствующая приходит сама, когда ты открываешь гобелен, — её не нужно звать.</p>
</div></div>`;
};

SCR.backup = () => `
<div class="scr paper"><div class="pad">
  <div class="row">${backBtn('settings')}<h1 style="font-size:30px">Резервные копии</h1></div>
  <p class="box" style="margin:0;font-size:15px;line-height:1.4">Твоя летопись хранится только на этом устройстве — ни на каком сервере её нет. Если удалить приложение, сменить телефон или если система почистит память, записи пропадут. Копия — это один файл, в котором всё. Раз в неделю его стоит сохранять.</p>
  <div class="row" style="justify-content:space-between;font-size:16px"><span>Последняя копия</span><span style="color:var(--rust)">${S.settings.lastBackup ? fmtDay(S.settings.lastBackup) : 'ещё не было'}</span></div>
  <button class="btn" data-a="backupSave" style="flex-direction:column;gap:2px"><span>Сохранить копию</span><span style="font-size:13px;font-weight:400;opacity:.85">файл в «Файлы», iCloud Drive или себе в Telegram</span></button>
  <button class="btn dash" data-a="restorePick">Восстановить из копии</button>
  <input type="file" id="restoreFile" accept="application/json,.json" class="hide">
  <div class="row box"><span class="col grow" style="gap:0"><span style="font-size:16px;font-weight:700">Напоминать о копии</span><span style="font-size:14px;color:var(--muted)">по воскресеньям, у вечернего костра</span></span>
    <button class="switch ${S.settings.backupRemind ? 'on' : ''}" role="switch" aria-checked="${S.settings.backupRemind}" aria-label="Напоминать о копии" data-a="backupRemind"><span></span></button></div>
  <section class="box col" style="gap:6px;font-size:15px;line-height:1.4">
    <b>Как сохранить копию</b>
    <p style="margin:0"><b>iPhone:</b> нажми «Сохранить копию» → в появившемся меню выбери «Сохранить в Файлы» → папка iCloud Drive (так копия не потеряется вместе с телефоном) → «Сохранить». Можно и отправить файл себе в Telegram, в «Избранное».</p>
    <p style="margin:0"><b>Android и компьютер:</b> файл gobelen-дата.json скачается в «Загрузки». Перенеси его в облако или отправь себе.</p>
    <b>Как восстановить</b>
    <p style="margin:0">Открой гобелен на новом устройстве → Котомка → Резервные копии → «Восстановить из копии» → выбери последний файл gobelen-….json. Всё вернётся: земли, привалы, траты, карты и ответы. Если гобелен открывается впервые, то же самое есть на стартовом экране: «У меня уже есть гобелен».</p>
    <p style="margin:0">Восстановление заменяет то, что сейчас на устройстве, поэтому выбирай самый свежий файл.</p>
  </section>
  <p class="sub" style="font-size:14px">В копии всё: земли, узоры, привалы, траты, ответы Странствующей, карты и нити. Никуда, кроме выбранного тобой места, она не отправляется.</p>
  <button class="link" data-a="resetAsk" style="color:#9A4A2A">${ui.reset ? 'Точно начать с чистой канвы? Всё сотрётся' : 'Начать путь заново'}</button>
  ${ui.reset ? `<div class="row"><button class="btn" data-a="resetDo">Да, стереть всё</button><button class="btn ghost" data-a="toggle" data-k="reset">Нет</button></div>` : ''}
</div></div>`;

SCR.safety = () => `
<div class="scr night">
  <img class="hero-img" src="img/card/19.webp" alt="Костёр в кругу камней держит ночь на расстоянии" style="height:300px;object-position:center 55%">
  <div class="sheetup" style="background:var(--night);padding:22px 20px calc(24px + var(--safe-b));display:flex;flex-direction:column;gap:14px">
    <p style="margin:0;font-size:19px;font-style:italic;line-height:1.4;color:#E9DFF0">«Эта дорога не для ${w('одной путницы', 'одного путника')}. Позови тех, кому ты ${w('дорога', 'дорог')}, или того, кто умеет лечить такие раны. Я подожду тебя у огня».</p>
    <div class="col">
      <button data-a="friend" style="min-height:56px;padding:8px 16px;border-radius:12px;border:none;background:var(--pink);color:var(--night);text-align:left;display:flex;flex-direction:column;justify-content:center">
        <span style="font-size:17px;font-weight:700">Написать близкому человеку</span><span style="font-size:14px">другу, родным — тому, кому захочется</span></button>
      ${ui.friend ? `<div role="status" class="box col" style="gap:6px;border-color:var(--gold)"><span class="goth" style="font-size:20px;color:var(--gold)">Привал души</span><span style="font-size:16px;line-height:1.4;color:#E9DFF0">Общение с близкими — это привал души. Рядом с тобой всегда есть кто-то, кто поможет.</span></div>` : ''}
      <a href="${PSY_LINK}" target="_blank" rel="noopener" style="min-height:56px;padding:8px 16px;border-radius:12px;border:1px solid var(--nline);background:var(--night2);display:flex;flex-direction:column;justify-content:center">
        <span style="font-size:17px;font-weight:700">Обратиться к специалисту</span><span style="font-size:14px;color:#C9C3D6">Полина, психолог · @linapsyc в Telegram</span></a>
    </div>
    <button class="link mt-auto" style="color:#C9C3D6;font-size:16px" data-a="safetyBack">Мне немного легче, вернуться к карте</button>
  </div>
</div>`;

// =========================================================
// ДЕЙСТВИЯ
// =========================================================
const A = {};
const ALIAS = {
  landsEdit: ['lands', { mode: 'edit' }], heroEdit: ['hero', { mode: 'edit' }], tsetupEdit: ['tsetup', { mode: 'edit' }],
  weaveAll: () => ['weavePick', {}]
};
A.go = (d) => {
  if (d.to === 'weaveBack') return weaveBack();
  if (d.to === 'weaveFromTreasury') return go('weave', { mode: 'ob', queue: ob.picked, idx: ob.picked.length - 1 });
  const al = ALIAS[d.to];
  if (al) { const [r, p] = typeof al === 'function' ? al() : al; return go(r, p); }
  if (d.to === 'complete') return go('complete', { id: d.id });
  if (d.to === 'thread') return go('thread', { key: d.key });
  if (d.to === 'card') return go('card', { src: d.src });
  go(d.to);
};
A.tab = (d) => go(d.to === 'camp' ? campRoute() : d.to);
A.hintOk = (d) => { S.seen[d.k] = true; save(); ui.hint = false; render(); };
A.set = (d) => { ui[d.k] = Number(d.v); render(); };
A.setS = (d) => { ui[d.k] = ui[d.k] === d.v ? null : d.v; render(); };
A.toggle = (d) => { ui[d.k] = !ui[d.k]; if (d.focus) ui.focus = d.focus; render(); };

// первый вход
A.obStart = () => { ob = { hero: 'f', name: '', picked: [], customs: [], patterns: {} }; go('hero'); };
A.pickHero = (d) => { (P.mode === 'edit' ? ui : ob).hero = d.v; render(); };
A.heroNext = () => go('lands');
A.heroSave = () => { S.hero = ui.hero; S.name = (ui.name || '').trim(); save(); toast('Сохранено'); go('settings'); };
A.toggleLand = (d) => {
  const src = P.mode === 'edit' ? ui : ob;
  const i = src.picked.indexOf(d.id);
  if (i >= 0) src.picked.splice(i, 1);
  else if (src.picked.length < 4) src.picked.push(d.id);
  else toast('Можно выбрать до четырёх земель');
  render();
};
A.ownLandOpen = () => { ui.ownOpen = true; ui.focus = 'ownName'; render(); };
A.ownArt = (d) => { ui.ownArt = d.v; render(); };
A.ownLandClose = () => { ui.ownOpen = false; render(); };
A.ownLandAdd = () => {
  const name = (ui.ownName || '').trim();
  if (!name) return toast('Дай земле имя');
  const src = P.mode === 'edit' ? ui : ob;
  const id = 'own-' + uid();
  src.customs.push({ id, name, art: ui.ownArt || 'observatory' });
  if (src.picked.length < 4) src.picked.push(id);
  ui.ownOpen = false; ui.ownName = '';
  render();
};
A.landsNext = () => go('weave', { mode: 'ob', queue: ob.picked.slice(), idx: 0 });

// узоры
A.patDel = (d) => { ui.pats.splice(Number(d.i), 1); render(); };
A.patLoad = (d) => { ui.pats[Number(d.i)].load = Number(d.v); render(); };
A.patFreq = (d) => { const p = ui.pats[Number(d.i)]; p.freq = Math.max(0, Math.min(FREQS.length - 1, p.freq + Number(d.v))); render(); };
A.patAdd = (d) => { ui.pats.push({ id: uid(), name: d.name, load: 2, freq: 3 }); render(); };
A.patAddOwn = () => { const n = (ui.newPat || '').trim(); if (!n) return toast('Напиши, что за дело'); ui.pats.push({ id: uid(), name: n, load: 2, freq: 3 }); ui.newPat = ''; ui.focus = 'ownPat'; render(); };
function storePats() {
  const id = P.queue[P.idx || 0];
  if (P.mode === 'ob') ob.patterns[id] = ui.pats;
  else {
    const l = landOf(id);
    if (l) { l.patterns = ui.pats; l.target = Math.max(tierTarget(l.patterns), l.stitches + 1, l.target && l.stitches ? l.stitches + 1 : 0); save(); }
  }
}
A.weaveNext = () => {
  storePats();
  const idx = P.idx || 0;
  if (idx < P.queue.length - 1) return go('weave', { ...P, idx: idx + 1 });
  if (P.mode === 'ob') return go('tsetup', { mode: 'ob' });
  toast('Узоры вшиты');
  if (P.back) return go(P.back);
  if (P.queue.length === 1) return go('land', { id: P.queue[0] });
  go('map');
};
function weaveBack() {
  storePats();
  const idx = P.idx || 0;
  if (idx > 0) return go('weave', { ...P, idx: idx - 1 });
  if (P.mode === 'ob') return go('lands');
  if (P.back) return go(P.back);
  if (P.queue.length === 1 && landOf(P.queue[0])) return go('land', { id: P.queue[0] });
  go('settings');
}
A.weaveEdit = (d) => go('weave', { mode: 'edit', queue: [d.id], idx: 0, back: d.back });
A.witchFreq = (d) => { S.settings.witchFreq = d.v; if (d.v === 'call' && S.witch.pending?.type !== 'safety') S.witch.pending = null; save(); toast('Сохранено'); render(); };
A.callWitch = () => { callWitch(); save(); go('visit'); };
A.hintsReset = () => { S.seen = {}; save(); toast('Подсказки снова появятся на экранах'); };

// сундуки
A.chestToggle = (d) => { const c = ui.chests[Number(d.i)]; c.on = !c.on; render(); };
A.chestAdd = () => { const n = (ui.newChest || '').trim(); if (!n) return; ui.chests.push({ id: uid(), name: n, why: '', goal: '', saved: 0, on: true }); ui.newChest = ''; render(); };
A.tmode = (d) => { ui.mode = Number(d.v); render(); };
const cleanChests = () => ui.chests.filter((c) => c.on).map(({ id, name, why, goal, saved }) => ({ id, name, why, goal: Number(String(goal).replace(/\s/g, '')) || 0, saved: saved || 0 }));
A.setCur = (d) => { ui.cur = d.v; render(); };
A.tsetupSave = () => { S.treasury.chests = cleanChests(); S.treasury.mode = ui.mode; S.treasury.currency = ui.cur; save(); toast('Сундуки на месте'); go('treasury'); };
A.obFinish = () => {
  const td = today();
  S.hero = ob.hero; S.name = (ob.name || '').trim();
  S.lands = ob.picked.map((id, i) => {
    const patterns = ob.patterns[id] || [];
    const own = ob.customs.find((c) => c.id === id);
    return { id, customName: own ? own.name : null, art: own ? own.art : null, slot: i, tier: 1, stitches: 0, target: tierTarget(patterns), patterns, since: td, status: 'active' };
  });
  S.treasury.chests = cleanChests(); S.treasury.mode = ui.mode; S.treasury.currency = ui.cur;
  S.onboarded = true; S.created = td; S.firstDaySeen = false;
  save(); ob = null;
  go('map');
};
A.firstSeen = () => { S.firstDaySeen = true; save(); render(); };

// земли
A.landsSave = () => {
  const td = today();
  const keep = new Set(ui.picked);
  const added = [];
  for (const l of S.lands) if (l.status === 'active' && !keep.has(l.id)) l.status = 'asleep';
  for (const id of ui.picked) {
    const ex = landOf(id);
    if (ex) { if (ex.status !== 'active') { ex.status = 'active'; } }
    else {
      const own = ui.customs.find((c) => c.id === id);
      S.lands.push({ id, customName: own ? own.name : null, art: own ? own.art : null, slot: -1, tier: 1, stitches: 0, target: 24, patterns: [], since: td, status: 'active' });
      added.push(id);
    }
  }
  // раскладываем по местам на карте, сохраняя прежние
  const act = activeLands();
  const used = new Set(act.filter((l) => l.slot >= 0 && l.slot < 4).map((l) => l.slot));
  const seen = new Set();
  for (const l of act) { if (l.slot >= 0 && l.slot < 4 && !seen.has(l.slot)) { seen.add(l.slot); continue; } l.slot = -1; }
  for (const l of act) if (l.slot < 0) { let s = 0; while (seen.has(s)) s++; l.slot = s; seen.add(s); }
  for (const l of S.lands) if (l.status !== 'active') l.slot = -1;
  save();
  if (added.length) return go('weave', { mode: 'edit', queue: added, idx: 0 });
  toast('Карта обновлена'); go('map');
};
A.openLand = (d) => { const l = landOf(d.id); if (l && landProgress(l) >= 1 && !l.doneSeen) { l.doneSeen = true; save(); return go('complete', { id: l.id }); } go('land', { id: d.id }); };
A.stepDo = (d) => {
  const l = landOf(d.land);
  const p = l.patterns.find((x) => x.id === d.p);
  const last = [...S.steps].reverse().find((x) => x.patternId === p.id);
  if (!d.force && last && last.at && Date.now() - last.at < 90000) { ui.confirmStep = p.id; return render(); }
  ui.confirmStep = null;
  const n = addStep(l.id, p);
  S.steps[S.steps.length - 1].at = Date.now();
  save();
  toast(`+${stitchW(n)} вплетено в землю «${landShort(l)}»`);
  if (landProgress(l) >= 1 && !l.doneSeen) { l.doneSeen = true; save(); return go('complete', { id: l.id }); }
  render();
};
A.stepUndo = (d) => {
  if (!S.steps[Number(d.i)]) return;
  withUndo('Стежок убран', () => {
    const st = S.steps[Number(d.i)];
    const l = landOf(st.landId);
    if (l && l.tier === st.tier) l.stitches = Math.max(0, l.stitches - st.stitches);
    S.steps.splice(Number(d.i), 1);
    if (l) S.seenStitches[l.id + ':' + l.tier] = l.stitches;
  });
};
const curLand = () => landOf(P.id);
A.goalOpen = () => { Object.assign(ui, { goalForm: true, gText: '', gTarget: '', gUnit: '', gWhy: '', gMonths: 3, focus: 'gText' }); render(); };
A.goalEx = (d) => { ui.gText = (landDef(P.id)?.goals || OWN_GOALS)[Number(d.i)] || ''; const m = ui.gText.match(/(\d+)\s+([а-яё]+)/i); if (m && !ui.gTarget) { ui.gTarget = m[1]; ui.gUnit = m[2]; } render(); };
A.goalSave = () => {
  const text = (ui.gText || '').trim();
  if (!text) return toast('Что именно хочешь? Одной фразой');
  const due = new Date(); due.setMonth(due.getMonth() + (ui.gMonths || 3));
  const l = curLand();
  l.goal = { text, target: num(ui.gTarget) || 0, unit: (ui.gUnit || '').trim(), current: 0, why: (ui.gWhy || '').trim(), due: dayKey(due), since: today(), doneAt: null };
  S.journal.push({ id: uid(), kind: 'land', date: today(), text: `${landName(l)}: новая цель — ${text}` });
  save(); ui.goalForm = false; toast('Цель поставлена'); render();
};
function archiveGoal(l, status) {
  (l.goalHistory ||= []).push({ ...l.goal, status, closedAt: today() });
}
function goalReached(l) {
  l.goal.doneAt = today();
  archiveGoal(l, 'done');
  S.journal.push({ id: uid(), kind: 'land', date: today(), text: `${landName(l)}: цель достигнута — ${l.goal.text}` });
  toast('Цель достигнута! Это твоя победа');
}
A.goalStep = (d) => {
  const l = curLand(); const g0 = l.goal;
  g0.current = Math.max(0, g0.current + Number(d.v));
  if (g0.target && g0.current >= g0.target) goalReached(l);
  save(); flash('goal');
};
A.goalDone = () => { goalReached(curLand()); save(); flash('goal'); };
A.goalExtend = () => { const g0 = curLand().goal; const d = parseDay(today()); d.setMonth(d.getMonth() + 1); g0.due = dayKey(d); save(); toast('Срок продлён на месяц'); render(); };
A.goalEdit = () => { const g0 = curLand().goal; Object.assign(ui, { goalForm: true, gText: g0.doneAt ? '' : g0.text, gTarget: g0.doneAt ? '' : (g0.target || ''), gUnit: g0.doneAt ? '' : g0.unit, gWhy: g0.doneAt ? '' : g0.why, gMonths: 3 }); render(); };
A.goalDrop = () => withUndo('Цель отпущена. Это тоже решение', () => { const l = curLand(); if (!l.goal.doneAt) archiveGoal(l, 'dropped'); S.journal.push({ id: uid(), kind: 'land', date: today(), text: `${landName(l)}: цель отпущена — ${l.goal.text}` }); l.goal = null; });
A.landGrow = (d) => {
  const l = landOf(d.id);
  l.tier += 1; l.stitches = 0; l.doneSeen = false; l.target = tierTarget(l.patterns);
  S.journal.push({ id: uid(), kind: 'land', date: today(), text: `${landName(l)}: начат новый ${lookOf(l)?.tier || 'ярус'} (${l.tier}-й)` });
  save();
  go('weave', { mode: 'edit', queue: [l.id], idx: 0 });
};
A.landHang = (d) => {
  const l = landOf(d.id);
  l.status = 'hung'; l.slot = -1;
  S.wall.push({ id: l.id, customName: l.customName, art: l.art, date: today() });
  S.journal.push({ id: uid(), kind: 'land', date: today(), text: `Земля «${landName(l)}» вышита и висит на стене Летописи` });
  save();
  go('lands', { mode: 'edit' });
};

// утро и вечер
A.morningSave = () => {
  const td = today();
  (S.days[td] ||= {}).morning = { wake: ui.wake, patternId: ui.pid, word: (ui.word || '').trim() };
  save();
  toast('Доброй дороги');
  go('map');
};
A.eveLand = (d) => {
  if (d.v === 'none') { ui.lands = []; ui.pids = []; return render(); }
  const i = ui.lands.indexOf(d.v);
  if (i >= 0) { ui.lands.splice(i, 1); const l = landOf(d.v); ui.pids = ui.pids.filter((pid) => !l.patterns.some((p) => p.id === pid)); }
  else ui.lands.push(d.v);
  render();
};
A.eveEdit = () => {
  const prev = S.days[today()]?.evening;
  Object.assign(ui, { editing: true, energy: prev.energy, sky: prev.sky, lands: (prev.landIds || (prev.landId ? [prev.landId] : [])).slice(), pids: (prev.patternIds || []).slice(), note: prev.note || '' });
  render();
};
A.evePat = (d) => { const i = ui.pids.indexOf(d.v); if (i >= 0) ui.pids.splice(i, 1); else ui.pids.push(d.v); render(); };
A.eveningSave = () => {
  const td = today();
  // если привал уже был — заменяем вечерние стежки
  const old = S.steps.filter((s) => s.date === td && s.src === 'evening');
  for (const s of old) { const l = landOf(s.landId); if (l && l.tier === s.tier) l.stitches = Math.max(0, l.stitches - s.stitches); }
  S.steps = S.steps.filter((s) => !(s.date === td && s.src === 'evening'));
  let n = 0;
  const chosen = ui.lands.map((id) => landOf(id)).filter(Boolean);
  for (const l of chosen) {
    const pats = l.patterns.filter((p) => ui.pids.includes(p.id));
    if (pats.length) for (const p of pats) { n += addStep(l.id, p); S.steps[S.steps.length - 1].src = 'evening'; }
    else { n += addStep(l.id, null); S.steps[S.steps.length - 1].src = 'evening'; }
  }
  (S.days[td] ||= {}).evening = { energy: ui.energy, sky: ui.sky, landId: chosen[0]?.id || null, landIds: chosen.map((l) => l.id), patternIds: ui.pids.slice(), note: (ui.note || '').trim() };
  if (S.witch.carried) {
    const c = S.witch.carried;
    if ((ui.carriedAns || '').trim()) { S.journal.push({ id: uid(), kind: 'witch', date: td, q: c.q, answer: ui.carriedAns.trim(), type: 'carried' }); S.witch.carried = null; }
    else if (daysBetween(c.date, td) >= 3) S.witch.carried = null;
  }
  evaluateVisit(0);
  save();
  ui = { done: { stitches: n } };
  render(true);
};

// Странствующая
function closeVisit(entry) {
  const v = S.witch.pending;
  S.journal.push({ id: uid(), date: today(), kind: 'witch', type: v.type, line: v.line, q: v.q, ...entry, vow: ui.vow ? v.vow : null });
  if (v.echo) S.witch.echoed.push(v.echo.id);
  S.witch.lastVisit = today();
  S.witch.history.push({ date: today(), type: v.type });
  ui.cardNext = !!v.card && canAskCard();
  S.witch.pending = null;
  save();
}
A.visitWeave = () => { closeVisit({ answer: (ui.ans || '').trim() }); ui.done = 'weave'; render(true); };
A.visitCarry = () => { const v = S.witch.pending; S.witch.carried = { q: v.q, date: today() }; closeVisit({ carried: true }); ui.done = 'carry'; render(true); };
A.safetyBack = () => { if (S.witch.pending?.type === 'safety') { S.witch.pending = null; S.witch.lastVisit = today(); save(); } go('map'); };
A.friend = async () => {
  ui.friend = true; render();
  try { if (navigator.share) await navigator.share({ text: 'Привет. Можешь сейчас со мной поговорить?' }); } catch (e) { /* отмена */ }
};

// карты
A.cardPick = () => { ui.step = 1; S.witch.lastCard = today(); S.witch.cardDraft = { id: ui.card.id, date: today() }; save(); render(); };
A.cardReveal = () => { ui.step = 2; render(); };
A.cardSave = (d) => {
  S.journal.push({ id: uid(), date: today(), kind: 'card', cardId: ui.card.id, seen: (ui.seen || '').trim(), answer: (ui.cans || '').trim(), carried: d.v === 'carry' });
  if (d.v === 'carry') S.witch.carried = { q: `Карта «${cardName(ui.card)}»: ${cardQs(ui.card)[0]}`, date: today() };
  S.witch.lastCard = S.witch.cardDraft?.date || today();
  S.witch.cardDraft = null;
  save();
  go(d.v === 'weave' ? 'journal' : 'map');
};

// сокровищница
const num = (s) => Number(String(s || '').replace(/\s/g, '').replace(',', '.')) || 0;
A.hideSums = () => { S.treasury.hideSums = !S.treasury.hideSums; save(); render(); };
A.chestOpen = (d) => { ui.chest = ui.chest === d.id ? null : d.id; ui.chestAmt = ''; render(); };
A.chestMove = (d) => {
  const c = S.treasury.chests.find((x) => x.id === ui.chest);
  const a = num(ui.chestAmt);
  if (!c || !a) return toast('Сколько монет?');
  if (Number(d.v) < 0 && a > c.saved) return toast(`В сундуке только ${money(c.saved)}`);
  c.saved = c.saved + a * Number(d.v);
  if (S.treasury.wallet !== null) S.treasury.wallet -= a * Number(d.v);
  save(); toast(Number(d.v) > 0 ? `В сундук «${c.name}» легло ${money(a)}` : `Из сундука взято ${money(a)}`);
  ui.chest = null; render();
};
A.spendAdd = () => {
  const a = num(ui.amt);
  if (!a) return toast('Сколько потрачено?');
  const env = (S.treasury.envelopes || []).find((e) => e.id === ui.env);
  S.treasury.spends.push({ id: uid(), date: today(), amount: a, note: (ui.what || '').trim() || (env ? env.name : ''), tag: ui.tag, envId: env ? env.id : null });
  if (S.treasury.wallet !== null) S.treasury.wallet -= a;
  save(); ui.amt = ''; ui.what = ''; ui.env = null;
  let msg = `Записано: ${TAGS[ui.tag][0].toLowerCase()}, ${money(a)}`;
  if (env) { const ym = today().slice(0, 7); const left = env.limit - S.treasury.spends.filter((x) => x.envId === env.id && x.date.slice(0, 7) === ym).reduce((q, x) => q + x.amount, 0); msg += left >= 0 ? ` · в конверте «${env.name}» осталось ${money(left)}` : ` · конверт «${env.name}» превышен на ${money(-left)}`; }
  toast(msg);
  if (S.treasury.wallet !== null) flash('wallet'); else render();
};
A.spendDel = (d) => withUndo('Трата удалена', () => {
  const s = S.treasury.spends.find((x) => x.id === d.id);
  if (s && S.treasury.wallet !== null) S.treasury.wallet += s.amount;
  S.treasury.spends = S.treasury.spends.filter((x) => x.id !== d.id);
});
A.walletCheck = () => {
  const real = num(ui.real);
  const T = S.treasury;
  if (!String(ui.real || '').trim()) return toast('Сколько в кошеле?');
  if (T.wallet === null) { T.wallet = real; toast(`Запомнено: в кошеле ${money(real)}`); }
  else {
    const diff = Math.round(T.wallet - real);
    if (diff > 0) { T.spends.push({ id: uid(), date: today(), amount: diff, note: 'не помню на что', tag: 2 }); toast(`${money(diff)} — рассыпано по дороге. Бывает.`); }
    else if (diff < 0) toast(`В кошеле на ${money(-diff)} больше, чем было записано`);
    else toast('Всё сходится');
    T.wallet = real;
  }
  save(); ui.checking = false; ui.real = ''; flash('wallet');
};
function flash(k) { ui.flash = k; render(); const u = ui; setTimeout(() => { if (u.flash === k) u.flash = null; }, 2300); }
A.regAdd = () => {
  const name = (ui.regName || '').trim(), amount = num(ui.regAmt), day = Math.min(31, Math.max(1, parseInt(ui.regDay, 10) || 0));
  if (parseInt(ui.regDay, 10) > 31) return toast('Число месяца — от 1 до 31');
  if (!name || !amount || !parseInt(ui.regDay, 10)) return toast('Нужны название, сумма и число месяца');
  S.treasury.regular.push({ id: uid(), name, amount, day, since: today(), last: null });
  applyRegular(); save();
  ui.regName = ''; ui.regAmt = ''; ui.regDay = '';
  toast(`«${name}» будет записываться ${day} числа`); render();
};
A.pickEnv = (d) => { ui.env = ui.env === d.v ? null : d.v; if (ui.env) ui.tag = 1; render(); };
A.envAdd = () => {
  const name = (ui.envName || '').trim(), limit = num(ui.envLimit);
  if (!name || !limit) return toast('Нужны название и сумма на месяц');
  (S.treasury.envelopes ||= []).push({ id: uid(), name, limit });
  save(); ui.envAdd = false; ui.envName = ''; ui.envLimit = ''; toast(`Конверт «${name}» заведён`); render();
};
A.envDel = (d) => withUndo('Конверт убран', () => { S.treasury.envelopes = S.treasury.envelopes.filter((e) => e.id !== d.id); });
A.regDel = (d) => withUndo('Постоянная трата убрана', () => { S.treasury.regular = S.treasury.regular.filter((r) => r.id !== d.id); });
A.incomeAdd = () => { const a = num(ui.inc); if (!a) return; S.treasury.wallet += a; save(); ui.income = false; ui.inc = ''; toast(`+${money(a)} в кошеле`); flash('wallet'); };

// заклинания
A.setUnit = (d) => { ui[d.k] = ui[d.k] === d.v ? '' : d.v; render(); };
A.castOpen = (d) => {
  const sp = S.spells.find((x) => x.id === d.id);
  ui.casting = { id: d.id, kind: d.v }; ui.castAmt = sp[d.v].amount || ''; ui.focus = 'castAmt'; render();
};
A.castCancel = () => { ui.casting = null; render(); };
A.castDo = () => {
  const sp = S.spells.find((x) => x.id === ui.casting.id);
  const kind = ui.casting.kind, td = today();
  const amount = String(ui.castAmt ?? '').trim();
  sp.casts.push({ date: td, kind, amount: amount ? num(amount) : '' });
  let msg = `Заклинание «${sp.name}» прочитано`;
  const l = sp.landId ? landOf(sp.landId) : null;
  if (l && l.status === 'active') {
    const n = addStep(l.id, { id: null, name: `Заклинание «${sp.name}»`, load: kind === 'great' ? 2 : 1 });
    S.steps[S.steps.length - 1].src = 'spell'; S.steps[S.steps.length - 1].spellId = sp.id;
    msg += ` · +${stitchW(n)} в «${landShort(l)}»`;
  }
  const st = spellStats(sp);
  if (st.returns && st.total > 1) { const days = [...new Set(sp.casts.map((x) => x.date))].sort(); if (days.length > 1 && daysBetween(days[days.length - 2], td) >= 2) msg += ' · с возвращением!'; }
  save(); ui.casting = null; toast(msg); flash(sp.id);
};
A.castUndo = (d) => {
  const sp = S.spells.find((x) => x.id === d.id);
  const td = today();
  const lastCast = [...sp.casts].reverse().find((x) => x.date === td);
  if (lastCast) sp.casts.splice(sp.casts.lastIndexOf(lastCast), 1);
  const x = [...S.steps].reverse().find((q) => q.date === td && q.src === 'spell' && q.spellId === sp.id);
  if (x) { const l = landOf(x.landId); if (l && l.tier === x.tier) l.stitches = Math.max(0, l.stitches - x.stitches); S.steps.splice(S.steps.lastIndexOf(x), 1); }
  save(); render();
};
A.spellSeed = (d) => {
  const x = SPELL_SEEDS[Number(d.i)];
  Object.assign(ui, { spName: x.name, sW: x.small[0], sA: x.small[1], sU: x.small[2], gW: x.great[0], gA: x.great[1], gU: x.great[2], spLand: ui.spLand || '' });
  render();
};
A.spellAdd = () => {
  const name = (ui.spName || '').trim();
  if (!name) return toast('Как зовётся заклинание?');
  const v = (w0, a, u, def) => ({ what: (w0 || '').trim() || def, amount: String(a ?? '').trim() ? num(a) : '', unit: (u || '').trim() });
  S.spells.push({ id: uid(), name, landId: ui.spLand || null, small: v(ui.sW, ui.sA, ui.sU, 'чуть-чуть'), great: v(ui.gW, ui.gA, ui.gU, 'по-настоящему'), casts: [] });
  save(); ui = {}; toast('Заклинание вписано в книгу'); render();
};
A.spellDel = (d) => withUndo('Заклинание стёрто из книги', () => { S.spells = S.spells.filter((x) => x.id !== d.id); });

// летопись
A.noteSave = () => {
  const t = (ui.noteText || '').trim();
  if (!t) return toast('Запись пустая');
  S.journal.push({ id: uid(), date: today(), kind: 'note', text: t });
  save(); ui.writing = false; ui.noteText = ''; toast('Записано в Летопись'); render();
};
A.threadDecide = (d) => {
  const t = detectThreads().find((x) => x.key === d.key) || S.threads.list.find((x) => x.key === d.key);
  const status = d.v === 'woven' ? 'woven' : 'dismissed';
  const ex = S.threads.list.find((x) => x.key === d.key);
  const rec = { ...t, name: (ui.tname || '').trim() || t.name || '', date: today(), status };
  if (ex) Object.assign(ex, rec); else S.threads.list.push(rec);
  S.threads.decided[d.key] = status;
  if (status === 'woven') S.journal.push({ id: uid(), date: today(), kind: 'thread', name: rec.name, fact: threadFact(rec) });
  save(); ui.done = status === 'woven' ? 'yes' : 'no'; render(true);
};
A.chapterSave = () => {
  const ch = chapterDue();
  S.chapters.push({ n: ch.n, from: ch.from, to: ch.to, name: (ui.cname || '').trim(), spread: ui.spread.map((c) => c.id) });
  S.journal.push({ id: uid(), date: today(), kind: 'chapter', n: ch.n, name: (ui.cname || '').trim() });
  save(); go('journal');
};

// напоминания: готовые файлы календаря лежат в папке ics/
A.noop = () => {};
A.remSave = (d, el, e) => { S.settings.morning = ui.m; S.settings.evening = ui.e; save(); window.open(el.getAttribute('href'), '_blank') || (location.href = el.getAttribute('href')); };

// копии
A.backupSave = async () => {
  const name = `gobelen-${today()}.json`;
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Гобелен пути — копия' });
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    S.settings.lastBackup = today(); save(); toast('Копия сохранена'); render();
  } catch (e) { if (e.name !== 'AbortError') toast('Не получилось сохранить копию'); }
};
A.restorePick = () => document.getElementById('restoreFile')?.click();
A.backupRemind = () => { S.settings.backupRemind = !S.settings.backupRemind; save(); render(); };
A.resetAsk = () => { ui.reset = true; render(); };
A.resetDo = () => { resetAll(); ob = null; go('start'); };

// ——— события ———
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});
document.addEventListener('input', (e) => {
  const m = e.target.dataset?.m;
  if (!m) return;
  const [root, key] = m.split('.');
  if (root === 'ui') ui[key] = e.target.value;
  else if (root === 'ob') ob[key] = e.target.value;
  else if (root === 'chest') ui.chests[Number(key)].goal = e.target.value;
  if (e.target.tagName === 'SELECT') render();
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'restoreFile' || !e.target.files[0]) return;
  try {
    const data = JSON.parse(await e.target.files[0].text());
    if (!data || !Array.isArray(data.lands)) throw new Error('bad');
    pendingRestore = data;
    go('restore');
  } catch (err) { toast('Это не похоже на копию гобелена'); }
});

// жест «назад»: свайп от левого края
let tx = null, ty = 0;
document.addEventListener('touchstart', (e) => { const t = e.touches[0]; tx = t.clientX < 28 ? t.clientX : null; ty = t.clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (tx === null) return;
  const t = e.changedTouches[0];
  if (t.clientX - tx > 70 && Math.abs(t.clientY - ty) < 60) {
    const b = document.querySelector('.back');
    if (b) b.click();
    else if (!['map', 'start'].includes(route) && S.onboarded) go('map');
  }
  tx = null;
}, { passive: true });

// ——— подтверждение восстановления ———
let pendingRestore = null;
SCR.restore = () => {
  const d = pendingRestore;
  if (!d) return SCR.start();
  const lands = (d.lands || []).filter((l) => l.status === 'active').length;
  const days = Object.keys(d.days || {}).sort();
  const hasNow = S.onboarded;
  return `
<div class="scr paper"><div class="pad">
  <h1 style="font-size:30px">Восстановить из копии?</h1>
  <div class="box col" style="gap:4px;font-size:16px"><span>В копии: ${lands} ${plural(lands, 'земля', 'земли', 'земель')}, ${days.length} ${plural(days.length, 'день', 'дня', 'дней')} записей</span>${days.length ? `<span style="color:var(--muted)">последняя запись — ${fmtDay(days[days.length - 1])}</span>` : ''}</div>
  ${hasNow ? '<p class="note warn" style="margin:0">Всё, что сейчас есть в приложении на этом устройстве, заменится содержимым копии. Если сомневаешься, сначала сохрани текущую копию.</p>' : ''}
  <button class="btn mt-auto" data-a="restoreDo">Да, восстановить</button>
  <button class="btn ghost" data-a="restoreCancel">Отмена</button>
</div></div>`;
};
A.restoreDo = () => { replaceAll(pendingRestore); pendingRestore = null; toast('Гобелен восстановлен'); go(S.onboarded ? 'map' : 'start'); };
A.restoreCancel = () => { pendingRestore = null; go(S.onboarded ? 'backup' : 'start'); };

// ——— запуск ———
function boot() {
  const td = today();
  if (S.onboarded) {
    const gap = S.lastActive ? daysBetween(S.lastActive, td) : 0;
    applyRegular();
    evaluateVisit(gap);
    S.lastActive = td;
    save();
    go('map');
  } else go('start');
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.onboarded && S.lastActive !== today()) {
    const gap = daysBetween(S.lastActive, today());
    applyRegular(); evaluateVisit(gap); S.lastActive = today(); save();
    if (route === 'map') render();
  }
});
boot();

// для проверки и отладки из консоли
window.__gobelen = { S: () => S, go, render };
