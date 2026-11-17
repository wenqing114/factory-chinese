import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { handleSpeechRequest } from './server/speech-handler.js'

function speechApiPlugin(env) {
  const middleware = async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/speech') {
      next()
      return
    }

    const chunks = []
    let size = 0
    try {
      for await (const chunk of req) {
        size += chunk.length
        if (size > 16_384) {
          res.statusCode = 413
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Dữ liệu yêu cầu quá lớn.' }))
          return
        }
        chunks.push(chunk)
      }

      const result = await handleSpeechRequest({
        method: req.method,
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }, env)
      res.statusCode = result.status
      for (const [name, value] of Object.entries(result.headers)) {
        res.setHeader(name, value)
      }
      res.end(result.body)
    } catch (error) {
      console.error('Local speech API middleware failed.', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Không thể xử lý yêu cầu đọc tiếng Trung.' }))
    }
  }

  return {
    name: 'speech-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    }
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    speechApiPlugin({
      ...process.env,
      ...loadEnv(mode, process.cwd(), 'AZURE_SPEECH_')
    })
  ]
}))
