import { createClient } from '@/lib/supabase/server'
import { listLiveDocuments } from '@/lib/seo/queries'
import { SITE_ORIGIN } from '@/lib/seo/paths'

export const revalidate = 3600

export async function GET() {
  const supabase = await createClient()
  let items = ''
  try {
    const docs = await listLiveDocuments(supabase)
    items = docs
      .slice(0, 30)
      .map(
        doc => `  <item>
    <title>${escapeXml(doc.version.title)}</title>
    <link>${SITE_ORIGIN}${doc.path}</link>
    <guid>${SITE_ORIGIN}${doc.path}</guid>
    <pubDate>${new Date(doc.version.published_at || doc.version.updated_at).toUTCString()}</pubDate>
    <description>${escapeXml(doc.version.meta_description || doc.version.excerpt || '')}</description>
  </item>`
      )
      .join('\n')
  } catch {
    items = ''
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>same'z — contenus</title>
  <link>${SITE_ORIGIN}</link>
  <description>Offres, piliers et guides same'z.</description>
  <language>fr-fr</language>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
