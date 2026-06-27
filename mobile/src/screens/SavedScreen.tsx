import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getTheme, colors } from '../styles/theme'
import { getPostsByIds } from '../services/postService'
import {
  getSavedCommentIds,
  getCommentsByIds,
  getUserCommentInteractions,
} from '../services/interactionService'
import { CommunityPost, CommunityComment } from '../types'
import PostCard from '../components/PostCard'
import CommentCard from '../components/CommentCard'

export default function SavedScreen({ navigation }: any) {
  const { t, theme, savedPostIds = [] } = useApp()
  const { profile } = useAuth()
  const c = getTheme(theme)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([])
  const [repostedCommentIds, setRepostedCommentIds] = useState<string[]>([])
  const [savedCommentIds, setSavedCommentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    const loadData = async () => {
      const [postsData, commentIds] = await Promise.all([
        savedPostIds.length > 0 ? getPostsByIds(savedPostIds) : Promise.resolve([]),
        profile ? getSavedCommentIds(profile.id) : Promise.resolve([]),
      ])

      const [commentsData, interactions] = await Promise.all([
        commentIds.length > 0 ? getCommentsByIds(commentIds) : Promise.resolve([]),
        profile ? getUserCommentInteractions(profile.id) : Promise.resolve({ likedCommentIds: [], repostedCommentIds: [], savedCommentIds: [] }),
      ])

      if (active) {
        setPosts(postsData)
        setComments(commentsData)
        setLikedCommentIds(interactions.likedCommentIds)
        setRepostedCommentIds(interactions.repostedCommentIds)
        setSavedCommentIds(interactions.savedCommentIds)
      }
    }

    loadData()
      .catch(() => { setPosts([]); setComments([]) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [savedPostIds, profile?.id])

  const handleCommentUnsaved = (id: string) => {
    setComments(prev => prev.filter(cm => cm.id !== id))
    setSavedCommentIds(prev => prev.filter(x => x !== id))
  }

  const data: { type: 'post' | 'comment'; item: any }[] = [
    ...posts.map(p => ({ type: 'post' as const, item: p })),
    ...comments.map(c => ({ type: 'comment' as const, item: c })),
  ]

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('saved_title')}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔖</Text>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('saved_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(d) => `${d.type}-${d.item.id}`}
          renderItem={({ item: d }) => {
            if (d.type === 'post') {
              return (
                <PostCard
                  post={d.item}
                  onPress={() => navigation.navigate('PostDetail', { postId: d.item.id })}
                  onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
                />
              )
            }
            return (
              <CommentCard
                comment={d.item}
                likedIds={likedCommentIds}
                repostedIds={repostedCommentIds}
                savedIds={savedCommentIds}
                onToggleLike={(id, result) => {
                  setLikedCommentIds(prev => result.liked ? [...prev, id] : prev.filter(x => x !== id))
                }}
                onToggleRepost={(id, reposted) => {
                  setRepostedCommentIds(prev => reposted ? [...prev, id] : prev.filter(x => x !== id))
                }}
                onToggleSave={(id, saved) => {
                  if (!saved) handleCommentUnsaved(id)
                  else setSavedCommentIds(prev => [...prev, id])
                }}
                onReplyAdded={() => {}}
                onDeleted={(id) => setComments(prev => prev.filter(cm => cm.id !== id))}
                onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
                onPostPress={(postId) => navigation.navigate('PostDetail', { postId })}
                onPress={(commentId) => navigation.navigate('CommentDetail', { commentId })}
                contextLabel={'🔖 ' + t('replied_to_post')}
              />
            )
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
})
