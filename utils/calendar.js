// utils/calendar.js —— 训练月历的纯函数层（node 可测，无副作用）
// 纯读 workouts（date/name/_id），不依赖新集合/字段。

// 分化类型配色（见 change training-calendar design D2）
const TYPES = {
  push:  { key: 'push',  color: '#1D4ED8' }, // 推（蓝）
  pull:  { key: 'pull',  color: '#0891B2' }, // 拉（青）
  squat: { key: 'squat', color: '#7C3AED' }, // 蹲（紫）
  upper: { key: 'upper', color: '#059669' }, // 上肢（绿）—— 避开腰围琥珀
  lower: { key: 'lower', color: '#DB2777' }, // 下肢（玫红）
  other: { key: 'other', color: '#9CA3AF' }  // 其他（灰）
};

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
      type: classify(w.name)
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

module.exports = { TYPES, classify, aggregateByDate, trainedDaysInMonth, monthMatrix };
