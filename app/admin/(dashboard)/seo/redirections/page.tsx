export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import RedirectForm from '@/components/admin/seo/RedirectForm'

export default async function SeoRedirectsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('seo_redirects').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Redirections 301</h1>
      <p className="text-sm text-gray-500 mb-8">Conservées lors d’un changement de slug.</p>
      <RedirectForm />
      <ul className="mt-8 space-y-2">
        {(data ?? []).map(item => (
          <li key={item.id} className="text-sm p-3 bg-[#fafafa] rounded-lg">
            {item.from_path} → {item.to_path}
          </li>
        ))}
      </ul>
    </div>
  )
}
