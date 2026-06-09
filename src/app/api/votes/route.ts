import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Rate limit simples em memória (para produção use Redis/Upstash)
const rateLimitMap = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minuto
  const maxRequests = 10

  const requests = rateLimitMap.get(ip) || []
  const recent = requests.filter(t => now - t < windowMs)

  if (recent.length >= maxRequests) return false

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true
}

export async function POST(request: NextRequest) {
  // Rate limit por IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
  }

  const supabase = await createServerSupabaseClient()

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para votar.' }, { status: 401 })
  }

  const { player_id } = await request.json()
  if (!player_id) {
    return NextResponse.json({ error: 'player_id é obrigatório.' }, { status: 400 })
  }

  // Busca perfil para checar se é premium
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, total_votes')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
  }

  // Usuários gratuitos: 1 voto por dia (verifica votos de hoje)
  if (!profile.is_premium) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    if ((count || 0) >= 1) {
      return NextResponse.json({
        error: 'Limite diário atingido. Assine Premium para votos ilimitados!',
        upgrade: true
      }, { status: 403 })
    }
  }

  // Verifica se já votou neste jogador
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('player_id', player_id)
    .single()

  if (existingVote) {
    return NextResponse.json({ error: 'Você já votou neste jogador.' }, { status: 409 })
  }

  // Insere o voto (peso 1 para todos os usuários)
  const vote_weight = 1
  const { error } = await supabase
    .from('votes')
    .insert({ user_id: user.id, player_id, vote_weight })

  if (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ error: 'Erro ao registrar voto.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, vote_weight })
}
