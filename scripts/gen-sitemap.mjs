#!/usr/bin/env node
// 从 tools.js 生成 public/sitemap.xml
// 新增工具后运行：node scripts/gen-sitemap.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tools } from '../src/config/tools.js'

const SITE = 'https://403.li'
const today = new Date().toISOString().slice(0, 10)

const urls = [
  `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`
]

for (const t of tools) {
  urls.push(`  <url>
    <loc>${SITE}${t.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

const out = join(dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml')
writeFileSync(out, xml)
console.log(`sitemap.xml 已生成：${urls.length} 个 URL（首页 + ${tools.length} 个工具）`)
