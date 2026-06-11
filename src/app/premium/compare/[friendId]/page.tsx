'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Users, CheckCircle, XCircle, TrendingUp, ChevronDown, ChevronUp, Heart, Flame, Swords } from 'lucide-react'
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
    if (score >= 90) return 'Almas futebolísticas'
    if (score >= 75) return 'Muito parecidos'
    if (score >= 50) return 'Boa sintonia'
    if (score >= 25) return 'Pensam diferente'
    return 'Rivais declarados'
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
  const topAgreement = agreements[0] ?? null
  const topDifference = differences[0] ?? null

  const scoreDiff = summary.agreements - summary.differences
  const placarLabel = scoreDiff > 0 ? 'Vocês combinam mais do que divergem' : scoreDiff < 0 ? 'Vocês divergem mais do que combinam' : 'Empate técnico'

  return (
    <ComparisonView
      compatibility_score={compatibility_score}
      friend_profile={friend_profile}
      summary={summary}
      agreements={agreements}
      differences={differences}
      limitedData={limitedData}
      scoreColors={scoreColors}
      getCompatibilityLabel={getCompatibilityLabel}
      topAgreement={topAgreement}
      topDifference={topDifference}
      placarLabel={placarLabel}
      onBack={() => router.back()}
      onGoHome={() => router.push('/')}
    />
  )
}

function ComparisonView({
  compatibility_score, friend_profile, summary, agreements, differences, limitedData,
  scoreColors, getCompatibilityLabel, topAgreement, topDifference, placarLabel, onBack, onGoHome
}: {
  compatibility_score: number
  friend_profile: FriendProfile
  summary: { total_compared: number; agreements: number; differences: number; compatibility_percentage: number; message?: string }
  agreements: Agreement[]
  differences: Difference[]
  limitedData: boolean
  scoreColors: { text: string; bg: string; ring: string; bar: string }
  getCompatibilityLabel: (n: number) => string
  topAgreement: Agreement | null
  topDifference: Difference | null
  placarLabel: string
  onBack: () => void
  onGoHome: () => void
}) {
  const [showAgreements, setShowAgreements] = useState(false)
  const [showDifferences, setShowDifferences] = useState(false)

  const card = "rounded-[24px] bg-white px-6 py-6 ring-1 ring-[#E2E8F0]"

  return (
    <div className="space-y-4 pb-28">

      {/* Back nav */}
      <button onClick={onBack} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </button>

      {/* Hero */}
      <section className="rounded-[32px] bg-white px-8 py-10 text-center ring-1 ring-[#E2E8F0]" style={{ boxShadow: '0 2px 16px rgba(15,23,42,0.06)' }}>
        <div className="mb-1 text-[13px] font-[500] tracking-[-0.01em] text-[#64748B]">Compatibilidade de opiniões</div>
        <div className="mt-2 text-[72px] font-[700] leading-none tracking-[-0.05em] text-[#0F172A]">
          {compatibility_score}%
        </div>
        <div className="mt-3 text-[20px] font-[600] tracking-[-0.02em] text-[#5B2FE5]">
          {getCompatibilityLabel(compatibility_score)}
        </div>
        <div className="mt-2 text-[16px] font-[400] text-[#64748B]">
          {summary.total_compared} opiniões comparadas
        </div>
        {limitedData && (
          <div className="mt-3 text-[12px] font-[500] text-[#94A3B8]">Baseado em dados parciais</div>
        )}
      </section>

      {/* Friend header */}
      <section className={card}>
        <div className="flex min-w-0 items-center gap-4">
          {friend_profile.avatar_url ? (
            <img src={friend_profile.avatar_url} alt={friend_profile.username} className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1EDFF] text-[15px] font-[700] text-[#5B2FE5]">
              {friend_profile.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[17px] font-[600] tracking-[-0.02em] text-[#0F172A]">{friend_profile.username}</span>
              {friend_profile.is_premium && (
                <span className="shrink-0 rounded-full bg-[#F1EDFF] px-2 py-0.5 text-[10px] font-[700] text-[#5B2FE5]">Premium</span>
              )}
            </div>
            <div className="mt-1 text-[13px] font-[400] text-[#64748B]">
              {summary.total_compared} comparadas · {summary.agreements} iguais · {summary.differences} diferentes
            </div>
          </div>
        </div>
      </section>

      {/* Scoreboard */}
      {summary.total_compared > 0 && (
        <section className={`${card} text-center`}>
          <div className="mb-1 text-[13px] font-[500] text-[#64748B]">Placar da amizade</div>
          <div className="mt-3 flex items-center justify-center gap-4">
            <div>
              <div className="text-[48px] font-[700] leading-none tracking-[-0.04em] text-[#0F172A]">{summary.agreements}</div>
              <div className="mt-1 text-[12px] font-[500] text-[#64748B]">concordâncias</div>
            </div>
            <div className="text-[32px] font-[300] text-[#CBD5E1]">—</div>
            <div>
              <div className="text-[48px] font-[700] leading-none tracking-[-0.04em] text-[#0F172A]">{summary.differences}</div>
              <div className="mt-1 text-[12px] font-[500] text-[#64748B]">divergências</div>
            </div>
          </div>
          <div className="mt-4 text-[16px] font-[400] text-[#64748B]">{placarLabel}</div>
        </section>
      )}

      {/* Maior conexão */}
      {topAgreement && (
        <section className={card}>
          <div className="mb-4 text-[20px] font-[700] tracking-[-0.02em] text-[#0F172A]">❤️ Maior conexão</div>
          <div className="text-[16px] font-[500] leading-snug text-[#64748B]">{topAgreement.question}</div>
          <div className="mt-3 text-[18px] font-[600] leading-snug tracking-[-0.01em] text-[#0F172A]">{topAgreement.option_text}</div>
          <div className="mt-1 text-[13px] font-[400] text-[#94A3B8]">Vocês dois escolheram esta opção</div>
        </section>
      )}

      {/* Maior batalha */}
      {topDifference && (
        <section className={card}>
          <div className="mb-4 text-[20px] font-[700] tracking-[-0.02em] text-[#0F172A]">🔥 Maior batalha</div>
          <div className="text-[16px] font-[500] leading-snug text-[#64748B]">{topDifference.question}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 text-[11px] font-[600] uppercase tracking-wide text-[#5B2FE5]">Você</div>
              <div className="text-[15px] font-[600] leading-snug text-[#0F172A]">{topDifference.user_option_text}</div>
            </div>
            <div>
              <div className="mb-1.5 truncate text-[11px] font-[600] uppercase tracking-wide text-[#94A3B8]">{friend_profile.username}</div>
              <div className="text-[15px] font-[600] leading-snug text-[#0F172A]">{topDifference.friend_option_text}</div>
            </div>
          </div>
        </section>
      )}

      {/* Accordion: Agreements */}
      {agreements.length > 0 && (
        <section className="rounded-[24px] bg-white ring-1 ring-[#E2E8F0] overflow-hidden">
          <button
            onClick={() => setShowAgreements(v => !v)}
            className="flex w-full items-center gap-3 px-6 py-5 text-left transition hover:bg-[#FAFAFA]"
          >
            <span className="text-[16px]">❤️</span>
            <span className="flex-1 text-[15px] font-[600] tracking-[-0.01em] text-[#0F172A]">
              Ver concordâncias
              <span className="ml-2 text-[13px] font-[400] text-[#94A3B8]">{agreements.length}</span>
            </span>
            {showAgreements
              ? <ChevronUp className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              : <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />}
          </button>
          {showAgreements && (
            <div className="divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
              {agreements.map((agreement) => (
                <div key={agreement.poll_id} className="px-6 py-4">
                  <div className="text-[13px] font-[400] text-[#64748B]">{agreement.question}</div>
                  <div className="mt-1.5 text-[15px] font-[600] text-[#0F172A]">{agreement.option_text}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Accordion: Differences */}
      {differences.length > 0 && (
        <section className="rounded-[24px] bg-white ring-1 ring-[#E2E8F0] overflow-hidden">
          <button
            onClick={() => setShowDifferences(v => !v)}
            className="flex w-full items-center gap-3 px-6 py-5 text-left transition hover:bg-[#FAFAFA]"
          >
            <span className="text-[16px]">🔥</span>
            <span className="flex-1 text-[15px] font-[600] tracking-[-0.01em] text-[#0F172A]">
              Ver divergências
              <span className="ml-2 text-[13px] font-[400] text-[#94A3B8]">{differences.length}</span>
            </span>
            {showDifferences
              ? <ChevronUp className="h-4 w-4 shrink-0 text-[#94A3B8]" />
              : <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />}
          </button>
          {showDifferences && (
            <div className="divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
              {differences.map((difference) => (
                <div key={difference.poll_id} className="px-6 py-4">
                  <div className="text-[13px] font-[400] text-[#64748B]">{difference.question}</div>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 text-[11px] font-[600] uppercase tracking-wide text-[#5B2FE5]">Você</div>
                      <div className="text-[14px] font-[600] leading-snug text-[#0F172A]">{difference.user_option_text}</div>
                    </div>
                    <div>
                      <div className="mb-1 truncate text-[11px] font-[600] uppercase tracking-wide text-[#94A3B8]">{friend_profile.username}</div>
                      <div className="text-[14px] font-[600] leading-snug text-[#0F172A]">{difference.friend_option_text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* No data */}
      {agreements.length === 0 && differences.length === 0 && (
        <section className="rounded-[24px] bg-white px-6 py-12 ring-1 ring-[#E2E8F0] text-center">
          <Users className="h-10 w-10 mx-auto mb-4 text-[#CBD5E1]" />
          <h3 className="text-[17px] font-[600] tracking-[-0.02em] text-[#0F172A]">Sem dados para comparar</h3>
          <p className="mt-2 text-[15px] font-[400] text-[#64748B]">
            {summary.message || 'Vocês ainda não votaram nas mesmas enquetes.'}
          </p>
          <button
            className="mt-6 rounded-full bg-[#5B2FE5] px-6 py-3 text-[14px] font-[600] text-white transition hover:bg-[#4c27c4] active:scale-[0.98]"
            onClick={onGoHome}
          >
            Votar em Enquetes
          </button>
        </section>
      )}

    </div>
  )
}
