// pages/settings/settings.js —— 设置（重量单位）
const store = require('../../utils/store.js');

Page({
  data: {
    weightUnit: 'kg',
    units: ['kg', 'lb']
  },

  onShow() {
    this.setData({ weightUnit: store.getSettings().weightUnit || 'kg' });
  },

  pickUnit(e) {
    const weightUnit = e.currentTarget.dataset.unit;
    store.setSettings({ weightUnit });
    this.setData({ weightUnit });
    wx.showToast({ title: `已切换为 ${weightUnit}`, icon: 'none' });
  }
});
