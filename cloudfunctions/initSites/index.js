const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

// 完整遗址数据
const sitesData = [
  {
    id: 1,
    name: '周口店北京人遗址',
    location: '北京市房山区周口店龙骨山',
    era: '旧石器时代',
    type: '古文化遗址',
    protectionLevel: '全国重点文物保护单位',
    description: '周口店北京人遗址是举世闻名的人类化石产地，也是研究人类起源和演化的重要基地。遗址发现于1921年，1929年发现第一个完整的"北京人"头盖骨化石。遗址出土了大量的石器和用火遗迹，为研究早期人类的生活提供了重要证据。1987年被列入世界文化遗产名录。',
    coordinates: {
      latitude: 39.687433,
      longitude: 115.935556
    }
  },
  {
    id: 2,
    name: '琉璃河西周燕都遗址',
    location: '北京市房山区琉璃河镇',
    era: '西周',
    type: '古城遗址',
    protectionLevel: '全国重点文物保护单位',
    description: '琉璃河西周燕都遗址是西周时期燕国都城遗址，遗址面积约100万平方米。考古发掘出土了大量青铜器、陶器等文物，为研究西周时期燕国的政治、经济、文化提供了重要实物资料。遗址内还发现了大型贵族墓地，出土了众多精美的青铜礼器。',
    coordinates: {
      latitude: 39.605833,
      longitude: 116.019444
    }
  },
  // ... 继续添加其他遗址数据 ...
  {
    id: 141,
    name: '克孜尔千佛洞',
    location: '新疆阿克苏地区拜城县克孜尔乡东南7公里明屋塔格山的悬崖上',
    era: '魏晋',
    type: '石窟寺',
    protectionLevel: '全国重点文物保护单位',
    description: '克孜尔千佛洞开凿于3世纪，是中国现存开凿最早的大型石窟群。石窟群依山而建，现存洞窟236个，分布在三层崖面上。洞窟形制多样，包括中心柱窟、禅窟、讲经窟等不同类型。\n\n石窟内保存了大量精美壁画，总面积达1万余平方米，内容丰富，包括佛教故事、供养人像、装饰图案等。壁画艺术风格独特，体现了中西方艺术的交融。',
    coordinates: {
      latitude: 41.683333,
      longitude: 82.516667
    }
  },
  {
    id: 142,
    name: '悬泉置遗址',
    location: '甘肃省敦煌市',
    era: '汉朝',
    type: '古城遗址',
    protectionLevel: '全国重点文物保护单位',
    description: '悬泉置遗址是汉代丝绸之路上的重要驿站遗址，出土了大量简牍等文物，对研究汉代交通和行政制度具有重要价值。',
    coordinates: {
      latitude: 40.26623803,
      longitude: 95.33107281
    }
  }
]

// 在初始化数据时进行完整性检查
async function validateAllSites() {
  const { data: sites } = await db.collection('sites').get()
  const errors = []
  
  sites.forEach(site => {
    try {
      validateSiteData(site)
    } catch (err) {
      errors.push({
        id: site.id,
        name: site.name,
        error: err.message
      })
    }
  })
  
  return errors
}

exports.main = async (event, context) => {
  try {
    // 执行数据完整性检查
    const errors = await validateAllSites()
    
    if (errors.length > 0) {
      console.error('发现数据问题:', errors)
      // 可以选择发送通知给管理员
    }
    
    // 获取现有数据
    const { data: existingSites } = await db.collection('sites').get()
    console.log('现有数据数量:', existingSites.length)
    
    // 检查重复数据
    const existingIds = new Set(existingSites.map(site => site.id))
    const duplicates = existingSites.filter((site, index, self) => 
      self.findIndex(s => s.id === site.id) !== index
    )
    
    if (duplicates.length > 0) {
      console.log('发现重复数据:', duplicates)
      // 删除重复数据
      for (const duplicate of duplicates) {
        await db.collection('sites')
          .where({
            id: duplicate.id
          })
          .remove()
      }
    }

    // 检查缺失数据
    const missingData = sitesData.filter(site => !existingIds.has(site.id))
    console.log('需要添加的数据数量:', missingData.length)

    if (missingData.length > 0) {
      // 分批插入缺失的数据
      const batchSize = 20
      for (let i = 0; i < missingData.length; i += batchSize) {
        const batch = missingData.slice(i, i + batchSize)
        await Promise.all(batch.map(site => 
          db.collection('sites').add({ data: site })
        ))
        console.log(`已插入 ${i + batch.length}/${missingData.length} 条数据`)
      }
    }

    return {
      success: true,
      message: '遗址数据初始化成功',
      stats: {
        total: existingSites.length,
        duplicates: duplicates.length,
        added: missingData.length
      }
    }
  } catch (err) {
    console.error('初始化遗址数据失败:', err)
    return {
      success: false,
      error: err,
      message: '初始化遗址数据失败'
    }
  }
} 