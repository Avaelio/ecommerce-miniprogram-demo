App({
  onLaunch() {
    // 1. 唤醒云开发环境 (注意：把 env 里的云环境 ID 换成你自己的真实 ID ！)
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d1gp4dzof6844fa0d', // 👈 这里填你真实的云环境ID
        traceUser: true,
      });
    }

    // 2. 核心大招：小程序一启动，立刻静默获取当前用户的 OpenID 并存入口袋
    this.silentLogin();
  },

  silentLogin() {
    wx.cloud.callFunction({
      name: 'login', // 呼叫咱们之前建好的 login 云函数
      success: res => {
        console.log('【App入口】成功静默获取身份标志：', res.result.openid);
        // 把这把钥匙死死焊在本地缓存里，名字就叫 userOpenId
        wx.setStorageSync('userOpenId', res.result.openid);
      },
      fail: err => {
        console.error('【App入口】静默获取身份失败，请检查 login 云函数是否部署', err);
      }
    });
  }
});