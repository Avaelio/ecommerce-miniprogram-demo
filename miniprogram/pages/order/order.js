const db = wx.cloud.database({
  env: 'cloud1-d1gp4dzof6844fa0d' 
})
Page({
  data: {
    categories: [],
    currentCategoryId: '',
    allProducts: [],
    displayProducts: [], 
    cartItems: [], 
    showCartPopup: false, 
    cartTotalNum: 0,
    cartTotalPrice: 0
  },

  onLoad() {
    // 🌟 修复1：页面加载时，真正去呼叫云端拉取数据，别再用 c1 了
    this.fetchDataFromCloud();
  },

  onShow() {
    let savedCart = wx.getStorageSync('myCartData') || [];
    this.updateCartStatus(savedCart); 
  },

  // 去云数据库拉取菜单的“大管家”
  fetchDataFromCloud() {
    wx.showLoading({ title: '加载菜单中...' });

    db.collection('categories').orderBy('sort_order', 'asc').get().then(catRes => {
      let fetchedCategories = catRes.data;
      
      db.collection('products').where({
        is_available: true 
      }).get().then(prodRes => {
        let fetchedProducts = prodRes.data;

        this.setData({
          categories: fetchedCategories,
          allProducts: fetchedProducts,
          currentCategoryId: fetchedCategories.length > 0 ? fetchedCategories[0]._id : ''
        });

        if (this.data.currentCategoryId) {
          this.filterProducts(this.data.currentCategoryId);
        }

        wx.hideLoading(); 
      })
    }).catch(err => {
      console.error("拉取数据失败，大概率是没开权限", err);
      wx.hideLoading();
      wx.showToast({ title: '菜单获取失败', icon: 'none' });
    })
  },


  // 左侧分类切换
  switchCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ currentCategoryId: categoryId });
    this.filterProducts(categoryId);
  },

  // --- 下面是购物车逻辑 ---

  addToCart(e) {
    const product = e.currentTarget.dataset.item; 
    let cartItems = this.data.cartItems;
    
    // 🌟 修复3：云数据库的 ID 叫 _id，所以购物车查找也要用 _id
    let existingItem = cartItems.find(item => item._id === product._id);

    if (existingItem) {
      existingItem.quantity += 1; 
    } else {
      cartItems.push({ ...product, quantity: 1 }); 
    }

    this.updateCartStatus(cartItems);
    wx.showToast({ title: '已加入购物车', icon: 'none', duration: 800 });
  },

  toggleCartPopup() {
    if (this.data.cartTotalNum === 0) return; 
    this.setData({
      showCartPopup: !this.data.showCartPopup
    });
  },

  clearCart() {
    this.setData({
      cartItems: [],
      cartTotalNum: 0,
      cartTotalPrice: 0,
      showCartPopup: false
    });
    // 清空时顺便把缓存也清掉
    wx.setStorageSync('myCartData', []);
  },

  goToCheckout() {
    if (this.data.cartTotalNum === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },

  increaseQuantity(e) {
    const item = e.currentTarget.dataset.item;
    let cartItems = this.data.cartItems;
    // 🌟 修复3：改成 _id
    let target = cartItems.find(i => i._id === item._id);
    if (target) {
      target.quantity += 1;
      this.updateCartStatus(cartItems);
    }
  },

  decreaseQuantity(e) {
    const item = e.currentTarget.dataset.item;
    let cartItems = this.data.cartItems;
    // 🌟 修复3：改成 _id
    let targetIndex = cartItems.findIndex(i => i._id === item._id);

    if (targetIndex !== -1) {
      cartItems[targetIndex].quantity -= 1;
      if (cartItems[targetIndex].quantity <= 0) {
        cartItems.splice(targetIndex, 1);
      }
      this.updateCartStatus(cartItems);
    }
  },

  // 更新外层列表的显示数量（核心映射机制）
  syncCartToDisplay(cartItems, currentCategoryId) {
    if (!this.data.allProducts || this.data.allProducts.length === 0) return;
    
    // 1. 筛选出当前分类下的商品
    const filtered = this.data.allProducts.filter(item => item.category_id === currentCategoryId);
    
    // 2. 遍历这些商品，看看购物车里有没有它们，有的话把数量贴上去
    const mappedProducts = filtered.map(prod => {
      let cartItem = cartItems.find(item => item._id === prod._id);
      return { 
        ...prod, 
        cartQty: cartItem ? cartItem.quantity : 0 // 新增一个 cartQty 字段专门给外层用
      };
    });

    this.setData({ displayProducts: mappedProducts });
  },

  // 修改原来的过滤函数
  filterProducts(categoryId) {
    this.syncCartToDisplay(this.data.cartItems, categoryId);
  },

  // 修改原来的更新购物车函数
  updateCartStatus(cartItems) {
    let totalNum = 0;
    let totalPrice = 0;
    
    cartItems.forEach(item => {
      totalNum += item.quantity;
      totalPrice += item.price * item.quantity;
    });

    let showPopup = this.data.showCartPopup;
    if (totalNum === 0) {
      showPopup = false;
    }

    this.setData({
      cartItems: cartItems,
      cartTotalNum: totalNum,
      cartTotalPrice: totalPrice,
      showCartPopup: showPopup
    });
    
    wx.setStorageSync('myCartData', cartItems);

    // 🌟 关键：购物车一变，马上通知外层列表刷新！
    this.syncCartToDisplay(cartItems, this.data.currentCategoryId);
  }
})