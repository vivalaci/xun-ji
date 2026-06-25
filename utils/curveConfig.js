// utils/curveConfig.js —— 曲线首页配置的纯函数层（node 可测）
// 配置形态（user_prefs 单文档，见 change custom-curves design D1）：
//   { curveOrder: [key...], customCurves: [{ key:'ex_<exerciseId>', exerciseId, slot }] }
// 渲染合成对缺省/脏数据自愈：缺固定 key 追加、未知 key 剔除、已删动作占位名。

const exerciseLib = require('./exerciseLib.js');

// 硬拉家族：固定「硬拉」曲线与其详情都聚合这三个变式（通常每次只练其一）。
// 单一来源——首页曲线（FIXED_CHARTS.ids）与动作详情（familyFor）共用。
const DEADLIFT_FAMILY = ['deadlift', 'rdl', 'stiff_leg_deadlift'];

// 给定动作 id 解析其聚合家族：仅「硬拉」锚点展开为家族，其它（含 rdl/直腿单独曲线）保持单一。
function familyFor(exerciseId) {
  return exerciseId === 'deadlift' ? DEADLIFT_FAMILY.slice() : [exerciseId];
}

// 身体趋势三线配置——已从首页迁至「身体」页（见 change move-body-trend-to-body-page）。
// minSpan：该指标允许的最小取值跨度（显示单位计；体重在 lb 下由调用方经 unit 换算），
// 小于它的波动按它居中扩展，避免微小变化被放大成大斜线（见 chart.computeBand）。
const BODY_SERIES = [
  { field: 'weight',  name: '体重', unit: 'kg', color: '#111827', convert: true, minSpan: 5 },
  { field: 'bodyFat', name: '体脂', unit: '%',  color: '#6B7280', minSpan: 5 },
  { field: 'waist',   name: '腰围', unit: 'cm', color: '#D97706', minSpan: 5 }
];

// 固定 3 项（不可删，仅可排序）：三大项。身体趋势已迁至「身体」页。颜色见 docs/05
const FIXED_CHARTS = [
  { key: 'bench',    type: 'lift', id: 'bench',    name: '卧推', unit: 'kg', color: '#1D4ED8', fixed: true },
  { key: 'squat',    type: 'lift', id: 'squat',    name: '深蹲', unit: 'kg', color: '#7C3AED', fixed: true },
  { key: 'deadlift', type: 'lift', id: 'deadlift', ids: DEADLIFT_FAMILY, name: '硬拉', unit: 'kg', color: '#0891B2', fixed: true }
];

// 自定义曲线按槽位配色（上限 2 条）；避开腰围琥珀(#D97706)与下肢玫红(#DB2777)
const CUSTOM_PALETTE = ['#DC2626', '#C026D3']; // 红、品红
const MAX_CUSTOM = 2;

function customKey(exerciseId) {
  return 'ex_' + exerciseId;
}

// 合成渲染用图表定义列表。prefs 可为 null/缺字段（返回默认 5 条）。
function composeCharts(prefs) {
  const customs = (prefs && prefs.customCurves) || [];
  // key -> 定义
  const defs = {};
  FIXED_CHARTS.forEach((c) => { defs[c.key] = c; });
  customs.forEach((cc) => {
    defs[cc.key] = {
      key: cc.key,
      type: 'lift',
      id: cc.exerciseId,
      name: exerciseLib.getName(cc.exerciseId), // 已删自建动作回退占位名
      unit: 'kg',
      color: CUSTOM_PALETTE[cc.slot % CUSTOM_PALETTE.length],
      fixed: false
    };
  });

  const order = (prefs && prefs.curveOrder) || [];
  const seen = {};
  const result = [];
  order.forEach((k) => {
    if (defs[k] && !seen[k]) { seen[k] = true; result.push(defs[k]); } // 未知 key 剔除
  });
  // 缺失的 key（新装/配置损坏）按默认序追加：先固定后自定义
  FIXED_CHARTS.forEach((c) => { if (!seen[c.key]) { seen[c.key] = true; result.push(c); } });
  customs.forEach((cc) => { if (!seen[cc.key]) { seen[cc.key] = true; result.push(defs[cc.key]); } });
  return result;
}

// 默认配置（首次建 user_prefs 文档用）
function defaultPrefs() {
  return { curveOrder: FIXED_CHARTS.map((c) => c.key), customCurves: [] };
}

// 上移/下移：返回新数组；越界（首行上移/末行下移）原样返回
function moveKey(order, key, dir) {
  const arr = (order || []).slice();
  const i = arr.indexOf(key);
  if (i < 0) return arr;
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= arr.length) return arr;
  arr[i] = arr[j];
  arr[j] = key;
  return arr;
}

// 添加自定义曲线：防重复（含三大项）、上限 2、取最小空闲槽位。
// 返回 { ok, reason?, prefs? }（prefs 为新对象，不改入参）
function addCustom(prefs, exerciseId) {
  const p = {
    curveOrder: ((prefs && prefs.curveOrder) || defaultPrefs().curveOrder).slice(),
    customCurves: ((prefs && prefs.customCurves) || []).slice()
  };
  if (p.customCurves.length >= MAX_CUSTOM) return { ok: false, reason: 'limit' };
  const key = customKey(exerciseId);
  const shown = composeCharts(p).some((c) => c.type === 'lift' && c.id === exerciseId);
  if (shown || p.curveOrder.indexOf(key) >= 0) return { ok: false, reason: 'duplicate' };
  const usedSlots = p.customCurves.map((c) => c.slot);
  let slot = 0;
  while (usedSlots.indexOf(slot) >= 0) slot++;
  p.customCurves.push({ key, exerciseId, slot });
  p.curveOrder.push(key);
  return { ok: true, prefs: p };
}

// 删除自定义曲线（固定 key 不受影响）。返回新 prefs。
function removeCustom(prefs, key) {
  return {
    curveOrder: ((prefs && prefs.curveOrder) || []).filter((k) => k !== key),
    customCurves: ((prefs && prefs.customCurves) || []).filter((c) => c.key !== key)
  };
}

module.exports = {
  FIXED_CHARTS,
  BODY_SERIES,
  DEADLIFT_FAMILY,
  familyFor,
  CUSTOM_PALETTE,
  MAX_CUSTOM,
  customKey,
  composeCharts,
  defaultPrefs,
  moveKey,
  addCustom,
  removeCustom
};
