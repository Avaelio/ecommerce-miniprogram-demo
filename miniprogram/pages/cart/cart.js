Page({
  data: {
    cartList: [],   
    totalPrice: 0   
  },

  // 每次切到购物车页面，立刻读档
  onShow() {
    // 🌟 统一保险箱密码：myCartData
    let currentCart = wx.getStorageSync('myCartData') || [];
    // 读完档直接叫收银员算账，避免代码重复
    this.calculateTotal(currentCart); 
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
      status: '待支付'               
    };

    wx.cloud.database().collection('orders').add({
      data: orderData,
      success: (res) => {
        wx.hideLoading(); 
        
        // 🌟 下单成功后，清空专属保险箱
        wx.removeStorageSync('myCartData'); 
        this.setData({ cartList: [], totalPrice: 0 }); 

        wx.showToast({
          title: '下单成功！',
          icon: 'success',
          duration: 1000
        });

        setTimeout(() => {
          wx.navigateTo({
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