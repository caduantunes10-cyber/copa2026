'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart, MessageCircle, Search, Share2, TrendingUp, UserPlus, Users, Zap } from 'lucide-react'
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
    return <span>votou em <span className="font-black text-[#16C45B]">{item.target_name}</span></span>
  }
  if (item.action_type === 'poll_vote') {
    return (
      <span>
        respondeu <span className="font-black text-[#111827]">{item.target_name}</span>
        {item.meta?.option_label && <> com <span className="font-black text-[#16C45B]">{item.meta.option_label as string}</span></>}
      </span>
    )
  }
  if (item.action_type === 'premium') {
    return <span>assinou o <span className="font-black text-[#16C45B]">Premium</span></span>
  }
  return <span>{item.action_type}</span>
}

function Avatar({ profile }: { profile: Profile }) {
  return profile.avatar_url ? (
    <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" />
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#16C45B] text-sm font-black text-white shadow-sm">
      {profile.full_name?.[0] || 'U'}
    </div>
  )
}

function UserCard({ profile, isFollowing, onToggleFollow }: {
  profile: Profile, isFollowing: boolean, onToggleFollow: (id: string, following: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-[#111827]">
          {profile.full_name || profile.username}
          {profile.is_premium && <span className="ml-2 rounded-full bg-[#E8FFF0] px-2 py-0.5 text-[10px] font-black uppercase text-[#16C45B]">VIP</span>}
        </div>
        <div className="text-xs font-bold text-[#6B7280]">
          {profile.total_votes} voto{profile.total_votes !== 1 ? 's' : ''}
        </div>
      </div>
      <button onClick={() => onToggleFollow(profile.id, isFollowing)}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase transition active:scale-[0.98] ${isFollowing ? 'bg-[#F3F4F6] text-[#6B7280]' : 'bg-[#6C3BFF] text-white shadow-[0_10px_24px_rgba(108,59,255,0.18)]'}`}>
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

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed'
      }, async (payload) => {
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

    return (
    <div className="pb-28">
      <section className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6C3BFF]">Social da Copa</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#111827] sm:text-4xl">Feed da torcida</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6B7280]">Veja votos, palpites e movimentos dos seus amigos em tempo real.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
            <div className="rounded-2xl bg-[#F7FFFA] px-4 py-3 text-center ring-1 ring-[#16C45B]/20">
              <div className="text-2xl font-black text-[#16C45B]">{following.length}</div>
              <div className="text-[10px] font-black uppercase text-[#6B7280]">seguindo</div>
            </div>
            <div className="rounded-2xl bg-[#F6F1FF] px-4 py-3 text-center ring-1 ring-[#6C3BFF]/10">
              <div className="text-2xl font-black text-[#6C3BFF]">LIVE</div>
              <div className="text-[10px] font-black uppercase text-[#6B7280]">tempo real</div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[76px] z-30 mb-4 rounded-[22px] bg-white p-1.5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
        <div className="grid grid-cols-3 gap-1">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black uppercase transition ${tab === t.key ? 'bg-[#6C3BFF] text-white shadow-[0_10px_24px_rgba(108,59,255,0.2)]' : 'text-[#6B7280] hover:bg-[#F5F6F8] hover:text-[#111827]'}`}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'feed' && (
        <section>
          {!currentUser && (
            <div className="rounded-[22px] bg-white p-10 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
              <UserPlus className="mx-auto mb-4 h-10 w-10 text-[#16C45B]" />
              <p className="text-xl font-black text-[#111827]">Fa?a login para ver o feed</p>
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">Veja o que seus amigos est?o votando em tempo real.</p>
            </div>
          )}
          {currentUser && following.length === 0 && (
            <div className="rounded-[22px] bg-white p-10 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
              <Users className="mx-auto mb-4 h-10 w-10 text-[#16C45B]" />
              <p className="text-xl font-black text-[#111827]">Siga pessoas para montar seu feed</p>
              <p className="mt-2 text-sm font-semibold text-[#6B7280]">Busque amigos e acompanhe as escolhas da sua rede.</p>
              <button onClick={() => setTab('busca')} className="mt-5 rounded-full bg-[#6C3BFF] px-6 py-3 text-sm font-black uppercase text-white">Buscar amigos</button>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-[22px] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.04)] ring-1 ring-black/[0.03]" />)}
            </div>
          )}
          {!loading && feed.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[13px] font-black uppercase tracking-[0.04em] text-[#111827]">Feed da torcida</h2>
                  <span className="text-[10px] font-black uppercase text-[#6B7280]">Ao vivo</span>
                </div>
                <div className="divide-y divide-[#EEF0F4]">
                  {feed.map(item => (
                    <article key={item.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {item.profile && <Avatar profile={item.profile} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h2 className="truncate text-[13px] font-black text-[#111827]">{item.profile?.full_name || item.profile?.username || 'Usu?rio'}</h2>
                              <p className="text-[10px] font-semibold text-[#6B7280]">@{item.profile?.username || 'torcedor'}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-[#6B7280]">{timeAgo(item.created_at)}</span>
                          </div>
                          <p className="mt-3 text-[13px] font-semibold leading-5 text-[#111827]"><ActionText item={item} /></p>
                          <div className="mt-3 flex items-center gap-8 text-[11px] font-semibold text-[#6B7280]">
                            <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />23</span>
                            <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />45</span>
                            <span className="hidden items-center gap-1.5 sm:flex"><TrendingUp className="h-4 w-4 text-[#16C45B]" />Trending</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="hidden space-y-4 lg:block">
                <div className="rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[13px] font-black uppercase text-[#111827]">Seguindo</h2>
                    <span className="text-[10px] font-black uppercase text-[#6B7280]">{following.length}</span>
                  </div>
                  <div className="space-y-3">
                    {following.slice(0, 5).map(profile => (
                      <UserCard key={profile.id} profile={profile} isFollowing={followingIds.has(profile.id)} onToggleFollow={handleToggleFollow} />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      )}

      {tab === 'seguindo' && (
        <section className="space-y-3">
          {following.length === 0 ? (
            <div className="rounded-[22px] bg-white p-10 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
              <Users className="mx-auto mb-4 h-10 w-10 text-[#16C45B]" />
              <p className="text-xl font-black text-[#111827]">Voc? ainda n?o segue ningu?m</p>
              <button onClick={() => setTab('busca')} className="mt-5 rounded-full bg-[#6C3BFF] px-6 py-3 text-sm font-black uppercase text-white">Buscar amigos</button>
            </div>
          ) : (
            <>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#6B7280]">Seguindo {following.length} pessoa{following.length !== 1 ? 's' : ''}</p>
              {following.map(profile => (
                <UserCard key={profile.id} profile={profile}
                  isFollowing={followingIds.has(profile.id)}
                  onToggleFollow={handleToggleFollow} />
              ))}
            </>
          )}
        </section>
      )}

      {tab === 'busca' && (
        <section>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar pelo nome..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full rounded-[22px] border border-[#E5E7EB] bg-white px-5 py-4 pr-12 text-sm font-semibold text-[#111827] shadow-[0_10px_30px_rgba(17,24,39,0.04)] outline-none transition focus:border-[#6C3BFF]"
            />
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
          </div>

          {searchQuery.length < 2 && (
            <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
              <Search className="mx-auto mb-3 h-8 w-8 text-[#16C45B]" />
              <p className="text-sm font-semibold text-[#6B7280]">Digite pelo menos 2 letras para buscar.</p>
            </div>
          )}

          {searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="rounded-[22px] bg-white p-8 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
              <p className="text-sm font-semibold text-[#6B7280]">Nenhum usu?rio encontrado.</p>
            </div>
          )}

          <div className="space-y-3">
            {searchResults.map(profile => (
              <UserCard key={profile.id} profile={profile}
                isFollowing={followingIds.has(profile.id)}
                onToggleFollow={handleToggleFollow} />
            ))}
          </div>

          <div className="mt-6 rounded-[22px] bg-white p-6 text-center shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
            <Share2 className="mx-auto mb-3 h-8 w-8 text-[#16C45B]" />
            <p className="text-lg font-black text-[#111827]">Convide seus amigos</p>
            <p className="mt-1 text-sm font-semibold text-[#6B7280]">Compartilhe o link da plataforma.</p>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin)
              toast.success('Link copiado')
            }} className="mt-4 rounded-full bg-[#6C3BFF] px-5 py-3 text-xs font-black uppercase text-white">
              Copiar link
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
</main>
  )
}

