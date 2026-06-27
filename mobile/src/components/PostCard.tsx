import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { CommunityPost } from '../types'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { deletePost, pinPost, unpinPost } from '../services/postService'
import { isFollowing, followUser, unfollowUser, createFollowNotification } from '../services/profileService'

interface Props {
  post: CommunityPost
  onPress?: () => void
  onDeleted?: () => void
  onProfilePress?: (userId: string) => void
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

export default function PostCard({ post, onPress, onDeleted, onProfilePress }: Props) {
  const {
    theme,
    isLoggedIn,
    likedPostIds,
    repostedPostIds,
    savedPostIds,
    toggleLikePost,
    toggleSavePost,
    repostPost,
    unrepostPost,
    incrementPostsVersion,
    t,
  } = useApp()
  const { profile, requireAuth } = useAuth()
  const c = getTheme(theme)

  const isLiked = likedPostIds.includes(post.id)
  const isReposted = repostedPostIds.includes(post.id)
  const isSaved = savedPostIds.includes(post.id)
  const isOwner = !!profile && post.user_id === profile.id
  const isPinned = !!post.pinned_at

  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [repostsCount, setRepostsCount] = useState(post.reposts_count)

  useEffect(() => {
    setLikesCount(post.likes_count)
    setRepostsCount(post.reposts_count)
  }, [post.likes_count, post.reposts_count])

  const handleProfileTap = () => {
    if (!post.user_id) return
    if (!isLoggedIn) { requireAuth(); return }
    onProfilePress?.(post.user_id)
  }

  const handleLike = async () => {
    if (!isLoggedIn) { requireAuth(); return }
    try {
      const result = await toggleLikePost(post.id)
      setLikesCount(result.count)
    } catch {}
  }

  const handleRepost = () => {
    if (!isLoggedIn) { requireAuth(); return }

    if (isReposted) {
      Alert.alert(
        undefined as any,
        undefined,
        [
          {
            text: t('repost_undo'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await unrepostPost(post.id)
                setRepostsCount(result.count)
              } catch {}
            },
          },
          {
            text: t('repost_quote'),
            onPress: () => Alert.alert(t('coming_soon')),
          },
          { text: t('cancel'), style: 'cancel' },
        ],
      )
    } else {
      Alert.alert(
        undefined as any,
        undefined,
        [
          {
            text: t('repost_send'),
            onPress: async () => {
              try {
                const result = await repostPost(post.id)
                setRepostsCount(result.count)
              } catch {}
            },
          },
          {
            text: t('repost_quote'),
            onPress: () => Alert.alert(t('coming_soon')),
          },
          { text: t('cancel'), style: 'cancel' },
        ],
      )
    }
  }

  const handleSave = async () => {
    if (!isLoggedIn) { requireAuth(); return }
    try {
      await toggleSavePost(post.id)
    } catch {}
  }

  const handleMoreMenu = async () => {
    if (isOwner) {
      Alert.alert(
        undefined as any,
        undefined,
        [
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
                        await deletePost(post.id)
                        incrementPostsVersion()
                        onDeleted?.()
                      } catch {}
                    },
                  },
                ],
              )
            },
          },
          {
            text: isPinned ? t('post_unpin') : t('post_pin'),
            onPress: async () => {
              try {
                if (isPinned) {
                  await unpinPost(post.id, profile!.id)
                } else {
                  await pinPost(post.id, profile!.id)
                }
                incrementPostsVersion()
              } catch {}
            },
          },
          { text: t('cancel'), style: 'cancel' },
        ],
      )
    } else {
      if (!isLoggedIn) {
        requireAuth()
        return
      }

      let following = false
      try {
        following = await isFollowing(post.user_id)
      } catch {}

      Alert.alert(
        undefined as any,
        undefined,
        [
          {
            text: following ? t('unfollow') : t('follow'),
            onPress: async () => {
              try {
                if (following) {
                  await unfollowUser(post.user_id)
                } else {
                  await followUser(post.user_id)
                  if (profile) {
                    createFollowNotification(profile.id, post.user_id, profile.username).catch(() => {})
                  }
                }
              } catch {}
            },
          },
          {
            text: t('post_report'),
            onPress: () => Alert.alert(t('coming_soon')),
          },
          { text: t('cancel'), style: 'cancel' },
        ],
      )
    }
  }

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: c.border }]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      {post.reposted_by && (
        <View style={styles.repostHeader}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            🔄 {post.reposted_by.display_name} yeniden paylaştı
          </Text>
        </View>
      )}
      {isPinned && !post.reposted_by && (
        <View style={styles.repostHeader}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>
            📌 {t('post_pinned')}
          </Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleProfileTap}>
          {post.user?.avatar_url ? (
            <Image source={{ uri: post.user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
              <Text style={styles.avatarText}>
                {post.user ? getInitials(post.user.display_name) : '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfo} activeOpacity={0.7} onPress={handleProfileTap}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: c.text }]}>{post.user?.display_name}</Text>
            {post.is_official && (
              <View style={[styles.officialBadge, { backgroundColor: colors.tealGlow }]}>
                <Text style={{ color: colors.teal, fontSize: 10, fontWeight: '700' }}>✓</Text>
              </View>
            )}
          </View>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            @{post.user?.username} · {timeAgo(post.created_at)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} onPress={handleMoreMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: c.textMuted, fontSize: 18, fontWeight: '700' }}>···</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.text, { color: c.text }]}>{post.text}</Text>

      {post.quoted_post && (
        <View style={[styles.quotedPost, { borderColor: c.border, backgroundColor: c.bg }]}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.textSecondary }}>
            {post.quoted_post.user?.display_name}
          </Text>
          <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>
            {post.quoted_post.text.slice(0, 100)}...
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => {
            if (!isLoggedIn) { requireAuth(); return }
            onPress?.()
          }}
        >
          <Text style={[styles.actionIcon, { color: c.textMuted }]}>💬</Text>
          <Text style={[styles.actionCount, { color: c.textMuted }]}>{post.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleRepost}>
          <Text style={[styles.actionIcon, { color: isReposted ? colors.teal : c.textMuted }]}>🔄</Text>
          <Text style={[styles.actionCount, { color: isReposted ? colors.teal : c.textMuted }]}>{repostsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Text style={[styles.actionIcon, { color: isLiked ? colors.teal : c.textMuted }]}>
            {isLiked ? '❤' : '♡'}
          </Text>
          <Text style={[styles.actionCount, { color: isLiked ? colors.teal : c.textMuted }]}>{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={handleSave}>
          <Text style={[styles.actionIcon, { color: isSaved ? colors.teal : c.textMuted }]}>
            {isSaved ? '🔖' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  repostHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 56 },
  header: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { fontSize: 15, fontWeight: '600' },
  officialBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  moreBtn: { paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  quotedPost: { marginTop: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 0, paddingHorizontal: 4 },
  action: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, gap: 6, borderRadius: 20, minHeight: 36 },
  actionIcon: { fontSize: 15 },
  actionCount: { fontSize: 13 },
})
