import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import {
  addComment,
  getUserCommentInteractions,
  createCommentNotification,
  createInteractionNotification,
} from '../services/interactionService'
import { getPostById } from '../services/postService'
import { supabase } from '../lib/supabase'
import { CommunityPost, CommunityComment } from '../types'
import CommentCard from '../components/CommentCard'

const COMMENT_SELECT = '*, author:profiles!post_comments_user_id_fkey(*)'

function mapComment(row: any): CommunityComment {
  const p = row.author
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    user: p ? {
      id: p.id, email: '', display_name: p.display_name, username: p.username,
      country: p.country ?? '', city: p.city ?? '', bio: p.bio,
      avatar_url: p.avatar_url ?? '', cover_url: p.cover_url ?? '',
      app_language: p.app_language, theme: 'dark', membership_status: p.membership_status,
      created_at: p.created_at, followers_count: 0, following_count: 0,
    } : undefined,
    text: row.text,
    image_url: row.image_url ?? undefined,
    likes_count: row.likes_count ?? 0,
    reposts_count: row.reposts_count ?? 0,
    replies_count: row.replies_count ?? 0,
    parent_comment_id: row.parent_comment_id ?? null,
    created_at: row.created_at,
  }
}

export default function CommentDetailScreen({ route, navigation }: any) {
  const { commentId } = route.params
  const { t, theme, isLoggedIn } = useApp()
  const { profile, requireAuth } = useAuth()
  const c = getTheme(theme)

  const [contextPost, setContextPost] = useState<CommunityPost | null>(null)
  const [ancestorComments, setAncestorComments] = useState<CommunityComment[]>([])
  const [parentComment, setParentComment] = useState<CommunityComment | null>(null)
  const [replies, setReplies] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<string[]>([])
  const [repostedIds, setRepostedIds] = useState<string[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)

    const fetchData = async () => {
      const { data: commentData, error: cErr } = await supabase
        .from('post_comments')
        .select(COMMENT_SELECT)
        .eq('id', commentId)
        .single()

      if (cErr || !commentData) {
        if (active) setLoading(false)
        return
      }

      const comment = mapComment(commentData)

      const [repliesRes, post] = await Promise.all([
        supabase
          .from('post_comments')
          .select(COMMENT_SELECT)
          .eq('parent_comment_id', commentId)
          .order('created_at', { ascending: true }),
        getPostById(comment.post_id).catch(() => null),
      ])

      const ancestors: CommunityComment[] = []
      let currentParentId = comment.parent_comment_id
      while (currentParentId) {
        const { data: ancestorData } = await supabase
          .from('post_comments')
          .select(COMMENT_SELECT)
          .eq('id', currentParentId)
          .single()
        if (!ancestorData) break
        const ancestor = mapComment(ancestorData)
        ancestors.unshift(ancestor)
        currentParentId = ancestor.parent_comment_id
      }

      let interactions = { likedCommentIds: [] as string[], repostedCommentIds: [] as string[], savedCommentIds: [] as string[] }
      if (profile) {
        try { interactions = await getUserCommentInteractions(profile.id) } catch {}
      }

      if (active) {
        setContextPost(post)
        setAncestorComments(ancestors)
        setParentComment(comment)
        setReplies((repliesRes.data ?? []).map(mapComment))
        setLikedIds(interactions.likedCommentIds)
        setRepostedIds(interactions.repostedCommentIds)
        setSavedIds(interactions.savedCommentIds)
        setLoading(false)
      }
    }

    fetchData()
    return () => { active = false }
  }, [commentId, profile?.id])

  const handleToggleLike = (id: string, result: { liked: boolean; count: number }) => {
    setLikedIds(prev => result.liked ? [...prev, id] : prev.filter(x => x !== id))
  }
  const handleToggleRepost = (id: string, reposted: boolean) => {
    setRepostedIds(prev => reposted ? [...prev, id] : prev.filter(x => x !== id))
  }
  const handleToggleSave = (id: string, saved: boolean) => {
    setSavedIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id))
  }
  const handleReplyAdded = (reply: CommunityComment) => {
    setReplies(prev => [...prev, reply])
  }
  const handleDeleted = (id: string) => {
    if (id === commentId) {
      navigation.goBack()
      return
    }
    setReplies(prev => prev.filter(r => r.id !== id))
    setParentComment(prev => prev ? { ...prev, replies_count: Math.max(0, prev.replies_count - 1) } : prev)
  }

  const pickImage = () => {
    Alert.alert(undefined as any, undefined, [
      {
        text: t('picker_camera'),
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync()
          if (status !== 'granted') return
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
          if (!result.canceled && result.assets[0]) setMediaUri(result.assets[0].uri)
        },
      },
      {
        text: t('picker_gallery'),
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (status !== 'granted') return
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
          if (!result.canceled && result.assets[0]) setMediaUri(result.assets[0].uri)
        },
      },
      { text: t('cancel'), style: 'cancel' },
    ])
  }

  const uploadImage = async (uri: string): Promise<string> => {
    const ext = uri.split('.').pop() ?? 'jpg'
    const fileName = `comment_${Date.now()}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await new Response(blob).arrayBuffer()
    const { error } = await supabase.storage.from('comment-images').upload(fileName, arrayBuffer, { contentType: `image/${ext}` })
    if (error) throw error
    const { data } = supabase.storage.from('comment-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSendReply = async () => {
    if ((!replyText.trim() && !mediaUri) || !profile || !parentComment) return
    setSending(true)
    try {
      let imageUrl: string | undefined
      if (mediaUri) imageUrl = await uploadImage(mediaUri)
      const reply = await addComment(parentComment.post_id, profile.id, replyText.trim(), commentId, imageUrl)
      setReplies(prev => [...prev, reply])
      setParentComment(prev => prev ? { ...prev, replies_count: prev.replies_count + 1 } : prev)
      setReplyText('')
      setMediaUri(null)
      createCommentNotification('comment_reply', profile.id, commentId, parentComment.post_id, profile.username).catch(() => {})
      createInteractionNotification('comment', profile.id, parentComment.post_id, profile.username).catch(() => {})
    } catch (err: any) {
      console.error('[CommentDetail] sendReply ERROR', err)
      Alert.alert('Hata', err?.message || 'Yanıt gönderilemedi')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </View>
    )
  }

  if (!parentComment) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🗑️</Text>
          <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>{t('post_deleted_placeholder')}</Text>
        </View>
      </View>
    )
  }

  const canReply = isLoggedIn && !!profile
  const hasContent = replyText.trim().length > 0 || !!mediaUri

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {contextPost && (
          <TouchableOpacity
            style={[styles.contextItem, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}
            onPress={() => navigation.navigate('PostDetail', { postId: contextPost.id })}
          >
            <View style={styles.contextLine}>
              <View style={[styles.contextDot, { backgroundColor: colors.teal }]} />
              <View style={[styles.contextConnector, { backgroundColor: c.border }]} />
            </View>
            <View style={styles.contextContent}>
              {contextPost.user && (
                <Text style={[styles.contextUser, { color: c.text }]} numberOfLines={1}>
                  {contextPost.user.display_name}{' '}
                  <Text style={{ color: c.textMuted, fontWeight: '400' }}>@{contextPost.user.username}</Text>
                </Text>
              )}
              <Text style={[styles.contextText, { color: c.textSecondary }]} numberOfLines={2}>
                {contextPost.text}
              </Text>
              {contextPost.image_url && (
                <Text style={{ color: c.textMuted, fontSize: 12 }}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {ancestorComments.map(ac => (
          <TouchableOpacity
            key={ac.id}
            style={[styles.contextItem, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}
            onPress={() => navigation.push('CommentDetail', { commentId: ac.id })}
          >
            <View style={styles.contextLine}>
              <View style={[styles.contextDot, { backgroundColor: c.textMuted }]} />
              <View style={[styles.contextConnector, { backgroundColor: c.border }]} />
            </View>
            <View style={styles.contextContent}>
              {ac.user && (
                <Text style={[styles.contextUser, { color: c.text }]} numberOfLines={1}>
                  {ac.user.display_name}{' '}
                  <Text style={{ color: c.textMuted, fontWeight: '400' }}>@{ac.user.username}</Text>
                </Text>
              )}
              <Text style={[styles.contextText, { color: c.textSecondary }]} numberOfLines={2}>
                {ac.text}
              </Text>
              {ac.image_url && (
                <Text style={{ color: c.textMuted, fontSize: 12 }}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        <CommentCard
          comment={parentComment}
          likedIds={likedIds}
          repostedIds={repostedIds}
          savedIds={savedIds}
          onToggleLike={handleToggleLike}
          onToggleRepost={handleToggleRepost}
          onToggleSave={handleToggleSave}
          onReplyAdded={handleReplyAdded}
          onDeleted={handleDeleted}
          onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
          onPress={(commentId) => navigation.push('CommentDetail', { commentId })}
        />

        <View style={styles.repliesSection}>
          <Text style={[styles.repliesTitle, { color: c.text }]}>
            {t('comments_title')} ({replies.length})
          </Text>
        </View>

        {replies.map(reply => (
          <CommentCard
            key={reply.id}
            comment={reply}
            likedIds={likedIds}
            repostedIds={repostedIds}
            savedIds={savedIds}
            onToggleLike={handleToggleLike}
            onToggleRepost={handleToggleRepost}
            onToggleSave={handleToggleSave}
            onReplyAdded={handleReplyAdded}
            onDeleted={handleDeleted}
            onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
            onPress={(commentId) => navigation.push('CommentDetail', { commentId })}
            isReply
          />
        ))}

        {replies.length === 0 && (
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 20 }}>
            {t('no_comments')}
          </Text>
        )}
      </ScrollView>

      {canReply ? (
        <View style={[styles.inputArea, { backgroundColor: c.bgSecondary, borderTopColor: c.border }]}>
          {mediaUri && (
            <View style={styles.mediaPreviewRow}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              <TouchableOpacity onPress={() => setMediaUri(null)} style={styles.mediaRemove}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={pickImage} style={styles.addMediaBtn}>
              <Text style={{ color: colors.teal, fontSize: 18, fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: c.bgInput, color: c.text }]}
              placeholder={t('comment_reply_placeholder')}
              placeholderTextColor={c.textMuted}
              value={replyText}
              onChangeText={setReplyText}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: hasContent && !sending ? colors.teal : c.bgInput }]}
              onPress={handleSendReply}
              disabled={!hasContent || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : !isLoggedIn ? (
        <TouchableOpacity
          style={[styles.inputArea, { backgroundColor: c.bgSecondary, borderTopColor: c.border, justifyContent: 'center', paddingVertical: 16 }]}
          onPress={() => requireAuth()}
        >
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center' }}>{t('comment_reply_placeholder')}</Text>
        </TouchableOpacity>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  contextItem: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  contextLine: { width: 20, alignItems: 'center', marginRight: 8 },
  contextDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  contextConnector: { width: 2, flex: 1, marginTop: 4 },
  contextContent: { flex: 1 },
  contextUser: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  contextText: { fontSize: 13, lineHeight: 18 },
  repliesSection: { paddingHorizontal: 16, paddingTop: 16 },
  repliesTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  inputArea: { borderTopWidth: 1, paddingBottom: 30 },
  mediaPreviewRow: { paddingHorizontal: 12, paddingTop: 10 },
  mediaPreview: { width: 72, height: 72, borderRadius: 10 },
  mediaRemove: { position: 'absolute', top: 14, left: 60, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  addMediaBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
