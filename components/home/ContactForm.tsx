'use client'

import { useState } from 'react'
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

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [startedAt] = useState(() => Date.now())

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

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
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-20 px-6 bg-[var(--gray-light)] relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-3">
            Contact
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Parlons de votre projet
          </h2>
          <p className="text-gray-500 mb-10">
            Réponse sous 24h — <a href="mailto:contact@samez.fr" className="hover:text-black transition-colors underline underline-offset-2">contact@samez.fr</a>
          </p>

          {/* Blobs décoratifs */}
          <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-emerald-100/30 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-teal-100/20 blur-3xl pointer-events-none" />

          {status === 'success' ? (
            <div className="p-6 glass-card rounded-2xl">
              <p className="font-medium mb-1">Message envoyé.</p>
              <p className="text-sm text-gray-500">Je vous recontacte sous 24h.</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm underline underline-offset-2 hover:text-gray-600"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom *</label>
                  <input
                    {...register('name')}
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-3 border border-emerald-100/60 bg-white/70 backdrop-blur-sm text-sm rounded-xl outline-none focus:border-[var(--accent)] focus:bg-white transition-all"
                  />
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
                    className="w-full px-4 py-3 border border-emerald-100/60 bg-white/70 backdrop-blur-sm text-sm rounded-xl outline-none focus:border-[var(--accent)] focus:bg-white transition-all"
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
                  className="w-full px-4 py-3 border border-emerald-100/60 bg-white/70 backdrop-blur-sm text-sm rounded-xl outline-none focus:border-[var(--accent)] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder="Décrivez votre projet..."
                  className="w-full px-4 py-3 border border-emerald-100/60 bg-white/70 backdrop-blur-sm text-sm rounded-xl outline-none focus:border-[var(--accent)] focus:bg-white transition-all resize-none"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  {...register('createAccount')}
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  Créer mon compte client pour faciliter mes futurs échanges
                </span>
              </label>

              {/* Honeypot anti-bot: ce champ doit rester vide */}
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
                className="self-start px-8 py-3.5 bg-gradient-to-r from-[var(--accent)] to-emerald-400 text-white text-sm font-medium rounded-full hover:shadow-lg hover:shadow-emerald-200/60 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'sending' ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
