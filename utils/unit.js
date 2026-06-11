// utils/unit.js —— 单位转换层
// MVP 只支持 kg：所有函数都是恒等转换。
// 迭代二加 lb 时，只改这一个文件（按设置读取 kg/lb，做 ×0.453592 换算），
// 其余业务代码无需改动 —— 这是"不返工"的关键。

const store = require('./store.js');

const LB_TO_KG = 0.45359237;

// 当前单位：从本地设置读取，缺省 kg（迭代二启用 lb）
function currentUnit() {
  return store.getSettings().weightUnit || 'kg';
}

// 用户输入值 → 存库值（kg）
function toStore(inputValue) {
  const n = Number(inputValue);
  if (currentUnit() === 'lb') return n * LB_TO_KG; // 迭代二启用
  return n;
}

// 存库值（kg） → 显示值
function toDisplay(kgValue) {
  if (kgValue == null) return kgValue;
  if (currentUnit() === 'lb') return +(kgValue / LB_TO_KG).toFixed(1); // 迭代二启用
  return kgValue;
}

// 当前单位下的重量步进
function step() {
  return currentUnit() === 'lb' ? 5 : 2.5;
}

// 单位标签
function label() {
  return currentUnit();
}

module.exports = { currentUnit, toStore, toDisplay, step, label };
