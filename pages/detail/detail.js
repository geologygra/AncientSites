Page({
  data: {
    relicsInfo: null,
    loading: true,
    mapScale: 14,
    isFavorite: false,
    imageList: [],
    relatedSites: [],
    markers: []
  },

  onLoad: function(options) {
    const { id } = options
    this.getRelicsDetail(id)
    this.checkFavoriteStatus(id)
    this.getRelatedSites(id)
    this.addVisitHistory(Number(id))
  },

  async getRelicsDetail(id) {
    try {
      // 显示加载状态
      wx.showLoading({
        title: '加载中...'
      })

      const { result } = await wx.cloud.callFunction({
        name: 'getSites',
        data: { id: Number(id) }
      })

      wx.hideLoading()

      if (!result.success) {
        throw new Error(result.message || '获取遗址信息失败')
      }

      if (!result.sites || result.sites.length === 0) {
        throw new Error(`未找到ID为 ${id} 的遗址信息`)
      }

      const site = result.sites[0]
      
      // 验证关键数据
      if (!site.coordinates || !site.coordinates.latitude || !site.coordinates.longitude) {
        throw new Error('遗址坐标信息不完整')
      }

      // 如果是云南省遗址，进行特殊验证
      if (site.location.includes('云南省')) {
        await this.validateYunnanSiteDetail(site)
      }

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: site.name
      })

      // 更新页面数据
      this.setData({
        relicsInfo: site,
        markers: [{
          id: 1,
          latitude: site.coordinates.latitude,
          longitude: site.coordinates.longitude,
          title: site.name,
          width: 32,
          height: 32,
          callout: {
            content: site.name,
            padding: 10,
            borderRadius: 5,
            display: 'ALWAYS'
          }
        }],
        loading: false
      })

    } catch (err) {
      wx.hideLoading()
      console.error('获取遗址详情失败:', err)
      
      wx.showToast({
        title: err.message || '获取详情失败',
        icon: 'none',
        duration: 3000
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 3000)
    }
  },

  async getRelatedSites(currentId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getSites',
        data: {
          isRelated: true,
          excludeId: Number(currentId)
        }
      })

      if (result.success) {
        this.setData({
          relatedSites: result.sites || []
        })
      }
    } catch (err) {
      console.error('获取相关遗址失败:', err)
    }
  },

  goToRelatedSite(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 放大地图
  zoomIn: function() {
    if (this.data.mapScale < 20) {
      this.setData({
        mapScale: this.data.mapScale + 1
      });
    }
  },

  // 缩小地图
  zoomOut: function() {
    if (this.data.mapScale > 3) {
      this.setData({
        mapScale: this.data.mapScale - 1
      });
    }
  },

  // 检查收藏状态
  async checkFavoriteStatus(relicsId) {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkFavorite',
        data: { relicsId: Number(relicsId) }
      })
      if (result.success) {
        this.setData({ isFavorite: result.isFavorite })
      }
    } catch (err) {
      console.error('检查收藏状态失败:', err)
    }
  },

  // 处理收藏/取消收藏
  async handleFavorite() {
    const app = getApp()
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    try {
      console.log('准备收藏遗址:', this.data.relicsInfo.id)
      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: { 
          relicsId: this.data.relicsInfo.id,
          action: this.data.isFavorite ? 'remove' : 'add'
        }
      })
      
      console.log('收藏操作结果:', result)
      if (result.success) {
        this.setData({ isFavorite: !this.data.isFavorite })
        wx.showToast({
          title: result.message,
          icon: 'success'
        })
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      console.error('收藏操作失败:', err)
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      })
    }
  },

  // 添加记录浏览历史的方法
  async addVisitHistory(siteId) {
    try {
      await wx.cloud.callFunction({
        name: 'addVisitHistory',
        data: { siteId }
      })
    } catch (err) {
      console.error('记录浏览历史失败:', err)
    }
  },

  // 添加云南省遗址特殊处理
  async validateYunnanSiteDetail(site) {
    // 检查图片资源
    if (!site.images || site.images.length === 0) {
      console.warn(`云南省遗址 ${site.name} 缺少图片资源`)
    }
    
    // 检查相关遗址
    if (!site.relatedSites || site.relatedSites.length === 0) {
      console.warn(`云南省遗址 ${site.name} 缺少相关遗址信息`)
    }
    
    // 检查详细描述
    if (site.description.length < 100) {
      console.warn(`云南省遗址 ${site.name} 描述信息不够详细`)
    }
    
    // 检查交通信息
    if (!site.transportation) {
      console.warn(`云南省遗址 ${site.name} 缺少交通信息`)
    }
    
    // 检查开放时间
    if (!site.openingHours) {
      console.warn(`云南省遗址 ${site.name} 缺少开放时间信息`)
    }
  },

  // 分享给朋友
  onShareAppMessage: function () {
    const { relicsInfo } = this.data
    if (!relicsInfo) return {}
    
    return {
      title: relicsInfo.name,
      path: `/pages/detail/detail?id=${relicsInfo.id}`,
      imageUrl: relicsInfo.imageUrl || '/images/share-default.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    const { relicsInfo } = this.data
    if (!relicsInfo) return {}
    
    return {
      title: relicsInfo.name,
      query: `id=${relicsInfo.id}`,
      imageUrl: relicsInfo.imageUrl || '/images/share-default.png'
    }
  }
}) 