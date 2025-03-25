const app = getApp()

Page({
  data: {
    sites: [],
    filters: {
      region: '',
      era: '',
      type: ''
    },
    regions: ['全部', '北京', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', 
             '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', 
             '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', 
             '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆'],
    eras: ['全部', '旧石器时代', '新石器时代', '商代', '西周', '春秋', '战国', '秦代', '汉代', '三国', '晋代', '南北朝', '隋代', '唐代', '宋代', '元代', '明代', '清代'],
    types: ['全部', '古文化遗址', '古城遗址', '古墓葬', '古建筑', '石窟寺', '石刻', '其他'],
    showRegionSelect: false,
    selectedRegion: '全部',
    protectionLevels: [
      '全部',
      '全国重点文物保护单位',
      '省级文物保护单位',
      '市级文物保护单位',
      '县级文物保护单位',
      '未定级'
    ],
    pageSize: 10,
    currentPage: 1,
    totalPages: 1,
    allData: [], // 存储所有数据
    searchKeyword: '', // 搜索关键词
    showFilter: false, // 添加筛选显示状态
    loading: false,
    selectedEra: '全部',
    selectedType: '全部',
    relicsList: [],
    preloadedSites: new Set()
  },

  onLoad() {
    this.loadSites()
  },

  // 加载遗址列表
  async loadSites() {
    const { currentPage, pageSize, searchKeyword, selectedRegion, selectedEra, selectedType } = this.data
    
    try {
      wx.showLoading({
        title: '加载中...'
      })

      const { result } = await wx.cloud.callFunction({
        name: 'getSites',
        data: {
          keyword: searchKeyword,
          region: selectedRegion === '全部' ? '' : selectedRegion,
          era: selectedEra === '全部' ? '' : selectedEra,
          type: selectedType === '全部' ? '' : selectedType,
          page: currentPage,
          pageSize: pageSize
        }
      })

      if (result.success) {
        this.setData({
          sites: result.sites,
          totalPages: result.pagination.totalPages
        })
      } else {
        throw new Error(result.message || '获取数据失败')
      }
    } catch (err) {
      console.error('获取遗址列表失败:', err)
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 添加上一页方法
  prevPage() {
    if (this.data.currentPage <= 1) return
    
    this.setData({
      currentPage: this.data.currentPage - 1
    }, () => {
      this.loadSites()
    })
  },

  // 添加下一页方法
  nextPage() {
    if (this.data.currentPage >= this.data.totalPages) return
    
    this.setData({
      currentPage: this.data.currentPage + 1
    }, () => {
      this.loadSites()
    })
  },

  // 处理筛选条件变化
  handleFilterChange(e) {
    const { type, value } = e.currentTarget.dataset
    
    this.setData({
      [`selected${type}`]: value,
      currentPage: 1  // 重置到第一页
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
      currentPage: 1,
      searchKeyword: ''  // 同时重置搜索关键词
    }, () => {
      this.loadSites()
    })
  },

  // 切换筛选面板显示
  toggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      currentPage: 1
    }, async () => {
      await this.loadSites()
      wx.stopPullDownRefresh()
    })
  },

  // 初始化数据
  initData() {
    // 确保全局数据已加载
    if (!app.globalData || !app.globalData.relicsData) {
      console.error('Global data not initialized')
      return
    }

    const relicsData = app.globalData.relicsData || []
    console.log('Initializing with relics data:', relicsData.length)
    
    this.setData({
      allData: relicsData,
      totalPages: Math.ceil(relicsData.length / this.data.pageSize)
    }, () => {
      this.loadSites()
    })
  },

  // 点击列表项跳转到详情页
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 显示地区选择器
  showRegionSelector() {
    this.setData({
      showRegionSelect: true
    })
  },

  // 隐藏地区选择器
  hideRegionSelector() {
    this.setData({
      showRegionSelect: false
    })
  },

  // 切换地区选择状态
  toggleRegion(e) {
    const index = e.currentTarget.dataset.index
    const region = this.data.regions[index]
    const tempSelected = [...this.data.tempSelectedRegions]
    
    const selectedIndex = tempSelected.indexOf(region)
    if (selectedIndex > -1) {
      tempSelected.splice(selectedIndex, 1)
    } else {
      tempSelected.push(region)
    }
    
    this.setData({
      tempSelectedRegions: tempSelected
    })
  },

  // 重置选择
  resetRegions() {
    this.setData({
      tempSelectedRegions: []
    })
  },

  // 确认选择
  confirmRegions() {
    // 检查是否有选中的地区
    if (this.data.tempSelectedRegions.length === 0) {
      wx.showToast({
        title: '请至少选择一个地区',
        icon: 'none'
      })
      return
    }

    this.setData({
      selectedRegions: [...this.data.tempSelectedRegions],
      showRegionSelect: false,
      currentPage: 1 // 重置到第一页
    }, () => {
      this.loadSites() // 更新列表数据
    })
  },

  // 搜索处理
  handleSearch(e) {
    const searchKeyword = e.detail.value.trim()
    
    this.setData({
      searchKeyword,
      currentPage: 1  // 重置到第一页
    }, () => {
      this.loadSites()
    })
  },

  // 添加预加载方法
  async preloadSiteDetail(id) {
    try {
      await wx.cloud.callFunction({
        name: 'getSites',
        data: { id: Number(id) }
      })
    } catch (err) {
      console.error('预加载遗址详情失败:', err)
    }
  },

  // 在列表滚动时预加载
  onListScroll(e) {
    const { sites, preloadedSites = new Set() } = this.data
    
    // 获取可视区域内的遗址
    const visibleSites = sites.slice(
      Math.floor(e.scrollTop / 120),  // 假设每个列表项高度120rpx
      Math.floor((e.scrollTop + e.windowHeight) / 120) + 1
    )
    
    // 预加载可视区域内的遗址详情
    visibleSites.forEach(site => {
      if (!preloadedSites.has(site.id)) {
        this.preloadSiteDetail(site.id)
        preloadedSites.add(site.id)
      }
    })
    
    this.setData({ preloadedSites })
  }
}) 