const tools = [
  'Next.js',
  'React Native',
  'Supabase',
  'n8n',
  'Vercel',
  'Claude',
  'TypeScript',
  'PostgreSQL',
  'Stripe',
  'WordPress',
]

export default function StackStrip() {
  const loop = [...tools, ...tools]

  return (
    <section className="py-10 border-y border-white/10 bg-[var(--navy-soft)]/50">
      <p className="section-label text-center mb-6">Stack & outils</p>
      <div className="marquee">
        <div className="marquee__track px-6">
          {loop.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="text-sm md:text-base font-medium text-slate-400 whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
