import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/friends — busca feed de amigos + lista de quem sigo
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'feed'

  // Feed de atividade de amigos
  if (type === 'feed') {
    const { data: feed, error } = await supabase
      .from('activity_feed')
      .select(`
        *,
        profile:profiles(id, username, full_name, avatar_url, is_premium)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ feed })
  }

  // Lista de quem eu sigo
  if (type === 'following') {
    const { data, error } = await supabase
      .from('friendships')
      .select(`profile:profiles!following_id(id, username, full_name, avatar_url, is_premium, total_votes)`)
      .eq('follower_id', user.id)

    return NextResponse.json({ following: data?.map(d => d.profile) || [] })
  }

  // Meus seguidores
  if (type === 'followers') {
    const { data } = await supabase
      .from('friendships')
      .select(`profile:profiles!follower_id(id, username, full_name, avatar_url, is_premium, total_votes)`)
      .eq('following_id', user.id)

    return NextResponse.json({ followers: data?.map(d => d.profile) || [] })
  }

  // Busca de usuários para seguir
  if (type === 'search') {
    const q = searchParams.get('q') || ''
    if (q.length < 2) return NextResponse.json({ users: [] })

    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_premium, total_votes')
      .ilike('full_name', `%${q}%`)
      .neq('id', user.id)
      .limit(10)

    return NextResponse.json({ users: data || [] })
  }

  return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
}

// POST /api/friends — seguir um usuário
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { following_id } = await request.json()
  if (!following_id) return NextResponse.json({ error: 'following_id obrigatório' }, { status: 400 })
  if (following_id === user.id) return NextResponse.json({ error: 'Não pode seguir a si mesmo' }, { status: 400 })

  const { error } = await supabase
    .from('friendships')
    .insert({ follower_id: user.id, following_id })

  if (error?.code === '23505') return NextResponse.json({ error: 'Já segue este usuário' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE /api/friends — deixar de seguir
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { following_id } = await request.json()

  await supabase
    .from('friendships')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  return NextResponse.json({ success: true })
}
