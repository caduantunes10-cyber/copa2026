'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'
import toast from 'react-hot-toast'

function PlayerPhoto({ player, size = 64 }: { player: Player, size?: number }) {
  const [err, setErr] = useState(false)
  const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const colors: Record<string, string> = {
    'Brasil': '#009C3B', 'França': '#0055A4', 'Noruega': '#EF2B2D',
    'Inglaterra': '#CF081F', 'Espanha': '#AA151B'
  }
  const color = colors[player.country] || '#667eea'

  if (err || !player.photo_url) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${color}cc, ${color}55)`,
        border: `2px solid ${color}66`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 900, fontSize: size * 0.3,
        color: '#fff', fontFamily: 'Georgia, serif' }}>
        {initials}
      </div>
    )
  }
  return (
    <img src={player.photo_url} alt={player.name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        objectPosition: 'top', flexShrink: 0, border: `2px solid ${color}55` }} />
  )
}

function fmt(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

export default function RankingPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set())
  const [isPremium, setIsPremium] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dailyVotes, setDailyVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      // Busca jogadores
      const { data } = await supabase
        .from('player_ranking')
        .select('*')
        .limit(20)
      if (data) setPlayers(data)
      setLoading(false)

      // Verifica usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsLoggedIn(true)

      // Busca perfil (premium?)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      if (profile) setIsPremium(profile.is_premium)

      // Busca votos do usuário
      const { data: votes } = await supabase
        .from('votes')
        .select('player_id')
        .eq('user_id', user.id)
      if (votes) setMyVotes(new Set(votes.map(v => v.player_id)))

      // Votos de hoje
      const today = new Date(); today.setHours(0,0,0,0)
      const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
      setDailyVotes(count || 0)
    }
    init()
  }, [])

  // Realtime — atualiza vote_count ao vivo
  useEffect(() => {
    const channel = supabase
      .channel('players-ranking')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players'
      }, (payload) => {
        setPlayers(prev =>
          prev.map(p => p.id === payload.new.id ? { ...p, vote_count: payload.new.vote_count } : p)
            .sort((a, b) => b.vote_count - a.vote_count)
        )
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleVote(player: Player) {
    if (!isLoggedIn) {
      toast.error('Faça login para votar! 🔑')
      return
    }
    if (myVotes.has(player.id)) return

    if (!isPremium && dailyVotes >= 1) {
      toast.error('Limite atingido! Assine Premium para votos ilimitados 👑', { duration: 3000 })
      setTimeout(() => window.location.href = '/premium', 3000)
      return
    }

    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: player.id })
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.upgrade) {
        toast.error('Assine Premium para mais votos! 👑')
        setTimeout(() => window.location.href = '/premium', 2000)
      } else {
        toast.error(data.error)
      }
      return
    }

    setMyVotes(prev => new Set([...prev, player.id]))
    setDailyVotes(prev => prev + 1)
    setPlayers(prev =>
      prev.map(p => p.id === player.id ? { ...p, vote_count: p.vote_count + (data.vote_weight || 1) } : p)
        .sort((a, b) => b.vote_count - a.vote_count)
    )
    toast.success(`✅ Votado em ${player.short_name}!`)
  }

  const medals = ['🥇', '🥈', '🥉']
  const top = players[0]?.vote_count || 1

  return (
    <div className="px-4 py-5 pb-24">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-xl font-black text-white">🏆 Ranking ao Vivo</h1>
        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#4ade80' }}>
          <span className="w-2 h-2 rounded-full live-dot" style={{ background: '#4ade80', display: 'inline-block' }} />
          LIVE
        </span>
      </div>
      <p className="text-xs mb-5" style={{ color: '#666' }}>
        {!isLoggedIn ? 'Faça login para votar'
          : !isPremium ? `${dailyVotes}/1 voto grátis hoje — Premium para ilimitados`
          : '✨ Votos ilimitados (peso 3x) ativos'}
      </p>

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl p-4 animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)', height: 140 }} />
          ))}
        </div>
      )}

      {!loading && players.map((player, idx) => {
        const voted = myVotes.has(player.id)
        const bar = Math.round((player.vote_count / top) * 100)
        const isGold = idx === 0
        const barGradients = [
          'linear-gradient(90deg,#FFD700,#FFA500)',
          'linear-gradient(90deg,#C0C0C0,#A0A0A0)',
          'linear-gradient(90deg,#CD7F32,#A06020)',
          'linear-gradient(90deg,#667eea,#764ba2)',
        ]
        const barGrad = barGradients[Math.min(idx, 3)]

        return (
          <div key={player.id} className="mb-3 rounded-2xl overflow-hidden"
            style={{
              background: isGold ? 'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,140,0,0.04))' : 'rgba(255,255,255,0.04)',
              border: isGold ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.07)'
            }}>
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl w-8 text-center flex-shrink-0 mt-1">
                  {medals[idx] || `#${idx + 1}`}
                </span>
                <PlayerPhoto player={player} size={60} />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white text-base leading-tight">{player.name}</div>
                  <div className="text-xs mb-1" style={{ color: '#888' }}>
                    {player.flag} {player.country} · {player.position} · {player.club}
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xs font-bold" style={{ color: '#4ade80' }}>⚽ {player.goals} gols</span>
                    <span className="text-xs font-bold" style={{ color: '#60a5fa' }}>🎯 {player.assists} ast</span>
                    <span className="text-xs font-bold" style={{ color: '#FFD700' }}>⭐ {player.rating}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-white text-base">{fmt(player.vote_count)}</div>
                  <div className="text-xs" style={{ color: '#4ade80' }}>votos</div>
                </div>
              </div>

              {/* BARRA */}
              <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${bar}%`, background: barGrad }} />
              </div>

              <button onClick={() => handleVote(player)} disabled={voted}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: voted ? 'rgba(255,255,255,0.05)'
                    : isGold ? 'linear-gradient(90deg,#FFD700,#FFA500)'
                    : 'rgba(255,255,255,0.09)',
                  color: voted ? '#555' : isGold ? '#000' : '#fff',
                  border: !voted && !isGold ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  cursor: voted ? 'default' : 'pointer'
                }}>
                {voted ? '✓ Você votou aqui' : 'Votar neste jogador'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
