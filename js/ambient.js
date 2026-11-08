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

// Дым над костром: мягкие клубы колышутся и тают
KINDS.smoke = function (L) {
  const st = L.st;
  const [fx, fy] = mapPoint(L.box, L.o.ix, L.o.iy, L.o.py);
  if (Math.random() < 0.12) st.p.push({ x: fx + rnd(-4, 4), y: fy - 14, vy: rnd(-0.45, -0.28), life: 0, max: rnd(220, 320), ph: rnd(0, 6), s: rnd(2, 3) });
  for (const p of st.p) { p.life++; p.ph += 0.025; p.y += p.vy; p.x += Math.sin(p.ph) * 0.35 + (L.o.drift || -0.08); p.s += 0.012; }
  st.p = st.p.filter((p) => p.life < p.max);
  const out = [];
  for (const p of st.p) {
    const a = Math.sin((p.life / p.max) * Math.PI) * 0.22;
    const r = Math.round(p.s);
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (dx * dx + dy * dy <= r * r) out.push([p.x + dx * PX, p.y + dy * PX, '#D9D2E6', a, 1]);
  }
  return out;
};
// Светлячки: бродят по поляне и мигают
KINDS.fireflies = function (L) {
  const st = L.st, { w, h } = L.box;
  const n = L.o.n || 10;
  while (st.p.length < n) st.p.push({ x: rnd(0, w), y: rnd(h * 0.15, h * 0.9), a: rnd(0, 6), sp: rnd(0.25, 0.5), ph: rnd(0, 6), bl: rnd(0.02, 0.05) });
  const out = [];
  for (const p of st.p) {
    p.a += rnd(-0.12, 0.12); p.x += Math.cos(p.a) * p.sp; p.y += Math.sin(p.a) * p.sp * 0.6; p.ph += p.bl;
    if (p.x < 0 || p.x > w) p.a = Math.PI - p.a;
    if (p.y < h * 0.1 || p.y > h * 0.95) p.a = -p.a;
    const lit = Math.max(0, Math.sin(p.ph));
    out.push([p.x, p.y, '#E8FF9A', lit, 2]);
    if (lit > 0.4) out.push([p.x - PX, p.y, '#B6E35A', lit * 0.5, 1], [p.x + PX * 2, p.y, '#B6E35A', lit * 0.5, 1], [p.x, p.y - PX, '#B6E35A', lit * 0.5, 1], [p.x, p.y + PX * 2, '#B6E35A', lit * 0.5, 1]);
  }
  return out;
};
// Акварельное свечение: от фонарей и свечей мягко расходится свет
KINDS.glow = {
  soft: true,
  draw(L, ctx) {
    const st = L.st;
    st.t = (st.t || 0) + 1;
    const lights = L.o.lights || [];
    st.rip ||= [];
    if (Math.random() < 0.025 && lights.length) { const i = Math.floor(Math.random() * lights.length); st.rip.push({ i, life: 0, max: rnd(150, 220) }); }
    ctx.globalCompositeOperation = 'lighter';
    lights.forEach(([ix, iy, size], i) => {
      const [x, y] = mapPoint(L.box, ix, iy, L.o.py);
      const r0 = (size || 1) * L.box.w * 0.045;
      const breathe = 0.5 + 0.5 * Math.sin(st.t * 0.02 + i * 1.7);
      const r = r0 * (1.3 + 0.25 * breathe);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,214,140,${0.22 + 0.16 * breathe})`);
      g.addColorStop(0.45, `rgba(255,190,110,${0.1 + 0.07 * breathe})`);
      g.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    for (const rp of st.rip) {
      rp.life++;
      const [ix, iy, size] = lights[rp.i] || [0, 0, 1];
      const [x, y] = mapPoint(L.box, ix, iy, L.o.py);
      const k = rp.life / rp.max;
      const R = (size || 1) * L.box.w * (0.05 + 0.16 * k);
      const a = 0.2 * Math.sin(k * Math.PI);
      const g = ctx.createRadialGradient(x, y, R * 0.55, x, y, R);
      g.addColorStop(0, 'rgba(255,220,160,0)');
      g.addColorStop(0.7, `rgba(255,214,150,${a})`);
      g.addColorStop(1, 'rgba(255,200,130,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    }
    st.rip = st.rip.filter((rp) => rp.life < rp.max);
    ctx.globalCompositeOperation = 'source-over';
  }
};

function frame() {
  for (const L of layers) {
    const ctx = L.ctx;
    const K = KINDS[L.kind];
    if (K.soft) {
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      ctx.clearRect(0, 0, L.box.w, L.box.h);
      K.draw(L, ctx);
      continue;
    }
    const pts = K(L);
    ctx.clearRect(0, 0, L.cw, L.ch);
    for (const [x, y, c, a, sz0] of pts) {
      if (a <= 0) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = c;
      const sz = Math.max(1, Math.round(sz0));
      ctx.fillRect(Math.round(x / PX), Math.round(y / PX), sz, sz);
    }
    ctx.globalAlpha = 1;
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
    const all = JSON.parse(host.dataset.ambo || '{}');
    const baseKey = host.dataset.ambkey || host.dataset.amb;
    for (const kind of host.dataset.amb.split(' ')) {
      if (!KINDS[kind]) continue;
      const soft = !!KINDS[kind].soft;
      let cv = host.querySelector(`canvas.amb[data-k="${kind}"]`);
      if (!cv) { cv = document.createElement('canvas'); cv.className = 'amb' + (soft ? ' soft' : ''); cv.dataset.k = kind; cv.setAttribute('aria-hidden', 'true'); host.appendChild(cv); }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = soft ? Math.ceil(r.width * dpr) : Math.ceil(r.width / PX);
      const ch = soft ? Math.ceil(r.height * dpr) : Math.ceil(r.height / PX);
      cv.width = cw; cv.height = ch;
      const o = Object.assign({}, all, all[kind] || {});
      const key = baseKey + ':' + kind;
      const st = store[key] ||= { p: [] };
      if (st.w && (st.w !== r.width || st.h !== r.height)) { st.p = []; st.rip = []; }
      st.w = r.width; st.h = r.height;
      layers.push({ kind, o, st, ctx: cv.getContext('2d'), cw, ch, dpr, box: { w: r.width, h: r.height } });
    }
  });
  if (layers.length) raf = requestAnimationFrame(frame);
}
