export const dynamic = 'force-dynamic'

import CreateSeoForm from '@/components/admin/seo/CreateSeoForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default function NouveauSeoPage() {
  return (
    <div>
      <AdminPageHeader
        title="Demander une page"
        description="Donnez la consigne à l’agent. Il crée un brouillon à relire, jamais une page publiée."
      />
      <CreateSeoForm />
    </div>
  )
}
