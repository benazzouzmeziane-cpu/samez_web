import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
    backgroundColor: '#ffffff',
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  logo: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
  },
  headerRight: {
    textAlign: 'right',
  },
  headerLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerValue: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 1,
  },
  titleSection: {
    marginBottom: 36,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
  },
  titleType: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titleNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  col: {
    width: '46%',
  },
  colLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  colValue: {
    fontSize: 10,
    color: '#111827',
    marginBottom: 2,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  col60: { width: '60%' },
  col15: { width: '15%', textAlign: 'right' },
  col25: { width: '25%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 200,
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
    color: '#111827',
  },
  totalsTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },
  totalsTTCLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  totalsTTCValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  notes: {
    marginTop: 36,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 56,
    right: 56,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
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
  date: string
  due_date?: string
  tva_rate: number
  notes?: string
  client?: Client | null
  lines: Line[]
}

export default function PieceDocument({
  number,
  type,
  date,
  due_date,
  tva_rate,
  notes,
  client,
  lines,
}: PieceDocProps) {
  const totalHT = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const totalTVA = totalHT * (tva_rate / 100)
  const totalTTC = totalHT + totalTVA

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>same&apos;z</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Email</Text>
            <Text style={styles.headerValue}>contact@samez.fr</Text>
            <Text style={styles.headerLabel}>Téléphone</Text>
            <Text style={styles.headerValue}>07 52 08 74 16</Text>
          </View>
        </View>

        {/* Titre */}
        <View style={styles.titleSection}>
          <Text style={styles.titleType}>{type}</Text>
          <Text style={styles.titleNumber}>{number}</Text>
        </View>

        {/* Client & Dates */}
        <View style={styles.twoCol}>
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
          <View style={styles.col}>
            <Text style={styles.colLabel}>Date</Text>
            <Text style={styles.colValue}>{fmt(date)}</Text>
            {due_date && (
              <>
                <Text style={[styles.colLabel, { marginTop: 8 }]}>Échéance</Text>
                <Text style={styles.colValue}>{fmt(due_date)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Lignes */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.col60]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.col15]}>Qté</Text>
          <Text style={[styles.tableHeaderCell, styles.col15]}>PU HT</Text>
          <Text style={[styles.tableHeaderCell, styles.col25]}>Total HT</Text>
        </View>

        {lines.map((line, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[{ fontSize: 10 }, styles.col60]}>{line.description}</Text>
            <Text style={[{ fontSize: 10 }, styles.col15]}>{line.quantity}</Text>
            <Text style={[{ fontSize: 10 }, styles.col15]}>{line.unit_price.toFixed(2)} €</Text>
            <Text style={[{ fontSize: 10 }, styles.col25]}>
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

        {/* Footer */}
        <Text style={styles.footer}>same&apos;z — contact@samez.fr — 07 52 08 74 16</Text>
      </Page>
    </Document>
  )
}
