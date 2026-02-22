import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendContactEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  createAccount: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createServiceClient()
    const { error } = await supabase.from('contacts').insert([{
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    }])

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Créer le compte client si demandé
    if (data.createAccount) {
      const { error: clientError } = await supabase.from('clients').upsert(
        [{
          name: data.name,
          email: data.email,
          phone: data.phone || null,
        }],
        { onConflict: 'email' }
      )
      if (clientError) {
        console.error('Client creation error (non-blocking):', clientError)
      }
    }

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    try {
      await sendContactEmail(data)
    } catch (emailError) {
      console.error('Email error (non-blocking):', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 })
    }
    console.error('Contact API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
