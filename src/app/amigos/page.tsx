'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Search, Share2, TrendingUp, UserPlus, Users } from 'lucide-react'
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

function Avatar({ profile }: { profile: Profile }) {
  return profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={profile.full_name || ''}
      className="h-11 w-11 rounded-full object-cover"
    />
  ) : (
    <div className="h-11 w-11 flex items-center justify-center rounded-full bg-gray-300 font-bold">
      {profile.full_name?.[0] || 'U'}
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
    <div className="flex items-center justify-between p-3 border rounded-xl">
      <div className="flex items-center gap-3">
        <Avatar profile={profile} />
        <div>
          <div className="font-bold">{profile.full_name || profile.username}</div>
          <div className="text-xs text-gray-500">{profile.total_votes} votos</div>
        </div>
      </div>

      <div className="flex gap-2">
        {isFollowing && (
          <button
            onClick={() => router.push(`/premium/compare/${profile.id}`)}
            className="px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
          >
            Comparar opiniões
          </button>
        )}
        <button
          onClick={() => onToggleFollow(profile.id, isFollowing)}
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            isFollowing ? 'bg-gray-200' : 'bg-purple-600 text-white'
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

        setFollowingIds(prev => {
          const s = new Set(prev)
          s.delete(id)
          return s
        })

        setFollowing(prev => prev.filter(p => p.id !== id))
      } else {
        await supabase.from('friendships').insert({
          follower_id: currentUser,
          following_id: id
        })

        setFollowingIds(prev => new Set([...prev, id]))
      }
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

  return (
    <div className="p-4 space-y-4">

      <div className="flex gap-2">
        <button onClick={() => setTab('feed')}>Feed</button>
        <button onClick={() => setTab('seguindo')}>Seguindo</button>
        <button onClick={() => setTab('busca')}>Buscar</button>
      </div>

      {tab === 'feed' && (
        <div className="space-y-3">
          {feed.map(item => (
            <div key={item.id} className="border p-3 rounded-xl">
              <div className="font-bold">{item.profile?.full_name}</div>
              <div><ActionText item={item} /></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'seguindo' && (
        <div className="space-y-3">
          {following.map(p => (
            <UserCard
              key={p.id}
              profile={p}
              isFollowing={followingIds.has(p.id)}
              onToggleFollow={handleToggleFollow}
            />
          ))}
        </div>
      )}

      {tab === 'busca' && (
        <div className="space-y-3">
          <input
            className="border p-2 w-full"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />

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