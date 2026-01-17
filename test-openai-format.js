// 测试 OpenAI 兼容格式的 API 调用
require('dotenv').config({ path: '.env.local' })

async function testOpenAIFormat() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const baseURL = process.env.GEMINI_BASE_URL

  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : '未设置')
  console.log('🌐 Base URL:', baseURL || '使用默认')
  console.log('\n测试 OpenAI 兼容格式...\n')

  try {
    const response = await fetch(`${baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: '你好，请用一句话介绍你自己。'
          }
        ],
        temperature: 0.7,
      })
    })

    console.log('状态码:', response.status)
    const data = await response.json()
    console.log('\n📝 完整响应:')
    console.log(JSON.stringify(data, null, 2))

    if (data.choices && data.choices[0]) {
      console.log('\n✅ API 调用成功!')
      console.log('\n💬 生成的文本:')
      console.log(data.choices[0].message.content)
    } else if (data.error) {
      console.log('\n❌ API 返回错误:', data.error)
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

testOpenAIFormat()
