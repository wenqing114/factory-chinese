import { handleSpeechRequest } from '../server/speech-handler.js'

export default async function speech(req, res) {
  try {
    const result = await handleSpeechRequest({
      method: req.method,
      headers: req.headers,
      body: req.body
    })
    res.statusCode = result.status
    for (const [name, value] of Object.entries(result.headers)) {
      res.setHeader(name, value)
    }
    res.end(result.body)
  } catch (error) {
    console.error('Speech API handler failed.', error)
    res.statusCode = 500
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Không thể xử lý yêu cầu đọc tiếng Trung.' }))
  }
}
