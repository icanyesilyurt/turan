import { decode } from 'base64-arraybuffer'

import { supabase } from '../lib/supabase'
import { AppLanguage, Profile } from '../types'

export type ProfileUpdates = Partial<
  Pick<
    Profile,
    | 'username'
    | 'display_name'
    | 'bio'
    | 'country'
    | 'city'
    | 'app_language'
    | 'avatar_url'
    | 'cover_url'
  >
>

export async function getMyProfile(): Promise<Profile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return null

  return getProfileById(user.id)
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.trim())
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const pattern = `%${trimmed}%`
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .order('display_name')
    .limit(limit)

  if (error) throw error
  return (data as Profile[]) ?? []
}

export async function updateMyProfile(updates: ProfileUpdates): Promise<Profile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Profil güncellemek için giriş yapmalısınız.')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}

export async function checkUsernameAvailable(
  username: string,
  currentUserId?: string,
): Promise<boolean> {
  const escapedUsername = username.trim().replace(/[\\%_]/g, '\\$&')
  let query = supabase
    .from('profiles')
    .select('id')
    .ilike('username', escapedUsername)

  if (currentUserId) query = query.neq('id', currentUserId)

  const { data, error } = await query.limit(1)

  if (error) throw error
  return data.length === 0
}

async function uploadProfileImage(
  bucket: 'avatars' | 'covers',
  filename: 'avatar.jpg' | 'cover.jpg',
  base64: string,
  contentType = 'image/jpeg',
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Görsel yüklemek için giriş yapmalısınız.')

  const path = `${user.id}/${filename}`
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), {
      contentType,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function uploadAvatar(
  base64: string,
  contentType?: string,
): Promise<Profile> {
  const avatarUrl = await uploadProfileImage(
    'avatars',
    'avatar.jpg',
    base64,
    contentType,
  )

  return updateMyProfile({ avatar_url: avatarUrl })
}

export async function uploadCover(
  base64: string,
  contentType?: string,
): Promise<Profile> {
  const coverUrl = await uploadProfileImage(
    'covers',
    'cover.jpg',
    base64,
    contentType,
  )

  return updateMyProfile({ cover_url: coverUrl })
}

export async function followUser(targetId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('[followUser] auth error:', userError)
    throw userError
  }
  if (!user) throw new Error('Takip etmek için giriş yapmalısınız.')

  console.log('[followUser] insert payload:', {
    follower_id: user.id,
    following_id: targetId,
    auth_uid_matches: true,
  })

  const { error, data, status } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: targetId })
    .select()

  console.log('[followUser] result:', { status, data, error: error?.message, code: error?.code })

  if (error) throw error
}

export async function unfollowUser(targetId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Takibi bırakmak için giriş yapmalısınız.')

  console.log('[unfollowUser] delete:', { follower_id: user.id, following_id: targetId })

  const { error, status } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', targetId)

  console.log('[unfollowUser] result:', { status, error: error?.message })

  if (error) throw error
}

export async function isFollowing(targetId: string): Promise<boolean> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return false

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetId)
    .maybeSingle()

  console.log('[isFollowing]', { follower: user.id, target: targetId, result: !!data, error: error?.message })

  if (error) throw error
  return !!data
}

export async function getFollowCounts(
  profileId: string,
): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profileId),
  ])

  if (followersRes.error) throw followersRes.error
  if (followingRes.error) throw followingRes.error

  const counts = {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  }
  console.log('[getFollowCounts]', { profileId, counts })
  return counts
}

export async function getFollowers(profileId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(*)')
    .eq('following_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data?.map((row: any) => row.follower).filter(Boolean) as Profile[]) ?? []
}

export async function getFollowing(profileId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(*)')
    .eq('follower_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data?.map((row: any) => row.following).filter(Boolean) as Profile[]) ?? []
}

export async function createFollowNotification(
  followerId: string,
  followingId: string,
  followerUsername: string,
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: followingId,
    type: 'follow',
    from_user_id: followerId,
    body: `@${followerUsername} seni takip etmeye basladi.`,
  })
  if (error) console.warn('[createFollowNotification] error:', error.message)
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, from_profile:profiles!notifications_from_user_id_fkey(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data ?? []
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export async function markNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) console.warn('[markNotificationsRead] error:', error.message)
}

export async function ensureMyProfileFromMetadata(): Promise<Profile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return null

  const metadata = user.user_metadata ?? {}
  const emailName = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
  const languageValue = String(metadata.app_language)
  const appLanguage: AppLanguage = ['tr', 'az', 'kk', 'ky', 'uz', 'tk'].includes(languageValue)
    ? languageValue as AppLanguage
    : 'tr'

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: String(metadata.username || emailName).trim(),
      display_name: String(metadata.display_name || emailName).trim(),
      country: String(metadata.country || '').trim() || null,
      city: String(metadata.city || '').trim() || null,
      app_language: appLanguage,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}
