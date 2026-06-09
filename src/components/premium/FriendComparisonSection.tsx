'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import FriendComparisonCard from './FriendComparisonCard'
import { Users, Loader2, UserPlus } from 'lucide-react'

interface Friend {
  id: string
  username: string
  avatar_url: string
  is_premium: boolean
}

export default function FriendComparisonSection() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      // Get friends (following relationships)
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('following_id')
        .eq('follower_id', user.id)

      if (friendshipsError) {
        setError('Erro ao carregar amigos')
        return
      }

      if (!friendships || friendships.length === 0) {
        setLoading(false)
        return
      }

      // Get friend profiles
      const friendIds = friendships.map(f => f.following_id)
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_premium')
        .in('id', friendIds)

      if (profilesError) {
        setError('Erro ao carregar perfis')
        return
      }

      setFriends(friendProfiles || [])
    } catch (err) {
      setError('Erro ao carregar amigos')
      console.error('Friends error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-electric-lime" />
        <span className="ml-2 text-sm text-gray-400">Carregando amigos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button 
          className="mt-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={fetchFriends}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Nenhum amigo encontrado</h3>
        <p className="text-sm text-gray-600 mb-4">
          Adicione amigos para começar a comparar suas opiniões sobre a Copa do Mundo.
        </p>
        <button 
          onClick={() => window.location.href = '/amigos'}
          className="flex items-center gap-2 rounded-full bg-[#6C3BFF] px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] transition-colors mx-auto"
        >
          <UserPlus className="h-4 w-4" />
          Encontrar Amigos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">
          Seus amigos ({friends.length})
        </h3>
        <button 
          onClick={() => window.location.href = '/amigos'}
          className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Mais Amigos
        </button>
      </div>
      
      <div className="space-y-2">
        {friends.map((friend) => (
          <FriendComparisonCard
            key={friend.id}
            friend={friend}
          />
        ))}
      </div>
    </div>
  )
}
