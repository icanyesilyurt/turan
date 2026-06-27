import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { CommunityComment } from '../types'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import {
  toggleCommentLike,
  repostComment,
  unrepostComment,
  toggleCommentSave,
  deleteComment,
  createCommentNotification,
} from '../services/interactionService'

interface Props {
  comment: CommunityComment
  likedIds: string[]
  repostedIds: string[]
  savedIds: string[]
  onToggleLike: (id: string, result: { liked: boolean; count: number }) => void
  onToggleRepost: (id: string, reposted: boolean, count: number) => void
  onToggleSave: (id: string, saved: boolean) => void
  onReplyAdded: (reply: CommunityComment) => void
  onDeleted?: (id: string) => void
  onProfilePress?: (userId: string) => void
  onPostPress?: (postId: string) => void
  onPress?: (commentId: string) => void
  contextLabel?: string
  isReply?: boolean
}

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

export default function CommentCard({
  comment,
  likedIds,
  repostedIds,
  savedIds,
  onToggleLike,
  onToggleRepost,
  onToggleSave,
  onDeleted,
  onProfilePress,
  onPostPress,
  onPress,
  contextLabel,
  isReply,
}: Props) {
  const { theme, isLoggedIn, t } = useApp()
  const { profile, requireAuth } = useAuth()
  const c = getTheme(theme)

  const isLiked = likedIds.includes(comment.id)
  const isReposted = repostedIds.includes(comment.id)
  const isSaved = savedIds.includes(comment.id)
  const isOwner = !!profile && comment.user_id === profile.id

  const [likesCount, setLikesCount] = useState(comment.likes_count)
  const [repostsCount, setRepostsCount] = useState(comment.reposts_count)

  useEffect(() => {
    setLikesCount(comment.likes_count)
    setRepostsCount(comment.reposts_count)
  }, [comment.likes_count, comment.reposts_count])

  const handleProfileTap = () => {
    if (!comment.user_id) return
    if (!isLoggedIn) { requireAuth(); return }
    onProfilePress?.(comment.user_id)
  }

  const handleLike = async () => {
    if (!isLoggedIn) { requireAuth(); return }
    if (!profile) return
    try {
      const result = await toggleCommentLike(comment.id, profile.id)
      setLikesCount(result.count)
      onToggleLike(comment.id, result)
      if (result.liked) {
        createCommentNotification('comment_like', profile.id, comment.id, comment.post_id, profile.username).catch(() => {})
      }
    } catch (err: any) {
      console.error('[CommentCard] handleLike ERROR', err)
      Alert.alert('Hata', err?.message || 'Beğeni kaydedilemedi')
    }
  }

  const handleRepost = () => {
    if (!isLoggedIn) { requireAuth(); return }
    if (!profile) return

    if (isReposted) {
      Alert.alert(undefined as any, undefined, [
        {
          text: t('repost_undo'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await unrepostComment(comment.id, profile.id)
              setRepostsCount(result.count)
              onToggleRepost(comment.id, false, result.count)
            } catch (err: any) {
              console.error('[CommentCard] unrepost ERROR', err)
            }
          },
        },
        { text: t('cancel'), style: 'cancel' },
      ])
    } else {
      Alert.alert(undefined as any, undefined, [
        {
          text: t('repost_send'),
          onPress: async () => {
            try {
              const result = await repostComment(comment.id, profile.id)
              setRepostsCount(result.count)
              onToggleRepost(comment.id, true, result.count)
              createCommentNotification('comment_repost', profile.id, comment.id, comment.post_id, profile.username).catch(() => {})
            } catch (err: any) {
              console.error('[CommentCard] repost ERROR', err)
            }
          },
        },
        { text: t('cancel'), style: 'cancel' },
      ])
    }
  }

  const handleSave = async () => {
    if (!isLoggedIn) { requireAuth(); return }
    if (!profile) return
    try {
      const result = await toggleCommentSave(comment.id, profile.id)
      onToggleSave(comment.id, result.saved)
    } catch (err: any) {
      console.error('[CommentCard] handleSave ERROR', err)
      Alert.alert('Hata', err?.message || 'Kaydetme başarısız')
    }
  }

  const handleMoreMenu = () => {
    if (isOwner) {
      Alert.alert(undefined as any, undefined, [
        {
          text: t('post_delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('post_delete_confirm_title'),
              t('post_delete_confirm_message'),
              [
                { text: t('cancel'), style: 'cancel' },
                {
                  text: t('post_delete'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteComment(comment.id)
                      onDeleted?.(comment.id)
                    } catch (err: any) {
                      console.error('[CommentCard] delete ERROR', err)
                      Alert.alert('Hata', err?.message || 'Silinemedi')
                    }
                  },
                },
              ],
            )
          },
        },
        { text: t('cancel'), style: 'cancel' },
      ])
    } else {
      Alert.alert(undefined as any, undefined, [
        {
          text: t('post_report'),
          onPress: () => Alert.alert(t('coming_soon')),
        },
        { text: t('cancel'), style: 'cancel' },
      ])
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: c.border }]}
      activeOpacity={0.8}
      onPress={() => onPress?.(comment.id)}
      disabled={!onPress}
    >
      {contextLabel && (
        <TouchableOpacity
          style={styles.contextRow}
          activeOpacity={0.7}
          onPress={() => onPostPress?.(comment.post_id)}
        >
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{contextLabel}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleProfileTap}>
          {comment.user?.avatar_url ? (
            <Image
              source={{ uri: comment.user.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
              <Text style={styles.avatarText}>
                {comment.user ? getInitials(comment.user.display_name) : '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.userInfo} activeOpacity={0.7} onPress={handleProfileTap}>
          <Text style={[styles.displayName, { color: c.text }]}>{comment.user?.display_name}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            @{comment.user?.username} · {timeAgo(comment.created_at)}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerSpacer} />

        <TouchableOpacity style={styles.moreBtn} onPress={handleMoreMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 18, fontWeight: '700' }}>···</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text style={[styles.text, { color: c.text }]}>{comment.text}</Text>

        {comment.image_url && (
          <Image
            source={{ uri: comment.image_url }}
            style={[styles.commentImage, { borderColor: c.border }]}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={[styles.actions, { borderTopColor: c.border }]}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Text style={{ color: isLiked ? colors.red : c.textMuted, fontSize: 13 }}>
            {isLiked ? '❤' : '♡'} {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.action}
          onPress={() => {
            if (!isLoggedIn) { requireAuth(); return }
            onPress?.(comment.id)
          }}
        >
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            💬 {comment.replies_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleRepost}>
          <Text style={{ color: isReposted ? colors.teal : c.textMuted, fontSize: 13 }}>
            🔄 {repostsCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleSave}>
          <Text style={{ color: isSaved ? colors.teal : c.textMuted, fontSize: 13 }}>
            {isSaved ? '🔖' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, borderBottomWidth: 1 },
  contextRow: { marginBottom: 8, paddingLeft: 56 },
  header: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  userInfo: {},
  headerSpacer: { flex: 1 },
  displayName: { fontSize: 15, fontWeight: '600' },
  moreBtn: { paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  commentImage: { width: '100%', height: undefined, aspectRatio: 16 / 9, borderRadius: 12, marginTop: 10, borderWidth: 1 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  action: { paddingVertical: 4, paddingHorizontal: 8 },
})
