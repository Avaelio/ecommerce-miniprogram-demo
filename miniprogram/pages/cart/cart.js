Page({
  data: {
    cartList: [],   
    totalPrice: 0,
    // 新增：默认配送方式，设为 'takeout' (外卖)
    deliveryType: 'takeout', 
    // 新增：地址信息
    hasAddress: false,
    address: {},
    // 新增：自提门店信息
    selectedStore: '',
    // 新增：用户备注
    remark: ''
  },

  // 每次切到购物车页面，立刻读档
  onShow() {
    // 🌟 统一保险箱密码：myCartData
    let currentCart = wx.getStorageSync('myCartData') || [];
    // 读完档直接叫收银员算账，避免代码重复
    this.calculateTotal(currentCart); 
  },
  // 切换配送方式的函数
  switchDelivery(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      deliveryType: type
    });
  },
  // 获取微信原生地址的快捷方法（非常实用！）
  chooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({
          hasAddress: true,
          address: res
        });
      },
      fail: (err) => {
        console.log('用户拒绝了授权或取消选择', err);
      }
    })
  },
  // 记录备注
  inputRemark(e) {
    this.setData({
      remark: e.detail.value
    });
  },
  // 专属收银员：负责算总价，并把最新情况存回手机
  calculateTotal(cart) {
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
    });
    
    this.setData({
      cartList: cart, // 🌟 统一变量名：cartList
      totalPrice: total
    });
    // 🌟 统一保险箱密码：myCartData
    wx.setStorageSync('myCartData', cart);
  },

  // 点击“+”号触发
  addQty(e) {
    const index = e.currentTarget.dataset.index;
    let cart = this.data.cartList;
    cart[index].quantity += 1; 
    this.calculateTotal(cart); 
  },

  // 点击“-”号触发
  subQty(e) {
    const index = e.currentTarget.dataset.index;
    let cart = this.data.cartList;
    
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1; 
      this.calculateTotal(cart); 
    } else {
      wx.showModal({
        title: '温馨提示',
        content: '确定不要这份钵仔糕了吗？',
        confirmColor: '#E74C3C',
        success: (res) => {
          if (res.confirm) {
            cart.splice(index, 1); 
            this.calculateTotal(cart); 
          }
        }
      })
    }
  },

 // 在 cart.js 中更新此函数
submitOrder() {
  const { cartList, totalPrice, deliveryType, hasAddress, address, selectedStore, remark } = this.data;

  // --- 1. 下单前校验 ---
  if (cartList.length === 0) {
    wx.showToast({ title: '还没有选钵仔糕呢', icon: 'none' });
    return;
  }

  // 如果是外卖或邮寄，必须填地址
  if ((deliveryType === 'takeout' || deliveryType === 'shipping') && !hasAddress) {
    wx.showToast({ title: '请先添加收货地址', icon: 'none' });
    return;
  }

  // 如果是自提，必须选门店
  if (deliveryType === 'pickup' && !selectedStore) {
    wx.showToast({ title: '请选择自提门店', icon: 'none' });
    return;
  }

  wx.showLoading({ title: '订单生成中...', mask: true });

  // --- 2. 构造更完整的订单数据 ---
  const orderData = {
    items: cartList,
    totalPrice: totalPrice,
    delivery: {
      type: deliveryType, // 'takeout' | 'pickup' | 'shipping'
      address: hasAddress ? address : null,
      store: selectedStore || null
    },
    remark: remark, // 备注信息
    createTime: new Date(),
    status: '待接单' // 改为待接单，方便你在后台处理
  };

  // --- 3. 写入云数据库 ---
  wx.cloud.database().collection('orders').add({
    data: orderData,
    success: (res) => {
      wx.hideLoading();
      wx.removeStorageSync('myCartData'); // 清空本地购物车缓存 
      
      wx.showToast({ title: '下单成功！', icon: 'success' });

      // 跳转到支付页或订单详情页
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/order/detail?id=' + res._id 
        });
      }, 1500);
    },
    fail: (err) => {
      wx.hideLoading();
      wx.showToast({ title: '下单失败，请重试', icon: 'error' });
    }
  });
}
  //
})