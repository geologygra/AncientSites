const app = getApp()

Page({
  data: {
    userInfo: null,
    favorites: [],
    visitHistory: [],
    visitCount: 0,
    joinTime: ''
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    // 如果已登录,刷新收藏列表和浏览记录
    if (this.data.userInfo) {
      this.getFavorites()
      this.getVisitHistory()
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkLogin'
      })
      if (result.success) {
        this.setData({ 
          userInfo: result.userInfo,
          joinTime: this.formatDate(result.createTime)
        })
        this.getFavorites()
      }
    } catch (err) {
      console.error('检查登录状态失败:', err)
    }
  },

  // 处理登录和注册
  async handleLogin() {
    try {
      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      // 先检查用户是否存在
      const loginResult = await wx.cloud.callFunction({
        name: 'checkLogin'
      })

      if (!loginResult.result.success) {
        // 用户不存在，进行注册
        const registerResult = await wx.cloud.callFunction({
          name: 'register',
          data: { userInfo }
        })

        if (!registerResult.result.success) {
          throw new Error(registerResult.result.message)
        }
      }

      // 注册成功或用户已存在，进行登录
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: { userInfo }
      })

      if (result.success) {
        this.setData({ 
          userInfo: result.userInfo
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        this.getFavorites()
      } else {
        throw new Error('登录失败')
      }

    } catch (err) {
      console.error('登录/注册失败:', err)
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 获取收藏列表
  async getFavorites() {
    try {
      wx.showLoading({
        title: '加载中...'
      })
      
      const { result } = await wx.cloud.callFunction({
        name: 'getFavorites'
      })
      
      console.log('获取收藏列表结果:', result)
      
      if (result.success) {
        this.setData({ 
          favorites: result.favorites || []
        })
        if (result.favorites.length === 0) {
          console.log('暂无收藏')
        }
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('获取收藏列表失败:', err)
      wx.showToast({
        title: '获取收藏失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 获取浏览记录
  async getVisitHistory() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getVisitHistory'
      })

      if (result.success) {
        this.setData({
          visitHistory: result.history || [],
          visitCount: result.history ? result.history.length : 0
        })
      }
    } catch (err) {
      console.error('获取浏览记录失败:', err)
    }
  },

  // 跳转到详情页
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 处理退出登录
  async handleLogout() {
    try {
      wx.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            const { result } = await wx.cloud.callFunction({
              name: 'logout'
            })
            
            if (result.success) {
              // 清除本地用户数据
              this.setData({
                userInfo: null,
                favorites: [],
                visitHistory: [],
                visitCount: 0,
                joinTime: ''
              })
              
              // 清除全局用户数据
              const app = getApp()
              app.globalData.userInfo = null
              
              wx.showToast({
                title: '已退出登录',
                icon: 'success'
              })
            } else {
              throw new Error(result.message)
            }
          }
        }
      })
    } catch (err) {
      console.error('退出登录失败:', err)
      wx.showToast({
        title: err.message || '退出失败',
        icon: 'none'
      })
    }
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
}) 