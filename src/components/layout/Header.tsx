'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, Home, Shield, Users } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-40 shadow-[0_2px_16px_rgba(15,23,42,0.05)]" style={{ background: 'rgba(248,250,252,0.86)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(22,101,52,0.10)' }}>
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#16C45B]/30 bg-[#F0FDF4] text-[#16C45B]">
            <Shield className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-[1.1rem] font-black leading-none tracking-[-0.04em] text-[#111827]">
              PULSO
            </div>
            <div className="text-[0.58rem] font-bold uppercase leading-none tracking-[0.16em] text-[#5B4BFF]">
              COPA 2026
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {[
            { label: 'Painel', Icon: Home, href: '/' },
            { label: 'Amigos', Icon: Users, href: '/amigos' },
            { label: 'Premium', Icon: Crown, href: '/premium' },
          ].map(({ label, Icon, href }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-2 rounded-[12px] px-4 py-2 text-[14px] font-[500] transition-all duration-200 ${
                href === '/' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#0F172A]'
              }`}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
              {label}
            </Link>
          ))}
        </nav>

        <nav className="ml-3 hidden flex-1 justify-center gap-1.5 sm:flex lg:hidden">
          {[
            { label: 'Painel', Icon: Home, href: '/' },
            { label: 'Amigos', Icon: Users, href: '/amigos' },
          ].map(({ label, Icon, href }) => (
            <Link key={label} href={href} className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-bold transition-colors duration-200 ${href === '/' ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-sm' : 'text-[#64748B]'}`}>
              <Icon className="h-4 w-4" strokeWidth={2.2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!profile ? (
            <button onClick={handleLogin}
              className="rounded-[12px] bg-[#5B4BFF] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(91,75,255,0.30)] transition hover:bg-[#4A3AE8] active:scale-[0.98]">
              Entrar
            </button>
          ) : (
            <Link href="/amigos" className="flex items-center gap-2.5">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-black/10" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E8FFF0] text-[13px] font-black text-[#16C45B] ring-1 ring-black/10">
                  {profile.full_name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden leading-tight lg:block">
                <div className="text-[13px] font-semibold text-[#111827]">{profile.full_name || profile.username}</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
