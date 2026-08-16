import { createClient } from '@/lib/supabase/server'
import { listLiveDocuments } from '@/lib/seo/queries'
import { SITE_ORIGIN } from '@/lib/seo/paths'

export const revalidate = 3600

export async function GET() {
  let extras = ''
  try {
    const supabase = await createClient()
    const docs = await listLiveDocuments(supabase)
    extras = docs.map(doc => `- [${doc.version.title}](${SITE_ORIGIN}${doc.path}): ${doc.version.excerpt || doc.version.meta_description || ''}`).join('\n')
  } catch {
    extras = ''
  }

  const body = `# same'z

> Solutions logicielles sur mesure : apps, automatisation n8n, agents IA, sites SEO.

- Site: ${SITE_ORIGIN}
- Contact: contact@samez.fr
- Réservation: ${SITE_ORIGIN}/reserver

## Pages principales
- [Services](${SITE_ORIGIN}/services)
- [Réalisations](${SITE_ORIGIN}/realisations)
- [Guides](${SITE_ORIGIN}/guides)
- [À propos](${SITE_ORIGIN}/a-propos)

## Contenus publiés
${extras || '- Aucun contenu CMS publié pour le moment.'}
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
