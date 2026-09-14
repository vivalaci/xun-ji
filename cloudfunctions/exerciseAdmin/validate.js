// cloudfunctions/exerciseAdmin/validate.js —— 写入校验（纯函数，无依赖）
// 云函数按目录独立部署，不能 require 小程序端代码，故 MAIN_LIFTS 在此自带一份。
// 与 config/exercises.js 的三大项保持一致（bench/squat/deadlift，id 恒不变）。
// 纯函数便于在 tests/algo.test.js 直接单测（本地 node --check 覆盖不到云函数运行时）。

const MAIN_LIFTS = ['bench', 'squat', 'deadlift'];

// patch 允许改的字段白名单：id 不在其中 —— 动作 id 不可改（历史记录按 id 聚合）
const PATCH_FIELDS = ['name', 'category', 'aliases', 'hidden'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function sanitizeAliases(aliases) {
  if (!Array.isArray(aliases)) return null;
  const out = aliases.map((a) => String(a).trim()).filter((a) => a.length > 0);
  return out;
}

// 校验 patch（改内置/全局动作）：返回 { ok, message?, fields? }
// fields 为清洗后的可落库字段；至少要有一个合法字段才放行。
function validatePatch(targetId, patch) {
  if (!isNonEmptyString(targetId)) return { ok: false, message: '缺少目标动作 id' };
  if (!patch || typeof patch !== 'object') return { ok: false, message: '缺少修改内容' };
  const unknown = Object.keys(patch).filter((k) => PATCH_FIELDS.indexOf(k) < 0);
  if (unknown.length) return { ok: false, message: '不允许修改字段：' + unknown.join(',') }; // 含改 id / 删除等
  const fields = {};
  if ('name' in patch) {
    if (!isNonEmptyString(patch.name)) return { ok: false, message: '名称不能为空' };
    fields.name = patch.name.trim();
  }
  if ('category' in patch) {
    if (!isNonEmptyString(patch.category)) return { ok: false, message: '分类不能为空' };
    fields.category = patch.category.trim();
  }
  if ('aliases' in patch) {
    const a = sanitizeAliases(patch.aliases);
    if (a === null) return { ok: false, message: '别名须为数组' };
    fields.aliases = a;
  }
  if ('hidden' in patch) {
    if (typeof patch.hidden !== 'boolean') return { ok: false, message: 'hidden 须为布尔' };
    // 三大项与首页曲线硬绑定，服务端强制禁止隐藏（不能只靠客户端 UI）
    if (patch.hidden === true && MAIN_LIFTS.indexOf(targetId.trim()) >= 0) {
      return { ok: false, message: '三大项不可隐藏' };
    }
    fields.hidden = patch.hidden;
  }
  if (!Object.keys(fields).length) return { ok: false, message: '没有可保存的修改' };
  return { ok: true, fields: fields, targetId: targetId.trim() };
}

// 全局动作 id 形态：gbl_ 前缀（与内置/cus_ 命名空间隔离）
function isGlobalId(id) {
  return typeof id === 'string' && /^gbl_[A-Za-z0-9_]+$/.test(id.trim());
}

// 校验新增全局动作：gbl_ 前缀强制，existingIds 查重。
function validateNewExercise(exercise, existingIds) {
  if (!exercise || typeof exercise !== 'object') return { ok: false, message: '缺少动作内容' };
  if (!isNonEmptyString(exercise.id) || !isGlobalId(exercise.id)) {
    return { ok: false, message: '全局动作 id 须为 gbl_ 前缀' };
  }
  const id = exercise.id.trim();
  if ((existingIds || []).indexOf(id) >= 0) return { ok: false, message: '动作 id 已存在' };
  if (!isNonEmptyString(exercise.name)) return { ok: false, message: '名称不能为空' };
  if (!isNonEmptyString(exercise.category)) return { ok: false, message: '分类不能为空' };
  const doc = { id: id, name: exercise.name.trim(), category: exercise.category.trim() };
  if ('aliases' in exercise) {
    const a = sanitizeAliases(exercise.aliases);
    if (a === null) return { ok: false, message: '别名须为数组' };
    doc.aliases = a;
  }
  return { ok: true, doc: doc };
}

// 清洗类别顺序：只收非空字符串、去重；「有氧」恒置末由客户端合并层保证，order 不收录它。
function sanitizeCategoryOrder(order) {
  if (!Array.isArray(order)) return { ok: false, message: '顺序须为数组' };
  const out = [];
  order.forEach((c) => {
    const s = String(c).trim();
    if (s && s !== '有氧' && out.indexOf(s) < 0) out.push(s);
  });
  if (!out.length) return { ok: false, message: '顺序不能为空' };
  return { ok: true, order: out };
}

module.exports = { MAIN_LIFTS, isGlobalId, validatePatch, validateNewExercise, sanitizeCategoryOrder };
