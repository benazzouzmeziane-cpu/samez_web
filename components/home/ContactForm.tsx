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
})

type FormData = z.infer<typeof schema>

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-20 px-6 bg-[#f5f5f7]">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Contact
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Parlons de votre projet
          </h2>
          <p className="text-gray-500 mb-10">
            Réponse sous 24h — <a href="mailto:presta@samez.fr" className="hover:text-black transition-colors underline underline-offset-2">presta@samez.fr</a>
          </p>

          {status === 'success' ? (
            <div className="p-6 border border-gray-200 bg-white rounded-sm">
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
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-sm outline-none focus:border-black transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-200 bg-white text-sm outline-none focus:border-black transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-sm outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  placeholder="Décrivez votre projet..."
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-sm outline-none focus:border-black transition-colors resize-none"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>
                )}
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-500">
                  Une erreur est survenue. Réessayez ou écrivez directement à presta@samez.fr
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="self-start px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
