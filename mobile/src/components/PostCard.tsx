import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { CommunityPost } from '../types'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'

interface Props {
  post: CommunityPost
  onPress?: () => void
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

export default function PostCard({ post, onPress }: Props) {
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
    t,
  } = useApp()
  const { requireAuth } = useAuth()
  const c = getTheme(theme)

  const isLiked = likedPostIds.includes(post.id)
  const isReposted = repostedPostIds.includes(post.id)
  const isSaved = savedPostIds.includes(post.id)

  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [repostsCount, setRepostsCount] = useState(post.reposts_count)

  useEffect(() => {
    setLikesCount(post.likes_count)
    setRepostsCount(post.reposts_count)
  }, [post.likes_count, post.reposts_count])

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
      <View style={styles.header}>
        {post.user?.avatar_url ? (
          <Image source={{ uri: post.user.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
            <Text style={styles.avatarText}>
              {post.user ? getInitials(post.user.display_name) : '?'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
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
        </View>
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
            onPress?.()
          }}
        >
          <Text style={{ color: c.textMuted, fontSize: 13 }}>💬 {post.comments_count}</Text>
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
  repostHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 56 },
  header: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { fontSize: 15, fontWeight: '600' },
  officialBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  quotedPost: { marginTop: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 10, borderTopWidth: 0.5 },
  action: { paddingVertical: 4, paddingHorizontal: 8 },
})
