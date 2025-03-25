const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

// 改进的日期格式化函数
function formatDate(dateStr) {
  try {
    // 处理云数据库返回的时间格式
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
    
    // 检查是否是有效日期
    if (isNaN(date.getTime())) {
      console.error('无效的日期:', dateStr)
      return '未知时间'
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch (err) {
    console.error('日期格式化失败:', err)
    return '未知时间'
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取用户的浏览记录
    const { data: users } = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .get()

    if (users.length === 0 || !users[0].visitHistory) {
      return {
        success: true,
        history: []
      }
    }

    const visitHistory = users[0].visitHistory || []

    // 获取遗址详细信息
    const sitePromises = visitHistory.map(async (visit) => {
      try {
        const { data } = await db.collection('sites')
          .where({
            id: visit.siteId
          })
          .get()

        if (data && data.length > 0) {
          return data[0]  // 直接返回遗址信息
        }
        return null
      } catch (err) {
        console.error('获取遗址信息失败:', err)
        return null
      }
    })

    // 等待所有遗址信息获取完成
    const sites = await Promise.all(sitePromises)

    // 过滤掉空值并按访问顺序排序（保持原有顺序）
    const history = sites.filter(Boolean)

    return {
      success: true,
      history
    }
  } catch (err) {
    console.error('获取浏览记录失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 