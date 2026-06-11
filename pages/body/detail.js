// pages/body/detail.js —— 身体数据详情（查看 / 编辑入口 / 删除）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

Page({
  data: {
    id: '',
    dateLabel: '',
    weight: '',
    bodyFat: null,
    unitLabel: 'kg'
  },

  onLoad(options) {
    this.id = options.id;
  },

  onShow() {
    this.render(); // 编辑返回后刷新
  },

  render() {
    const r = db.getCache(db.COLL.BODY).find((x) => x._id === this.id);
    if (!r) { wx.showToast({ title: '记录不存在', icon: 'none' }); return; }
    this.setData({
      id: r._id,
      dateLabel: `${util.formatMonthDay(r.date)} ${util.weekDay(r.date)}`,
      weight: r.weight == null ? '—' : unit.toDisplay(r.weight),
      bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : null,
      unitLabel: unit.label()
    });
  },

  goEdit() { wx.navigateTo({ url: `/pages/body/edit?id=${this.id}` }); },

  async onDelete() {
    const res = await wx.showModal({ title: '删除', content: '确定删除这条身体数据吗？' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.BODY, this.id);
    wx.navigateBack();
  }
});
