// pages/body/body.js —— 身体数据列表（身体 Tab）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

Page({
  data: {
    records: [],
    pending: false,
    loaded: false,
    unitLabel: 'kg'
  },

  onShow() {
    this.setData({ unitLabel: unit.label() });
    this.renderFromCache();
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  renderFromCache() {
    this.setData({
      records: this.decorate(db.getCache(db.COLL.BODY)),
      pending: db.hasPending()
    });
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.BODY);
      this.setData({ records: this.decorate(data), pending: db.hasPending(), loaded: true });
    } catch (e) {
      this.setData({ loaded: true });
    }
  },

  decorate(list) {
    return (list || []).map((r) => ({
      _id: r._id,
      dateLabel: `${util.formatMonthDay(r.date)} ${util.weekDay(r.date)}`,
      weight: r.weight == null ? '—' : unit.toDisplay(r.weight),
      bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : null,
      pending: !!r._pending
    }));
  },

  goNew() { wx.navigateTo({ url: '/pages/body/edit' }); },
  goDetail(e) { wx.navigateTo({ url: `/pages/body/detail?id=${e.currentTarget.dataset.id}` }); }
});
