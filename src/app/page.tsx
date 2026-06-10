'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Activity, BarChart3, Crown, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FeedActivity } from '@/types'


type HomePoll = {
  id: string
  question: string
  options: Array<{ label: string } | string>
}

type PollResults = Record<string, Record<number, number>>
type SelectedPollOptions = Record<string, number>

const HOME_POLLS_LIMIT = 25



function HeroSection() {
  return (
    <div
      className="relative flex items-center overflow-hidden rounded-[28px] px-8 shadow-[0_25px_60px_rgba(15,23,42,0.18)] sm:px-12 lg:px-[48px]"
      style={{ height: '280px' }}
    >
      {/* Stadium background image */}
      <img
        src="/stadium.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Dark overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(0,40,25,.92) 0%, rgba(0,40,25,.75) 30%, rgba(0,0,0,.45) 100%)' }}
      />
      {/* Content */}
      <div className="relative max-w-[520px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.15] bg-white/[0.10] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
          Copa do Mundo 2026
        </div>
        <h1 className="text-[38px] font-[700] leading-[1.05] tracking-[-0.05em] text-white sm:text-[46px] lg:text-[52px]">
          Descubra quem pensa<br /> como você.
        </h1>
        <p className="mt-4 text-[15px] font-[400] leading-[1.6] text-white/[0.86]">
          Vote nas discussões da Copa e compare opiniões com seus amigos.
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [polls, setPolls] = useState<HomePoll[]>([])
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set())
  const [selectedPollOptions, setSelectedPollOptions] = useState<SelectedPollOptions>({})
  const [pollResults, setPollResults] = useState<PollResults>({})
  const [resultsLoading, setResultsLoading] = useState<Set<string>>(new Set())
  const [isHydratingVotes, setIsHydratingVotes] = useState(true)
  const [pollsReady, setPollsReady] = useState(false)
  const [friendFeed, setFriendFeed] = useState<FeedActivity[]>([])
  const latestPollHydrationRequest = useRef(0)
  const supabase = createClient()

  useEffect(() => {
    async function loadPolls() {
      const requestId = Date.now()
      latestPollHydrationRequest.current = requestId
      setPollsReady(false)
      setIsHydratingVotes(true)
      setVotedPolls(new Set())
      setSelectedPollOptions({})
      console.log('[Home polls] query is running on:', typeof window === 'undefined' ? 'server' : 'client')

      const { data: authData, error: authError } = await supabase.auth.getUser()
      console.log('[Home polls] authenticated user:', authData.user?.id || null)
      console.log('[Home polls] auth error:', authError)

      const readable = await supabase
        .from('polls')
        .select('id', { count: 'exact', head: true })
      console.log('[Home polls] readable polls count:', readable.count)
      console.log('[Home polls] readable polls error:', readable.error)

      const result = await supabase
        .from('polls')
        .select('id, question, options')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(HOME_POLLS_LIMIT)

      console.log('[Home polls] active polls data:', result.data)
      console.log('[Home polls] active polls error:', result.error)
      console.log('[Home polls] active polls count:', result.data?.length || 0)
      console.log('[Home polls] setPolls payload:', result.data || [])
      console.log('[Home polls] setPolls payload length:', (result.data || []).length)

      const loadedPolls = (result.data || []) as HomePoll[]
      let nextResults: PollResults = {}
      let nextVotedPolls = new Set<string>()
      let nextSelectedOptions: SelectedPollOptions = {}

      if (result.data?.length) {
        const pollIds = result.data.map(poll => poll.id)
        const votesResult = await supabase
          .from('poll_votes')
          .select('poll_id, option_index')
          .in('poll_id', pollIds)

        console.log('[Home poll results] votes data:', votesResult.data)
        console.log('[Home poll results] votes error:', votesResult.error)

        if (votesResult.data) {
          nextResults = votesResult.data.reduce<PollResults>((acc, vote) => {
            acc[vote.poll_id] = acc[vote.poll_id] || {}
            acc[vote.poll_id][vote.option_index] = (acc[vote.poll_id][vote.option_index] || 0) + 1
            return acc
          }, {})
        }
      }

      if (authData.user && result.data?.length) {
        const pollIds = result.data.map(poll => poll.id)
        const existingVotes = await supabase
          .from('poll_votes')
          .select('poll_id, option_index')
          .eq('user_id', authData.user.id)
          .in('poll_id', pollIds)

        console.log('[Home poll vote] existing votes data:', existingVotes.data)
        console.log('[Home poll vote] existing votes error:', existingVotes.error)

        if (existingVotes.data) {
          nextVotedPolls = new Set(existingVotes.data.map(vote => vote.poll_id))
          nextSelectedOptions = existingVotes.data.reduce<SelectedPollOptions>((acc, vote) => {
            acc[vote.poll_id] = vote.option_index
            return acc
          }, {})
        }
      }

      if (latestPollHydrationRequest.current !== requestId) return

      setPolls(loadedPolls)
      setPollResults(nextResults)
      setResultsLoading(new Set())
      setVotedPolls(nextVotedPolls)
      setSelectedPollOptions(nextSelectedOptions)
      setIsHydratingVotes(false)
      setPollsReady(true)
    }

    loadPolls()

    async function loadFeed() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch('/api/friends?type=feed')
      if (!res.ok) return
      const json = await res.json()
      const items: FeedActivity[] = (json.feed || [])
        .filter((item: FeedActivity) => item.action_type === 'poll_vote')
        .slice(0, 5)
      setFriendFeed(items)
    }
    loadFeed()
  }, [])

  useEffect(() => {
    console.log('[Home polls] polls state after update:', polls)
    console.log('[Home polls] polls state length after update:', polls.length)
  }, [polls])

  async function handlePollVote(poll: HomePoll, optionIndex: number) {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[Home poll vote] clicked poll id:', poll.id)
    console.log('[Home poll vote] clicked option index:', optionIndex)
    console.log('[Home poll vote] authenticated user id:', user?.id || null)

    if (!user || votedPolls.has(poll.id)) {
      console.log('[Home poll vote] blocked before insert:', { hasUser: !!user, alreadyVoted: votedPolls.has(poll.id) })
      return
    }

    const payload = {
      user_id: user.id,
      poll_id: poll.id,
      option_index: optionIndex,
      created_at: new Date().toISOString(),
    }

    console.log('[Home poll vote] insert payload:', payload)

    const { data, error } = await supabase
      .from('poll_votes')
      .insert(payload)
      .select('id, user_id, poll_id, option_index, created_at')
      .single()

    console.log('[Home poll vote] insert result:', data)
    console.log('[Home poll vote] insert error:', error)

    if (!error || error.code === '23505') {
      setVotedPolls(prev => new Set([...prev, poll.id]))
      setSelectedPollOptions(prev => ({ ...prev, [poll.id]: optionIndex }))
      setPollResults(prev => ({
        ...prev,
        [poll.id]: {
          ...(prev[poll.id] || {}),
          [optionIndex]: ((prev[poll.id] || {})[optionIndex] || 0) + (error ? 0 : 1),
        },
      }))
    }
  }

  console.log('[Home] component rendered: src/app/page.tsx -> Enquetes do Dia')
  console.log('[Home polls] HomePage render polls.length:', polls.length)

  const featuredPoll = pollsReady && !isHydratingVotes && polls.length > 0 ? polls[0] : null

  return (
    <div className="pb-10 lg:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_308px]">

        <main className="min-w-0 space-y-6">
          <HeroSection />
          {featuredPoll && (
            <FeaturedPollCard poll={featuredPoll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} onVote={handlePollVote} />
          )}
          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />

          <div className="grid gap-4 lg:hidden">
            <FriendsCtaCard feed={friendFeed} />
            <PremiumCtaCard />
            <RankingCard />
            <TermometroCard />
            <EstatisticasCard />
          </div>
        </main>

        <aside className="hidden space-y-5 lg:block lg:pt-0">
          <FriendsCtaCard feed={friendFeed} />
          <PremiumCtaCard />
          <RankingCard />
          <TermometroCard />
          <EstatisticasCard />
        </aside>

      </div>
    </div>
  )
}

function FeaturedPollCard({ poll, votedPolls, selectedPollOptions, pollResults, onVote }: {
  poll: HomePoll
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  onVote: (poll: HomePoll, optionIndex: number) => void
}) {
  const results = pollResults[poll.id] || {}
  const totalVotes = Object.values(results).reduce((sum, c) => sum + c, 0)
  const voted = votedPolls.has(poll.id)
  return (
    <section className="group overflow-hidden rounded-[24px] p-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] hover:-translate-y-[2px] sm:p-8 lg:min-h-[440px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.72) 100%)', border: '1px solid rgba(22,101,52,0.12)', boxShadow: '0 18px 45px rgba(15,23,42,0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="mb-6 flex items-center justify-between">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 text-[11px] font-bold uppercase tracking-wider text-[#16A34A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
          Enquete em destaque
        </span>
        {voted && (
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#F0FDF4] px-3 text-[11px] font-semibold text-[#16A34A] ring-1 ring-[#BBF7D0]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Votado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="hidden shrink-0 lg:flex lg:flex-col lg:justify-center">
          {(() => {
            const topPct = totalVotes > 0
              ? Math.max(...poll.options.map((_, i) => Math.round(((results[i] || 0) / totalVotes) * 100)))
              : 0
            return (
              <div
                className="flex h-[220px] w-[240px] flex-col items-center justify-center gap-3 rounded-[20px]"
                style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #EFF6FF 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(34,197,94,0.12)',
                }}
              >
                <div
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <TrendingUp className="h-7 w-7 text-[#22C55E]" strokeWidth={2} />
                </div>
                <div
                  className="text-[40px] font-[700] leading-[1.1] tracking-[-0.04em] tabular-nums text-[#16A34A]"
                >
                  {totalVotes > 0 ? `${topPct}%` : '—'}
                </div>
                <p className="max-w-[160px] text-center text-[14px] font-[500] leading-snug text-[#0F172A]">
                  Concordam com esta opção
                </p>
                <p className="text-[13px] font-[400] text-[#64748B]">
                  {totalVotes > 0 ? `${totalVotes.toLocaleString('pt-BR')} votos totais` : 'Sem votos ainda'}
                </p>
              </div>
            )
          })()}
        </div>
        <div className="flex flex-1 min-w-0 flex-col justify-center">
          <p className="mb-6 text-[22px] font-[700] leading-[1.15] tracking-[-0.03em] text-[#0F172A] sm:text-[26px] lg:text-[28px]">{poll.question}</p>
          <div className="space-y-3">
            {voted ? (
              poll.options.map((option, optionIndex) => {
                const label = typeof option === 'string' ? option : option.label
                const count = results[optionIndex] || 0
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const selected = selectedPollOptions[poll.id] === optionIndex
                return (
                  <div key={`feat-${poll.id}-${optionIndex}`} className={`w-full max-w-full min-w-0 overflow-hidden rounded-[14px] px-4 py-3 ring-1 transition-all ${
                    selected
                      ? 'bg-[#F0FDF4] ring-[#22C55E]/30 shadow-[0_2px_8px_rgba(34,197,94,0.12)]'
                      : 'bg-[#F8FAFC] ring-black/[0.05]'
                  }`}>
                    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_48px] items-center gap-2">
                      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-[500] ${selected ? 'text-[#16A34A]' : 'text-[#374151]'}`}>{label}</span>
                      <span className={`w-12 shrink-0 text-right tabular-nums text-[13px] font-[400] ${selected ? 'text-[#16A34A]' : 'text-[#64748B]'}`}>{percentage}%</span>
                    </div>
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className={`h-full max-w-full rounded-full transition-all duration-700 ${selected ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A]' : 'bg-gradient-to-r from-[#93C5FD] to-[#2563EB]/60'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              poll.options.map((option, optionIndex) => {
                const label = typeof option === 'string' ? option : option.label
                return (
                  <button
                    key={`feat-${poll.id}-${optionIndex}`}
                    onClick={() => onVote(poll, optionIndex)}
                    className="flex h-12 w-full min-w-0 items-center overflow-hidden rounded-[14px] bg-[#F8FAFC] px-4 text-left text-[15px] font-[500] text-[#374151] ring-1 ring-black/[0.05] transition-all duration-200 hover:bg-[#EFF6FF] hover:text-[#1D4ED8] hover:ring-[#2563EB]/20 hover:shadow-[0_2px_8px_rgba(37,99,235,0.10)] active:scale-[0.99]">
                    {label}
                  </button>
                )
              })
            )}
          </div>
          {voted && totalVotes > 0 && (
            <p className="mt-3 text-[13px] font-[400] text-[#64748B]">{totalVotes.toLocaleString('pt-BR')} votos totais</p>
          )}
        </div>
      </div>
    </section>
  )
}

function DailyPollsCard({ polls, votedPolls, selectedPollOptions, pollResults, resultsLoading, isHydratingVotes, pollsReady, onVote }: {
  polls: HomePoll[]
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  resultsLoading: Set<string>
  isHydratingVotes: boolean
  pollsReady: boolean
  onVote: (poll: HomePoll, optionIndex: number) => void
}) {
  console.log('[Home polls] DailyPollsCard render polls.length:', polls.length)
  if (polls.length === 0) console.log('[Home polls] rendering empty branch: Nenhuma enquete ativa no momento.')

  return (
    <section className="overflow-hidden rounded-[32px] my-10" style={{ background: '#101722', padding: '32px' }}>
      <div className="mb-6 flex items-center justify-between gap-2">
        <h2 className="text-[24px] font-[700] tracking-[-0.02em] text-white">Enquetes do dia</h2>
        {pollsReady && !isHydratingVotes && polls.length > 0 && (
          <span className="text-[14px] font-[600] text-[#22C55E]">{polls.length} ativas</span>
        )}
      </div>
      <div>
      {!pollsReady || isHydratingVotes ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-[20px] p-6 min-h-[240px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="mb-3 flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-[14px] bg-slate-200" />
                <div className="flex-1 pt-1">
                  <div className="mb-1.5 h-3 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-3/5 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-9 rounded-[12px] bg-white/10" />
                <div className="h-9 rounded-[12px] bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {polls.map((poll) => (
          <div key={poll.id} className="group/card rounded-[20px] flex flex-col gap-3 transition-all duration-[180ms] ease-in-out hover:-translate-y-1" style={{ background: '#FCFCFD', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)', padding: '24px', minHeight: '240px' }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#DCFCE7] to-[#ECFDF5] shadow-[0_1px_3px_rgba(34,197,94,0.15)]" aria-hidden="true">
                <Activity className="h-[18px] w-[18px] text-[#16A34A]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[16px] font-[600] leading-[1.4] text-[#0F172A]">{poll.question}</p>
                  {votedPolls.has(poll.id) && (
                    <span className="shrink-0 inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold text-[#16A34A]" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.20)' }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.5 1.5 3.5-3" stroke="#16A34A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Votado
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              {votedPolls.has(poll.id) ? (
                resultsLoading.has(poll.id) ? (
                  <p className="rounded-[10px] bg-[#F4F6F8] px-3 py-2 text-[11px] text-[#667085]">Carregando resultados...</p>
                ) : (
                  (() => {
                    const results = pollResults[poll.id] || {}
                    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)
                    return (
                      <div className="space-y-1.5">
                        {poll.options.map((option, optionIndex) => {
                          const label = typeof option === 'string' ? option : option.label
                          const count = results[optionIndex] || 0
                          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                          const selected = selectedPollOptions[poll.id] === optionIndex
                          return (
                            <div key={`${poll.id}-${optionIndex}`} className="w-full max-w-full min-w-0 overflow-hidden rounded-[10px] px-3 py-2 transition-all" style={{ background: selected ? 'rgba(34,197,94,0.08)' : '#F8FAFC', border: selected ? '1px solid rgba(34,197,94,0.20)' : '1px solid transparent' }}>
                              <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_48px] items-center gap-2">
                                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[500] text-[#475569]">{label}</span>
                                <span className="w-12 shrink-0 text-right tabular-nums text-[13px] font-bold" style={{ color: selected ? '#16A34A' : '#64748B' }}>{percentage}%</span>
                              </div>
                              <div className="mt-1.5 w-full max-w-full overflow-hidden">
                                <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: '#E5E7EB' }}>
                                  <div
                                    className="h-full max-w-full rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%`, background: '#22C55E' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-[13px] text-[#64748B]">{totalVotes.toLocaleString('pt-BR')} votos</p>
                      </div>
                    )
                  })()
                )
              ) : (
                poll.options.map((option, optionIndex) => {
                  const label = typeof option === 'string' ? option : option.label
                  return (
                    <button key={`${poll.id}-${optionIndex}`} onClick={() => onVote(poll, optionIndex)}
                      className="flex w-full min-w-0 items-center overflow-hidden rounded-[10px] px-3 py-2.5 text-left text-[14px] font-[500] text-[#475569] transition-all duration-200 hover:text-[#0F172A] active:scale-[0.99]" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                      {label}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ))}
        </div>
      )}
      {pollsReady && !isHydratingVotes && polls.length === 0 && (
        <p className="text-[13px] font-semibold text-white/40 py-2">Nenhuma enquete ativa no momento.</p>
      )}
      </div>
    </section>
  )
}

function ComoFuncionaCard() {
  const steps = [
    { n: '1', text: 'Vote nas enquetes da Copa' },
    { n: '2', text: 'Veja o que seus amigos votaram' },
    { n: '3', text: 'Compare com Premium' },
  ]
  return (
    <section className="rounded-[18px] bg-white p-3 ring-1 ring-[#EAECF0] shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Como funciona</div>
      <div className="space-y-2">
        {steps.map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#5B4BFF]/[0.07] text-[9px] font-bold text-[#5B4BFF]">{s.n}</span>
            <span className="text-[11px] font-medium leading-snug text-[#6B7280]">{s.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function FriendsCtaCard({ feed }: { feed: FeedActivity[] }) {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      style={{ background: 'linear-gradient(145deg, #0A1628 0%, #0F2044 60%, #0D2E1A 100%)' }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)' }} />
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white/[0.08] ring-1 ring-white/[0.08]">
          <Users className="h-5 w-5 text-[#22C55E]" />
        </span>
        <div>
          <h3 className="text-[15px] font-[600] leading-none text-white">Atividade dos Amigos</h3>
          <p className="mt-0.5 text-[13px] font-[400] text-white/40">Votos mais recentes</p>
        </div>
      </div>
      {feed.length === 0 ? (
        <p className="mb-5 text-[14px] font-[400] leading-[1.6] text-white/40">Nenhuma atividade dos amigos ainda.</p>
      ) : (
        <ul className="mb-5 space-y-3">
          {feed.map(item => {
            const name = item.profile?.full_name || item.profile?.username || 'Alguém'
            const optionLabel = item.meta?.option_label as string | undefined
            const pollQuestion = item.target_name
            return (
              <li key={item.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.10] text-[11px] font-[700] text-white">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-[500] leading-snug text-white/90">
                    <span className="text-[#22C55E]">{name}</span>
                    {' votou em '}
                    {optionLabel ? (
                      <span className="font-[600] text-white">&ldquo;{optionLabel}&rdquo;</span>
                    ) : (
                      <span className="font-[600] text-white">&ldquo;{pollQuestion}&rdquo;</span>
                    )}
                  </p>
                  {optionLabel && pollQuestion && (
                    <p className="mt-0.5 truncate text-[12px] font-[400] text-white/40">{pollQuestion}</p>
                  )}
                </div>
                <span className="shrink-0 text-[11px] font-[400] text-white/30">{timeAgo(item.created_at)}</span>
              </li>
            )
          })}
        </ul>
      )}
      <Link
        href="/amigos"
        className="flex h-[44px] items-center justify-center rounded-[14px] text-[13px] font-[600] text-white shadow-[0_4px_14px_rgba(34,197,94,0.35)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(34,197,94,0.45)] hover:-translate-y-[1px] active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}
      >
        Ver todos os amigos
      </Link>
    </section>
  )
}

function PremiumCtaCard() {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] p-6 shadow-[0_8px_24px_rgba(37,99,235,0.25)]"
      style={{ background: 'linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)' }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute left-0 bottom-0 h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)' }} />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.20] bg-white/[0.12] px-3 py-1">
          <Crown className="h-3 w-3 text-yellow-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Premium</span>
        </div>
        <h3 className="text-[16px] font-[600] leading-snug text-white">Compatibilidade de opiniões</h3>
        <p className="mt-2 text-[15px] font-[400] leading-[1.6] text-white/60">Veja em % o quanto você e um amigo votaram igual.</p>
        <Link
          href="/premium"
          className="mt-5 flex h-[52px] items-center justify-center rounded-[16px] bg-white text-[13px] font-bold text-[#1D4ED8] shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.20)] hover:-translate-y-[1px] active:scale-[0.98]"
        >
          Comparar agora
        </Link>
      </div>
    </section>
  )
}

function RankingCard() {
  return (
    <section
      className="rounded-[20px] p-6"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.70) 100%)', border: '1px solid rgba(22,101,52,0.10)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', backdropFilter: 'blur(12px)' }}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'rgba(34,197,94,0.10)' }}>
          <Users className="h-[18px] w-[18px] text-[#16A34A]" strokeWidth={2} />
        </div>
        <h3 className="text-[14px] font-[600] tracking-[-0.01em] text-[#0F172A]">Ranking de Compatibilidade</h3>
      </div>
      <p className="text-[13px] font-[400] leading-[1.6] text-[#64748B]">Ranking disponível quando houver dados suficientes.</p>
    </section>
  )
}

function TermometroCard() {
  return (
    <section
      className="rounded-[24px] p-7"
      style={{
        background: 'linear-gradient(135deg, #16A34A 0%, #2563EB 100%)',
        boxShadow: '0 20px 50px rgba(37,99,235,0.22)',
      }}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <TrendingUp className="h-[22px] w-[22px] text-white" strokeWidth={2} />
      </div>
      <p className="mb-3 text-[12px] font-[500] uppercase tracking-widest text-white/70">Termômetro da Comunidade</p>
      <p className="text-[15px] font-[400] leading-[1.6] text-white/[0.85]">Dados da comunidade ainda não disponíveis.</p>
    </section>
  )
}

function EstatisticasCard() {
  return (
    <section
      className="rounded-[20px] p-6"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.70) 100%)', border: '1px solid rgba(22,101,52,0.10)', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', backdropFilter: 'blur(12px)' }}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'rgba(37,99,235,0.08)' }}>
          <BarChart3 className="h-[18px] w-[18px] text-[#2563EB]" strokeWidth={2} />
        </div>
        <h3 className="text-[14px] font-[600] tracking-[-0.01em] text-[#0F172A]">Estatísticas da Copa</h3>
      </div>
      <p className="text-[13px] font-[400] leading-[1.6] text-[#64748B]">Nenhuma estatística disponível ainda.</p>
    </section>
  )
}

