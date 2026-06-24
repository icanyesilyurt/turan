export type AppLanguage = 'tr' | 'az' | 'kk' | 'ky' | 'uz' | 'tk'
export type Theme = 'dark' | 'light'
export type MembershipStatus = 'free' | 'member' | 'admin'

export interface User {
  id: string
  email: string
  display_name: string
  username: string
  country: string
  city: string
  bio: string
  avatar_url: string
  app_language: AppLanguage
  theme: Theme
  membership_status: MembershipStatus
  created_at: string
  followers_count: number
  following_count: number
}

export interface ContentItem {
  id: string
  category_id: string
  title: string
  short_description: string
  content: string
  image_url: string
  language: AppLanguage
  show_in_daily_feed: boolean
  daily_feed_type?: DailyFeedType
  published_at: string
  created_at: string
}

export type DailyFeedType =
  | 'quote'
  | 'history'
  | 'personality'
  | 'city'
  | 'culture'
  | 'words'
  | 'news'

export interface CommunityPost {
  id: string
  user_id: string
  user?: User
  text: string
  image_url?: string
  category_id?: string
  likes_count: number
  comments_count: number
  reposts_count: number
  quoted_post_id?: string
  quoted_post?: CommunityPost
  created_at: string
  is_liked?: boolean
  is_saved?: boolean
  is_official?: boolean
}

export interface CommunityComment {
  id: string
  post_id: string
  user_id: string
  user?: User
  text: string
  created_at: string
}

export interface DirectMessage {
  id: string
  from_user_id: string
  to_user_id: string
  text: string
  created_at: string
  is_read: boolean
}

export interface Conversation {
  id: string
  other_user: User
  last_message: string
  last_message_at: string
  unread_count: number
}

export interface AppNotification {
  id: string
  type: 'official' | 'like' | 'comment' | 'follow' | 'repost' | 'dm'
  title: string
  body: string
  is_read: boolean
  from_user?: User
  post_id?: string
  created_at: string
}
