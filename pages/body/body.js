// pages/body/body.js —— 身体数据列表（身体 Tab，增量渲染）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

const PAGE_SIZE = 30;

Page({
  data: {
    records: [],
    pending: false,
    loaded: false,
    unitLabel: 'kg',
    visibleCount: PAGE_SIZE,
    hasMore: false
  },

  onShow() {
    this.setData({ unitLabel: unit.label() });
    this.renderFromCache();
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.hasMore) return;
    this.setData({ visibleCount: this.data.visibleCount + PAGE_SIZE }, () => this.applyVisible());
  },

  renderFromCache() {
    this._all = this.decorate(db.getCache(db.COLL.BODY));
    this.setData({ pending: db.hasPending() });
    this.applyVisible();
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.BODY);
      this._all = this.decorate(data);
      this.setData({ pending: db.hasPending(), loaded: true });
      this.applyVisible();
    } catch (e) {
      this.setData({ loaded: true });
    }
  },

  applyVisible() {
    const all = this._all || [];
    this.setData({
      records: all.slice(0, this.data.visibleCount),
      hasMore: all.length > this.data.visibleCount
    });
  },

  decorate(list) {
    return (list || []).map((r) => ({
      _id: r._id,
      dateLabel: `${util.formatMonthDay(r.date)} ${util.weekDay(r.date)}`,
      weight: r.weight == null ? '—' : unit.toDisplay(r.weight),
      bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : null,
      waist: typeof r.waist === 'number' ? r.waist : null,
      pending: !!r._pending
    }));
  },

  goNew() { wx.navigateTo({ url: '/pages/body/edit' }); },
  goDetail(e) { wx.navigateTo({ url: `/pages/body/detail?id=${e.currentTarget.dataset.id}` }); }
});
