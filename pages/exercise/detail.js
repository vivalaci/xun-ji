// pages/exercise/detail.js —— 动作详情（曲线 + 历史 + PR）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');
const lib = require('../../utils/exerciseLib.js');

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

    // 该动作的所有训练（含该动作）
    const entries = [];
    all.forEach((w) => {
      const ex = (w.exercises || []).find((x) => x.exerciseId === this.exerciseId);
      if (!ex) return;
      const mww = util.mainWorkingWeight(ex.sets);
      entries.push({
        date: w.date,
        ts: new Date(w.date).getTime(),
        mww,
        sets: ex.sets || [],
        isPR: !!(prMap[w._id] && prMap[w._id].has(this.exerciseId))
      });
    });

    // 曲线点（范围内、有主力工作组重量）升序
    const points = entries
      .filter((e) => e.ts >= start && e.mww != null)
      .map((e) => ({ x: e.date, y: unit.toDisplay(e.mww) }))
      .sort((a, b) => new Date(a.x) - new Date(b.x));
    this._points = points;

    // 历史列表（全部）倒序
    const history = entries
      .sort((a, b) => b.ts - a.ts)
      .map((e) => ({
        dateLabel: `${util.formatMonthDay(e.date)} ${util.weekDay(e.date)}`,
        setsText: e.sets.map((s) => `${util.formatLoad(unit.toDisplay(s.weight), this.loadType)}×${s.reps}`).join('  '),
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
