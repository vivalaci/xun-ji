// utils/unit.js —— 单位转换层
// MVP 只支持 kg：所有函数都是恒等转换。
// 迭代二加 lb 时，只改这一个文件（按设置读取 kg/lb，做 ×0.453592 换算），
// 其余业务代码无需改动 —— 这是"不返工"的关键。

const store = require('./store.js');

const LB_TO_KG = 0.45359237;

// 四舍五入到最近的 0.5（kg 量化）。返回数字：33.0→33、33.5→33.5（整数不带 .0）。
// 用途：lb 录入落库取整、训练组重量显示量化（见 change record-and-deadlift-fixes D2）。
function roundHalfKg(n) {
  return Math.round(Number(n) * 2) / 2;
}

// 当前单位：从本地设置读取，缺省 kg（迭代二启用 lb）
function currentUnit() {
  return store.getSettings().weightUnit || 'kg';
}

// 用户输入值 → 存库值（kg）。lb 录入取整到 0.5 kg；kg 录入完整精度。
function toStore(inputValue) {
  const n = Number(inputValue);
  if (currentUnit() === 'lb') return roundHalfKg(n * LB_TO_KG);
  return n;
}

// 存库值（kg） → 显示值（round 到 1 位，消除浮点长尾；Number 自动去掉末尾 .0）
function toDisplay(kgValue) {
  if (kgValue == null) return kgValue;
  if (currentUnit() === 'lb') return +(kgValue / LB_TO_KG).toFixed(1);
  return +Number(kgValue).toFixed(1);
}

// 当前单位下的重量步进
function step() {
  return currentUnit() === 'lb' ? 5 : 2.5;
}

// 单位标签
function label() {
  return currentUnit();
}

// ---- 显式单位换算族（不依赖全局主单位，供"本次输入单位"用，见 change per-entry-input-unit）----

// 指定源单位的输入值 → 存库值（kg）。lb 取整到 0.5 kg；kg 完整精度不 round。
function toStoreFrom(value, srcUnit) {
  const n = Number(value);
  return srcUnit === 'lb' ? roundHalfKg(n * LB_TO_KG) : n;
}

// kg → 指定目标单位的【训练组重量】显示值，四舍五入到 0.5（只现整数或 .5）。
// 返回数字（整数不带 .0）；null/'' 透传。体重等身体数据请用 toDisplay（保留 0.1）。
function toDisplayWeight(kgValue, dstUnit) {
  if (kgValue == null || kgValue === '') return kgValue;
  const v = dstUnit === 'lb' ? Number(kgValue) / LB_TO_KG : Number(kgValue);
  return roundHalfKg(v);
}

// kg → 指定目标单位的显示值（round 到 1 位，去浮点长尾）；null/'' 透传
function toDisplayIn(kgValue, dstUnit) {
  if (kgValue == null || kgValue === '') return kgValue;
  return dstUnit === 'lb'
    ? +(Number(kgValue) / LB_TO_KG).toFixed(1)
    : +Number(kgValue).toFixed(1);
}

// 指定单位的步进
function stepFor(u) {
  return u === 'lb' ? 5 : 2.5;
}

module.exports = { currentUnit, toStore, toDisplay, step, label, roundHalfKg, toStoreFrom, toDisplayIn, toDisplayWeight, stepFor };
