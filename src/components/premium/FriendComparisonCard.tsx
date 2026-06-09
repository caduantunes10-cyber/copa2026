'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, TrendingUp, ArrowRight } from 'lucide-react'

interface Friend {
  id: string
  username: string
  avatar_url: string
  is_premium: boolean
}

interface FriendComparisonCardProps {
  friend: Friend
  recentComparison?: {
    compatibility_score: number
    total_compared: number
    compared_at: string
  }
}

export default function FriendComparisonCard({ 
  friend, 
  recentComparison 
}: FriendComparisonCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCompare = () => {
    setIsLoading(true)
    router.push(`/premium/compare/${friend.id}`)
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Muito compatível'
    if (score >= 60) return 'Bastante compatível'
    if (score >= 40) return 'Moderadamente compatível'
    return 'Pouco compatível'
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt={friend.username} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8FFF0] text-sm font-black text-[#16C45B]">
              {friend.username?.[0] || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{friend.username}</h3>
              {friend.is_premium && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#6C3BFF]/10 text-[#6C3BFF]">
                  Premium
                </span>
              )}
            </div>
            {recentComparison ? (
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCompatibilityColor(recentComparison.compatibility_score)}`}>
                  {recentComparison.compatibility_score}% compatível
                </span>
                <span className="text-xs text-gray-500">
                  {recentComparison.total_compared} enquetes
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Ainda não comparado
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={handleCompare}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-[#6C3BFF] px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            'Carregando...'
          ) : recentComparison ? (
            <>
              <TrendingUp className="h-4 w-4" />
              Ver Detalhes
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Comparar
            </>
          )}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {recentComparison && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Última comparação</span>
            <span>{new Date(recentComparison.compared_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
