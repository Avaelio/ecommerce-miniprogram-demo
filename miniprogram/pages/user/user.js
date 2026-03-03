Page({
  data: {
    isLogin: false,
    userInfo: {
      avatarUrl: '', 
      nickName: '微信用户',
      phoneNumber: '' // 存储用户手机号
    },
    
    assets: [
      { name: '余额', value: '*' },
      { name: '优惠券', value: '*' },
      { name: '积分', value: '*' }
    ],

    menuList: [
      { name: '订单中心', url: '/pages/orderList/orderList' },
      { name: '个人信息', url: '' },
      { name: '客服中心', url: '' },
      { name: '我的地址', url: '' },
      { name: '会员储值', url: '' }
    ]
  },

  onLoad() {
    const savedUser = wx.getStorageSync('myUserInfo');
    if (savedUser && savedUser.phoneNumber) {
      this.loginSuccess(savedUser); 
    }
  },

 // 1. 获取微信手机号并执行登录
 handleGetPhoneNumber(e) {
  // 如果微信返回不成功（比如用户点拒绝，或者账号没权限）
  if (e.detail.errMsg !== "getPhoneNumber:ok") {
    console.log('获取手机号被拦截，原因：', e.detail.errMsg);
    
    // 🌟 【本地测试专用】因为没权限弹不出窗口，我们弹一个普通的确认框模拟一下
    wx.showModal({
      title: '权限受限',
      content: '当前账号无获取手机号权限。是否使用【模拟数据】继续体验登录效果？',
      success: (res) => {
        if (res.confirm) {
          this.doMockLogin(); // 用户点击确定，执行模拟登录
        }
      }
    });
    return; // 拦截原本的流程
  }

  // 如果你有企业权限并且真的弹出了窗口、用户点了允许，就会走这里
  this.doMockLogin();
},

// 🌟 把原来写在里面的登录逻辑抽离出来，方便随时调用
doMockLogin() {
  wx.showLoading({ title: '安全登录中...' });

  wx.login({
    success: (res) => {
      if (res.code) {
        // 模拟网络请求延迟 (1秒)
        setTimeout(() => {
          wx.hideLoading();
          
          // 模拟后端返回的数据
          const mockUser = {
            ...this.data.userInfo, 
            phoneNumber: '138****8888', // 模拟一个假手机号
            nickName: '钵仔糕新客_' + res.code.substring(0, 4) 
          };

          this.loginSuccess(mockUser);
          wx.setStorageSync('myUserInfo', mockUser);
          wx.showToast({ title: '登录成功！', icon: 'success' });
        }, 1000);
      }
    },
    fail: () => {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  });
},
  // 2. 获取/更改真实头像
  onChooseAvatar(e) {
    const realAvatarUrl = e.detail.avatarUrl; 
    const updatedUserInfo = { ...this.data.userInfo, avatarUrl: realAvatarUrl };

    this.setData({ userInfo: updatedUserInfo });
    if (this.data.isLogin) {
      wx.setStorageSync('myUserInfo', updatedUserInfo);
    }
    wx.showToast({ title: '头像更新成功', icon: 'success' });
  },

  // 3. 获取/更改真实昵称 
  onInputNickname(e) {
    const realNickName = e.detail.value; 
    if (!realNickName) return;

    const updatedUserInfo = { ...this.data.userInfo, nickName: realNickName };
    this.setData({ userInfo: updatedUserInfo });
    if (this.data.isLogin) {
      wx.setStorageSync('myUserInfo', updatedUserInfo);
    }
  },

  // 登录成功状态
  loginSuccess(user) {
    this.setData({
      isLogin: true,
      userInfo: user,
      assets: [
        { name: '余额', value: '0.00' },
        { name: '优惠券', value: '2' }, 
        { name: '积分', value: '150' }  
      ]
    });
  },

  // 退出逻辑
  handleLogout() {
    wx.removeStorageSync('myUserInfo');
    this.setData({
      isLogin: false,
      userInfo: { avatarUrl: '', nickName: '微信用户', phoneNumber: '' },
      assets: [
        { name: '余额', value: '*' },
        { name: '优惠券', value: '*' },
        { name: '积分', value: '*' }
      ]
    });
  },

  handleMenuClick(e) {
    const item = e.currentTarget.dataset.item;
    wx.showToast({ title: '跳转：' + item.name, icon: 'none' });
  }
})