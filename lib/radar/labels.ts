import type { RadarFit, RadarKind, RadarOffer, RadarStatus } from '@/lib/radar/types'

export const KIND_LABELS: Record<RadarKind, string> = {
  creation: 'Création',
  immatriculation: 'Immatriculation',
  cession: 'Cession',
  marche: 'Marché',
}

export const FIT_LABELS: Record<RadarFit, string> = {
  go: 'Go',
  possible: 'Possible',
  nogo: 'No-go',
}

export const STATUS_LABELS: Record<RadarStatus, string> = {
  nouveau: 'Nouveau',
  a_contacter: 'À contacter',
  contacte: 'Contacté',
  converti: 'Converti',
  ecarte: 'Écarté',
}

export const OFFER_LABELS: Record<RadarOffer, string> = {
  kit_lancement: 'Kit lancement',
  automation: 'Automatisation',
  app_metier: 'App métier',
  partenariat: 'Partenariat',
  marche: 'Réponse marché',
  skip: 'Skip',
}

export const FIT_STYLES: Record<RadarFit, string> = {
  go: 'bg-emerald-50 text-emerald-700',
  possible: 'bg-amber-50 text-amber-800',
  nogo: 'bg-slate-100 text-slate-500',
}
