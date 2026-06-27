import { supabase } from '../lib/supabase'
import { Conversation, DirectMessage, User } from '../types'

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function mapProfile(p: any): User {
  return {
    id: p.id,
    email: '',
    display_name: p.display_name,
    username: p.username,
    country: p.country ?? '',
    city: p.city ?? '',
    bio: p.bio ?? '',
    avatar_url: p.avatar_url ?? '',
    cover_url: p.cover_url ?? '',
    app_language: p.app_language ?? 'tr',
    theme: 'dark',
    membership_status: p.membership_status ?? 'free',
    created_at: p.created_at ?? '',
    followers_count: 0,
    following_count: 0,
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data: participations, error: pErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)

  if (pErr) throw pErr
  if (!participations || participations.length === 0) return []

  const convIds = participations.map(p => p.conversation_id)
  const lastReadMap = new Map<string, string | null>()
  for (const p of participations) {
    lastReadMap.set(p.conversation_id, p.last_read_at)
  }

  const { data: allParticipants, error: apErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)

  if (apErr) throw apErr

  const otherUserIds: string[] = []
  const convToOther = new Map<string, string>()
  for (const p of allParticipants ?? []) {
    if (p.user_id !== userId) {
      otherUserIds.push(p.user_id)
      convToOther.set(p.conversation_id, p.user_id)
    }
  }

  if (otherUserIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', [...new Set(otherUserIds)])

  const profileMap = new Map<string, User>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, mapProfile(p))
  }

  const { data: conversations, error: cErr } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('updated_at', { ascending: false })

  if (cErr) throw cErr

  const results: Conversation[] = []
  for (const conv of conversations ?? []) {
    const otherUserId = convToOther.get(conv.id)
    if (!otherUserId) continue
    const otherUser = profileMap.get(otherUserId)
    if (!otherUser) continue

    const lastRead = lastReadMap.get(conv.id)
    let unread = 0
    const unreadQuery = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('user_id', userId)
    if (lastRead) unreadQuery.gt('created_at', lastRead)
    const { count: uc } = await unreadQuery
    if (uc && uc > 0) unread = uc

    results.push({
      id: conv.id,
      other_user: otherUser,
      last_message: conv.last_message ?? '',
      last_message_at: conv.updated_at,
      unread_count: unread,
    })
  }

  return results
}

export async function getUnreadConversationCount(userId: string): Promise<number> {
  const { data: participations, error: pErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)

  if (pErr || !participations || participations.length === 0) return 0

  let count = 0
  for (const p of participations) {
    const query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', p.conversation_id)
      .neq('user_id', userId)

    if (p.last_read_at) {
      query.gt('created_at', p.last_read_at)
    }

    const { count: msgCount } = await query
    if (msgCount && msgCount > 0) count++
  }

  return count
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) console.error('[markConversationRead] error:', error.message)
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('[deleteConversation] error:', error.message)
    throw error
  }
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
): Promise<string> {
  const { data: myConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId)

  if (myConvs && myConvs.length > 0) {
    const myConvIds = myConvs.map(c => c.conversation_id)

    const { data: otherConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds)

    if (otherConvs && otherConvs.length > 0) {
      return otherConvs[0].conversation_id
    }
  }

  const convId = generateUUID()

  const { error: convErr } = await supabase
    .from('conversations')
    .insert({ id: convId })

  if (convErr) throw convErr

  const { error: pErr } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: convId, user_id: userId },
      { conversation_id: convId, user_id: otherUserId },
    ])

  if (pErr) throw pErr

  return convId
}

export async function getMessages(
  conversationId: string,
  limit = 50,
): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    conversation_id: row.conversation_id,
    from_user_id: row.user_id,
    text: row.text,
    created_at: row.created_at,
  }))
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  text: string,
): Promise<DirectMessage> {
  const msgId = generateUUID()
  const now = new Date().toISOString()
  const trimmed = text.trim()

  const { error } = await supabase
    .from('messages')
    .insert({ id: msgId, conversation_id: conversationId, user_id: userId, text: trimmed })

  if (error) {
    console.error('[sendMessage] INSERT error:', error.message)
    throw error
  }

  supabase
    .from('conversations')
    .update({ last_message: trimmed, updated_at: now })
    .eq('id', conversationId)
    .then(({ error: uErr }) => {
      if (uErr) console.error('[sendMessage] conversation update error:', uErr.message)
    })

  return {
    id: msgId,
    conversation_id: conversationId,
    from_user_id: userId,
    text: trimmed,
    created_at: now,
  }
}
