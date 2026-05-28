// ================================================
// COPA 2026 — Cliente Supabase
// ================================================

import { createBrowserClient } from '@supabase/ssr'

// Use no lado do CLIENTE (componentes com 'use client')
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
