// pages/workout/pick.js —— 新建训练·选模板（独立页，从训练列表进入）
// 选模板/空白后跳 edit 页；返回键天然退回本页（修复原同页 stage 返回直接退到列表）。
const db = require('../../utils/db.js');
const templateLib = require('../../utils/templateLib.js');
const calendar = require('../../utils/calendar.js');

// 给每个模板行附分化色点（与日历同源取色）+ 是否可删（仅「我的模板」，预设不可删）。
function withDotColors(groups) {
  return (groups || []).map((g) => Object.assign({}, g, {
    items: (g.items || []).map((it) => Object.assign({}, it, {
      dotColor: calendar.typeOf(it).color,
      deletable: !templateLib.isPresetGroup(it.group)
    }))
  }));
}

Page({
  data: {
    templateGroups: [],
    groupNotes: templateLib.GROUP_NOTES // 分组循证说明
  },

  onShow() { this.render(); },

  async onLoad() {
    try { await db.ensureTemplatesSeeded(); } catch (e) {}
    this.render();
  },

  render() {
    this.setData({ templateGroups: withDotColors(templateLib.groupTemplates(db.getCache(db.COLL.TEMPLATES))) });
  },

  pickTemplate(e) {
    wx.navigateTo({ url: `/pages/workout/edit?templateId=${e.currentTarget.dataset.id}` });
  },
  pickBlank() {
    wx.navigateTo({ url: '/pages/workout/edit?blank=1' });
  },

  // 删除「我的模板」（预设不可删，兜底拦截）；删后就地重渲染
  async onDeleteTemplate(e) {
    const id = e.currentTarget.dataset.id;
    const t = db.getCache(db.COLL.TEMPLATES).find((x) => x._id === id);
    if (t && templateLib.isPresetGroup(t.group)) {
      wx.showToast({ title: '预设模板不可删除', icon: 'none' });
      return;
    }
    const res = await wx.showModal({ title: '删除模板', content: '确定删除该模板吗？历史训练记录不受影响。' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.TEMPLATES, id);
    this.render();
  }
});
