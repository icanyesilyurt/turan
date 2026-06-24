import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppLanguage, Theme, User, ContentItem, CommunityPost, CommunityComment } from '../types'
import translations from '../i18n/translations'
import { demoUser, demoContents, demoPosts, demoComments } from '../data/demo'

interface AppContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  t: (key: string) => string
  user: User | null
  setUser: (user: User | null) => void
  isLoggedIn: boolean
  contents: ContentItem[]
  posts: CommunityPost[]
  setPosts: React.Dispatch<React.SetStateAction<CommunityPost[]>>
  comments: CommunityComment[]
  setComments: React.Dispatch<React.SetStateAction<CommunityComment[]>>
  savedContentIds: string[]
  toggleSaveContent: (id: string) => void
  savedPostIds: string[]
  toggleSavePost: (id: string) => void
  toggleLikePost: (id: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() =>
    (localStorage.getItem('turan_lang') as AppLanguage) || 'tr'
  )
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('turan_theme') as Theme) || 'dark'
  )
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('turan_user')
    return stored ? JSON.parse(stored) : null
  })
  const [contents] = useState<ContentItem[]>(demoContents)
  const [posts, setPosts] = useState<CommunityPost[]>(demoPosts)
  const [comments, setComments] = useState<CommunityComment[]>(demoComments)
  const [savedContentIds, setSavedContentIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('turan_saved_contents')
    return stored ? JSON.parse(stored) : []
  })
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('turan_saved_posts')
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    localStorage.setItem('turan_lang', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('turan_theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (user) {
      localStorage.setItem('turan_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('turan_user')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('turan_saved_contents', JSON.stringify(savedContentIds))
  }, [savedContentIds])

  useEffect(() => {
    localStorage.setItem('turan_saved_posts', JSON.stringify(savedPostIds))
  }, [savedPostIds])

  const t = (key: string): string => {
    const trans = translations[language] as Record<string, string>
    return trans[key] || key
  }

  const toggleSaveContent = (id: string) => {
    setSavedContentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSavePost = (id: string) => {
    setSavedPostIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleLikePost = (id: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      )
    )
  }

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      theme, setTheme,
      t,
      user, setUser,
      isLoggedIn: !!user,
      contents,
      posts, setPosts,
      comments, setComments,
      savedContentIds, toggleSaveContent,
      savedPostIds, toggleSavePost,
      toggleLikePost,
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
