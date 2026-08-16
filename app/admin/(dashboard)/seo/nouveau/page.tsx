export const dynamic = 'force-dynamic'

import CreateSeoForm from '@/components/admin/seo/CreateSeoForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default function NouveauSeoPage() {
  return (
    <div>
      <AdminPageHeader title="Nouveau contenu" description="Une URL, une intention, un brouillon." />
      <CreateSeoForm />
    </div>
  )
}
