// utils/adminApi.js —— 管理端写入通道（exerciseAdmin 云函数薄封装）
// 架构铁律 1 的既定例外（见 CLAUDE.md / docs/06）：管理写入是服务端权威的共享内容，
// 不走 db.saveLocalFirst 乐观队列 —— 直调云函数，成功与否如实返回，由页面配真实
// loading / 失败提示。读侧不在此处：exercise_overrides 的读仍走 db.js 缓存优先 + refresh。

function call(action, payload) {
  return wx.cloud.callFunction({
    name: 'exerciseAdmin',
    data: Object.assign({ action: action }, payload || {})
  }).then((res) => {
    const r = (res && res.result) || {};
    if (!r.ok) {
      const err = new Error(r.message || '操作失败');
      err.code = r.code || 'ERROR';
      throw err;
    }
    return r;
  });
}

module.exports = {
  // 身份验证（隐藏手势入口用）：管理员 resolve，非管理员 reject（code:'FORBIDDEN'）
  ping: () => call('ping'),
  // 改内置/全局动作：patch = { name?, category?, aliases?, hidden? }
  savePatch: (targetId, patch) => call('patch', { targetId: targetId, patch: patch }),
  // 新增全局动作：{ id:'gbl_xxx', name, category, aliases? }
  addGlobalExercise: (exercise) => call('addExercise', { exercise: exercise }),
  // 类别顺序（非有氧）
  setCategoryOrder: (order) => call('setCategories', { order: order })
};
