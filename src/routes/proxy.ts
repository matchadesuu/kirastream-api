import { Hono } from 'hono'

const app = new Hono()

app.get('/', async (c) => {
  const url = c.req.query('url')
  if (!url) return c.json({ error: 'URL parameter is required' }, 400)

  try {
    const hostname = new URL(url).hostname

    // Sakuranovel pakai WAF/Cloudflare → titip ke wsrv.nl
    if (/sakuranovel\.id/i.test(hostname)) {
      const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`
      const res = await fetch(wsrvUrl, { signal: AbortSignal.timeout(15000) })
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      return new Response(await res.arrayBuffer(), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
        },
      })
    }

    // Hotlink protection: set Referer yang sesuai per-domain
    let referer = new URL(url).origin + '/'
    if (/webtoons\.com|pstatic\.net/i.test(hostname)) {
      referer = 'https://www.webtoons.com/'
    } else if (/myanimelist\.net/i.test(hostname)) {
      referer = 'https://myanimelist.net/'
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    })

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    return new Response(await res.arrayBuffer(), {
      status: res.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown'
    console.error('Image proxy error:', detail)
    return c.json({ error: 'Failed to fetch image', detail, upstreamStatus: null }, 500)
  }
})

export { app as proxyRoute }
