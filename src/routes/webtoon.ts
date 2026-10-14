import { Hono } from 'hono'
import * as cheerio from 'cheerio'

const app = new Hono()
const BASE = 'https://www.webtoons.com'

async function fetchHtml(path: string): Promise<string> {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.webtoons.com/',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`)
  return res.text()
}

function uniqueByUrl(items: Array<Record<string, unknown>>) {
  return items.filter(
    (item, index, arr) => arr.findIndex((x) => x.url === item.url) === index,
  )
}

app.get('/', async (c) => {
  const action = c.req.query('action')
  const query = c.req.query('query') ?? ''
  const url = c.req.query('url') ?? ''
  const day = c.req.query('day')

  try {
    // --- trending / daily schedule ---
    if (action === 'trending') {
      const d = (day ?? 'trending').toLowerCase()
      const path =
        d === 'completed'
          ? '/id/originals/completed'
          : d === 'daily' || d === 'trending'
            ? '/id/dailySchedule'
            : `/id/originals/${d}`

      const html = await fetchHtml(path)
      const $ = cheerio.load(html)
      const items: Array<Record<string, unknown>> = []

      $("a[href*='/list?title_no=']").each((_, el) => {
        const $a = $(el)
        const href = $a.attr('href') ?? ''
        if (!href) return
        const absUrl = href.startsWith('http') ? href : `${BASE}${href}`
        const title =
          $a.find('.subj, p.subj, strong.title').first().text().trim() ||
          $a.attr('title')?.trim() ||
          'Untitled'
        const thumbnail =
          $a.find('img').first().attr('data-url') ||
          $a.find('img').first().attr('src') ||
          ''
        items.push({ title, thumbnail, url: absUrl.split('&webtoon-platform-redirect')[0] })
      })

      return c.json({ items: uniqueByUrl(items) })
    }

    // --- search ---
    if (action === 'search') {
      const html = await fetchHtml(`/id/search?keyword=${encodeURIComponent(query)}`)
      const $ = cheerio.load(html)
      const items: Array<Record<string, unknown>> = []

      $("a[href*='/list?title_no=']").each((_, el) => {
        const $a = $(el)
        const href = $a.attr('href') ?? ''
        if (!href) return
        const absUrl = href.startsWith('http') ? href : `${BASE}${href}`
        const title =
          $a.find('strong.title, p.subj, .subj').first().text().trim() || 'Untitled'
        const thumbnail =
          $a.find('img').first().attr('data-url') ||
          $a.find('img').first().attr('src') ||
          ''
        items.push({ title, thumbnail, url: absUrl.split('&')[0] })
      })

      return c.json({ items: uniqueByUrl(items) })
    }

    // --- detail (all episodes, paginated) ---
    if (action === 'detail') {
      const html = await fetchHtml(url)
      const $ = cheerio.load(html)

      const title =
        $('h1.subj, h3.subj, .info .subj').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        ''
      const thumbnail =
        $('.detail_header .thmb img, .detail_bg img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        ''
      const synopsis =
        $('p.summary, .detail_body .summary').first().text().trim() ||
        $('meta[property="og:description"]').attr('content') ||
        ''
      const episodes: Array<Record<string, unknown>> = []

      const parseEpisodeList = ($root: ReturnType<typeof cheerio.load>) => {
        $root('#_listUl > li, ul#_listUl > li').each((_, el) => {
          const $li = $root(el)
          const $a = $li.find('a').first()
          const href = $a.attr('href') ?? ''
          if (!href) return
          const epNo =
            Number($li.attr('data-episode-no')) ||
            Number(href.match(/episode_no=(\d+)/)?.[1]) ||
            null
          episodes.push({
            episodeNo: epNo,
            title:
              $a.find('.subj span, .subj').first().text().trim() ||
              $a.attr('title')?.trim() ||
              $a.text().trim(),
            thumbnail: $a.find('.thmb img, img').first().attr('src') ?? '',
            url: href.startsWith('http') ? href : `${BASE}${href}`,
          })
        })
      }

      parseEpisodeList($)

      let totalPages = 1
      $('div.paginate a, .paginate a').each((_, el) => {
        const t = Number($(el).text().trim())
        if (Number.isFinite(t) && t > totalPages) totalPages = t
      })

      const MAX_PAGES = 200 // safety cap (~2000 episode)
      const lastPage = Math.min(totalPages, MAX_PAGES)
      const sep = url.includes('?') ? '&' : '?'

      for (let start = 2; start <= lastPage; start += 5) {
        const end = Math.min(start + 4, lastPage)
        const results = await Promise.allSettled(
          Array.from({ length: end - start + 1 }, (_, i) =>
            fetchHtml(`${url}${sep}page=${start + i}`),
          ),
        )
        for (const result of results) {
          if (result.status !== 'fulfilled') continue
          parseEpisodeList(cheerio.load(result.value))
        }
      }

      return c.json({ title, thumbnail, synopsis, url, episodes: uniqueByUrl(episodes) })
    }

    // --- pages (gambar per episode) ---
    if (action === 'pages') {
      const html = await fetchHtml(url)
      const $ = cheerio.load(html)
      const images: string[] = []

      $('#_imageList img').each((_, el) => {
        const src = $(el).attr('data-url') || $(el).attr('src')
        if (src) images.push(src)
      })

      return c.json({ images })
    }

    return c.json({ error: 'Invalid action' }, 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})

export { app as webtoonRoute }
