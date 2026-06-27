import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getPostById } from '../services/postService'
import {
  getPostComments,
  addComment,
  createInteractionNotification,
  getUserCommentInteractions,
} from '../services/interactionService'
import { supabase } from '../lib/supabase'
import { CommunityPost, CommunityComment } from '../types'
import PostCard from '../components/PostCard'
import CommentCard from '../components/CommentCard'

export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params
  const { t, theme, isLoggedIn } = useApp()
  const { profile, requireAuth } = useAuth()
  const c = getTheme(theme)
  const [commentText, setCommentText] = useState('')
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [allComments, setAllComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([])
  const [repostedCommentIds, setRepostedCommentIds] = useState<string[]>([])
  const [savedCommentIds, setSavedCommentIds] = useState<string[]>([])
  const [mediaUri, setMediaUri] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      getPostById(postId),
      getPostComments(postId),
      profile ? getUserCommentInteractions(profile.id) : Promise.resolve({ likedCommentIds: [], repostedCommentIds: [], savedCommentIds: [] }),
    ])
      .then(([postData, commentsData, interactions]) => {
        if (active) {
          setPost(postData)
          setAllComments(commentsData)
          setLikedCommentIds(interactions.likedCommentIds)
          setRepostedCommentIds(interactions.repostedCommentIds)
          setSavedCommentIds(interactions.savedCommentIds)
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [postId, profile?.id])

  const rootComments = useMemo(
    () => allComments.filter(cm => !cm.parent_comment_id),
    [allComments],
  )

  const postWithRootCommentCount = useMemo(
    () => post ? { ...post, comments_count: rootComments.length } : null,
    [post, rootComments.length],
  )

  const handleToggleLike = (id: string, result: { liked: boolean; count: number }) => {
    setLikedCommentIds(prev => result.liked ? [...prev, id] : prev.filter(x => x !== id))
  }

  const handleToggleRepost = (id: string, reposted: boolean) => {
    setRepostedCommentIds(prev => reposted ? [...prev, id] : prev.filter(x => x !== id))
  }

  const handleToggleSave = (id: string, saved: boolean) => {
    setSavedCommentIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id))
  }

  const handleReplyAdded = (reply: CommunityComment) => {
    setAllComments(prev => {
      const updated = [...prev, reply]
      if (reply.parent_comment_id) {
        return updated.map(cm =>
          cm.id === reply.parent_comment_id
            ? { ...cm, replies_count: cm.replies_count + 1 }
            : cm,
        )
      }
      return updated
    })
  }

  const handleCommentDeleted = (commentId: string) => {
    setAllComments(prev => prev.filter(cm => cm.id !== commentId && cm.parent_comment_id !== commentId))
    getPostById(postId).then(freshPost => { if (freshPost) setPost(freshPost) }).catch(() => {})
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

  const uploadCommentImage = async (uri: string): Promise<string> => {
    const ext = uri.split('.').pop() ?? 'jpg'
    const fileName = `comment_${Date.now()}.${ext}`
    const response = await fetch(uri)
    const blob = await response.blob()
    const arrayBuffer = await new Response(blob).arrayBuffer()
    const { error } = await supabase.storage.from('comment-images').upload(fileName, arrayBuffer, { contentType: `image/${ext}` })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('comment-images').getPublicUrl(fileName)
    return urlData.publicUrl
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

  if (!post) {
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

  const canComment = isLoggedIn && !!profile
  const hasContent = commentText.trim().length > 0 || !!mediaUri

  const handleComment = async () => {
    if (!hasContent || !profile) return
    setSending(true)
    try {
      let imageUrl: string | undefined
      if (mediaUri) {
        imageUrl = await uploadCommentImage(mediaUri)
      }
      const newComment = await addComment(postId, profile.id, commentText.trim(), undefined, imageUrl)
      setAllComments(prev => [...prev, newComment])
      setCommentText('')
      setMediaUri(null)
      const freshPost = await getPostById(postId)
      if (freshPost) setPost(freshPost)
      createInteractionNotification('comment', profile.id, postId, profile.username).catch(() => {})
    } catch (err: any) {
      console.error('[PostDetail] handleComment ERROR', err)
      Alert.alert('Hata', err?.message || 'Yorum gönderilemedi')
    }
    setSending(false)
  }

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
        <PostCard
          post={postWithRootCommentCount ?? post}
          onDeleted={() => navigation.goBack()}
          onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
        />

        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: c.text }]}>
            {t('comments_title')} ({rootComments.length})
          </Text>
        </View>

        {rootComments.map(cm => (
          <CommentCard
            key={cm.id}
            comment={cm}
            likedIds={likedCommentIds}
            repostedIds={repostedCommentIds}
            savedIds={savedCommentIds}
            onToggleLike={handleToggleLike}
            onToggleRepost={handleToggleRepost}
            onToggleSave={handleToggleSave}
            onReplyAdded={handleReplyAdded}
            onDeleted={handleCommentDeleted}
            onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
            onPress={(commentId) => navigation.navigate('CommentDetail', { commentId })}
          />
        ))}

        {rootComments.length === 0 && (
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 20 }}>
            {t('no_comments')}
          </Text>
        )}
      </ScrollView>

      {canComment ? (
        <View style={[styles.commentInputArea, { backgroundColor: c.bgSecondary, borderTopColor: c.border }]}>
          {mediaUri && (
            <View style={styles.mediaPreviewRow}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              <TouchableOpacity onPress={() => setMediaUri(null)} style={styles.mediaRemove}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TouchableOpacity onPress={pickImage} style={styles.addMediaBtn}>
              <Text style={{ color: colors.teal, fontSize: 18, fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: c.bgInput, color: c.text }]}
              placeholder={t('write_comment')}
              placeholderTextColor={c.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: hasContent && !sending ? colors.teal : c.bgInput }]}
              onPress={handleComment}
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
          style={[styles.commentInputArea, { backgroundColor: c.bgSecondary, borderTopColor: c.border, justifyContent: 'center', paddingVertical: 16 }]}
          onPress={() => requireAuth()}
        >
          <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center' }}>{t('write_comment')}</Text>
        </TouchableOpacity>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  commentsSection: { paddingHorizontal: 16, paddingTop: 16 },
  commentsTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  commentInputArea: { borderTopWidth: 1, paddingBottom: 30 },
  mediaPreviewRow: { paddingHorizontal: 12, paddingTop: 10 },
  mediaPreview: { width: 72, height: 72, borderRadius: 10 },
  mediaRemove: { position: 'absolute', top: 14, left: 60, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  addMediaBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
