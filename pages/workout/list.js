// pages/workout/list.js —— 训练记录列表（增量渲染；日历已移至首页）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

const PAGE_SIZE = 30;

Page({
  data: {
    workouts: [],        // 已渲染的切片
    pending: false,
    loaded: false,
    unitLabel: 'kg',
    visibleCount: PAGE_SIZE,
    hasMore: false
  },

  onShow() {
    this.setData({ unitLabel: unit.label() });
    this.renderFromCache();   // 缓存优先：先渲染
    this.refresh();           // 再拉云端
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  // 滚动到底部追加一批（纯前端切片，不查询云端）
  onReachBottom() {
    if (!this.data.hasMore) return;
    this.setData({ visibleCount: this.data.visibleCount + PAGE_SIZE }, () => this.applyVisible());
  },

  renderFromCache() {
    this._all = this.decorate(db.getCache(db.COLL.WORKOUTS));
    this.setData({ pending: db.hasPending() });
    this.applyVisible();
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.WORKOUTS);
      this._all = this.decorate(data);
      this.setData({ pending: db.hasPending(), loaded: true });
      this.applyVisible();
    } catch (e) {
      this.setData({ loaded: true }); // 云环境未就绪时仍展示缓存
    }
  },

  // 按当前 visibleCount 切片渲染（刷新/onShow 保留已展开的批次量，不缩回首批）
  applyVisible() {
    const all = this._all || [];
    this.setData({
      workouts: all.slice(0, this.data.visibleCount),
      hasMore: all.length > this.data.visibleCount
    });
  },

  decorate(list) {
    const prMap = util.buildPRMap(list);
    return (list || []).map((w) => {
      const base = {
        _id: w._id,
        name: w.name || '训练',
        dateLabel: `${util.formatMonthDay(w.date)} ${util.weekDay(w.date)}`,
        cardio: w.type === 'cardio',
        isToday: util.isToday(w.date), // 今日记录高亮（渲染层判定，不落库）
        pending: !!w._pending
      };
      if (w.type === 'cardio') {
        // 有氧摘要：每个活动 "名称 时长min·距离km/层数"
        base.cardioText = (w.exercises || []).map((ex) => {
          const second = ex.distance != null ? `${ex.distance}km` : (ex.floors != null ? `${ex.floors}层` : '');
          return `${ex.name} ${ex.duration || 0}min${second ? ' · ' + second : ''}`;
        }).join('；');
        return base;
      }
      base.exerciseCount = (w.exercises || []).length;
      base.sets = util.totalSets(w.exercises);
      base.volume = Math.round(unit.toDisplay(util.totalVolume(w.exercises)));
      base.prCount = prMap[w._id] ? prMap[w._id].size : 0;
      return base;
    });
  },

  goNew() { wx.navigateTo({ url: '/pages/workout/pick' }); },
  goEdit(e) { wx.navigateTo({ url: `/pages/workout/edit?id=${e.currentTarget.dataset.id}` }); },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除训练', content: '确定删除这条训练记录吗？' });
    if (!res.confirm) return;
    db.removeLocalFirst(db.COLL.WORKOUTS, id);
    this.renderFromCache();
  }
});
