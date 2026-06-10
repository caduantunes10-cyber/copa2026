import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Copa 2026 — The World Cup Social Network',
  description: 'A experiência social em tempo real da Copa do Mundo 2026: votos, palpites, rankings, amigos e rivalidade.',
  openGraph: {
    title: 'Copa 2026 — The World Cup Social Network',
    description: 'Vote, reaja, preveja resultados e dispute rankings sociais durante a Copa do Mundo 2026.',
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
      <body className={`${inter.className} min-h-screen bg-[#F5F6F8] text-[#111827] antialiased`}>
        <Header />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-4 sm:px-5 lg:px-6">
          {children}
        </main>
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
