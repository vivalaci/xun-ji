// app.js
const db = require('./utils/db.js');

App({
  globalData: {
    cloudReady: false
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('基础库版本过低，请升级微信开发者工具或基础库版本');
      return;
    }
    wx.cloud.init({
      // env: 替换成你自己的云开发环境 ID；DYNAMIC_CURRENT_ENV 表示默认环境
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    });
    this.globalData.cloudReady = true;

    // 启动时尝试把上次未同步成功的本地写入推到云端（弱网兜底）
    db.flushQueue();

    // 联网恢复时也重试一次
    wx.onNetworkStatusChange((res) => {
      if (res.isConnected) db.flushQueue();
    });
  }
});
