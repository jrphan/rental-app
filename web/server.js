import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import serverEntry from './dist/server/server.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = process.env.PORT || 4173
const host = process.env.HOST || 'localhost'
const clientDir = join(__dirname, 'dist', 'client')

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)

    // Serve static files từ dist/client
    if (
      url.pathname.startsWith('/assets/') ||
      url.pathname.match(/\.(js|css|ico|png|jpg|svg|woff|woff2|ttf|eot)$/)
    ) {
      const filePath = join(clientDir, url.pathname)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath)
        const ext = url.pathname.split('.').pop()
        const contentType =
          {
            js: 'application/javascript',
            css: 'text/css',
            ico: 'image/x-icon',
            png: 'image/png',
            jpg: 'image/jpeg',
            svg: 'image/svg+xml',
          }[ext] || 'application/octet-stream'

        res.setHeader('Content-Type', contentType)
        res.end(content)
        return
      }
    }

    // SSR cho các routes khác
    const request = new Request(url.toString(), {
      method: req.method,
      headers: req.headers,
    })

    const response = await serverEntry.fetch(request)

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    if (response.body) {
      const buffer = await response.arrayBuffer()
      res.end(Buffer.from(buffer))
    } else {
      res.end()
    }
  } catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
}).listen(port, host, () => {
  console.log(`🚀 Server running at http://${host}:${port}`)
})
