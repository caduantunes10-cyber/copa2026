'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Trophy, Users } from 'lucide-react'
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
    <header className="sticky top-0 z-40 border-b border-black/[0.04] bg-[#F5F6F8]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between px-4 py-2.5 sm:px-5 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#16C45B] bg-white text-[#16C45B]">
            <Shield className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div>
            <div className="text-[1.05rem] font-black leading-none tracking-[-0.04em] text-[#111827]">
              PULSO
            </div>
            <div className="text-[0.6rem] font-bold uppercase leading-none tracking-[0.14em] text-[#6C3BFF]">
              COPA
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/" className="text-[12px] font-semibold text-[#6C3BFF]">Painel</Link>
          <Link href="/amigos" className="text-[12px] font-semibold text-[#6B7280] transition hover:text-[#111827]">Amigos</Link>
          <Link href="/premium" className="text-[12px] font-semibold text-[#6B7280] transition hover:text-[#111827]">Premium</Link>
        </nav>

        <nav className="ml-3 hidden flex-1 justify-center gap-2 sm:flex lg:hidden">
          {[
            ['Painel', Trophy, '/'],
            ['Amigos', Users, '/amigos'],
          ].map(([label, Icon, href]: any) => (
            <Link key={label} href={href} className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-bold ${href === '/' ? 'bg-[#6C3BFF]/10 text-[#6C3BFF] shadow-sm' : 'text-[#111827]'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          {!profile ? (
            <button onClick={handleLogin}
              className="rounded-full bg-[#6C3BFF] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(108,59,255,0.20)]">
              Entrar
            </button>
          ) : (
            <Link href="/amigos" className="flex items-center gap-2">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-8 w-8 rounded-full object-cover ring-1 ring-black/10" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FFF0] text-[12px] font-black text-[#16C45B] ring-1 ring-black/10">
                  {profile.full_name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden leading-tight lg:block">
                <div className="text-[12px] font-semibold text-[#111827]">{profile.full_name || profile.username}</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
