// 测试 Gemini API - 使用正确的端点
require('dotenv').config({ path: '.env.local' })

async function testGeminiAPI() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const baseURL = process.env.GEMINI_BASE_URL

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '未设置')
  console.log('🌐 Base URL:', baseURL)
  console.log('\n开始测试 Gemini API...\n')

  // 测试可用的模型
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-flash',
    'gemini-3-pro'
  ]

  for (const model of models) {
    console.log(`\n📝 测试模型: ${model}`)
    console.log('=' .repeat(50))

    try {
      const url = `${baseURL}/v1beta/models/${model}:generateContent`
      console.log('请求 URL:', url)

      const response = await fetch(url, {
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

      if (response.ok) {
        const data = await response.json()
        if (data.candidates && data.candidates[0]) {
          const text = data.candidates[0].content.parts[0].text
          console.log('✅ 成功!')
          console.log('💬 响应:', text)
          break // 找到可用的模型就停止
        }
      } else {
        const error = await response.text()
        console.log('❌ 失败:', error.substring(0, 100))
      }
    } catch (error) {
      console.error('❌ 错误:', error.message)
    }
  }
}

testGeminiAPI()
