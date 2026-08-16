export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import RedirectForm from '@/components/admin/seo/RedirectForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

export default async function SeoRedirectsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('seo_redirects').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <AdminPageHeader
        title="Redirections"
        description="Conservées lors d’un changement de slug."
      />
      <RedirectForm />
      {(data ?? []).length === 0 ? (
        <div className="mt-8">
          <AdminEmptyState title="Aucune redirection" body="Elles apparaîtront ici après un changement de slug." />
        </div>
      ) : (
        <ul className="mt-8 rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          {(data ?? []).map((item) => (
            <li key={item.id} className="text-sm px-5 py-3 border-b border-black/[0.06] last:border-b-0 font-mono">
              {item.from_path} → {item.to_path}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
