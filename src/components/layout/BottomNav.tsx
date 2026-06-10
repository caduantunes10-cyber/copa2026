'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crown, Home, Users } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const activeHome = pathname === '/'
  const activeAmigos = pathname === '/amigos'
  const activePremium = pathname === '/premium'

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-[#E5E7EB] bg-white/96 px-4 py-2 shadow-[0_-12px_32px_rgba(17,24,39,0.08)] backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 items-center gap-1">
        {/* Left: Amigos */}
        <Link
          href="/amigos"
          aria-label="Ir para amigos"
          className={`col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black uppercase transition ${activeAmigos ? 'text-[#6C3BFF]' : 'text-[#6B7280]'}`}
        >
          <Users className="h-4 w-4" strokeWidth={2.6} />
          Amigos
        </Link>

        {/* Center: Home floating button */}
        <Link
          href="/"
          aria-label="Ir para início"
          className={`-mt-6 mx-auto grid h-14 w-14 place-items-center rounded-full shadow-[0_16px_34px_rgba(108,59,255,0.32)] transition ${activeHome ? 'bg-[#5B2FE5]' : 'bg-[#6C3BFF]'} text-white`}
        >
          <Home className="h-7 w-7" strokeWidth={2.2} />
        </Link>

        {/* Right: Premium */}
        <Link
          href="/premium"
          aria-label="Ir para premium"
          className={`col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black uppercase transition ${activePremium ? 'text-[#6C3BFF]' : 'text-[#6B7280]'}`}
        >
          <Crown className="h-4 w-4" strokeWidth={2.6} />
          Premium
        </Link>
      </div>
    </nav>
  )
}
