const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

// 云南省遗址数据验证
async function validateYunnanSite(site) {
  const requiredFields = [
    'id', 'name', 'location', 'era', 'type', 
    'protectionLevel', 'description', 'coordinates'
  ]
  
  const errors = []
  
  // 检查必要字段
  for (const field of requiredFields) {
    if (!site[field]) {
      errors.push(`缺少必要字段: ${field}`)
    }
  }
  
  // 检查位置是否在云南省
  if (!site.location.includes('云南省')) {
    errors.push('位置信息不在云南省范围内')
  }
  
  // 检查坐标范围是否在云南省
  const { latitude, longitude } = site.coordinates
  if (!latitude || !longitude) {
    errors.push('缺少有效坐标')
  } else {
    // 云南省大致范围
    if (latitude < 21.0 || latitude > 29.5 || 
        longitude < 97.5 || longitude > 106.2) {
      errors.push('坐标不在云南省范围内')
    }
  }
  
  return errors
}

exports.main = async (event, context) => {
  try {
    // 获取云南省所有遗址
    const { data: sites } = await db.collection('sites')
      .where({
        location: db.RegExp({
          regexp: '云南省',
          options: 'i'
        })
      })
      .get()
    
    const validationResults = []
    
    // 验证每个遗址
    for (const site of sites) {
      const errors = await validateYunnanSite(site)
      if (errors.length > 0) {
        validationResults.push({
          id: site.id,
          name: site.name,
          errors: errors
        })
      }
    }
    
    return {
      success: true,
      total: sites.length,
      errors: validationResults
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
} 