Page({
  data: {
    // 轮播图数据
    bannerList: [
      '//miniprogram//images//picture', // 假装这是钵仔糕海报1
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', // 假装这是钵仔糕海报2
      'https://images.unsplash.com/photo-1484723091791-c0e7e53c7113?w=800&q=80'  // 假装这是钵仔糕海报3
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