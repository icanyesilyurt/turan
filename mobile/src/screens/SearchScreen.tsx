import React, { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import { demoUsers } from '../data/demo'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const popularTopics = [
  { id: '1', tag: '#TurkDunyasi', count: '2.4K' },
  { id: '2', tag: '#OrhunYazitlari', count: '1.8K' },
  { id: '3', tag: '#Nevruz', count: '3.1K' },
  { id: '4', tag: '#TurkDilleri', count: '956' },
  { id: '5', tag: '#IpekYolu', count: '1.2K' },
]

export default function SearchScreen({ navigation }: any) {
  const { t, theme, allPosts } = useApp()
  const c = getTheme(theme)
  const [query, setQuery] = useState('')

  const filteredUsers = query.trim()
    ? demoUsers.filter(u =>
        u.display_name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const filteredPosts = query.trim()
    ? allPosts.filter(p => p.text.toLowerCase().includes(query.toLowerCase()))
    : []

  const hasResults = filteredUsers.length > 0 || filteredPosts.length > 0

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <View style={[styles.searchBar, { backgroundColor: c.bgInput }]}>
          <Text style={{ color: c.textMuted, fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={c.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: c.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!query.trim() ? (
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('search_popular')}</Text>
          {popularTopics.map(topic => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicItem, { borderBottomColor: c.border }]}
              onPress={() => setQuery(topic.tag)}
            >
              <Text style={[styles.topicTag, { color: c.text }]}>{topic.tag}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{topic.count} post</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : hasResults ? (
        <FlatList
          data={[
            ...(filteredUsers.length > 0 ? [{ type: 'header', id: 'uh', text: t('search_users') }] : []),
            ...filteredUsers.map(u => ({ type: 'user' as const, id: u.id, user: u })),
            ...(filteredPosts.length > 0 ? [{ type: 'header', id: 'ph', text: t('search_posts') }] : []),
            ...filteredPosts.map(p => ({ type: 'post' as const, id: p.id, post: p })),
          ] as any[]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={[styles.resultHeader, { color: c.textMuted }]}>{item.text}</Text>
              )
            }
            if (item.type === 'user') {
              return (
                <TouchableOpacity
                  style={[styles.userItem, { borderBottomColor: c.border }]}
                  onPress={() => navigation.navigate('Profile', { userId: item.user.id })}
                >
                  <View style={[styles.userAvatar, { backgroundColor: colors.teal }]}>
                    <Text style={styles.userAvatarText}>{getInitials(item.user.display_name)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.userName, { color: c.text }]}>{item.user.display_name}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 13 }}>@{item.user.username}</Text>
                  </View>
                </TouchableOpacity>
              )
            }
            return (
              <PostCard
                post={item.post}
                onPress={() => navigation.navigate('PostDetail', { postId: item.post.id })}
              />
            )
          }}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('no_content')}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 14, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, height: 40 },
  popularSection: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  topicItem: { paddingVertical: 14, borderBottomWidth: 1 },
  topicTag: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  resultHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, padding: 16, paddingBottom: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
})
