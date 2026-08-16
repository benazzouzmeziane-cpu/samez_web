import { newBlockId } from '@/lib/seo/paths'
import type { ContentBlock } from '@/lib/seo/schema'

export function createBlock(type: ContentBlock['type']): ContentBlock {
  const id = newBlockId()
  switch (type) {
    case 'hero':
      return { id, type, heading: 'Titre de la page', subheading: '', eyebrow: '' }
    case 'answer':
      return { id, type, text: 'Réponse directe en deux ou trois phrases.' }
    case 'markdown':
      return { id, type, markdown: '## Sous-titre\n\nDéveloppez le sujet ici.' }
    case 'list':
      return { id, type, title: 'Points clés', items: ['Premier point', 'Deuxième point'], ordered: false }
    case 'steps':
      return {
        id,
        type,
        title: 'Déroulement',
        items: [
          { title: 'Cadrage', text: 'On clarifie le besoin et le périmètre.' },
          { title: 'Livraison', text: 'On construit, on teste, on met en production.' },
        ],
      }
    case 'comparison':
      return {
        id,
        type,
        title: 'Comparaison',
        columns: ['Critère', 'same’z', 'Alternative'],
        rows: [{ cells: ['Propriété du code', 'Oui', 'Variable'] }],
      }
    case 'stats':
      return { id, type, items: [{ value: '45 min', label: 'Diagnostic' }] }
    case 'quote':
      return { id, type, text: 'Citation sourcée uniquement.', author: '' }
    case 'media':
      return { id, type, url: '', alt: 'Description de l’image' }
    case 'faq':
      return {
        id,
        type,
        items: [{ question: 'Par où commencer ?', answer: 'Un diagnostic de 45 minutes suffit à prioriser.' }],
      }
    case 'sources':
      return { id, type, items: [{ label: 'À préciser', url: '' }] }
    case 'cta':
      return {
        id,
        type,
        heading: 'Un projet en tête ?',
        text: 'On regarde vos process et on priorise.',
        href: '/reserver',
        label: 'Réserver 45 min',
      }
    case 'related':
      return { id, type, title: 'À lire aussi', paths: ['/services'] }
  }
}
