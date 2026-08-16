import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { generationBriefSchema } from '@/lib/seo/schema'
import { generateSeoDocument, PROMPT_VERSION, resolveNimModel } from '@/lib/ai/nvidia-nim'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = generationBriefSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Brief invalide' }, { status: 400 })
  }

  const runInsert = await supabase
    .from('seo_generation_runs')
    .insert({
      document_id: parsed.data.documentId || null,
      model: resolveNimModel(),
      prompt_version: PROMPT_VERSION,
      input: parsed.data,
      created_by: user.id,
    })
    .select('id')
    .single()

  try {
    const result = await generateSeoDocument(parsed.data)
    if (runInsert.data?.id) {
      await supabase
        .from('seo_generation_runs')
        .update({
          output: result.document,
          prompt_tokens: result.usage.prompt,
          completion_tokens: result.usage.completion,
          model: result.model,
        })
        .eq('id', runInsert.data.id)
    }
    return NextResponse.json({
      document: result.document,
      reviewFlags: result.document.reviewFlags,
      usage: result.usage,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Génération impossible'
    if (runInsert.data?.id) {
      await supabase.from('seo_generation_runs').update({ error: message }).eq('id', runInsert.data.id)
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
