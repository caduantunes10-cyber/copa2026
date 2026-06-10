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

  const getScoreColor = (score: number) => {
    if (score >= 70) return { text: 'text-[#16C45B]', bg: 'from-[#F0FDF4] to-[#dcfce7]', ring: 'ring-[#16C45B]/20', bar: 'bg-[#16C45B]' }
    if (score >= 45) return { text: 'text-[#F59E0B]', bg: 'from-[#FFFBEB] to-[#fef3c7]', ring: 'ring-[#F59E0B]/20', bar: 'bg-[#F59E0B]' }
    return { text: 'text-[#EF4444]', bg: 'from-[#FFF5F5] to-[#fee2e2]', ring: 'ring-[#EF4444]/20', bar: 'bg-[#EF4444]' }
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Muito parecidos'
    if (score >= 60) return 'Bastante parecidos'
    if (score >= 40) return 'Opiniões mistas'
    return 'Visões bem diferentes'
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black text-[#6B7280] hover:bg-white hover:text-[#111827] transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-[28px] bg-white ring-1 ring-black/[0.04]" />
          <div className="h-24 rounded-2xl bg-white ring-1 ring-black/[0.04]" />
          <div className="h-32 rounded-2xl bg-white ring-1 ring-black/[0.04]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 pb-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black text-[#6B7280] hover:bg-white hover:text-[#111827] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div className="rounded-2xl bg-white px-5 py-6 ring-1 ring-black/[0.04] shadow-sm">
          <p className="text-[13px] font-semibold text-[#EF4444]">{error}</p>
          <button className="mt-4 rounded-2xl bg-[#6C3BFF] px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] transition" onClick={() => router.push('/premium')}>
            Voltar para Premium
          </button>
        </div>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="space-y-4 pb-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black text-[#6B7280] hover:bg-white hover:text-[#111827] transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div className="rounded-2xl bg-white px-5 py-6 ring-1 ring-black/[0.04] shadow-sm">
          <p className="text-[13px] font-semibold text-[#6B7280]">Não foi possível carregar os dados da comparação.</p>
        </div>
      </div>
    )
  }

  const { compatibility_score, friend_profile, summary, agreements, differences, limitedData } = comparisonData
  console.log('AGREEMENTS', agreements)
  console.log('DIFFERENCES', differences)

  const scoreColors = getScoreColor(compatibility_score)

  return (
    <div className="space-y-4 pb-10">

      {/* Back nav */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black text-[#6B7280] hover:bg-white hover:text-[#111827] transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      {/* Score hero */}
      <section className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${scoreColors.bg} p-6 ring-1 ${scoreColors.ring} text-center sm:p-8`}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-black/[0.03]" />
        <div className="relative">
          <div className="mb-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#6B7280]">Compatibilidade de opiniões</div>
          <div className={`text-7xl font-black tracking-[-0.05em] sm:text-8xl ${scoreColors.text}`}>
            {compatibility_score}%
          </div>
          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-2xl px-4 py-1.5 text-[12px] font-black ${scoreColors.text} bg-white/60 ring-1 ${scoreColors.ring}`}>
            {getCompatibilityLabel(compatibility_score)}
          </div>
          {limitedData && (
            <p className="mt-3 text-[11px] font-semibold text-[#F59E0B]">Baseado em dados parciais</p>
          )}
          {summary.message && (
            <p className="mt-2 text-[11px] font-medium text-[#6B7280]">{summary.message}</p>
          )}
        </div>
      </section>

      {/* Friend profile + stats */}
      <section className="rounded-2xl bg-white px-5 py-4 ring-1 ring-black/[0.04] shadow-sm">
        <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 pb-4">
          {friend_profile.avatar_url ? (
            <img src={friend_profile.avatar_url} alt={friend_profile.username} className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C3BFF] to-[#16C45B] text-[15px] font-black text-white">
              {friend_profile.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[14px] font-black text-[#111827]">{friend_profile.username}</div>
            <div className="mt-0.5 flex items-center gap-2">
              {friend_profile.is_premium && (
                <span className="inline-flex items-center rounded-full bg-[#6C3BFF]/10 px-2 py-0.5 text-[10px] font-black text-[#6C3BFF]">Premium</span>
              )}
              <span className="text-[11px] font-medium text-[#9CA3AF]">{summary.total_compared} enquetes comparadas</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-4 text-center">
          <div>
            <div className="text-3xl font-black tracking-[-0.03em] text-[#111827]">{summary.total_compared}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Total</div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-[-0.03em] text-[#16C45B]">{summary.agreements}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Iguais</div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-[-0.03em] text-[#EF4444]">{summary.differences}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Diferentes</div>
          </div>
        </div>
      </section>

      {/* Agreements */}
      {agreements.length > 0 && (
        <section className="rounded-2xl bg-white px-5 py-4 ring-1 ring-black/[0.04] shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#16C45B]" />
            <h3 className="text-[13px] font-black text-[#111827]">Vocês pensaram igual</h3>
            <span className="ml-auto text-[11px] font-black text-[#16C45B]">{agreements.length}</span>
          </div>
          <div className="space-y-2">
            {agreements.map((agreement) => (
              <div key={agreement.poll_id} className="rounded-xl bg-[#F0FDF4] px-4 py-3 ring-1 ring-[#16C45B]/15">
                <div className="text-[11px] font-semibold text-[#6B7280]">{agreement.question}</div>
                <div className="mt-1 text-[12px] font-black text-[#16C45B]">Ambos: {agreement.option_text}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Differences */}
      {differences.length > 0 && (
        <section className="rounded-2xl bg-white px-5 py-4 ring-1 ring-black/[0.04] shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-[#EF4444]" />
            <h3 className="text-[13px] font-black text-[#111827]">Vocês divergiram</h3>
            <span className="ml-auto text-[11px] font-black text-[#EF4444]">{differences.length}</span>
          </div>
          <div className="space-y-2">
            {differences.map((difference) => (
              <div key={difference.poll_id} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/[0.04]">
                <div className="text-[11px] font-semibold text-[#6B7280]">{difference.question}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="min-w-0 overflow-hidden rounded-lg bg-white px-3 py-2 ring-1 ring-[#6C3BFF]/20">
                    <div className="text-[9px] font-black uppercase tracking-wide text-[#6C3BFF]">Você</div>
                    <div className="mt-0.5 break-words text-[11px] font-bold text-[#111827]">{difference.user_option_text}</div>
                  </div>
                  <div className="min-w-0 overflow-hidden rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="truncate text-[9px] font-black uppercase tracking-wide text-[#9CA3AF]">{friend_profile.username}</div>
                    <div className="mt-0.5 break-words text-[11px] font-bold text-[#111827]">{difference.friend_option_text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No data */}
      {agreements.length === 0 && differences.length === 0 && (
        <section className="rounded-2xl bg-white px-5 py-10 ring-1 ring-black/[0.04] shadow-sm text-center">
          <Users className="h-10 w-10 mx-auto mb-4 text-slate-300" />
          <h3 className="text-[14px] font-black text-[#111827]">Sem dados para comparar</h3>
          <p className="mt-2 text-[12px] font-medium text-[#9CA3AF]">
            {summary.message || 'Vocês ainda não votaram nas mesmas enquetes.'}
          </p>
          <button className="mt-5 rounded-2xl bg-[#6C3BFF] px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)] hover:bg-[#5B2FE5] transition" onClick={() => router.push('/')}>
            Votar em Enquetes
          </button>
        </section>
      )}

    </div>
  )
}
