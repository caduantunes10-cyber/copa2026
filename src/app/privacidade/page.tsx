import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Pulso FC',
  description: 'Como o Pulso FC coleta, usa e protege seus dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-[12px] font-[600] uppercase tracking-[0.12em] text-[#16A34A]">Legal</p>
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#0F172A] sm:text-[40px]">Política de Privacidade</h1>
        <p className="mt-3 text-[14px] text-[#64748B]">Última atualização: junho de 2026</p>
      </div>

      <div className="space-y-10 text-[15px] leading-[1.75] text-[#374151]">

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">1. Identificação do Controlador</h2>
          <p>
            O Pulso FC é operado como plataforma de entretenimento esportivo voltada a torcedores da Copa do Mundo.
            Para dúvidas, solicitações ou exercício de direitos, entre em contato pelo e-mail:{' '}
            <a href="mailto:contatopulsofc@gmail.com" className="font-[500] text-[#5B4BFF] underline underline-offset-2 hover:text-[#4A3AE8]">
              contatopulsofc@gmail.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">2. Dados Coletados</h2>
          <p className="mb-3">Coletamos os seguintes dados pessoais:</p>
          <ul className="space-y-2 pl-5">
            {[
              'Nome completo fornecido pelo Google',
              'Endereço de e-mail',
              'Foto de perfil do Google',
              'Identificador de conta (ID único)',
              'Votos em enquetes realizados na plataforma',
              'Dados de compatibilidade e comparações com outros usuários',
              'Conexões sociais (amizades e seguimentos)',
              'Status de assinatura Premium',
              'Endereço IP',
              'Logs de acesso e atividade',
              'Informações de navegador e dispositivo',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">3. Finalidades do Tratamento</h2>
          <p className="mb-3">Seus dados são utilizados exclusivamente para:</p>
          <ul className="space-y-2 pl-5">
            {[
              'Autenticação e controle de acesso',
              'Operação da plataforma e funcionalidades principais',
              'Cálculos de compatibilidade entre torcedores',
              'Geração de estatísticas agregadas e anônimas',
              'Provisão de funcionalidades Premium',
              'Prevenção de fraudes e abuso',
              'Segurança da plataforma',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">4. Base Legal (LGPD)</h2>
          <p>
            O tratamento dos dados pessoais é realizado com fundamento no consentimento do titular (art. 7º, I da Lei 13.709/2018 — LGPD),
            na execução de contrato (art. 7º, V) e no legítimo interesse do controlador para segurança e prevenção a fraudes (art. 7º, IX).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">5. Compartilhamento de Dados</h2>
          <p className="mb-3">Compartilhamos dados exclusivamente com os seguintes prestadores de serviço essenciais à operação da plataforma:</p>
          <ul className="space-y-3 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
              <span><strong className="font-[600] text-[#0F172A]">Supabase</strong> — banco de dados, autenticação e armazenamento.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
              <span><strong className="font-[600] text-[#0F172A]">Google</strong> — provedor de autenticação via OAuth.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
              <span><strong className="font-[600] text-[#0F172A]">Stripe</strong> — processamento de pagamentos de assinaturas Premium.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
              <span><strong className="font-[600] text-[#0F172A]">Vercel</strong> — hospedagem e entrega de conteúdo.</span>
            </li>
          </ul>
          <p className="mt-4 rounded-[12px] bg-[#FFF7ED] px-4 py-3 text-[14px] text-[#92400E]">
            <strong>Importante:</strong> O Pulso FC não armazena números completos de cartão de crédito, CVV ou quaisquer dados de pagamento sensíveis. Essas informações são processadas diretamente pelo Stripe, em conformidade com o padrão PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">6. Transferências Internacionais</h2>
          <p>
            Os dados podem ser transferidos e armazenados em servidores fora do Brasil, especificamente nos Estados Unidos, onde operam Supabase, Google, Stripe e Vercel.
            Essas transferências ocorrem com base em cláusulas contratuais padrão e mecanismos adequados de proteção previstos na LGPD (art. 33).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">7. Retenção de Dados</h2>
          <p>
            Os dados são retidos enquanto a conta do usuário estiver ativa. Após a exclusão da conta, os dados pessoais identificáveis serão removidos em até 30 dias,
            salvo obrigação legal de retenção por prazo maior. Dados agregados e anonimizados podem ser mantidos indefinidamente para fins estatísticos.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">8. Direitos do Titular (LGPD)</h2>
          <p className="mb-3">Nos termos da LGPD, você tem direito a:</p>
          <ul className="space-y-2 pl-5">
            {[
              'Confirmação da existência de tratamento',
              'Acesso aos seus dados',
              'Correção de dados incompletos, inexatos ou desatualizados',
              'Anonimização, bloqueio ou eliminação de dados desnecessários',
              'Portabilidade dos dados',
              'Eliminação dos dados tratados com consentimento',
              'Informação sobre compartilhamento com terceiros',
              'Revogação do consentimento',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            Para exercer qualquer desses direitos, envie sua solicitação para{' '}
            <a href="mailto:contatopulsofc@gmail.com" className="font-[500] text-[#5B4BFF] underline underline-offset-2 hover:text-[#4A3AE8]">
              contatopulsofc@gmail.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">9. Contato</h2>
          <p>
            Para dúvidas sobre esta política ou sobre o tratamento dos seus dados pessoais:{' '}
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
