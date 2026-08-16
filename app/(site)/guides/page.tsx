import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listLiveDocuments } from '@/lib/seo/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Guides same’z sur l’automatisation, n8n, les agents IA et les sites qui convertissent.',
  alternates: { canonical: 'https://samez.fr/guides' },
}

export default async function GuidesIndexPage() {
  let docs: Awaited<ReturnType<typeof listLiveDocuments>> = []
  try {
    const supabase = await createClient()
    docs = (await listLiveDocuments(supabase)).filter(doc => doc.type === 'guide')
  } catch {
    docs = []
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <p className="section-label mb-4">Guides</p>
      <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
        Ressources utiles
      </h1>
      <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mb-16">
        Des explications concrètes, sans usine à articles. Chaque guide pointe vers une offre ou un cas réel.
      </p>
      {docs.length === 0 ? (
        <p className="text-slate-400">Les premiers guides seront publiés après relecture.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-y border-white/10">
          {docs.map(doc => (
            <li key={doc.id} className="py-8">
              <Link href={doc.path} className="group">
                <h2 className="font-display text-2xl font-semibold mb-2 group-hover:text-[var(--accent)]">
                  {doc.version.title}
                </h2>
                <p className="text-slate-400">{doc.version.excerpt || doc.version.meta_description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
