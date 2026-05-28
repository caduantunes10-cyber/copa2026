'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const BENEFITS = [
  { icon: '⚡', text: 'Votos ilimitados por dia' },
  { icon: '🏆', text: 'Voto com peso 3x no ranking' },
  { icon: '📊', text: 'Enquetes Premium exclusivas' },
  { icon: '📰', text: 'Reportagens e bastidores exclusivos' },
  { icon: '💔', text: 'Conteúdo completo dos Ausentes da Copa' },
  { icon: '🎖️', text: 'Badge 👑 VIP visível no seu perfil' },
  { icon: '👥', text: 'Destaque no feed social dos amigos' },
  { icon: '🔮', text: 'Previsões de partidas (em breve)' },
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
      toast.success('🎉 Bem-vindo ao Premium! Aproveite tudo!', { duration: 5000 })
    }
  }, [])

  async function handleSubscribe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Faça login primeiro! 🔑')
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
    return <div className="flex items-center justify-center h-64 text-white">Carregando...</div>
  }

  if (isPremium) {
    return (
      <div className="px-4 py-8 text-center pb-24">
        <div className="text-7xl mb-4">👑</div>
        <h1 className="text-2xl font-black text-white mb-2">Você é Premium!</h1>
        <p className="text-sm mb-8" style={{ color: '#888' }}>Todos os benefícios estão ativos</p>
        <div className="space-y-3">
          {BENEFITS.map(b => (
            <div key={b.text} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}>
              <span className="text-white text-sm">{b.icon} {b.text}</span>
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>Ativo ✓</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 pb-24">
      {/* HERO */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">👑</div>
        <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Copa 2026 Premium
        </h1>
        <p className="text-sm" style={{ color: '#888' }}>Viva a Copa com tudo desbloqueado</p>
      </div>

      {/* PREÇO */}
      <div className="rounded-2xl p-5 mb-5"
        style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,140,0,0.04))', border: '1px solid rgba(255,215,0,0.25)' }}>
        <div className="text-center mb-5">
          <div className="text-xs font-bold tracking-widest mb-1" style={{ color: '#FFD700' }}>PLANO MENSAL</div>
          <div className="text-white font-black" style={{ fontSize: 42, lineHeight: 1 }}>
            R$ 9<span style={{ fontSize: 24 }}>,90</span>
            <span className="text-base font-normal" style={{ color: '#666' }}>/mês</span>
          </div>
          <div className="text-xs mt-2" style={{ color: '#4ade80' }}>✓ Cancele quando quiser</div>
        </div>

        <div className="space-y-3 mb-6">
          {BENEFITS.map(b => (
            <div key={b.text} className="flex items-center gap-3">
              <span className="text-xl w-7 text-center">{b.icon}</span>
              <span className="text-sm" style={{ color: '#ddd' }}>{b.text}</span>
            </div>
          ))}
        </div>

        <button onClick={handleSubscribe} disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-black text-lg btn-gold"
          style={{ fontSize: 16 }}>
          {loading ? 'Abrindo pagamento...' : 'ASSINAR POR R$ 9,90/MÊS'}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: '#555' }}>
          Pagamento seguro via Stripe · Cartão de crédito ou débito
        </p>
      </div>

      {/* SOCIAL PROOF */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xs font-bold mb-3" style={{ color: '#666' }}>💬 O que dizem os assinantes</div>
        {[
          { user: '@torcedor_verde', text: 'Consegui votar 10x no Vini Jr. hoje! Vale demais 🇧🇷' },
          { user: '@copa_viciado', text: 'As reportagens exclusivas são incríveis, detalhes que não acho em lugar nenhum' },
          { user: '@futebol_br22', text: 'O badge VIP no feed é muito maneiro, todo mundo vê!' },
        ].map(r => (
          <div key={r.user} className="mb-3 last:mb-0">
            <span className="text-xs font-bold" style={{ color: '#FFD700' }}>{r.user} </span>
            <span className="text-xs" style={{ color: '#aaa' }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
