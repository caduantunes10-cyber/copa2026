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
    <div className="relative flex min-h-[160px] items-center overflow-hidden rounded-[24px] bg-white px-6 shadow-[0_4px_24px_rgba(15,23,42,0.07)] ring-1 ring-[#EAECF0] sm:min-h-[180px] sm:rounded-[28px] sm:px-8 lg:min-h-[200px]">
      <div className="pointer-events-none absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-[#5B4BFF] to-[#18C964]" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5B4BFF]/[0.05]" />
      <div className="pointer-events-none absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-[#18C964]/[0.06]" />
      <div className="relative flex-1 py-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#5B4BFF]/[0.08] px-3 py-1 text-[11px] font-semibold text-[#5B4BFF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#18C964]" />
          Copa do Mundo 2026
        </div>
        <h1 className="mt-2 text-[22px] font-[800] leading-[1.2] tracking-[-0.03em] text-[#0F172A] sm:text-[26px] lg:text-[30px]">
          Descubra quem pensa<br className="hidden sm:block" /> como você.
        </h1>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#667085] sm:text-[15px]">
          Vote nas discussões da Copa e compare opiniões com seus amigos.
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-0 right-6 hidden select-none sm:block" aria-hidden="true">
        <div className="relative">
          <div className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-full bg-[#5B4BFF]/[0.07]" />
          <div className="pointer-events-none absolute -right-2 bottom-6 h-10 w-10 rounded-full bg-[#18C964]/[0.09]" />
          <span className="relative block text-[130px] leading-none lg:text-[150px]">🏆</span>
        </div>
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

  const featuredPoll = pollsReady && !isHydratingVotes && polls.length > 0 ? polls[0] : null

  return (
    <div className="pb-10 lg:pb-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

        <main className="min-w-0 space-y-5">
          <HeroSection />
          {featuredPoll && (
            <FeaturedPollCard poll={featuredPoll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} onVote={handlePollVote} />
          )}
          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />

          <div className="grid gap-4 lg:hidden">
            <FriendsCtaCard />
            <PremiumCtaCard />
          </div>
        </main>

        <aside className="hidden space-y-4 lg:block">
          <FriendsCtaCard />
          <PremiumCtaCard />
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
    <section className="overflow-hidden rounded-[28px] bg-[#F4FFF7] p-6 ring-1 ring-[#D6F5E3] shadow-[0_12px_40px_rgba(24,201,100,0.08)] sm:p-8 lg:min-h-[420px]">
      <div className="mb-5 flex items-center justify-between">
        <span className="inline-flex h-[28px] items-center rounded-full bg-[#ECFDF3] px-3 text-[12px] font-bold text-[#16A34A] ring-1 ring-[#D9F4E5]">🔥 ENQUETE EM DESTAQUE</span>
        {voted && <span className="inline-flex h-6 items-center rounded-full bg-[#ECFDF3] px-[10px] text-[11px] font-semibold text-[#16A34A]">✓ Votado</span>}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="hidden shrink-0 lg:flex lg:flex-col lg:justify-center">
          <div className="flex h-[200px] w-[220px] items-center justify-center rounded-[20px]" style={{ background: 'linear-gradient(135deg, #EEF7FF, #F3FFF6)' }} aria-hidden="true">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="38" fill="#18C964" fillOpacity="0.10" />
              <circle cx="50" cy="50" r="27" fill="#18C964" fillOpacity="0.16" />
              <circle cx="50" cy="50" r="38" stroke="#18C964" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />
              <path d="M50 25C36.2 25 25 36.2 25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50C75 36.2 63.8 25 50 25Z" fill="white" stroke="#18C964" strokeWidth="1.8"/>
              <path d="M50 25L54.5 36L50 40L45.5 36L50 25Z" fill="#18C964" fillOpacity="0.55"/>
              <path d="M75 50L64.5 46L62.5 50L64.5 54L75 50Z" fill="#18C964" fillOpacity="0.55"/>
              <path d="M25 50L35.5 54L37.5 50L35.5 46L25 50Z" fill="#18C964" fillOpacity="0.55"/>
              <path d="M57.5 67.5L54 58L50 59L46 58L42.5 67.5L50 71L57.5 67.5Z" fill="#18C964" fillOpacity="0.55"/>
              <path d="M37.5 32.5L41.5 42L45.5 40L45.5 36L37.5 32.5Z" fill="#5B4BFF" fillOpacity="0.28"/>
              <path d="M62.5 32.5L54.5 36L54.5 40L58.5 42L62.5 32.5Z" fill="#5B4BFF" fillOpacity="0.28"/>
              <path d="M64.5 54L58.5 56.5L57.5 61L62 65.5L64.5 54Z" fill="#5B4BFF" fillOpacity="0.28"/>
              <path d="M35.5 54L38 65.5L42.5 61L41.5 56.5L35.5 54Z" fill="#5B4BFF" fillOpacity="0.28"/>
              <circle cx="50" cy="50" r="7" fill="#18C964" fillOpacity="0.55"/>
              <circle cx="50" cy="50" r="3" fill="#18C964"/>
            </svg>
          </div>
        </div>
        <div className="flex flex-1 min-w-0 flex-col justify-center">
          <p className="mb-5 text-[24px] font-[800] leading-[1.15] text-[#0F172A] sm:text-[28px] lg:text-[32px]">{poll.question}</p>
          <div className="space-y-2.5">
            {voted ? (
              poll.options.map((option, optionIndex) => {
                const label = typeof option === 'string' ? option : option.label
                const count = results[optionIndex] || 0
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const selected = selectedPollOptions[poll.id] === optionIndex
                return (
                  <div key={`feat-${poll.id}-${optionIndex}`} className={`flex h-12 flex-col justify-center rounded-[14px] px-4 ring-1 ${selected ? 'bg-[#ECFDF3] text-[#16A34A] ring-[#16A34A]/25 font-semibold' : 'bg-white text-[#374151] ring-[#EAECF0] font-medium'}`}>
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="truncate">{label}</span>
                      <span className="shrink-0 tabular-nums text-[12px] font-semibold text-[#667085]">{percentage}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-[#EAECF0]">
                      <div className={`h-full rounded-full transition-all duration-500 ${selected ? 'bg-[#18C964]' : 'bg-[#5B4BFF]/40'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              poll.options.map((option, optionIndex) => {
                const label = typeof option === 'string' ? option : option.label
                return (
                  <button key={`feat-${poll.id}-${optionIndex}`} onClick={() => onVote(poll, optionIndex)}
                    className="flex h-12 w-full items-center rounded-[14px] bg-white px-4 text-left text-[14px] font-semibold text-[#374151] ring-1 ring-[#EAECF0] transition-all hover:bg-[#F5F3FF] hover:text-[#5B4BFF] hover:ring-[#5B4BFF]/20 active:scale-[0.99]">
                    {label}
                  </button>
                )
              })
            )}
          </div>
          {voted && totalVotes > 0 && (
            <p className="mt-3 text-[12px] text-[#667085]">{totalVotes.toLocaleString('pt-BR')} votos totais</p>
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
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] ring-1 ring-[#EAECF0]">
      <div className="border-b border-[#EAECF0] px-5 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[18px] font-bold text-[#0F172A]">Enquetes do dia</h2>
          {pollsReady && !isHydratingVotes && polls.length > 0 && (
            <span className="text-[12px] font-medium text-[#667085]">{polls.length} discussões ativas</span>
          )}
        </div>
      </div>
      <div className="p-4">
      {!pollsReady || isHydratingVotes ? (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-[18px] bg-[#F8F9FA] p-4 ring-1 ring-[#EAECF0]">
              <div className="mb-3 flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-[12px] bg-slate-200" />
                <div className="flex-1 pt-1">
                  <div className="mb-1.5 h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-3/5 rounded bg-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-9 rounded-[10px] bg-slate-200" />
                <div className="h-9 rounded-[10px] bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {polls.map((poll) => (
          <div key={poll.id} className="rounded-[20px] bg-white p-4 ring-1 ring-[#EAECF0] shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col gap-3 transition-shadow hover:shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-3">
              <div className="shrink-0 grid h-10 w-10 place-items-center rounded-[14px] bg-[#F0FDF4] text-[18px] leading-none select-none" aria-hidden="true">⚽</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-bold leading-[20px] text-[#0F172A]">{poll.question}</p>
                  {votedPolls.has(poll.id) && (
                    <span className="shrink-0 inline-flex h-6 items-center rounded-full bg-[#ECFDF3] px-[10px] text-[11px] font-semibold text-[#16A34A]">✓ Votado</span>
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
                            <div key={`${poll.id}-${optionIndex}`} className={`flex h-9 flex-col justify-center rounded-[10px] px-3 text-[12px] ring-1 ${selected ? 'bg-[#ECFDF3] text-[#16A34A] ring-[#16A34A]/20 font-semibold' : 'bg-white text-[#374151] ring-[#EAECF0] font-medium'}`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate">{label}</span>
                                <span className="shrink-0 tabular-nums text-[11px] text-[#667085]">{percentage}%</span>
                              </div>
                              <div className="mt-0.5 h-1 rounded-full bg-[#EAECF0]">
                                <div className={`h-full rounded-full transition-all duration-500 ${selected ? 'bg-[#18C964]' : 'bg-[#5B4BFF]/40'}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-[11px] text-[#667085]">{totalVotes.toLocaleString('pt-BR')} votos</p>
                      </div>
                    )
                  })()
                )
              ) : (
                poll.options.map((option, optionIndex) => {
                  const label = typeof option === 'string' ? option : option.label
                  return (
                    <button key={`${poll.id}-${optionIndex}`} onClick={() => onVote(poll, optionIndex)}
                      className="flex h-9 w-full items-center rounded-[10px] bg-white px-3 text-left text-[12px] font-medium text-[#374151] ring-1 ring-[#EAECF0] transition-all hover:bg-[#F5F3FF] hover:text-[#5B4BFF] hover:ring-[#5B4BFF]/20 active:scale-[0.99]">
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

function FriendsCtaCard() {
  return (
    <section className="relative overflow-hidden rounded-[28px] p-6 shadow-[0_4px_20px_rgba(4,17,34,0.20)]" style={{ background: 'linear-gradient(135deg, #041122, #081E39)' }}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.03]" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#18C964]/[0.05]" />
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white/[0.08]">
          <Users className="h-4.5 w-4.5 text-[#18C964]" />
        </span>
        <div>
          <h3 className="text-[15px] font-bold leading-none text-white">Atividade dos Amigos</h3>
          <p className="mt-0.5 text-[11px] text-white/40">Veja quem votou</p>
        </div>
      </div>
      <p className="mb-5 text-[12px] leading-relaxed text-white/50">Descubra com quem você concorda e compare opiniões em tempo real.</p>
      <Link href="/amigos" className="flex h-[52px] items-center justify-center rounded-[16px] bg-[#18C964] text-[13px] font-bold text-white transition hover:bg-[#15b358] active:scale-[0.98]">
        Ver atividade
      </Link>
    </section>
  )
}

function PremiumCtaCard() {
  return (
    <section className="relative overflow-hidden rounded-[28px] p-6 shadow-[0_4px_20px_rgba(91,75,255,0.22)]" style={{ background: 'linear-gradient(135deg, #7B61FF, #5B4BFF)' }}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute left-0 bottom-0 h-20 w-20 rounded-full bg-white/[0.03]" />
      <div className="relative">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-2.5 py-1">
          <Crown className="h-3 w-3 text-white" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">Premium</span>
        </div>
        <h3 className="mt-2 text-[15px] font-bold leading-snug text-white">Compatibilidade de opiniões</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">Veja em % o quanto você e um amigo votaram igual.</p>
        <Link href="/premium" className="mt-5 flex h-[52px] items-center justify-center rounded-[16px] bg-white text-[13px] font-bold text-[#5B4BFF] transition hover:bg-white/95 active:scale-[0.98]">
          Comparar agora
        </Link>
      </div>
    </section>
  )
}

