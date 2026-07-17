// cloudfunctions/exerciseAdmin —— 全局动作库管理写入（项目首个云函数）
// 安全边界在这里：exercise_overrides 集合权限为「所有用户可读，仅管理端可写」，
// 客户端根本写不了；全部写入经本函数，且必须通过 OPENID 比对（微信注入，客户端伪造不了）。
// 管理员 openid 存云函数环境变量 ADMIN_OPENID（不进代码、不进 git）。
//
// 动作（event.action）：
//   ping          验证管理员身份（隐藏手势入口用）；非管理员一律 FORBIDDEN，
//                 但回显 openid —— 首次部署时管理员借此拿到自己的 openid 去配环境变量。
//   patch         { targetId, patch:{name?,category?,aliases?,hidden?} } 改内置/全局动作（upsert）
//   addExercise   { exercise:{id:'gbl_xxx',name,category,aliases?} } 新增全局动作
//   setCategories { order:[...] } 类别顺序（upsert 单文档）
//
// 函数保持极薄：校验逻辑全在 validate.js 纯函数（tests/algo.test.js 直接单测）。

const cloud = require('wx-server-sdk');
const v = require('./validate.js');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLL = 'exercise_overrides';

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const admin = !!process.env.ADMIN_OPENID && OPENID === process.env.ADMIN_OPENID;
  if (!admin) {
    // 不产生任何写入；回显 openid 供首次配置 ADMIN_OPENID（是调用者自己的 id，无泄露面）
    return { ok: false, code: 'FORBIDDEN', message: '无管理权限', openid: OPENID };
  }

  const db = cloud.database();
  const coll = db.collection(COLL);
  const action = event && event.action;

  if (action === 'ping') {
    return { ok: true, admin: true };
  }

  if (action === 'patch') {
    const r = v.validatePatch(event.targetId, event.patch);
    if (!r.ok) return { ok: false, code: 'INVALID', message: r.message };
    const existing = await coll.where({ kind: 'patch', targetId: r.targetId }).get();
    if (existing.data.length) {
      await coll.doc(existing.data[0]._id).update({ data: r.fields });
    } else {
      await coll.add({
        data: Object.assign({ kind: 'patch', targetId: r.targetId, createTime: db.serverDate() }, r.fields)
      });
    }
    return { ok: true };
  }

  if (action === 'addExercise') {
    const ex = (event.exercise && event.exercise.id) ? event.exercise : {};
    // gbl_ 前缀已把命名空间与内置/cus_ 隔开，碰撞只可能发生在集合内既有全局动作
    const dup = ex.id ? await coll.where({ kind: 'exercise', id: String(ex.id).trim() }).get() : { data: [] };
    const r = v.validateNewExercise(event.exercise, dup.data.map((d) => d.id));
    if (!r.ok) return { ok: false, code: 'INVALID', message: r.message };
    await coll.add({
      data: Object.assign({ kind: 'exercise', createTime: db.serverDate() }, r.doc)
    });
    return { ok: true };
  }

  if (action === 'setCategories') {
    const r = v.sanitizeCategoryOrder(event.order);
    if (!r.ok) return { ok: false, code: 'INVALID', message: r.message };
    const existing = await coll.where({ kind: 'categories' }).get();
    if (existing.data.length) {
      await coll.doc(existing.data[0]._id).update({ data: { order: r.order } });
    } else {
      await coll.add({ data: { kind: 'categories', order: r.order, createTime: db.serverDate() } });
    }
    return { ok: true };
  }

  return { ok: false, code: 'UNKNOWN_ACTION', message: '未知操作：' + action };
};
