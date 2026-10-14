# KiraStream API

Backend **KiraStream** — dibangun sebagai **Cloudflare Worker** menggunakan [Hono](https://hono.dev/). Menyediakan endpoint baca-saja untuk proxy gambar/request dan pengambilan data dari sumber pihak ketiga.

## ✨ Endpoint

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/proxy` | Proxy request/gambar umum (menghindari CORS, menyembunyikan URL asli) |
| GET | `/api/mal-image` | Proxy gambar MyAnimeList |
| GET | `/api/webtoon` | Scraper katalog/detail Webtoons |

## 🛠️ Tech Stack

| Kategori | Teknologi |
| --- | --- |
| Runtime | Cloudflare Workers |
| Framework | [Hono](https://hono.dev/) |
| Scraping/parsing | Cheerio |
| Bahasa | TypeScript |
| Deploy tooling | Wrangler |

## 📁 Struktur Proyek

```
kirastream-api/
├── src/
│   ├── index.ts        # Entry point + routing Hono
│   └── routes/
│       ├── proxy.ts
│       ├── mal-image.ts
│       └── webtoon.ts
├── wrangler.toml       # Konfigurasi Worker
├── tsconfig.json
└── package.json
```

## 🚀 Memulai

Prasyarat: Node.js 18+ dan akun [Cloudflare](https://dash.cloudflare.com/).

```bash
git clone https://github.com/ryouhtml/kirastream-api.git
cd kirastream-api
npm install
```

### Menjalankan Secara Lokal

```bash
npm run dev        # wrangler dev -> http://localhost:8787
```

### Type check

```bash
npm run typecheck
```

### Deploy

```bash
npm run deploy     # wrangler deploy
```

## ⚙️ Konfigurasi

Variabel non-rahasia didefinisikan di `[vars]` pada `wrangler.toml`:

| Variabel | Default | Deskripsi |
| --- | --- | --- |
| `ALLOWED_ORIGINS` | `*` | Origin yang diizinkan untuk CORS. Batasi ke domain frontend saat produksi. |

## 👥 Contributors

Terima kasih kepada semua yang telah membantu membangun KiraStream 💜

| Contributor | Peran |
| --- | --- |
| [ryouhtml](https://github.com/ryouhtml) | Author & Maintainer |

**Dibantu oleh asisten AI:**

| Tool | Situs |
| --- | --- |
| OpenCode | <https://opencode.ai> |
| Gemini | <https://gemini.google.com> |
| Claude | <https://claude.ai> |
| ChatGPT | <https://chatgpt.com> |
| Grok | <https://grok.com> |
| Perplexity | <https://www.perplexity.ai> |
| DeepSeek | <https://www.deepseek.com> |

Lihat [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) untuk daftar lengkap.

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License**.
