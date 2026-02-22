import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Mentions légales — same'z",
  description: "Mentions légales du site samez.fr",
}

export default function MentionsLegalesPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Juridique
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
          Mentions légales
        </h1>

        <div className="space-y-10 text-gray-600 leading-relaxed text-sm">
          {/* Éditeur */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">1. Éditeur du site</h2>
            <p>
              Le site <strong>samez.fr</strong> est édité par :
            </p>
            <ul className="mt-3 space-y-1.5">
              <li><strong>Nom :</strong> Benazzouz Meziane</li>
              <li><strong>Statut :</strong> Entrepreneur individuel</li>
              <li><strong>Nom commercial :</strong> same&apos;z</li>
              <li><strong>RCS :</strong> 938 982 220 R.C.S. Paris</li>
              <li><strong>Siège social :</strong> 200 rue de la Croix Nivert, 75015 Paris (domiciliation HELLODOM)</li>
              <li><strong>Email :</strong> <a href="mailto:contact@samez.fr" className="underline underline-offset-2 hover:text-black transition-colors">contact@samez.fr</a></li>
              <li><strong>Téléphone :</strong> <a href="tel:0752087416" className="underline underline-offset-2 hover:text-black transition-colors">07 52 08 74 16</a></li>
            </ul>
          </section>

          {/* Directeur de publication */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">2. Directeur de la publication</h2>
            <p>Benazzouz Meziane — <a href="mailto:contact@samez.fr" className="underline underline-offset-2 hover:text-black transition-colors">contact@samez.fr</a></p>
          </section>

          {/* Hébergeur */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">3. Hébergement</h2>
            <ul className="space-y-1.5">
              <li><strong>Hébergeur :</strong> Vercel Inc.</li>
              <li><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
              <li><strong>Site :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-black transition-colors">vercel.com</a></li>
            </ul>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">4. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site samez.fr (textes, images, graphismes, logo, icônes, logiciels, etc.)
              est la propriété exclusive de same&apos;z ou de ses partenaires. Toute reproduction, représentation,
              modification, publication ou adaptation de tout ou partie du contenu du site, quel que soit le moyen
              ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable de same&apos;z.
            </p>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">5. Limitation de responsabilité</h2>
            <p>
              same&apos;z s&apos;efforce de fournir des informations aussi précises que possible sur le site.
              Toutefois, same&apos;z ne pourra être tenu responsable des omissions, des inexactitudes et des
              carences dans la mise à jour, qu&apos;elles soient de son fait ou du fait des tiers partenaires
              qui lui fournissent ces informations.
            </p>
          </section>

          {/* Données personnelles */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">6. Données personnelles</h2>
            <p>
              Les informations recueillies via le formulaire de contact sont enregistrées dans un fichier
              informatisé pour le traitement de vos demandes. Elles sont conservées pendant 3 ans et sont
              destinées uniquement à same&apos;z.
            </p>
            <p className="mt-3">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
              Informatique et Libertés, vous pouvez exercer votre droit d&apos;accès, de rectification,
              de suppression et d&apos;opposition en nous contactant à{' '}
              <a href="mailto:contact@samez.fr" className="underline underline-offset-2 hover:text-black transition-colors">
                contact@samez.fr
              </a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">7. Cookies</h2>
            <p>
              Le site samez.fr utilise des cookies strictement nécessaires au fonctionnement du site
              (authentification, session). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">8. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              les tribunaux de Paris seront seuls compétents.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
