'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export function Header() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    })
  }, [])

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` }
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-40 max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between"
      style={{ background: 'rgba(8,8,16,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(14px)' }}>
      
      {/* LOGO */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <span className="text-2xl">⚽</span>
        <div>
          <div className="font-black text-white text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>
            COPA<span style={{ color: '#FFD700' }}>2026</span>
          </div>
          <div className="text-[9px] tracking-widest" style={{ color: '#444' }}>VOTES & RANKINGS</div>
        </div>
      </Link>

      {/* AUTH */}
      <div className="flex items-center gap-2">
        {profile?.is_premium && (
          <span className="px-2 py-1 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
            👑 VIP
          </span>
        )}
        {!profile ? (
          <button onClick={handleLogin}
            className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
            🔑 Entrar com Google
          </button>
        ) : (
          <Link href="/perfil">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#009C3B,#FFD700)' }}>
                {profile.full_name?.[0] || 'U'}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  )
}
