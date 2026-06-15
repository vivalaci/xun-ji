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

module.exports = { drawLineChart };
