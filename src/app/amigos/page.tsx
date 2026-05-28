'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FeedActivity, Profile } from '@/types'
import toast from 'react-hot-toast'

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function ActionText({ item }: { item: FeedActivity }) {
  if (item.action_type === 'vote') {
    return (
      <span>
        votou em <span style={{ color: '#FFD700', fontWeight: 700 }}>{item.target_name}</span> ⚽
      </span>
    )
  }
  if (item.action_type === 'poll_vote') {
    return (
      <span>
        respondeu <span style={{ color: '#60a5fa' }}>"{item.target_name}"</span>
        {item.meta?.option_label && (
          <> com <span style={{ color: '#4ade80', fontWeight: 700 }}>"{item.meta.option_label as string}"</span></>
        )}
      </span>
    )
  }
  if (item.action_type === 'premium') {
    return <span>assinou o <span style={{ color: '#FFD700', fontWeight: 700 }}>👑 Premium</span></span>
  }
  return <span>{item.action_type}</span>
}

function Avatar({ profile }: { profile: Profile }) {
  return profile.avatar_url ? (
    <img src={profile.avatar_url} alt={profile.full_name || ''} className="rounded-full object-cover flex-shrink-0"
      style={{ width: 40, height: 40, border: profile.is_premium ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.1)' }} />
  ) : (
    <div className="rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
      style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#009C3B,#FFD700)', border: profile.is_premium ? '2px solid #FFD700' : 'none' }}>
      {profile.full_name?.[0] || 'U'}
    </div>
  )
}

function UserCard({ profile, isFollowing, onToggleFollow }: {
  profile: Profile, isFollowing: boolean, onToggleFollow: (id: string, following: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Avatar profile={profile} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">
          {profile.full_name || profile.username}
          {profile.is_premium && <span className="ml-1 text-xs" style={{ color: '#FFD700' }}>👑</span>}
        </div>
        <div className="text-xs" style={{ color: '#666' }}>
          {profile.total_votes} voto{profile.total_votes !== 1 ? 's' : ''}
        </div>
      </div>
      <button onClick={() => onToggleFollow(profile.id, isFollowing)}
        className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
        style={isFollowing
          ? { background: 'rgba(255,255,255,0.08)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }
          : { background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000', border: 'none' }}>
        {isFollowing ? 'Seguindo' : 'Seguir'}
      </button>
    </div>
  )
}

export default function AmigosPage() {
  const [tab, setTab] = useState<'feed' | 'seguindo' | 'busca'>('feed')
  const [feed, setFeed] = useState<FeedActivity[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user.id)
    })
  }, [])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/friends?type=feed')
    const data = await res.json()
    setFeed(data.feed || [])
    setLoading(false)
  }, [])

  const loadFollowing = useCallback(async () => {
    const res = await fetch('/api/friends?type=following')
    const data = await res.json()
    const list: Profile[] = data.following || []
    setFollowing(list)
    setFollowingIds(new Set(list.map(p => p.id)))
  }, [])

  useEffect(() => {
    loadFeed()
    loadFollowing()
  }, [loadFeed, loadFollowing])

  // Realtime: escuta novas atividades
  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed'
      }, async (payload) => {
        // Busca o perfil do usuário que gerou a atividade
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.user_id)
          .single()

        if (profile && followingIds.has(profile.id)) {
          setFeed(prev => [{ ...payload.new, profile } as FeedActivity, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [followingIds])

  async function handleToggleFollow(userId: string, isFollowing: boolean) {
    if (!currentUser) {
      toast.error('Faça login para seguir pessoas!')
      return
    }

    if (isFollowing) {
      await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: userId })
      })
      setFollowingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      setFollowing(prev => prev.filter(p => p.id !== userId))
      toast.success('Deixou de seguir')
    } else {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: userId })
      })
      if (res.ok) {
        setFollowingIds(prev => new Set([...prev, userId]))
        toast.success('Seguindo! 🎉')
        loadFollowing()
      }
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    const res = await fetch(`/api/friends?type=search&q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSearchResults(data.users || [])
  }

  const TABS = [
    { key: 'feed', label: '📰 Feed' },
    { key: 'seguindo', label: '👥 Seguindo' },
    { key: 'busca', label: '🔍 Buscar' },
  ]

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-black text-white mb-1">👥 Social</h1>
        <p className="text-xs" style={{ color: '#666' }}>Veja o que seus amigos estão votando</p>
      </div>

      {/* TABS */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000' }
                : { color: '#666', background: 'transparent', border: 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* FEED TAB */}
      {tab === 'feed' && (
        <div className="px-4">
          {!currentUser && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🔑</div>
              <p className="text-white font-bold mb-2">Faça login para ver o feed</p>
              <p className="text-sm" style={{ color: '#666' }}>Veja o que seus amigos estão votando em tempo real</p>
            </div>
          )}
          {currentUser && following.length === 0 && (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">👀</div>
              <p className="text-white font-bold mb-2">Siga pessoas para ver o feed!</p>
              <p className="text-sm mb-4" style={{ color: '#666' }}>Vá em Buscar e encontre seus amigos</p>
              <button onClick={() => setTab('busca')}
                className="px-5 py-2 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000', border: 'none' }}>
                Buscar Amigos
              </button>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl p-4 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.04)', height: 80 }} />
              ))}
            </div>
          )}
          {!loading && feed.length > 0 && (
            <div className="space-y-3">
              {feed.map(item => (
                <div key={item.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start gap-3">
                    {item.profile && <Avatar profile={item.profile} />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white mb-0.5">
                        {item.profile?.full_name || item.profile?.username || 'Usuário'}
                        {item.profile?.is_premium && <span className="ml-1 text-xs" style={{ color: '#FFD700' }}>👑</span>}
                      </div>
                      <div className="text-sm" style={{ color: '#aaa' }}>
                        <ActionText item={item} />
                      </div>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: '#555' }}>
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEGUINDO TAB */}
      {tab === 'seguindo' && (
        <div className="px-4">
          {following.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-white font-bold mb-2">Você não segue ninguém ainda</p>
              <button onClick={() => setTab('busca')}
                className="px-5 py-2 rounded-xl font-bold text-sm mt-2"
                style={{ background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000', border: 'none' }}>
                Buscar Amigos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs mb-3" style={{ color: '#666' }}>Seguindo {following.length} pessoa{following.length !== 1 ? 's' : ''}</p>
              {following.map(profile => (
                <UserCard key={profile.id} profile={profile}
                  isFollowing={followingIds.has(profile.id)}
                  onToggleFollow={handleToggleFollow} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* BUSCA TAB */}
      {tab === 'busca' && (
        <div className="px-4">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar pelo nome..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
          </div>

          {searchQuery.length < 2 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm" style={{ color: '#666' }}>Digite pelo menos 2 letras para buscar</p>
            </div>
          )}

          {searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#666' }}>Nenhum usuário encontrado</p>
            </div>
          )}

          <div className="space-y-3">
            {searchResults.map(profile => (
              <UserCard key={profile.id} profile={profile}
                isFollowing={followingIds.has(profile.id)}
                onToggleFollow={handleToggleFollow} />
            ))}
          </div>

          {/* DICA: compartilhar link */}
          <div className="mt-6 p-4 rounded-2xl text-center"
            style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}>
            <div className="text-2xl mb-2">📤</div>
            <p className="text-white font-bold text-sm mb-1">Convide seus amigos!</p>
            <p className="text-xs mb-3" style={{ color: '#888' }}>Compartilhe o link da plataforma</p>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin)
              toast.success('Link copiado! 🎉')
            }} className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#000', border: 'none' }}>
              Copiar Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
