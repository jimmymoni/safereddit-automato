import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

// Debug logging (disabled for performance)
// console.log('Supabase Config:', {
//   url: supabaseUrl ? 'Set' : 'Missing',
//   key: supabaseAnonKey ? 'Set' : 'Missing'
// })

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface User {
  id: string
  email: string
  name?: string
  reddit_username?: string
  reddit_connected: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  reddit_token?: string
  reddit_refresh_token?: string
  reddit_username?: string
  autopilot_settings?: any
  account_health: number
  post_karma: number
  comment_karma: number
  created_at: string
  updated_at: string
}