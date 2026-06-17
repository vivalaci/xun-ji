// pages/curve/curve.js —— 曲线首页（可定制：排序 / 自定义曲线，见 change custom-curves）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const chart = require('../../utils/chart.js');
const curveConfig = require('../../utils/curveConfig.js');
const exerciseLib = require('../../utils/exerciseLib.js');
const calendar = require('../../utils/calendar.js');

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];

Page({
  data: {
    range: '3M',
    ranges: ['1M', '3M', '6M', 'ALL'],
    charts: [],          // 渲染用：{key,name,unit,color,latest,hasData,fixed}
    customCount: 0,
    maxCustom: curveConfig.MAX_CUSTOM,

    // 训练日历（置顶）
    weekHeaders: WEEK_HEADERS,
    calYear: 0,
    calMonth: 0,
    calLabel: '',
    cells: [],
    trainedDays: 0,
    selectedDate: '',
    selectedItems: [],
    selectedLabel: '',



    // 编辑模式
    editing: false,
    editRows: [],        // 紧凑行：{key,name,color,fixed,first,last}

    // 添加曲线面板
    pickerVisible: false,
    categories: [],      // [分类名...]
    activeCategory: 0,
    libByCategory: {}    // 分类 -> [{id,name,disabled}]
  },

  onLoad() {
    const now = new Date();
    this.setData({ calYear: now.getFullYear(), calMonth: now.getMonth() });

    // 首次进入的一次性说明，仅弹一次
    if (!wx.getStorageSync('seen_intro')) {
      wx.showModal({
        title: '欢迎使用训记',
        content: '你的训练与身体数据已与微信账号绑定，仅你本人可见，并在你的微信云中跨设备自动同步。',
        showCancel: false,
        confirmText: '知道了'
      });
      wx.setStorageSync('seen_intro', true);
    }
  },

  onShow() {
    this._prefs = db.getCache(db.COLL.PREFS)[0] || null; // 缓存优先
    this.compute();
    this.renderCalendar();
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    try {
      const [prefs] = await Promise.all([
        db.ensurePrefs(curveConfig.defaultPrefs()),
        db.refresh(db.COLL.WORKOUTS),
        db.refresh(db.COLL.BODY)
      ]);
      this._prefs = prefs;
      this.compute();
      this.renderCalendar();
    } catch (e) { /* 云环境未就绪，保留缓存渲染 */ }
  },

  // ---- 训练日历 ----
  renderCalendar() {
    const raw = db.getCache(db.COLL.WORKOUTS);
    this._byDate = calendar.aggregateByDate(raw);
    const { calYear, calMonth } = this.data;
    const data = {
      cells: calendar.monthMatrix(calYear, calMonth, this._byDate, util.formatDate()),
      calLabel: `${calYear}年${calMonth + 1}月`,
      trainedDays: calendar.trainedDaysInMonth(this._byDate, calYear, calMonth)
    };
    if (this.data.selectedDate) data.selectedItems = (this._byDate[this.data.selectedDate] || []);
    this.setData(data);
  },

  prevMonth() {
    let { calYear, calMonth } = this.data;
    if (calMonth === 0) { calYear--; calMonth = 11; } else { calMonth--; }
    this.setData({ calYear, calMonth, selectedDate: '', selectedItems: [], selectedLabel: '' }, () => this.renderCalendar());
  },
  nextMonth() {
    let { calYear, calMonth } = this.data;
    if (calMonth === 11) { calYear++; calMonth = 0; } else { calMonth++; }
    this.setData({ calYear, calMonth, selectedDate: '', selectedItems: [], selectedLabel: '' }, () => this.renderCalendar());
  },

  onPickDay(e) {
    const dateStr = e.currentTarget.dataset.date;
    const items = (this._byDate && this._byDate[dateStr]) || [];
    if (!items.length) {
      this.setData({ selectedDate: '', selectedItems: [], selectedLabel: '' });
      return;
    }
    this.setData({
      selectedDate: dateStr,
      selectedItems: items,
      selectedLabel: `${util.formatMonthDay(dateStr)} ${util.weekDay(dateStr)}`
    });
  },

  goWorkout(e) {
    wx.navigateTo({ url: `/pages/workout/edit?id=${e.currentTarget.dataset.id}` });
  },

  switchRange(e) {
    this.setData({ range: e.currentTarget.dataset.range }, () => this.compute());
  },

  // 按配置合成图表定义，计算各曲线数据并触发绘制
  compute() {
    if (this.data.editing) return; // 编辑模式不画图
    const composed = curveConfig.composeCharts(this._prefs);
    this._composed = composed;

    const start = util.rangeStartTs(this.data.range);
    const workouts = db.getCache(db.COLL.WORKOUTS);
    const body = db.getCache(db.COLL.BODY);

    this._series = {}; // key -> points（升序）或 bodyCombined 的 [{def, points}]
    const meta = composed.map((c) => {
      // 身体趋势：三线合并（体重/体脂/腰围），每线独立缩放
      if (c.type === 'bodyCombined') {
        const built = c.series.map((sd) => {
          const pts = body
            .filter((r) => new Date(r.date).getTime() >= start && typeof r[sd.field] === 'number')
            .map((r) => ({ x: r.date, y: sd.convert ? unit.toDisplay(r[sd.field]) : r[sd.field] }))
            .sort((a, b) => new Date(a.x) - new Date(b.x));
          return { def: sd, points: pts };
        });
        this._series[c.key] = built;
        return {
          key: c.key,
          name: c.name,
          type: 'bodyCombined',
          fixed: c.fixed,
          hasData: built.some((b) => b.points.length > 0),
          legend: built.map((b) => ({
            name: b.def.name,
            color: b.def.color,
            unit: b.def.unit === 'kg' ? unit.label() : b.def.unit,
            latest: b.points.length ? b.points[b.points.length - 1].y : null
          }))
        };
      }

      // lift 单线（c.ids 为变式聚合，如硬拉；无则单 id）
      const ids = c.ids || [c.id];
      const points = workouts
        .filter((w) => new Date(w.date).getTime() >= start)
        .map((w) => {
          const mw = util.dayLiftValue(w, ids);
          return mw == null ? null : { x: w.date, y: unit.toDisplay(mw) };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.x) - new Date(b.x));
      this._series[c.key] = points;
      const lastY = points.length ? points[points.length - 1].y : null;
      return {
        key: c.key,
        name: c.name,
        unit: unit.label(),
        color: c.color,
        fixed: c.fixed,
        type: c.type,
        hasData: points.length > 0,
        latest: lastY == null ? null : Math.round(lastY) // lift 取整
      };
    });

    const customCount = ((this._prefs && this._prefs.customCurves) || []).length;
    this.setData({ charts: meta, customCount }, () => this.draw());
  },

  draw() {
    const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
    (this._composed || []).forEach((c) => {
      wx.createSelectorQuery().in(this)
        .select('#chart_' + c.key)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dim = { canvas, ctx, width: res[0].width, height: res[0].height, dpr };
          if (c.type === 'bodyCombined') {
            const built = this._series[c.key] || [];
            chart.drawMultiLine(Object.assign(dim, {
              series: built.map((b) => ({ points: b.points, color: b.def.color }))
            }));
          } else {
            chart.drawLineChart(Object.assign(dim, {
              points: this._series[c.key],
              color: c.color,
              yDecimals: 0 // lift 取整
            }));
          }
        });
    });
  },

  goDetail(e) {
    const key = e.currentTarget.dataset.key;
    const c = (this._composed || []).find((x) => x.key === key);
    if (c && c.type === 'lift') {
      wx.navigateTo({ url: `/pages/exercise/detail?id=${c.id}` });
    } else {
      // 体重/体脂：跳身体 Tab 查看明细
      wx.switchTab({ url: '/pages/body/body' });
    }
  },

  // ---- 编辑模式（长按进入；↑/↓ 排序；⊝ 删自定义；完成时一次性持久化） ----
  enterEdit() {
    const p = this._prefs || curveConfig.defaultPrefs();
    this._draft = {
      curveOrder: curveConfig.composeCharts(p).map((c) => c.key), // 以合成结果为准（已自愈）
      customCurves: (p.customCurves || []).slice()
    };
    this.setData({ editing: true }, () => this.renderEditRows());
  },

  renderEditRows() {
    const rows = curveConfig.composeCharts(this._draft).map((c, i, arr) => ({
      key: c.key,
      name: c.name,
      color: c.color,
      fixed: c.fixed,
      first: i === 0,
      last: i === arr.length - 1
    }));
    this.setData({ editRows: rows });
  },

  onMove(e) {
    const { key, dir } = e.currentTarget.dataset;
    this._draft.curveOrder = curveConfig.moveKey(this._draft.curveOrder, key, dir);
    this.renderEditRows();
  },

  onRemoveCustom(e) {
    this._draft = curveConfig.removeCustom(this._draft, e.currentTarget.dataset.key);
    this.renderEditRows();
  },

  async finishEdit() {
    this._prefs = await db.ensurePrefs(curveConfig.defaultPrefs()); // 确保文档存在（首次编辑即建档）
    this._prefs = db.updatePrefs({
      curveOrder: this._draft.curveOrder,
      customCurves: this._draft.customCurves
    }) || this._prefs;
    this.setData({ editing: false }, () => this.compute());
  },

  // ---- 添加曲线 ----
  openPicker() {
    if (this.data.customCount >= curveConfig.MAX_CUSTOM) {
      wx.showToast({ title: `自定义曲线最多 ${curveConfig.MAX_CUSTOM} 条`, icon: 'none' });
      return;
    }
    const shownIds = {};
    (this._composed || []).forEach((c) => { if (c.type === 'lift') shownIds[c.id] = true; });
    const byCat = exerciseLib.byCategory();
    const categories = Object.keys(byCat);
    const libByCategory = {};
    categories.forEach((cat) => {
      libByCategory[cat] = byCat[cat].map((ex) => ({
        id: ex.id, name: ex.name, disabled: !!shownIds[ex.id]
      }));
    });
    this.setData({ pickerVisible: true, categories, libByCategory, activeCategory: 0 });
  },
  closePicker() { this.setData({ pickerVisible: false }); },
  switchCategory(e) { this.setData({ activeCategory: e.currentTarget.dataset.index }); },

  async pickExercise(e) {
    const { id, disabled } = e.currentTarget.dataset;
    if (disabled) {
      wx.showToast({ title: '该动作已在首页展示', icon: 'none' });
      return;
    }
    this._prefs = await db.ensurePrefs(curveConfig.defaultPrefs());
    const result = curveConfig.addCustom(this._prefs, id);
    if (!result.ok) {
      wx.showToast({
        title: result.reason === 'limit' ? `自定义曲线最多 ${curveConfig.MAX_CUSTOM} 条` : '该动作已在首页展示',
        icon: 'none'
      });
      return;
    }
    this._prefs = db.updatePrefs(result.prefs) || this._prefs;
    this.setData({ pickerVisible: false }, () => this.compute());
  }
});
