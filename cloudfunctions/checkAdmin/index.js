const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  console.log('检查管理员权限, openid:', wxContext.OPENID)

  try {
    // 查询用户是否是管理员
    const { data: users } = await db.collection('users')
      .where({
        openid: wxContext.OPENID,
        isAdmin: true
      })
      .get()

    console.log('查询结果:', users)

    return {
      success: true,
      isAdmin: users.length > 0
    }
  } catch (err) {
    console.error('检查管理员权限失败:', err)
    return {
      success: false,
      message: err.message || '检查管理员权限失败'
    }
  }
} 