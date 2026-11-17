import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleSpeechRequest } from '../server/speech-handler.js'

function request(body, ip = '192.0.2.1') {
  return {
    method: 'POST',
    headers: {
      origin: 'https://study.example',
      host: 'study.example',
      'content-type': 'application/json',
      'x-forwarded-for': ip
    },
    body
  }
}

test('requires Azure Speech server configuration', async () => {
  const result = await handleSpeechRequest(request({
    text: '你好',
    voice: 'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural'
  }), {})

  assert.equal(result.status, 503)
  assert.match(JSON.parse(result.body).error, /AZURE_SPEECH_KEY/)
})

test('rejects cross-origin requests before contacting Azure', async () => {
  const result = await handleSpeechRequest({
    ...request({ text: '你好', voice: 'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural' }),
    headers: {
      origin: 'https://attacker.example',
      host: 'study.example',
      'content-type': 'application/json'
    }
  }, {
    AZURE_SPEECH_KEY: 'test-key',
    AZURE_SPEECH_REGION: 'eastasia'
  })

  assert.equal(result.status, 403)
})

test('synthesizes with an allowed voice and escapes SSML text', async () => {
  const originalFetch = globalThis.fetch
  let requestedUrl
  let requestedOptions
  globalThis.fetch = async (url, options) => {
    requestedUrl = url
    requestedOptions = options
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'content-type': 'audio/mpeg' }
    })
  }

  try {
    const result = await handleSpeechRequest(request({
      text: '你好 & <朋友>',
      voice: 'zh-CN-Yunyi:DragonHDFlashLatestNeural'
    }, '192.0.2.2'), {
      AZURE_SPEECH_KEY: 'test-key',
      AZURE_SPEECH_REGION: 'eastasia'
    })

    assert.equal(result.status, 200)
    assert.equal(result.headers['Content-Type'], 'audio/mpeg')
    assert.equal(requestedUrl, 'https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1')
    assert.equal(requestedOptions.headers['Ocp-Apim-Subscription-Key'], 'test-key')
    assert.match(requestedOptions.body, /你好 &amp; &lt;朋友&gt;/)
    assert.match(requestedOptions.body, /zh-CN-Yunyi:DragonHDFlashLatestNeural/)
    assert.deepEqual([...result.body], [1, 2, 3])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('rejects voice IDs that are not in the supported list', async () => {
  const result = await handleSpeechRequest(request({
    text: '你好',
    voice: 'zh-CN-XiaoxiaoNeural'
  }, '192.0.2.3'), {
    AZURE_SPEECH_KEY: 'test-key',
    AZURE_SPEECH_REGION: 'eastasia'
  })

  assert.equal(result.status, 400)
  assert.match(JSON.parse(result.body).error, /không được hỗ trợ/)
})
