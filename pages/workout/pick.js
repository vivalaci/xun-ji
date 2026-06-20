// pages/workout/pick.js —— 新建训练·选模板（独立页，从训练列表进入）
// 选模板/空白后跳 edit 页；返回键天然退回本页（修复原同页 stage 返回直接退到列表）。
const db = require('../../utils/db.js');
const templateLib = require('../../utils/templateLib.js');
const calendar = require('../../utils/calendar.js');

// 给每个模板行附分化色点（与日历同源取色）。
function withDotColors(groups) {
  return (groups || []).map((g) => Object.assign({}, g, {
    items: (g.items || []).map((it) => Object.assign({}, it, { dotColor: calendar.typeOf(it).color }))
  }));
}

Page({
  data: {
    templateGroups: [],
    groupNotes: templateLib.GROUP_NOTES // 分组循证说明
  },

  async onLoad() {
    try {
      const templates = await db.ensureTemplatesSeeded();
      this.setData({ templateGroups: withDotColors(templateLib.groupTemplates(templates)) });
    } catch (e) {
      this.setData({ templateGroups: [] });
    }
  },

  pickTemplate(e) {
    wx.navigateTo({ url: `/pages/workout/edit?templateId=${e.currentTarget.dataset.id}` });
  },
  pickBlank() {
    wx.navigateTo({ url: '/pages/workout/edit?blank=1' });
  }
});
