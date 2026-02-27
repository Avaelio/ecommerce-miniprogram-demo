Page({
  data: {
    currentOrderId: '',
    orderInfo: null // 用来存从云端拉回来的订单详情
  },

  onLoad(options) {
    this.setData({ currentOrderId: options.orderId });

    // 根据上个页面传来的订单号，去云端查一下这单到底多少钱
    wx.cloud.database().collection('orders').doc(options.orderId).get({
      success: (res) => {
        this.setData({ orderInfo: res.data });
      }
    });
  },

  // 模拟支付按钮的点击动作
  simulatePay() {
    wx.showLoading({ title: '正在呼叫微信支付...' });
    
    // 假装微信支付处理了 1.5 秒
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '支付成功！', icon: 'success', duration: 2000 });
      
      // 支付成功后的逻辑（以后咱们可以写跳转到历史订单页，今天先弹个提示）
    }, 1500);
  },
  // 新增：取消支付的逻辑
  cancelPay() {
    wx.showToast({ title: '订单已保存', icon: 'none' });
    // 稍微停顿一下，然后把用户送回首页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }, 1000);
  }
})