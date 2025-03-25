const cloud = require('wx-server-sdk')

cloud.init({
  env: 'xueshujiangzuo-5gsgu0ha42fb1390'
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { siteId } = event

  try {
    const userRef = db.collection('users').where({
      openid: wxContext.OPENID
    })

    // 获取用户数据
    const { data: users } = await userRef.get()
    if (users.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }

    // 更新访问历史
    await userRef.update({
      data: {
        visitHistory: _.push({
          each: [{
            siteId: siteId,
            visitTime: db.serverDate()
          }],
          slice: -50  // 只保留最近50条记录
        })
      }
    })

    return {
      success: true
    }
  } catch (err) {
    console.error('记录访问历史失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 