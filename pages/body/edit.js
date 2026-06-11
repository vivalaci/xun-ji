// pages/body/edit.js —— 新建 / 编辑身体数据
const db = require('../../utils/db.js');
const util = require('../../utils/util.js');
const unit = require('../../utils/unit.js');

Page({
  data: {
    id: '',
    date: util.formatDate(),
    weight: '',     // 显示单位
    bodyFat: '',    // %（无单位换算）
    unitLabel: 'kg',
    saving: false
  },

  onLoad(options) {
    this.setData({ unitLabel: unit.label() });
    if (options.id) {
      wx.setNavigationBarTitle({ title: '编辑身体数据' });
      const r = db.getCache(db.COLL.BODY).find((x) => x._id === options.id);
      if (r) {
        this.setData({
          id: options.id,
          date: r.date,
          weight: r.weight == null ? '' : unit.toDisplay(r.weight),
          bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : ''
        });
      } else {
        wx.showToast({ title: '记录不存在', icon: 'none' });
      }
    } else {
      wx.setNavigationBarTitle({ title: '新建身体数据' });
    }
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onWeightInput(e) { this.setData({ weight: e.detail.value }); },
  onBodyFatInput(e) { this.setData({ bodyFat: e.detail.value }); },

  onSave() {
    if (this.data.saving) return;
    const w = Number(this.data.weight);
    if (!this.data.weight || isNaN(w) || w <= 0) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }
    this.setData({ saving: true });

    const bf = this.data.bodyFat === '' ? null : Number(this.data.bodyFat);
    const payload = {
      date: this.data.date,
      weight: unit.toStore(w),                 // 落库恒为 kg，不提前 round
      bodyFat: (bf == null || isNaN(bf)) ? null : bf
    };

    try {
      if (this.data.id) db.updateLocalFirst(db.COLL.BODY, this.data.id, payload);
      else db.saveLocalFirst(db.COLL.BODY, payload);
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      console.error(e);
      this.setData({ saving: false });
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
