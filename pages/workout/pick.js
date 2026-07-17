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
    groupNotes: templateLib.GROUP_NOTES, // 分组循证说明
    loading: true,   // 首次播种/加载中，未就绪不渲染空白
    loadError: false // 播种失败，显示可重试错误态
  },

  onLoad() { this.load(); },

  // onShow 不再无条件用空缓存覆盖：仅当缓存已有模板时刷新（回到本页时更新删除等状态），
  // 否则保持 onLoad 的加载/错误态，避免抢在播种完成前渲染空白。
  onShow() {
    if (db.getCache(db.COLL.TEMPLATES).length) this.render();
  },

  // 加载流程：置加载态 → 确保预设已播种 → 成功渲染 / 失败进错误态。可由「重试」按钮复用。
  async load() {
    this.setData({ loading: true, loadError: false });
    try {
      await db.ensureTemplatesSeeded();
      this.render();
      this.setData({ loading: false });
    } catch (e) {
      this.setData({ loading: false, loadError: true });
    }
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
