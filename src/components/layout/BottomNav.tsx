'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Plus, Radio, Trophy, Users } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()
  const items = [
    { href: '/', label: 'Painel', icon: Trophy },
    { href: '/ranking', label: 'Ao vivo', icon: Radio },
    { href: '/amigos', label: 'Amigos', icon: Users },
    { href: '/amigos', label: 'Explorar', icon: Compass },
  ]

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-[#E5E7EB] bg-white/96 px-4 py-2 shadow-[0_-12px_32px_rgba(17,24,39,0.08)] backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 items-center gap-1">
        {items.slice(0, 2).map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black uppercase transition ${active ? 'text-[#6C3BFF]' : 'text-[#6B7280]'}`}>
              <Icon className="h-4 w-4" strokeWidth={2.6} />
              {item.label}
            </Link>
          )
        })}
        <button className="-mt-6 mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#6C3BFF] text-white shadow-[0_16px_34px_rgba(108,59,255,0.32)]">
          <Plus className="h-7 w-7" />
        </button>
        {items.slice(2).map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black uppercase transition ${active ? 'text-[#6C3BFF]' : 'text-[#6B7280]'}`}>
              <Icon className="h-4 w-4" strokeWidth={2.6} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
