import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getOfficialPosts, getFollowingPosts, getExplorePosts } from '../services/postService'
import { CommunityPost } from '../types'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

type HomeTab = 'turan' | 'following' | 'explore'

export default function HomeScreen({ navigation, onOpenDrawer }: any) {
  const { t, theme, user, postsVersion } = useApp()
  const { profile: currentProfile } = useAuth()
  const c = getTheme(theme)
  const [activeTab, setActiveTab] = useState<HomeTab>('turan')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadPosts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      let data: CommunityPost[]
      if (activeTab === 'turan') {
        data = await getOfficialPosts()
      } else if (activeTab === 'following') {
        if (!currentProfile) { setPosts([]); setLoading(false); return }
        data = await getFollowingPosts(currentProfile.id)
      } else {
        data = await getExplorePosts()
      }
      setPosts(data)
    } catch (err) {
      console.warn('[HomeScreen] load error:', err)
      setPosts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, currentProfile?.id])

  useEffect(() => { loadPosts() }, [loadPosts, postsVersion])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadPosts(false)
  }, [loadPosts])

  const tabs: { key: HomeTab; label: string }[] = [
    { key: 'turan', label: t('home_turan') },
    { key: 'following', label: t('home_following') },
    { key: 'explore', label: t('home_explore') },
  ]

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer}>
            {currentProfile?.avatar_url ? (
              <Image
                source={{ uri: currentProfile.avatar_url }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.teal }]}>
                <Text style={styles.headerAvatarText}>
                  {user ? getInitials(user.display_name) : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.text }]}>TURAN</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.teal : c.textMuted },
              ]}>
                {tab.label}
              </Text>
              {activeTab === tab.key && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.teal}
              colors={[colors.teal]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('no_posts')}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerAvatarImage: { width: 32, height: 32, borderRadius: 16, resizeMode: 'cover' },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  tabBar: { flexDirection: 'row' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 40, height: 3, borderRadius: 2, backgroundColor: colors.teal },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyState: { alignItems: 'center', padding: 60 },
})
