-- ================================================
-- COPA 2026 — Schema Completo do Banco de Dados
-- ================================================
-- Execute este arquivo no Supabase SQL Editor
-- supabase.com → seu projeto → SQL Editor → New query

-- ── EXTENSÕES ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── TABELA: profiles ─────────────────────────────────────────────────────────
-- Perfil público de cada usuário (complementa auth.users do Supabase)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique,
  full_name   text,
  avatar_url  text,
  is_premium  boolean default false,
  premium_until timestamptz,
  total_votes integer default 0,
  total_points integer default 0,  -- para ranking social
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── TABELA: friendships ───────────────────────────────────────────────────────
-- Sistema de amigos / seguir
create table public.friendships (
  id          uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(follower_id, following_id)
);

-- ── TABELA: players ───────────────────────────────────────────────────────────
create table public.players (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  short_name  text,
  country     text not null,
  flag        text not null,
  position    text not null,
  club        text not null,
  age         integer,
  photo_url   text,
  goals       integer default 0,
  assists     integer default 0,
  matches     integer default 0,
  rating      numeric(3,1) default 0,
  vote_count  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ── TABELA: votes ─────────────────────────────────────────────────────────────
create table public.votes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  player_id   uuid references public.players(id) on delete cascade not null,
  vote_weight integer default 1,  -- 1 = normal, 3 = premium
  created_at  timestamptz default now(),
  -- Um usuário NÃO pode votar 2x no mesmo jogador
  unique(user_id, player_id)
);

-- ── TABELA: polls ─────────────────────────────────────────────────────────────
create table public.polls (
  id          uuid default uuid_generate_v4() primary key,
  question    text not null,
  options     jsonb not null,       -- [{"id": 1, "label": "Brasil", "count": 0}]
  is_premium  boolean default false,
  is_active   boolean default true,
  ends_at     timestamptz,
  created_at  timestamptz default now()
);

-- ── TABELA: poll_votes ────────────────────────────────────────────────────────
create table public.poll_votes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  poll_id     uuid references public.polls(id) on delete cascade not null,
  option_index integer not null,
  created_at  timestamptz default now(),
  unique(user_id, poll_id)
);

-- ── TABELA: predictions ───────────────────────────────────────────────────────
-- Palpites de partidas (funcionalidade premium)
create table public.predictions (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  match_id    text not null,        -- ex: "BRA-FRA-FINAL"
  home_score  integer not null,
  away_score  integer not null,
  points_earned integer default 0,
  created_at  timestamptz default now(),
  unique(user_id, match_id)
);

-- ── TABELA: subscriptions ─────────────────────────────────────────────────────
create table public.subscriptions (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status           text not null default 'inactive', -- active, inactive, canceled
  current_period_end timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── TABELA: activity_feed ─────────────────────────────────────────────────────
-- Feed social: o que os amigos fizeram
create table public.activity_feed (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,  -- 'vote', 'poll_vote', 'prediction', 'premium'
  target_id   uuid,           -- id do player, poll, etc
  target_name text,           -- nome do jogador, enquete, etc
  meta        jsonb,          -- dados extras
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ÍNDICES — para performance
-- ═══════════════════════════════════════════════════════════════════
create index idx_votes_player on public.votes(player_id);
create index idx_votes_user on public.votes(user_id);
create index idx_votes_created on public.votes(created_at desc);
create index idx_activity_user on public.activity_feed(user_id);
create index idx_activity_created on public.activity_feed(created_at desc);
create index idx_friendships_follower on public.friendships(follower_id);
create index idx_friendships_following on public.friendships(following_id);
create index idx_players_votes on public.players(vote_count desc);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — protege o banco
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.poll_votes enable row level security;
alter table public.predictions enable row level security;
alter table public.friendships enable row level security;
alter table public.activity_feed enable row level security;
alter table public.subscriptions enable row level security;
alter table public.players enable row level security;
alter table public.polls enable row level security;

-- PROFILES: qualquer um pode ler, só o dono pode editar
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- PLAYERS: qualquer um pode ler
create policy "players_select" on public.players for select using (true);

-- POLLS: qualquer um pode ler
create policy "polls_select" on public.polls for select using (true);

-- VOTES: qualquer um pode ver, só logado pode inserir (1 voto por jogador)
create policy "votes_select" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert
  with check (auth.uid() = user_id);

-- POLL_VOTES: qualquer um pode ver, só logado pode inserir
create policy "poll_votes_select" on public.poll_votes for select using (true);
create policy "poll_votes_insert" on public.poll_votes for insert
  with check (auth.uid() = user_id);

-- PREDICTIONS: qualquer um pode ver, só logado pode inserir
create policy "predictions_select" on public.predictions for select using (true);
create policy "predictions_insert" on public.predictions for insert
  with check (auth.uid() = user_id);

-- FRIENDSHIPS: qualquer um pode ver, só o follower pode criar/deletar
create policy "friendships_select" on public.friendships for select using (true);
create policy "friendships_insert" on public.friendships for insert
  with check (auth.uid() = follower_id);
create policy "friendships_delete" on public.friendships for delete
  using (auth.uid() = follower_id);

-- ACTIVITY_FEED: só pode ver feed de quem você segue (ou o próprio)
create policy "activity_select" on public.activity_feed for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.friendships
      where follower_id = auth.uid() and following_id = activity_feed.user_id
    )
  );
create policy "activity_insert" on public.activity_feed for insert
  with check (auth.uid() = user_id);

-- SUBSCRIPTIONS: só o dono pode ver
create policy "subscriptions_select" on public.subscriptions for select
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Cria perfil automaticamente quando usuário faz login pela primeira vez
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    lower(replace(new.raw_user_meta_data->>'full_name', ' ', '_')) || '_' || substr(new.id::text, 1, 4)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Incrementa vote_count do jogador quando alguém vota
create or replace function public.increment_player_votes()
returns trigger as $$
begin
  update public.players
  set vote_count = vote_count + new.vote_weight
  where id = new.player_id;

  -- Incrementa total_votes do usuário
  update public.profiles
  set total_votes = total_votes + 1
  where id = new.user_id;

  -- Registra no feed de atividade
  insert into public.activity_feed (user_id, action_type, target_id, target_name)
  select new.user_id, 'vote', new.player_id, p.name
  from public.players p where p.id = new.player_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_vote_created
  after insert on public.votes
  for each row execute procedure public.increment_player_votes();

-- Registra poll_vote no feed
create or replace function public.log_poll_vote()
returns trigger as $$
begin
  insert into public.activity_feed (user_id, action_type, target_id, target_name, meta)
  select new.user_id, 'poll_vote', new.poll_id, p.question,
    jsonb_build_object('option_index', new.option_index, 'option_label',
      (p.options->new.option_index->>'label'))
  from public.polls p where p.id = new.poll_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_poll_vote_created
  after insert on public.poll_votes
  for each row execute procedure public.log_poll_vote();

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: ranking em tempo real
-- ═══════════════════════════════════════════════════════════════════
create or replace view public.player_ranking as
  select
    p.*,
    rank() over (order by p.vote_count desc) as rank_position
  from public.players p
  where p.is_active = true
  order by p.vote_count desc;

-- ═══════════════════════════════════════════════════════════════════
-- REALTIME — habilita para tabelas que precisam de live update
-- ═══════════════════════════════════════════════════════════════════
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.activity_feed;
alter publication supabase_realtime add table public.poll_votes;

-- ═══════════════════════════════════════════════════════════════════
-- SEED — dados iniciais dos jogadores
-- ═══════════════════════════════════════════════════════════════════
insert into public.players (name, short_name, country, flag, position, club, age, photo_url, goals, assists, matches, rating, vote_count) values
('Vinícius Júnior', 'Vini Jr.', 'Brasil', '🇧🇷', 'Atacante', 'Real Madrid', 26, 'https://images.fotmob.com/image_resources/playerimages/966789.png', 6, 4, 5, 9.4, 48320),
('Kylian Mbappé', 'Mbappé', 'França', '🇫🇷', 'Atacante', 'Real Madrid', 27, 'https://images.fotmob.com/image_resources/playerimages/852835.png', 7, 2, 5, 9.2, 44100),
('Erling Haaland', 'Haaland', 'Noruega', '🇳🇴', 'Atacante', 'Man. City', 25, 'https://images.fotmob.com/image_resources/playerimages/961995.png', 5, 1, 4, 8.9, 38750),
('Jude Bellingham', 'Bellingham', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Meia', 'Real Madrid', 21, 'https://images.fotmob.com/image_resources/playerimages/984914.png', 3, 5, 5, 8.7, 31200),
('Pedri', 'Pedri', 'Espanha', '🇪🇸', 'Meia', 'Barcelona', 22, 'https://images.fotmob.com/image_resources/playerimages/903935.png', 2, 6, 5, 8.6, 27890),
('Lamine Yamal', 'Yamal', 'Espanha', '🇪🇸', 'Atacante', 'Barcelona', 18, 'https://images.fotmob.com/image_resources/playerimages/1082576.png', 4, 7, 5, 8.5, 19800),
('Rodri', 'Rodri', 'Espanha', '🇪🇸', 'Volante', 'Man. City', 28, 'https://images.fotmob.com/image_resources/playerimages/879856.png', 1, 3, 5, 8.8, 22100),
('Harry Kane', 'Kane', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Atacante', 'Bayern Munich', 31, 'https://images.fotmob.com/image_resources/playerimages/852981.png', 4, 1, 5, 8.3, 15600);

insert into public.polls (question, options, is_premium, is_active) values
('Quem vence a Final — Brasil ou França?', '[{"id":0,"label":"🇧🇷 Brasil","count":73840},{"id":1,"label":"🇫🇷 França","count":68160}]', false, true),
('Quem merece o prêmio de Melhor da Copa?', '[{"id":0,"label":"Vini Jr. 🇧🇷","count":33592},{"id":1,"label":"Mbappé 🇫🇷","count":30940},{"id":2,"label":"Haaland 🇳🇴","count":23868}]', true, true),
('Qual foi o jogo mais emocionante?', '[{"id":0,"label":"🇧🇷 Brasil 2×1 🇦🇷 Argentina","count":33002},{"id":1,"label":"🇫🇷 França 3×2 🇩🇪 Alemanha","count":21198}]', false, true);
