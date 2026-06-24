import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { getTheme } from '../styles/theme'
import PostCard from '../components/PostCard'

export default function SavedScreen({ navigation }: any) {
  const { t, theme, allPosts = [], savedPostIds = [] } = useApp()
  const c = getTheme(theme)

  const savedPosts = allPosts.filter(x => savedPostIds.includes(x.id))

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('saved_title')}</Text>
      </View>

      {savedPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔖</Text>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('saved_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            />
          )}
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
