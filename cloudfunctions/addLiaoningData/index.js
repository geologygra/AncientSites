const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

const liaoningData = [
  {
    id: 91,  // 请确保 ID 不重复
    name: '牛河梁遗址',
    location: '辽宁省朝阳市',
    era: '新石器时代',
    type: '古文化遗址',
    protectionLevel: '全国重点文物保护单位',
    description: '牛河梁遗址是红山文化的代表性遗址，包括祭坛、女神庙等建筑遗迹，出土了大量玉器和陶器，是研究中国早期文明的重要遗址。',
    coordinates: {
      latitude: 41.3333,
      longitude: 120.1167
    }
  },
  {
    id: 92,
    name: '姜女石遗址',
    location: '辽宁省丹东市',
    era: '新石器时代',
    type: '古文化遗址',
    protectionLevel: '省级文物保护单位',
    description: '姜女石遗址是新石器时代晚期至青铜时代早期的重要遗址，出土了大量石器和陶器。',
    coordinates: {
      latitude: 40.1278,
      longitude: 124.3833
    }
  },
  {
    id: 93,
    name: '五女山山城',
    location: '辽宁省桓仁满族自治县',
    era: '高句丽',
    type: '古城遗址',
    protectionLevel: '全国重点文物保护单位',
    description: '五女山山城是高句丽早期都城，保存了完整的城墙、宫殿基址等遗迹，是研究高句丽历史的重要遗址。',
    coordinates: {
      latitude: 41.2667,
      longitude: 125.3333
    }
  },
  {
    id: 94,
    name: '万佛堂石窟',
    location: '辽宁省义县',
    era: '唐代',
    type: '石窟寺',
    protectionLevel: '全国重点文物保护单位',
    description: '万佛堂石窟是辽西地区规模最大的石窟群，保存了大量唐代佛教造像和壁画。',
    coordinates: {
      latitude: 41.5333,
      longitude: 121.2333
    }
  },
  {
    id: 95,
    name: '辽阳白塔',
    location: '辽宁省辽阳市',
    era: '辽代',
    type: '古建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '辽阳白塔是辽代著名建筑，八角十三层，高约44米，是研究辽代建筑艺术的重要实物资料。',
    coordinates: {
      latitude: 41.2667,
      longitude: 123.1833
    }
  },
  {
    id: 96,
    name: '清福陵',
    location: '辽宁省沈阳市',
    era: '清代',
    type: '古建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '清福陵是清太祖努尔哈赤的陵墓，是清代皇陵建筑的开创之作。',
    coordinates: {
      latitude: 41.8333,
      longitude: 123.4500
    }
  },
  {
    id: 97,
    name: '清永陵',
    location: '辽宁省抚顺市',
    era: '清代',
    type: '古建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '清永陵是清太宗皇太极的陵墓，体现了清代皇陵的建筑特点。',
    coordinates: {
      latitude: 41.8833,
      longitude: 123.9500
    }
  },
  {
    id: 98,
    name: '北镇庙',
    location: '辽宁省北镇市',
    era: '清代',
    type: '古建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '北镇庙是清代重要的关帝庙，建筑规模宏大，保存完好。',
    coordinates: {
      latitude: 41.5833,
      longitude: 121.7833
    }
  },
  {
    id: 99,
    name: '锡伯族家庙',
    location: '辽宁省沈阳市',
    era: '清代',
    type: '古建筑',
    protectionLevel: '省级文物保护单位',
    description: '锡伯族家庙是研究锡伯族历史文化的重要遗址。',
    coordinates: {
      latitude: 41.8000,
      longitude: 123.4000
    }
  },
  {
    id: 100,
    name: '中共满洲省委旧址',
    location: '辽宁省沈阳市',
    era: '近代',
    type: '近代建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '中共满洲省委旧址是重要的革命历史纪念地。',
    coordinates: {
      latitude: 41.7917,
      longitude: 123.4083
    }
  },
  {
    id: 101,
    name: '辽宁总站旧址',
    location: '辽宁省沈阳市',
    era: '近代',
    type: '近代建筑',
    protectionLevel: '省级文物保护单位',
    description: '辽宁总站旧址是研究近代铁路交通史的重要遗址。',
    coordinates: {
      latitude: 41.7944,
      longitude: 123.4139
    }
  },
  {
    id: 102,
    name: '金牛山遗址',
    location: '辽宁省大连市',
    era: '新石器时代',
    type: '古文化遗址',
    protectionLevel: '省级文物保护单位',
    description: '金牛山遗址是新石器时代重要的考古遗址。',
    coordinates: {
      latitude: 38.9167,
      longitude: 121.6333
    }
  },
  {
    id: 103,
    name: '玄贞观',
    location: '辽宁省大连市',
    era: '唐代',
    type: '古建筑',
    protectionLevel: '省级文物保护单位',
    description: '玄贞观是辽东地区重要的道教建筑。',
    coordinates: {
      latitude: 38.9000,
      longitude: 121.6167
    }
  },
  {
    id: 104,
    name: '石棚山石棚',
    location: '辽宁省本溪市',
    era: '新石器时代',
    type: '古文化遗址',
    protectionLevel: '省级文物保护单位',
    description: '石棚山石棚是新石器时代人类活动的重要遗址。',
    coordinates: {
      latitude: 41.3000,
      longitude: 123.7667
    }
  },
  {
    id: 105,
    name: '西炮台遗址',
    location: '辽宁省旅顺口区',
    era: '近代',
    type: '近代建筑',
    protectionLevel: '全国重点文物保护单位',
    description: '西炮台遗址是近代军事防御工事的代表性遗址。',
    coordinates: {
      latitude: 38.8083,
      longitude: 121.2417
    }
  }
]

exports.main = async (event, context) => {
  try {
    // 批量添加数据
    for (const site of liaoningData) {
      // 检查是否已存在
      const { data } = await db.collection('sites').where({
        id: site.id
      }).get()

      if (data.length === 0) {
        // 不存在则添加
        await db.collection('sites').add({
          data: site
        })
      }
    }

    return {
      success: true,
      message: '辽宁省遗址数据添加成功'
    }
  } catch (err) {
    console.error('添加辽宁省遗址数据失败:', err)
    return {
      success: false,
      error: err
    }
  }
} 