// pages/exercise/detail.js —— 动作详情（曲线 + 历史 + PR）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');
const lib = require('../../utils/exerciseLib.js');
const curveConfig = require('../../utils/curveConfig.js');
const media = require('../../utils/exerciseMedia.js');

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
    chartHint: '暂无数据',
    metricCap: '主力工作组重量（kg）',
    // 曲线下方示意图 + 要领（按页面锚点 id；硬拉家族显示硬拉本身）
    mediaId: '',
    showGuideCard: false,
    guideHasText: false,
    viewerId: ''     // 放大层（空 = 关闭）
  },

  onLoad(options) {
    this.exerciseId = options.id;
    this.ids = curveConfig.familyFor(options.id); // 硬拉锚点 → 家族三变式；其余 → [id]
    this.loadType = (lib.getExercise(options.id) || {}).loadType || 'weighted';
    this.color = LIFT_COLOR[options.id] || '#1D4ED8';
    wx.setNavigationBarTitle({ title: lib.getName(options.id) });
    const isBW = this.loadType === 'bodyweight';
    // 无图且无要领 → 整块不渲染；图加载失败时若也无要领则收起（onMediaFail）
    const hasMedia = media.hasMedia(options.id);
    const hasText = !!media.instructionsFor(options.id);
    this.setData({
      exerciseId: options.id, name: lib.getName(options.id), unitLabel: unit.label(),
      isBodyweight: isBW, chartHint: isBW ? '纯自重，进步看次数' : '暂无数据',
      mediaId: options.id, showGuideCard: hasMedia || hasText, guideHasText: hasText
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

    // 纯自重判定（整条曲线统一口径，与首页一致）：bodyweight 且范围内匹配组无任何负重 → 看最大次数
    const inRange = all.filter((w) => new Date(w.date).getTime() >= start);
    const hasLoad = inRange.some((w) => (w.exercises || []).some(
      (ex) => ids.indexOf(ex.exerciseId) >= 0 && (ex.sets || []).some((s) => Number(s.weight) > 0)
    ));
    const reps = this.loadType === 'bodyweight' && !hasLoad;

    // 曲线点：纯自重按当日最大次数（不换算）；否则取家族当日主力工作组重量（与首页同口径）
    const points = [];
    // 历史条目：家族内每个变式各一条
    const hist = [];
    all.forEach((w) => {
      const ts = new Date(w.date).getTime();
      if (ts >= start) {
        const v = reps ? util.dayRepsValue(w, ids) : util.dayLiftValue(w, ids);
        if (v != null) points.push({ x: w.date, y: reps ? v : unit.toDisplay(v) });
      }
      (w.exercises || []).forEach((ex) => {
        if (ids.indexOf(ex.exerciseId) < 0) return;
        hist.push({
          key: w._id + '_' + ex.exerciseId,
          ts,
          date: w.date,
          variant: isFamily ? lib.displayName(ex.exerciseId, ex.name) : '', // 当前名，已删回退保存时名字
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

    this.setData({
      history,
      hasData: points.length > 0,
      metricCap: reps ? '最大次数（次）' : ('主力工作组重量（' + unit.label() + '）')
    }, () => this.draw());
  },

  // ---- 示意图放大层 ----
  onEnlarge(e) { this.setData({ viewerId: e.detail.id }); },
  closeViewer() { this.setData({ viewerId: '' }); },
  onMediaFail() { if (!this.data.guideHasText) this.setData({ showGuideCard: false }); },

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
