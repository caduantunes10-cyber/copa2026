'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'


type HomePoll = {
  id: string
  question: string
  options: Array<{ label: string } | string>
}

type PollResults = Record<string, Record<number, number>>
type SelectedPollOptions = Record<string, number>

const HOME_POLLS_LIMIT = 25


function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <section className={`rounded-[22px] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03] ${className}`}>{children}</section>
}

function SectionHeader({ title, action }: { title: string, action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[13px] font-black uppercase tracking-[0.04em] text-[#111827]">{title}</h2>
      {action && <span className="text-[10px] font-black uppercase text-[#6B7280]">{action}</span>}
    </div>
  )
}

function Avatar({ label, green = false }: { label: string, green?: boolean }) {
  return <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black text-white ${green ? 'bg-[#16C45B]' : 'bg-gradient-to-br from-[#6C3BFF] to-[#16C45B]'}`}>{label}</div>
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">

        <main className="space-y-4">
          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />

          <div className="lg:hidden space-y-4">
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
    <Card className="p-5">
      <SectionHeader title="Enquetes do Dia" action="Votar agora" />
      {!pollsReady || isHydratingVotes ? (
        <p className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#6B7280] ring-1 ring-[#EEF0F4]">Carregando...</p>
      ) : (
        <div className="space-y-4">
        {polls.map((poll, index) => (
          <div key={poll.id} className="rounded-2xl bg-[#FBFCFE] p-3 ring-1 ring-black/[0.03]">
            <p className="text-[12px] font-black leading-5 text-[#111827]">{poll.question}</p>
            <div className="mt-3 grid gap-2">
              {votedPolls.has(poll.id) ? (
                resultsLoading.has(poll.id) ? (
                  <p className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#6B7280] ring-1 ring-[#EEF0F4]">Carregando resultados...</p>
                ) : (
                  (() => {
                    const results = pollResults[poll.id] || {}
                    const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

                    return (
                      <div className="space-y-2">
                        {poll.options.map((option, optionIndex) => {
                          const label = typeof option === 'string' ? option : option.label
                          const count = results[optionIndex] || 0
                          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                          const selected = selectedPollOptions[poll.id] === optionIndex

                          return (
                            <div key={`${poll.id}-${optionIndex}`} className={`rounded-xl px-3 py-2 text-[11px] font-black ring-1 ${selected ? 'bg-[#E8FFF0] text-[#16C45B] ring-[#16C45B]/20' : 'bg-white text-[#111827] ring-[#EEF0F4]'}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span>{label}</span>
                                <span>{percentage}% ({count} votos)</span>
                              </div>
                              <div className="mt-2 h-1.5 rounded-full bg-[#EEF0F4]">
                                <div className={`h-full rounded-full ${selected ? 'bg-[#16C45B]' : 'bg-[#6C3BFF]'}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          )
                        })}
                        <p className="text-[10px] font-black uppercase text-[#6B7280]">{totalVotes} votos</p>
                      </div>
                    )
                  })()
                )
              ) : (
                poll.options.map((option, optionIndex) => {
                  const label = typeof option === 'string' ? option : option.label
                  return (
                    <button key={`${poll.id}-${optionIndex}`} onClick={() => onVote(poll, optionIndex)}
                      className="rounded-xl bg-white px-3 py-2 text-left text-[11px] font-black text-[#111827] ring-1 ring-[#EEF0F4] transition hover:bg-[#F6F1FF] hover:text-[#6C3BFF]">
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
      {pollsReady && !isHydratingVotes && polls.length === 0 && <p className="text-[12px] font-semibold text-[#6B7280]">Nenhuma enquete ativa no momento.</p>}
    </Card>
  )
}

function FriendsCtaCard() {
  return (
    <Card className="p-5">
      <SectionHeader title="O QUE SEUS AMIGOS VOTARAM" />
      <p className="text-[12px] font-semibold leading-5 text-[#6B7280]">Veja as enquetes que seus amigos responderam e compare opinioes.</p>
      <Link href="/amigos" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#F6F1FF] px-4 py-3 text-[12px] font-black uppercase text-[#6C3BFF]">
        <Users className="h-4 w-4" />
        Ir para Amigos
      </Link>
    </Card>
  )
}

function PremiumCtaCard() {
  return (
    <Card className="p-5">
      <SectionHeader title="COMPATIBILIDADE PREMIUM" />
      <p className="text-[12px] font-semibold leading-5 text-[#6B7280]">Compare em porcentagem o quanto voce e um amigo votaram parecido.</p>
      <Link href="/premium" className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#6C3BFF] px-4 py-3 text-[12px] font-black uppercase text-white">
        Comparar opiniones
      </Link>
    </Card>
  )
}

