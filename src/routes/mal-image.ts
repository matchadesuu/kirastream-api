import { Hono } from 'hono'

const app = new Hono()

app.get('/', async (c) => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'URL missing' }, 400)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://myanimelist.net/',
      },
    })

    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)

    return new Response(await res.arrayBuffer(), {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('MAL Proxy Error:', error)
    return c.json({ error: 'Proxy failed' }, 500)
  }
})

export { app as malImageRoute }
