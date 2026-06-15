// utils/db.js —— 数据访问层
// 设计要点（见 docs/06 第六节）：
//   读：缓存优先 —— 页面先用 getCache 同步渲染，再调 refresh 拉云端更新。
//   写：本地先落 —— saveLocalFirst 立即写缓存并入队，UI 立刻可见；
//       再异步推云端，失败留队列，下次 refresh / 启动时重试。
// 单人 App，不做多设备冲突合并。

const store = require('./store.js');
const PRESET_TEMPLATES = require('../config/templates.js');
const templateLib = require('./templateLib.js');

const COLL = {
  WORKOUTS: 'workouts',
  BODY: 'body_records',
  TEMPLATES: 'workout_templates',
  CUSTOM_EXERCISES: 'custom_exercises',
  PREFS: 'user_prefs'
};

function db() {
  return wx.cloud.database();
}

function genLocalId() {
  return 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// ---------- 读 ----------

// 同步读缓存（页面首屏用）
function getCache(coll) {
  return store.getCache(coll);
}

// 客户端单次查询上限 100；分页累积全量，避免 >100 条被静默截断（见 change data-pagination）
const PAGE = 100;
const MAX_RECORDS = 5000; // 安全上限，防异常数据无限循环（约 24 年训练量）

// 从云端刷新：先冲队列，再分页拉全量，更新缓存并返回最新列表
async function refresh(coll, { orderBy = 'date', order = 'desc' } = {}) {
  await flushQueue(); // 先把本地未同步的推上去
  let list = [];
  let skip = 0;
  while (skip < MAX_RECORDS) {
    const res = await db().collection(coll).orderBy(orderBy, order).skip(skip).limit(PAGE).get();
    list = list.concat(res.data);
    if (res.data.length < PAGE) break; // 取尽
    skip += PAGE;
  }

  // 合并仍未同步成功的本地记录（避免刷新把它们冲掉）
  const pendingLocal = store.getCache(coll).filter((r) => r._pending);
  if (pendingLocal.length) {
    list = pendingLocal.concat(list);
  }
  store.setCache(coll, list);
  return list;
}

// ---------- 写（本地先落） ----------

// 新增：立即写缓存 + 入队，返回带 localId 的记录
function saveLocalFirst(coll, data) {
  const localId = genLocalId();
  const record = Object.assign({}, data, {
    _id: localId,
    _pending: true,
    createTime: Date.now()
  });
  const list = store.getCache(coll);
  list.unshift(record);
  store.setCache(coll, list);

  const q = store.getQueue();
  q.push({ opId: localId, type: 'add', coll, localId, data });
  store.setQueue(q);

  flushQueue(); // 异步尝试，不阻塞 UI
  return record;
}

// 更新
function updateLocalFirst(coll, id, data) {
  const list = store.getCache(coll);
  const idx = list.findIndex((r) => r._id === id);
  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], data);
    store.setCache(coll, list);
  }
  const q = store.getQueue();
  if (String(id).startsWith('local_')) {
    // 记录还没同步成功，直接改它入队的 add 数据
    const item = q.find((it) => it.localId === id && it.type === 'add');
    if (item) item.data = Object.assign({}, item.data, data);
    else q.push({ opId: genLocalId(), type: 'update', coll, docId: id, data });
  } else {
    q.push({ opId: genLocalId(), type: 'update', coll, docId: id, data });
  }
  store.setQueue(q);
  flushQueue();
}

// 删除
function removeLocalFirst(coll, id) {
  const list = store.getCache(coll).filter((r) => r._id !== id);
  store.setCache(coll, list);

  let q = store.getQueue();
  if (String(id).startsWith('local_')) {
    // 没同步过，直接从队列撤掉它的 add，无需通知云端
    q = q.filter((it) => it.localId !== id);
  } else {
    q.push({ opId: genLocalId(), type: 'remove', coll, docId: id });
  }
  store.setQueue(q);
  flushQueue();
}

// ---------- 队列同步 ----------

let flushing = false;

async function flushQueue() {
  if (flushing) return;
  if (!wx.cloud) return;
  flushing = true;
  try {
    let q = store.getQueue();
    while (q.length) {
      const item = q[0];
      try {
        await applyOp(item);
      } catch (e) {
        // 失败（多半是断网）：保留队列，下次再试
        break;
      }
      q = store.getQueue();
      q.shift();
      store.setQueue(q);
    }
  } finally {
    flushing = false;
  }
}

async function applyOp(item) {
  const c = db().collection(item.coll);
  if (item.type === 'add') {
    const res = await c.add({ data: Object.assign({ createTime: db().serverDate() }, item.data) });
    // 把缓存里的临时记录换成真实 _id、去掉 _pending
    const list = store.getCache(item.coll);
    const idx = list.findIndex((r) => r._id === item.localId);
    if (idx >= 0) {
      list[idx]._id = res._id;
      delete list[idx]._pending;
      store.setCache(item.coll, list);
    }
  } else if (item.type === 'update') {
    await c.doc(item.docId).update({ data: item.data });
  } else if (item.type === 'remove') {
    await c.doc(item.docId).remove();
  }
}

// 队列里是否还有未同步项（给 UI 显示"同步中"用）
function hasPending() {
  return store.getQueue().length > 0;
}

// ---------- 模板首次播种 / 分组迁移 ----------

// 存量模板缺 group 字段时执行一次性迁移（见 change template-groups design D2）：
// 旧三件套归"三分化"（腿日改名蹲日），其余写显式空串；并补种二分化预设。
// 迁移后所有模板都有 group，条件自然失效 → 幂等，删除二分化后不复活。
function migrateTemplateGroups(list) {
  const plan = templateLib.planTemplateMigration(list, PRESET_TEMPLATES);
  if (!plan.needed) return list;
  plan.updates.forEach((u) => updateLocalFirst(COLL.TEMPLATES, u.id, u.data));
  plan.additions.forEach((p) => saveLocalFirst(COLL.TEMPLATES, p));
  return store.getCache(COLL.TEMPLATES);
}

// 确保用户已有预设模板；没有则写入 5 套（三分化 + 二分化）。返回模板列表（已迁移）。
async function ensureTemplatesSeeded() {
  // 先看缓存（先迁移再后台刷新：refresh 内部会先冲队列，把迁移写入推上云端后才拉取）
  let cached = store.getCache(COLL.TEMPLATES);
  if (cached.length) {
    const migrated = migrateTemplateGroups(cached);
    refresh(COLL.TEMPLATES, { orderBy: 'order', order: 'asc' }).catch(() => {});
    return migrated;
  }
  // 缓存空：查云端
  const res = await db().collection(COLL.TEMPLATES).orderBy('order', 'asc').get();
  if (res.data.length) {
    store.setCache(COLL.TEMPLATES, res.data);
    return migrateTemplateGroups(res.data);
  }
  // 云端也空：播种全部预设
  const created = [];
  for (const tpl of PRESET_TEMPLATES) {
    const r = await db().collection(COLL.TEMPLATES).add({
      data: Object.assign({ createTime: db().serverDate() }, tpl)
    });
    created.push(Object.assign({ _id: r._id }, tpl));
  }
  store.setCache(COLL.TEMPLATES, created);
  return created;
}

// ---------- 用户偏好（user_prefs 单文档） ----------

// 读取偏好文档：缓存优先 → 云端 → 都没有则本地先写建默认文档（弱网下也立即可用）。
// defaultDoc 由调用方提供（如 curveConfig.defaultPrefs()），避免 db 层依赖业务形态。
async function ensurePrefs(defaultDoc) {
  const cached = store.getCache(COLL.PREFS);
  if (cached.length) {
    refresh(COLL.PREFS, { orderBy: 'createTime', order: 'asc', limit: 1 }).catch(() => {});
    return cached[0];
  }
  try {
    const res = await db().collection(COLL.PREFS).orderBy('createTime', 'asc').limit(1).get();
    if (res.data.length) {
      store.setCache(COLL.PREFS, res.data);
      return res.data[0];
    }
  } catch (e) { /* 云端不可用：走本地先写兜底 */ }
  return saveLocalFirst(COLL.PREFS, defaultDoc);
}

// 更新偏好（按缓存里的文档 id，机制兼容未同步的本地临时文档）
function updatePrefs(patch) {
  const cached = store.getCache(COLL.PREFS);
  if (!cached.length) return null;
  updateLocalFirst(COLL.PREFS, cached[0]._id, patch);
  return store.getCache(COLL.PREFS)[0];
}

module.exports = {
  COLL,
  getCache,
  refresh,
  saveLocalFirst,
  updateLocalFirst,
  removeLocalFirst,
  flushQueue,
  hasPending,
  ensureTemplatesSeeded,
  ensurePrefs,
  updatePrefs
};
