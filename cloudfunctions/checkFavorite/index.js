const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { relicsId } = event

  try {
    // 检查用户是否已收藏该遗址
    const { data } = await db.collection('users')
      .where({
        openid: wxContext.OPENID,
        'favorites.id': _.eq(relicsId)
      })
      .get()

    return {
      success: true,
      isFavorite: data.length > 0
    }
  } catch (err) {
    console.error('[检查收藏状态失败]', err)
    return {
      success: false,
      error: err,
      message: '检查收藏状态失败'
    }
  }
} 