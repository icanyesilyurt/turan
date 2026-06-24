import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppLanguage, Theme, User, CommunityPost, CommunityComment, Conversation, DirectMessage, AppNotification } from '../types'
import translations from '../i18n/translations'
import { demoUser, officialPosts, followingPosts, explorePosts, demoComments, demoConversations, demoMessages, demoNotifications } from '../data/demo'

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
  setUser: (user: User | null) => void
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
  notifications: AppNotification[]
  unreadNotifCount: number
  savedPostIds: string[]
  toggleSavePost: (id: string) => void
  toggleLikePost: (id: string) => void
  drafts: Draft[]
  addDraft: (text: string) => void
  removeDraft: (id: string) => void
  loginDemo: () => void
  logoutDemo: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('tr')
  const [theme, setThemeState] = useState<Theme>('dark')
  const [user, setUser] = useState<User | null>(null)
  const [official, setOfficial] = useState<CommunityPost[]>(officialPosts)
  const [following, setFollowing] = useState<CommunityPost[]>(followingPosts)
  const [explore, setExplore] = useState<CommunityPost[]>(explorePosts)
  const [comments, setComments] = useState<CommunityComment[]>(demoComments)
  const [conversations] = useState<Conversation[]>(demoConversations)
  const [messages, setMessages] = useState<DirectMessage[]>(demoMessages)
  const [notifs] = useState<AppNotification[]>(demoNotifications)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    (async () => {
      const [lang, th, usr, sp, dr] = await Promise.all([
        AsyncStorage.getItem('turan_lang'),
        AsyncStorage.getItem('turan_theme'),
        AsyncStorage.getItem('turan_user'),
        AsyncStorage.getItem('turan_saved_posts'),
        AsyncStorage.getItem('turan_drafts'),
      ])
      if (lang) setLanguageState(lang as AppLanguage)
      if (th) setThemeState(th as Theme)
      if (usr) setUser(JSON.parse(usr))
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

  const toggleSavePost = (id: string) => {
    setSavedPostIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      AsyncStorage.setItem('turan_saved_posts', JSON.stringify(next))
      return next
    })
  }

  const allPosts = [...official, ...following, ...explore]

  const likeInAll = (id: string, posts: CommunityPost[]) =>
    posts.map(p => p.id === id ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 } : p)

  const toggleLikePost = (id: string) => {
    setOfficial(prev => likeInAll(id, prev))
    setFollowing(prev => likeInAll(id, prev))
    setExplore(prev => likeInAll(id, prev))
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

  const loginDemo = () => {
    setUser(demoUser)
    AsyncStorage.setItem('turan_user', JSON.stringify(demoUser))
  }
  const logoutDemo = () => {
    setUser(null)
    AsyncStorage.removeItem('turan_user')
  }

  if (!loaded) return null

  return (
    <AppContext.Provider value={{
      language, setLanguage, theme, setTheme, t,
      user, setUser, isLoggedIn: !!user,
      officialPosts: official,
      followingPosts: following,
      explorePosts: explore,
      allPosts,
      addPost,
      comments, setComments,
      conversations, messages, setMessages,
      notifications: notifs,
      unreadNotifCount: notifs.filter(n => !n.is_read).length,
      savedPostIds, toggleSavePost, toggleLikePost,
      drafts, addDraft, removeDraft,
      loginDemo, logoutDemo,
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
