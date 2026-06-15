// pages/workout/list.js —— 训练记录列表（顶部嵌入训练日历）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');
const calendar = require('../../utils/calendar.js');

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'];

Page({
  data: {
    workouts: [],
    pending: false,
    loaded: false,
    unitLabel: 'kg',

    // 日历
    weekHeaders: WEEK_HEADERS,
    calYear: 0,
    calMonth: 0,          // 0-11
    calLabel: '',
    cells: [],
    trainedDays: 0,
    selectedDate: '',
    selectedItems: [],
    selectedLabel: ''
  },

  onLoad() {
    const now = new Date();
    this.setData({ calYear: now.getFullYear(), calMonth: now.getMonth() });
  },

  onShow() {
    this.setData({ unitLabel: unit.label() });
    this.renderFromCache();   // 缓存优先：先渲染
    this.refresh();           // 再拉云端
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  renderFromCache() {
    const raw = db.getCache(db.COLL.WORKOUTS);
    this.setData({ workouts: this.decorate(raw), pending: db.hasPending() });
    this.renderCalendar(raw);
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.WORKOUTS);
      this.setData({ workouts: this.decorate(data), pending: db.hasPending(), loaded: true });
      this.renderCalendar(data);
    } catch (e) {
      this.setData({ loaded: true }); // 云环境未就绪时仍展示缓存
    }
  },

  decorate(list) {
    const prMap = util.buildPRMap(list);
    return (list || []).map((w) => ({
      _id: w._id,
      name: w.name || '训练',
      dateLabel: `${util.formatMonthDay(w.date)} ${util.weekDay(w.date)}`,
      exerciseCount: (w.exercises || []).length,
      sets: util.totalSets(w.exercises),
      volume: Math.round(unit.toDisplay(util.totalVolume(w.exercises))),
      prCount: prMap[w._id] ? prMap[w._id].size : 0,
      pending: !!w._pending
    }));
  },

  // ---- 日历 ----
  renderCalendar(rawWorkouts) {
    const raw = rawWorkouts || db.getCache(db.COLL.WORKOUTS);
    this._byDate = calendar.aggregateByDate(raw);
    const { calYear, calMonth } = this.data;
    const todayStr = util.formatDate();
    const cells = calendar.monthMatrix(calYear, calMonth, this._byDate, todayStr);
    const data = {
      cells,
      calLabel: `${calYear}年${calMonth + 1}月`,
      trainedDays: calendar.trainedDaysInMonth(this._byDate, calYear, calMonth)
    };
    // 若已选中某天，刷新其详情
    if (this.data.selectedDate) {
      data.selectedItems = (this._byDate[this.data.selectedDate] || []);
    }
    this.setData(data);
  },

  prevMonth() {
    let { calYear, calMonth } = this.data;
    if (calMonth === 0) { calYear--; calMonth = 11; } else { calMonth--; }
    this.setData({ calYear, calMonth, selectedDate: '', selectedItems: [] }, () => this.renderCalendar());
  },
  nextMonth() {
    let { calYear, calMonth } = this.data;
    if (calMonth === 11) { calYear++; calMonth = 0; } else { calMonth++; }
    this.setData({ calYear, calMonth, selectedDate: '', selectedItems: [] }, () => this.renderCalendar());
  },

  onPickDay(e) {
    const dateStr = e.currentTarget.dataset.date;
    const items = (this._byDate && this._byDate[dateStr]) || [];
    if (!items.length) {
      this.setData({ selectedDate: '', selectedItems: [], selectedLabel: '' }); // 空白日清选中
      return;
    }
    this.setData({
      selectedDate: dateStr,
      selectedItems: items,
      selectedLabel: `${util.formatMonthDay(dateStr)} ${util.weekDay(dateStr)}`
    });
  },

  goNew() { wx.navigateTo({ url: '/pages/workout/edit' }); },
  goEdit(e) { wx.navigateTo({ url: `/pages/workout/edit?id=${e.currentTarget.dataset.id}` }); },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除训练', content: '确定删除这条训练记录吗？' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.WORKOUTS, id);
    this.renderFromCache();
  }
});
