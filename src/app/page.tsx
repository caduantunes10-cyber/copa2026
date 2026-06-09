'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Calendar, ChevronRight, Circle, Clock, Flag, Heart, MessageCircle, Shield, Star, TrendingUp, Users, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const friendActivity = [
  { name: 'Mariana S.', text: 'reagiu ao segundo gol do Brasil', time: 'há 3m', trend: 'Ao vivo', avatar: 'MS' },
  { name: 'Felipe C.', text: 'comentou que Portugal começou pressionando', time: 'há 6m', trend: 'Opinião', avatar: 'FC' },
  { name: 'João V.', text: 'entrou na conversa sobre Mais de 2.5 gols', time: 'há 8m', trend: 'Debate', avatar: 'JV' },
  { name: 'Beatriz M.', text: 'publicou uma reação sobre Brasil 2 x 1 Sérvia', time: 'há 12m', trend: 'Reação', avatar: 'BM' },
]

const fanFeed = [
  { name: 'Rafael Amorim', handle: '@rafa.amorim', time: 'há 1m', text: 'Que jogo! Brasil voltando com tudo! Esse time tem muita garra! 💚💛', comments: 23, likes: 45, avatar: 'RA' },
  { name: 'Carla Mendes', handle: '@carlamendes', time: 'há 3m', text: 'Sérvia não tá facilitando, jogo difícil! Precisamos manter o foco! 💪', comments: 8, likes: 12, avatar: 'CM' },
  { name: 'Henrique V.', handle: '@henriv', time: 'há 5m', text: 'Neymar é diferente! Decide demais! ⭐', comments: 15, likes: 32, avatar: 'HV' },
]

type HomePoll = {
  id: string
  question: string
  options: Array<{ label: string } | string>
}

type PollResults = Record<string, Record<number, number>>
type SelectedPollOptions = Record<string, number>

const HOME_POLLS_LIMIT = 25

const matches = [
  { time: 'AO VIVO', status: '2ºT · 72:34', left: '🇧🇷', right: '🇷🇸', score: '2 x 1', code: 'BRA', codeRight: 'SRV', live: true },
  { time: '17:00', left: '🇦🇷', right: '🇲🇽', score: 'x', code: 'ARG', codeRight: 'MEX' },
  { time: '20:00', left: '🇫🇷', right: '🇦🇺', score: 'x', code: 'FRA', codeRight: 'AUS' },
  { time: '23:00', left: '🇵🇹', right: '🇬🇭', score: 'x', code: 'POR', codeRight: 'GHA' },
]

const timeline = [
  { minute: "72'", icon: '⚽', title: 'GOOOL DO BRASIL!', detail: 'Richarlison', color: '#16C45B' },
  { minute: "65'", icon: '🟨', title: 'Cartão amarelo', detail: 'M. Grujic', color: '#FFC83D' },
  { minute: "58'", icon: '⚽', title: 'GOOOL DO BRASIL!', detail: 'Neymar', color: '#16C45B' },
  { minute: "46'", icon: '🔄', title: 'Substituição - Sérvia', detail: 'Vlahović saiu · Mitrović entrou', color: '#EF4444' },
]

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
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-4 lg:block">
          <Card className="p-5">
            <SectionHeader title="Atividade dos amigos" action="Ver todos" />
            <div className="space-y-4">
              {friendActivity.map(item => (
                <div key={`${item.name}-${item.time}`} className="flex items-start gap-3">
                  <Avatar label={item.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold leading-4 text-[#111827]"><span className="font-black">{item.name}</span> {item.text}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#6B7280]">{item.time}</p>
                  </div>
                  <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-black text-[#6B7280]">{item.trend}</span>
                </div>
              ))}
            </div>
          </Card>

          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />
        </aside>

        <main className="space-y-4">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0A0A0A] via-[#111827] to-[#1a1040] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-[url('/stadium.jpg')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#16C45B] px-3 py-1 text-[10px] font-black uppercase"><Circle className="h-2 w-2 fill-white" /> Ao vivo</span>
                  <span className="text-[11px] font-bold text-white/60">2ºT · 72:34</span>
                </div>
                <Bell className="h-5 w-5 text-white/60" />
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/95 text-5xl shadow-xl sm:h-24 sm:w-24">🇧🇷</div>
                  <p className="mt-3 text-sm font-black uppercase sm:text-base">Brasil</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black tracking-tight sm:text-6xl">2 <span className="text-white/40">x</span> 1</div>
                  <Link href="/ranking" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[12px] font-black uppercase text-[#6C3BFF] shadow-xl">Ver jogo ao vivo <Circle className="h-3 w-3 fill-[#6C3BFF]" /></Link>
                </div>
                <div className="text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/95 text-5xl shadow-xl sm:h-24 sm:w-24">🇷🇸</div>
                  <p className="mt-3 text-sm font-black uppercase sm:text-base">Sérvia</p>
                </div>
              </div>
              <div className="mt-5 flex justify-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6C3BFF]" /><span className="h-2 w-2 rounded-full bg-white/45" /><span className="h-2 w-2 rounded-full bg-white/45" /><span className="h-2 w-2 rounded-full bg-white/45" /></div>
            </div>
          </section>

          <div className="grid gap-4 md:hidden">
            <FanFeedCard />
            <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} onVote={handlePollVote} />
          </div>

          <TodayMatches />
          <Predictions />

          <div className="grid gap-4 md:grid-cols-2 lg:hidden">
            <TimelineCard />
            <FriendActivityCard />
          </div>
        </main>

        <aside className="hidden space-y-4 lg:block">
          <FanFeedCard />
          <TimelineCard />
        </aside>
      </div>
    </div>
  )
}

function FanFeedCard() {
  return (
    <Card className="p-5">
      <SectionHeader title="Feed da torcida" action="Ver todos" />
      <div className="divide-y divide-[#EEF0F4]">
        {fanFeed.map(post => (
          <article key={post.name} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <Avatar label={post.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[12px] font-black text-[#111827]">{post.name}</p><p className="text-[10px] font-semibold text-[#6B7280]">{post.handle}</p></div>
                  <span className="text-[10px] font-semibold text-[#6B7280]">{post.time}</span>
                </div>
                <p className="mt-3 text-[13px] font-semibold leading-5 text-[#111827]">{post.text}</p>
                <div className="mt-3 flex items-center gap-8 text-[11px] font-semibold text-[#6B7280]"><span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments}</span><span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{post.likes}</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button className="mt-4 w-full rounded-full bg-[#6C3BFF] px-4 py-3 text-[11px] font-black uppercase text-white md:hidden">Publicar</button>
    </Card>
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
            <p className="text-[12px] font-black leading-5 text-[#111827]">{index === 0 ? '🗳️ ' : ''}{poll.question}</p>
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

function TodayMatches() {
  return <Card className="p-5"><SectionHeader title="Jogos de hoje" action="Ver todos" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{matches.map(match => <div key={`${match.code}-${match.codeRight}`} className={`rounded-2xl p-4 text-center ring-1 ${match.live ? 'bg-[#F7FFFA] ring-[#16C45B]' : 'bg-white ring-[#EEF0F4]'}`}><div className={`text-[11px] font-black ${match.live ? 'text-[#16C45B]' : 'text-[#6B7280]'}`}>{match.time}</div>{match.status && <div className="text-[9px] font-bold text-[#16C45B]">{match.status}</div>}<div className="mt-4 flex items-center justify-center gap-3 text-2xl"><span>{match.left}</span><span className="text-base font-black text-[#111827]">{match.score}</span><span>{match.right}</span></div><div className="mt-3 flex justify-between text-[11px] font-black text-[#111827]"><span>{match.code}</span><span>{match.codeRight}</span></div></div>)}</div><Link href="/amigos" className="mt-4 flex items-center justify-center rounded-2xl bg-[#F6F1FF] px-4 py-3 text-[11px] font-black uppercase text-[#6C3BFF] md:hidden">Ver tabela completa</Link></Card>
}

function Predictions() {
  return <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#E9FFF2] via-[#EEF7FF] to-[#F4EAFE] p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]"><div className="mb-4 flex items-center justify-between"><h2 className="text-[13px] font-black uppercase text-[#111827]">Como você e seus amigos estão vendo este jogo?</h2><span className="text-[10px] font-black text-[#6B7280]">Ver detalhes</span></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-white/72 p-4 text-center"><p className="text-[11px] font-black uppercase">Quem vai ganhar?</p><p className="text-[10px] text-[#6B7280]">Final do jogo</p><div className="mt-5 flex items-center justify-around"><div><p className="text-2xl font-black text-[#16C45B]">65%</p><div className="mt-2 text-3xl">🇧🇷</div><p className="text-[11px] font-bold">Brasil</p></div><div><p className="text-2xl font-black text-[#6C3BFF]">35%</p><div className="mt-2 text-3xl">🇷🇸</div><p className="text-[11px] font-bold">Sérvia</p></div></div></div><div className="rounded-2xl bg-white/72 p-4"><p className="text-center text-[11px] font-black uppercase">Quantos gols?</p><p className="text-center text-[10px] text-[#6B7280]">Total de gols</p><div className="mt-5 space-y-4"><div><div className="mb-1 flex justify-between text-sm font-black"><span className="text-[#16C45B]">Mais de 2.5</span><span className="text-[#16C45B]">40%</span></div><div className="h-2 rounded-full bg-[#D1D5DB]"><div className="h-full w-[40%] rounded-full bg-[#16C45B]" /></div></div><div><div className="mb-1 flex justify-between text-sm font-black"><span>Menos de 2.5</span><span className="text-[#6C3BFF]">60%</span></div><div className="h-2 rounded-full bg-[#D1D5DB]"><div className="h-full w-[60%] rounded-full bg-[#6C3BFF]" /></div></div></div></div><div className="rounded-2xl bg-white/72 p-4 text-center"><p className="text-[11px] font-black uppercase">Quem marca o próximo?</p><p className="text-[10px] text-[#6B7280]">Próximo gol</p><div className="mt-5 grid grid-cols-3 gap-2"><div><div className="text-3xl">🇧🇷</div><p className="mt-1 text-[10px] font-bold">Neymar</p><p className="text-xl font-black text-[#16C45B]">30%</p></div><div><div className="text-3xl">🇧🇷</div><p className="mt-1 text-[10px] font-bold">Richarlison</p><p className="text-xl font-black">25%</p></div><div><div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#EEF0F4] text-[#6B7280]"><Users className="h-4 w-4" /></div><p className="mt-1 text-[10px] font-bold">Outros</p><p className="text-xl font-black">45%</p></div></div></div></div><div className="mt-4 flex items-center justify-between rounded-2xl bg-white/72 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#6C3BFF] text-[#6C3BFF]"><MessageCircle className="h-5 w-5" /></div><div><p className="text-[13px] font-black uppercase text-[#6C3BFF]">Entre na conversa ao vivo</p><p className="text-[11px] font-semibold text-[#6B7280]">Compartilhe sua leitura do jogo e veja as reações dos amigos.</p></div></div><Link href="/amigos" className="hidden rounded-xl bg-[#6C3BFF] px-6 py-3 text-[11px] font-black uppercase text-white sm:inline-flex">Opinar agora</Link></div></section>
}

function TimelineCard() {
  return <Card className="p-5"><SectionHeader title="Momentos do jogo" action="Ver tempo real" /><div className="space-y-3">{timeline.map(item => <div key={`${item.minute}-${item.title}`} className="flex items-center gap-3"><span className="w-7 text-[12px] font-black">{item.minute}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F5F6F8] text-sm">{item.icon}</span><div className="min-w-0 flex-1 border-l-2 pl-3" style={{ borderColor: item.color }}><p className="text-[11px] font-black uppercase text-[#111827]">{item.title}</p><p className="text-[10px] font-semibold text-[#6B7280]">{item.detail}</p></div></div>)}</div></Card>
}

function FriendActivityCard() {
  return <Card className="p-5"><SectionHeader title="Atividade dos amigos" action="Ver todos" /><div className="space-y-3">{friendActivity.slice(0,3).map(item => <div key={item.name} className="flex items-start gap-3"><Avatar label={item.avatar} /><div className="flex-1"><p className="text-[11px] font-bold leading-4"><span className="font-black">{item.name}</span> {item.text}</p><p className="text-[10px] text-[#6B7280]">{item.time}</p></div><span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-black text-[#6B7280]">{item.trend}</span></div>)}</div></Card>
}
