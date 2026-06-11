// utils/util.js —— 通用工具函数

// 把 Date 或时间戳格式化成 YYYY-MM-DD
function formatDate(date) {
  const d = date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 格式化成 MM月DD日
function formatMonthDay(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 中文星期
const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function weekDay(date) {
  return WEEK[new Date(date).getDay()];
}

// 计算训练总容量（重量 × 次数 之和），单位 kg
function totalVolume(exercises) {
  let v = 0;
  (exercises || []).forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      v += (Number(s.weight) || 0) * (Number(s.reps) || 0);
    });
  });
  return Math.round(v);
}

// 统计训练总组数
function totalSets(exercises) {
  return (exercises || []).reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0);
}

module.exports = {
  formatDate,
  formatMonthDay,
  weekDay,
  totalVolume,
  totalSets
};
