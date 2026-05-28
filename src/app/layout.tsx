import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Copa 2026 — Votes & Rankings',
  description: 'Vote no melhor jogador da Copa do Mundo 2026, veja rankings ao vivo e compete com seus amigos.',
  openGraph: {
    title: 'Copa 2026 — Votes & Rankings',
    description: 'Vote no melhor da Copa e compete com seus amigos!',
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
      <body className={`${inter.className} bg-[#080810] text-white min-h-screen`}>
        <Header />
        <main className="max-w-[480px] mx-auto pb-24">
          {children}
        </main>
        <BottomNav />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,215,0,0.2)',
              marginBottom: '80px',
            },
          }}
        />
      </body>
    </html>
  )
}
