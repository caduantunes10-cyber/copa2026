import Link from 'next/link'
import { Bell, Calendar, ChevronRight, Circle, Clock, Flag, Heart, MessageCircle, Shield, Star, TrendingUp, Users, Zap } from 'lucide-react'

const friendActivity = [
  { name: 'Mariana S.', text: 'reagiu ao segundo gol do Brasil', time: 'há 3m', trend: 'Ao vivo', avatar: 'MS' },
  { name: 'Felipe C.', text: 'comentou que Portugal começou pressionando', time: 'há 6m', trend: 'Opinião', avatar: 'FC' },
  { name: 'João V.', text: 'entrou na conversa sobre Mais de 2.5 gols', time: 'há 8m', trend: 'Debate', avatar: 'JV' },
  { name: 'Beatriz M.', text: 'publicou uma reação sobre Brasil 2 x 1 Sérvia', time: 'há 12m', trend: 'Reação', avatar: 'BM' },
]

const fanFeed = [
  { name: 'Rafael Amorim', handle: '@rafa.amorim', time: 'há 1m', text: 'Que jogo! Brasil voltando com tudo! Esse time tem muita garra! 💚💛', comments: 23, likes: 45, avatar: 'RA' },
  { name: 'Carla Mendes', handle: '@carlamendes', time: 'há 3m', text: 'Sérvia não tá facilitando, jogo difícil! Precisamos manter o foco! 💪', comments: 8, likes: 12, avatar: 'CM' },
  { name: 'Henrique V.', handle: '@henriv', time: 'há 5m', text: 'Neymar é diferente! Decide demais! ⭐', comments: 15, likes: 32, avatar: 'HV' },
]

const trendingOpinions = [
  { name: 'Lucas Pereira', text: 'Brasil controla o jogo pelo meio', avatar: 'LP' },
  { name: 'Mariana S.', text: 'O segundo tempo está mais aberto', avatar: 'MS' },
  { name: 'Felipe C.', text: 'Sérvia ainda pode reagir em bola aérea', avatar: 'FC' },
  { name: 'João V.', text: 'Vini Jr. é o jogador mais perigoso', avatar: 'JV' },
  { name: 'Beatriz M.', text: 'A torcida mudou o clima da partida', avatar: 'BM' },
]

const matches = [
  { time: 'AO VIVO', status: '2ºT · 72:34', left: '🇧🇷', right: '🇷🇸', score: '2 x 1', code: 'BRA', codeRight: 'SRV', live: true },
  { time: '17:00', left: '🇦🇷', right: '🇲🇽', score: 'x', code: 'ARG', codeRight: 'MEX' },
  { time: '20:00', left: '🇫🇷', right: '🇦🇺', score: 'x', code: 'FRA', codeRight: 'AUS' },
  { time: '23:00', left: '🇵🇹', right: '🇬🇭', score: 'x', code: 'POR', codeRight: 'GHA' },
]

const timeline = [
  { minute: "72'", icon: '⚽', title: 'GOOOL DO BRASIL!', detail: 'Richarlison', color: '#16C45B' },
  { minute: "65'", icon: '🟨', title: 'Cartão amarelo', detail: 'M. Grujic', color: '#FFC83D' },
  { minute: "58'", icon: '⚽', title: 'GOOOL DO BRASIL!', detail: 'Neymar', color: '#16C45B' },
  { minute: "46'", icon: '🔄', title: 'Substituição - Sérvia', detail: 'Vlahović saiu · Mitrović entrou', color: '#EF4444' },
]

function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <section className={`rounded-[22px] bg-white shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03] ${className}`}>{children}</section>
}

function SectionHeader({ title, action }: { title: string, action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[13px] font-black uppercase tracking-[0.04em] text-[#111827]">{title}</h2>
      {action && <span className="text-[10px] font-black uppercase text-[#6B7280]">{action}</span>}
    </div>
  )
}

function Avatar({ label, green = false }: { label: string, green?: boolean }) {
  return <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black text-white ${green ? 'bg-[#16C45B]' : 'bg-gradient-to-br from-[#6C3BFF] to-[#16C45B]'}`}>{label}</div>
}

export default function HomePage() {
  return (
    <div className="pb-10 lg:pb-6">
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="hidden space-y-4 lg:block">
          <Card className="p-5">
            <SectionHeader title="Atividade dos amigos" action="Ver todos" />
            <div className="space-y-4">
              {friendActivity.map(item => (
                <div key={`${item.name}-${item.time}`} className="flex items-start gap-3">
                  <Avatar label={item.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold leading-4 text-[#111827]"><span className="font-black">{item.name}</span> {item.text}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#6B7280]">{item.time}</p>
                  </div>
                  <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-black text-[#6B7280]">{item.trend}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Opiniões em alta" action="Ver conversas" />
            <div className="space-y-3">
              {trendingOpinions.map((user, index) => (
                <div key={user.name} className="flex items-center gap-3">
                  <span className="w-4 text-[12px] font-black text-[#111827]">{index + 1}</span>
                  <Avatar label={user.avatar} green={index === 0} />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#111827]">{user.text}</span>
                </div>
              ))}
            </div>
            <Link href="/amigos" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[#F6F1FF] px-4 py-3 text-[11px] font-black uppercase text-[#6C3BFF]">
              Ver conversas →
            </Link>
          </Card>
        </aside>

        <main className="space-y-4">
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0A0A0A] via-[#111827] to-[#1a1040] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-[url('/stadium.jpg')] bg-cover bg-center opacity-20" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#16C45B] px-3 py-1 text-[10px] font-black uppercase"><Circle className="h-2 w-2 fill-white" /> Ao vivo</span>
                  <span className="text-[11px] font-bold text-white/60">2ºT · 72:34</span>
                </div>
                <Bell className="h-5 w-5 text-white/60" />
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/95 text-5xl shadow-xl sm:h-24 sm:w-24">🇧🇷</div>
                  <p className="mt-3 text-sm font-black uppercase sm:text-base">Brasil</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black tracking-tight sm:text-6xl">2 <span className="text-white/40">x</span> 1</div>
                  <Link href="/ranking" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[12px] font-black uppercase text-[#6C3BFF] shadow-xl">Ver jogo ao vivo <Circle className="h-3 w-3 fill-[#6C3BFF]" /></Link>
                </div>
                <div className="text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/95 text-5xl shadow-xl sm:h-24 sm:w-24">🇷🇸</div>
                  <p className="mt-3 text-sm font-black uppercase sm:text-base">Sérvia</p>
                </div>
              </div>
              <div className="mt-5 flex justify-center gap-2"><span className="h-2 w-2 rounded-full bg-[#6C3BFF]" /><span className="h-2 w-2 rounded-full bg-white/45" /><span className="h-2 w-2 rounded-full bg-white/45" /><span className="h-2 w-2 rounded-full bg-white/45" /></div>
            </div>
          </section>

          <div className="grid gap-4 md:hidden">
            <FanFeedCard />
            <TrendingCard />
          </div>

          <TodayMatches />
          <Predictions />

          <div className="grid gap-4 md:grid-cols-2 lg:hidden">
            <TimelineCard />
            <FriendActivityCard />
          </div>
        </main>

        <aside className="hidden space-y-4 lg:block">
          <FanFeedCard />
          <TimelineCard />
        </aside>
      </div>
    </div>
  )
}

function FanFeedCard() {
  return (
    <Card className="p-5">
      <SectionHeader title="Feed da torcida" action="Ver todos" />
      <div className="divide-y divide-[#EEF0F4]">
        {fanFeed.map(post => (
          <article key={post.name} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <Avatar label={post.avatar} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-[12px] font-black text-[#111827]">{post.name}</p><p className="text-[10px] font-semibold text-[#6B7280]">{post.handle}</p></div>
                  <span className="text-[10px] font-semibold text-[#6B7280]">{post.time}</span>
                </div>
                <p className="mt-3 text-[13px] font-semibold leading-5 text-[#111827]">{post.text}</p>
                <div className="mt-3 flex items-center gap-8 text-[11px] font-semibold text-[#6B7280]"><span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments}</span><span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{post.likes}</span></div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button className="mt-4 w-full rounded-full bg-[#6C3BFF] px-4 py-3 text-[11px] font-black uppercase text-white md:hidden">Publicar</button>
    </Card>
  )
}

function TrendingCard() {
  return (
    <Card className="p-5">
      <SectionHeader title="Opiniões em alta" action="Ver conversas" />
      <div className="space-y-3">
        {trendingOpinions.map((user, index) => (
          <div key={user.name} className="flex items-center gap-3">
            <span className="w-4 text-[12px] font-black">{index + 1}</span>
            <Avatar label={user.avatar} green={index === 0} />
            <span className="flex-1 text-[12px] font-bold">{user.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#E9FFF2] to-[#F6F1FF] p-5 text-center text-[#111827]"><TrendingUp className="mx-auto h-9 w-9 text-[#6C3BFF]" /><Link href="/amigos" className="mt-3 inline-flex text-[12px] font-black uppercase">Ver conversas →</Link></div>
    </Card>
  )
}

function TodayMatches() {
  return <Card className="p-5"><SectionHeader title="Jogos de hoje" action="Ver todos" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{matches.map(match => <div key={`${match.code}-${match.codeRight}`} className={`rounded-2xl p-4 text-center ring-1 ${match.live ? 'bg-[#F7FFFA] ring-[#16C45B]' : 'bg-white ring-[#EEF0F4]'}`}><div className={`text-[11px] font-black ${match.live ? 'text-[#16C45B]' : 'text-[#6B7280]'}`}>{match.time}</div>{match.status && <div className="text-[9px] font-bold text-[#16C45B]">{match.status}</div>}<div className="mt-4 flex items-center justify-center gap-3 text-2xl"><span>{match.left}</span><span className="text-base font-black text-[#111827]">{match.score}</span><span>{match.right}</span></div><div className="mt-3 flex justify-between text-[11px] font-black text-[#111827]"><span>{match.code}</span><span>{match.codeRight}</span></div></div>)}</div><Link href="/amigos" className="mt-4 flex items-center justify-center rounded-2xl bg-[#F6F1FF] px-4 py-3 text-[11px] font-black uppercase text-[#6C3BFF] md:hidden">Ver tabela completa</Link></Card>
}

function Predictions() {
  return <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#E9FFF2] via-[#EEF7FF] to-[#F4EAFE] p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]"><div className="mb-4 flex items-center justify-between"><h2 className="text-[13px] font-black uppercase text-[#111827]">Como você e seus amigos estão vendo este jogo?</h2><span className="text-[10px] font-black text-[#6B7280]">Ver detalhes</span></div><div className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-white/72 p-4 text-center"><p className="text-[11px] font-black uppercase">Quem vai ganhar?</p><p className="text-[10px] text-[#6B7280]">Final do jogo</p><div className="mt-5 flex items-center justify-around"><div><p className="text-2xl font-black text-[#16C45B]">65%</p><div className="mt-2 text-3xl">🇧🇷</div><p className="text-[11px] font-bold">Brasil</p></div><div><p className="text-2xl font-black text-[#6C3BFF]">35%</p><div className="mt-2 text-3xl">🇷🇸</div><p className="text-[11px] font-bold">Sérvia</p></div></div></div><div className="rounded-2xl bg-white/72 p-4"><p className="text-center text-[11px] font-black uppercase">Quantos gols?</p><p className="text-center text-[10px] text-[#6B7280]">Total de gols</p><div className="mt-5 space-y-4"><div><div className="mb-1 flex justify-between text-sm font-black"><span className="text-[#16C45B]">Mais de 2.5</span><span className="text-[#16C45B]">40%</span></div><div className="h-2 rounded-full bg-[#D1D5DB]"><div className="h-full w-[40%] rounded-full bg-[#16C45B]" /></div></div><div><div className="mb-1 flex justify-between text-sm font-black"><span>Menos de 2.5</span><span className="text-[#6C3BFF]">60%</span></div><div className="h-2 rounded-full bg-[#D1D5DB]"><div className="h-full w-[60%] rounded-full bg-[#6C3BFF]" /></div></div></div></div><div className="rounded-2xl bg-white/72 p-4 text-center"><p className="text-[11px] font-black uppercase">Quem marca o próximo?</p><p className="text-[10px] text-[#6B7280]">Próximo gol</p><div className="mt-5 grid grid-cols-3 gap-2"><div><div className="text-3xl">🇧🇷</div><p className="mt-1 text-[10px] font-bold">Neymar</p><p className="text-xl font-black text-[#16C45B]">30%</p></div><div><div className="text-3xl">🇧🇷</div><p className="mt-1 text-[10px] font-bold">Richarlison</p><p className="text-xl font-black">25%</p></div><div><div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#EEF0F4] text-[#6B7280]"><Users className="h-4 w-4" /></div><p className="mt-1 text-[10px] font-bold">Outros</p><p className="text-xl font-black">45%</p></div></div></div></div><div className="mt-4 flex items-center justify-between rounded-2xl bg-white/72 px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#6C3BFF] text-[#6C3BFF]"><MessageCircle className="h-5 w-5" /></div><div><p className="text-[13px] font-black uppercase text-[#6C3BFF]">Entre na conversa ao vivo</p><p className="text-[11px] font-semibold text-[#6B7280]">Compartilhe sua leitura do jogo e veja as reações dos amigos.</p></div></div><Link href="/amigos" className="hidden rounded-xl bg-[#6C3BFF] px-6 py-3 text-[11px] font-black uppercase text-white sm:inline-flex">Opinar agora</Link></div></section>
}

function TimelineCard() {
  return <Card className="p-5"><SectionHeader title="Momentos do jogo" action="Ver tempo real" /><div className="space-y-3">{timeline.map(item => <div key={`${item.minute}-${item.title}`} className="flex items-center gap-3"><span className="w-7 text-[12px] font-black">{item.minute}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F5F6F8] text-sm">{item.icon}</span><div className="min-w-0 flex-1 border-l-2 pl-3" style={{ borderColor: item.color }}><p className="text-[11px] font-black uppercase text-[#111827]">{item.title}</p><p className="text-[10px] font-semibold text-[#6B7280]">{item.detail}</p></div></div>)}</div></Card>
}

function FriendActivityCard() {
  return <Card className="p-5"><SectionHeader title="Atividade dos amigos" action="Ver todos" /><div className="space-y-3">{friendActivity.slice(0,3).map(item => <div key={item.name} className="flex items-start gap-3"><Avatar label={item.avatar} /><div className="flex-1"><p className="text-[11px] font-bold leading-4"><span className="font-black">{item.name}</span> {item.text}</p><p className="text-[10px] text-[#6B7280]">{item.time}</p></div><span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[10px] font-black text-[#6B7280]">{item.trend}</span></div>)}</div></Card>
}
