import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.REACT_APP_SUPABASE_URL
let supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Debug logging (disabled for performance)
// console.log('Supabase Config:', {
//   url: supabaseUrl ? 'Set' : 'Missing',
//   key: supabaseAnonKey ? 'Set' : 'Missing'
// })

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using fallback values')
  // Use fallback values to prevent app crash
  supabaseUrl = 'https://placeholder.supabase.co'
  supabaseAnonKey = 'placeholder_key'
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