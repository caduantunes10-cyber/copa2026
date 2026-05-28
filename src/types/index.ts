// ================================================
// COPA 2026 — Tipos TypeScript
// ================================================

export type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  is_premium: boolean
  premium_until: string | null
  total_votes: number
  total_points: number
  created_at: string
}

export type Player = {
  id: string
  name: string
  short_name: string
  country: string
  flag: string
  position: string
  club: string
  age: number
  photo_url: string | null
  goals: number
  assists: number
  matches: number
  rating: number
  vote_count: number
  rank_position?: number
}

export type Vote = {
  id: string
  user_id: string
  player_id: string
  vote_weight: number
  created_at: string
}

export type Poll = {
  id: string
  question: string
  options: PollOption[]
  is_premium: boolean
  is_active: boolean
  ends_at: string | null
  created_at: string
}

export type PollOption = {
  id: number
  label: string
  count: number
}

export type PollVote = {
  id: string
  user_id: string
  poll_id: string
  option_index: number
  created_at: string
}

export type Friendship = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  // joined
  profile?: Profile
}

export type ActivityItem = {
  id: string
  user_id: string
  action_type: 'vote' | 'poll_vote' | 'prediction' | 'premium'
  target_id: string | null
  target_name: string | null
  meta: Record<string, unknown> | null
  created_at: string
  // joined
  profile?: Profile
}

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points_earned: number
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'inactive' | 'canceled'
  current_period_end: string | null
}

// Feed social — atividade com perfil do usuário
export type FeedActivity = ActivityItem & {
  profile: Profile
}
