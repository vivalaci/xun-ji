// pages/exercise/detail.js —— 动作详情（曲线 + 历史 + PR）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');
const lib = require('../../utils/exerciseLib.js');
const curveConfig = require('../../utils/curveConfig.js');

const LIFT_COLOR = { bench: '#1D4ED8', squat: '#7C3AED', deadlift: '#0891B2' };

Page({
  data: {
    exerciseId: '',
    name: '',
    unitLabel: 'kg',
    range: '3M',
    ranges: ['1M', '3M', '6M', 'ALL'],
    history: [],     // [{ dateLabel, setsText, isPR }]
    hasData: false,
    isBodyweight: false,
    chartHint: '暂无数据'
  },

  onLoad(options) {
    this.exerciseId = options.id;
    this.ids = curveConfig.familyFor(options.id); // 硬拉锚点 → 家族三变式；其余 → [id]
    this.loadType = (lib.getExercise(options.id) || {}).loadType || 'weighted';
    this.color = LIFT_COLOR[options.id] || '#1D4ED8';
    wx.setNavigationBarTitle({ title: lib.getName(options.id) });
    const isBW = this.loadType === 'bodyweight';
    this.setData({
      exerciseId: options.id, name: lib.getName(options.id), unitLabel: unit.label(),
      isBodyweight: isBW, chartHint: isBW ? '纯自重，进步看次数' : '暂无数据'
    });
  },

  onShow() {
    this.compute();
    this.refresh();
  },

  async refresh() {
    try { await db.refresh(db.COLL.WORKOUTS); this.compute(); } catch (e) {}
  },

  switchRange(e) {
    this.setData({ range: e.currentTarget.dataset.range }, () => this.compute());
  },

  compute() {
    const all = db.getCache(db.COLL.WORKOUTS);
    const prMap = util.buildPRMap(all);
    const start = util.rangeStartTs(this.data.range);
    const ids = this.ids;
    const isFamily = ids.length > 1; // 硬拉家族：聚合 + 历史标注变式

    // 曲线点：每次训练取家族当日主力工作组重量最大值（与首页硬拉曲线同口径）
    const points = [];
    // 历史条目：家族内每个变式各一条
    const hist = [];
    all.forEach((w) => {
      const ts = new Date(w.date).getTime();
      const dayVal = util.dayLiftValue(w, ids);
      if (dayVal != null && ts >= start) points.push({ x: w.date, y: unit.toDisplay(dayVal) });
      (w.exercises || []).forEach((ex) => {
        if (ids.indexOf(ex.exerciseId) < 0) return;
        hist.push({
          key: w._id + '_' + ex.exerciseId,
          ts,
          date: w.date,
          variant: isFamily ? (ex.name || lib.getName(ex.exerciseId)) : '',
          loadType: (lib.getExercise(ex.exerciseId) || {}).loadType || 'weighted',
          sets: ex.sets || [],
          isPR: !!(prMap[w._id] && prMap[w._id].has(ex.exerciseId))
        });
      });
    });

    points.sort((a, b) => new Date(a.x) - new Date(b.x));
    this._points = points;

    const history = hist
      .sort((a, b) => b.ts - a.ts)
      .map((e) => ({
        key: e.key,
        dateLabel: `${util.formatMonthDay(e.date)} ${util.weekDay(e.date)}`,
        variant: e.variant,
        setsText: e.sets.map((s) => `${util.formatLoad(unit.toDisplayWeight(s.weight, unit.currentUnit()), e.loadType)}×${s.reps}`).join('  '),
        isPR: e.isPR
      }));

    this.setData({ history, hasData: points.length > 0 }, () => this.draw());
  },

  draw() {
    const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
    wx.createSelectorQuery().in(this)
      .select('#detailChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        chart.drawLineChart({
          canvas, ctx: canvas.getContext('2d'),
          width: res[0].width, height: res[0].height, dpr,
          points: this._points, color: this.color, yDecimals: 0
        });
      });
  }
});
