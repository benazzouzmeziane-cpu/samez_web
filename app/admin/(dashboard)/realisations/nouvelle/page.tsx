import RealisationForm from '@/components/admin/RealisationForm'

export default function NouvelleRealisationPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Nouvelle réalisation</h1>
      <p className="text-sm text-gray-500 mb-10">Ajouter un projet au portfolio</p>
      <RealisationForm mode="create" />
    </div>
  )
}
