export default function Hero() {
  return (
    <section className="pt-32 pb-16 px-6 max-w-6xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Solutions digitales
        </p>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-none mb-6">
          same<span>&apos;</span>z
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed max-w-2xl">
          Cartes identités digitales, outils NFC, sites marchands sur mesure.
          Des solutions simples pour digitaliser votre activité.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {[
            'Carte digitale',
            'Outil NFC',
            'Site marchand',
            'Interface web',
          ].map(tag => (
            <span
              key={tag}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-full text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
