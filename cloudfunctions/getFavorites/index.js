const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('开始获取收藏列表, openid:', wxContext.OPENID)

  try {
    // 直接从 users 集合获取用户的收藏列表
    const { data: users } = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .field({
        favorites: true  // 只获取 favorites 字段
      })
      .get()

    console.log('用户数据:', users)

    if (!users || users.length === 0) {
      console.log('未找到用户数据')
      return {
        success: true,
        favorites: []
      }
    }

    const favorites = users[0].favorites || []
    console.log('收藏列表:', favorites)

    // 直接返回收藏列表
    return {
      success: true,
      favorites: favorites.map(fav => ({
        id: fav.id,
        addTime: fav.addTime
      })).sort((a, b) => {
        // 按收藏时间倒序排序
        const timeA = a.addTime ? new Date(a.addTime).getTime() : 0
        const timeB = b.addTime ? new Date(b.addTime).getTime() : 0
        return timeB - timeA
      })
    }

  } catch (err) {
    console.error('[获取收藏列表失败]', err)
    return {
      success: false,
      message: err.message || '获取收藏列表失败'
    }
  }
} 