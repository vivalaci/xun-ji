// pages/curve/curve.js —— 曲线首页
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');

// 5 条曲线定义（顺序即展示顺序），颜色见 docs/05
const CHARTS = [
  { key: 'bench',    type: 'lift', id: 'bench',       name: '卧推', unit: 'kg', color: '#1D4ED8' },
  { key: 'squat',    type: 'lift', id: 'squat',       name: '深蹲', unit: 'kg', color: '#7C3AED' },
  { key: 'deadlift', type: 'lift', id: 'deadlift',    name: '硬拉', unit: 'kg', color: '#0891B2' },
  { key: 'weight',   type: 'body', field: 'weight',   name: '体重', unit: 'kg', color: '#111827' },
  { key: 'bodyFat',  type: 'body', field: 'bodyFat',  name: '体脂', unit: '%',  color: '#6B7280' }
];

Page({
  data: {
    range: '3M',
    ranges: ['1M', '3M', '6M', 'ALL'],
    charts: []   // 渲染用：{key,name,unit,color,latest,hasData}
  },

  onShow() {
    this.compute();          // 缓存优先
    this.refresh();          // 后台更新
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    try {
      await Promise.all([
        db.refresh(db.COLL.WORKOUTS),
        db.refresh(db.COLL.BODY)
      ]);
      this.compute();
    } catch (e) { /* 云环境未就绪，保留缓存渲染 */ }
  },

  switchRange(e) {
    this.setData({ range: e.currentTarget.dataset.range }, () => this.compute());
  },

  // 计算 5 条曲线数据并触发绘制
  compute() {
    const start = util.rangeStartTs(this.data.range);
    const workouts = db.getCache(db.COLL.WORKOUTS);
    const body = db.getCache(db.COLL.BODY);

    this._series = {}; // key -> points（升序）
    const meta = CHARTS.map((c) => {
      let points = [];
      if (c.type === 'lift') {
        points = workouts
          .filter((w) => new Date(w.date).getTime() >= start)
          .map((w) => {
            const ex = (w.exercises || []).find((x) => x.exerciseId === c.id);
            if (!ex) return null;
            const mw = util.mainWorkingWeight(ex.sets);
            return mw == null ? null : { x: w.date, y: unit.toDisplay(mw) };
          })
          .filter(Boolean);
      } else {
        points = body
          .filter((r) => new Date(r.date).getTime() >= start && typeof r[c.field] === 'number')
          .map((r) => ({ x: r.date, y: c.field === 'weight' ? unit.toDisplay(r[c.field]) : r[c.field] }));
      }
      points.sort((a, b) => new Date(a.x) - new Date(b.x));
      this._series[c.key] = points;
      return {
        key: c.key,
        name: c.name,
        unit: c.unit,
        color: c.color,
        hasData: points.length > 0,
        latest: points.length ? points[points.length - 1].y : null
      };
    });

    this.setData({ charts: meta }, () => this.draw());
  },

  draw() {
    const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
    CHARTS.forEach((c) => {
      wx.createSelectorQuery().in(this)
        .select('#chart_' + c.key)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) return;
          const canvas = res[0].node;
          chart.drawLineChart({
            canvas,
            ctx: canvas.getContext('2d'),
            width: res[0].width,
            height: res[0].height,
            dpr,
            points: this._series[c.key],
            color: c.color
          });
        });
    });
  },

  goDetail(e) {
    const key = e.currentTarget.dataset.key;
    const c = CHARTS.find((x) => x.key === key);
    if (c && c.type === 'lift') {
      wx.navigateTo({ url: `/pages/exercise/detail?id=${c.id}` });
    } else {
      // 体重/体脂：跳身体 Tab 查看明细
      wx.switchTab({ url: '/pages/body/body' });
    }
  }
});
