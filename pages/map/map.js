Page({
  data: {
    mapScale: 11,
    markers: [],
    selectedRegion: '全部',
    selectedEra: '全部',
    selectedType: '全部',
    selectedProtectionLevel: '全部',
    filters: {
      era: ''
    },
    regions: [
      '全部',
      '北京市',
      '天津市',
      '河北省',
      '山西省',
      '内蒙古自治区',
      '辽宁省',
      '吉林省',
      '黑龙江省',
      '上海市',
      '江苏省',
      '浙江省',
      '安徽省',
      '福建省',
      '江西省',
      '山东省',
      '河南省',
      '湖北省',
      '湖南省',
      '广东省',
      '广西壮族自治区',
      '海南省',
      '重庆市',
      '四川省',
      '贵州省',
      '云南省',
      '西藏自治区',
      '陕西省',
      '甘肃省',
      '青海省',
      '宁夏回族自治区',
      '新疆维吾尔自治区',
      '台湾省',
      '香港特别行政区',
      '澳门特别行政区'
    ],
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
    ],
    showFilter: false,
    centerLatitude: 35.0,
    centerLongitude: 105.0,
    scale: 5,
    currentLocation: null,
    loading: true,
    selectedSite: null,
    showSiteInfo: false,
    currentPage: 1,
    pageSize: 50,
    hasMore: true,
    longitude: 116.397470,  // 北京坐标作为中心点
    latitude: 39.908823,
    types: ['全部', '古文化遗址', '古城遗址', '古墓葬', '古建筑', '石窟寺', '石刻', '其他'],
    showLabels: true,  // 控制是否显示名称
    protectionLevels: [
      '全部',
      '全国重点文物保护单位',
      '省级文物保护单位',
      '市级文物保护单位',
      '县级文物保护单位'
    ],
    labelStyle: {
      color: '#333333',
      fontSize: 14,
      anchorX: 0,
      anchorY: -35,
      borderWidth: 1,
      borderColor: '#EEEEEE',
      borderRadius: 4,
      bgColor: '#FFFFFF',
      padding: 8,
      textAlign: 'center',
      maxWidth: 160  // 增加最大宽度
    },
    selectedMarker: null,  // 当前选中的标记点
    markerStyle: {
      width: 40,
      height: 40,
      iconPath: '/images/icons/marker.png',
      anchor: {
        x: 0.5,
        y: 1
      },
      callout: {
        display: 'BYCLICK',
        padding: 8,
        borderRadius: 4
      }
    },
    maxMarkersPerView: 50,  // 每个视图最大显示的标记数量
    currentRegion: {
      latitude: 39.908823,
      longitude: 116.397470,
      width: 0,
      height: 0
    }
  },

  onLoad() {
    // 等待数据准备好
    if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
    
    this.loadSites()
    // 获取当前位置
    this.getCurrentLocation()
  },

  async loadSites() {
    try {
      wx.showLoading({
        title: '加载中...'
      })

      const { selectedRegion, selectedEra, selectedType, selectedProtectionLevel } = this.data
      const { result } = await wx.cloud.callFunction({
        name: 'getSites',
        data: {
          page: 1,
          pageSize: 1000,
          region: selectedRegion === '全部' ? '' : selectedRegion,
          era: selectedEra === '全部' ? '' : selectedEra,
          type: selectedType === '全部' ? '' : selectedType,
          protectionLevel: selectedProtectionLevel === '全部' ? '' : selectedProtectionLevel
        }
      })

      if (result.success) {
        const allMarkers = result.sites
          .filter(site => {
            return site && 
                   site.name &&
                   site.coordinates && 
                   typeof site.coordinates.latitude === 'number' &&
                   typeof site.coordinates.longitude === 'number' &&
                   !isNaN(site.coordinates.latitude) && 
                   !isNaN(site.coordinates.longitude) &&
                   site.coordinates.latitude !== 0 &&
                   site.coordinates.longitude !== 0
          })
          .map(site => {
            // 创建标签样式对象
            const label = {
              content: site.name,
              color: '#333333',
              fontSize: 12,  // 缩小字体
              anchorX: 0,
              anchorY: -42,  // 调整位置确保在marker正上方
              borderWidth: 1,
              borderColor: '#EEEEEE',
              borderRadius: 4,
              bgColor: '#FFFFFF',
              padding: 4,  // 减小内边距
              textAlign: 'center',
              maxWidth: 120  // 减小最大宽度
            }

            return {
              id: site.id,
              latitude: Number(site.coordinates.latitude),
              longitude: Number(site.coordinates.longitude),
              title: site.name,
              width: 32,  // 调整marker大小
              height: 32,
              label: label,
              iconPath: '/images/icons/marker.png',
              anchor: {
                x: 0.5,
                y: 1
              },
              // 添加遗址其他信息用于信息卡片显示
              location: site.location,
              era: site.era,
              type: site.type,
              protectionLevel: site.protectionLevel,
              zIndex: 99  // 确保marker在最上层
            }
          })

        this.setData({
          markers: allMarkers,  // 存储所有标记点
          loading: false
        }, () => {
          // 初始加载时更新可见标记点
          this.getMapRegion().then(() => {
            this.updateVisibleMarkers()
          })
        })
      }
    } catch (err) {
      console.error('加载遗址数据失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 处理标记点点击
  markertap(e) {
    const { markerId } = e
    const marker = this.data.markers.find(m => m.id === markerId)
    
    if (marker) {
      // 更新选中的标记点
      this.setData({
        selectedMarker: marker,
        showSiteInfo: true
      })
    }
  },

  // 处理标签点击
  labeltap(e) {
    this.markertap(e)  // 复用标记点点击逻辑
  },

  // 关闭遗址信息卡片
  closeSiteInfo() {
    this.setData({
      showSiteInfo: false,
      selectedMarker: null
    })
  },

  // 查看遗址详情
  goToDetail() {
    const { selectedMarker } = this.data
    if (selectedMarker) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${selectedMarker.id}`
      })
    }
  },

  // 处理地图缩放
  handleRegionChange(e) {
    if (e.type === 'end' && e.causedBy === 'scale') {
      this.setData({
        scale: e.detail.scale
      })
    }
  },

  // 处理筛选选择
  handleFilterSelect(e) {
    const { type, value } = e.currentTarget.dataset
    
    if (type === 'region') {
      this.setData({
        selectedRegion: value === this.data.selectedRegion ? '' : value
      }, () => {
        this.loadSites() // 重新加载标记点
      })
    } else if (type === 'era') {
      this.setData({
        'filters.era': value === this.data.filters.era ? '' : value
      }, () => {
        this.loadSites() // 重新加载标记点
      })
    }
  },

  // 放大地图
  zoomIn() {
    let scale = this.data.scale
    if (scale < 20) {
      this.setData({
        scale: scale + 1
      })
    }
  },

  // 缩小地图
  zoomOut() {
    let scale = this.data.scale
    if (scale > 3) {
      this.setData({
        scale: scale - 1
      })
    }
  },

  // 切换筛选显示
  toggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  // 监听地图缩放变化
  onScaleChange(e) {
    const { scale } = e.detail
    this.setData({
      mapScale: scale
    }, () => {
      this.loadSites()
    })
  },

  // 添加获取当前位置的方法
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        })
      },
      fail: (err) => {
        console.error('获取位置失败：', err)
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    })
  },

  // 添加地图点击事件处理
  handleMapTap() {
    if (this.data.currentLocation) {
      this.setData({
        centerLatitude: this.data.currentLocation.latitude,
        centerLongitude: this.data.currentLocation.longitude,
        scale: 14  // 设置适合查看周边遗址的缩放级别
      })
    }
  },

  // 处理筛选条件变化
  handleFilterChange(e) {
    const { type, value } = e.currentTarget.dataset
    
    this.setData({
      [`selected${type}`]: value
    }, () => {
      this.loadSites()  // 重新加载数据
    })
  },

  // 重置筛选条件
  resetFilters() {
    this.setData({
      selectedRegion: '全部',
      selectedEra: '全部',
      selectedType: '全部',
      selectedProtectionLevel: '全部',
      showFilter: false
    }, () => {
      this.loadSites()
    })
  },

  // 监听地图缩放
  regionchange(e) {
    if (e.type === 'end' && (e.causedBy === 'scale' || e.causedBy === 'drag')) {
      // 获取当前地图视野范围
      this.getMapRegion().then(() => {
        this.updateVisibleMarkers()
      })
    }
  },

  // 处理地图点击
  mapTap() {
    // 点击地图空白处时关闭信息卡片
    if (this.data.showSiteInfo) {
      this.closeSiteInfo()
    }
  },

  // 获取地图视野范围
  getMapRegion() {
    return new Promise((resolve) => {
      const mapCtx = wx.createMapContext('map')
      mapCtx.getRegion({
        success: (res) => {
          this.setData({
            currentRegion: {
              latitude: (res.southwest.latitude + res.northeast.latitude) / 2,
              longitude: (res.southwest.longitude + res.northeast.longitude) / 2,
              width: res.northeast.longitude - res.southwest.longitude,
              height: res.northeast.latitude - res.southwest.latitude
            }
          })
          resolve(res)
        }
      })
    })
  },

  // 更新可见的标记点
  updateVisibleMarkers() {
    const { markers, currentRegion, maxMarkersPerView } = this.data
    
    // 计算每个标记到视野中心的距离
    const visibleMarkers = markers.map(marker => {
      const distance = this.calculateDistance(
        currentRegion.latitude,
        currentRegion.longitude,
        marker.latitude,
        marker.longitude
      )
      return { ...marker, distance }
    })
    .filter(marker => this.isInRegion(marker, currentRegion))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxMarkersPerView)
    
    this.setData({
      visibleMarkers: visibleMarkers
    })
  },

  // 计算两点之间的距离（单位：公里）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // 地球半径，单位公里
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  // 角度转弧度
  toRad(degree) {
    return degree * Math.PI / 180
  },

  // 判断标记点是否在当前视野范围内
  isInRegion(marker, region) {
    // 计算标记点到视野中心的距离
    const distance = this.calculateDistance(
      region.latitude,
      region.longitude,
      marker.latitude,
      marker.longitude
    )
    
    // 根据地图缩放级别动态调整显示范围
    const maxDistance = this.getMaxDistanceByScale(this.data.scale)
    
    return distance <= maxDistance
  },

  // 根据缩放级别获取最大显示距离
  getMaxDistanceByScale(scale) {
    // 缩放级别与显示范围的对应关系（单位：公里）
    const scaleRanges = {
      3: 2000,  // 全国范围
      4: 1000,
      5: 500,
      6: 250,
      7: 125,
      8: 60,
      9: 30,
      10: 15,
      11: 8,
      12: 4,
      13: 2,
      14: 1,
      15: 0.5,
      16: 0.25,
      17: 0.125,
      18: 0.06,
      19: 0.03,
      20: 0.015
    }
    
    return scaleRanges[scale] || 1 // 默认显示1公里范围内的标记
  }
}) 