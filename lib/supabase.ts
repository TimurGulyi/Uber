import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Trip {
  id: string
  created_at: string
  date: string
  restaurant_name: string
  zone: string | null
  platform: string
  earnings: number
  tip: number
  total: number
  lat: number | null
  lng: number | null
  notes: string | null
}

export interface EarningsWeek {
  id: string
  week_start: string
  week_end: string
  base_pay: number
  tips: number
  prop22: number
  quest_bonus: number
  instant_pay_fees: number
  total: number
  deliveries: number
  platform: string
}

export interface Goal {
  id: string
  type: string
  target: number
}
