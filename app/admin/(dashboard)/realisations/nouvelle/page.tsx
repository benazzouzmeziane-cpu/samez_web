export const dynamic = 'force-dynamic'

import RealisationForm from '@/components/admin/RealisationForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default function NouvelleRealisationPage() {
  return (
    <div>
      <AdminPageHeader title="Nouvelle réalisation" description="Ajouter un projet au portfolio." />
      <RealisationForm mode="create" />
    </div>
  )
}
