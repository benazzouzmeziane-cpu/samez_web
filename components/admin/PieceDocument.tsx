import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const ACCENT = '#059669'
const ACCENT_LIGHT = '#d1fae5'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 80,
    paddingHorizontal: 0,
  },
  // ── Bandeau accent en haut ──
  accentBar: {
    height: 6,
    backgroundColor: ACCENT,
  },
  content: {
    paddingHorizontal: 52,
    paddingTop: 36,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  logoBlock: {},
  logo: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    color: '#111827',
  },
  logoSub: {
    fontSize: 8,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  // ── Badge type ──
  typeBadge: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  typeBadgeInner: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // ── Numéro & date ──
  titleSection: {
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    color: '#111827',
  },
  titleMeta: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  // ── 2 colonnes (émetteur / destinataire) ──
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  col: {
    width: '46%',
  },
  colLabel: {
    fontSize: 7,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  colValue: {
    fontSize: 9.5,
    color: '#374151',
    marginBottom: 2,
    lineHeight: 1.5,
  },
  // ── Table ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  col55: { width: '55%' },
  col15: { width: '15%', textAlign: 'right' },
  col30: { width: '30%', textAlign: 'right' },
  // ── Totaux ──
  totalsSection: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 220,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 14,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: 9,
    color: '#374151',
  },
  totalsTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: ACCENT,
  },
  totalsTTCLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalsTTCValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
  },
  // ── Notes ──
  notes: {
    marginTop: 28,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 7,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 8.5,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  // ── Mention payée ──
  paidBanner: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ACCENT,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  paidText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  paidDetail: {
    fontSize: 8,
    color: '#047857',
    marginTop: 3,
    textAlign: 'center' as const,
  },
  // ── Conditions légales ──
  legalSection: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legalLabel: {
    fontSize: 7,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  legalText: {
    fontSize: 7,
    color: '#9ca3af',
    lineHeight: 1.6,
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerBar: {
    height: 4,
    backgroundColor: ACCENT,
  },
  footerContent: {
    paddingHorizontal: 52,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  footerAccent: {
    fontSize: 7,
    color: ACCENT,
    fontFamily: 'Helvetica-Bold',
  },
})

type Line = {
  description: string
  quantity: number
  unit_price: number
}

type Client = {
  name: string
  email?: string
  phone?: string
  address?: string
}

type PieceDocProps = {
  number: string
  type: 'facture' | 'devis'
  status: string
  date: string
  due_date?: string
  tva_rate: number
  notes?: string
  paid_date?: string
  payment_method?: string
  client?: Client | null
  lines: Line[]
}

export default function PieceDocument({
  number,
  type,
  status,
  date,
  due_date,
  tva_rate,
  notes,
  paid_date,
  payment_method,
  client,
  lines,
}: PieceDocProps) {
  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const totalTVA = totalHT * (tva_rate / 100)
  const totalTTC = totalHT + totalTVA

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const isDevis = type === 'devis'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Bandeau accent */}
        <View style={styles.accentBar} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBlock}>
              <Text style={styles.logo}>same&apos;z</Text>
              <Text style={styles.logoSub}>Solutions logicielles sur mesure</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Benazzouz Meziane</Text>
              <Text style={styles.companyDetail}>Entrepreneur individuel</Text>
              <Text style={styles.companyDetail}>RCS Paris 938 982 220</Text>
              <Text style={styles.companyDetail}>N° TVA : FR33 938982220</Text>
              <Text style={styles.companyDetail}>200 rue de la Croix Nivert</Text>
              <Text style={styles.companyDetail}>75015 Paris</Text>
            </View>
          </View>

          {/* Badge type */}
          <View style={styles.typeBadge}>
            <View style={styles.typeBadgeInner}>
              <Text style={styles.typeBadgeText}>
                {isDevis ? 'Devis' : 'Facture'}
              </Text>
            </View>
          </View>

          {/* Numéro & méta */}
          <View style={styles.titleSection}>
            <Text style={styles.titleNumber}>{number}</Text>
            <Text style={styles.titleMeta}>
              Émis le {fmt(date)}
              {due_date ? ` — Échéance le ${fmt(due_date)}` : ''}
            </Text>
          </View>

          {/* Émetteur & Destinataire */}
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Émetteur</Text>
              <Text style={styles.colValue}>same&apos;z — Benazzouz Meziane</Text>
              <Text style={styles.colValue}>200 rue de la Croix Nivert, 75015 Paris</Text>
              <Text style={styles.colValue}>contact@samez.fr</Text>
              <Text style={styles.colValue}>07 52 08 74 16</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.colLabel}>Destinataire</Text>
              {client ? (
                <>
                  <Text style={styles.colValue}>{client.name}</Text>
                  {client.email && <Text style={styles.colValue}>{client.email}</Text>}
                  {client.phone && <Text style={styles.colValue}>{client.phone}</Text>}
                  {client.address && <Text style={styles.colValue}>{client.address}</Text>}
                </>
              ) : (
                <Text style={styles.colValue}>—</Text>
              )}
            </View>
          </View>

          {/* Table */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col55]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.col15]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.col15]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderCell, styles.col30]}>Total HT</Text>
          </View>

          {lines.map((line, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[{ fontSize: 9.5 }, styles.col55]}>{line.description}</Text>
              <Text style={[{ fontSize: 9.5 }, styles.col15]}>{line.quantity}</Text>
              <Text style={[{ fontSize: 9.5 }, styles.col15]}>{line.unit_price.toFixed(2)} €</Text>
              <Text style={[{ fontSize: 9.5, fontFamily: 'Helvetica-Bold' }, styles.col30]}>
                {(line.quantity * line.unit_price).toFixed(2)} €
              </Text>
            </View>
          ))}

          {/* Totaux */}
          <View style={styles.totalsSection}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total HT</Text>
                <Text style={styles.totalsValue}>{totalHT.toFixed(2)} €</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>TVA ({tva_rate}%)</Text>
                <Text style={styles.totalsValue}>{totalTVA.toFixed(2)} €</Text>
              </View>
              <View style={styles.totalsTTCRow}>
                <Text style={styles.totalsTTCLabel}>Total TTC</Text>
                <Text style={styles.totalsTTCValue}>{totalTTC.toFixed(2)} €</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          {notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}

          {/* Bandeau acquittée — factures payées uniquement */}
          {!isDevis && status === 'payée' && (
            <View style={styles.paidBanner}>
              <View>
                <Text style={styles.paidText}>Facture acquittée</Text>
                <Text style={styles.paidDetail}>
                  {paid_date ? `Réglée le ${fmt(paid_date)}` : 'Réglée'}
                  {payment_method ? ` par ${payment_method}` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Conditions légales */}
          <View style={styles.legalSection}>
            <Text style={styles.legalLabel}>
              {isDevis ? 'Conditions du devis' : status === 'payée' ? 'Informations légales' : 'Conditions de paiement'}
            </Text>
            {isDevis ? (
              <>
                <Text style={styles.legalText}>
                  Devis valable 30 jours à compter de sa date d&apos;émission.
                </Text>
                <Text style={styles.legalText}>
                  Un acompte de 30% du montant TTC est demandé à la signature du devis.
                </Text>
                <Text style={styles.legalText}>
                  Bon pour accord — Date et signature du client :
                </Text>
              </>
            ) : status === 'payée' ? (
              <>
                <Text style={styles.legalText}>
                  En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d&apos;intérêt légal
                  seront appliquées, ainsi qu&apos;une indemnité forfaitaire de recouvrement de 40 €
                  (articles L.441-10 et D.441-5 du Code de commerce).
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.legalText}>
                  Paiement par virement bancaire à réception de la facture, sauf accord contraire.
                </Text>
                <Text style={styles.legalText}>
                  En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d&apos;intérêt légal
                  seront appliquées, ainsi qu&apos;une indemnité forfaitaire de recouvrement de 40 €
                  (articles L.441-10 et D.441-5 du Code de commerce).
                </Text>
                <Text style={styles.legalText}>
                  Pas d&apos;escompte en cas de paiement anticipé.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerBar} />
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              same&apos;z — Benazzouz Meziane — EI — RCS Paris 938 982 220 — TVA FR33 938982220
            </Text>
            <Text style={styles.footerAccent}>
              samez.fr
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
