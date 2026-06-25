import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppLanguage, Theme, User, Conversation, DirectMessage } from '../types'
import translations from '../i18n/translations'
import { demoConversations, demoMessages } from '../data/demo'
import { useAuth } from './AuthContext'
import { getFollowCounts, getUnreadNotificationCount } from '../services/profileService'
import {
  toggleLike,
  repostPost as repostPostApi,
  unrepostPost as unrepostPostApi,
  toggleSave,
  getUserInteractions,
  createInteractionNotification,
} from '../services/interactionService'

export interface Draft {
  id: string
  text: string
  created_at: string
}

interface AppContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  t: (key: string) => string
  user: User | null
  isLoggedIn: boolean
  postsVersion: number
  incrementPostsVersion: () => void
  conversations: Conversation[]
  messages: DirectMessage[]
  setMessages: React.Dispatch<React.SetStateAction<DirectMessage[]>>
  unreadNotifCount: number
  refreshUnreadCount: () => void
  savedPostIds: string[]
  likedPostIds: string[]
  repostedPostIds: string[]
  toggleLikePost: (postId: string) => Promise<{ liked: boolean; count: number }>
  repostPost: (postId: string) => Promise<{ count: number }>
  unrepostPost: (postId: string) => Promise<{ count: number }>
  toggleSavePost: (postId: string) => Promise<{ saved: boolean }>
  drafts: Draft[]
  addDraft: (text: string) => void
  removeDraft: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, profile } = useAuth()
  const [language, setLanguageState] = useState<AppLanguage>('tr')
  const [theme, setThemeState] = useState<Theme>('dark')
  const [conversations] = useState<Conversation[]>(demoConversations)
  const [messages, setMessages] = useState<DirectMessage[]>(demoMessages)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [likedPostIds, setLikedPostIds] = useState<string[]>([])
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loaded, setLoaded] = useState(false)
  const [followCountsState, setFollowCountsState] = useState({ followers: 0, following: 0 })
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [postsVersion, setPostsVersion] = useState(0)

  const incrementPostsVersion = useCallback(() => setPostsVersion(v => v + 1), [])

  useEffect(() => {
    if (!profile) {
      setFollowCountsState({ followers: 0, following: 0 })
      setUnreadNotifCount(0)
      setLikedPostIds([])
      setRepostedPostIds([])
      setSavedPostIds([])
      return
    }
    getFollowCounts(profile.id)
      .then(setFollowCountsState)
      .catch(() => {})
    getUnreadNotificationCount(profile.id)
      .then(setUnreadNotifCount)
      .catch(() => {})
    getUserInteractions(profile.id)
      .then(({ likedPostIds: l, repostedPostIds: r, savedPostIds: s }) => {
        setLikedPostIds(l)
        setRepostedPostIds(r)
        setSavedPostIds(s)
      })
      .catch(() => {})
  }, [profile?.id])

  const refreshUnreadCount = useCallback(() => {
    if (profile) {
      getUnreadNotificationCount(profile.id)
        .then(setUnreadNotifCount)
        .catch(() => {})
    }
  }, [profile?.id])

  const user: User | null = authUser && profile
    ? {
        id: profile.id,
        email: authUser.email ?? '',
        display_name: profile.display_name,
        username: profile.username,
        country: profile.country ?? '',
        city: profile.city ?? '',
        bio: profile.bio,
        avatar_url: profile.avatar_url ?? '',
        cover_url: profile.cover_url ?? '',
        app_language: profile.app_language,
        theme,
        membership_status: profile.membership_status,
        created_at: profile.created_at,
        followers_count: followCountsState.followers,
        following_count: followCountsState.following,
      }
    : null

  useEffect(() => {
    (async () => {
      const [lang, th, dr] = await Promise.all([
        AsyncStorage.getItem('turan_lang'),
        AsyncStorage.getItem('turan_theme'),
        AsyncStorage.getItem('turan_drafts'),
      ])
      if (lang) setLanguageState(lang as AppLanguage)
      if (th) setThemeState(th as Theme)
      if (dr) setDrafts(JSON.parse(dr))
      setLoaded(true)
    })()
  }, [])

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang)
    AsyncStorage.setItem('turan_lang', lang)
  }
  const setTheme = (th: Theme) => {
    setThemeState(th)
    AsyncStorage.setItem('turan_theme', th)
  }
  const t = (key: string): string => translations[language]?.[key] || translations.tr[key] || key

  const toggleLikePost = useCallback(async (postId: string) => {
    if (!profile) throw new Error('Not authenticated')
    const result = await toggleLike(postId, profile.id)
    setLikedPostIds(prev =>
      result.liked ? [...prev, postId] : prev.filter(id => id !== postId),
    )
    if (result.liked) {
      createInteractionNotification('like', profile.id, postId, profile.username).catch(() => {})
    }
    return result
  }, [profile?.id, profile?.username])

  const repostPost = useCallback(async (postId: string) => {
    if (!profile) throw new Error('Not authenticated')
    const result = await repostPostApi(postId, profile.id)
    setRepostedPostIds(prev => prev.includes(postId) ? prev : [...prev, postId])
    setPostsVersion(v => v + 1)
    createInteractionNotification('repost', profile.id, postId, profile.username).catch(() => {})
    return result
  }, [profile?.id, profile?.username])

  const unrepostPost = useCallback(async (postId: string) => {
    if (!profile) throw new Error('Not authenticated')
    const result = await unrepostPostApi(postId, profile.id)
    setRepostedPostIds(prev => prev.filter(id => id !== postId))
    setPostsVersion(v => v + 1)
    return result
  }, [profile?.id])

  const toggleSavePost = useCallback(async (postId: string) => {
    if (!profile) throw new Error('Not authenticated')
    const result = await toggleSave(postId, profile.id)
    setSavedPostIds(prev =>
      result.saved ? [...prev, postId] : prev.filter(id => id !== postId),
    )
    return result
  }, [profile?.id])

  const addDraft = (text: string) => {
    if (!text.trim()) return
    setDrafts(prev => {
      const next = [{ id: `draft_${Date.now()}`, text: text.trim(), created_at: new Date().toISOString() }, ...prev]
      AsyncStorage.setItem('turan_drafts', JSON.stringify(next))
      return next
    })
  }

  const removeDraft = (id: string) => {
    setDrafts(prev => {
      const next = prev.filter(d => d.id !== id)
      AsyncStorage.setItem('turan_drafts', JSON.stringify(next))
      return next
    })
  }

  if (!loaded) return null

  return (
    <AppContext.Provider value={{
      language, setLanguage, theme, setTheme, t,
      user, isLoggedIn: !!user,
      postsVersion, incrementPostsVersion,
      conversations, messages, setMessages,
      unreadNotifCount,
      refreshUnreadCount,
      savedPostIds, likedPostIds, repostedPostIds,
      toggleLikePost, repostPost, unrepostPost, toggleSavePost,
      drafts, addDraft, removeDraft,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
