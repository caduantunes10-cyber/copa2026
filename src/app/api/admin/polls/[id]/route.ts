import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('polls')
    .update({ is_active: Boolean(body.is_active) })
    .eq('id', id)
    .select('id, question, options, is_active, created_at')
    .single()

  if (error) {
    console.error('[Admin polls] update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar enquete.' }, { status: 500 })
  }

  return NextResponse.json({ poll: data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Admin polls] delete error:', error)
    return NextResponse.json({ error: 'Erro ao excluir enquete.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
