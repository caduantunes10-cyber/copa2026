'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, BarChart3, Check, Crown, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import FriendComparisonSection from '@/components/premium/FriendComparisonSection'

const BENEFITS = [
  { icon: Users, text: 'Compare suas opiniões com amigos' },
  { icon: BadgeCheck, text: 'Badge VIP visível no seu perfil' },
  { icon: ShieldCheck, text: 'Experiências premium da Copa' },
]

export default function PremiumPage() {
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setChecking(false); return }
      const { data } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
      if (data) setIsPremium(data.is_premium)
      setChecking(false)
    })

    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    if (search?.get('success') === 'true') {
      toast.success('Bem-vindo ao Premium. Aproveite tudo.', { duration: 5000 })
    }
  }, [])

  async function handleSubscribe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Faça login primeiro')
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback` }
      })
      return
    }

    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error('Erro ao abrir checkout. Tente novamente.')
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="flex h-64 items-center justify-center text-sm font-black text-slate-400">Carregando...</div>
  }

  if (isPremium) {
    return (
      <div className="section-stack pb-28">
        <section className="cinematic-panel rounded-[36px] p-8 text-center sm:p-10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-hot-red/10 text-electric-lime">
            <Crown className="h-8 w-8" strokeWidth={2.8} />
          </div>
          <h1 className="section-title text-4xl sm:text-5xl">Você é Premium</h1>
          <p className="section-copy mx-auto mt-4 max-w-xl text-sm">Todos os benefícios estão ativos na sua conta.</p>
        </section>
        
        <section className="cinematic-panel rounded-[36px] p-6 sm:p-8">
          <div className="mb-6 section-kicker">
            <Users className="h-4 w-4" />
            Comparar com Amigos
          </div>
          <h2 className="section-title text-2xl sm:text-3xl mb-4">Descubra o quão similar você é aos seus amigos</h2>
          <p className="section-copy mb-6 text-sm">Compare suas opiniões sobre a Copa do Mundo e veja quem pensa como você.</p>
          
          <FriendComparisonSection />
        </section>
        
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(b => {
            const Icon = b.icon
            return (
              <div key={b.text} className="premium-surface flex items-center justify-between rounded-3xl p-4">
                <span className="flex items-center gap-3 text-sm font-black text-white"><Icon className="h-5 w-5 text-electric-lime" />{b.text}</span>
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  return (
    <div className="section-stack pb-28">
      <section className="grid gap-7 lg:grid-cols-[1fr_0.85fr] lg:items-stretch">
        <div className="relative overflow-hidden cinematic-panel rounded-[36px] p-6 sm:p-10">
          <div className="absolute left-0 top-0 h-1.5 w-full bg-hot-red" />
          <div className="mb-6 section-kicker">
            <Crown className="h-4 w-4" />
            Copa 2026 Premium
          </div>
          <h1 className="section-title max-w-2xl text-5xl sm:text-6xl">
            Mais influência nas votações da Copa.
          </h1>
          <p className="section-copy mt-6 max-w-2xl text-base">
            Votos ilimitados, badge VIP e destaque no feed social dos seus amigos.
          </p>
          <div className="mt-9 grid gap-3.5 sm:grid-cols-2">
            <div className="premium-surface rounded-3xl p-4"><div className="text-2xl font-black text-white">∞</div><div className="text-xs font-black uppercase text-slate-400">votos por dia</div></div>
            <div className="premium-surface rounded-3xl p-4"><div className="text-2xl font-black text-electric-lime">VIP</div><div className="text-xs font-black uppercase text-slate-400">no feed</div></div>
          </div>
        </div>

        <div className="premium-surface rounded-[32px] border-electric-lime/20 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-electric-lime">Plano mensal</p>
          <div className="mt-4 flex items-end gap-2 text-white">
            <span className="text-6xl font-black tracking-[-0.08em]">R$ 9</span>
            <span className="pb-2 text-3xl font-black">,90</span>
            <span className="pb-3 text-sm font-bold text-slate-400">/mês</span>
          </div>
          <p className="section-copy mt-4 text-sm">Pagamento seguro via Stripe. Cancele quando quiser.</p>
          <button onClick={handleSubscribe} disabled={loading}
            className="btn-hype mt-6 w-full px-5 py-4 text-sm uppercase tracking-wide">
            {loading ? 'Abrindo pagamento...' : 'Assinar por R$ 9,90/mês'}
          </button>
          <div className="mt-7 space-y-3">
            {BENEFITS.map(b => {
              const Icon = b.icon
              return (
                <div key={b.text} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10 transition hover:bg-white/[0.08]">
                  <Icon className="h-5 w-5 shrink-0 text-electric-lime" />
                  <span className="text-sm font-bold text-white">{b.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="cinematic-panel rounded-[36px] p-6 sm:p-8">
        <p className="section-kicker">Impacto social</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.04em] text-white">Seu voto aparece mais forte no ranking e no feed.</h2>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            { user: '@torcedor_vermelho', text: 'Com votos ilimitados consegui puxar meu jogador para o top 3.' },
            { user: '@copa_social', text: 'O badge VIP deixa a participação muito mais visível no feed.' },
            { user: '@ranking_fc', text: 'Premium é para quem acompanha a disputa todos os dias.' },
          ].map(r => (
            <div key={r.user} className="social-card rounded-3xl p-5">
              <p className="text-sm font-black text-electric-lime">{r.user}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


