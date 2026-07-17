// utils/exerciseLib.js —— 动作合并查询层
// 四层合并（见 openspec/specs/exercise-library-management）：
//   内置 config/exercises.js + 全局动作（exercise_overrides kind:'exercise'，gbl_ 前缀，所有用户可见）
//   → 套管理员 patch（kind:'patch'：改名/改分类/改别名/隐藏，对内置与全局动作均生效）
//   → 拼每用户私有自建动作（custom_exercises，cus_ 前缀）。
// hidden 语义：从列举（allExercises/byCategory/searchExercises）排除，
// 但 getExercise/getName 仍按 id 解析 —— 隐藏动作的历史记录不得退化为「已删除动作」。
// overrides/自建都来自本地缓存（离线可用）；无 overrides 时天然回退内置基线。
// 合并结果 memo 一次，靠 store.onCacheChange 在两个集合缓存更新时失效。

const { EXERCISES, MAIN_LIFTS, CATEGORIES } = require('../config/exercises.js');
const store = require('./store.js');

const CUSTOM_COLL = 'custom_exercises';
const OVERRIDES_COLL = 'exercise_overrides';

// 自建动作列表（来自本地缓存，离线可用）
function customList() {
  return store.getCache(CUSTOM_COLL) || [];
}

// ---------- 合并（memo） ----------

let memo = null;
store.onCacheChange((coll) => {
  if (coll === CUSTOM_COLL || coll === OVERRIDES_COLL) memo = null;
});

function applyPatch(e, p) {
  const out = Object.assign({}, e);
  if (p.name) out.name = p.name;
  if (p.category) out.category = p.category;
  if (Array.isArray(p.aliases)) out.aliases = p.aliases;
  if (p.hidden === true) out.hidden = true;
  return out;
}

function merged() {
  if (memo) return memo;
  const patchMap = {};
  const globals = [];
  let catOrder = null;
  (store.getCache(OVERRIDES_COLL) || []).forEach((d) => {
    if (!d) return;
    if (d.kind === 'patch' && d.targetId) patchMap[d.targetId] = d;
    else if (d.kind === 'exercise' && d.id) globals.push(d);
    else if (d.kind === 'categories' && Array.isArray(d.order)) catOrder = d.order;
  });

  // 内置（透传全部元数据）+ 全局动作（缺元数据字段，UI 侧需容缺，同自建）
  let list = EXERCISES.map((e) => Object.assign({ custom: false }, e)).concat(
    globals.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category || '其他',
      aliases: g.aliases || [],
      isMainLift: false,
      custom: false,
      global: true
    }))
  );
  // 套 patch（内置与全局均可被改名/改类/改别名/隐藏）
  list = list.map((e) => (patchMap[e.id] ? applyPatch(e, patchMap[e.id]) : e));
  // 拼每用户自建
  const customs = customList().map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category || '其他',
    isMainLift: false,
    custom: true,
    _id: c._id
  }));
  const full = list.concat(customs);
  const byId = {};
  full.forEach((e) => { byId[e.id] = e; });
  memo = { full: full, visible: full.filter((e) => !e.hidden), byId: byId, catOrder: catOrder };
  return memo;
}

// ---------- 查询 ----------

// 全部可见动作（hidden 已排除）：内置+全局（custom:false）+ 自建（custom:true，允许删除）
function allExercises() {
  return merged().visible;
}

// 按分类分组：{ 分类: [动作...] }
// 顺序：管理员 order（kind:'categories'）优先，无则回退 CATEGORIES；
// 未涵盖的新类别追加；「有氧」恒置末（order 不管它）；空类别不显示。
// opts.includeHidden 供管理模式列出隐藏动作（带 hidden 标记）。
function byCategory(opts) {
  const m = merged();
  const all = (opts && opts.includeHidden) ? m.full : m.visible;
  const cats = (m.catOrder && m.catOrder.length)
    ? m.catOrder.filter((c) => c && c !== '有氧')
    : CATEGORIES.slice();
  all.forEach((e) => { if (e.category !== '有氧' && cats.indexOf(e.category) < 0) cats.push(e.category); });
  cats.push('有氧'); // 有氧永远排在最末
  const map = {};
  cats.forEach((c) => {
    const items = all.filter((e) => e.category === c);
    if (items.length) map[c] = items;
  });
  return map;
}

// 类别列表（非有氧，含 order 里预留但暂无动作的新类别）：管理编排与分类选择器用
function listCategories() {
  const m = merged();
  const cats = (m.catOrder && m.catOrder.length)
    ? m.catOrder.filter((c) => c && c !== '有氧')
    : CATEGORIES.slice();
  m.full.forEach((e) => { if (e.category !== '有氧' && cats.indexOf(e.category) < 0) cats.push(e.category); });
  return cats;
}

// 按 id 取动作对象：含 hidden 动作（历史完整性），返回浅拷贝防调用方误改 memo。
function getExercise(id) {
  const ex = merged().byId[id];
  return ex ? Object.assign({}, ex) : null;
}

// 关键词模糊搜索：按 name + aliases 大小写无关匹配，hidden 已排除。
// 空/纯空白关键词返回 null（约定：表示「不过滤」，由调用方回落到分类分组）。
function searchExercises(keyword) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return null;
  return allExercises().filter((e) => {
    if ((e.name || '').toLowerCase().includes(kw)) return true;
    return (e.aliases || []).some((a) => String(a).toLowerCase().includes(kw));
  });
}

// 按 id 取名称；找不到（如自建动作已删）回退占位，绝不返回空
function getName(id) {
  const ex = getExercise(id);
  return ex ? ex.name : '已删除动作';
}

// 生成稳定自建动作 id
function genCustomId() {
  return 'cus_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// 生成全局动作 id（gbl_ 命名空间，与内置/cus_ 隔离）
function genGlobalId() {
  return 'gbl_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

module.exports = {
  CUSTOM_COLL,
  OVERRIDES_COLL,
  MAIN_LIFTS,
  CATEGORIES,
  customList,
  allExercises,
  byCategory,
  listCategories,
  getExercise,
  getName,
  searchExercises,
  genCustomId,
  genGlobalId
};
