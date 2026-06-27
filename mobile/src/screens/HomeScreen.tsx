import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, RefreshControl, ScrollView, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, Animated,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getOfficialPosts, getFollowingPosts, getExplorePosts } from '../services/postService'
import { getUserCommentInteractions } from '../services/interactionService'
import { FeedItem } from '../types'
import PostCard from '../components/PostCard'
import CommentCard from '../components/CommentCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

type HomeTab = 'turan' | 'following' | 'explore'
const TAB_KEYS: HomeTab[] = ['turan', 'following', 'explore']
const SCREEN_WIDTH = Dimensions.get('window').width
const HEADER_HEIGHT = 134

export default function HomeScreen({ navigation, onOpenDrawer }: any) {
  const { t, theme, user, postsVersion, setTabBarVisible, setFabVisible } = useApp()
  const { profile: currentProfile } = useAuth()
  const c = getTheme(theme)

  const [activeTab, setActiveTab] = useState<HomeTab>('turan')
  const [feeds, setFeeds] = useState<Record<HomeTab, FeedItem[]>>({
    turan: [], following: [], explore: [],
  })
  const [tabLoading, setTabLoading] = useState<Record<HomeTab, boolean>>({
    turan: true, following: false, explore: false,
  })
  const loadedRef = useRef(new Set<HomeTab>())
  const [refreshing, setRefreshing] = useState(false)

  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([])
  const [repostedCommentIds, setRepostedCommentIds] = useState<string[]>([])
  const [savedCommentIds, setSavedCommentIds] = useState<string[]>([])

  const pagerRef = useRef<ScrollView>(null)
  const flatListRefs = useRef<Record<string, FlatList<any> | null>>({})
  const lastScrollY = useRef(0)
  const activeTabRef = useRef<HomeTab>('turan')
  const headerTranslateY = useRef(new Animated.Value(0)).current
  const headerVisible = useRef(true)

  const loadFeed = useCallback(async (tab: HomeTab, isRefresh = false) => {
    if (!isRefresh) setTabLoading(prev => ({ ...prev, [tab]: true }))
    try {
      let items: FeedItem[]
      if (tab === 'turan') {
        const data = await getOfficialPosts()
        items = data.map(p => ({ type: 'post' as const, data: p, sortDate: p.created_at }))
      } else if (tab === 'following') {
        if (!currentProfile) {
          setTabLoading(prev => ({ ...prev, [tab]: false }))
          setRefreshing(false)
          return
        }
        items = await getFollowingPosts(currentProfile.id)
      } else {
        const data = await getExplorePosts()
        items = data.map(p => ({ type: 'post' as const, data: p, sortDate: p.created_at }))
      }
      setFeeds(prev => ({ ...prev, [tab]: items }))
      loadedRef.current.add(tab)
    } catch (err) {
      console.warn('[HomeScreen] load error:', err)
    }
    setTabLoading(prev => ({ ...prev, [tab]: false }))
    setRefreshing(false)
  }, [currentProfile?.id])

  useEffect(() => { loadFeed('turan') }, [])

  useEffect(() => {
    loadFeed(activeTabRef.current, true)
    TAB_KEYS.forEach(tab => {
      if (tab !== activeTabRef.current) loadedRef.current.delete(tab)
    })
  }, [postsVersion])

  useEffect(() => {
    if (currentProfile) {
      getUserCommentInteractions(currentProfile.id)
        .then(ci => {
          setLikedCommentIds(ci.likedCommentIds)
          setRepostedCommentIds(ci.repostedCommentIds)
          setSavedCommentIds(ci.savedCommentIds)
        })
        .catch(() => {})
    }
  }, [currentProfile?.id])

  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      setTabBarVisible(true)
      setFabVisible(false)
    })
    const unsubFocus = navigation.addListener('focus', () => {
      setTabBarVisible(true)
      lastScrollY.current = 0
      setFabVisible(activeTabRef.current !== 'explore')
      headerVisible.current = true
      headerTranslateY.setValue(0)
    })
    return () => { unsubBlur(); unsubFocus() }
  }, [navigation, setTabBarVisible, setFabVisible])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadFeed(activeTabRef.current, true)
  }, [loadFeed])

  const handlePageChange = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    const newTab = TAB_KEYS[index]
    if (newTab && newTab !== activeTabRef.current) {
      activeTabRef.current = newTab
      setActiveTab(newTab)
      setFabVisible(newTab !== 'explore')
      if (!loadedRef.current.has(newTab)) loadFeed(newTab)
    }
  }, [loadFeed, setFabVisible])

  const handleTabPress = useCallback((tab: HomeTab) => {
    const index = TAB_KEYS.indexOf(tab)
    if (tab === activeTabRef.current) {
      flatListRefs.current[tab]?.scrollToOffset({ offset: 0, animated: true })
      setTabBarVisible(true)
      headerVisible.current = true
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start()
    } else {
      activeTabRef.current = tab
      setActiveTab(tab)
      setFabVisible(tab !== 'explore')
      if (!loadedRef.current.has(tab)) loadFeed(tab)
      pagerRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
    }
  }, [loadFeed, setTabBarVisible, setFabVisible])

  const handleTitlePress = useCallback(() => {
    flatListRefs.current[activeTabRef.current]?.scrollToOffset({ offset: 0, animated: true })
    setTabBarVisible(true)
    headerVisible.current = true
    Animated.timing(headerTranslateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [setTabBarVisible, headerTranslateY])

  const handleVerticalScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y
    if (y > lastScrollY.current + 15 && y > 50) {
      setTabBarVisible(false)
      if (headerVisible.current) {
        headerVisible.current = false
        Animated.timing(headerTranslateY, {
          toValue: -HEADER_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start()
      }
    } else if (y < lastScrollY.current - 10) {
      setTabBarVisible(true)
      if (!headerVisible.current) {
        headerVisible.current = true
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start()
      }
    }
    lastScrollY.current = y
  }, [setTabBarVisible, headerTranslateY])

  const tabs = [
    { key: 'turan' as HomeTab, label: t('home_turan') },
    { key: 'following' as HomeTab, label: t('home_following') },
    { key: 'explore' as HomeTab, label: t('home_explore') },
  ]

  const renderFeedItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === 'comment_repost') {
      return (
        <CommentCard
          comment={item.data}
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
            setSavedCommentIds(prev => saved ? [...prev, id] : prev.filter(x => x !== id))
          }}
          onReplyAdded={() => {}}
          onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
          onPostPress={(postId) => navigation.navigate('PostDetail', { postId })}
          onPress={(commentId) => navigation.navigate('CommentDetail', { commentId })}
          contextLabel={item.data.reposted_by ? `🔄 ${item.data.reposted_by.display_name} yeniden paylaştı` : undefined}
        />
      )
    }
    return (
      <PostCard
        post={item.data}
        onPress={() => navigation.navigate('PostDetail', { postId: item.data.id })}
        onProfilePress={(userId) => navigation.navigate('Profile', { userId })}
      />
    )
  }, [likedCommentIds, repostedCommentIds, savedCommentIds, navigation])

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Animated.View style={[styles.header, {
        backgroundColor: c.bgSecondary,
        borderBottomColor: c.border,
        transform: [{ translateY: headerTranslateY }],
      }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onOpenDrawer}>
            {currentProfile?.avatar_url ? (
              <Image source={{ uri: currentProfile.avatar_url }} style={styles.headerAvatarImage} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.teal }]}>
                <Text style={styles.headerAvatarText}>
                  {user ? getInitials(user.display_name) : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTitlePress} activeOpacity={0.7}>
            <Text style={[styles.headerTitle, { color: c.text }]}>TURAN</Text>
          </TouchableOpacity>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.key)}
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
      </Animated.View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        scrollEventThrottle={16}
        bounces={false}
        alwaysBounceHorizontal={false}
        overScrollMode="never"
        style={{ flex: 1 }}
      >
        {TAB_KEYS.map(tab => (
          <View key={tab} style={{ width: SCREEN_WIDTH, backgroundColor: c.bg }}>
            {tabLoading[tab] && feeds[tab].length === 0 ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={colors.teal} />
              </View>
            ) : (
              <FlatList
                ref={ref => { flatListRefs.current[tab] = ref }}
                data={feeds[tab]}
                keyExtractor={item => `${item.type}-${item.data.id}`}
                renderItem={renderFeedItem}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                onScroll={handleVerticalScroll}
                scrollEventThrottle={16}
                nestedScrollEnabled
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing && tab === activeTab}
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
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 50, borderBottomWidth: StyleSheet.hairlineWidth },
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
