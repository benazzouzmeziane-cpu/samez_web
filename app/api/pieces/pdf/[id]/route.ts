import { NextResponse } from 'next/server'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement, type JSXElementConstructor } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import PieceDocument from '@/components/admin/PieceDocument'

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const role = user.app_metadata?.role
    const isAdmin = isAdminUser(user)
    const isClient = role === 'client'

    if (!isAdmin && !isClient) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Client utilisateur (RLS) — pas de service_role
    const { data: piece, error } = await supabase
      .from('pieces')
      .select('*, clients(*), piece_lines(*)')
      .eq('id', id)
      .order('order_index', { referencedTable: 'piece_lines' })
      .single()

    if (error || !piece) {
      return NextResponse.json({ error: 'Pièce introuvable' }, { status: 404 })
    }

    if (isClient) {
      if (piece.status === 'brouillon') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
      if (!piece.clients || piece.clients.email !== user.email) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
      }
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

    const filename = `${safeFilename(piece.number)}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[pdf]', err)
    return NextResponse.json({ error: 'Erreur génération PDF' }, { status: 500 })
  }
}
