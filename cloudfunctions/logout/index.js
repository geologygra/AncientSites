const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 清除用户登录状态
    await db.collection('users').where({
      openid: wxContext.OPENID
    }).update({
      data: {
        lastLogoutTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '退出登录成功'
    }
  } catch (err) {
    console.error('[退出登录失败]', err)
    return {
      success: false,
      error: err,
      message: '退出登录失败'
    }
  }
} 