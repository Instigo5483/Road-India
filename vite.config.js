import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { runTriage } from './api/_triage-core.js'

// Mirrors api/triage.js (the Vercel serverless endpoint) as dev-server
// middleware, so `npm run dev` exercises the exact same AI-triage code
// path a production deploy uses -- no `vercel dev` / Vercel CLI required
// for local development.
function triageDevApiPlugin(env) {
  return {
    name: 'triage-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/triage', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', async () => {
          try {
            const payload = body ? JSON.parse(body) : {}
            const result = await runTriage(payload, env.OPENAI_API_KEY)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Triage failed' }))
          }
        })
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), triageDevApiPlugin(env)],
    server: {
      port: 5173,
    },
  }
})
