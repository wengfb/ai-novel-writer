// 测试 Gemini API 调用
require('dotenv').config({ path: '.env.local' })

async function testGemini() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const baseURL = process.env.GEMINI_BASE_URL

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '未设置')
  console.log('🌐 Base URL:', baseURL || '使用默认')
  console.log('\n开始测试...\n')

  // 尝试方法 1: 使用 x-goog-api-key header
  console.log('📝 方法 1: 使用 x-goog-api-key header')
  try {
    const response = await fetch(`${baseURL}/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '你好，请用一句话介绍你自己。'
          }]
        }]
      })
    })

    console.log('状态码:', response.status)
    const text = await response.text()
    console.log('响应:', text.substring(0, 200))
    console.log('')
  } catch (error) {
    console.error('❌ 方法 1 失败:', error.message)
  }

  // 尝试方法 2: 使用 Authorization header
  console.log('📝 方法 2: 使用 Authorization header')
  try {
    const response = await fetch(`${baseURL}/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '你好，请用一句话介绍你自己。'
          }]
        }]
      })
    })

    console.log('状态码:', response.status)
    const text = await response.text()
    console.log('响应:', text.substring(0, 200))
    console.log('')
  } catch (error) {
    console.error('❌ 方法 2 失败:', error.message)
  }

  // 尝试方法 3: 使用 query parameter
  console.log('📝 方法 3: 使用 query parameter')
  try {
    const response = await fetch(`${baseURL}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: '你好，请用一句话介绍你自己。'
          }]
        }]
      })
    })

    console.log('状态码:', response.status)
    const text = await response.text()
    console.log('响应:', text.substring(0, 200))
  } catch (error) {
    console.error('❌ 方法 3 失败:', error.message)
  }
}

testGemini()

