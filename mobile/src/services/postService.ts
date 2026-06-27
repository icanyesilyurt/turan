import { supabase } from '../lib/supabase'
import { CommunityPost, Profile } from '../types'

function mapRow(row: any, rootCommentCount?: number): CommunityPost {
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
    comments_count: rootCommentCount ?? row.comments_count,
    reposts_count: row.reposts_count,
    created_at: row.created_at,
    is_liked: false,
    is_saved: false,
    pinned_at: row.pinned_at ?? null,
  }
}

const POST_SELECT = '*, author:profiles!posts_user_id_fkey(*)'

async function getRootCommentCountMap(postIds: string[]): Promise<Map<string, number>> {
  const uniqueIds = [...new Set(postIds)]
  const counts = new Map<string, number>()
  for (const id of uniqueIds) counts.set(id, 0)
  if (uniqueIds.length === 0) return counts

  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', uniqueIds)
    .is('parent_comment_id', null)

  if (error) throw error

  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1)
  }

  return counts
}

async function mapRowsWithRootCommentCounts(rows: any[]): Promise<CommunityPost[]> {
  const counts = await getRootCommentCountMap(rows.map(row => row.id))
  return rows.map(row => mapRow(row, counts.get(row.id) ?? 0))
}

async function withRootCommentCounts(posts: CommunityPost[]): Promise<CommunityPost[]> {
  const counts = await getRootCommentCountMap(posts.map(post => post.id))
  return posts.map(post => ({ ...post, comments_count: counts.get(post.id) ?? 0 }))
}

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
  return mapRowsWithRootCommentCounts(data ?? [])
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

  const [postsRes, repostsRes] = await Promise.all([
    supabase
      .from('posts')
      .select(POST_SELECT)
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('post_reposts')
      .select('post_id, created_at, user_id')
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  if (postsRes.error) throw postsRes.error
  if (repostsRes.error) throw repostsRes.error

  const entries: { post: CommunityPost; sortDate: string }[] =
    (postsRes.data ?? []).map(row => ({ post: mapRow(row), sortDate: row.created_at }))

  const repostRows = repostsRes.data ?? []
  if (repostRows.length > 0) {
    const repostPostIds = repostRows.map(r => r.post_id)
    const repostUserIds = [...new Set(repostRows.map(r => r.user_id))]

    const [rpPostsRes, rpProfilesRes] = await Promise.all([
      supabase.from('posts').select(POST_SELECT).in('id', repostPostIds),
      supabase.from('profiles').select('id, display_name, username').in('id', repostUserIds),
    ])

    if (rpPostsRes.error) throw rpPostsRes.error

    const profileMap = new Map<string, { display_name: string; username: string }>()
    for (const p of rpProfilesRes.data ?? []) {
      profileMap.set(p.id, { display_name: p.display_name, username: p.username })
    }

    for (const row of rpPostsRes.data ?? []) {
      const repostRow = repostRows.find(r => r.post_id === row.id)
      if (!repostRow) continue
      const post = mapRow(row)
      post.reposted_by = profileMap.get(repostRow.user_id)
      entries.push({ post, sortDate: repostRow.created_at })
    }
  }

  entries.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())

  const seen = new Set<string>()
  const deduped: CommunityPost[] = []
  for (const entry of entries) {
    if (!seen.has(entry.post.id)) {
      seen.add(entry.post.id)
      deduped.push(entry.post)
    }
  }
  return withRootCommentCounts(deduped.slice(0, limit))
}

export async function getExplorePosts(limit = 30): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return mapRowsWithRootCommentCounts(data ?? [])
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
  return mapRowsWithRootCommentCounts(data ?? [])
}

export async function getProfileFeed(
  userId: string,
  limit = 30,
): Promise<CommunityPost[]> {
  const [ownRes, repostRes, profileRes] = await Promise.all([
    supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('post_reposts')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', userId)
      .single(),
  ])

  if (ownRes.error) throw ownRes.error
  if (repostRes.error) throw repostRes.error

  const entries: { post: CommunityPost; sortDate: string }[] =
    (ownRes.data ?? []).map(row => ({ post: mapRow(row), sortDate: row.created_at }))

  const repostRows = repostRes.data ?? []
  if (repostRows.length > 0) {
    const repostIds = repostRows.map(r => r.post_id)
    const { data: rpData, error: rpErr } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .in('id', repostIds)

    if (rpErr) throw rpErr

    const repostBy = profileRes.data
      ? { display_name: profileRes.data.display_name, username: profileRes.data.username }
      : undefined

    for (const row of rpData ?? []) {
      const repostRow = repostRows.find(r => r.post_id === row.id)
      const post = mapRow(row)
      post.reposted_by = repostBy
      entries.push({ post, sortDate: repostRow?.created_at ?? row.created_at })
    }
  }

  entries.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())

  const seen = new Set<string>()
  const pinned: CommunityPost[] = []
  const regular: CommunityPost[] = []
  for (const entry of entries) {
    if (!seen.has(entry.post.id)) {
      seen.add(entry.post.id)
      if (entry.post.pinned_at && !entry.post.reposted_by) {
        pinned.push(entry.post)
      } else {
        regular.push(entry.post)
      }
    }
  }
  return withRootCommentCounts([...pinned, ...regular].slice(0, limit))
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
  if (!data) return null
  const counts = await getRootCommentCountMap([data.id])
  return mapRow(data, counts.get(data.id) ?? 0)
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
  return mapRowsWithRootCommentCounts(data ?? [])
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) throw error
}

export async function pinPost(postId: string, userId: string): Promise<void> {
  const { error: unpinErr } = await supabase
    .from('posts')
    .update({ pinned_at: null })
    .eq('user_id', userId)
    .not('pinned_at', 'is', null)

  if (unpinErr) throw unpinErr

  const { error } = await supabase
    .from('posts')
    .update({ pinned_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function unpinPost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ pinned_at: null })
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) throw error
}
