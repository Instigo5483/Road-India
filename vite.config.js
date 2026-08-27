import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { runTriage } from './api/_triage-core.js'
import { runDispatch } from './api/_dispatch-core.js'

/** Mirrors a POST-only Vercel serverless endpoint under api/ as dev-server
 * middleware, so `npm run dev` exercises the exact same code path a real
 * deploy uses -- no `vercel dev` / Vercel CLI required for local dev. */
function apiDevMiddleware(path, handler) {
  return {
    name: `dev-api${path}`,
    configureServer(server) {
      server.middlewares.use(path, (req, res) => {
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
            const result = await handler(payload)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Request failed' }))
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
    plugins: [
      react(),
      apiDevMiddleware('/api/triage', (payload) => runTriage(payload, env.OPENAI_API_KEY)),
      apiDevMiddleware('/api/dispatch', (payload) => runDispatch(payload, env.FIREBASE_SERVICE_ACCOUNT)),
    ],
    server: {
      port: 5173,
    },
    build: {
      rollupOptions: {
        output: {
          // Split heavy third-party libraries into their own chunks,
          // separate from app code and from each other. Firebase/Leaflet/
          // Framer Motion rarely change between deploys, so browsers cache
          // these chunks across releases instead of re-downloading them
          // whenever only app code changes -- and they load in parallel
          // with the app chunk rather than as one large blocking bundle.
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/messaging'],
            leaflet: ['leaflet', 'react-leaflet'],
            'framer-motion': ['framer-motion'],
          },
        },
      },
    },
  }
})
