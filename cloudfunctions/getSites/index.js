const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()
const MAX_LIMIT = 100 // 云数据库单次查询限制
const _ = db.command

// 添加数据验证函数
async function validateSiteData(site) {
  const requiredFields = [
    'id', 'name', 'location', 'era', 'type', 
    'protectionLevel', 'description', 'coordinates'
  ]
  
  // 检查必要字段
  for (const field of requiredFields) {
    if (!site[field]) {
      throw new Error(`缺少必要字段: ${field}`)
    }
  }
  
  // 检查坐标
  const { latitude, longitude } = site.coordinates
  if (!latitude || !longitude) {
    throw new Error(`遗址 ${site.name} 缺少有效坐标`)
  }
}

// 添加计算遗址相关性的函数
function calculateRelevance(site1, site2) {
  let score = 0;
  
  // 1. 地理位置相关性（基于省份）
  if (site1.location.split('省')[0] === site2.location.split('省')[0]) {
    score += 30;
  }
  
  // 2. 时代相关性
  if (site1.era === site2.era) {
    score += 25;
  } else {
    // 处理相近时代
    const eras = ['旧石器时代', '新石器时代', '夏朝', '商朝', '西周', '东周', '秦朝', '汉朝', '三国', '晋代', '南北朝', '隋朝', '唐朝', '宋朝', '元朝', '明朝', '清朝', '近代'];
    const era1Index = eras.indexOf(site1.era);
    const era2Index = eras.indexOf(site2.era);
    if (era1Index !== -1 && era2Index !== -1) {
      const eraDiff = Math.abs(era1Index - era2Index);
      if (eraDiff === 1) score += 15;
      else if (eraDiff === 2) score += 10;
    }
  }
  
  // 3. 类型相关性
  if (site1.type === site2.type) {
    score += 20;
  }
  
  // 4. 保护级别相关性
  if (site1.protectionLevel === site2.protectionLevel) {
    score += 15;
  }
  
  // 5. 地理距离相关性（使用简单的经纬度距离计算）
  const distance = Math.sqrt(
    Math.pow(site1.coordinates.latitude - site2.coordinates.latitude, 2) +
    Math.pow(site1.coordinates.longitude - site2.coordinates.longitude, 2)
  );
  // 距离越近，分数越高（最高10分）
  score += Math.max(0, 10 - distance * 10);
  
  return score;
}

exports.main = async (event, context) => {
  const { keyword, region, era, type, id, excludeId, isRelated, page = 1, pageSize = 10 } = event
  console.log('查询参数:', { keyword, region, era, type, id, excludeId, isRelated, page, pageSize })

  try {
    let query = {}
    
    // 如果是相关遗址查询
    if (isRelated && excludeId) {
      // 先获取当前遗址信息
      const currentSite = (await db.collection('sites').where({ id: excludeId }).get()).data[0];
      
      if (!currentSite) {
        throw new Error('未找到当前遗址信息');
      }
      
      // 获取所有可能相关的遗址
      const allSites = (await db.collection('sites').where({
        id: _.neq(excludeId)  // 排除当前遗址
      }).get()).data;
      
      // 计算每个遗址的相关性得分
      const scoredSites = allSites.map(site => {
        const score = calculateRelevance(currentSite, site);
        // 添加相关性说明
        const relevanceReasons = [];
        
        if (site.location.split('省')[0] === currentSite.location.split('省')[0]) {
          relevanceReasons.push('同一地区');
        }
        if (site.era === currentSite.era) {
          relevanceReasons.push('同一时期');
        }
        if (site.type === currentSite.type) {
          relevanceReasons.push('相同类型');
        }
        if (site.protectionLevel === currentSite.protectionLevel) {
          relevanceReasons.push('相同保护级别');
        }

        return {
          ...site,
          relevanceScore: score,
          relevanceReasons: relevanceReasons.join('、')
        };
      });
      
      // 按相关性得分排序并返回前5个
      const relatedSites = scoredSites
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
      
      return {
        success: true,
        sites: relatedSites,
        pagination: {
          current: 1,
          pageSize: 5,
          total: relatedSites.length,
          totalPages: 1
        }
      };
    }

    // 构建查询条件
    if (id) {
      query.id = id  // 根据id精确查询
    } else {
      // 关键词搜索
      if (keyword) {
        query = _.or([
          { name: db.RegExp({ regexp: keyword, options: 'i' }) },
          { location: db.RegExp({ regexp: keyword, options: 'i' }) }
        ])
      }

      // 地区筛选
      if (region && region !== '全部') {
        const regionQuery = {
          location: db.RegExp({ regexp: region, options: 'i' })
        }
        query = keyword ? _.and([query, regionQuery]) : regionQuery
      }

      // 年代筛选
      if (era && era !== '全部') {
        const eraQuery = { era: era }
        query = Object.keys(query).length > 0 ? _.and([query, eraQuery]) : eraQuery
      }

      // 类型筛选
      if (type && type !== '全部') {
        const typeQuery = { type: type }
        query = Object.keys(query).length > 0 ? _.and([query, typeQuery]) : typeQuery
      }
    }

    console.log('最终查询条件:', query)

    // 获取总数
    const countResult = await db.collection('sites').where(query).count()
    const total = countResult.total
    const totalPages = Math.ceil(total / pageSize)

    // 分页获取数据
    const tasks = []
    const skip = (page - 1) * pageSize
    
    // 处理单次查询限制
    const batchTimes = Math.ceil(pageSize / MAX_LIMIT)
    
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection('sites')
        .where(query)
        .skip(skip + i * MAX_LIMIT)
        .limit(Math.min(MAX_LIMIT, pageSize - i * MAX_LIMIT))
        .get()
      tasks.push(promise)
    }

    // 等待所有查询完成
    const results = await Promise.all(tasks)
    
    // 合并查询结果
    let sites = []
    results.forEach(result => {
      sites = sites.concat(result.data)
    })

    // 验证每个遗址数据
    for (const site of sites) {
      await validateSiteData(site)
    }

    return {
      success: true,
      sites: sites,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages
      }
    }

  } catch (err) {
    console.error('获取遗址列表失败:', err)
    return {
      success: false,
      message: err.message || '获取遗址列表失败'
    }
  }
} 