// pages/profile/profile.js —— 我的（迭代一占位；模板管理/动作库/设置迭代二实现）
Page({
  data: {},
  goTemplates() { wx.navigateTo({ url: '/pages/template/manage' }); },
  goLibrary() { wx.navigateTo({ url: '/pages/exercise/library' }); },
  goSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  about() {
    wx.showModal({
      title: '关于训记',
      content: '面向进阶训练者的健身记录工具。追踪三大项进步曲线与身体数据，数据存于你的微信云开发环境，仅你本人可见。',
      showCancel: false
    });
  }
});
