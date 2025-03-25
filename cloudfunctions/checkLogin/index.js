const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const { data } = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .get()

    if (data.length > 0) {
      return {
        success: true,
        userInfo: data[0].userInfo
      }
    } else {
      return {
        success: false,
        message: '用户未登录'
      }
    }
  } catch (err) {
    console.error('[检查登录状态失败]', err)
    return {
      success: false,
      error: err,
      message: '检查登录状态失败'
    }
  }
} 