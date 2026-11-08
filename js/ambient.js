// Тихая жизнь картинок: искры костра, пылинки, мерцание нитей, блеск монет.
// Рисуем «крупными пикселями», чтобы анимация не спорила с пиксель-артом.
const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PX = 2; // размер «пикселя» холста относительно CSS-пикселей
const store = {}; // частицы переживают перерисовку экрана
let raf = null;
let layers = [];

const rnd = (a, b) => a + Math.random() * (b - a);

// Перевод точки на исходной картинке (0..1) в координаты блока с object-fit: cover
function mapPoint(box, ix, iy, posY = 0.5, nw = 768, nh = 1376) {
  const w = box.w, h = box.h;
  const s = Math.max(w / nw, h / nh);
  const dw = nw * s, dh = nh * s;
  const ox = (w - dw) * 0.5, oy = (h - dh) * posY;
  return [ox + ix * dw, oy + iy * dh];
}

const KINDS = {
  // Искры над костром
  embers(L) {
    const st = L.st;
    const [fx, fy] = mapPoint(L.box, L.o.ix, L.o.iy, L.o.py);
    if (Math.random() < 0.22) st.p.push({ x: fx + rnd(-10, 10), y: fy + rnd(-4, 4), vx: rnd(-0.15, 0.15), vy: rnd(-0.9, -0.45), life: 0, max: rnd(70, 150), c: ['#FFE08A', '#FFB347', '#FF7A2E'][Math.floor(Math.random() * 3)], ph: rnd(0, 6) });
    for (const p of st.p) { p.life++; p.ph += 0.08; p.x += p.vx + Math.sin(p.ph) * 0.25; p.y += p.vy; p.vy *= 0.997; }
    st.p = st.p.filter((p) => p.life < p.max);
    return st.p.map((p) => [p.x, p.y, p.c, 1 - p.life / p.max, p.life % 20 < 10 ? 2 : 1]);
  },
  // Светлячки и пылинки
  motes(L) {
    const st = L.st, { w, h } = L.box;
    const n = L.o.n || 18;
    while (st.p.length < n) st.p.push({ x: rnd(0, w), y: rnd(h * (L.o.top || 0), h), vx: rnd(-0.12, 0.12), vy: rnd(-0.18, -0.03), ph: rnd(0, 6), sp: rnd(0.01, 0.035) });
    for (const p of st.p) {
      p.ph += p.sp; p.x += p.vx + Math.sin(p.ph * 0.7) * 0.15; p.y += p.vy;
      if (p.y < -4 || p.x < -4 || p.x > w + 4) { p.x = rnd(0, w); p.y = h + 2; }
    }
    return st.p.map((p) => [p.x, p.y, L.o.c || '#FFE9A8', 0.25 + 0.75 * Math.max(0, Math.sin(p.ph)), 2]);
  },
  // Мерцание нитей и бегущий стежок на гобелене
  stitches(L) {
    const st = L.st, { w, h } = L.box;
    const spots = L.o.spots || [];
    if (st.p.length < 12 && Math.random() < 0.1) {
      const near = spots.length && Math.random() < 0.45 ? spots[Math.floor(Math.random() * spots.length)] : null;
      const x = near ? near[0] * w + rnd(-near[2], near[2]) * w : rnd(0.08, 0.92) * w;
      const y = near ? near[1] * h + rnd(-near[2], near[2]) * w : rnd(0.06, 0.94) * h;
      st.p.push({ x, y, life: 0, max: rnd(60, 120), c: ['#F3D27A', '#FFF3C8', '#E9A86A'][Math.floor(Math.random() * 3)] });
    }
    if (!st.run && Math.random() < 0.006) st.run = { x: rnd(0.1, 0.7) * w, y: rnd(0.15, 0.9) * h, dx: rnd(0.5, 0.9), dy: rnd(-0.15, 0.15), life: 0, max: 140 };
    const out = [];
    for (const p of st.p) {
      p.life++;
      const a = Math.sin((p.life / p.max) * Math.PI);
      // крестик-стежок
      out.push([p.x, p.y, p.c, a, 2], [p.x - 2, p.y - 2, p.c, a * 0.7, 1], [p.x + 2, p.y + 2, p.c, a * 0.7, 1], [p.x + 2, p.y - 2, p.c, a * 0.7, 1], [p.x - 2, p.y + 2, p.c, a * 0.7, 1]);
    }
    st.p = st.p.filter((p) => p.life < p.max);
    if (st.run) {
      const r = st.run; r.life++;
      const a = Math.sin((r.life / r.max) * Math.PI) * 0.8;
      for (let k = 0; k < 7; k++) out.push([r.x + r.dx * (r.life - k * 3), r.y + r.dy * (r.life - k * 3), '#F3D27A', a * (1 - k / 7), 1.5]);
      if (r.life >= r.max) st.run = null;
    }
    return out;
  },
  // Блеск монет и изредка падающая монетка
  coins(L) {
    const st = L.st, { w, h } = L.box;
    if (st.p.length < 6 && Math.random() < 0.05) st.p.push({ x: rnd(0.08, 0.92) * w, y: rnd(L.o.y0 || 0.45, L.o.y1 || 0.95) * h, life: 0, max: rnd(40, 80) });
    const out = [];
    for (const g of st.p) {
      g.life++;
      const a = Math.sin((g.life / g.max) * Math.PI);
      const r = Math.round(a * 4);
      out.push([g.x, g.y, '#FFFDF0', a, 2]);
      for (let k = 1; k <= r; k++) out.push([g.x + k * 2, g.y, '#FFE9A8', a * (1 - k / 5), 1], [g.x - k * 2, g.y, '#FFE9A8', a * (1 - k / 5), 1], [g.x, g.y + k * 2, '#FFE9A8', a * (1 - k / 5), 1], [g.x, g.y - k * 2, '#FFE9A8', a * (1 - k / 5), 1]);
    }
    st.p = st.p.filter((g) => g.life < g.max);
    st.t = (st.t || 0) + 1;
    if (!st.coin && st.t > (st.next || 240)) {
      st.t = 0; st.next = rnd(300, 600);
      st.coin = { x: rnd(0.15, 0.85) * w, y: (L.o.y0 || 0.45) * h - 10, vy: -1.2, vx: rnd(-0.4, 0.4), spin: 0, bounce: 0, floor: rnd(0.85, 0.97) * h };
    }
    if (st.coin) {
      const c = st.coin;
      c.vy += 0.12; c.x += c.vx; c.y += c.vy; c.spin += 0.25;
      if (c.y > c.floor) { c.y = c.floor; c.vy *= -0.35; c.bounce++; c.vx *= 0.6; }
      const wid = Math.max(1, Math.round(Math.abs(Math.cos(c.spin)) * 3));
      const a = c.bounce > 2 ? Math.max(0, 1 - (c.bounce - 2) * 0.5) : 1;
      for (let dx = -wid; dx <= wid; dx++) for (let dy = -3; dy <= 3; dy++) {
        if (dx * dx / ((wid + 0.5) ** 2) + dy * dy / 12 > 1) continue;
        out.push([c.x + dx * 2, c.y + dy * 2, Math.abs(dx) === wid || Math.abs(dy) === 3 ? '#B8862E' : '#F2C14E', a, 1]);
      }
      if (c.bounce > 4) st.coin = null;
    }
    return out;
  }
};

function frame() {
  for (const L of layers) {
    const pts = KINDS[L.kind](L);
    const ctx = L.ctx;
    ctx.clearRect(0, 0, L.cw, L.ch);
    for (const [x, y, c, a, s] of pts) {
      if (a <= 0) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = c;
      const sz = Math.max(1, Math.round(s));
      ctx.fillRect(Math.round(x / PX), Math.round(y / PX), sz, sz);
    }
  }
  raf = layers.length ? requestAnimationFrame(frame) : null;
}

// Вызывается после каждой отрисовки экрана
export function startAmbient(root = document) {
  layers = [];
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (reduce) return;
  root.querySelectorAll('[data-amb]').forEach((host) => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let cv = host.querySelector('canvas.amb');
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'amb'; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv); }
    const cw = Math.ceil(r.width / PX), ch = Math.ceil(r.height / PX);
    cv.width = cw; cv.height = ch;
    const kind = host.dataset.amb;
    const o = JSON.parse(host.dataset.ambo || '{}');
    const key = host.dataset.ambkey || kind;
    const st = store[key] ||= { p: [] };
    if (st.w && (st.w !== r.width || st.h !== r.height)) st.p = [];
    st.w = r.width; st.h = r.height;
    layers.push({ kind, o, st, ctx: cv.getContext('2d'), cw, ch, box: { w: r.width, h: r.height } });
  });
  if (layers.length) raf = requestAnimationFrame(frame);
}
