const VOICES = new Set([
  'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural',
  'zh-CN-Yunyi:DragonHDFlashLatestNeural'
])
const MAX_TEXT_LENGTH = 500
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const requestsByIp = new Map()

function jsonResponse(status, error, headers = {}) {
  return {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    },
    body: JSON.stringify({ error })
  }
}

function parseBody(body) {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body
  if (Buffer.isBuffer(body)) body = body.toString('utf8')
  if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > 16_384) return null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function isSameOrigin(headers) {
  const originValue = headers.origin
  const host = headers['x-forwarded-host'] || headers.host
  if (typeof originValue !== 'string' || typeof host !== 'string') return false
  try {
    return new URL(originValue).host.toLowerCase() === host.toLowerCase()
  } catch {
    return false
  }
}

function isRateLimited(headers) {
  const forwardedFor = headers['x-forwarded-for']
  const ip = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown'
  const now = Date.now()
  const current = requestsByIp.get(ip)
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestsByIp.set(ip, { startedAt: now, count: 1 })
  } else if (current.count >= RATE_LIMIT) {
    return true
  } else {
    current.count += 1
  }
  if (requestsByIp.size > 1000) {
    for (const [key, value] of requestsByIp) {
      if (now - value.startedAt >= RATE_WINDOW_MS) requestsByIp.delete(key)
    }
  }
  return false
}

function escapeXml(text) {
  return text.replace(/[<>&'"]/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[character])
}

export async function handleSpeechRequest(request, env = process.env) {
  if (request.method !== 'POST') {
    return jsonResponse(405, 'Chỉ hỗ trợ yêu cầu POST.', { Allow: 'POST' })
  }
  if (!isSameOrigin(request.headers || {})) {
    return jsonResponse(403, 'Yêu cầu không cùng nguồn website.')
  }

  const payload = parseBody(request.body)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonResponse(400, 'Dữ liệu yêu cầu không hợp lệ.')
  }
  const text = typeof payload.text === 'string' ? payload.text.trim() : ''
  const voice = payload.voice
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(400, `Văn bản cần có từ 1 đến ${MAX_TEXT_LENGTH} ký tự.`)
  }
  if (typeof voice !== 'string' || !VOICES.has(voice)) {
    return jsonResponse(400, 'Giọng đọc không được hỗ trợ.')
  }

  const key = env.AZURE_SPEECH_KEY
  const region = env.AZURE_SPEECH_REGION
  if (!key || !region) {
    return jsonResponse(503, 'Chưa cấu hình AZURE_SPEECH_KEY và AZURE_SPEECH_REGION trên máy chủ.')
  }
  if (!/^[a-z0-9-]+$/i.test(region)) {
    return jsonResponse(500, 'AZURE_SPEECH_REGION không hợp lệ.')
  }
  if (isRateLimited(request.headers || {})) {
    return jsonResponse(429, 'Bạn đã gửi quá nhiều yêu cầu đọc. Vui lòng thử lại sau.', {
      'Retry-After': '60'
    })
  }

  const ssml = `<speak version="1.0" xml:lang="zh-CN" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${voice}">${escapeXml(text)}</voice></speak>`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  let azureResponse
  let audio
  let errorDetails = ''
  try {
    azureResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'Ocp-Apim-Subscription-Key': key,
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
      },
      body: ssml,
      signal: controller.signal
    })
    if (azureResponse.ok) audio = Buffer.from(await azureResponse.arrayBuffer())
    else errorDetails = (await azureResponse.text()).slice(0, 500)
  } catch (error) {
    console.error('Azure Speech synthesis request failed.', error)
    return jsonResponse(502, 'Không kết nối được Azure Speech. Hãy kiểm tra vùng resource và thử lại.')
  } finally {
    clearTimeout(timeout)
  }

  if (!azureResponse.ok) {
    const detail = errorDetails ? ` ${errorDetails}` : ''
    return jsonResponse(502, `Azure Speech trả về HTTP ${azureResponse.status}.${detail}`)
  }
  if (!audio?.length) {
    return jsonResponse(502, 'Azure Speech không trả về dữ liệu âm thanh.')
  }

  return {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Length': String(audio.length),
      'Content-Type': 'audio/mpeg',
      'X-Content-Type-Options': 'nosniff'
    },
    body: audio
  }
}
