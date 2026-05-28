# ⚽ COPA 2026 — Guia Completo de Setup

## O que você vai precisar criar (tudo gratuito para começar)

| Serviço | Link | Para que serve |
|---------|------|----------------|
| Supabase | supabase.com | Banco de dados + Login |
| Vercel | vercel.com | Hospedagem grátis |
| Stripe | stripe.com | Cobrar assinaturas |
| GitHub | github.com | Guardar o código |

---

## PASSO 1 — Instalar as ferramentas no seu PC

```bash
# 1. Instale o Node.js (versão 20+)
# Baixe em: nodejs.org/en/download

# 2. Instale o Cursor AI
# Baixe em: cursor.sh

# 3. Abra o terminal dentro da pasta do projeto e rode:
npm install
```

---

## PASSO 2 — Configurar o Supabase

1. Acesse **supabase.com** e crie uma conta gratuita
2. Clique em **"New Project"**, dê um nome (ex: copa2026)
3. Escolha a região **South America (São Paulo)**
4. Aguarde criar (uns 2 minutos)
5. Vá em **Settings → API** e copie:
   - `Project URL` → é o `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → é o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → é o `SUPABASE_SERVICE_ROLE_KEY`

6. Vá em **SQL Editor → New query**
7. Cole **todo o conteúdo** do arquivo `supabase/migrations/001_schema.sql`
8. Clique em **Run** (botão verde)
9. Pronto! Banco criado com jogadores já cadastrados ✅

### Ativar Login com Google no Supabase:
1. Vá em **Authentication → Providers → Google**
2. Ative o toggle
3. Vá no **Google Cloud Console** (console.cloud.google.com):
   - Crie um projeto
   - Ative a API "Google+ API"
   - Vá em Credentials → OAuth 2.0
   - Authorized redirect URIs: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
4. Cole o Client ID e Client Secret no Supabase

---

## PASSO 3 — Configurar o arquivo de variáveis

```bash
# Na raiz do projeto, copie o arquivo de exemplo:
cp .env.example .env.local

# Abra o .env.local no Cursor e preencha os valores
```

---

## PASSO 4 — Configurar o Stripe (pagamentos)

1. Crie conta em **stripe.com**
2. Vá em **Developers → API Keys** e copie as chaves
3. Vá em **Products → Add Product**:
   - Nome: "Copa 2026 Premium"
   - Preço: R$ 9,90 / mês (recorrente)
   - Copie o **Price ID** (começa com `price_`)
4. Preencha no `.env.local`

### Webhook Stripe (para receber confirmação de pagamento):
```bash
# Instale o Stripe CLI:
# Mac: brew install stripe/stripe-cli/stripe
# Windows: baixe em github.com/stripe/stripe-cli/releases

# Rode para testar localmente:
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copie o webhook secret que aparecer (whsec_...)
```

---

## PASSO 5 — Rodar o projeto localmente

```bash
npm run dev
```

Abra **http://localhost:3000** no navegador. 🎉

---

## PASSO 6 — Publicar na Vercel (deploy)

1. Crie conta em **vercel.com**
2. Conecte seu GitHub
3. Importe o projeto
4. Na tela de configuração, adicione TODAS as variáveis do `.env.local`
5. Clique em Deploy
6. Seu site estará em: `https://copa2026.vercel.app`

### Configurar Stripe para produção:
- Na Vercel, configure a URL do webhook para: `https://seusite.vercel.app/api/stripe/webhook`
- Adicione esse webhook no painel do Stripe

---

## ESTRUTURA DO PROJETO

```
copa2026/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Página inicial
│   │   ├── ranking/page.tsx      ← Votação ao vivo
│   │   ├── artilheiros/page.tsx  ← Artilheiros
│   │   ├── amigos/page.tsx       ← Feed social (VER O QUE AMIGOS VOTARAM)
│   │   ├── premium/page.tsx      ← Assinatura
│   │   ├── perfil/page.tsx       ← Perfil do usuário
│   │   └── api/
│   │       ├── votes/route.ts    ← API de votação (com anti-fraude)
│   │       ├── friends/route.ts  ← API social (seguir, feed)
│   │       └── stripe/           ← Pagamentos
│   ├── components/
│   │   ├── layout/Header.tsx     ← Cabeçalho
│   │   └── layout/BottomNav.tsx  ← Navegação inferior
│   ├── lib/supabase/             ← Conexão com banco
│   └── types/index.ts            ← Tipos TypeScript
└── supabase/migrations/          ← Schema do banco de dados
```

---

## COMO USAR O CURSOR AI PARA EXPANDIR

Quando quiser adicionar algo novo, use este formato de prompt no Cursor:

```
Contexto: Next.js 15, TypeScript, Tailwind, Supabase
Arquivo: src/app/[nome]/page.tsx

Tarefa: Crie a página de artilheiros que busca dados da tabela 
players no Supabase, ordenado por goals, e mostra uma tabela 
responsiva no estilo dark com cores #080810 e gold #FFD700.
Sem comentários no código. Use 'use client'.
```

---

## FUNCIONALIDADES IMPLEMENTADAS

✅ Login com Google (Supabase Auth)
✅ Sistema de votação com anti-fraude (1 voto/dia grátis, ilimitado no premium)
✅ Ranking ao vivo (Supabase Realtime)
✅ Feed social — ver o que amigos votaram
✅ Seguir / deixar de seguir amigos
✅ Busca de usuários
✅ Feed em tempo real (novo voto aparece instantaneamente)
✅ Assinatura Premium (Stripe)
✅ Webhook Stripe (ativa premium automaticamente)
✅ Peso 3x no voto para premium
✅ Badge VIP no perfil

## PRÓXIMAS FUNCIONALIDADES (Fase 2)

- [ ] Página de artilheiros completa
- [ ] Página de ausentes
- [ ] Enquetes (polls)
- [ ] Previsões de partidas
- [ ] Perfil completo do usuário
- [ ] Compartilhamento social (OG tags)
- [ ] Notificações
