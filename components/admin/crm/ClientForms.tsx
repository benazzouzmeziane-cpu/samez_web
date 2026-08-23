import {
  addClientActivity,
  cancelClientActivity,
  completeClientActivity,
  sendFollowUpEmail,
  updateClientStage,
  updateCrmClient,
} from '@/lib/admin/crm-actions'
import { CLIENT_STAGES, KIND_LABELS, STAGE_LABELS, type CrmActivity, type CrmClient } from '@/lib/admin/crm'
import { formatDateFr, formatDateShort } from '@/lib/client/format'
import { todayParis } from '@/lib/admin/crm'

const field =
  'w-full px-3 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent-dark)]'

export function ClientIdentityForm({ client }: { client: CrmClient }) {
  return (
    <form action={updateCrmClient} className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6 space-y-4">
      <input type="hidden" name="id" value={client.id} />
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Identité</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs text-slate-500">
          Nom
          <input name="name" required defaultValue={client.name} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-xs text-slate-500">
          Société
          <input name="company" defaultValue={client.company ?? ''} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-xs text-slate-500">
          Email
          <input name="email" type="email" defaultValue={client.email ?? ''} className={`${field} mt-1.5`} />
        </label>
        <label className="block text-xs text-slate-500">
          Téléphone
          <input name="phone" defaultValue={client.phone ?? ''} className={`${field} mt-1.5`} />
        </label>
      </div>
      <label className="block text-xs text-slate-500">
        Adresse
        <input name="address" defaultValue={client.address ?? ''} className={`${field} mt-1.5`} />
      </label>
      <button type="submit" className="btn btn-primary !py-2.5 !px-4">
        Enregistrer
      </button>
    </form>
  )
}

export function ClientStageForm({ client }: { client: CrmClient }) {
  return (
    <form action={updateClientStage} className="rounded-2xl border border-black/[0.06] bg-white p-5">
      <input type="hidden" name="id" value={client.id} />
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Pipeline</p>
      <div className="flex flex-wrap gap-2">
        {CLIENT_STAGES.map((stage) => (
          <button
            key={stage}
            type="submit"
            name="stage"
            value={stage}
            className={`client-press px-3 py-1.5 rounded-full text-xs font-medium border ${
              client.stage === stage
                ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
                : 'border-black/[0.08] text-slate-600 bg-white'
            }`}
          >
            {STAGE_LABELS[stage]}
          </button>
        ))}
      </div>
    </form>
  )
}

export function AddActivityForm({ clientId }: { clientId: string }) {
  return (
    <form action={addClientActivity} className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
      <input type="hidden" name="client_id" value={clientId} />
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Nouvelle entrée</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <select name="kind" defaultValue="relance" className={field}>
          <option value="relance">Relance</option>
          <option value="appel">Appel</option>
          <option value="note">Note</option>
          <option value="email">Email (journal)</option>
        </select>
        <input type="date" name="due_at" defaultValue={todayParis()} className={field} />
      </div>
      <input name="title" required placeholder="Titre — ex. Relancer le devis" className={field} />
      <textarea name="body" rows={3} placeholder="Détail interne" className={field} />
      <button type="submit" className="btn btn-on-light !py-2.5 !px-4">
        Ajouter
      </button>
    </form>
  )
}

export function SendEmailForm({ client }: { client: CrmClient }) {
  if (!client.email) return null
  return (
    <form action={sendFollowUpEmail} className="rounded-2xl border border-black/[0.06] bg-white p-5 space-y-3">
      <input type="hidden" name="client_id" value={client.id} />
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Relancer par email</p>
      <input
        name="subject"
        required
        defaultValue={`same'z — suite de notre échange`}
        className={field}
      />
      <textarea
        name="body"
        required
        rows={5}
        defaultValue={`J’espère que vous allez bien.\n\nJe me permets de revenir vers vous au sujet de notre échange. Dites-moi si vous souhaitez qu’on avance, ou un créneau pour en reparler.\n\nBien à vous,\nsame'z`}
        className={field}
      />
      <button type="submit" className="btn btn-primary !py-2.5 !px-4">
        Envoyer à {client.email}
      </button>
    </form>
  )
}

export function ActivityTimeline({
  clientId,
  activities,
}: {
  clientId: string
  activities: CrmActivity[]
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">Rien dans le journal pour l’instant.</p>
  }

  return (
    <ul className="space-y-3">
      {activities.map((item) => (
        <li key={item.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-slate-500">{KIND_LABELS[item.kind]}</span>
                {item.status === 'ouverte' && item.due_at && (
                  <span
                    className={`text-[11px] ${
                      item.due_at < todayParis() ? 'text-orange-600 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {item.due_at < todayParis() ? 'En retard · ' : 'Pour le '}
                    {formatDateShort(item.due_at)}
                  </span>
                )}
                {item.status !== 'ouverte' && (
                  <span className="text-[11px] text-slate-400">{item.status === 'faite' ? 'Faite' : 'Annulée'}</span>
                )}
              </div>
              <p className="text-sm font-medium">{item.title}</p>
              {item.body && <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{item.body}</p>}
              <p className="text-[11px] text-slate-400 mt-2">{formatDateFr(item.created_at)}</p>
            </div>
            {item.status === 'ouverte' && (
              <div className="flex gap-2 shrink-0">
                <form action={completeClientActivity}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="client_id" value={clientId} />
                  <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                    Fait
                  </button>
                </form>
                <form action={cancelClientActivity}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="client_id" value={clientId} />
                  <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full text-slate-400">
                    Annuler
                  </button>
                </form>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
