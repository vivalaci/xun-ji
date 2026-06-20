// pages/template/manage.js —— 训练模板管理（按组分节）
const db = require('../../utils/db.js');
const templateLib = require('../../utils/templateLib.js');

Page({
  data: {
    groups: [],     // [{ name, items }]
    empty: false,
    loaded: false
  },

  onShow() {
    this.render(db.getCache(db.COLL.TEMPLATES));   // 缓存优先
    this.load();                                    // 确保播种/迁移 + 刷新
  },

  render(list) {
    const groups = templateLib.groupTemplates(this.decorate(list));
    this.setData({ groups, empty: (list || []).length === 0 });
  },

  async load() {
    try {
      const list = await db.ensureTemplatesSeeded();
      this.render(list);
      this.setData({ loaded: true });
    } catch (e) {
      this.setData({ loaded: true });
    }
  },

  decorate(list) {
    return (list || []).map((t) => ({
      _id: t._id,
      name: t.name || '模板',
      group: t.group,
      order: t.order,
      count: (t.exercises || []).length,
      deletable: !templateLib.isPresetGroup(t.group), // 预设不可删，仅「我的模板」可删
      pending: !!t._pending
    }));
  },

  goEdit(e) { wx.navigateTo({ url: `/pages/template/edit?id=${e.currentTarget.dataset.id}` }); },

  async onNew() {
    const res = await wx.showModal({ title: '新建模板', editable: true, placeholderText: '模板名称，如「手臂日」' });
    if (!res.confirm) return;
    const name = (res.content || '').trim();
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    const maxOrder = db.getCache(db.COLL.TEMPLATES).reduce((m, t) => Math.max(m, t.order || 0), -1);
    // group 留空 → 归"我的模板"
    const rec = db.saveLocalFirst(db.COLL.TEMPLATES, { name, group: '', order: maxOrder + 1, exercises: [] });
    this.render(db.getCache(db.COLL.TEMPLATES));
    wx.navigateTo({ url: `/pages/template/edit?id=${rec._id}` });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const t = db.getCache(db.COLL.TEMPLATES).find((x) => x._id === id);
    if (t && templateLib.isPresetGroup(t.group)) {
      wx.showToast({ title: '预设模板不可删除', icon: 'none' });
      return;
    }
    const res = await wx.showModal({ title: '删除模板', content: '确定删除该模板吗？历史训练记录不受影响。' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.TEMPLATES, id);
    this.render(db.getCache(db.COLL.TEMPLATES));
  }
});
