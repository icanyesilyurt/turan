import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import PostCard from '../components/PostCard'

export default function FeedScreen({ navigation }: any) {
  const { t, theme, officialPosts = [], followingPosts = [], explorePosts = [] } = useApp()
  const c = getTheme(theme)

  const allFeed = [
    ...officialPosts,
    ...followingPosts,
    ...explorePosts,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: colors.teal }]}>TURAN</Text>
      </View>

      <FlatList
        data={allFeed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('no_posts')}</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  emptyState: { alignItems: 'center', padding: 40 },
})
