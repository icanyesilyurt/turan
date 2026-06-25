import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getPostById } from '../services/postService'
import { getPostComments, addComment, createInteractionNotification } from '../services/interactionService'
import { CommunityPost, CommunityComment } from '../types'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params
  const { t, theme, isLoggedIn } = useApp()
  const { profile, requireAuth } = useAuth()
  const c = getTheme(theme)
  const [commentText, setCommentText] = useState('')
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [postComments, setPostComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getPostById(postId), getPostComments(postId)])
      .then(([postData, commentsData]) => {
        if (active) {
          setPost(postData)
          setPostComments(commentsData)
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [postId])

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
          <Text style={{ color: c.textMuted }}>{t('no_posts')}</Text>
        </View>
      </View>
    )
  }

  const canComment = isLoggedIn && !!profile

  const handleComment = async () => {
    if (!commentText.trim() || !profile) return
    setSending(true)
    try {
      const newComment = await addComment(postId, profile.id, commentText.trim())
      setPostComments(prev => [...prev, newComment])
      setCommentText('')
      const freshPost = await getPostById(postId)
      if (freshPost) setPost(freshPost)
      createInteractionNotification('comment', profile.id, postId, profile.username).catch(() => {})
    } catch {}
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
        <PostCard post={post} />

        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: c.text }]}>
            {t('comments_title')} ({postComments.length})
          </Text>

          {postComments.map(cm => {
            const goToCommentUser = () => {
              if (!cm.user) return
              if (!isLoggedIn) { requireAuth(); return }
              navigation.navigate('Profile', { userId: cm.user_id })
            }

            return (
              <View key={cm.id} style={[styles.commentItem, { borderBottomColor: c.border }]}>
                <TouchableOpacity activeOpacity={0.7} onPress={goToCommentUser}>
                  {cm.user?.avatar_url ? (
                    <Image source={{ uri: cm.user.avatar_url }} style={styles.commentAvatarImg} />
                  ) : (
                    <View style={[styles.commentAvatar, { backgroundColor: colors.teal }]}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                        {cm.user ? getInitials(cm.user.display_name) : '?'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity activeOpacity={0.7} onPress={goToCommentUser} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                      {cm.user?.display_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted }}>
                      @{cm.user?.username} · {timeAgo(cm.created_at)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 14, color: c.text, marginTop: 4, lineHeight: 20 }}>{cm.text}</Text>
                </View>
              </View>
            )
          })}

          {postComments.length === 0 && (
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 20 }}>
              {t('no_comments')}
            </Text>
          )}
        </View>
      </ScrollView>

      {canComment ? (
        <View style={[styles.commentInput, { backgroundColor: c.bgSecondary, borderTopColor: c.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: c.bgInput, color: c.text }]}
            placeholder={t('write_comment')}
            placeholderTextColor={c.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: commentText.trim() && !sending ? colors.teal : c.bgInput }]}
            onPress={handleComment}
            disabled={!commentText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : !isLoggedIn ? (
        <TouchableOpacity
          style={[styles.commentInput, { backgroundColor: c.bgSecondary, borderTopColor: c.border, justifyContent: 'center' }]}
          onPress={() => requireAuth()}
        >
          <Text style={{ color: c.textMuted, fontSize: 14 }}>{t('write_comment')}</Text>
        </TouchableOpacity>
      ) : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  commentItem: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  commentAvatarImg: { width: 34, height: 34, borderRadius: 17, resizeMode: 'cover' },
  commentInput: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderTopWidth: 1, paddingBottom: 30 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
