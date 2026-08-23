import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { createCrmClient } from '@/lib/admin/crm-actions'
import { CLIENT_STAGES, STAGE_LABELS } from '@/lib/admin/crm'

const field =
  'w-full px-3 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent-dark)]'

export default function NouveauClientPage() {
  return (
    <div>
      <AdminPageHeader title="Nouveau compte" description="Prospect ou client — une fiche, tout l’historique ensuite." />
      <form action={createCrmClient} className="max-w-xl space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
        <label className="block text-xs text-slate-500">
          Nom
          <input name="name" required className={`${field} mt-1.5`} />
        </label>
        <label className="block text-xs text-slate-500">
          Société
          <input name="company" className={`${field} mt-1.5`} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-500">
            Email
            <input name="email" type="email" className={`${field} mt-1.5`} />
          </label>
          <label className="block text-xs text-slate-500">
            Téléphone
            <input name="phone" className={`${field} mt-1.5`} />
          </label>
        </div>
        <label className="block text-xs text-slate-500">
          Adresse
          <input name="address" className={`${field} mt-1.5`} />
        </label>
        <label className="block text-xs text-slate-500">
          Étape
          <select name="stage" defaultValue="prospect" className={`${field} mt-1.5`}>
            {CLIENT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary !py-2.5 !px-4">
          Créer la fiche
        </button>
      </form>
    </div>
  )
}
