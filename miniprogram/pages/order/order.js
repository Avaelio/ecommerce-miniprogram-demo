Page({
  data: {
    // 1. 左侧分类数据
    categories: [
      { id: 'c1', name: '招牌必点' },
      { id: 'c2', name: '经典口味' },
      { id: 'c3', name: '创新果味' }
    ],
    currentCategoryId: 'c1', // 当前选中的分类

    // 2. 所有商品数据仓库 (增加了 categoryId 来区分)
    allProducts: [
      { id: 1, categoryId: 'c1', name: '招牌原味钵仔糕', price: 5, desc: '软糯Q弹，童年味道' },
      { id: 2, categoryId: 'c1', name: '满料红豆钵仔糕', price: 6, desc: '颗颗饱满，甜而不腻' },
      { id: 3, categoryId: 'c2', name: '桂花清香钵仔糕', price: 6, desc: '干桂花入料，唇齿留香' },
      { id: 4, categoryId: 'c2', name: '黑芝麻钵仔糕', price: 6, desc: '浓郁芝麻香，养生首选' },
      { id: 5, categoryId: 'c3', name: '百香果钵仔糕', price: 7, desc: '酸甜开胃，果香四溢' }
    ],
    displayProducts: [], // 右侧当前展示的商品

    // 3. 底部实时购物车数据
    cartTotalNum: 0,
    cartTotalPrice: 0,
    // 新增：真实的购物车列表和弹窗开关
    cartItems: [], 
    showCartPopup: false, 
    cartTotalNum: 0,
    cartTotalPrice: 0
  },

  onLoad() {
    // 页面加载时，默认展示第一个分类的商品
    this.filterProducts('c1');
  },
  onShow() {
    // 每次进入点单页，先去缓存里看看有没有之前选过的商品
    let savedCart = wx.getStorageSync('myCartData') || [];
    // 把读到的档，重新喂给咱们的统管大管家
    this.updateCartStatus(savedCart); 
  },

  // 点击左侧分类切换
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ currentCategoryId: categoryId });
    this.filterProducts(categoryId);
  },

  // 根据分类过滤右侧商品
  filterProducts(categoryId) {
    const filtered = this.data.allProducts.filter(item => item.categoryId === categoryId);
    this.setData({ displayProducts: filtered });
  },


// 【终极版】点击加号添加到购物车
  addToCart(e) {
    const product = e.currentTarget.dataset.item; 
    let cartItems = this.data.cartItems;
    
    // 检查购物车里是不是已经有这个钵仔糕了
    let existingItem = cartItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1; // 如果有，数量+1
    } else {
      cartItems.push({ ...product, quantity: 1 }); // 如果没有，作为新商品塞进去
    }

    // 🌟 核心修复：不要自己默默 setData，直接叫大管家来统筹算账和存档！
    this.updateCartStatus(cartItems);
    
    wx.showToast({ title: '已加入购物车', icon: 'none', duration: 800 });
  },



// 新增：点击购物车图标，弹出/收起明细
toggleCartPopup() {
  if (this.data.cartTotalNum === 0) return; // 如果购物车是空的，就不弹
  this.setData({
    showCartPopup: !this.data.showCartPopup
  });
},

// 新增：清空购物车功能
clearCart() {
  this.setData({
    cartItems: [],
    cartTotalNum: 0,
    cartTotalPrice: 0,
    showCartPopup: false
  });
},
  // 点击去结算
  goToCheckout() {
    if (this.data.cartTotalNum === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    // 跳转到购物车页面
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },
  // 增加数量
  increaseQuantity(e) {
    const item = e.currentTarget.dataset.item;
    let cartItems = this.data.cartItems;
    // 找到对应商品，数量加1
    let target = cartItems.find(i => i.id === item.id);
    if (target) {
      target.quantity += 1;
      this.updateCartStatus(cartItems);
    }
  },

  // 减少数量
  decreaseQuantity(e) {
    const item = e.currentTarget.dataset.item;
    let cartItems = this.data.cartItems;
    // 找到这个商品在数组里的具体位置
    let targetIndex = cartItems.findIndex(i => i.id === item.id);

    if (targetIndex !== -1) {
      cartItems[targetIndex].quantity -= 1;
      // 核心细节：如果数量减到 0，直接把它从数组里删掉
      if (cartItems[targetIndex].quantity <= 0) {
        cartItems.splice(targetIndex, 1);
      }
      this.updateCartStatus(cartItems);
    }
  },

  // 统管全局的超级收银员：重新计算总数和总价
  updateCartStatus(cartItems) {
    let totalNum = 0;
    let totalPrice = 0;
    
    // 遍历算钱
    cartItems.forEach(item => {
      totalNum += item.quantity;
      totalPrice += item.price * item.quantity;
    });

    // 核心细节：如果购物车被减空了，自动把弹窗关掉
    let showPopup = this.data.showCartPopup;
    if (totalNum === 0) {
      showPopup = false;
    }

    // 一次性更新所有状态
    this.setData({
      cartItems: cartItems,
      cartTotalNum: totalNum,
      cartTotalPrice: totalPrice,
      showCartPopup: showPopup
    });
    // 🌟 【新增这一行】：每次算完账，把最新的购物车数组存进微信的底层缓存里！
    wx.setStorageSync('myCartData', cartItems);
  }
  
})