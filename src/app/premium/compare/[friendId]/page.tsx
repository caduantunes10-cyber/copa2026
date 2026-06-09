'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface FriendProfile {
  id: string
  username: string
  avatar_url: string
  is_premium: boolean
}

interface Agreement {
  poll_id: string
  question: string
  user_option: number
  friend_option: number
  option_text: string
}

interface Difference {
  poll_id: string
  question: string
  user_option: number
  friend_option: number
  user_option_text: string
  friend_option_text: string
}

interface ComparisonData {
  compatibility_score: number
  friend_profile: FriendProfile
  summary: {
    total_compared: number
    agreements: number
    differences: number
    compatibility_percentage: number
    message?: string
  }
  agreements: Agreement[]
  differences: Difference[]
  limitedData: boolean
}

export default function FriendComparisonPage() {
  const params = useParams()
  const router = useRouter()
  const friendId = params.friendId as string

  const [loading, setLoading] = useState(true)
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComparison()
  }, [friendId])

  const fetchComparison = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(`/api/premium/compare/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load comparison')
        return
      }

      const result = await response.json()
      console.log('COMPARISON DATA', result.data)
      setComparisonData(result.data)
    } catch (err) {
      setError('Failed to load comparison')
      console.error('Comparison error:', err)
    } finally {
      setLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold">Carregando comparação...</h1>
          </div>
          <div className="animate-pulse">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold">Erro</h1>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-red-600">{error}</p>
            <button 
              className="mt-4 rounded-full bg-[#6C3BFF] px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] transition-colors"
              onClick={() => router.push('/premium')}
            >
              Voltar para Premium
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="text-2xl font-bold">Dados não encontrados</h1>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p>Não foi possível carregar os dados da comparação.</p>
          </div>
        </div>
      </div>
    )
  }

  const { compatibility_score, friend_profile, summary, agreements, differences, limitedData } = comparisonData
  console.log('AGREEMENTS', agreements)
  console.log('DIFFERENCES', differences)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full p-2 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold">Comparação com Amigo</h1>
        </div>

        {/* Friend Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            {friend_profile.avatar_url ? (
              <img src={friend_profile.avatar_url} alt={friend_profile.username} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8FFF0] text-sm font-black text-[#16C45B]">
                {friend_profile.username?.[0] || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{friend_profile.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                {friend_profile.is_premium && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#6C3BFF]/10 text-[#6C3BFF]">
                    Premium
                  </span>
                )}
                <span className="text-sm text-gray-600">
                  Comparado em {summary.total_compared} enquetes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility Score */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Nível de Compatibilidade</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {compatibility_score}%
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(compatibility_score)}`}>
              {getCompatibilityLabel(compatibility_score)}
            </span>
            {limitedData && (
              <p className="text-sm text-orange-600 mt-2">
                Comparação baseada em dados limitados
              </p>
            )}
            {summary.message && (
              <p className="text-sm text-gray-600 mt-2">
                {summary.message}
              </p>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumo da Comparação
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{summary.total_compared}</div>
              <div className="text-sm text-gray-600">Total Comparado</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.agreements}</div>
              <div className="text-sm text-gray-600">Concordâncias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.differences}</div>
              <div className="text-sm text-gray-600">Diferenças</div>
            </div>
          </div>
        </div>

        {/* Agreements */}
        {agreements.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Concordâncias ({agreements.length})
            </h3>
            <div className="space-y-3">
              {agreements.map((agreement) => (
                <div key={agreement.poll_id} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="font-medium">{agreement.question}</div>
                  <div className="text-sm text-gray-600">
                    Ambos escolheram: <span className="font-medium">{agreement.option_text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Differences */}
        {differences.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Diferenças ({differences.length})
            </h3>
            <div className="space-y-3">
              {differences.map((difference) => (
                <div key={difference.poll_id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="font-medium">{difference.question}</div>
                  <div className="text-sm text-gray-600">
                    <div>Você: <span className="font-medium">{difference.user_option_text}</span></div>
                    <div>{friend_profile.username}: <span className="font-medium">{difference.friend_option_text}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {agreements.length === 0 && differences.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-center text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Sem dados para comparar</h3>
              <p>
                {summary.message || 'Vocês ainda não votaram nas mesmas enquetes.'}
              </p>
              <button 
                className="mt-4 rounded-full bg-[#6C3BFF] px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] transition-colors"
                onClick={() => router.push('/')}
              >
                Votar em Enquetes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
