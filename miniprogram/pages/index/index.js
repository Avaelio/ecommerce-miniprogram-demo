Page({
  // 1. 准备一个空盘子，取名叫 goodsList
  data: {
    // 页面调样式期间，直接在这里塞假数据，不扣云端额度！
    goodsList: [
      { _id: "1", name: "测试红豆糕", price: 5, stock: 50 },
      { _id: "2", name: "测试桂花糕", price: 6, stock: 30 }
    ] 
  },

  // onLoad() {
  //   // 2. 呼叫云端数据库，目标：goods 货架
  //   wx.cloud.database().collection('goods').get({
  //     // 重点：这里换成了箭头函数 (res) => ，这样才能准确找到咱们的盘子
  //     success: (res) => {
  //       console.log("抓到数据了：", res.data);
  //       // 3. 魔法指令：把抓到的云端数据，装进刚才的盘子里！
  //       this.setData({
  //         goodsList: res.data
  //       });
  //     }
  //   })
  // }
  // 添加到购物车的专属函数
  addToCart(e) {
    // 1. 从刚才那个按钮里，把传递过来的商品数据拆包拿出来
    const goods = e.currentTarget.dataset.item;
    // 2. 去微信的本地缓存（Storage）里找一找，有没有一个叫 'cart' 的购物车箱子。如果没有，就给个空箱子 []
    let cart = wx.getStorageSync('cart') || [];
    // 3. 在箱子里找找看，这个商品是不是已经在里面了（对比商品唯一的 _id）
    let existingItem = cart.find(cartItem => cartItem._id === goods._id);
    if (existingItem) {
      // 如果已经在了，直接让数量 +1
      existingItem.quantity += 1;
    } else {
      // 如果是第一次添加，给它盖个章（增加一个 quantity 属性并设为 1），然后塞进箱子
      goods.quantity = 1;
      cart.push(goods);
    }
    // 4. 把整理好的箱子，重新封存在手机的本地缓存里
    wx.setStorageSync('cart', cart);
    // 5. 弹出一个极度丝滑的成功提示！
    wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1500
    });
  }
})