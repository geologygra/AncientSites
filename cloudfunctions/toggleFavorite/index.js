const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { relicsId, action } = event // action: 'add' 或 'remove'
  console.log('收藏操作:', { relicsId, action })

  try {
    const userRef = db.collection('users').where({
      openid: wxContext.OPENID
    })

    // 先检查用户收藏状态
    const { data: userData } = await userRef.get()
    console.log('用户数据:', userData)

    if (userData.length === 0) {
      throw new Error('用户不存在')
    }

    const user = userData[0]
    const favorites = user.favorites || []

    if (action === 'add') {
      // 检查是否已经收藏
      if (favorites.some(f => f.id === relicsId)) {
        return {
          success: true,
          message: '已经收藏过了'
        }
      }

      // 添加收藏
      await userRef.update({
        data: {
          favorites: _.push([{
            id: relicsId,
            addTime: db.serverDate()
          }])
        }
      })

      console.log('添加收藏成功')
      return {
        success: true,
        message: '收藏成功'
      }
    } else {
      // 取消收藏
      const newFavorites = favorites.filter(f => f.id !== relicsId)
      await userRef.update({
        data: {
          favorites: newFavorites
        }
      })

      console.log('取消收藏成功')
      return {
        success: true,
        message: '取消收藏成功'
      }
    }
  } catch (err) {
    console.error('[收藏操作失败]', err)
    return {
      success: false,
      error: err,
      message: '操作失败'
    }
  }
} 