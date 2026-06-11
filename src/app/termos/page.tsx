import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — Pulso FC',
  description: 'Condições de uso da plataforma Pulso FC.',
}

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-[12px] font-[600] uppercase tracking-[0.12em] text-[#16A34A]">Legal</p>
        <h1 className="text-[32px] font-[800] tracking-[-0.03em] text-[#0F172A] sm:text-[40px]">Termos de Uso</h1>
        <p className="mt-3 text-[14px] text-[#64748B]">Última atualização: junho de 2026</p>
      </div>

      <div className="space-y-10 text-[15px] leading-[1.75] text-[#374151]">

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">1. Finalidade da Plataforma</h2>
          <p>
            O Pulso FC é uma plataforma de entretenimento esportivo que permite a torcedores participar de enquetes,
            comparar opiniões com amigos e acompanhar estatísticas relacionadas à Copa do Mundo 2026.
            A plataforma é de natureza recreativa e não possui vínculo oficial com nenhuma federação, clube ou entidade esportiva.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">2. Natureza das Enquetes</h2>
          <p>
            As enquetes disponíveis no Pulso FC têm caráter exclusivamente recreativo e de entretenimento.
            Elas não constituem pesquisas científicas, pesquisas de opinião oficiais, sondagens eleitorais ou levantamentos estatísticos formais.
            Os resultados refletem apenas as preferências dos usuários cadastrados na plataforma e não devem ser interpretados como representativos da opinião geral da população.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">3. Responsabilidades do Usuário</h2>
          <p className="mb-3">Ao utilizar o Pulso FC, você concorda em:</p>
          <ul className="space-y-2 pl-5">
            {[
              'Fornecer informações verdadeiras durante o cadastro',
              'Utilizar a plataforma de forma ética e respeitosa',
              'Não compartilhar suas credenciais de acesso com terceiros',
              'Comunicar imediatamente qualquer uso não autorizado da sua conta',
              'Respeitar os direitos de propriedade intelectual da plataforma',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">4. Condutas Proibidas</h2>
          <p className="mb-3">É estritamente proibido:</p>
          <ul className="space-y-2 pl-5">
            {[
              'Manipulação de votos por qualquer meio',
              'Uso abusivo de múltiplas contas para influenciar resultados',
              'Uso de bots, scripts ou automações para interagir com a plataforma',
              'Tentativas de acesso não autorizado a sistemas, contas ou dados',
              'Qualquer ação que comprometa a integridade, segurança ou disponibilidade da plataforma',
              'Engenharia reversa, scraping ou extração não autorizada de dados',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF4444]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            O descumprimento dessas regras pode resultar no encerramento imediato da conta, sem direito a reembolso de valores pagos.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">5. Assinatura Premium</h2>
          <p className="mb-3">
            O Pulso FC oferece um plano Premium com funcionalidades adicionais, como comparação avançada de compatibilidade com amigos.
          </p>
          <ul className="space-y-2 pl-5">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
              <span>O pagamento é processado com segurança pelo <strong className="font-[600] text-[#0F172A]">Stripe</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
              <span>A assinatura tem renovação automática mensal, salvo cancelamento pelo usuário.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
              <span>O cancelamento pode ser solicitado a qualquer momento pelo e-mail <a href="mailto:contatopulsofc@gmail.com" className="font-[500] text-[#5B4BFF] underline underline-offset-2">contatopulsofc@gmail.com</a>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
              <span>O cancelamento tem efeito ao fim do período já pago, sem reembolso proporcional.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6C3BFF]" />
              <span>O Pulso FC não armazena dados completos de cartão de crédito ou CVV.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">6. Propriedade Intelectual</h2>
          <p>
            Todos os elementos da plataforma — incluindo nome, logotipo, design, código-fonte e conteúdo editorial —
            são de propriedade exclusiva do Pulso FC e estão protegidos pelas leis de propriedade intelectual aplicáveis.
            É proibida a reprodução, distribuição ou uso não autorizado de qualquer elemento da plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">7. Disponibilidade do Serviço</h2>
          <p>
            O Pulso FC envida esforços razoáveis para manter a plataforma disponível, mas não garante disponibilidade ininterrupta.
            Manutenções, atualizações ou problemas técnicos podem causar indisponibilidades temporárias sem aviso prévio.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">8. Limitação de Responsabilidade</h2>
          <p>
            O Pulso FC não se responsabiliza por danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou
            impossibilidade de uso da plataforma, incluindo perda de dados, interrupção de serviço ou imprecisão nos resultados das enquetes.
            A plataforma é oferecida "como está", sem garantias de qualquer natureza.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">9. Alterações nos Termos</h2>
          <p>
            Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas através da plataforma.
            O uso continuado do Pulso FC após a publicação de novos termos implica na aceitação das mudanças.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-[18px] font-[700] tracking-[-0.02em] text-[#0F172A]">10. Contato</h2>
          <p>
            Para dúvidas, suporte ou exercício de direitos:{' '}
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
