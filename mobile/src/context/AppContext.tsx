import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppLanguage, Theme, User, CommunityComment, Conversation, DirectMessage } from '../types'
import translations from '../i18n/translations'
import { demoConversations, demoMessages } from '../data/demo'
import { useAuth } from './AuthContext'
import { getFollowCounts, getUnreadNotificationCount } from '../services/profileService'

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
  comments: CommunityComment[]
  setComments: React.Dispatch<React.SetStateAction<CommunityComment[]>>
  conversations: Conversation[]
  messages: DirectMessage[]
  setMessages: React.Dispatch<React.SetStateAction<DirectMessage[]>>
  unreadNotifCount: number
  refreshUnreadCount: () => void
  savedPostIds: string[]
  toggleSavePost: (id: string) => void
  likedPostIds: string[]
  toggleLikePost: (id: string) => void
  repostedPostIds: string[]
  toggleRepostPost: (id: string) => void
  drafts: Draft[]
  addDraft: (text: string) => void
  removeDraft: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, profile } = useAuth()
  const [language, setLanguageState] = useState<AppLanguage>('tr')
  const [theme, setThemeState] = useState<Theme>('dark')
  const [comments, setComments] = useState<CommunityComment[]>([])
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
      return
    }
    getFollowCounts(profile.id)
      .then(setFollowCountsState)
      .catch(() => {})
    getUnreadNotificationCount(profile.id)
      .then(setUnreadNotifCount)
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
      const [lang, th, sp, dr, lp, rp] = await Promise.all([
        AsyncStorage.getItem('turan_lang'),
        AsyncStorage.getItem('turan_theme'),
        AsyncStorage.getItem('turan_saved_posts'),
        AsyncStorage.getItem('turan_drafts'),
        AsyncStorage.getItem('turan_liked_posts'),
        AsyncStorage.getItem('turan_reposted_posts'),
      ])
      if (lang) setLanguageState(lang as AppLanguage)
      if (th) setThemeState(th as Theme)
      if (sp) setSavedPostIds(JSON.parse(sp))
      if (dr) setDrafts(JSON.parse(dr))
      if (lp) setLikedPostIds(JSON.parse(lp))
      if (rp) setRepostedPostIds(JSON.parse(rp))
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

  const toggleSavePost = (id: string) => {
    setSavedPostIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      AsyncStorage.setItem('turan_saved_posts', JSON.stringify(next))
      return next
    })
  }

  const toggleLikePost = (id: string) => {
    setLikedPostIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      AsyncStorage.setItem('turan_liked_posts', JSON.stringify(next))
      return next
    })
  }

  const toggleRepostPost = (id: string) => {
    setRepostedPostIds(prev => {
      const next = prev.includes(id) ? [...prev] : [...prev, id]
      AsyncStorage.setItem('turan_reposted_posts', JSON.stringify(next))
      return next
    })
  }

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
      comments, setComments,
      conversations, messages, setMessages,
      unreadNotifCount,
      refreshUnreadCount,
      savedPostIds, toggleSavePost,
      likedPostIds, toggleLikePost,
      repostedPostIds, toggleRepostPost,
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
