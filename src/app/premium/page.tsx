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
    return <div className="flex h-64 items-center justify-center text-[12px] font-black text-[#9CA3AF]">Carregando...</div>
  }

  if (isPremium) {
    return (
      <div className="space-y-5 pb-10">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6C3BFF] to-[#4338CA] p-8 text-center shadow-[0_12px_40px_rgba(108,59,255,0.28)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.06]" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/[0.06]" />
          <div className="relative">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-white ring-1 ring-white/20">
              <Crown className="h-8 w-8" strokeWidth={2.8} />
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">Você é Premium</h1>
            <p className="mx-auto mt-3 max-w-sm text-[13px] font-medium leading-relaxed text-white/70">Todos os benefícios estão ativos na sua conta.</p>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03] sm:p-8">
          <div className="mb-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#6C3BFF]">
            <Users className="h-3.5 w-3.5" />
            Comparar com Amigos
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#111827] sm:text-2xl">Descubra o quão similar você é aos seus amigos</h2>
          <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#6B7280]">Compare suas opiniões sobre a Copa do Mundo e veja quem pensa como você.</p>
          <div className="mt-6">
            <FriendComparisonSection />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(b => {
            const Icon = b.icon
            return (
              <div key={b.text} className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-[#1a1033] to-[#2d1f5e] px-4 py-3.5 ring-1 ring-white/10">
                <span className="flex items-center gap-3 text-[12px] font-black text-white"><Icon className="h-4 w-4 text-[#16C45B]" />{b.text}</span>
                <Check className="h-4 w-4 shrink-0 text-[#16C45B]" />
              </div>
            )
          })}
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03] sm:p-8">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-[28px] bg-gradient-to-r from-[#6C3BFF] to-[#16C45B]" />
          <div className="mb-5 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#6C3BFF]">
            <Crown className="h-3.5 w-3.5" />
            Copa 2026 Premium
          </div>
          <h1 className="max-w-sm text-3xl font-black leading-tight tracking-[-0.04em] text-[#111827] sm:text-4xl">
            Mais influência nas votações da Copa.
          </h1>
          <p className="mt-4 max-w-sm text-[13px] font-medium leading-relaxed text-[#6B7280]">
            Compare suas opiniões com amigos e mostre quem manda nas votações da Copa.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1033] to-[#2d1f5e] p-4 ring-1 ring-white/10">
              <div className="text-2xl font-black text-white">∞</div>
              <div className="text-[10px] font-black uppercase tracking-wide text-white/40">votos por dia</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[#1a1033] to-[#2d1f5e] p-4 ring-1 ring-white/10">
              <div className="text-2xl font-black text-[#16C45B]">VIP</div>
              <div className="text-[10px] font-black uppercase tracking-wide text-white/40">badge no perfil</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-gradient-to-br from-[#1a1033] to-[#2d1f5e] p-6 ring-1 ring-white/10 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#16C45B]">Plano mensal</p>
          <div className="mt-3 flex items-end gap-1.5 text-white">
            <span className="text-5xl font-black tracking-[-0.06em]">R$ 9</span>
            <span className="pb-1.5 text-3xl font-black">,90</span>
            <span className="pb-2 text-[12px] font-semibold text-white/40">/mês</span>
          </div>
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-white/50">Pagamento seguro via Stripe. Cancele quando quiser.</p>
          <button onClick={handleSubscribe} disabled={loading}
            className="mt-5 w-full rounded-2xl bg-[#6C3BFF] px-5 py-3.5 text-[12px] font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.4)] transition hover:bg-[#5b2fe0] active:scale-[0.98] disabled:opacity-60">
            {loading ? 'Abrindo pagamento...' : 'Assinar por R$ 9,90/mês'}
          </button>
          <div className="mt-5 space-y-2">
            {BENEFITS.map(b => {
              const Icon = b.icon
              return (
                <div key={b.text} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3.5 py-3 ring-1 ring-white/[0.08] transition hover:bg-white/[0.09]">
                  <Icon className="h-4 w-4 shrink-0 text-[#16C45B]" />
                  <span className="text-[12px] font-bold text-white">{b.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-gradient-to-br from-[#1a1033] to-[#2d1f5e] p-6 ring-1 ring-white/10 sm:p-8">
        <div className="mb-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#16C45B]">
          <Sparkles className="h-3.5 w-3.5" />
          Impacto social
        </div>
        <h2 className="mt-2 max-w-2xl text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Seu voto aparece mais forte no feed dos seus amigos.</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { user: '@torcedor_vermelho', text: 'Com votos ilimitados consegui puxar meu jogador para o top 3.' },
            { user: '@copa_social', text: 'O badge VIP deixa a participação muito mais visível no feed.' },
            { user: '@ranking_fc', text: 'Premium é para quem acompanha a disputa todos os dias.' },
          ].map(r => (
            <div key={r.user} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/[0.08]">
              <p className="text-[12px] font-black text-[#16C45B]">{r.user}</p>
              <p className="mt-2 text-[12px] font-medium leading-relaxed text-white/60">{r.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


