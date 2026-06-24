import { supabase } from '../lib/supabase'
import { CommunityPost, Profile } from '../types'

function mapRow(row: any): CommunityPost {
  const p = row.author as Profile | null
  return {
    id: row.id,
    user_id: row.user_id,
    user: p
      ? {
          id: p.id,
          email: '',
          display_name: p.display_name,
          username: p.username,
          country: p.country ?? '',
          city: p.city ?? '',
          bio: p.bio,
          avatar_url: p.avatar_url ?? '',
          cover_url: p.cover_url ?? '',
          app_language: p.app_language,
          theme: 'dark',
          membership_status: p.membership_status,
          created_at: p.created_at,
          followers_count: 0,
          following_count: 0,
        }
      : undefined,
    text: row.text,
    image_url: row.image_url ?? undefined,
    is_official: row.is_official,
    likes_count: row.likes_count,
    comments_count: row.comments_count,
    reposts_count: row.reposts_count,
    created_at: row.created_at,
    is_liked: false,
    is_saved: false,
  }
}

const POST_SELECT = '*, author:profiles!posts_user_id_fkey(*)'

export async function createPost(
  userId: string,
  text: string,
  imageUrl?: string,
): Promise<CommunityPost> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, text: text.trim(), image_url: imageUrl ?? null })
    .select(POST_SELECT)
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function getOfficialPosts(limit = 30): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('is_official', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getFollowingPosts(
  userId: string,
  limit = 30,
): Promise<CommunityPost[]> {
  const { data: follows, error: fErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (fErr) throw fErr

  const ids = follows?.map(f => f.following_id) ?? []
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getExplorePosts(limit = 30): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getProfilePosts(
  userId: string,
  limit = 30,
): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapRow)
}

export async function getPostById(
  id: string,
): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapRow(data) : null
}

export async function getPostsByIds(
  ids: string[],
): Promise<CommunityPost[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapRow)
}
