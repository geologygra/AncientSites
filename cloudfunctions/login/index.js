const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event

  try {
    // 查询用户是否已存在
    const { data } = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .get()

    if (data.length === 0) {
      // 新用户,创建用户记录
      const result = await db.collection('users').add({
        data: {
          openid: wxContext.OPENID,
          userInfo,
          createTime: db.serverDate(),
          favorites: [] // 初始化收藏列表
        }
      })
      return {
        success: true,
        userInfo
      }
    } else {
      // 老用户,更新用户信息
      await db.collection('users').where({
        openid: wxContext.OPENID
      }).update({
        data: {
          userInfo
        }
      })
      return {
        success: true,
        userInfo
      }
    }
  } catch (err) {
    console.error('[登录失败]', err)
    return {
      success: false,
      error: err
    }
  }
} 