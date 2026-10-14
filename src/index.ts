import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { proxyRoute } from './routes/proxy'
import { malImageRoute } from './routes/mal-image'
import { webtoonRoute } from './routes/webtoon'

type Bindings = {
  ALLOWED_ORIGINS: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS: baca dari env binding, default "*"
app.use('*', async (c, next) => {
  const rawOrigins = (c.env.ALLOWED_ORIGINS ?? '*').split(',')
  const allowed = rawOrigins.map((o) => o.trim()).filter(Boolean)

  return cors({
    origin: allowed.includes('*') ? '*' : allowed,
  })(c, next)
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/api/proxy', proxyRoute)
app.route('/api/mal-image', malImageRoute)
app.route('/api/webtoon', webtoonRoute)

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404))

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
