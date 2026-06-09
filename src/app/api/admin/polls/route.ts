import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server'

type PollOption = {
  id: number
  label: string
  count: number
}

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('polls')
    .select('id, question, options, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin polls] list error:', error)
    return NextResponse.json({ error: 'Erro ao carregar enquetes.' }, { status: 500 })
  }

  return NextResponse.json({ polls: data || [] })
}

export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const question = String(body.question || '').trim()
  const labels = [body.option_1, body.option_2, body.option_3, body.option_4]
    .map(option => String(option || '').trim())
    .filter(Boolean)

  if (!question) {
    return NextResponse.json({ error: 'Pergunta é obrigatória.' }, { status: 400 })
  }

  if (labels.length < 2) {
    return NextResponse.json({ error: 'Informe pelo menos 2 opções.' }, { status: 400 })
  }

  const options: PollOption[] = labels.map((label, index) => ({
    id: index,
    label,
    count: 0,
  }))

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('polls')
    .insert({
      question,
      options,
      is_active: Boolean(body.is_active),
      is_premium: false,
    })
    .select('id, question, options, is_active, created_at')
    .single()

  if (error) {
    console.error('[Admin polls] create error:', error)
    return NextResponse.json({ error: 'Erro ao criar enquete.' }, { status: 500 })
  }

  return NextResponse.json({ poll: data })
}
