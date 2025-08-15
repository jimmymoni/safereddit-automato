import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Add timeout for initialization to prevent hanging
    const initTimeout = setTimeout(() => {
      console.log('Auth initialization timeout, proceeding with no user')
      setLoading(false)
    }, 3000) // 3 second timeout

    // Add error handling
    const initAuth = async () => {
      try {
        // Get initial session with timeout
        const { data: { session }, error } = await supabase.auth.getSession()
        clearTimeout(initTimeout)
        
        if (error) {
          console.error('Supabase auth error:', error)
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        clearTimeout(initTimeout)
        console.error('Auth initialization error:', error)
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes (but don't wait for it)
    let subscription: any
    try {
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      subscription = authListener.data.subscription
    } catch (error) {
      console.error('Auth listener error:', error)
    }

    return () => {
      clearTimeout(initTimeout)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            user_id: data.user.id,
            reddit_connected: false,
            account_health: 100.0,
            post_karma: 0,
            comment_karma: 0
          }
        ])

      if (profileError) console.error('Error creating profile:', profileError)
    }

    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/reddit-connect`
      }
    })

    if (error) throw error
    return data
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}