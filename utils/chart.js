// utils/chart.js —— 折线图绘制（Canvas 2D，无第三方库）
// 用法：传入 canvas 节点、CSS 尺寸、数据点和颜色，自动处理高清屏缩放。

// points: [{ x: '2026-06-06', y: 100 }, ...]（按时间升序）
function drawLineChart({ canvas, ctx, width, height, dpr, points, color, yDecimals = 1 }) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (!points || points.length === 0) {
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }
  if (points.length === 1) {
    // 只有一个点：画个点 + 数值
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Number(points[0].y).toFixed(yDecimals), width / 2, height / 2 - 12);
    return;
  }

  const pad = { l: 36, r: 14, t: 14, b: 18 };
  const ys = points.map((p) => p.y);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  min -= range * 0.18;
  max += range * 0.18;

  const px = (i) => pad.l + (i / (points.length - 1)) * (width - pad.l - pad.r);
  const py = (v) => pad.t + (1 - (v - min) / (max - min)) * (height - pad.t - pad.b);

  // 网格 + Y 轴刻度（3 档）
  ctx.strokeStyle = '#F3F4F6';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let g = 0; g <= 3; g++) {
    const v = min + (max - min) * (g / 3);
    const y = py(v);
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(width - pad.r, y);
    ctx.stroke();
    ctx.fillText(v.toFixed(yDecimals), pad.l - 5, y + 3.5);
  }

  // 折线
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = px(i);
    const y = py(p.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 数据点
  ctx.fillStyle = color;
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(px(i), py(p.y), 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 由数据 ys 与最小尺度 minSpan 求 y 轴缩放区间 {lo,hi}（纯函数，便于单测）。
// 实际跨度 ≥ minSpan：按数据跨度缩放（含 18% 边距）；< minSpan：按 minSpan 居中扩展，
// 使极小波动呈近平稳而非被放大成贯穿全图的大斜线。单点/全等且无 minSpan：退化为 ±1。
function computeBand(ys, minSpan) {
  if (!ys || !ys.length) return { lo: 0, hi: 1 };
  const mn = Math.min.apply(null, ys);
  const mx = Math.max.apply(null, ys);
  const span = mx - mn;
  const eff = Math.max(span, minSpan || 0);
  if (eff === 0) return { lo: mn - 1, hi: mx + 1 }; // 单点/全等且无 minSpan
  const center = (mn + mx) / 2;
  const pad = eff * 0.18;
  return { lo: center - eff / 2 - pad, hi: center + eff / 2 + pad };
}

// 多线图：每条线按自身 min/max 独立缩放（只看趋势），X 轴按日期对齐，无共用 Y 轴。
// series: [{ points:[{x:'YYYY-MM-DD', y}], color, minSpan? }]
// minSpan（显示单位计）：见 computeBand。近平线按序号做像素级垂直错位，避免多条平线
// 在各自 band 中心精确重合相互遮挡（如体重线落腰围之下被盖住）。
function drawMultiLine({ canvas, ctx, width, height, dpr, series }) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const active = (series || []).filter((s) => s.points && s.points.length);
  if (!active.length) {
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }

  const pad = { l: 14, r: 14, t: 14, b: 18 };
  // 全局时间范围（X 轴对齐用）
  let tsMin = Infinity;
  let tsMax = -Infinity;
  active.forEach((s) => s.points.forEach((p) => {
    const t = new Date(p.x).getTime();
    if (t < tsMin) tsMin = t;
    if (t > tsMax) tsMax = t;
  }));
  const spanX = tsMax - tsMin;
  const px = (x) => (spanX ? pad.l + (new Date(x).getTime() - tsMin) / spanX * (width - pad.l - pad.r) : width / 2);

  // 每条线的缩放区间，并标记近平线（垂直占比极小者）
  const bands = active.map((s) => {
    const ys = s.points.map((p) => p.y);
    const band = computeBand(ys, s.minSpan);
    const span = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    const h = band.hi - band.lo;
    return { band, flat: h > 0 ? span / h < 0.15 : true };
  });
  // 近平线按出现序号围绕中心扇形错开（像素级）
  const FLAT_STEP = 6;
  const flatIdx = [];
  bands.forEach((b, i) => { if (b.flat) flatIdx.push(i); });
  const offsets = {};
  flatIdx.forEach((i, k) => { offsets[i] = (k - (flatIdx.length - 1) / 2) * FLAT_STEP; });

  active.forEach((s, idx) => {
    const { lo, hi } = bands[idx].band;
    const off = offsets[idx] || 0;
    const py = (v) => {
      const y = pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b) + off;
      return Math.max(pad.t, Math.min(height - pad.b, y)); // 夹取在绘图区内
    };

    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const x = px(p.x);
      const y = py(p.y);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = s.color;
    s.points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

module.exports = { drawLineChart, drawMultiLine, computeBand };
