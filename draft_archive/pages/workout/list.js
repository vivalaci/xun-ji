// pages/workout/list.js —— 训练记录列表（首页）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    loading: true,
    workouts: [],
    weekVolume: 0,
    weekCount: 0
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const raw = await db.list(db.COLL.WORKOUTS, { limit: 100 });
      const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      let weekVolume = 0;
      let weekCount = 0;

      const workouts = raw.map((w) => {
        const volume = util.totalVolume(w.exercises);
        const sets = util.totalSets(w.exercises);
        if (new Date(w.date).getTime() >= oneWeekAgo) {
          weekVolume += volume;
          weekCount += 1;
        }
        return {
          _id: w._id,
          name: w.name || '训练',
          date: w.date,
          dateLabel: `${util.formatMonthDay(w.date)} ${util.weekDay(w.date)}`,
          exerciseCount: (w.exercises || []).length,
          sets,
          volume,
          note: w.note || ''
        };
      });

      this.setData({ workouts, weekVolume, weekCount, loading: false });
    } catch (e) {
      console.error(e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请检查云环境', icon: 'none' });
    }
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id || '';
    wx.navigateTo({ url: `/pages/workout/edit?id=${id}` });
  },

  goNew() {
    wx.navigateTo({ url: '/pages/workout/edit' });
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const res = await wx.showModal({ title: '删除训练', content: '确定删除这条训练记录吗？' });
    if (!res.confirm) return;
    try {
      await db.remove(db.COLL.WORKOUTS, id);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});
