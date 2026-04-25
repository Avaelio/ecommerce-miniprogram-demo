Page({
  data: {
    // 轮播图数据
    bannerList: [
      '/images/gjsz.png', // 假装这是钵仔糕海报1
      '/images/gjsz.png', // 假装这是钵仔糕海报1
      '/images/gjsz.png', // 假装这是钵仔糕海报1
    ]
  },
  // ... 其他代码保留
  // 跳转到点单页 (我们之前已经把点单做成了 tabBar 页面，所以必须用 switchTab)
  goToOrder(e) {
    const orderType = e.currentTarget.dataset.type;
    // 以后可以在这里把 orderType 存起来，比如传给全局变量，这样点单页就知道现在是自提还是外卖了
    wx.switchTab({
      url: '/pages/order/order'
    });
  },

  // 拨打电话功能
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: '13800000000', // 这里以后填真实的电话号码
      success() {
        console.log('拨打电话成功')
      }
    });
  }
})