// utils/exerciseLib.js —— 动作合并查询层
// 把内置动作库（config/exercises.js）与用户自建动作（custom_exercises 集合）合并，
// 统一按稳定 id 取名。被删除的自建动作 id 回退占位名，保证历史记录不破。
// 自建动作记录形如：{ _id, id:'cus_xxx', name, category }，引用方只认 id 字段。

const { EXERCISES, MAIN_LIFTS, CATEGORIES, getExercise: getBuiltin } = require('../config/exercises.js');
const store = require('./store.js');

const CUSTOM_COLL = 'custom_exercises';

// 自建动作列表（来自本地缓存，离线可用）
function customList() {
  return store.getCache(CUSTOM_COLL) || [];
}

// 全部动作：内置 + 自建（自建标 custom:true，便于 UI 区分/允许删除）
function allExercises() {
  const customs = customList().map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category || '其他',
    isMainLift: false,
    custom: true,
    _id: c._id
  }));
  return EXERCISES.map((e) => Object.assign({ custom: false }, e)).concat(customs);
}

// 按分类分组：{ 分类: [动作...] }，分类顺序含内置 CATEGORIES + 自建出现的新分类
function byCategory() {
  const all = allExercises();
  const cats = CATEGORIES.slice();
  all.forEach((e) => { if (!cats.includes(e.category)) cats.push(e.category); });
  const map = {};
  cats.forEach((c) => {
    const items = all.filter((e) => e.category === c);
    if (items.length) map[c] = items;
  });
  return map;
}

// 按 id 取动作对象（内置优先，再查自建）
function getExercise(id) {
  const builtin = getBuiltin(id);
  if (builtin) return Object.assign({ custom: false }, builtin);
  const c = customList().find((x) => x.id === id);
  if (c) return { id: c.id, name: c.name, category: c.category || '其他', isMainLift: false, custom: true, _id: c._id };
  return null;
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

module.exports = {
  CUSTOM_COLL,
  MAIN_LIFTS,
  CATEGORIES,
  customList,
  allExercises,
  byCategory,
  getExercise,
  getName,
  genCustomId
};
