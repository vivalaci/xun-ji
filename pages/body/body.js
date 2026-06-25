// pages/body/body.js —— 身体数据：顶部趋势合并图（迁自首页）+ 列表（增量渲染）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');
const curveConfig = require('../../utils/curveConfig.js');

const PAGE_SIZE = 30;

Page({
  data: {
    records: [],
    pending: false,
    loaded: false,
    unitLabel: 'kg',
    visibleCount: PAGE_SIZE,
    hasMore: false,
    // 身体趋势（体重/体脂/腰围三线合并图，迁自曲线首页，无标题）
    range: '3M',
    ranges: ['1M', '3M', '6M', 'ALL'],
    legend: []
  },

  onShow() {
    this.setData({ unitLabel: unit.label() });
    this.renderFromCache();
    this.refresh();
  },

  switchRange(e) {
    this.setData({ range: e.currentTarget.dataset.range }, () => this.computeTrend());
  },

  // 身体趋势：三 series（体重经 unit.toDisplay、体脂、腰围），按 range 过滤、独立缩放
  computeTrend() {
    const start = util.rangeStartTs(this.data.range);
    const body = db.getCache(db.COLL.BODY);
    const built = curveConfig.BODY_SERIES.map((sd) => ({
      def: sd,
      points: body
        .filter((r) => new Date(r.date).getTime() >= start && typeof r[sd.field] === 'number')
        .map((r) => ({ x: r.date, y: sd.convert ? unit.toDisplay(r[sd.field]) : r[sd.field] }))
        .sort((a, b) => new Date(a.x) - new Date(b.x))
    }));
    this._trend = built;
    this.setData({
      legend: built.map((b) => ({
        name: b.def.name,
        color: b.def.color,
        unit: b.def.unit === 'kg' ? unit.label() : b.def.unit,
        latest: b.points.length ? b.points[b.points.length - 1].y : null
      }))
    }, () => this.drawTrend());
  },

  drawTrend() {
    const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
    wx.createSelectorQuery().in(this)
      .select('#bodyTrend')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        chart.drawMultiLine({
          canvas, ctx: canvas.getContext('2d'),
          width: res[0].width, height: res[0].height, dpr,
          // 体重（convert）的 minSpan 在 lb 模式经 unit.toDisplay 线性换算
          series: (this._trend || []).map((b) => ({
            points: b.points,
            color: b.def.color,
            minSpan: b.def.convert ? unit.toDisplay(b.def.minSpan) : b.def.minSpan
          }))
        });
      });
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
    this.computeTrend();
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.BODY);
      this._all = this.decorate(data);
      this.setData({ pending: db.hasPending(), loaded: true });
      this.applyVisible();
      this.computeTrend();
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
