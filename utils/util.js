// utils/util.js —— 通用工具函数

// Date/时间戳 → YYYY-MM-DD
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 是否「今天」：与落库同源用 formatDate 的本地 YYYY-MM-DD 字符串等值比较。
function isToday(date) {
  return date === formatDate();
}

// → M月D日
function formatMonthDay(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function weekDay(date) {
  return WEEK[new Date(date).getDay()];
}

// 核心算法：计算某个动作某次训练的【主力工作组重量】
// 规则：按重量分组统计组数，取组数最多的重量；若并列，取较重的一个。
// 例：50×5 / 50×5 / 52.5×4 → 50 出现2组、52.5 出现1组 → 返回 50
function mainWorkingWeight(sets) {
  if (!sets || sets.length === 0) return null;
  const count = {}; // weight -> 组数
  sets.forEach((s) => {
    const w = Number(s.weight);
    if (!w) return; // 0 或空重量不计入
    count[w] = (count[w] || 0) + 1;
  });
  const weights = Object.keys(count).map(Number);
  if (weights.length === 0) return null;
  weights.sort((a, b) => {
    // 组数多的优先；组数相同则重量大的优先
    if (count[b] !== count[a]) return count[b] - count[a];
    return b - a;
  });
  return weights[0];
}

// 重量列展示文本（不含单位，与既有 "50×5" 风格一致，由调用方拼 ×reps）。
// 入参 displayWeight 为「已换算到显示单位」的数值（即 unit.toDisplay 的结果）。
//   weighted（默认）: 返回数值字符串，如 "50"；空/缺省返回 ''。
//   bodyweight     : 0/空 → "自重"；>0 → "自重+20"（额外负重）；<0 → "辅助−15"（防御回退，本迭代不录入负值）。
function formatLoad(displayWeight, loadType) {
  const w = (displayWeight === '' || displayWeight == null) ? null : Number(displayWeight);
  if (loadType === 'bodyweight') {
    if (w == null || w === 0) return '自重';
    return w > 0 ? '自重+' + w : '辅助−' + Math.abs(w);
  }
  return w == null ? '' : String(w);
}

// 训练总容量 Σ(重量×次数)
function totalVolume(exercises) {
  let v = 0;
  (exercises || []).forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      v += (Number(s.weight) || 0) * (Number(s.reps) || 0);
    });
  });
  return Math.round(v);
}

// 总组数
function totalSets(exercises) {
  return (exercises || []).reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0);
}

// PR（个人记录）现算：扫描全部训练，标记每个动作主力工作组重量创新高的那一次。
// 返回 { [workoutId]: Set(exerciseId...) }，读取侧用，不落库（编辑历史可自动重算）。
function buildPRMap(workouts) {
  const map = {};
  // 收集每个动作的 (date, workoutId, mww)
  const byEx = {};
  (workouts || []).forEach((w) => {
    (w.exercises || []).forEach((ex) => {
      const mww = mainWorkingWeight(ex.sets);
      if (mww == null) return;
      (byEx[ex.exerciseId] = byEx[ex.exerciseId] || []).push({
        workoutId: w._id, date: w.date, mww
      });
    });
  });
  Object.keys(byEx).forEach((exId) => {
    const arr = byEx[exId].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningMax = -Infinity;
    arr.forEach((it) => {
      if (it.mww > runningMax) {
        runningMax = it.mww;
        (map[it.workoutId] = map[it.workoutId] || new Set()).add(exId);
      }
    });
  });
  return map;
}

// 某次训练在一组动作（ids）上的当日数据点：取各匹配动作主力工作组重量的最大值。
// 用于硬拉等"变式聚合"曲线（硬拉/罗马尼亚硬拉/直腿硬拉，当日通常只练其一，多则取最大）。
// 单 id 传 [id] 退化为原单动作行为。无匹配/无有效重量返回 null（断线不补零）。
function dayLiftValue(workout, ids) {
  if (!workout || !ids || !ids.length) return null;
  let max = null;
  (workout.exercises || []).forEach((ex) => {
    if (ids.indexOf(ex.exerciseId) < 0) return;
    const mww = mainWorkingWeight(ex.sets);
    if (mww == null) return;
    if (max == null || mww > max) max = mww;
  });
  return max;
}

// 时间范围起始时间戳：'1M' | '3M' | '6M' | 'ALL'
function rangeStartTs(range) {
  if (range === 'ALL') return 0;
  const months = { '1M': 1, '3M': 3, '6M': 6 }[range] || 3;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.getTime();
}

module.exports = {
  formatDate,
  isToday,
  formatMonthDay,
  weekDay,
  mainWorkingWeight,
  formatLoad,
  totalVolume,
  totalSets,
  buildPRMap,
  dayLiftValue,
  rangeStartTs
};
