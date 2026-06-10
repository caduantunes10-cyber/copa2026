'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FeedActivity, Profile } from '@/types'

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
        respondeu <span className="font-black">{item.target_name}</span>
        {item.meta?.option_label && (
          <> com <span className="font-black text-[#16C45B]">{item.meta.option_label as string}</span></>
        )}
      </span>
    )
  }

  if (item.action_type === 'premium') {
    return <span>assinou o <span className="font-black text-[#16C45B]">Premium</span></span>
  }

  return <span>{item.action_type}</span>
}

function Avatar({ profile, size = 'md' }: { profile: Profile, size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[12px]'
  return profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={profile.full_name || ''}
      className={`${dim} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div className={`${dim} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#16C45B] font-black text-white`}>
      {profile.full_name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function UserCard({
  profile,
  isFollowing,
  onToggleFollow
}: {
  profile: Profile
  isFollowing: boolean
  onToggleFollow: (id: string, following: boolean) => void
}) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.04] shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar profile={profile} />
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#111827] truncate">{profile.full_name || profile.username}</div>
        </div>
      </div>

      <div className="flex gap-2 shrink-0 ml-3">
        {isFollowing && (
          <button
            onClick={() => router.push(`/premium/compare/${profile.id}`)}
            className="px-3 py-1.5 rounded-full text-[11px] font-black bg-[#F6F1FF] text-[#6C3BFF] hover:bg-[#ede9ff] transition"
          >
            Comparar
          </button>
        )}
        <button
          onClick={() => onToggleFollow(profile.id, isFollowing)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-black transition ${
            isFollowing
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              : 'bg-[#6C3BFF] text-white hover:bg-[#5b2fe0]'
          }`}
        >
          {isFollowing ? 'Seguindo' : 'Seguir'}
        </button>
      </div>
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
  const [followLoading, setFollowLoading] = useState<string | null>(null)

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

  const handleToggleFollow = async (id: string, isFollowing: boolean) => {
    if (!currentUser) return
    if (followLoading) return

    setFollowLoading(id)

    try {
      if (isFollowing) {
        await supabase
          .from('friendships')
          .delete()
          .eq('follower_id', currentUser)
          .eq('following_id', id)
      } else {
        await supabase.from('friendships').insert({
          follower_id: currentUser,
          following_id: id
        })
      }
      await Promise.all([loadFeed(), loadFollowing()])
    } catch (err) {
      console.error(err)
    } finally {
      setFollowLoading(null)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) return setSearchResults([])

    const res = await fetch(`/api/friends?type=search&q=${query}`)
    const data = await res.json()
    setSearchResults(data.users || [])
  }

  const tabs = [
    { key: 'feed', label: 'Feed' },
    { key: 'seguindo', label: 'Seguindo' },
    { key: 'busca', label: 'Buscar' },
  ] as const

  return (
    <div className="space-y-4">

      <div className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-black/[0.04] shadow-sm w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-[12px] font-black transition-all ${
              tab === t.key
                ? 'bg-[#6C3BFF] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-2">
          {loading ? (
            <p className="text-[12px] font-semibold text-[#9CA3AF] py-2">Carregando...</p>
          ) : feed.length === 0 ? (
            <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] p-8 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              <p className="text-[12px] font-semibold text-[#9CA3AF]">Seus amigos ainda não votaram ou você ainda não segue ninguém.</p>
            </div>
          ) : (
            feed.map(item => (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/[0.04] shadow-sm">
                {item.profile && <Avatar profile={item.profile} size="sm" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-black text-[#111827] truncate">{item.profile?.full_name}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-[#9CA3AF]">{timeAgo(item.created_at)}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-[#6B7280] leading-snug"><ActionText item={item} /></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'seguindo' && (
        <div className="space-y-2">
          {following.length === 0 ? (
            <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] p-8 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              <p className="text-[12px] font-semibold text-[#9CA3AF]">Você ainda não segue ninguém. Use Buscar para encontrar amigos.</p>
            </div>
          ) : (
            following.map(p => (
              <UserCard
                key={p.id}
                profile={p}
                isFollowing={followingIds.has(p.id)}
                onToggleFollow={handleToggleFollow}
              />
            ))
          )}
        </div>
      )}

      {tab === 'busca' && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              className="w-full rounded-2xl bg-white pl-10 pr-4 py-2.5 text-[13px] font-medium text-[#111827] ring-1 ring-slate-200 outline-none focus:ring-[#6C3BFF]/40 focus:ring-2 transition placeholder:text-[#9CA3AF]"
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {searchResults.length === 0 && searchQuery.length >= 2 && (
            <p className="text-[12px] font-semibold text-[#9CA3AF] py-2">Nenhum usuário encontrado.</p>
          )}

          {searchResults.map(p => (
            <UserCard
              key={p.id}
              profile={p}
              isFollowing={followingIds.has(p.id)}
              onToggleFollow={handleToggleFollow}
            />
          ))}
        </div>
      )}
    </div>
  )
}