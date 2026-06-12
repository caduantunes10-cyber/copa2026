import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { Toaster } from 'react-hot-toast'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pulsofc.com.br'),
  title: 'Pulso FC — Descubra quem pensa como você',
  description: 'Vote em enquetes de futebol, compare opiniões com amigos e descubra quem realmente pensa como você.',
  openGraph: {
    title: 'Pulso FC — Descubra quem pensa como você',
    description: 'Vote em enquetes de futebol, compare opiniões com amigos e descubra quem realmente pensa como você.',
    url: 'https://www.pulsofc.com.br',
    siteName: 'Pulso FC',
    images: ['/og-image.png'],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulso FC — Descubra quem pensa como você',
    description: 'Vote em enquetes de futebol, compare opiniões com amigos e descubra quem realmente pensa como você.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen text-[#F8FAFC] antialiased" style={{ fontFamily: '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#07111F' }}>
        <Header />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-32 pt-6 sm:px-6 sm:pb-10 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: 'Termos', href: '/termos' },
              { label: 'Privacidade', href: '/privacidade' },
              { label: 'Cookies', href: '/cookies' },
              { label: 'Contato', href: '/contato' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12px] font-[500] text-[#94A3B8] transition hover:text-[#64748B]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-[#CBD5E1]">© {new Date().getFullYear()} Pulso FC</p>
        </footer>
        <BottomNav />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid rgba(17,24,39,0.08)',
              boxShadow: '0 20px 60px rgba(17,24,39,0.12)',
              marginBottom: '88px',
              borderRadius: '18px',
              fontWeight: 800,
            },
          }}
        />
      </body>
    </html>
  )
}
