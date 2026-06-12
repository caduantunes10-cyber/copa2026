'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, Check, CircleDot, Crown, Eye, Flag, Flame, MessageCircle, Shield, Target, Trophy, Users } from 'lucide-react'
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



// ─── Today Insights ────────────────────────────────────────────────────────

type Insight = {
  id: string
  label: string
  text: string
  cta?: string
  href?: string
}

function buildTodayInsights({
  polls,
  votedPolls,
  selectedPollOptions,
  pollResults,
  friendFeed,
  userId,
  pollsReady,
  isHydratingVotes,
}: {
  polls: HomePoll[]
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  friendFeed: FeedActivity[]
  userId: string | null
  pollsReady: boolean
  isHydratingVotes: boolean
}): Insight[] | null {
  if (!pollsReady || isHydratingVotes) return null
  if (!userId) return []

  const results: Insight[] = []

  // 1. Friend disagreement / agreement — from activity_feed
  const pollVoteFeed = friendFeed.filter(f => f.action_type === 'poll_vote' && f.target_id)
  for (const activity of pollVoteFeed) {
    const pollId = activity.target_id!
    if (!votedPolls.has(pollId)) continue
    const friendOptionIndex = (activity.meta as Record<string, unknown> | null)?.option_index
    if (friendOptionIndex === undefined || friendOptionIndex === null) continue
    const myOptionIndex = selectedPollOptions[pollId]
    if (myOptionIndex === undefined) continue
    const friendName = activity.profile?.full_name || activity.profile?.username || 'Um amigo'
    const pollQuestion = activity.target_name || 'uma enquete'
    const shortQuestion = pollQuestion.length > 50 ? pollQuestion.slice(0, 47) + '…' : pollQuestion

    if (Number(friendOptionIndex) === myOptionIndex) {
      results.push({
        id: `agree-${pollId}`,
        label: 'Afinidade',
        text: `${friendName} concordou com você: "${shortQuestion}"`,
        cta: 'Comparar',
        href: `/premium/compare/${activity.user_id}`,
      })
    } else {
      results.push({
        id: `disagree-${pollId}`,
        label: 'Discordância',
        text: `${friendName} discordou de você em: "${shortQuestion}"`,
        cta: 'Comparar',
        href: `/premium/compare/${activity.user_id}`,
      })
    }
    if (results.length >= 2) break
  }

  // 2. Minority opinion — user voted for an option with < 35% share
  for (const pollId of Array.from(votedPolls)) {
    const myOptionIndex = selectedPollOptions[pollId]
    if (myOptionIndex === undefined) continue
    const counts = pollResults[pollId] || {}
    const total = Object.values(counts).reduce((s, c) => s + c, 0)
    if (total < 5) continue
    const myCount = counts[myOptionIndex] || 0
    const myPct = Math.round((myCount / total) * 100)
    if (myPct > 0 && myPct < 35) {
      const poll = polls.find(p => p.id === pollId)
      if (!poll) continue
      const shortQ = poll.question.length > 50 ? poll.question.slice(0, 47) + '…' : poll.question
      results.push({
        id: `minority-${pollId}`,
        label: 'Minoria',
        text: `Sua opinião ficou entre as menos escolhidas em: "${shortQ}"`,
      })
      break
    }
  }

  // 3. Divided community — any voted poll where leading option ≤ 55%
  for (const pollId of Array.from(votedPolls)) {
    const counts = pollResults[pollId] || {}
    const total = Object.values(counts).reduce((s, c) => s + c, 0)
    if (total < 10) continue
    const maxCount = Math.max(...Object.values(counts))
    const leadingPct = Math.round((maxCount / total) * 100)
    if (leadingPct <= 55) {
      const poll = polls.find(p => p.id === pollId)
      if (!poll) continue
      const shortQ = poll.question.length > 50 ? poll.question.slice(0, 47) + '…' : poll.question
      results.push({
        id: `divided-${pollId}`,
        label: 'Comunidade',
        text: `A comunidade está dividida sobre: "${shortQ}"`,
      })
      break
    }
  }

  return results.slice(0, 3)
}

type InsightMeta = {
  title: string
  body: string
  subtext: string
  context: string
  cta: string
  accentColor: string
  accentBg: string
}

function extractQuotedContext(text: string): { before: string; context: string } {
  const match = text.match(/^(.*?)"(.+?)"\s*$/) || text.match(/^(.*?):?\s*"(.+)"\s*$/)
  if (match) return { before: match[1].trim(), context: match[2].trim() }
  const colonIdx = text.lastIndexOf(':')
  if (colonIdx !== -1) return { before: text.slice(0, colonIdx).trim(), context: text.slice(colonIdx + 1).trim() }
  return { before: text, context: '' }
}

function buildInsightMeta(insight: Insight): InsightMeta {
  const { before, context } = extractQuotedContext(insight.text)

  switch (insight.label) {
    case 'Afinidade': {
      const nameMatch = before.match(/^(.+?) concordou com você/)
      const name = nameMatch ? nameMatch[1] : 'Um amigo'
      return {
        title: 'Em comum',
        body: `Vocês estão mais parecidos do que imaginam.`,
        subtext: `Você e ${name} chegaram à mesma resposta.`,
        context,
        cta: 'Ver compatibilidade',
        accentColor: '#15803D',
        accentBg: 'rgba(34,197,94,0.08)',
      }
    }
    case 'Discordância': {
      const nameMatch = before.match(/^(.+?) discordou de você/)
      const name = nameMatch ? nameMatch[1] : 'Um amigo'
      return {
        title: 'Lados opostos',
        body: `Você e ${name} escolheram lados opostos.`,
        subtext: 'Essa diferença pode ser mais reveladora do que parece.',
        context,
        cta: 'Comparar opiniões',
        accentColor: '#B91C1C',
        accentBg: 'rgba(239,68,68,0.07)',
      }
    }
    case 'Minoria':
      return {
        title: 'Opinião rara',
        body: 'Você está sozinho nessa.',
        subtext: 'Poucos torcedores escolheram a mesma resposta que você.',
        context,
        cta: 'Ver resultados',
        accentColor: '#1D4ED8',
        accentBg: 'rgba(37,99,235,0.07)',
      }
    case 'Comunidade':
      return {
        title: 'Torcida dividida',
        body: 'A torcida está dividida.',
        subtext: 'Não há consenso. Essa resposta pode te surpreender.',
        context,
        cta: 'Ver enquete',
        accentColor: '#374151',
        accentBg: 'rgba(55,65,81,0.06)',
      }
    default:
      return {
        title: insight.label,
        body: insight.text,
        subtext: '',
        context: '',
        cta: insight.cta || '',
        accentColor: '#374151',
        accentBg: 'rgba(55,65,81,0.06)',
      }
  }
}

function InsightCard({ insight }: { insight: Insight }) {
  const meta = buildInsightMeta(insight)
  const card = (
    <div
      className="flex h-full flex-col justify-between rounded-[24px] p-6 transition-all duration-200 active:scale-[0.99] hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]"
      style={{
        background: 'rgba(255,255,255,0.93)',
        border: '1px solid rgba(226,232,240,0.95)',
        boxShadow: '0 6px 20px rgba(15,23,42,0.06)',
        minHeight: '220px',
      }}
    >
      <div>
        <span
          className="mb-5 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-[700] uppercase tracking-[0.06em]"
          style={{ background: meta.accentBg, color: meta.accentColor }}
        >
          {meta.title}
        </span>
        <p className="mt-1 text-[21px] font-[800] leading-[1.2] tracking-[-0.03em] text-[#0F172A]">
          {meta.body}
        </p>
        {meta.subtext && (
          <p className="mt-2 text-[14px] font-[400] leading-[1.55] text-[#334155]">
            {meta.subtext}
          </p>
        )}
        {meta.context && (
          <p className="mt-3 text-[12px] font-[500] uppercase tracking-[0.05em] text-[#94A3B8]">
            {meta.context}
          </p>
        )}
      </div>
      {(meta.cta || insight.cta) && (
        <div className="mt-6 flex items-center gap-1.5 text-[13px] font-[700] tracking-[-0.01em]" style={{ color: meta.accentColor }}>
          {meta.cta || insight.cta}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
        </div>
      )}
    </div>
  )
  return insight.href ? (
    <Link href={insight.href} className="block h-full no-underline">
      {card}
    </Link>
  ) : (
    <>{card}</>
  )
}

function TodayInsightsSection({ insights, loading }: { insights: Insight[] | null; loading: boolean }) {
  const sectionHeader = (
    <div className="mb-5">
      <h2 className="text-[22px] font-[800] tracking-[-0.03em] text-[#0F172A]">Seu universo hoje</h2>
      <p className="mt-1 text-[14px] text-[#64748B]">Opiniões, afinidades e divergências que surgiram desde sua última visita.</p>
    </div>
  )

  const skeletonCard = (
    <div className="animate-pulse rounded-[24px] p-6" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(226,232,240,0.9)', minHeight: '220px' }}>
      <div className="mb-5 h-5 w-24 rounded-full bg-slate-200" />
      <div className="mb-2 h-6 w-4/5 rounded-full bg-slate-200" />
      <div className="mb-1.5 h-6 w-3/5 rounded-full bg-slate-200" />
      <div className="mt-3 h-3.5 w-full rounded-full bg-slate-100" />
      <div className="mt-1.5 h-3.5 w-5/6 rounded-full bg-slate-100" />
      <div className="mt-6 h-3.5 w-1/3 rounded-full bg-slate-100" />
    </div>
  )

  if (loading) {
    return (
      <section>
        {sectionHeader}
        {/* Mobile skeleton carousel */}
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:hidden">
          {[1, 2].map(i => (
            <div key={i} className="w-[87vw] max-w-[360px] shrink-0 snap-start">{skeletonCard}</div>
          ))}
        </div>
        {/* Desktop skeleton grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i}>{skeletonCard}</div>)}
        </div>
      </section>
    )
  }

  const isEmpty = !insights || insights.length === 0

  return (
    <section>
      {sectionHeader}

      {isEmpty ? (
        <div
          className="rounded-[24px] px-6 py-8"
          style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(226,232,240,0.9)' }}
        >
          <p className="text-[15px] leading-[1.7] text-[#64748B]">
            Vote em mais enquetes e adicione amigos para descobrir quem pensa como você.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal snap carousel */}
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 md:hidden">
            {insights.map(insight => (
              <div key={insight.id} className="w-[87vw] max-w-[360px] shrink-0 snap-start">
                <InsightCard insight={insight} />
              </div>
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

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
  const [userId, setUserId] = useState<string | null>(null)
  const [lastVotedPollId, setLastVotedPollId] = useState<string | null>(null)
  const [previewReactionPollId, setPreviewReactionPollId] = useState<string | null>(null)
  const [selectedFeaturedPollId, setSelectedFeaturedPollId] = useState<string | null>(null)
  const latestPollHydrationRequest = useRef(0)
  const featuredPollRef = useRef<HTMLElement | null>(null)
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

      if (authData.user) setUserId(authData.user.id)
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
      setLastVotedPollId(poll.id)
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

  const featuredPoll = pollsReady && !isHydratingVotes && polls.length > 0
    ? polls.find(poll => poll.id === selectedFeaturedPollId) || polls[0]
    : null
  const insights = buildTodayInsights({ polls, votedPolls, selectedPollOptions, pollResults, friendFeed, userId, pollsReady, isHydratingVotes })
  const featuredReactionPollId = featuredPoll && previewReactionPollId === featuredPoll.id ? previewReactionPollId : lastVotedPollId

  function handleSelectFeaturedPoll(pollId: string) {
    setSelectedFeaturedPollId(pollId)
    requestAnimationFrame(() => {
      featuredPollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="relative space-y-8 pb-10 lg:space-y-10 lg:pb-8">
      <SocialMomentSection friendFeed={friendFeed} selectedPollOptions={selectedPollOptions} votedPolls={votedPolls} pollResults={pollResults} />
      <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} friendFeed={friendFeed} lastVotedPollId={lastVotedPollId} selectedPollId={featuredPoll?.id || selectedFeaturedPollId} onSelectPoll={handleSelectFeaturedPoll} onVote={handlePollVote} />

      {featuredPoll && (
        <section ref={featuredPollRef} className="scroll-mt-24 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Pergunta do momento" title="Agora é a sua vez" />
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={() => setPreviewReactionPollId(featuredPoll.id)}
                className="inline-flex h-11 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.08] px-4 text-[12px] font-[800] text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/[0.12] active:scale-[0.98]"
              >
                Pré-visualizar reação
              </button>
            )}
          </div>
          <FeaturedPollCard poll={featuredPoll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} friendFeed={friendFeed} lastVotedPollId={featuredReactionPollId} onVote={handlePollVote} />
        </section>
      )}

      <CommunitySection insights={insights} loading={!pollsReady || isHydratingVotes} polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} />
    </div>
  )
}

function SocialMomentSection({ friendFeed, selectedPollOptions, votedPolls, pollResults }: {
  friendFeed: FeedActivity[]
  selectedPollOptions: SelectedPollOptions
  votedPolls: Set<string>
  pollResults: PollResults
}) {
  const latest = friendFeed.find(item => item.action_type === 'poll_vote')
  const friendPollId = latest?.target_id || null
  const friendOption = latest ? Number((latest.meta as Record<string, unknown> | null)?.option_index) : null
  const myOption = friendPollId ? selectedPollOptions[friendPollId] : undefined
  const hasSharedVote = friendPollId ? votedPolls.has(friendPollId) && myOption !== undefined : false
  const friendName = latest?.profile?.full_name || latest?.profile?.username || 'Seu círculo'
  const optionLabel = latest?.meta?.option_label as string | undefined
  const currentResults = friendPollId ? pollResults[friendPollId] || {} : {}
  const totalVotes = Object.values(currentResults).reduce((sum, count) => sum + count, 0)
  const userShare = hasSharedVote && totalVotes > 0 ? ((currentResults[myOption!] || 0) / totalVotes) : 0

  let title = 'Descubra como seus amigos pensam futebol.'
  let body = 'Cada voto revela um pouco do jeito que seu círculo vê o jogo.'
  let detail = 'Vote em uma pergunta e veja quem ficou do seu lado.'
  let tone: 'green' | 'purple' | 'red' = 'purple'

  if (latest && hasSharedVote && friendOption !== null && friendOption !== myOption) {
    title = `${friendName} escolheu o lado que você rejeitou.`
    body = 'Esse é o tipo de discordância que transforma uma enquete em conversa de futebol.'
    detail = latest.target_name || 'Veja onde seu círculo se separou.'
    tone = 'red'
  } else if (latest && hasSharedVote && friendOption === myOption) {
    title = `${friendName} viu o jogo como você.`
    body = 'Seu voto encontrou companhia. Alguém do seu círculo chegou na mesma leitura.'
    detail = optionLabel || latest.target_name || 'Veja quem pensa parecido.'
    tone = 'green'
  } else if (votedPolls.size > 0 && userShare > 0 && userShare < 0.25) {
    title = 'Você está sozinho nessa opinião.'
    body = 'Pouca gente seguiu o seu caminho. Isso diz algo sobre seu jeito de ver futebol.'
    detail = 'Veja se algum amigo teve coragem de escolher igual.'
    tone = 'purple'
  } else if (latest) {
    title = `${friendName} acabou de votar.`
    body = 'Alguém do seu círculo deixou uma pista sobre como enxerga futebol.'
    detail = latest.target_name || 'Veja se você concordaria com essa escolha.'
    tone = 'green'
  }

  const accent = tone === 'red' ? '#B42318' : tone === 'green' ? '#10B85A' : '#6D4AFF'
  const glow = tone === 'red' ? 'rgba(180,35,24,0.16)' : tone === 'green' ? 'rgba(16,184,90,0.18)' : 'rgba(109,74,255,0.16)'
  const avatars = friendFeed.filter(item => item.action_type === 'poll_vote').slice(0, 4)

  return (
    <section
      className="relative max-w-full overflow-hidden rounded-[32px] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] ring-1 ring-white/10 sm:p-7 lg:p-8"
      style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))' }}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl" style={{ background: glow }} />
      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[300px] min-[420px]:max-w-[calc(100vw-72px)] sm:max-w-[720px]">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {avatars.length > 0 ? avatars.map(item => <Avatar key={item.id} item={item} size="md" />) : (
                <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#ECFDF3] ring-1 ring-black/[0.04]">
                  <Users className="h-5 w-5 text-[#10B85A]" strokeWidth={2.4} />
                </span>
              )}
            </div>
            <div>
              <p className="text-[12px] font-[900] uppercase tracking-[0.08em]" style={{ color: accent }}>Social moment</p>
              <p className="mt-0.5 text-[13px] font-[700] text-[#64748B]">O que seus amigos revelaram agora</p>
            </div>
          </div>
          <h1 className="max-w-full break-words text-[25px] font-[900] leading-[1.04] tracking-[-0.035em] text-[#07111F] [overflow-wrap:anywhere] min-[420px]:text-[34px] sm:text-[46px] lg:text-[56px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[620px] text-[16px] font-[700] leading-[1.5] text-[#334155] sm:text-[18px]">
            {body}
          </p>
          <p className="mt-3 max-w-[560px] text-[14px] font-[650] leading-[1.5] text-[#64748B]">
            {detail}
          </p>
        </div>
        <Link
          href="/amigos"
          className="inline-flex min-h-[48px] w-full max-w-[300px] items-center justify-center rounded-full px-5 text-[14px] font-[900] text-white shadow-[0_18px_34px_rgba(16,184,90,0.28)] transition hover:-translate-y-[1px] active:scale-[0.98] sm:w-auto sm:max-w-none"
          style={{ background: accent }}
        >
          Ver meu círculo
        </Link>
      </div>
    </section>
  )
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[18px] bg-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.18)] ring-1 ring-white/10">
        <Flag className="h-4 w-4 text-[#10B85A]" strokeWidth={2.4} />
      </span>
      <div>
        <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#10B85A]">{eyebrow}</p>
        <h2 className="mt-1 text-[26px] font-[900] leading-[1.05] tracking-[-0.045em] text-white">{title}</h2>
        {description && <p className="mt-2 text-[15px] leading-[1.55] text-[#94A3B8]">{description}</p>}
      </div>
    </div>
  )
}

function Avatar({ item, size = 'md' }: { item: FeedActivity; size?: 'sm' | 'md' }) {
  const name = item.profile?.full_name || item.profile?.username || 'Usuário'
  const sizeClass = size === 'sm' ? 'h-10 w-10 rounded-[15px] text-[12px]' : 'h-12 w-12 rounded-[18px] text-[15px]'
  return item.profile?.avatar_url ? (
    <img src={item.profile.avatar_url} alt={name} className={`${sizeClass} shrink-0 object-cover ring-1 ring-black/[0.06]`} />
  ) : (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center bg-[#ECFDF3] font-[900] text-[#10B85A] ring-1 ring-black/[0.04]`}>
      {name[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function CircleSection({ friendFeed }: { friendFeed: FeedActivity[] }) {
  return (
    <section className="space-y-3">
      <SectionTitle eyebrow="Seu círculo" title="O que está acontecendo perto de você" />
      <div className="grid gap-4 md:grid-cols-3">
        <CompatibilityHighlightCard />
        <SurprisingOpinionCard />
        <LastVoteCard feed={friendFeed} />
      </div>
    </section>
  )
}

function LastVoteCard({ feed }: { feed: FeedActivity[] }) {
  const item = feed.find(activity => activity.action_type === 'poll_vote')
  const name = item?.profile?.full_name || item?.profile?.username || 'Ninguém ainda'
  const optionLabel = item?.meta?.option_label as string | undefined

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20)] ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#64748B]">Último voto</p>
        <MessageCircle className="h-4 w-4 text-[#6D4AFF]" strokeWidth={2.4} />
      </div>
      {item ? (
        <div className="flex items-start gap-3">
          <Avatar item={item} />
          <div className="min-w-0">
            <p className="truncate text-[16px] font-[900] tracking-[-0.025em] text-[#07111F]">{name}</p>
            <p className="mt-1 line-clamp-2 text-[14px] font-[600] leading-[1.45] text-[#64748B]">{item.target_name}</p>
            {optionLabel && <p className="mt-3 rounded-[16px] bg-[#F3F6F8] px-3 py-2.5 text-[13px] font-[850] text-[#07111F]">{optionLabel}</p>}
          </div>
        </div>
      ) : (
        <p className="text-[14px] leading-[1.55] text-[#64748B]">Quando seus amigos votarem, o voto mais recente aparece aqui.</p>
      )}
    </section>
  )
}

function getPollOptionLabel(poll: HomePoll, optionIndex: number) {
  const option = poll.options[optionIndex]
  return typeof option === 'string' ? option : option?.label || `Opção ${optionIndex + 1}`
}

function CommunitySection({ insights, loading, polls, votedPolls, selectedPollOptions, pollResults }: {
  insights: Insight[] | null
  loading: boolean
  polls: HomePoll[]
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
}) {
  let popular: { question: string; label: string; percentage: number } | null = null
  let unpopular: { question: string; label: string; percentage: number } | null = null
  let divided: { question: string; percentage: number } | null = null

  for (const poll of polls) {
    const results = pollResults[poll.id] || {}
    const entries = Object.entries(results)
    const total = Object.values(results).reduce((sum, count) => sum + count, 0)
    if (total === 0 || entries.length === 0) continue

    const sorted = entries
      .map(([optionIndex, count]) => ({ optionIndex: Number(optionIndex), count, percentage: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)

    if (!popular) {
      popular = {
        question: poll.question,
        label: getPollOptionLabel(poll, sorted[0].optionIndex),
        percentage: sorted[0].percentage,
      }
    }

    const lowest = [...sorted].reverse().find(item => item.count > 0)
    if (!unpopular && lowest) {
      unpopular = {
        question: poll.question,
        label: getPollOptionLabel(poll, lowest.optionIndex),
        percentage: lowest.percentage,
      }
    }

    if (!divided && sorted[0].percentage <= 55) {
      divided = {
        question: poll.question,
        percentage: sorted[0].percentage,
      }
    }
  }

  const minorityInsight = insights?.find(insight => insight.label === 'Minoria')
  const dividedInsight = insights?.find(insight => insight.label === 'Comunidade')

  return (
    <section className="space-y-3">
      <SectionTitle eyebrow="Comunidade" title="Depois dos amigos, vem a torcida" />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-[150px] animate-pulse rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <CommunityMetricCard icon={<Flame className="h-4 w-4" />} label="A maioria está indo por aqui" value={popular ? popular.label : 'Ainda sem maioria'} title="A torcida já começou a tomar lado." body={popular?.question} />
          <CommunityMetricCard icon={<Target className="h-4 w-4" />} label="Pouca gente teve coragem" value={unpopular ? unpopular.label : 'Ainda sem minoria'} title={minorityInsight ? buildInsightMeta(minorityInsight).title : 'Você pode estar pensando diferente.'} body={minorityInsight ? buildInsightMeta(minorityInsight).context : unpopular?.question} />
          <CommunityMetricCard icon={<Eye className="h-4 w-4" />} label="A pergunta que divide" value={divided ? 'Grupo dividido' : 'Em formação'} title={dividedInsight ? buildInsightMeta(dividedInsight).title : 'Algumas respostas ainda vão revelar lados.'} body={dividedInsight ? buildInsightMeta(dividedInsight).context : divided?.question || 'Vote em mais enquetes para revelar divisões reais.'} />
        </div>
      )}
    </section>
  )
}

function CommunityMetricCard({ icon, label, value, title, body }: { icon: ReactNode; label: string; value: string; title: string; body?: string }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20)] ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] font-[800] uppercase tracking-[0.08em] text-[#64748B]">
          <span className="text-[#10B85A]">{icon}</span>
          {label}
        </span>
      </div>
      <p className="text-[18px] font-[900] leading-[1.15] tracking-[-0.035em] text-[#07111F]">{value}</p>
      <p className="mt-2 text-[14px] font-[750] leading-[1.35] tracking-[-0.01em] text-[#334155]">{title}</p>
      {body && <p className="mt-2 line-clamp-2 text-[14px] font-[600] leading-[1.5] text-[#64748B]">{body}</p>}
    </section>
  )
}

function PredictionsPlaceholder() {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20)] ring-1 ring-white/10">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[18px] bg-[#ECFDF3]">
          <Shield className="h-4 w-4 text-[#10B85A]" strokeWidth={2.4} />
        </span>
        <div>
          <p className="text-[11px] font-[800] uppercase tracking-[0.08em] text-[#10B85A]">Palpites</p>
          <h2 className="mt-1 text-[22px] font-[800] tracking-[-0.03em] text-[#07111F]">Seus palpites aparecerão aqui.</h2>
        </div>
      </div>
    </section>
  )
}

function FeaturedPollCard({ poll, votedPolls, selectedPollOptions, pollResults, friendFeed, lastVotedPollId, onVote }: {
  poll: HomePoll
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  friendFeed: FeedActivity[]
  lastVotedPollId: string | null
  onVote: (poll: HomePoll, optionIndex: number) => void
}) {
  const results = pollResults[poll.id] || {}
  const totalVotes = Object.values(results).reduce((sum, c) => sum + c, 0)
  const voted = votedPolls.has(poll.id)
  return (
    <section className="group overflow-hidden rounded-[28px] bg-white p-5 transition-all duration-300 hover:-translate-y-[1px] sm:p-7 lg:p-8" style={{ border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>
      <div className="mb-5 flex items-center justify-between">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3.5 text-[12px] font-[850] uppercase tracking-[0.06em] text-[#10B85A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B85A]" />
          Enquete em destaque
        </span>
        {voted && (
          <span className="inline-flex h-8 items-center gap-1 rounded-full bg-[#ECFDF3] px-3.5 text-[12px] font-[800] text-[#10B85A] ring-1 ring-[#BBF7D0]">
            <Check className="h-3 w-3" strokeWidth={2.4} />
            Votado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-7">
        <div className="hidden shrink-0 lg:flex lg:flex-col lg:justify-center">
          {(() => {
            const topPct = totalVotes > 0
              ? Math.max(...poll.options.map((_, i) => Math.round(((results[i] || 0) / totalVotes) * 100)))
              : 0
            return (
          <div
                className="relative flex h-[236px] w-[244px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[24px]"
                style={{
                  background: 'linear-gradient(135deg, #063B2A 0%, #0B5A3D 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(6,59,42,0.16)',
                }}
              >
                <div className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-white/20" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                <div className="pointer-events-none absolute inset-5 rounded-[16px] border border-white/15" />
                <div
                  className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}
                >
                  <Trophy className="h-7 w-7 text-white" strokeWidth={2} />
                </div>
                <div
                  className="relative text-[40px] font-[700] leading-[1.1] tracking-[-0.04em] tabular-nums text-white"
                >
                  {totalVotes > 0 ? `${topPct}%` : '0%'}
                </div>
                <p className="relative max-w-[160px] text-center text-[14px] font-[600] leading-snug text-white/90">
                  Concordam com esta opção
                </p>
                <p className="relative text-[13px] font-[500] text-white/60">
                  {totalVotes > 0 ? `${totalVotes.toLocaleString('pt-BR')} votos totais` : 'Sem votos ainda'}
                </p>
              </div>
            )
          })()}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="mb-5 text-[25px] font-[850] leading-[1.06] tracking-[-0.05em] text-[#07111F] sm:text-[28px] lg:text-[34px]">{poll.question}</p>
          <div className="space-y-3.5">
            {voted ? (
              poll.options.map((option, optionIndex) => {
                const label = typeof option === 'string' ? option : option.label
                const count = results[optionIndex] || 0
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const selected = selectedPollOptions[poll.id] === optionIndex
                return (
                      <div key={`feat-${poll.id}-${optionIndex}`} className={`w-full max-w-full min-w-0 overflow-hidden rounded-[18px] px-4 py-4 ring-1 transition-all ${
                    selected
                      ? 'bg-[#ECFDF3] ring-[#10B85A]/35 shadow-[0_12px_28px_rgba(16,184,90,0.12)]'
                      : 'bg-[#F8FAFC] ring-black/[0.06]'
                  }`}>
                    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_48px] items-center gap-2">
                      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-[800] ${selected ? 'text-[#063B2A]' : 'text-[#07111F]'}`}>{label}</span>
                      <span className={`w-12 shrink-0 text-right tabular-nums text-[13px] font-[850] ${selected ? 'text-[#10B85A]' : 'text-[#64748B]'}`}>{percentage}%</span>
                    </div>
                    <div className="mt-2 w-full max-w-full overflow-hidden">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
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
                    className="flex min-h-[58px] w-full min-w-0 items-center overflow-hidden rounded-[18px] bg-[#F8FAFC] px-4 text-left text-[16px] font-[800] text-[#07111F] ring-1 ring-black/[0.06] transition-all duration-200 hover:bg-[#ECFDF3] hover:text-[#063B2A] hover:ring-[#10B85A]/30 hover:shadow-[0_12px_28px_rgba(16,184,90,0.12)] active:scale-[0.99]">
                    {label}
                  </button>
                )
              })
            )}
          </div>
          {voted && totalVotes > 0 && (
            <p className="mt-4 text-[13px] font-[700] text-[#64748B]">{totalVotes.toLocaleString('pt-BR')} votos totais</p>
          )}
          <PostVoteSocialCard pollId={poll.id} friendFeed={friendFeed} selectedPollOptions={selectedPollOptions} pollResults={pollResults} lastVotedPollId={lastVotedPollId} />
        </div>
      </div>
    </section>
  )
}

// ─── Post-vote social discovery card ─────────────────────────────────────────

function PostVoteSocialCard({
  pollId,
  friendFeed,
  selectedPollOptions,
  pollResults,
  lastVotedPollId,
}: {
  pollId: string
  friendFeed: FeedActivity[]
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  lastVotedPollId: string | null
}) {
  // Only show on the poll the user just voted on
  if (pollId !== lastVotedPollId) return null
  const myOption = selectedPollOptions[pollId]
  if (myOption === undefined) return null

  const pollFriendVotes = friendFeed.filter(
    f => f.action_type === 'poll_vote' && f.target_id === pollId && f.meta !== null
  )
  const agreements = pollFriendVotes.filter(f => Number((f.meta as Record<string, unknown>)?.option_index) === myOption)
  const disagreements = pollFriendVotes.filter(f => Number((f.meta as Record<string, unknown>)?.option_index) !== myOption)
  const visibleFriends = [...disagreements, ...agreements].slice(0, 4)
  const featuredFriend = disagreements[0] || agreements[0] || pollFriendVotes[0] || null
  const featuredName = featuredFriend?.profile?.full_name || featuredFriend?.profile?.username || 'Seu círculo'
  const friendOptions = new Set(pollFriendVotes.map(f => Number((f.meta as Record<string, unknown>)?.option_index)))
  const results = pollResults[pollId] || {}
  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)
  const myVoteShare = totalVotes > 0 ? ((results[myOption] || 0) / totalVotes) : 0

  let title = 'Essa resposta revela mais do que parece.'
  let body = 'Agora vem a parte boa: descobrir quem viu futebol do mesmo jeito que você.'
  let supporting = 'O voto só começa quando aparece o rosto de alguém conhecido.'
  let href = '/amigos'
  let accentColor = '#6D4AFF'
  let accentBg = '#F7F5FF'
  let borderColor = 'rgba(109,74,255,0.18)'

  if (disagreements.length > 0) {
    title = `${featuredName} escolheu exatamente o lado que você rejeitou.`
    body = disagreements.length > 1
      ? 'Mais de um amigo foi para o outro lado. Essa conversa já tem rivalidade.'
      : `Você e ${featuredName} não viram essa jogada do mesmo jeito.`
    supporting = agreements.length > 0
      ? 'E o mais interessante: nem todo mundo do seu círculo ficou do mesmo lado.'
      : 'Esse é o tipo de voto que dá vontade de perguntar: como assim?'
    href = `/premium/compare/${disagreements[0].user_id}`
    accentColor = '#B42318'
    accentBg = '#FFF1F0'
    borderColor = 'rgba(180,35,24,0.18)'
  } else if (myVoteShare > 0 && myVoteShare < 0.25) {
    title = 'Você está sozinho nesse lado da arquibancada.'
    body = 'Quase ninguém seguiu esse caminho até agora.'
    supporting = 'Essa resposta tem cara de identidade: você realmente vê futebol de outro jeito.'
    accentColor = '#6D4AFF'
    accentBg = '#F7F5FF'
    borderColor = 'rgba(109,74,255,0.18)'
  } else if (pollFriendVotes.length === 0) {
    title = 'Ninguém do seu círculo apareceu aqui ainda.'
    body = 'Por enquanto, essa opinião é só sua.'
    supporting = 'A curiosidade fica no ar: quem dos seus amigos teria coragem de escolher o mesmo?'
  } else if (agreements.length > 0) {
    title = `${featuredName} chegou à mesma conclusão que você.`
    body = agreements.length > 1
      ? 'Seu voto encontrou companhia. Seu grupo tem um jeito parecido de ler futebol.'
      : `Você e ${featuredName} parecem enxergar o jogo pela mesma lente.`
    supporting = 'Esse é aquele momento de: eu sabia que alguém ia entender.'
    href = `/premium/compare/${agreements[0].user_id}`
    accentColor = '#10B85A'
    accentBg = '#ECFDF3'
    borderColor = 'rgba(16,184,90,0.22)'
  } else if (friendOptions.size > 1) {
    title = 'Esse voto rachou seu círculo.'
    body = 'A mesma pergunta colocou amigos em lados diferentes.'
    supporting = 'Quando a bola vira opinião, o grupo mostra quem é quem.'
  }

  return (
    <Link href={href} className="block no-underline">
      <div
        className="mt-6 overflow-hidden rounded-[26px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_44px_rgba(7,17,31,0.14)] active:scale-[0.99]"
        style={{
          background: `linear-gradient(135deg, ${accentBg} 0%, #FFFFFF 100%)`,
          border: `1px solid ${borderColor}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-[16px] bg-white/80 shadow-[0_8px_20px_rgba(7,17,31,0.06)] ring-1 ring-black/[0.04]">
                <Users className="h-5 w-5" style={{ color: accentColor }} strokeWidth={2.4} />
              </span>
              <p className="text-[12px] font-[900] uppercase tracking-[0.07em]" style={{ color: accentColor }}>
                Reações do seu círculo
              </p>
            </div>
            {visibleFriends.length > 0 && (
              <div className="flex -space-x-2.5">
                {visibleFriends.map(item => <Avatar key={item.id} item={item} size="sm" />)}
              </div>
            )}
          </div>

          <p className="text-[22px] font-[900] leading-[1.08] tracking-[-0.045em] text-[#07111F] sm:text-[24px]">
            {title}
          </p>
          <p className="mt-3 text-[15px] font-[700] leading-[1.45] text-[#334155]">
            {body}
          </p>
          <p className="mt-2 text-[14px] font-[600] leading-[1.5] text-[#64748B]">
            {supporting}
          </p>

          <div className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/70 px-4 text-[13px] font-[900] tracking-[-0.01em] shadow-[0_8px_20px_rgba(7,17,31,0.06)] ring-1 ring-black/[0.04]" style={{ color: accentColor }}>
            Ver onde seus amigos ficaram
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.3} aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function PollCardInner({ poll, votedPolls, selectedPollOptions, pollResults, resultsLoading, friendFeed, lastVotedPollId, onVote }: {
  poll: HomePoll
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  resultsLoading: Set<string>
  friendFeed: FeedActivity[]
  lastVotedPollId: string | null
  onVote: (poll: HomePoll, optionIndex: number) => void
}) {
  return (
    <>
      <div className="flex items-start gap-3">
        <div className="shrink-0 grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-[#DCFCE7] to-[#ECFDF5] shadow-[0_1px_3px_rgba(34,197,94,0.15)]" aria-hidden="true">
          <Activity className="h-[16px] w-[16px] text-[#16A34A]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-[600] leading-[1.35] text-[#0F172A]">{poll.question}</p>
            {votedPolls.has(poll.id) && (
              <span className="shrink-0 inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold text-[#16A34A]" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.20)' }}>
                <Check className="h-3 w-3" strokeWidth={2.4} />
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
                            <div className="h-full max-w-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: '#22C55E' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[13px] text-[#64748B]">{totalVotes.toLocaleString('pt-BR')} votos</p>
                  <PostVoteSocialCard pollId={poll.id} friendFeed={friendFeed} selectedPollOptions={selectedPollOptions} pollResults={pollResults} lastVotedPollId={lastVotedPollId} />
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
    </>
  )
}

function DailyPollsCard({ polls, votedPolls, selectedPollOptions, pollResults, resultsLoading, isHydratingVotes, pollsReady, friendFeed, lastVotedPollId, selectedPollId, onSelectPoll, onVote }: {
  polls: HomePoll[]
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  resultsLoading: Set<string>
  isHydratingVotes: boolean
  pollsReady: boolean
  friendFeed: FeedActivity[]
  lastVotedPollId: string | null
  selectedPollId: string | null | undefined
  onSelectPoll: (pollId: string) => void
  onVote: (poll: HomePoll, optionIndex: number) => void
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const el = carouselRef.current
    if (!el || polls.length === 0) return
    const cardWidth = el.scrollWidth / polls.length
    const index = Math.round(el.scrollLeft / cardWidth)
    setActiveIndex(Math.min(index, polls.length - 1))
  }

  console.log('[Home polls] DailyPollsCard render polls.length:', polls.length)
  if (polls.length === 0) console.log('[Home polls] rendering empty branch: Nenhuma enquete ativa no momento.')

  return (
    <section className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] ring-1 ring-white/10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#10B85A]">Enquetes do momento</p>
          <h2 className="mt-1 text-[24px] font-[900] leading-[1.05] tracking-[-0.045em] text-[#07111F]">Escolha uma discussão</h2>
          <p className="mt-2 text-[14px] font-[650] text-[#64748B]">Toque em uma enquete para responder</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pollsReady && !isHydratingVotes && polls.length > 0 && (
            <span className="rounded-full bg-[#ECFDF3] px-3 py-1.5 text-[12px] font-[850] text-[#10B85A]">{polls.length} ativas</span>
          )}
          {pollsReady && !isHydratingVotes && polls.length > 1 && (
            <CircleDot className="h-4 w-4 text-[#64748B]" strokeWidth={2.2} aria-hidden="true" />
          )}
        </div>
      </div>

      {!pollsReady || isHydratingVotes ? (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[136px] w-[120px] shrink-0 animate-pulse snap-start rounded-[22px] bg-[#F3F6F8]" />
          ))}
        </div>
      ) : (
        <>
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
          >
            {polls.map((poll, index) => {
              const active = poll.id === selectedPollId || (!selectedPollId && index === activeIndex)
              const voted = votedPolls.has(poll.id)
              return (
              <button
                type="button"
                key={poll.id}
                onClick={() => onSelectPoll(poll.id)}
                className="flex h-[136px] w-[120px] shrink-0 snap-start flex-col justify-between rounded-[22px] p-3.5 text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: active ? 'linear-gradient(145deg, #07111F 0%, #0B1A2E 100%)' : '#FFFFFF',
                  border: active ? '1px solid rgba(16,184,90,0.36)' : '1px solid rgba(15,23,42,0.08)',
                  boxShadow: active ? '0 18px 42px rgba(16,184,90,0.22), 0 18px 46px rgba(0,0,0,0.22)' : '0 10px 26px rgba(15,23,42,0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[15px]" style={{ background: active ? 'rgba(16,184,90,0.18)' : '#ECFDF3' }}>
                    <Activity className="h-4 w-4" style={{ color: active ? '#7EE2A8' : '#10B85A' }} strokeWidth={2.4} />
                  </span>
                  {voted && <span className="h-2 w-2 rounded-full bg-[#10B85A]" />}
                </div>
                <p className={`line-clamp-3 text-[12.5px] font-[850] leading-[1.18] tracking-[-0.025em] ${active ? 'text-white' : 'text-[#07111F]'}`}>{poll.question}</p>
                <div>
                  <span
                    className="inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-[11px] font-[850]"
                    style={{
                      background: voted ? (active ? 'rgba(255,255,255,0.14)' : '#EEF2F6') : '#10B85A',
                      color: voted ? (active ? 'rgba(255,255,255,0.82)' : '#07111F') : '#FFFFFF',
                      boxShadow: voted ? 'none' : '0 8px 20px rgba(16,184,90,0.24)',
                    }}
                  >
                    {voted ? 'Ver resultado' : 'Responder agora'}
                  </span>
                </div>
              </button>
              )
            })}
          </div>
          {polls.length > 1 && (
            <div className="mt-2 flex justify-center">
              <span className="text-[12px] font-[700] text-[#64748B]">
                {activeIndex + 1} / {polls.length}
              </span>
            </div>
          )}
        </>
      )}
      {pollsReady && !isHydratingVotes && polls.length === 0 && (
        <p className="py-2 text-[13px] font-semibold text-[#64748B]">Nenhuma enquete ativa no momento.</p>
      )}
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
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] ring-1 ring-white/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#10B85A]">O que a galera está votando</p>
          <h2 className="mt-1 text-[24px] font-[900] leading-[1.05] tracking-[-0.045em] text-[#07111F]">Atividade recente</h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-[#F3F6F8]">
          <Users className="h-5 w-5 text-[#6D4AFF]" />
        </span>
      </div>
      {feed.length === 0 ? (
        <p className="text-[14px] font-[500] leading-[1.6] text-[#64748B]">Nenhuma atividade dos amigos ainda.</p>
      ) : (
        <ul className="space-y-3">
          {feed.slice(0, 5).map(item => {
            const name = item.profile?.full_name || item.profile?.username || 'Alguém'
            const optionLabel = item.meta?.option_label as string | undefined
            const pollQuestion = item.target_name
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-[20px] bg-[#F8FAFA] p-3.5 ring-1 ring-black/[0.03]">
                <Avatar item={item} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-[15px] font-[900] tracking-[-0.02em] text-[#07111F]">{name}</p>
                    <span className="shrink-0 text-[11px] font-[700] text-[#94A3B8]">{timeAgo(item.created_at)}</span>
                  </div>
                  {pollQuestion && (
                    <p className="mt-1 line-clamp-1 text-[13px] font-[650] text-[#64748B]">{pollQuestion}</p>
                  )}
                  <p className="mt-1.5 text-[13px] font-[650] leading-snug text-[#64748B]">
                    {optionLabel ? (
                      <span className="font-[800] text-[#07111F]">{optionLabel}</span>
                    ) : (
                      <span className="font-[800] text-[#07111F]">{pollQuestion}</span>
                    )}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <Link
        href="/amigos"
        className="mt-5 flex h-[48px] items-center justify-center rounded-[20px] bg-[#10B85A] text-[14px] font-[850] text-white shadow-[0_12px_30px_rgba(16,184,90,0.24)] transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]"
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

// ─── Surprising Opinion ─────────────────────────────────────────────────────────────────
// Shows the leading opinion on the most-voted active poll.

function SurprisingOpinionCard() {
  const [status, setStatus] = useState<'loading' | 'empty' | 'done'>('loading')
  const [percentage, setPercentage] = useState(0)
  const [optionLabel, setOptionLabel] = useState('')
  const [question, setQuestion] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: polls } = await supabase
        .from('polls')
        .select('id, question, options')
        .eq('is_active', true)
      if (!polls || polls.length === 0) { setStatus('empty'); return }

      const { data: allVotes } = await supabase
        .from('poll_votes')
        .select('poll_id, option_index')
        .in('poll_id', polls.map((p: { id: string }) => p.id))
      if (!allVotes || allVotes.length === 0) { setStatus('empty'); return }

      let lowest: { poll: { id: string; question: string; options: Array<{ label: string }> | string }; optionIndex: number; percentage: number } | null = null
      for (const poll of polls) {
        const pollVotes = allVotes.filter((v: { poll_id: string }) => v.poll_id === poll.id)
        if (pollVotes.length < 3) continue
        const countByOption: Record<number, number> = {}
        for (const v of pollVotes) countByOption[v.option_index] = (countByOption[v.option_index] || 0) + 1
        for (const [idx, count] of Object.entries(countByOption)) {
          if (count <= 0) continue
          const pct = Math.round((count / pollVotes.length) * 100)
          if (!lowest || pct < lowest.percentage) lowest = { poll, optionIndex: Number(idx), percentage: pct }
        }
      }
      if (!lowest) { setStatus('empty'); return }

      const options: Array<{ label: string }> = Array.isArray(lowest.poll.options) ? lowest.poll.options : JSON.parse(lowest.poll.options)
      const label = options[lowest.optionIndex]?.label ?? `Opção ${lowest.optionIndex + 1}`

      setPercentage(lowest.percentage)
      setOptionLabel(label)
      setQuestion(lowest.poll.question)
      setStatus('done')
    }
    load()
  }, [])

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20)] ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#64748B]">Opinião mais inusitada</p>
        <Target className="h-4 w-4 text-[#6D4AFF]" strokeWidth={2.4} />
      </div>
      {status === 'loading' && (
        <div className="space-y-2">
          <div className="h-8 w-2/3 animate-pulse rounded-[6px] bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded-[6px] bg-slate-100" />
        </div>
      )}
      {status === 'empty' && (
        <p className="text-[13px] leading-[1.6] text-[#94A3B8]">Nenhum dado disponível ainda.</p>
      )}
      {status === 'done' && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-[38px] font-[900] leading-none tracking-[-0.05em] text-[#07111F]">{percentage}%</span>
            <span className="text-[13px] font-[700] text-[#64748B]">dos votos</span>
          </div>
          <p className="mt-2 text-[16px] font-[900] leading-[1.25] tracking-[-0.02em] text-[#07111F]">{optionLabel}</p>
          <p className="mt-2 text-[13px] font-[600] leading-[1.5] text-[#64748B]">{question}</p>
        </>
      )}
    </section>
  )
}

// ─── Biggest Disagreement ───────────────────────────────────────────────────────
// Surfaces the most evenly split poll — the one the community disagrees on most.

function BiggestDisagreementCard() {
  const [status, setStatus] = useState<'loading' | 'empty' | 'done'>('loading')
  const [question, setQuestion] = useState('')
  const [splitPct, setSplitPct] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: polls } = await supabase
        .from('polls')
        .select('id, question')
        .eq('is_active', true)
      if (!polls || polls.length === 0) { setStatus('empty'); return }

      const { data: allVotes } = await supabase
        .from('poll_votes')
        .select('poll_id, option_index')
        .in('poll_id', polls.map((p: { id: string }) => p.id))
      if (!allVotes || allVotes.length === 0) { setStatus('empty'); return }

      // For each poll compute how split it is (leading % closest to 50)
      type PollSplit = { pollId: string; leadingPct: number; total: number }
      const splits: PollSplit[] = []
      for (const poll of polls) {
        const votes = allVotes.filter((v: { poll_id: string }) => v.poll_id === poll.id)
        if (votes.length < 5) continue
        const countByOption: Record<number, number> = {}
        for (const v of votes) countByOption[v.option_index] = (countByOption[v.option_index] || 0) + 1
        const max = Math.max(...Object.values(countByOption))
        const pct = Math.round((max / votes.length) * 100)
        splits.push({ pollId: poll.id, leadingPct: pct, total: votes.length })
      }
      if (splits.length === 0) { setStatus('empty'); return }

      // Most divided = leading option has the lowest % (closest to 50)
      const mostDivided = splits.sort((a, b) => a.leadingPct - b.leadingPct)[0]
      const poll = polls.find((p: { id: string }) => p.id === mostDivided.pollId)
      if (!poll) { setStatus('empty'); return }

      setQuestion(poll.question)
      setSplitPct(mostDivided.leadingPct)
      setStatus('done')
    }
    load()
  }, [])

  return (
    <section
      className="rounded-[20px] p-5"
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
    >
      <p className="mb-4 text-[11px] font-[600] uppercase tracking-[0.07em] text-[#94A3B8]">Maior divergência</p>
      {status === 'loading' && (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded-[6px] bg-slate-100" />
          <div className="h-3 w-4/5 animate-pulse rounded-[6px] bg-slate-100" />
        </div>
      )}
      {status === 'empty' && (
        <p className="text-[13px] leading-[1.6] text-[#94A3B8]">Nenhum dado disponível ainda.</p>
      )}
      {status === 'done' && (
        <>
          <p className="text-[14px] font-[700] leading-[1.35] tracking-[-0.015em] text-[#0F172A]">{question}</p>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-[500] uppercase tracking-[0.05em] text-[#94A3B8]">Opção líder</span>
              <span className="text-[13px] font-[700] tabular-nums text-[#0F172A]">{splitPct}%</span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#0F172A] transition-all duration-700"
                style={{ width: `${splitPct}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-[12px] font-[400] leading-[1.5] text-[#94A3B8]">A torcida está dividida nesta discussão.</p>
        </>
      )}
    </section>
  )
}

// ─── Compatibility Highlight ────────────────────────────────────────────────────
// Shows the single most compatible friend. Premium-gated.

type CompatibilityEntry = {
  friendId: string
  username: string
  score: number
  totalCompared: number
}

function CompatibilityHighlightCard() {
  const [top, setTop] = useState<CompatibilityEntry | null>(null)
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'locked' | 'no-friends' | 'no-shared' | 'done'>('loading')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('unauthenticated'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()
      if (!profile?.is_premium) { setStatus('locked'); return }

      const { data: friendships } = await supabase
        .from('friendships')
        .select('following_id')
        .eq('follower_id', user.id)
      if (!friendships || friendships.length === 0) { setStatus('no-friends'); return }

      const friendIds = friendships.map((f: { following_id: string }) => f.following_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', friendIds)
      if (!profiles || profiles.length === 0) { setStatus('no-friends'); return }

      const results = await Promise.all(
        profiles.map(async (p: { id: string; username: string }) => {
          const { data } = await supabase.rpc('get_friend_comparison', {
            current_user_id: user.id,
            friend_user_id: p.id,
          })
          const rows = data || []
          const matches = rows.filter((r: { comparison_type: string }) => r.comparison_type === 'match').length
          const total = rows.length
          return { friendId: p.id, username: p.username, score: total > 0 ? Math.round((matches / total) * 100) : 0, totalCompared: total } as CompatibilityEntry
        })
      )
      const withShared = results.filter(r => r.totalCompared > 0)
      if (withShared.length === 0) { setStatus('no-shared'); return }

      setTop(withShared.sort((a, b) => b.score - a.score)[0])
      setStatus('done')
    }
    load()
  }, [])

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.20)] ring-1 ring-white/10">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[12px] font-[850] uppercase tracking-[0.08em] text-[#64748B]">Match do Dia</p>
        <Users className="h-4 w-4 text-[#6D4AFF]" strokeWidth={2.4} />
      </div>

      {status === 'loading' && (
        <div className="space-y-2">
          <div className="h-6 w-1/2 animate-pulse rounded-[6px] bg-slate-100" />
          <div className="h-3 w-1/3 animate-pulse rounded-[6px] bg-slate-100" />
        </div>
      )}

      {status === 'unauthenticated' && (
        <p className="text-[13px] leading-[1.6] text-[#94A3B8]">Entre para ver sua maior compatibilidade.</p>
      )}

      {status === 'locked' && (
        <div>
          <p className="mb-4 text-[13px] leading-[1.6] text-[#475569]">Descubra com quem você mais concorda.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-1.5 rounded-[18px] bg-[#07111F] px-4 py-2.5 text-[12px] font-[800] text-white transition hover:bg-[#1E293B]"
          >
            <Crown className="h-3.5 w-3.5" strokeWidth={2} />
            Ver com Premium
          </Link>
        </div>
      )}

      {(status === 'no-friends' || status === 'no-shared') && (
        <p className="text-[13px] leading-[1.6] text-[#94A3B8]">
          {status === 'no-friends' ? 'Adicione amigos para calcular afinidade.' : 'Vote nas mesmas enquetes que seus amigos.'}
        </p>
      )}

      {status === 'done' && top && (
        <>
          <Link href={`/premium/compare/${top.friendId}`} className="block no-underline group">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[38px] font-[900] leading-none tracking-[-0.05em] text-[#07111F]">{top.score}%</p>
                <p className="mt-1 truncate text-[14px] font-[850] text-[#64748B]">{top.username}</p>
              </div>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                style={{ background: '#ECFDF3', border: '1px solid #D1FAE5' }}
              >
                <Users className="h-5 w-5 text-[#10B85A]" strokeWidth={2.3} />
              </div>
            </div>
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#10B85A] transition-all duration-700"
                style={{ width: `${top.score}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] font-[700] tracking-[-0.005em] text-[#64748B] transition-colors group-hover:text-[#07111F]">
              Ver comparação completa
            </p>
          </Link>
        </>
      )}
    </section>
  )
}

