'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type PieceLine = {
  id?: string
  description: string
  quantity: number
  unit_price: number
  order_index: number
}

type Client = {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

type PieceData = {
  id?: string
  number: string
  type: 'facture' | 'devis'
  status: string
  date: string
  due_date?: string
  tva_rate: number
  notes?: string
  client_id?: string
  clients?: Client | null
  piece_lines?: PieceLine[]
}

type Props = {
  piece?: PieceData
  clients: Client[]
  mode: 'create' | 'edit'
  initialType?: 'facture' | 'devis'
  initialClientId?: string
}

const emptyLine = (): PieceLine => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  order_index: 0,
})

export default function PieceForm({ piece, clients, mode, initialType, initialClientId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [type, setType] = useState<'facture' | 'devis'>(piece?.type ?? initialType ?? 'facture')
  const [status, setStatus] = useState(piece?.status ?? 'brouillon')
  const [date, setDate] = useState(piece?.date ?? new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(piece?.due_date ?? '')
  const [tvaRate, setTvaRate] = useState(piece?.tva_rate ?? 20)
  const [notes, setNotes] = useState(piece?.notes ?? '')
  const [lines, setLines] = useState<PieceLine[]>(
    piece?.piece_lines?.length ? piece.piece_lines : [emptyLine()]
  )
  const [selectedClientId, setSelectedClientId] = useState(piece?.client_id ?? initialClientId ?? '')
  const [newClient, setNewClient] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [useNewClient, setUseNewClient] = useState(!piece?.client_id && !initialClientId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalHT = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const totalTVA = totalHT * (tvaRate / 100)
  const totalTTC = totalHT + totalTVA

  const updateLine = (index: number, field: keyof PieceLine, value: string | number) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [field]: value, order_index: i } : l
      )
    )
  }

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine(), order_index: prev.length }])

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index))

  const generateNumber = () => {
    const prefix = type === 'facture' ? 'FAC' : 'DEV'
    const year = new Date().getFullYear()
    const rand = String(Math.floor(Math.random() * 900) + 100)
    return `${prefix}-${year}-${rand}`
  }

  const handleSave = async (redirect = true) => {
    setSaving(true)
    setError('')

    try {
      let clientId = selectedClientId

      if (useNewClient) {
        if (!newClient.name.trim()) {
          setError('Le nom du client est requis.')
          setSaving(false)
          return
        }
        const { data: created, error: clientErr } = await supabase
          .from('clients')
          .insert([newClient])
          .select('id')
          .single()

        if (clientErr || !created) {
          setError('Erreur lors de la création du client.')
          setSaving(false)
          return
        }
        clientId = created.id
      }

      // Si le type a changé, adapter le préfixe du numéro (DEV↔FAC)
      let finalNumber = piece?.number ?? generateNumber()
      if (piece?.number && piece.type !== type) {
        const newPrefix = type === 'facture' ? 'FAC' : 'DEV'
        finalNumber = finalNumber.replace(/^(DEV|FAC)/, newPrefix)
      }

      const piecePayload = {
        type,
        status,
        date,
        due_date: dueDate || null,
        tva_rate: tvaRate,
        notes: notes || null,
        client_id: clientId || null,
        number: finalNumber,
      }

      let pieceId = piece?.id

      if (mode === 'create') {
        const { data: created, error: pieceErr } = await supabase
          .from('pieces')
          .insert([piecePayload])
          .select('id')
          .single()

        if (pieceErr || !created) {
          setError('Erreur lors de la création de la pièce.')
          setSaving(false)
          return
        }
        pieceId = created.id
      } else {
        const { error: pieceErr } = await supabase
          .from('pieces')
          .update(piecePayload)
          .eq('id', piece!.id)

        if (pieceErr) {
          setError('Erreur lors de la mise à jour.')
          setSaving(false)
          return
        }
        await supabase.from('piece_lines').delete().eq('piece_id', piece!.id)
      }

      const linePayload = lines
        .filter((l) => l.description.trim())
        .map((l, i) => ({
          piece_id: pieceId,
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          order_index: i,
        }))

      if (linePayload.length > 0) {
        const { error: linesErr } = await supabase.from('piece_lines').insert(linePayload)
        if (linesErr) {
          setError('Erreur lors de la sauvegarde des lignes.')
          setSaving(false)
          return
        }
      }

      if (redirect) router.push(`/admin/pieces/${pieceId}`)
      else router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Informations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'facture' | 'devis')}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] bg-white"
          >
            <option value="facture">Facture</option>
            <option value="devis">Devis</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Statut</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] bg-white"
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoyée">Envoyée</option>
            <option value="payée">Payée</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Échéance</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>
      </div>

      {/* Client */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Client</h2>
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setUseNewClient(false)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              !useNewClient ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-gray-200 text-gray-500 hover:border-[var(--accent)]'
            }`}
          >
            Client existant
          </button>
          <button
            type="button"
            onClick={() => setUseNewClient(true)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              useNewClient ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-gray-200 text-gray-500 hover:border-[var(--accent)]'
            }`}
          >
            Nouveau client
          </button>
        </div>

        {!useNewClient ? (
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full max-w-sm px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] bg-white"
          >
            <option value="">— Sélectionner un client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {(
              [
                { field: 'name', label: 'Nom *', placeholder: 'Nom du client' },
                { field: 'email', label: 'Email', placeholder: 'email@client.fr' },
                { field: 'phone', label: 'Téléphone', placeholder: '06 xx xx xx xx' },
                { field: 'address', label: 'Adresse', placeholder: '1 rue de la paix, 75001 Paris' },
              ] as const
            ).map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                <input
                  value={newClient[field] ?? ''}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lignes de prestation */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Prestations</h2>

        <div className="mb-2 grid grid-cols-12 gap-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-right">Qté</div>
          <div className="col-span-2 text-right">Prix unit. HT</div>
          <div className="col-span-1 text-right">Total HT</div>
          <div className="col-span-1" />
        </div>

        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-6">
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, 'description', e.target.value)}
                  placeholder="Description de la prestation"
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] text-right"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] text-right"
                />
              </div>
              <div className="col-span-1 text-right text-sm font-medium pr-2">
                {(line.quantity * line.unit_price).toFixed(2)} €
              </div>
              <div className="col-span-1 text-right">
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-4 text-sm text-gray-400 hover:text-black transition-colors underline underline-offset-2"
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Totaux */}
      <div className="flex justify-end">
        <div className="w-72 p-5 bg-[#fafafa] rounded-xl border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total HT</span>
            <span className="font-medium">{totalHT.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">
              TVA (
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tvaRate}
                onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)}
                className="w-10 text-center border-b border-gray-300 outline-none focus:border-black bg-transparent text-sm"
              />
              %)
            </span>
            <span>{totalTVA.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2 mt-2">
            <span>Total TTC</span>
            <span>{totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Notes / Conditions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Conditions de paiement, mentions légales..."
          className="w-full px-3 py-2.5 border border-gray-200 text-sm rounded-lg outline-none focus:border-[var(--accent)] resize-none bg-white"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-6 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : mode === 'create' ? 'Créer la pièce' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
