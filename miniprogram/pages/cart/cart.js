Page({
  data: {
    cartList: [],   
    totalPrice: 0   
  },

  onShow() {
    this.loadCart(); // 页面显示时，去拿数据
  },
  // 把算钱的逻辑单独抽出来，这样每次加减数量后，都可以直接叫它重新算账
  loadCart() {
    let cart = wx.getStorageSync('cart') || [];
    this.calculateTotal(cart);
  },

  // 专属收银员：负责算总价，并把最新情况存回手机
  calculateTotal(cart) {
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
    });
    
    this.setData({
      cartList: cart,
      totalPrice: total
    });
    // 关键：每次算完账，顺手把最新的购物车状态锁进保险柜（缓存）里
    wx.setStorageSync('cart', cart);
  },

  // 点击“+”号触发
  addQty(e) {
    // 抓取当前点的是列表里的第几个（索引 index）
    const index = e.currentTarget.dataset.index;
    let cart = this.data.cartList;
    cart[index].quantity += 1; // 数量 +1
    this.calculateTotal(cart); // 重新算账！
  },

  // 点击“-”号触发
  subQty(e) {
    const index = e.currentTarget.dataset.index;
    let cart = this.data.cartList;
    
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1; // 数量 -1
      this.calculateTotal(cart); // 重新算账！
    } else {
      // 如果只剩 1 个了还点减号，就弹窗问要不要删除
      wx.showModal({
        title: '温馨提示',
        content: '确定不要这份钵仔糕了吗？',
        confirmColor: '#E74C3C',
        success: (res) => {
          if (res.confirm) {
            cart.splice(index, 1); // 从数组里狠狠踢出去
            this.calculateTotal(cart); // 重新算账！
          }
        }
      })
    }
  },
  // 终极魔法：提交订单到云端
  // 终极魔法：提交订单到云端并跳转支付
  submitOrder() {
    if (this.data.cartList.length === 0) {
      wx.showToast({ title: '购物车是空的哦', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在生成订单...', mask: true });

    const orderData = {
      items: this.data.cartList,     
      totalPrice: this.data.totalPrice, 
      createTime: new Date(),        
      // 业务逻辑升级 1：初始状态改为“待支付”
      status: '待支付'               
    };

    wx.cloud.database().collection('orders').add({
      data: orderData,
      success: (res) => {
        wx.hideLoading(); 
        
        wx.removeStorageSync('cart'); 
        this.setData({ cartList: [], totalPrice: 0 }); 

        wx.showToast({
          title: '下单成功！',
          icon: 'success',
          duration: 1000
        });

        // 业务逻辑升级 2：1秒后，带着刚生成的订单号，强制跳到支付页！
        setTimeout(() => {
          wx.navigateTo({
            // 把数据库刚分配的订单号 res._id 当作参数，绑在网址后面传过去
            url: '/pages/pay/pay?orderId=' + res._id 
          })
        }, 1000);
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '系统开小差了，请重试', icon: 'error' });
      }
    });
  }
})