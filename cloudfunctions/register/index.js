const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event

  try {
    // 检查用户是否已存在
    const { data } = await db.collection('users')
      .where({
        openid: wxContext.OPENID
      })
      .get()

    if (data.length > 0) {
      // 用户已存在
      return {
        success: false,
        message: '用户已存在'
      }
    }

    // 创建新用户
    const result = await db.collection('users').add({
      data: {
        openid: wxContext.OPENID,
        userInfo: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city
        },
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
        favorites: [], // 初始化收藏列表
        isActive: true, // 用户状态
        role: 'user' // 用户角色
      }
    })

    return {
      success: true,
      message: '注册成功',
      userInfo: userInfo
    }

  } catch (err) {
    console.error('[注册失败]', err)
    return {
      success: false,
      error: err,
      message: '注册失败'
    }
  }
} 