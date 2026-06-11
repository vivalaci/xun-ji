// pages/template/manage.js —— 训练模板管理
const db = require('../../utils/db.js');

Page({
  data: {
    templates: [],
    loaded: false
  },

  onShow() {
    this.render();      // 缓存优先
    this.load();        // 确保播种 + 刷新
  },

  render() {
    this.setData({ templates: this.decorate(db.getCache(db.COLL.TEMPLATES)) });
  },

  async load() {
    try {
      const list = await db.ensureTemplatesSeeded();
      this.setData({ templates: this.decorate(list), loaded: true });
    } catch (e) {
      this.setData({ loaded: true });
    }
  },

  decorate(list) {
    return (list || [])
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((t) => ({
        _id: t._id,
        name: t.name || '模板',
        count: (t.exercises || []).length,
        pending: !!t._pending
      }));
  },

  goEdit(e) { wx.navigateTo({ url: `/pages/template/edit?id=${e.currentTarget.dataset.id}` }); },

  async onNew() {
    const res = await wx.showModal({ title: '新建模板', editable: true, placeholderText: '模板名称，如「上肢日」' });
    if (!res.confirm) return;
    const name = (res.content || '').trim();
    if (!name) { wx.showToast({ title: '请输入名称', icon: 'none' }); return; }
    const maxOrder = db.getCache(db.COLL.TEMPLATES).reduce((m, t) => Math.max(m, t.order || 0), -1);
    const rec = db.saveLocalFirst(db.COLL.TEMPLATES, { name, order: maxOrder + 1, exercises: [] });
    this.render();
    wx.navigateTo({ url: `/pages/template/edit?id=${rec._id}` });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除模板', content: '确定删除该模板吗？历史训练记录不受影响。' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.TEMPLATES, id);
    this.render();
  }
});
