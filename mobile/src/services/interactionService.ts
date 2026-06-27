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
    image_url: row.image_url ?? undefined,
    likes_count: row.likes_count ?? 0,
    reposts_count: row.reposts_count ?? 0,
    replies_count: row.replies_count ?? 0,
    parent_comment_id: row.parent_comment_id ?? null,
    created_at: row.created_at,
  }
}

export async function addComment(
  postId: string,
  userId: string,
  text: string,
  parentCommentId?: string,
  imageUrl?: string,
): Promise<CommunityComment> {
  const row: any = { post_id: postId, user_id: userId, text: text.trim() }
  if (parentCommentId) row.parent_comment_id = parentCommentId
  if (imageUrl) row.image_url = imageUrl

  const { data, error } = await supabase
    .from('post_comments')
    .insert(row)
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

export async function toggleCommentLike(
  commentId: string,
  userId: string,
): Promise<{ liked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    if (error) throw error
  }

  const { data: comment, error: cErr } = await supabase
    .from('post_comments')
    .select('likes_count')
    .eq('id', commentId)
    .single()

  if (cErr) throw cErr
  return { liked: !existing, count: comment.likes_count }
}

export async function getUserLikedCommentIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', userId)

  return (data ?? []).map(r => r.comment_id)
}

export async function repostComment(
  commentId: string,
  userId: string,
): Promise<{ count: number }> {
  const { error } = await supabase
    .from('comment_reposts')
    .insert({ comment_id: commentId, user_id: userId })
  if (error) throw error

  const { data } = await supabase
    .from('post_comments')
    .select('reposts_count')
    .eq('id', commentId)
    .single()
  return { count: data?.reposts_count ?? 0 }
}

export async function unrepostComment(
  commentId: string,
  userId: string,
): Promise<{ count: number }> {
  const { error } = await supabase
    .from('comment_reposts')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId)
  if (error) throw error

  const { data } = await supabase
    .from('post_comments')
    .select('reposts_count')
    .eq('id', commentId)
    .single()
  return { count: data?.reposts_count ?? 0 }
}

export async function toggleCommentSave(
  commentId: string,
  userId: string,
): Promise<{ saved: boolean }> {
  const { data: existing } = await supabase
    .from('comment_saves')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('comment_saves').delete().eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('comment_saves').insert({ comment_id: commentId, user_id: userId })
    if (error) throw error
  }

  return { saved: !existing }
}

export async function getUserCommentInteractions(userId: string): Promise<{
  likedCommentIds: string[]
  repostedCommentIds: string[]
  savedCommentIds: string[]
}> {
  const [likes, reposts, saves] = await Promise.all([
    supabase.from('comment_likes').select('comment_id').eq('user_id', userId),
    supabase.from('comment_reposts').select('comment_id').eq('user_id', userId),
    supabase.from('comment_saves').select('comment_id').eq('user_id', userId),
  ])

  return {
    likedCommentIds: (likes.data ?? []).map(r => r.comment_id),
    repostedCommentIds: (reposts.data ?? []).map(r => r.comment_id),
    savedCommentIds: (saves.data ?? []).map(r => r.comment_id),
  }
}

export async function getSavedCommentIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('comment_saves')
    .select('comment_id')
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map(r => r.comment_id)
}

export async function getCommentsByIds(ids: string[]): Promise<CommunityComment[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapComment)
}

export async function getCommentRepostsByUser(
  userId: string,
  limit = 30,
): Promise<{ comment: CommunityComment; repost_created_at: string }[]> {
  const { data: repostRows, error: rErr } = await supabase
    .from('comment_reposts')
    .select('comment_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (rErr) throw rErr
  if (!repostRows || repostRows.length === 0) return []

  const commentIds = repostRows.map(r => r.comment_id)
  const { data: commentsData, error: cErr } = await supabase
    .from('post_comments')
    .select(COMMENT_SELECT)
    .in('id', commentIds)

  if (cErr) throw cErr

  const commentMap = new Map<string, CommunityComment>()
  for (const row of commentsData ?? []) {
    commentMap.set(row.id, mapComment(row))
  }

  const results: { comment: CommunityComment; repost_created_at: string }[] = []
  for (const r of repostRows) {
    const comment = commentMap.get(r.comment_id)
    if (comment) {
      results.push({ comment, repost_created_at: r.created_at })
    }
  }
  return results
}

export async function getFollowingCommentReposts(
  userIds: string[],
  limit = 30,
): Promise<{ comment: CommunityComment; repost_created_at: string; reposted_by: { display_name: string; username: string } }[]> {
  if (userIds.length === 0) return []

  const { data: repostRows, error: rErr } = await supabase
    .from('comment_reposts')
    .select('comment_id, created_at, user_id')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (rErr) throw rErr
  if (!repostRows || repostRows.length === 0) return []

  const commentIds = repostRows.map(r => r.comment_id)
  const profileIds = [...new Set(repostRows.map(r => r.user_id))]

  const [commentsRes, profilesRes] = await Promise.all([
    supabase.from('post_comments').select(COMMENT_SELECT).in('id', commentIds),
    supabase.from('profiles').select('id, display_name, username').in('id', profileIds),
  ])

  if (commentsRes.error) throw commentsRes.error

  const commentMap = new Map<string, CommunityComment>()
  for (const row of commentsRes.data ?? []) {
    commentMap.set(row.id, mapComment(row))
  }

  const profileMap = new Map<string, { display_name: string; username: string }>()
  for (const p of profilesRes.data ?? []) {
    profileMap.set(p.id, { display_name: p.display_name, username: p.username })
  }

  const results: { comment: CommunityComment; repost_created_at: string; reposted_by: { display_name: string; username: string } }[] = []
  for (const r of repostRows) {
    const comment = commentMap.get(r.comment_id)
    const profile = profileMap.get(r.user_id)
    if (comment && profile) {
      results.push({ comment, repost_created_at: r.created_at, reposted_by: profile })
    }
  }
  return results
}

export async function createCommentNotification(
  type: 'comment_like' | 'comment_reply' | 'comment_repost',
  actorId: string,
  commentId: string,
  postId: string,
  actorUsername: string,
): Promise<void> {
  const { data: comment } = await supabase
    .from('post_comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment || comment.user_id === actorId) return

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', comment.user_id)
    .eq('from_user_id', actorId)
    .eq('post_id', postId)
    .eq('type', type)
    .gte('created_at', twentyFourHoursAgo)
    .limit(1)

  if (existing && existing.length > 0) return

  const bodyMap = {
    comment_like: `@${actorUsername} yorumunu beğendi.`,
    comment_reply: `@${actorUsername} yorumunu yanıtladı.`,
    comment_repost: `@${actorUsername} yorumunu yeniden paylaştı.`,
  }

  await supabase.from('notifications').insert({
    user_id: comment.user_id,
    type,
    from_user_id: actorId,
    post_id: postId,
    body: bodyMap[type],
  })
}
