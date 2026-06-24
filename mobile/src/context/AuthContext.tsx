import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  AuthError,
  AuthResponse,
  Session,
  User,
} from '@supabase/supabase-js'

import { supabase } from '../lib/supabase'
import {
  ensureMyProfileFromMetadata,
  getMyProfile,
} from '../services/profileService'
import { AppLanguage, Profile } from '../types'

export interface RegisterDetails {
  email: string
  password: string
  displayName: string
  username: string
  country: string
  city: string
  appLanguage: AppLanguage
}

export type AuthScreenMode = 'login' | 'register'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  guestMode: boolean
  authScreenMode: AuthScreenMode
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (details: RegisterDetails) => Promise<AuthResponse>
  logout: () => Promise<{ error: AuthError | null }>
  exploreAsGuest: () => void
  requireAuth: (mode?: AuthScreenMode) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestMode, setGuestMode] = useState(false)
  const [authScreenMode, setAuthScreenMode] = useState<AuthScreenMode>('login')

  const refreshProfile = async () => {
    if (!session?.user) {
      setProfile(null)
      return
    }

    let nextProfile = await getMyProfile()
    if (!nextProfile) nextProfile = await ensureMyProfileFromMetadata()
    setProfile(nextProfile)
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) {
        console.warn('Unable to restore Supabase session:', error.message)
      }

      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) setGuestMode(false)
      if (nextSession) {
        setLoading(true)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!session?.user) return

    ;(async () => {
      try {
        let nextProfile = await getMyProfile()
        if (!nextProfile) nextProfile = await ensureMyProfileFromMetadata()
        if (active) setProfile(nextProfile)
      } catch (error) {
        console.warn(
          'Unable to load Supabase profile:',
          error instanceof Error ? error.message : error,
        )
        if (active) setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [session?.user.id])

  const login = (email: string, password: string) =>
    supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

  const register = ({
    email,
    password,
    displayName,
    username,
    country,
    city,
    appLanguage,
  }: RegisterDetails) =>
    supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          username: username.trim(),
          country: country.trim(),
          city: city.trim(),
          app_language: appLanguage,
        },
      },
    })

  const logout = () => supabase.auth.signOut()
  const exploreAsGuest = () => setGuestMode(true)
  const requireAuth = (mode: AuthScreenMode = 'login') => {
    setAuthScreenMode(mode)
    setGuestMode(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        guestMode,
        authScreenMode,
        login,
        register,
        logout,
        exploreAsGuest,
        requireAuth,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
