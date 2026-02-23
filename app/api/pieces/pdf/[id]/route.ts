import { NextResponse } from 'next/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import PieceDocument from '@/components/admin/PieceDocument'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: piece, error } = await supabase
    .from('pieces')
    .select('*, clients(*), piece_lines(*)')
    .eq('id', id)
    .order('order_index', { referencedTable: 'piece_lines' })
    .single()

  if (error || !piece) {
    return NextResponse.json({ error: 'Pièce introuvable' }, { status: 404 })
  }

  const element = createElement(PieceDocument, {
    number: piece.number,
    type: piece.type,
    status: piece.status,
    date: piece.date,
    due_date: piece.due_date ?? undefined,
    tva_rate: piece.tva_rate,
    notes: piece.notes ?? undefined,
    paid_date: piece.paid_date ?? undefined,
    payment_method: piece.payment_method ?? undefined,
    client: piece.clients ?? null,
    lines: piece.piece_lines ?? [],
  })

  const buffer = await renderToBuffer(
    element as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${piece.number}.pdf"`,
    },
  })
}
