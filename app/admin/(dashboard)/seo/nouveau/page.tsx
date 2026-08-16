export const dynamic = 'force-dynamic'

import CreateSeoForm from '@/components/admin/seo/CreateSeoForm'

export default function NouveauSeoPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Nouveau contenu SEO</h1>
      <p className="text-sm text-gray-500 mb-10">Une URL, une intention, un brouillon.</p>
      <CreateSeoForm />
    </div>
  )
}
