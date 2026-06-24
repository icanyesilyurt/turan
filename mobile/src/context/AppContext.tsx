import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppLanguage, Theme, User, CommunityPost, CommunityComment, Conversation, DirectMessage, AppNotification } from '../types'
import translations from '../i18n/translations'
import { officialPosts, followingPosts, explorePosts, demoComments, demoConversations, demoMessages } from '../data/demo'
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
  officialPosts: CommunityPost[]
  followingPosts: CommunityPost[]
  explorePosts: CommunityPost[]
  allPosts: CommunityPost[]
  addPost: (text: string) => void
  comments: CommunityComment[]
  setComments: React.Dispatch<React.SetStateAction<CommunityComment[]>>
  conversations: Conversation[]
  messages: DirectMessage[]
  setMessages: React.Dispatch<React.SetStateAction<DirectMessage[]>>
  unreadNotifCount: number
  refreshUnreadCount: () => void
  savedPostIds: string[]
  toggleSavePost: (id: string) => void
  toggleLikePost: (id: string) => void
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
  const [official, setOfficial] = useState<CommunityPost[]>(officialPosts)
  const [following, setFollowing] = useState<CommunityPost[]>(followingPosts)
  const [explore, setExplore] = useState<CommunityPost[]>(explorePosts)
  const [comments, setComments] = useState<CommunityComment[]>(demoComments)
  const [conversations] = useState<Conversation[]>(demoConversations)
  const [messages, setMessages] = useState<DirectMessage[]>(demoMessages)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loaded, setLoaded] = useState(false)
  const [followCountsState, setFollowCountsState] = useState({ followers: 0, following: 0 })
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

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
      const [lang, th, sp, dr] = await Promise.all([
        AsyncStorage.getItem('turan_lang'),
        AsyncStorage.getItem('turan_theme'),
        AsyncStorage.getItem('turan_saved_posts'),
        AsyncStorage.getItem('turan_drafts'),
      ])
      if (lang) setLanguageState(lang as AppLanguage)
      if (th) setThemeState(th as Theme)
      if (sp) setSavedPostIds(JSON.parse(sp))
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

  const withCurrentAuthor = (posts: CommunityPost[]) =>
    posts.map(post =>
      user && post.user_id === user.id
        ? { ...post, user }
        : post
    )

  const currentOfficialPosts = withCurrentAuthor(official)
  const currentFollowingPosts = withCurrentAuthor(following)
  const currentExplorePosts = withCurrentAuthor(explore)

  const toggleSavePost = (id: string) => {
    setSavedPostIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      AsyncStorage.setItem('turan_saved_posts', JSON.stringify(next))
      return next
    })
  }

  const allPosts = [
    ...currentOfficialPosts,
    ...currentFollowingPosts,
    ...currentExplorePosts,
  ]

  const likeInAll = (id: string, posts: CommunityPost[]) =>
    posts.map(p => p.id === id ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p)

  const toggleLikePost = (id: string) => {
    setOfficial(prev => likeInAll(id, prev))
    setFollowing(prev => likeInAll(id, prev))
    setExplore(prev => likeInAll(id, prev))
  }

  const repostInAll = (id: string, posts: CommunityPost[]) =>
    posts.map(post =>
      post.id === id
        ? { ...post, reposts_count: post.reposts_count + 1 }
        : post
    )

  const toggleRepostPost = (id: string) => {
    setOfficial(prev => repostInAll(id, prev))
    setFollowing(prev => repostInAll(id, prev))
    setExplore(prev => repostInAll(id, prev))
  }

  const addPost = (text: string) => {
    if (!user || !text.trim()) return
    const newPost: CommunityPost = {
      id: `p${Date.now()}`,
      user_id: user.id,
      user,
      text: text.trim(),
      likes_count: 0,
      comments_count: 0,
      reposts_count: 0,
      created_at: new Date().toISOString(),
      is_liked: false,
      is_saved: false,
    }
    setFollowing(prev => [newPost, ...prev])
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
      officialPosts: currentOfficialPosts,
      followingPosts: currentFollowingPosts,
      explorePosts: currentExplorePosts,
      allPosts,
      addPost,
      comments, setComments,
      conversations, messages, setMessages,
      unreadNotifCount,
      refreshUnreadCount,
      savedPostIds, toggleSavePost, toggleLikePost, toggleRepostPost,
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
