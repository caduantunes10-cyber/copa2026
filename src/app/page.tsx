'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Activity, Crown, TrendingUp, Users } from 'lucide-react'
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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

  const featuredPoll = pollsReady && !isHydratingVotes && polls.length > 0 ? polls[0] : null
  const insights = buildTodayInsights({ polls, votedPolls, selectedPollOptions, pollResults, friendFeed, userId, pollsReady, isHydratingVotes })

  return (
    <div className="pb-10 lg:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_308px]">

        <main className="min-w-0 space-y-6">
          <HeroSection />
          <TodayInsightsSection insights={insights} loading={!pollsReady || isHydratingVotes} />
          {featuredPoll && (
            <FeaturedPollCard poll={featuredPoll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} friendFeed={friendFeed} lastVotedPollId={lastVotedPollId} onVote={handlePollVote} />
          )}
          <DailyPollsCard polls={polls} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} isHydratingVotes={isHydratingVotes} pollsReady={pollsReady} friendFeed={friendFeed} lastVotedPollId={lastVotedPollId} onVote={handlePollVote} />

          <div className="grid gap-4 lg:hidden">
            <FriendsCtaCard feed={friendFeed} />
            <PremiumCtaCard />
            <CompatibilityHighlightCard />
            <SurprisingOpinionCard />
            <BiggestDisagreementCard />
          </div>
        </main>

        <aside className="hidden space-y-5 lg:block lg:pt-0">
          <FriendsCtaCard feed={friendFeed} />
          <PremiumCtaCard />
          <CompatibilityHighlightCard />
          <SurprisingOpinionCard />
          <BiggestDisagreementCard />
        </aside>

      </div>
    </div>
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
          <PostVoteSocialCard pollId={poll.id} friendFeed={friendFeed} selectedPollOptions={selectedPollOptions} lastVotedPollId={lastVotedPollId} />
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
  lastVotedPollId,
}: {
  pollId: string
  friendFeed: FeedActivity[]
  selectedPollOptions: SelectedPollOptions
  lastVotedPollId: string | null
}) {
  // Only show on the poll the user just voted on
  if (pollId !== lastVotedPollId) return null
  const myOption = selectedPollOptions[pollId]
  if (myOption === undefined) return null

  const match = friendFeed.find(
    f => f.action_type === 'poll_vote' && f.target_id === pollId && f.meta !== null
  )

  let title: string
  let body: string
  let supporting: string
  let cta: string
  let href: string
  let accentColor: string
  let accentBg: string
  let borderColor: string

  if (match) {
    const friendOption = (match.meta as Record<string, unknown>)?.option_index
    const name = match.profile?.full_name || match.profile?.username || 'Um amigo'
    if (Number(friendOption) === myOption) {
      title = 'Vocês chegaram à mesma conclusão.'
      body = `${name} escolheu exatamente a mesma resposta.`
      supporting = 'Talvez vocês pensem mais parecido do que imaginam.'
      cta = 'Ver compatibilidade'
      href = `/premium/compare/${match.user_id}`
      accentColor = '#15803D'
      accentBg = 'rgba(240,253,244,0.80)'
      borderColor = 'rgba(34,197,94,0.20)'
    } else {
      title = 'Vocês escolheram lados opostos.'
      body = `${name} acredita em algo diferente nesta discussão.`
      supporting = 'Essa pode ser uma das maiores divergências entre vocês.'
      cta = 'Comparar opiniões'
      href = `/premium/compare/${match.user_id}`
      accentColor = '#B91C1C'
      accentBg = 'rgba(254,242,242,0.85)'
      borderColor = 'rgba(239,68,68,0.18)'
    }
  } else {
    title = 'Ainda não há comparação disponível.'
    body = 'Convide amigos e descubra quem realmente pensa como você.'
    supporting = ''
    cta = 'Encontrar amigos'
    href = '/amigos'
    accentColor = '#374151'
    accentBg = 'rgba(248,250,252,0.90)'
    borderColor = 'rgba(226,232,240,0.90)'
  }

  return (
    <Link href={href} className="block no-underline">
      <div
        className="mt-4 overflow-hidden rounded-[18px] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] hover:-translate-y-[1px] active:scale-[0.99]"
        style={{
          background: accentBg,
          border: `1px solid ${borderColor}`,
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <div className="px-5 py-4">
          <p className="text-[15px] font-[800] leading-[1.25] tracking-[-0.025em] text-[#0F172A]">
            {title}
          </p>
          <p className="mt-1.5 text-[13px] font-[400] leading-[1.55] text-[#334155]">
            {body}
          </p>
          {supporting && (
            <p className="mt-1 text-[12px] font-[400] leading-[1.5] text-[#64748B]">
              {supporting}
            </p>
          )}
          <div
            className="mt-4 inline-flex items-center gap-1 text-[13px] font-[700] tracking-[-0.01em]"
            style={{ color: accentColor }}
          >
            {cta}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
                            <div className="h-full max-w-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: '#22C55E' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[13px] text-[#64748B]">{totalVotes.toLocaleString('pt-BR')} votos</p>
                  <PostVoteSocialCard pollId={poll.id} friendFeed={friendFeed} selectedPollOptions={selectedPollOptions} lastVotedPollId={lastVotedPollId} />
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

function DailyPollsCard({ polls, votedPolls, selectedPollOptions, pollResults, resultsLoading, isHydratingVotes, pollsReady, friendFeed, lastVotedPollId, onVote }: {
  polls: HomePoll[]
  votedPolls: Set<string>
  selectedPollOptions: SelectedPollOptions
  pollResults: PollResults
  resultsLoading: Set<string>
  isHydratingVotes: boolean
  pollsReady: boolean
  friendFeed: FeedActivity[]
  lastVotedPollId: string | null
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
    <section className="overflow-hidden my-10 rounded-[24px] px-[18px] py-[18px] pb-[110px] md:rounded-[32px] md:p-[32px] md:pb-[32px]" style={{ background: '#101722' }}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-[24px] font-[700] tracking-[-0.02em] text-white">Enquetes do dia</h2>
        <div className="flex items-center gap-2">
          {pollsReady && !isHydratingVotes && polls.length > 0 && (
            <span className="text-[14px] font-[600] text-[#22C55E]">{polls.length} ativas</span>
          )}
          {pollsReady && !isHydratingVotes && polls.length > 1 && (
            <span className="md:hidden text-[18px] font-[300] leading-none text-white/40" aria-hidden="true">›</span>
          )}
        </div>
      </div>
      <p className="mb-5 text-[13px] text-white/55 md:hidden">Deslize para ver mais enquetes</p>
      <div className="hidden md:block mb-5" />
      <div>
      {!pollsReady || isHydratingVotes ? (
        <>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse shrink-0 w-[86vw] max-w-[360px] rounded-[22px] p-[18px] min-h-[180px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="mb-3 flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-[12px] bg-white/10" />
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
          <div className="hidden md:grid gap-6 grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse rounded-[20px] p-6 min-h-[240px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="mb-3 flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-[14px] bg-white/10" />
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
        </>
      ) : (
        <>
          {/* Mobile: horizontal snap carousel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden"
          >
            {polls.map((poll) => (
              <div key={poll.id} className="snap-start shrink-0 w-[86vw] max-w-[360px] flex flex-col gap-3 rounded-[22px] p-[18px]" style={{ background: '#FCFCFD', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                <PollCardInner poll={poll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} friendFeed={friendFeed} lastVotedPollId={lastVotedPollId} onVote={onVote} />
              </div>
            ))}
          </div>
          {/* Mobile: position indicator */}
          {polls.length > 1 && (
            <div className="mt-3 flex justify-center md:hidden">
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                {activeIndex + 1} / {polls.length}
              </span>
            </div>
          )}
          {/* Desktop: grid */}
          <div className="hidden md:grid gap-6 grid-cols-2">
            {polls.map((poll) => (
              <div key={poll.id} className="group/card flex flex-col gap-3 transition-all duration-[180ms] ease-in-out hover:-translate-y-1 rounded-[20px] p-[24px]" style={{ background: '#FCFCFD', border: '1px solid rgba(226,232,240,0.9)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
                <PollCardInner poll={poll} votedPolls={votedPolls} selectedPollOptions={selectedPollOptions} pollResults={pollResults} resultsLoading={resultsLoading} friendFeed={friendFeed} lastVotedPollId={lastVotedPollId} onVote={onVote} />
              </div>
            ))}
          </div>
        </>
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

      const countByPoll: Record<string, number> = {}
      for (const v of allVotes) countByPoll[v.poll_id] = (countByPoll[v.poll_id] || 0) + 1
      const topPollId = Object.entries(countByPoll).sort((a, b) => b[1] - a[1])[0][0]
      const topPoll = polls.find((p: { id: string }) => p.id === topPollId)
      if (!topPoll) { setStatus('empty'); return }

      const pollVotes = allVotes.filter((v: { poll_id: string }) => v.poll_id === topPollId)
      const total = pollVotes.length
      const countByOption: Record<number, number> = {}
      for (const v of pollVotes) countByOption[v.option_index] = (countByOption[v.option_index] || 0) + 1
      const topIdx = Number(Object.entries(countByOption).sort((a, b) => b[1] - a[1])[0][0])
      const pct = Math.round((countByOption[topIdx] / total) * 100)
      const options: Array<{ label: string }> = Array.isArray(topPoll.options) ? topPoll.options : JSON.parse(topPoll.options)
      const label = options[topIdx]?.label ?? `Opção ${topIdx + 1}`

      setPercentage(pct)
      setOptionLabel(label)
      setQuestion(topPoll.question)
      setStatus('done')
    }
    load()
  }, [])

  return (
    <section
      className="rounded-[20px] p-5"
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
    >
      <p className="mb-4 text-[11px] font-[600] uppercase tracking-[0.07em] text-[#94A3B8]">A maioria decidiu</p>
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
            <span className="text-[36px] font-[800] leading-none tracking-[-0.04em] text-[#0F172A]">{percentage}%</span>
            <span className="text-[13px] font-[500] text-[#64748B]">dos votos</span>
          </div>
          <p className="mt-2 text-[14px] font-[600] leading-[1.35] tracking-[-0.01em] text-[#0F172A]">{optionLabel}</p>
          <p className="mt-1 text-[12px] font-[400] leading-[1.55] text-[#94A3B8]">{question}</p>
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
    <section
      className="rounded-[20px] p-5"
      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
    >
      <p className="mb-4 text-[11px] font-[600] uppercase tracking-[0.07em] text-[#94A3B8]">Maior afinidade</p>

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
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0F172A] px-4 py-2.5 text-[12px] font-[600] text-white transition hover:bg-[#1E293B]"
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
                <p className="text-[20px] font-[800] leading-none tracking-[-0.03em] text-[#0F172A]">{top.score}%</p>
                <p className="mt-1 truncate text-[13px] font-[500] text-[#475569]">{top.username}</p>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <Users className="h-4 w-4 text-[#475569]" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#0F172A] transition-all duration-700"
                style={{ width: `${top.score}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] font-[500] tracking-[-0.005em] text-[#94A3B8] group-hover:text-[#475569] transition-colors">
              Ver comparação completa
            </p>
          </Link>
        </>
      )}
    </section>
  )
}

