'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Crown, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'


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
    <div className="relative overflow-hidden rounded-[20px] bg-white px-5 py-4 shadow-[0_2px_12px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.05]">
      <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full rounded-t-[20px] bg-gradient-to-r from-[#6C3BFF] to-[#16C45B]" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#6C3BFF]/[0.04]" />
      <div className="pointer-events-none absolute -bottom-6 right-10 h-20 w-20 rounded-full bg-[#16C45B]/[0.04]" />
      <div className="relative">
        <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6C3BFF]">
          <span className="h-1 w-1 rounded-full bg-[#6C3BFF]" />
          Copa do Mundo 2026
        </div>
        <h1 className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-[#111827] sm:text-[22px]">
          Descubra quem pensa como você.
        </h1>
        <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[#9CA3AF]">
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

  return (
    <div className="pb-10 lg:pb-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">

        <main className="min-w-0 space-y-3">
          <HeroSection />
          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />

          <div className="mt-4 grid gap-3 lg:hidden">
            <FriendsCtaCard />
            <PremiumCtaCard />
            <ComoFuncionaCard />
          </div>
        </main>

        <aside className="hidden space-y-3 lg:block">
          <FriendsCtaCard />
          <PremiumCtaCard />
          <ComoFuncionaCard />
        </aside>

      </div>
    </div>
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
    <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.05]">
      <div className="border-b border-black/[0.04] px-4 py-3">
        <h2 className="text-[13px] font-semibold text-[#111827]">Enquetes do dia</h2>
      </div>
      <div className="p-3">
      {!pollsReady || isHydratingVotes ? (
        <div className="grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse rounded-xl bg-[#FAFBFD] p-3 ring-1 ring-black/[0.04]">
              <div className="mb-2.5 h-3.5 w-4/5 rounded-md bg-slate-200" />
              <div className="mb-2 h-2.5 w-1/3 rounded-md bg-slate-100" />
              <div className="space-y-1.5">
                <div className="h-7 rounded-lg bg-slate-100" />
                <div className="h-7 rounded-lg bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {polls.map((poll) => (
          <div key={poll.id} className="rounded-[14px] bg-[#FAFBFD] p-3 ring-1 ring-black/[0.05] flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-semibold leading-snug text-[#111827]">{poll.question}</p>
              {votedPolls.has(poll.id) && (
                <span className="shrink-0 text-[10px] font-semibold text-[#16C45B]">✓</span>
              )}
            </div>
            <div className="grid gap-1">
              {votedPolls.has(poll.id) ? (
                resultsLoading.has(poll.id) ? (
                  <p className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#6B7280] ring-1 ring-[#EEF0F4]">Carregando resultados...</p>
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
                            <div key={`${poll.id}-${optionIndex}`} className={`rounded-lg px-2.5 py-1.5 text-[12px] ring-1 ${selected ? 'bg-[#EDFFF5] text-[#16C45B] ring-[#16C45B]/20 font-semibold' : 'bg-white text-[#374151] ring-[#E5E7EB] font-medium'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{label}</span>
                                <span className="shrink-0 tabular-nums text-[11px]">{percentage}%</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-black/[0.05]">
                                <div className={`h-full rounded-full transition-all duration-500 ${selected ? 'bg-[#16C45B]' : 'bg-[#6C3BFF]/50'}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-[11px] text-[#9CA3AF]">{totalVotes.toLocaleString('pt-BR')} votos</p>
                      </div>
                    )
                  })()
                )
              ) : (
                poll.options.map((option, optionIndex) => {
                  const label = typeof option === 'string' ? option : option.label
                  return (
                    <button key={`${poll.id}-${optionIndex}`} onClick={() => onVote(poll, optionIndex)}
                      className="w-full rounded-lg bg-white px-2.5 py-1.5 text-left text-[12px] font-medium text-[#374151] ring-1 ring-[#E5E7EB] transition-all hover:bg-[#F5F3FF] hover:text-[#6C3BFF] hover:ring-[#6C3BFF]/20 active:scale-[0.98]">
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
        <p className="text-[12px] font-semibold text-[#9CA3AF] py-2">Nenhuma enquete ativa no momento.</p>
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
    <section className="rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.05] shadow-[0_2px_8px_rgba(17,24,39,0.04)]">
      <div className="mb-2.5 text-[11px] font-semibold text-[#9CA3AF]">Como funciona</div>
      <div className="space-y-2">
        {steps.map(s => (
          <div key={s.n} className="flex items-start gap-2">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#6C3BFF]/[0.08] text-[9px] font-bold text-[#6C3BFF]">{s.n}</span>
            <span className="text-[12px] font-medium leading-snug text-[#374151]">{s.text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FriendsCtaCard() {
  return (
    <section className="rounded-[18px] bg-white p-3.5 ring-1 ring-black/[0.05] shadow-[0_2px_8px_rgba(17,24,39,0.04)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#F0FDF4]">
          <Users className="h-3.5 w-3.5 text-[#16C45B]" />
        </span>
        <h3 className="text-[12px] font-semibold text-[#111827]">Amigos</h3>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-[#9CA3AF]">Veja o que seus amigos votaram e descubra com quem você pensa igual.</p>
      <Link href="/amigos" className="flex items-center justify-center rounded-[10px] bg-[#111827] py-2 text-[11px] font-semibold text-white transition hover:bg-[#1f2937] active:scale-[0.98]">
        Ver atividade
      </Link>
    </section>
  )
}

function PremiumCtaCard() {
  return (
    <section className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#6C3BFF] to-[#5B32D6] p-3.5 ring-1 ring-white/[0.08] shadow-[0_6px_20px_rgba(108,59,255,0.18)]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/[0.05]" />
      <div className="relative">
        <div className="mb-1 flex items-center gap-1.5">
          <Crown className="h-3 w-3 text-white/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Premium</span>
        </div>
        <h3 className="text-[13px] font-semibold leading-snug text-white">Compatibilidade de opiniões</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">Veja em % o quanto você e um amigo votaram igual.</p>
        <Link href="/premium" className="mt-3 flex items-center justify-center rounded-[10px] bg-white py-2 text-[11px] font-semibold text-[#6C3BFF] transition hover:bg-white/95 active:scale-[0.98]">
          Comparar agora
        </Link>
      </div>
    </section>
  )
}

