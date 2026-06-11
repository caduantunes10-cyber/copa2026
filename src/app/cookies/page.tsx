import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies — Pulso FC',
  description: 'Como o Pulso FC utiliza cookies e tecnologias similares.',
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-[12px] font-[600] uppercase tracking-[0.12em] text-[#16A34A]">Legal</p>
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#0F172A] sm:text-[40px]">Política de Cookies</h1>
        <p className="mt-3 text-[14px] text-[#64748B]">Última atualização: junho de 2026</p>
      </div>

      <div className="space-y-10 text-[15px] leading-[1.75] text-[#374151]">

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">1. O que são Cookies</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site.
            Eles permitem que a plataforma reconheça seu navegador em visitas futuras, mantenha sua sessão ativa e ofereça uma experiência personalizada.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">2. Cookies que Utilizamos</h2>

          <div className="space-y-6">
            <div className="rounded-[14px] border border-[#E2E8F0] p-5">
              <h3 className="mb-2 text-[15px] font-[700] text-[#0F172A]">Cookies Essenciais</h3>
              <p className="text-[14px]">
                Necessários para o funcionamento básico da plataforma. Sem eles, recursos fundamentais como login e votação não funcionam.
                Não podem ser desativados.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#E2E8F0] p-5">
              <h3 className="mb-2 text-[15px] font-[700] text-[#0F172A]">Cookies de Autenticação</h3>
              <p className="text-[14px]">
                Gerados pelo Supabase e Google OAuth para manter sua sessão autenticada.
                Contêm um token de sessão seguro que identifica seu acesso sem expor sua senha.
                São excluídos ao encerrar a sessão ou quando expiram automaticamente.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#E2E8F0] p-5">
              <h3 className="mb-2 text-[15px] font-[700] text-[#0F172A]">Cookies de Sessão</h3>
              <p className="text-[14px]">
                Temporários, existem apenas enquanto o navegador está aberto.
                Usados para manter o estado da navegação (como enquetes já votadas na sessão atual).
                São removidos automaticamente ao fechar o navegador.
              </p>
            </div>

            <div className="rounded-[14px] border border-[#E2E8F0] p-5">
              <h3 className="mb-2 text-[15px] font-[700] text-[#0F172A]">Cookies de Segurança</h3>
              <p className="text-[14px]">
                Utilizados para prevenir ataques CSRF (Cross-Site Request Forgery) e outros vetores de segurança.
                São essenciais para a integridade da plataforma.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">3. Cookies de Terceiros</h2>
          <p className="mb-4">Os seguintes prestadores de serviço podem definir cookies ao interagir com a plataforma:</p>

          <div className="space-y-4">
            {[
              {
                name: 'Google',
                desc: 'Utilizado para autenticação OAuth. Pode definir cookies relacionados à sua conta Google durante o processo de login.',
                link: 'https://policies.google.com/privacy',
                label: 'Política do Google',
              },
              {
                name: 'Supabase',
                desc: 'Infraestrutura de banco de dados e autenticação. Define cookies de sessão necessários para manter o acesso autenticado.',
                link: 'https://supabase.com/privacy',
                label: 'Política do Supabase',
              },
              {
                name: 'Stripe',
                desc: 'Processador de pagamentos para assinaturas Premium. Pode definir cookies de segurança durante o fluxo de pagamento.',
                link: 'https://stripe.com/privacy',
                label: 'Política do Stripe',
              },
              {
                name: 'Vercel',
                desc: 'Plataforma de hospedagem. Pode utilizar cookies técnicos para balanceamento de carga e entrega de conteúdo.',
                link: 'https://vercel.com/legal/privacy-policy',
                label: 'Política da Vercel',
              },
            ].map(item => (
              <div key={item.name} className="rounded-[14px] border border-[#E2E8F0] p-5">
                <h3 className="mb-1.5 text-[15px] font-[700] text-[#0F172A]">{item.name}</h3>
                <p className="mb-2 text-[14px]">{item.desc}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-[500] text-[#5B4BFF] underline underline-offset-2 hover:text-[#4A3AE8]"
                >
                  {item.label} ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">4. Como Controlar os Cookies</h2>
          <p className="mb-3">
            Você pode gerenciar ou desativar cookies diretamente no seu navegador. Veja como fazer isso nos principais navegadores:
          </p>
          <ul className="space-y-2 pl-5">
            {[
              { name: 'Google Chrome', desc: 'Configurações → Privacidade e segurança → Cookies' },
              { name: 'Safari', desc: 'Preferências → Privacidade → Cookies' },
              { name: 'Firefox', desc: 'Configurações → Privacidade e segurança → Cookies' },
              { name: 'Edge', desc: 'Configurações → Privacidade, pesquisa e serviços → Cookies' },
            ].map(item => (
              <li key={item.name} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
                <span><strong className="font-[600] text-[#0F172A]">{item.name}:</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-[12px] bg-[#FFF7ED] px-4 py-3 text-[14px] text-[#92400E]">
            Atenção: desativar cookies essenciais impedirá o login e o uso das funcionalidades principais da plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">5. Contato</h2>
          <p>
            Para dúvidas sobre o uso de cookies:{' '}
            <a href="mailto:contatopulsofc@gmail.com" className="font-[500] text-[#5B4BFF] underline underline-offset-2 hover:text-[#4A3AE8]">
              contatopulsofc@gmail.com
            </a>
          </p>
        </section>

      </div>

      <div className="mt-12 border-t border-[#E2E8F0] pt-6">
        <Link href="/" className="text-[13px] font-[500] text-[#64748B] hover:text-[#0F172A]">
          ← Voltar para o início
        </Link>
      </div>
    </div>
  )
}
