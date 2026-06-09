'use client'

import { useEffect, useState } from 'react'
import { Award, BarChart3, Check, Crown, Flame, Goal, Star, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Player } from '@/types'
import toast from 'react-hot-toast'

function PlayerPhoto({ player, size = 96 }: { player: Player, size?: number }) {
  const [err, setErr] = useState(false)
  const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('')

  if (err || !player.photo_url) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-3xl bg-white/10 font-black text-white ring-1 ring-white/10"
        style={{ width: size, height: size, fontSize: size * 0.25 }}>
        {initials}
      </div>
    )
  }

  return (
    <img src={player.photo_url} alt={player.name} onError={() => setErr(true)}
      className="shrink-0 rounded-3xl object-cover object-top ring-1 ring-white/10"
      style={{ width: size, height: size }} />
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
      const { data } = await supabase
        .from('player_ranking')
        .select('*')
        .limit(20)
      if (data) setPlayers(data)
      setLoading(false)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      if (profile) setIsPremium(profile.is_premium)

      const { data: votes } = await supabase
        .from('votes')
        .select('player_id')
        .eq('user_id', user.id)
      if (votes) setMyVotes(new Set(votes.map(v => v.player_id)))

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
      toast.error('Faça login para votar')
      return
    }
    if (myVotes.has(player.id)) return

    if (!isPremium && dailyVotes >= 1) {
      toast.error('Limite atingido. Assine Premium para votos ilimitados.', { duration: 3000 })
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
        toast.error('Assine Premium para mais votos')
        setTimeout(() => window.location.href = '/premium', 2000)
      } else {
        toast.error(data.error)
      }
      return
    }

    setMyVotes(prev => new Set([...prev, player.id]))
    setDailyVotes(prev => prev + 1)
    setPlayers(prev =>
      prev.map(p => p.id === player.id ? { ...p, vote_count: p.vote_count + 1 } : p)
        .sort((a, b) => b.vote_count - a.vote_count)
    )
    toast.success(`Voto registrado em ${player.short_name}`)
  }

  const top = players[0]?.vote_count || 1
  const topThree = players.slice(0, 3)
  const rest = players.slice(3)

  return (
    <div className="section-stack pb-28">
      <section className="cinematic-panel rounded-[36px] p-6 sm:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 section-kicker">
              <span className="live-dot h-2 w-2 rounded-full bg-hot-red" />
              Ranking ao vivo
            </div>
            <h1 className="section-title text-4xl sm:text-6xl">Vote no craque da Copa</h1>
            <p className="section-copy mt-4 max-w-2xl text-sm sm:text-base">
              {!isLoggedIn ? 'Faça login para participar da votação social.'
                : !isPremium ? `${dailyVotes}/1 voto grátis hoje. Premium libera votos ilimitados.`
                : 'Premium ativo: votos ilimitados.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="premium-surface rounded-3xl px-5 py-4 text-center">
              <div className="text-2xl font-black text-white">{players.length}</div>
              <div className="text-[11px] font-black uppercase text-slate-400">jogadores</div>
            </div>
            <div className="premium-surface rounded-3xl px-5 py-4 text-center">
              <div className="text-2xl font-black text-electric-lime">LIVE</div>
              <div className="text-[11px] font-black uppercase text-slate-400">tempo real</div>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-72 animate-pulse rounded-[24px] bg-white/[0.055] ring-1 ring-white/10" />)}
        </div>
      )}

      {!loading && topThree.length > 0 && (
        <section className="grid gap-5 lg:grid-cols-3">
          {topThree.map((player, idx) => {
            const voted = myVotes.has(player.id)
            const bar = Math.round((player.vote_count / top) * 100)
            return (
              <article key={player.id} className={`relative overflow-hidden glass-card magnetic-card border backdrop-blur-xl ${idx === 0 ? 'border-electric-lime/40 ring-2 ring-electric-lime/10' : 'border-white/10'}`}>
                <div className="absolute left-0 top-0 h-1.5 w-full bg-hot-red" />
                <div className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase text-white">
                      <Trophy className="h-3.5 w-3.5 text-electric-lime" />
                      Top {idx + 1}
                    </span>
                    <span className="text-sm font-black text-electric-lime">{fmt(player.vote_count)} votos</span>
                  </div>
                  <PlayerPhoto player={player} size={150} />
                  <h2 className="mt-6 text-2xl font-black tracking-tight text-white">{player.name}</h2>
                  <p className="mt-1.5 text-sm font-bold leading-6 text-slate-400">{player.flag} {player.country} · {player.position} · {player.club}</p>
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="premium-surface rounded-2xl p-3"><Goal className="mb-1 h-4 w-4 text-electric-lime" /><div className="text-sm font-black">{player.goals}</div><div className="text-[10px] font-bold text-slate-400">gols</div></div>
                    <div className="premium-surface rounded-2xl p-3"><Award className="mb-1 h-4 w-4 text-electric-lime" /><div className="text-sm font-black">{player.assists}</div><div className="text-[10px] font-bold text-slate-400">assist.</div></div>
                    <div className="premium-surface rounded-2xl p-3"><Star className="mb-1 h-4 w-4 text-electric-lime" /><div className="text-sm font-black">{player.rating}</div><div className="text-[10px] font-bold text-slate-400">nota</div></div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-hot-red transition-all duration-700" style={{ width: `${bar}%` }} />
                  </div>
                  <button onClick={() => handleVote(player)} disabled={voted}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black uppercase tracking-wide transition-all active:scale-[0.98] ${voted ? 'bg-white/10 text-slate-500' : 'btn-hype'}`}>
                    {voted ? <Check className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                    {voted ? 'Você já votou' : 'Votar neste jogador'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {!loading && rest.length > 0 && (
        <section className="glass-card rounded-[32px] p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-electric-lime">Tabela geral</p>
              <h2 className="text-2xl font-black tracking-tight text-white">Outros candidatos</h2>
            </div>
            <BarChart3 className="h-6 w-6 text-electric-lime" />
          </div>
          <div className="space-y-3.5">
            {rest.map((player, idx) => {
              const voted = myVotes.has(player.id)
              const bar = Math.round((player.vote_count / top) * 100)
              return (
                <div key={player.id} className="premium-surface rounded-3xl p-4 transition hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-sm font-black text-slate-500">#{idx + 4}</span>
                    <PlayerPhoto player={player} size={70} />
                    <div className="min-w-0 flex-1">
                      <div className="font-black tracking-tight text-white">{player.name}</div>
                      <div className="mt-0.5 text-xs font-bold leading-5 text-slate-400">{player.flag} {player.country} · {player.position} · {player.club}</div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-hot-red" style={{ width: `${bar}%` }} />
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="font-black text-white">{fmt(player.vote_count)}</div>
                      <div className="text-xs font-bold text-slate-400">votos</div>
                    </div>
                    <button onClick={() => handleVote(player)} disabled={voted}
                      className={`rounded-full px-4 py-2.5 text-xs font-black uppercase transition active:scale-[0.98] ${voted ? 'bg-white/10 text-slate-500' : 'bg-gradient-to-r from-electric-lime to-electric-blue text-night-950 hover:brightness-110'}`}>
                      {voted ? 'Votado' : 'Votar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}



