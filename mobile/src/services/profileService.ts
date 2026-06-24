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
