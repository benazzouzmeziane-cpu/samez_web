'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message trop court (10 caractères min.)'),
  createAccount: z.boolean().optional(),
  website: z.string().optional(),
  startedAt: z.number().optional(),
})

type FormData = z.infer<typeof schema>

type SuccessKind = 'message' | 'message_and_account' | 'message_account_failed'

const inputClass =
  'w-full px-4 py-3 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent)] transition-[border-color,background-color] duration-[var(--duration-ui)] ease'

function ContactFormInner() {
  const searchParams = useSearchParams()
  const wantAccount = searchParams.get('compte') === '1'

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [successKind, setSuccessKind] = useState<SuccessKind>('message')
  const [startedAt] = useState(() => Date.now())

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      createAccount: wantAccount,
      message: wantAccount
        ? 'Bonjour, je souhaite créer mon espace client pour suivre mes devis et factures.'
        : '',
    },
  })

  useEffect(() => {
    if (wantAccount) {
      setValue('createAccount', true)
      setValue(
        'message',
        'Bonjour, je souhaite créer mon espace client pour suivre mes devis et factures.'
      )
    }
  }, [wantAccount, setValue])

  const onSubmit = async (data: FormData) => {
    setStatus('sending')
    try {
      const payload = {
        ...data,
        startedAt,
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()

      const result = await res.json().catch(() => ({}))
      if (data.createAccount) {
        setSuccessKind(result.accountCreated ? 'message_and_account' : 'message_account_failed')
      } else {
        setSuccessKind('message')
      }

      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">
            Contact
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-3">
            {wantAccount ? 'Créer mon espace client' : 'Parlons de votre projet'}
          </h2>
          <p className="text-gray-500 mb-12 leading-relaxed">
            {wantAccount ? (
              <>
                Remplissez le formulaire — un email vous permettra de définir votre mot de passe.
                {' '}Réponse aussi à{' '}
                <a href="mailto:contact@samez.fr" className="underline underline-offset-2 link-quiet text-gray-700">
                  contact@samez.fr
                </a>
              </>
            ) : (
              <>
                Réponse sous 24h —{' '}
                <a href="mailto:contact@samez.fr" className="underline underline-offset-2 link-quiet text-gray-700">
                  contact@samez.fr
                </a>
              </>
            )}
          </p>

          {status === 'success' ? (
            <div className="py-6 border-y border-black/[0.06]">
              <p className="font-display text-lg font-semibold mb-2">Message envoyé.</p>
              {successKind === 'message_and_account' && (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Un email vient de vous être envoyé pour créer votre mot de passe et accéder à l&apos;espace client.
                  Vérifiez aussi vos indésirables.
                </p>
              )}
              {successKind === 'message_account_failed' && (
                <p className="text-sm text-gray-500 leading-relaxed">
                  Votre message est bien reçu. L&apos;accès espace client n&apos;a pas pu être créé automatiquement —
                  nous vous recontactons sous 24h, ou écrivez à{' '}
                  <a href="mailto:contact@samez.fr" className="underline underline-offset-2">contact@samez.fr</a>.
                </p>
              )}
              {successKind === 'message' && (
                <p className="text-sm text-gray-500">Je vous recontacte sous 24h.</p>
              )}
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-5 text-sm underline underline-offset-2 link-quiet text-gray-600"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom *</label>
                  <input {...register('name')} placeholder="Jean Dupont" className={inputClass} />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="jean@exemple.fr"
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Téléphone</label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="06 xx xx xx xx"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder="Décrivez votre projet..."
                  className={`${inputClass} resize-none`}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>

              <label
                id="creer-compte"
                className={`flex items-start gap-3 cursor-pointer select-none p-4 rounded-lg border transition-[border-color,background-color] duration-[var(--duration-ui)] ease ${
                  wantAccount
                    ? 'border-[var(--accent)] bg-emerald-50/60'
                    : 'border-black/[0.08] bg-white'
                }`}
              >
                <input
                  {...register('createAccount')}
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Créer mon espace client</span>
                  <span className="block mt-1 text-xs text-gray-500 leading-relaxed">
                    Cochez cette case pour recevoir un email et définir votre mot de passe, puis accéder à{' '}
                    <span className="text-[var(--accent)]">samez.fr/espace-client</span>.
                  </span>
                </span>
              </label>

              <input
                {...register('website')}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              {status === 'error' && (
                <p className="text-sm text-red-500">
                  Une erreur est survenue. Réessayez ou écrivez directement à contact@samez.fr
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn btn-primary self-start disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'sending'
                  ? 'Envoi...'
                  : wantAccount
                    ? 'Créer mon compte'
                    : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

export default function ContactForm() {
  return (
    <Suspense
      fallback={
        <section id="contact" className="py-24 px-6">
          <div className="max-w-xl">
            <div className="h-8 w-48 bg-gray-100 rounded mb-4" />
            <div className="h-64 bg-gray-50 rounded-lg" />
          </div>
        </section>
      }
    >
      <ContactFormInner />
    </Suspense>
  )
}
