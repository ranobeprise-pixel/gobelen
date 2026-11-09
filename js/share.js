// Картинки 9:16 для сторис: находка, карта Колоды, гобелен.
// Рисуем на canvas 1080×1920, потом отдаём в системное «Поделиться» (на iPhone — сохранить в Фото, отправить в Инстаграм).
// Личные ответы пользователя на картинки не попадают.
import { FINDS, RARITY, findImg } from './data.js';

const W = 1080, H = 1920;
const URL_TEXT = 'ranobeprise-pixel.github.io/gobelen';
const C = { bg1: '#2A1E17', bg2: '#140E0A', gold: '#E9C77B', text: '#F3EBDD', muted: '#CDBFA8', line: 'rgba(233,199,123,.35)' };
const RC = { c: '#E9C77B', r: '#9DBCE3', m: '#D9A8F0' };

const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
async function fonts() {
  try { await Promise.all(['80px "Brahms Gotisch"', '40px Gatchina', 'bold 40px Gatchina', 'italic 40px Gatchina'].map((f) => document.fonts.load(f))); } catch (e) { /* шрифты не успели — будет запасной */ }
}
const GOTH = '"Brahms Gotisch", Georgia, serif';
const BODY = 'Gatchina, Georgia, serif';

function canvas() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // тонкая вышитая рамка
  x.strokeStyle = C.line; x.lineWidth = 3; x.setLineDash([14, 10]);
  x.strokeRect(44, 44, W - 88, H - 88); x.setLineDash([]);
  return [cv, x];
}
function header(x, sub) {
  x.textAlign = 'center'; x.fillStyle = C.gold; x.font = `84px ${GOTH}`;
  x.fillText('Гобелен пути', W / 2, 190);
  if (sub) { x.fillStyle = C.muted; x.font = `italic 40px ${BODY}`; x.fillText(sub, W / 2, 252); }
}
function footer(x) {
  x.textAlign = 'center';
  x.fillStyle = C.muted; x.font = `italic 36px ${BODY}`; x.fillText('мягкий планер жизни', W / 2, H - 150);
  x.fillStyle = C.gold; x.font = `38px ${BODY}`; x.fillText(URL_TEXT, W / 2, H - 96);
}
// перенос строк по ширине; возвращает y после последней строки
function wrap(x, text, cx, y, maxW, lh) {
  const words = String(text).split(/\s+/); let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (x.measureText(t).width > maxW && line) { x.fillText(line, cx, y); y += lh; line = w; } else line = t;
  }
  if (line) { x.fillText(line, cx, y); y += lh; }
  return y;
}
function glow(x, cx, cy, r, color) {
  const g = x.createRadialGradient(cx, cy, 10, cx, cy, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
}

async function deliver(cv, name, title) {
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  // запасной путь: показать картинку, чтобы её можно было сохранить вручную
  document.querySelectorAll('.shareov').forEach((o) => o.remove());
  const url = URL.createObjectURL(blob);
  const ov = document.createElement('div'); ov.className = 'shareov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Картинка для сторис');
  ov.innerHTML = `<img src="${url}" alt="${title}"><p>Нажми на картинку и удерживай, чтобы сохранить её в Фото</p><div class="row" style="gap:10px;justify-content:center"><a class="btn gold" href="${url}" download="${name}" style="text-decoration:none">Скачать</a><button class="btn ghost" type="button">Закрыть</button></div>`;
  ov.querySelector('button').addEventListener('click', () => { ov.remove(); URL.revokeObjectURL(url); });
  document.body.appendChild(ov);
}

export async function shareFind(i, got) {
  await fonts();
  const [cv, x] = canvas();
  const f = FINDS[i], r = f[2];
  header(x, 'находка на тропе');
  const cy = 780;
  glow(x, W / 2, cy, r === 'c' ? 330 : 420, r === 'm' ? 'rgba(217,168,240,.45)' : r === 'r' ? 'rgba(157,188,227,.35)' : 'rgba(233,199,123,.22)');
  const img = await load(findImg(i));
  x.imageSmoothingEnabled = false;
  x.drawImage(img, W / 2 - 352, cy - 352, 704, 704);
  x.imageSmoothingEnabled = true;
  x.textAlign = 'center';
  x.fillStyle = RC[r]; x.font = `bold 38px ${BODY}`;
  x.fillText(RARITY[r].label.toUpperCase().split('').join(' '), W / 2, 1230);
  x.fillStyle = C.text; x.font = `76px ${GOTH}`;
  let y = wrap(x, f[0], W / 2, 1330, 900, 88);
  x.fillStyle = C.muted; x.font = `italic 44px ${BODY}`;
  y = wrap(x, f[1], W / 2, y + 10, 860, 56);
  x.fillStyle = C.gold; x.font = `38px ${BODY}`;
  x.fillText(`в коллекции ${got} из ${FINDS.length}`, W / 2, Math.max(y + 50, 1620));
  footer(x);
  await deliver(cv, 'nahodka.png', f[0]);
}

export async function shareCard(src, name, question) {
  await fonts();
  const [cv, x] = canvas();
  header(x, 'карта Колоды Пути');
  const img = await load(src);
  const cw = 560, ch = Math.round(cw * img.height / img.width);
  const cx = (W - cw) / 2, top = 320;
  glow(x, W / 2, top + ch / 2, 520, 'rgba(233,199,123,.25)');
  x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 40; x.shadowOffsetY = 16;
  x.beginPath(); x.roundRect ? x.roundRect(cx, top, cw, ch, 22) : x.rect(cx, top, cw, ch); x.fillStyle = '#000'; x.fill(); x.restore();
  x.save(); x.beginPath(); x.roundRect ? x.roundRect(cx, top, cw, ch, 22) : x.rect(cx, top, cw, ch); x.clip(); x.drawImage(img, cx, top, cw, ch); x.restore();
  x.textAlign = 'center'; x.fillStyle = C.text; x.font = `80px ${GOTH}`;
  let y = wrap(x, name, W / 2, top + ch + 120, 920, 90);
  if (question) {
    x.fillStyle = C.muted; x.font = `italic 34px ${BODY}`; x.fillText('вопрос карты', W / 2, y + 20);
    x.fillStyle = C.text; x.font = `44px ${BODY}`;
    wrap(x, `«${question}»`, W / 2, y + 84, 880, 56);
  }
  footer(x);
  await deliver(cv, 'karta.png', name);
}

// lands: [{ slot, src, pct, label, letter }]; slots — координаты на карте 390×699
export async function shareMap(lands, slots, dateText) {
  await fonts();
  const [cv, x] = canvas();
  header(x, dateText ? `мой гобелен · ${dateText}` : 'мой гобелен');
  const tap = await load('img/tapestry.webp');
  const th = 1330, tw = Math.round(th * 390 / 699), tx = (W - tw) / 2, ty = 300, k = tw / 390;
  x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 36; x.drawImage(tap, tx, ty, tw, th); x.restore();
  for (const l of lands) {
    const [sx, sy] = slots[l.slot];
    const s = 104 * k, ex = tx + sx * k, ey = ty + sy * k, r = s / 2;
    const circle = () => { x.beginPath(); x.arc(ex + r, ey + r, r, 0, Math.PI * 2); };
    if (l.src) {
      const em = await load(l.src);
      x.save(); circle(); x.clip(); x.globalAlpha = 0.28; x.drawImage(em, ex, ey, s, s); x.globalAlpha = 1;
      const hgt = s * l.pct / 100; x.beginPath(); x.rect(ex, ey + s - hgt, s, hgt); x.clip(); x.drawImage(em, ex, ey, s, s); x.restore();
    } else {
      x.save(); circle(); x.fillStyle = '#5A3522'; x.fill(); x.lineWidth = 5; x.strokeStyle = '#C7A257'; x.stroke();
      x.fillStyle = C.text; x.font = `${Math.round(s * 0.45)}px ${GOTH}`; x.textAlign = 'center'; x.fillText(l.letter, ex + r, ey + r + s * 0.15); x.restore();
    }
    // подпись-«пилюля»
    const lab = l.label.length > 16 ? l.label.slice(0, 15).trim() + '…' : l.label;
    const txt = `${lab} · ${l.pct >= 100 ? 'вышито' : l.pct + '%'}`;
    x.font = `26px ${BODY}`; const pw = x.measureText(txt).width + 28, ph = 40, px = Math.min(Math.max(ex + r - pw / 2, tx + 10), tx + tw - pw - 10), py = ey + s + 8;
    x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 20) : x.rect(px, py, pw, ph); x.fillStyle = l.pct >= 100 ? C.gold : '#3B2418'; x.fill();
    x.fillStyle = l.pct >= 100 ? '#2A1E17' : C.text; x.textAlign = 'center'; x.fillText(txt, px + pw / 2, py + 29);
  }
  footer(x);
  await deliver(cv, 'gobelen.png', 'Мой гобелен пути');
}
