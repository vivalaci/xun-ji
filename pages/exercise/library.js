// pages/exercise/library.js —— 动作库管理（查看内置 + 增删自建）
const db = require('../../utils/db.js');
const lib = require('../../utils/exerciseLib.js');

Page({
  data: {
    groups: [],            // [{ category, items:[{id,name,isMainLift,custom,_id}] }]
    // 新建面板
    addVisible: false,
    newName: '',
    categories: [],
    catIndex: 0
  },

  onShow() {
    this.render();
    this.refresh();
  },

  async refresh() {
    try {
      await db.refresh(lib.CUSTOM_COLL);
      this.render();
    } catch (e) { /* 离线保留缓存 */ }
  },

  render() {
    const byCat = lib.byCategory();
    const groups = Object.keys(byCat).map((c) => ({ category: c, items: byCat[c] }));
    this.setData({ groups, categories: lib.CATEGORIES });
  },

  openAdd() { this.setData({ addVisible: true, newName: '', catIndex: 0 }); },
  closeAdd() { this.setData({ addVisible: false }); },
  onNameInput(e) { this.setData({ newName: e.detail.value }); },
  onCatChange(e) { this.setData({ catIndex: Number(e.detail.value) }); },

  onAdd() {
    const name = (this.data.newName || '').trim();
    if (!name) { wx.showToast({ title: '请输入动作名称', icon: 'none' }); return; }
    const category = this.data.categories[this.data.catIndex];
    db.saveLocalFirst(lib.CUSTOM_COLL, { id: lib.genCustomId(), name, category });
    this.setData({ addVisible: false });
    this.render();
  },

  async onDelete(e) {
    const _id = e.currentTarget.dataset.docid;
    const res = await wx.showModal({ title: '删除动作', content: '确定删除该自定义动作吗？历史记录仍按原样保留。' });
    if (!res.confirm) return;
    db.removeLocalFirst(lib.CUSTOM_COLL, _id);
    this.render();
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/exercise/detail?id=${e.currentTarget.dataset.id}` });
  }
});
