import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contato — Pulso FC',
  description: 'Entre em contato com o Pulso FC.',
}

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-[12px] font-[600] uppercase tracking-[0.12em] text-[#16A34A]">Suporte</p>
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#0F172A] sm:text-[40px]">Contato</h1>
        <p className="mt-3 text-[15px] leading-[1.7] text-[#64748B]">
          Para entrar em contato com o Pulso FC, envie um e-mail para o endereço abaixo.
          Nossa equipe responde em até <strong className="font-[600] text-[#0F172A]">15 dias úteis</strong>.
        </p>
      </div>

      <div
        className="rounded-[20px] p-8"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.70) 100%)',
          border: '1px solid rgba(22,101,52,0.10)',
          boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
        }}
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ background: 'rgba(91,75,255,0.10)' }}>
          <Mail className="h-5 w-5 text-[#5B4BFF]" strokeWidth={2} />
        </div>
        <p className="mb-1 text-[13px] font-[500] uppercase tracking-[0.10em] text-[#64748B]">E-mail</p>
        <a
          href="mailto:contatopulsofc@gmail.com"
          className="text-[20px] font-[700] tracking-[-0.02em] text-[#5B4BFF] underline underline-offset-4 hover:text-[#4A3AE8] sm:text-[22px]"
        >
          contatopulsofc@gmail.com
        </a>
      </div>

      <div className="mt-8 space-y-4 text-[15px] leading-[1.75] text-[#374151]">
        <p className="text-[16px] font-[600] text-[#0F172A]">Podemos ajudar com:</p>
        <ul className="space-y-3 pl-5">
          {[
            { dot: '#16A34A', text: 'Suporte técnico e dúvidas gerais sobre a plataforma' },
            { dot: '#6C3BFF', text: 'Solicitações de privacidade e exercício de direitos (LGPD), incluindo acesso, correção ou exclusão de dados' },
            { dot: '#2563EB', text: 'Dúvidas e cancelamentos de assinatura Premium' },
          ].map(item => (
            <li key={item.text} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.dot }} />
              {item.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-[12px] bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#64748B]">
          Tempo estimado de resposta: até <strong className="font-[600] text-[#0F172A]">15 dias úteis</strong> a partir do recebimento da mensagem.
        </p>
      </div>

      <div className="mt-12 border-t border-[#E2E8F0] pt-6">
        <Link href="/" className="text-[13px] font-[500] text-[#64748B] hover:text-[#0F172A]">
          ← Voltar para o início
        </Link>
      </div>
    </div>
  )
}
