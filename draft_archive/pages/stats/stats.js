// pages/stats/stats.js —— 训练统计
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    loading: true,
    totalWorkouts: 0,
    totalVolume: 0,
    totalSets: 0,
    trainDays: 0,
    monthCount: 0,
    weekBars: [],      // 最近 8 周训练次数柱状
    prList: []         // 各动作历史最大重量（个人记录）
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const workouts = await db.list(db.COLL.WORKOUTS, { limit: 500 });

      let totalVolume = 0;
      let totalSets = 0;
      const days = new Set();
      const prMap = {};                 // 动作 -> 最大重量
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let monthCount = 0;

      // 最近 8 周计数
      const weekBuckets = new Array(8).fill(0);
      const startOfThisWeek = this.weekStart(now);

      workouts.forEach((w) => {
        totalVolume += util.totalVolume(w.exercises);
        totalSets += util.totalSets(w.exercises);
        days.add(w.date);
        if ((w.date || '').startsWith(monthKey)) monthCount += 1;

        // 个人记录
        (w.exercises || []).forEach((ex) => {
          (ex.sets || []).forEach((s) => {
            const ww = Number(s.weight) || 0;
            if (ww > 0 && (!prMap[ex.name] || ww > prMap[ex.name])) {
              prMap[ex.name] = ww;
            }
          });
        });

        // 周分桶
        const d = new Date(w.date);
        const diffWeeks = Math.floor((startOfThisWeek - this.weekStart(d)) / (7 * 24 * 3600 * 1000));
        if (diffWeeks >= 0 && diffWeeks < 8) {
          weekBuckets[7 - diffWeeks] += 1;
        }
      });

      const maxBar = Math.max(1, ...weekBuckets);
      const weekBars = weekBuckets.map((c, i) => ({
        count: c,
        height: Math.round((c / maxBar) * 100),
        label: i === 7 ? '本周' : `${7 - i}周前`
      }));

      const prList = Object.keys(prMap)
        .map((name) => ({ name, weight: prMap[name] }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 10);

      this.setData({
        loading: false,
        totalWorkouts: workouts.length,
        totalVolume,
        totalSets,
        trainDays: days.size,
        monthCount,
        weekBars,
        prList
      });
    } catch (e) {
      console.error(e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 取某天所在周的周一 0 点时间戳
  weekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7; // 周一=0
    d.setDate(d.getDate() - day);
    return d.getTime();
  }
});
