// pages/profile/profile.js —— 我的（迭代一占位；模板管理/动作库/设置迭代二实现）
Page({
  data: {},
  goTemplates() { wx.navigateTo({ url: '/pages/template/manage' }); },
  goLibrary() { wx.navigateTo({ url: '/pages/exercise/library' }); },
  goSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  goManual() { wx.navigateTo({ url: '/pages/manual/manual' }); },
  about() {
    wx.showModal({
      title: '关于训记',
      content: '开发者为健身多年的进阶训练者，初衷是为了方便自己记录健身数据，但在开发的过程中研究了许多论文，结合自己经验设置了该小程序的训练内容，详情可见使用说明。',
      showCancel: false
    });
  }
});
