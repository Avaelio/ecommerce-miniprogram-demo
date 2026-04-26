const db = wx.cloud.database({
  env: 'cloud1-d1gp4dzof6844fa0d' // 保持和 order.js 一致的环境ID
})

Page({
  data: {
    cartList: [],   
    totalPrice: 0,
    deliveryType: 'takeout', // 'takeout' (外卖), 'pickup' (自提), 'shipping' (邮寄)
    hasAddress: false,
    address: {},
    selectedStore: '',
    remark: ''
  },

  // 每次切到购物车页面，立刻读档
  onShow() {
    let currentCart = wx.getStorageSync('myCartData') || [];
    this.calculateTotal(currentCart); 
  },

  // 切换配送方式
  switchDelivery(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      deliveryType: type
    });
  },

  // 获取微信原生地址
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

  // 选择自提门店（防止你的 wxml 点击报错，先做一个模拟）
  chooseStore() {
    // 实际业务可以跳转到门店列表页，这里暂作演示
    this.setData({
      selectedStore: '广州总店' 
    });
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
      cartList: cart, 
      totalPrice: total
    });
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
        confirmColor: '#A0887E',
        success: (res) => {
          if (res.confirm) {
            cart.splice(index, 1); 
            this.calculateTotal(cart); 
          }
        }
      })
    }
  },

  // 正式提交订单
  submitOrder() {
    const { cartList, totalPrice, deliveryType, hasAddress, address, selectedStore, remark } = this.data;

    // --- 1. 下单前基础拦截校验 ---
    if (cartList.length === 0) {
      wx.showToast({ title: '还没有选钵仔糕呢', icon: 'none' });
      return;
    }

    if ((deliveryType === 'takeout' || deliveryType === 'shipping') && !hasAddress) {
      wx.showToast({ title: '请先添加收货地址', icon: 'none' });
      return;
    }

    if (deliveryType === 'pickup' && !selectedStore) {
      wx.showToast({ title: '请选择自提门店', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '订单生成中...', mask: true });

    // --- 2. 梳理商品明细，并计算总件数 ---
    let totalQuantity = 0;
    const orderProducts = cartList.map(item => {
      totalQuantity += item.quantity;
      return {
        product_id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      };
    });

    // --- 3. 提取地址信息拼装（微信给的是散装省市区，我们需要拼成完整字符串） ---
    let fullAddress = '';
    let userPhone = '';
    let userName = '';
    if (hasAddress) {
      fullAddress = `${address.provinceName}${address.cityName}${address.countyName}${address.detailInfo}`;
      userPhone = address.telNumber;
      userName = address.userName;
    }

    // --- 4. 构造完美契合云数据库的数据格式 ---
    const orderData = {
      order_no: 'BZG' + Date.now() + Math.floor(Math.random() * 100), // 自动生成带时间戳的订单号
      order_type: deliveryType === 'pickup' ? 'pickup' : 'delivery',  // 归类为自提或外卖/邮寄
      
      user_info: {
        name: userName,
        phone: userPhone, // 满足你提的：要有手机号
        address: fullAddress // 满足：自提时这里为空，外卖时有地址
      },
      
      products: orderProducts,         // 纯净版的商品明细
      total_amount: totalPrice,        // 总金额
      total_quantity: totalQuantity,   // 满足你提的：下单产品的数量
      
      store: deliveryType === 'pickup' ? selectedStore : null, 
      expected_time: "尽快",           // 满足你提的：预计提货时间（后续你可以改成让用户选时间的组件）
      remark: remark, 
      
      status: 'pending',               // 下单默认'pending'，方便后续老板点完变成'ready_for_pickup'(可自提)
      create_time: db.serverDate()     // 使用云端安全时间
    };

    // --- 5. 正式写入云数据库 orders 集合 ---
    db.collection('orders').add({
      data: orderData,
      success: (res) => {
        wx.hideLoading();
        wx.removeStorageSync('myCartData'); // 下单成功后立刻清空本地购物车缓存
        
        wx.showToast({ title: '下单成功！', icon: 'success' });

        // 跳转到订单详情页（携带刚生成的记录ID）
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/order/detail?id=' + res._id 
          });
        }, 1500);
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '网络开小差了，请重试', icon: 'error' });
        console.error("订单写入失败", err);
      }
    });
  }
})