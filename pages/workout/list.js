// pages/workout/list.js —— 训练记录列表
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

Page({
  data: {
    workouts: [],
    pending: false,
    loaded: false,
    unitLabel: 'kg'
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
    this.setData({
      workouts: this.decorate(db.getCache(db.COLL.WORKOUTS)),
      pending: db.hasPending()
    });
  },

  async refresh() {
    try {
      const data = await db.refresh(db.COLL.WORKOUTS);
      this.setData({ workouts: this.decorate(data), pending: db.hasPending(), loaded: true });
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
