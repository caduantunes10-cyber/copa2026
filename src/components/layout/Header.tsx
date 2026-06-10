'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Shield, Trophy, Users } from 'lucide-react'
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
    <header className="sticky top-0 z-40 bg-[#F5F6F8]/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 sm:px-5 lg:px-6">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#16C45B] bg-white text-[#16C45B] shadow-sm">
            <Shield className="h-5 w-5" strokeWidth={2.9} />
          </span>
          <div>
            <div className="text-[1.45rem] font-black leading-none tracking-[-0.05em] text-[#111827]">
              PULSO
            </div>
            <div className="text-[0.72rem] font-black uppercase leading-none tracking-[0.12em] text-[#6C3BFF]">
              COPA
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-black uppercase tracking-wide text-[#111827] lg:flex">
          <Link href="/" className="border-b-2 border-[#6C3BFF] pb-2 text-[#6C3BFF]">Painel</Link>
          <Link href="/amigos" className="pb-2">Amigos</Link>
          <Link href="/premium" className="pb-2">Premium</Link>
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

        <div className="flex items-center gap-2">
          <button className="hidden rounded-full p-2 text-[#111827] sm:grid">
            <Search className="h-5 w-5" />
          </button>
          <button className="relative hidden rounded-full p-2 text-[#111827] sm:grid">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#6C3BFF] text-[9px] font-black text-white">3</span>
          </button>
          {!profile ? (
            <button onClick={handleLogin}
              className="rounded-full bg-[#6C3BFF] px-5 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(108,59,255,0.24)]">
              Entrar
            </button>
          ) : (
            <Link href="/amigos" className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8FFF0] text-sm font-black text-[#16C45B] ring-2 ring-white">
                  {profile.full_name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden leading-tight lg:block">
                <div className="text-xs font-black text-[#111827]">{profile.full_name || profile.username}</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
