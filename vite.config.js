import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { runTriage } from './api/_triage-core.js'
import { mintLoginToken } from './api/_auth-core.js'

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
          if (Buffer.byteLength(body) > 1048576) {
            res.statusCode = 413
            res.end(JSON.stringify({ error: 'Payload too large' }))
            req.destroy()
          }
        })
        req.on('end', async () => {
          if (res.writableEnded) return
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
      apiDevMiddleware('/api/login', (payload) => mintLoginToken(payload, env.FIREBASE_SERVICE_ACCOUNT)),
    ],
    server: {
      port: 5173,
    },
    build: {
      // Vite preloads dependencies of a lazy route when that route is requested.
      modulePreload: true,
      rollupOptions: {
        output: {
          // Split heavy third-party libraries into their own chunks,
          // separate from app code and from each other. Firebase/Leaflet/
          // Framer Motion rarely change between deploys, so browsers cache
          // these chunks across releases instead of re-downloading them
          // whenever only app code changes -- and they load in parallel
          // with the app chunk rather than as one large blocking bundle.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            // react/react-dom get an explicit, stable home of their own.
            // Without this, Rollup's cross-chunk dependency deduplication
            // was picking one of the *other* forced vendor chunks (leaflet,
            // in practice) to host React's shared internals, then made the
            // main entry import that one small binding from it -- which
            // meant the browser had to fetch the entire ~90KB gzip leaflet
            // chunk on every single page load just to run the app at all,
            // completely defeating the point of lazy-loading it.
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react'
            }
            if (id.includes('/firebase/') || id.includes('@firebase')) return 'firebase'
            if (id.includes('leaflet')) return 'leaflet'
            if (id.includes('framer-motion')) return 'framer-motion'
            return undefined
          },
        },
      },
    },
  }
})
