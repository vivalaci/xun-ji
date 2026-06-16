// utils/calendar.js —— 训练月历的纯函数层（node 可测，无副作用）
// 纯读 workouts（date/name/_id），不依赖新集合/字段。

// 分化类型配色（见 change calendar-split-palette design D2）
// 原则：色相编码"系统"——三分化=蓝族、二分化=绿族、有氧=橙、其他=灰；
// 族内用色相弧+明度区分单日。蓝族往紫端铺、绿族往黄端铺，中间留空当保护族边界。
const TYPES = {
  // 三分化·蓝族（靛蓝→正蓝→天蓝）
  push:  { key: 'push',  label: '推',   color: '#4F46E5' }, // 推日·靛蓝
  pull:  { key: 'pull',  label: '拉',   color: '#2563EB' }, // 拉日·正蓝
  squat: { key: 'squat', label: '蹲',   color: '#0EA5E9' }, // 蹲日·天蓝
  // 二分化·绿族（深草绿 / 黄绿，偏黄端，避开蓝族青端与腰围琥珀）
  upper: { key: 'upper', label: '上肢', color: '#15803D' }, // 上肢·深草绿
  lower: { key: 'lower', label: '下肢', color: '#84CC16' }, // 下肢·黄绿
  // 有氧·橙（暖色孤立）；其他·灰
  cardio:{ key: 'cardio',label: '有氧', color: '#EA580C' }, // 有氧（橙）—— 按 workout.type 归类
  other: { key: 'other', label: '其他', color: '#9CA3AF' }  // 其他（灰）
};

// 图例分组：系统名 → 该系统单日色点。色值单一真源取自 TYPES，供页面复用，
// 不在 wxml/wxss 硬编码。强化"色族=系统"的心智模型。
const LEGEND_GROUPS = [
  { system: '三分化', items: [TYPES.push, TYPES.pull, TYPES.squat] },
  { system: '二分化', items: [TYPES.upper, TYPES.lower] },
  { system: '有氧',   items: [TYPES.cardio] },
  { system: '其他',   items: [TYPES.other] }
];

// 按训练名称归类。上肢/下肢先判，再判推/拉/蹲，其余归其他。
function classify(name) {
  const n = String(name || '');
  if (n.indexOf('上肢') >= 0) return TYPES.upper;
  if (n.indexOf('下肢') >= 0) return TYPES.lower;
  if (n.indexOf('推') >= 0) return TYPES.push;
  if (n.indexOf('拉') >= 0) return TYPES.pull;
  if (n.indexOf('蹲') >= 0 || n.indexOf('腿') >= 0) return TYPES.squat;
  return TYPES.other;
}

// 按日期聚合：{ 'YYYY-MM-DD': [{ _id, name, type }] }
function aggregateByDate(workouts) {
  const map = {};
  (workouts || []).forEach((w) => {
    if (!w.date) return;
    (map[w.date] = map[w.date] || []).push({
      _id: w._id,
      name: w.name || '训练',
      type: w.type === 'cardio' ? TYPES.cardio : classify(w.name)
    });
  });
  return map;
}

function pad2(n) { return String(n).padStart(2, '0'); }

// 当月有训练的不同日期数
function trainedDaysInMonth(byDate, year, month) {
  const prefix = `${year}-${pad2(month + 1)}-`; // month 为 0-11
  return Object.keys(byDate || {}).filter((d) => d.indexOf(prefix) === 0 && byDate[d].length).length;
}

// 生成月网格（周一起始，6×7=42 格补满）。
// 每格：{ day, dateStr, inMonth, isToday, dots:[color...], more:N, count }
// todayStr 由调用方传入（'YYYY-MM-DD'），保证纯函数可测。
function monthMatrix(year, month, byDate, todayStr) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 周一=0
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const items = (byDate && byDate[dateStr]) || [];
    const colors = items.map((it) => it.type.color);
    cells.push({
      day: d.getDate(),
      dateStr,
      inMonth: d.getMonth() === month,
      isToday: dateStr === todayStr,
      dots: colors.slice(0, 3),
      more: colors.length > 3 ? colors.length - 3 : 0,
      count: items.length
    });
  }

  // 末行整行非本月则裁掉（5 行足够时不显示空第 6 行）
  const rows = [];
  for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
  while (rows.length > 4 && rows[rows.length - 1].every((c) => !c.inMonth)) rows.pop();
  return [].concat.apply([], rows);
}

module.exports = { TYPES, LEGEND_GROUPS, classify, aggregateByDate, trainedDaysInMonth, monthMatrix };
