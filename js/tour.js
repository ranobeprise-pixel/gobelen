// Знакомство с экраном: затемняем всё, подсвечиваем один элемент и коротко говорим, зачем он.
// steps: [{ sel, text }] — шаги без найденного элемента пропускаются.
let active = null;

export const tourActive = () => !!active;

export function startTour(steps, onDone) {
  const root = document.getElementById('app');
  const list = steps.filter((s) => document.querySelector(s.sel));
  if (!list.length) { onDone && onDone(); return; }
  stop();
  const hole = document.createElement('div'); hole.className = 'tourhole';
  const block = document.createElement('div'); block.className = 'tourblock';
  const bub = document.createElement('div'); bub.className = 'tourbub'; bub.setAttribute('role', 'dialog'); bub.setAttribute('aria-live', 'polite');
  document.body.append(block, hole, bub);
  let i = 0;
  const finish = () => { stop(); onDone && onDone(); };
  const place = () => {
    const el = document.querySelector(list[i].sel);
    if (!el) return next();
    const r = el.getBoundingClientRect(), pad = 8;
    const vw = window.innerWidth, vh = window.innerHeight;
    const top = Math.max(4, r.top - pad), left = Math.max(4, r.left - pad);
    const w = Math.min(vw - 8, r.width + pad * 2), h = Math.min(vh - 8, r.height + pad * 2);
    Object.assign(hole.style, { top: top + 'px', left: left + 'px', width: w + 'px', height: h + 'px' });
    const bw = Math.min(340, vw - 32);
    bub.style.width = bw + 'px';
    bub.style.left = Math.min(Math.max(16, r.left + r.width / 2 - bw / 2), vw - bw - 16) + 'px';
    const below = r.top + r.height / 2 < vh / 2;
    bub.style.top = below ? Math.min(top + h + 12, vh - bub.offsetHeight - 16) + 'px' : '';
    bub.style.bottom = below ? '' : Math.min(vh - top + 12, vh - bub.offsetHeight - 16) + 'px';
  };
  const show = () => {
    const el = document.querySelector(list[i].sel);
    if (!el) return next();
    const last = i === list.length - 1;
    bub.innerHTML = `<p>${list[i].text}</p><div class="tourrow"><button type="button" class="tourskip">${last ? '' : 'Пропустить'}</button><span class="tourn">${list.length > 1 ? `${i + 1} из ${list.length}` : ''}</span><button type="button" class="tournext">${last ? 'Понятно' : 'Дальше'}</button></div>`;
    bub.querySelector('.tournext').onclick = next;
    bub.querySelector('.tourskip').onclick = finish;
    // элемент — в видимую часть экрана, потом подсвечиваем
    const r = el.getBoundingClientRect();
    if (r.top < 60 || r.bottom > window.innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    requestAnimationFrame(() => { place(); bub.querySelector('.tournext').focus({ preventScroll: true }); });
  };
  function next() { i += 1; if (i >= list.length) finish(); else show(); }
  block.onclick = next;
  active = { hole, block, bub, place, root };
  window.addEventListener('resize', place);
  root.addEventListener('scroll', place, { passive: true });
  show();
}

function stop() {
  if (!active) return;
  active.hole.remove(); active.block.remove(); active.bub.remove();
  window.removeEventListener('resize', active.place);
  active.root.removeEventListener('scroll', active.place);
  active = null;
}
export const stopTour = stop;
