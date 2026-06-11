// pages/dashboard/dashboard.js —— 今日总览（首页）
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    greeting: '',
    dateLabel: '',
    nickname: '健身爱好者',

    todayWorkouts: [],     // 今天的训练
    todayHasWorkout: false,

    latestWeight: null,    // 最新体重
    weightDelta: null,     // 较上次变化（带正负号）
    weightDeltaClass: '',  // up / down / ''

    weekCount: 0,          // 本周训练次数
    weekVolume: 0,         // 本周容量
    weekBars: [],          // 本周 7 天是否训练

    totalWorkouts: 0,      // 累计训练次数
    loading: true
  },

  onShow() {
    this.setGreeting();
    const info = wx.getStorageSync('userProfile');
    if (info && info.nickname) this.setData({ nickname: info.nickname });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  setGreeting() {
    const h = new Date().getHours();
    let greeting = '晚上好';
    if (h < 6) greeting = '凌晨好';
    else if (h < 12) greeting = '早上好';
    else if (h < 14) greeting = '中午好';
    else if (h < 18) greeting = '下午好';
    const now = new Date();
    this.setData({
      greeting,
      dateLabel: `${util.formatMonthDay(now)} ${util.weekDay(now)}`
    });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [workouts, body] = await Promise.all([
        db.list(db.COLL.WORKOUTS, { limit: 200 }),
        db.list(db.COLL.BODY, { limit: 30 })
      ]);

      const today = util.formatDate();

      // ---- 今日训练 ----
      const todayWorkouts = workouts
        .filter((w) => w.date === today)
        .map((w) => ({
          _id: w._id,
          name: w.name || '训练',
          exerciseCount: (w.exercises || []).length,
          sets: util.totalSets(w.exercises),
          volume: util.totalVolume(w.exercises)
        }));

      // ---- 本周训练 ----
      const weekStart = this.weekStartTs(new Date());
      const trainedDays = new Set();
      let weekCount = 0;
      let weekVolume = 0;
      workouts.forEach((w) => {
        const ts = new Date(w.date).getTime();
        if (ts >= weekStart) {
          weekCount += 1;
          weekVolume += util.totalVolume(w.exercises);
          trainedDays.add(this.dayIndex(w.date));
        }
      });
      const weekBars = ['一', '二', '三', '四', '五', '六', '日'].map((label, i) => ({
        label,
        active: trainedDays.has(i),
        isToday: this.dayIndex(today) === i
      }));

      // ---- 体重 ----
      const weightRecords = body.filter((r) => typeof r.weight === 'number');
      let latestWeight = null;
      let weightDelta = null;
      let weightDeltaClass = '';
      if (weightRecords.length > 0) {
        latestWeight = weightRecords[0].weight;
        if (weightRecords.length > 1) {
          const diff = +(weightRecords[0].weight - weightRecords[1].weight).toFixed(1);
          if (diff !== 0) {
            weightDelta = (diff > 0 ? '+' : '') + diff;
            weightDeltaClass = diff > 0 ? 'up' : 'down';
          } else {
            weightDelta = '持平';
          }
        }
      }

      this.setData({
        todayWorkouts,
        todayHasWorkout: todayWorkouts.length > 0,
        weekCount,
        weekVolume,
        weekBars,
        latestWeight,
        weightDelta,
        weightDeltaClass,
        totalWorkouts: workouts.length,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请检查云环境', icon: 'none' });
    }
  },

  // 本周周一 0 点时间戳
  weekStartTs(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return d.getTime();
  },
  // 周一=0 ... 周日=6
  dayIndex(date) {
    return (new Date(date).getDay() + 6) % 7;
  },

  // ---- 跳转 ----
  startWorkout() {
    wx.navigateTo({ url: '/pages/workout/edit' });
  },
  viewWorkout(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/workout/edit?id=${id}` });
  },
  goWorkoutList() {
    wx.switchTab({ url: '/pages/workout/list' });
  },
  goBody() {
    wx.switchTab({ url: '/pages/body/body' });
  },
  goStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
