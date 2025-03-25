App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'xueshujiangzuo-5gsgu0ha42fb1390',
        traceUser: true
      })
    }

    // 初始化用户状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkLogin'
      })
      if (result.success) {
        this.globalData.userInfo = result.userInfo
      }
    } catch (err) {
      console.error('检查登录状态失败:', err)
    }
  },

  globalData: {
    userInfo: null,
    eras: [
      '全部',
      '旧石器时代',
      '新石器时代',
      '夏朝',
      '商朝',
      '西周',
      '东周',
      '秦朝',
      '汉朝',
      '北魏',
      '唐朝',
      '宋朝',
      '金朝',
      '元朝',
      '明朝',
      '清朝',
      '近代'
    ]
  }
}) 