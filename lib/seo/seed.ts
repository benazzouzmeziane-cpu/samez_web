'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { createDocumentSchema } from './schema'
import { documentPath, newBlockId } from './paths'

const DRAFTS = [
  {
    type: 'service' as const,
    slug: 'automatisation-n8n',
    silo: 'automatisation',
    title: 'Automatisation n8n sur mesure',
    keyword: 'agence n8n',
    intent: 'commercial' as const,
    answer:
      'same’z conçoit des workflows n8n robustes : erreurs gérées, reprises, surveillance. Pas un scénario jetable, un système qui tient en production.',
  },
  {
    type: 'service' as const,
    slug: 'agent-ia',
    silo: 'ia',
    title: 'Agents IA en production',
    keyword: 'créer un agent IA sur mesure',
    intent: 'commercial' as const,
    answer:
      'Un agent IA same’z exécute une tâche métier réelle — fiches produit, SEO, process — avec des garde-fous. Macarte Imprimée tourne déjà ainsi.',
  },
  {
    type: 'service' as const,
    slug: 'site-seo',
    silo: 'web',
    title: 'Sites Next.js pensés SEO',
    keyword: 'création site internet SEO',
    intent: 'commercial' as const,
    answer:
      'Un site same’z est construit pour être trouvé : structure, performance, contenu. Univercarte a été refondu sur cette base.',
  },
  {
    type: 'pillar' as const,
    slug: 'automatiser-entreprise',
    silo: 'automatisation',
    title: 'Automatiser une TPE ou PME',
    keyword: 'automatiser mon entreprise',
    intent: 'informational' as const,
    answer:
      'On automatise d’abord les tâches répétitives et structurées. n8n ou du code, selon le risque. Un seul workflow prouvé vaut mieux que cinq prototypes.',
  },
  {
    type: 'pillar' as const,
    slug: 'creer-agent-ia',
    silo: 'ia',
    title: 'Créer un agent IA en entreprise',
    keyword: 'créer un agent IA entreprise',
    intent: 'informational' as const,
    answer:
      'Un agent n’est utile que s’il a un déclencheur, des règles, des outils et une supervision. Sinon, un workflow suffit — et coûte moins cher.',
  },
  {
    type: 'guide' as const,
    slug: 'n8n-c-est-quoi',
    silo: 'automatisation',
    title: 'n8n, c’est quoi ?',
    keyword: 'n8n c’est quoi',
    intent: 'informational' as const,
    answer:
      'n8n est un orchestrateur de workflows, auto-hébergeable. Il relie vos outils et peut appeler de l’IA. same’z l’utilise quand le no-code tient, et passe au code quand il casse.',
  },
]

export async function seedDefaultSeoDrafts() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) throw new Error('Accès admin requis')

  for (const draft of DRAFTS) {
    createDocumentSchema.parse({
      type: draft.type,
      slug: draft.slug,
      title: draft.title,
      silo: draft.silo,
    })
    const { data: existing } = await supabase
      .from('seo_documents')
      .select('id')
      .eq('slug', draft.slug)
      .maybeSingle()
    if (existing) continue

    const { data: document, error } = await supabase
      .from('seo_documents')
      .insert({ type: draft.type, slug: draft.slug, silo: draft.silo })
      .select('id')
      .single()
    if (error || !document) throw new Error(error?.message || 'Seed document')

    const path = documentPath(draft.type, draft.slug)
    const { error: versionError } = await supabase.from('seo_document_versions').insert({
      document_id: document.id,
      version_number: 1,
      status: 'draft',
      title: draft.title,
      h1: draft.title,
      excerpt: draft.answer,
      meta_title: draft.title.slice(0, 70),
      meta_description: draft.answer.slice(0, 160),
      canonical_path: path,
      target_slug: draft.slug,
      keyword_primary: draft.keyword,
      search_intent: draft.intent,
      audience: 'Dirigeants de TPE/PME et porteurs de projet',
      factual_summary: draft.answer,
      geo_region: 'FR',
      author_name: "same'z",
      cta_href: '/reserver',
      cta_label: 'Réserver 45 min',
      human_reviewed: false,
      created_by: user.id,
      entities: [{ name: 'same’z' }, { name: draft.keyword }],
      faq: [
        {
          question: 'Par où commencer ?',
          answer: 'Un diagnostic de 45 minutes pour prioriser le bon livrable, pas une usine à slides.',
        },
        {
          question: 'Le code m’appartient ?',
          answer: 'Oui. same’z livre des systèmes dont vous êtes propriétaire.',
        },
      ],
      sources: [
        { label: 'Linqio — app live sur les stores' },
        { label: 'Macarte Imprimée — agents fiches produit et SEO', url: 'https://macarteimprimee.com' },
        { label: 'Univercarte — refonte et automatisations', url: 'https://universcarte.com' },
      ],
      blocks: [
        {
          id: newBlockId(),
          type: 'hero',
          eyebrow: 'same’z',
          heading: draft.title,
          subheading: 'Des systèmes en production, pas des démos.',
        },
        { id: newBlockId(), type: 'answer', text: draft.answer },
        {
          id: newBlockId(),
          type: 'markdown',
          markdown:
            '## Ce que same’z livre\n\nUn cadrage court, un livrable utilisable, et la propriété du système. Les preuves : Linqio sur les stores, Macarte Imprimée, Univercarte.\n\n## Ce que cette page n’est pas\n\nPas une usine à articles. Ce brouillon est à relire, compléter, puis publier.',
        },
        {
          id: newBlockId(),
          type: 'cta',
          heading: 'On priorise ensemble',
          text: '45 minutes pour voir si une app, une automatisation ou un site est le bon prochain pas.',
          href: '/reserver',
          label: 'Réserver 45 min',
        },
      ],
    })
    if (versionError) throw new Error(versionError.message)
  }

  revalidatePath('/admin/seo')
}
