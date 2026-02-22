import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — same'z",
  description: "CGV du site samez.fr — Conditions générales de vente des prestations same'z.",
}

export default function CGVPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
          Juridique
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-10">
          Conditions Générales de Vente
        </h1>

        <div className="space-y-10 text-gray-600 leading-relaxed text-sm">
          {/* Objet */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations entre
              same&apos;z (Benazzouz Meziane, RCS 938 982 220, ci-après « le Prestataire ») et
              toute personne physique ou morale (ci-après « le Client ») souhaitant bénéficier
              des prestations proposées sur le site samez.fr.
            </p>
          </section>

          {/* Prestations */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">2. Prestations</h2>
            <p>
              Le Prestataire propose des services de développement logiciel sur mesure, incluant
              notamment : automatisation de processus, analyse de conversion, développement d&apos;outils
              internes, extensions Chrome et applications métiers.
            </p>
            <p className="mt-3">
              Le périmètre exact des prestations est défini dans le devis validé par le Client.
            </p>
          </section>

          {/* Devis et commande */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">3. Devis et commande</h2>
            <p>
              Toute prestation fait l&apos;objet d&apos;un devis préalable gratuit. Le devis est valable
              30 jours à compter de sa date d&apos;émission. La commande est considérée comme ferme
              et définitive après acceptation écrite du devis par le Client (email ou signature).
            </p>
          </section>

          {/* Tarifs */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">4. Tarifs</h2>
            <p>
              Les prix sont indiqués en euros hors taxes (HT). La TVA applicable est de 20%.
              Les tarifs sont ceux en vigueur au moment de la validation du devis.
            </p>
          </section>

          {/* Paiement */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">5. Modalités de paiement</h2>
            <p>
              Le paiement s&apos;effectue par virement bancaire. Sauf mention contraire sur le devis :
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside">
              <li>Un acompte de 30% est dû à la validation du devis.</li>
              <li>Le solde est dû à la livraison de la prestation.</li>
            </ul>
            <p className="mt-3">
              Les factures sont payables à 30 jours à compter de leur date d&apos;émission.
              Tout retard de paiement entraîne de plein droit des pénalités de retard au taux
              de 3 fois le taux d&apos;intérêt légal, ainsi qu&apos;une indemnité forfaitaire de 40 €
              pour frais de recouvrement (art. L.441-10 du Code de commerce).
            </p>
          </section>

          {/* Délais */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">6. Délais de réalisation</h2>
            <p>
              Les délais de réalisation sont indicatifs et communiqués dans le devis.
              Le Prestataire s&apos;engage à mettre en œuvre tous les moyens nécessaires pour
              respecter les délais convenus. Un retard ne peut donner lieu à aucune pénalité
              ni indemnité.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">7. Propriété intellectuelle</h2>
            <p>
              Le Client devient propriétaire des développements réalisés spécifiquement pour lui
              après paiement intégral de la prestation. Le Prestataire conserve la propriété
              des outils, frameworks et librairies génériques utilisés dans le cadre du projet.
            </p>
            <p className="mt-3">
              Sauf opposition écrite, le Prestataire se réserve le droit de mentionner la
              réalisation dans ses références commerciales.
            </p>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">8. Responsabilité</h2>
            <p>
              Le Prestataire s&apos;engage à apporter tout le soin nécessaire à la réalisation
              des prestations. Sa responsabilité est limitée au montant de la prestation concernée.
              Le Prestataire ne saurait être tenu responsable des dommages indirects
              (perte de chiffre d&apos;affaires, perte de données, etc.).
            </p>
          </section>

          {/* Résiliation */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">9. Résiliation</h2>
            <p>
              Chaque partie peut résilier le contrat en cas de manquement grave de l&apos;autre partie,
              non réparé dans un délai de 15 jours suivant une mise en demeure par email.
              En cas de résiliation par le Client, l&apos;acompte versé reste acquis au Prestataire
              et les travaux réalisés sont facturés au prorata.
            </p>
          </section>

          {/* Confidentialité */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">10. Confidentialité</h2>
            <p>
              Chaque partie s&apos;engage à ne pas divulguer les informations confidentielles
              communiquées par l&apos;autre partie dans le cadre de la prestation.
              Cette obligation de confidentialité perdure pendant 2 ans après la fin de la prestation.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-lg font-semibold text-black mb-4">11. Droit applicable et litiges</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties
              s&apos;engagent à rechercher une solution amiable. À défaut d&apos;accord, les tribunaux
              de Paris seront seuls compétents.
            </p>
          </section>

          {/* Date */}
          <section className="pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Dernière mise à jour : février 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
