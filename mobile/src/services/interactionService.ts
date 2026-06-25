import { supabase } from '../lib/supabase'
import { CommunityComment, Profile } from '../types'

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<{ liked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('post_likes').delete().eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }

  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .single()

  if (pErr) throw pErr
  return { liked: !existing, count: post.likes_count }
}

export async function repostPost(
  postId: string,
  userId: string,
): Promise<{ count: number }> {
  const { error } = await supabase
    .from('post_reposts')
    .insert({ post_id: postId, user_id: userId })

  if (error) throw error

  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('reposts_count')
    .eq('id', postId)
    .single()

  if (pErr) throw pErr
  return { count: post.reposts_count }
}

export async function unrepostPost(
  postId: string,
  userId: string,
): Promise<{ count: number }> {
  const { error } = await supabase
    .from('post_reposts')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error

  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('reposts_count')
    .eq('id', postId)
    .single()

  if (pErr) throw pErr
  return { count: post.reposts_count }
}

export async function toggleSave(
  postId: string,
  userId: string,
): Promise<{ saved: boolean }> {
  const { data: existing } = await supabase
    .from('post_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('post_saves').delete().eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('post_saves').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }

  return { saved: !existing }
}

const COMMENT_SELECT = '*, author:profiles!post_comments_user_id_fkey(*)'

function mapComment(row: any): CommunityComment {
  const p = row.author as Profile | null
  return {
    id: row.id,
    post_id: row.post_id,
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
    created_at: row.created_at,
  }
}

export async function addComment(
  postId: string,
  userId: string,
  text: string,
): Promise<CommunityComment> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, text: text.trim() })
    .select(COMMENT_SELECT)
    .single()

  if (error) throw error
  return mapComment(data)
}

export async function getPostComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapComment)
}

export async function getUserComments(
  userId: string,
  limit = 50,
): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapComment)
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) throw error
}

export async function getUserInteractions(userId: string): Promise<{
  likedPostIds: string[]
  repostedPostIds: string[]
  savedPostIds: string[]
}> {
  const [likes, reposts, saves] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', userId),
    supabase.from('post_reposts').select('post_id').eq('user_id', userId),
    supabase.from('post_saves').select('post_id').eq('user_id', userId),
  ])

  return {
    likedPostIds: (likes.data ?? []).map(r => r.post_id),
    repostedPostIds: (reposts.data ?? []).map(r => r.post_id),
    savedPostIds: (saves.data ?? []).map(r => r.post_id),
  }
}

export async function createInteractionNotification(
  type: 'like' | 'comment' | 'repost',
  actorId: string,
  postId: string,
  actorUsername: string,
): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post || post.user_id === actorId) return

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', post.user_id)
    .eq('from_user_id', actorId)
    .eq('post_id', postId)
    .eq('type', type)
    .gte('created_at', twentyFourHoursAgo)
    .limit(1)

  if (existing && existing.length > 0) return

  const bodyMap = {
    like: `@${actorUsername} gönderini beğendi.`,
    comment: `@${actorUsername} gönderine yorum yaptı.`,
    repost: `@${actorUsername} gönderini yeniden paylaştı.`,
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: post.user_id,
    type,
    from_user_id: actorId,
    post_id: postId,
    body: bodyMap[type],
  })

  if (error) console.warn('[createInteractionNotification] error:', error.message)
}
