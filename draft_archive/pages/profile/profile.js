// pages/profile/profile.js —— 我的
Page({
  data: {
    avatar: '',
    nickname: '健身爱好者'
  },

  onLoad() {
    const info = wx.getStorageSync('userProfile');
    if (info) this.setData(info);
  },

  // 头像选择（新版 button open-type 方式）
  onChooseAvatar(e) {
    const avatar = e.detail.avatarUrl;
    this.setData({ avatar });
    wx.setStorageSync('userProfile', { avatar, nickname: this.data.nickname });
  },
  onNickInput(e) {
    const nickname = e.detail.value || '健身爱好者';
    this.setData({ nickname });
    wx.setStorageSync('userProfile', { avatar: this.data.avatar, nickname });
  },

  about() {
    wx.showModal({
      title: '关于训记',
      content: '一个简单的健身数据记录小程序，支持力量训练与身体数据记录。数据保存在你自己的微信云开发环境中。',
      showCancel: false
    });
  }
});
