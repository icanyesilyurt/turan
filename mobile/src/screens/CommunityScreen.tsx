import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import PostCard from '../components/PostCard'

export default function CommunityScreen({ navigation }: any) {
  const { t, theme, user, isLoggedIn, followingPosts = [], explorePosts = [], addPost } = useApp()
  const c = getTheme(theme)
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')

  const canPost = isLoggedIn && user && (user.membership_status === 'member' || user.membership_status === 'admin')

  const communityFeed = [...followingPosts, ...explorePosts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handlePost = () => {
    if (!text.trim()) return
    addPost(text)
    setText('')
    setComposing(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('home_explore')}</Text>
      </View>

      {canPost && !composing && (
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.teal }]}
          onPress={() => setComposing(true)}
        >
          <Text style={styles.composeBtnText}>✏ {t('compose_publish')}</Text>
        </TouchableOpacity>
      )}

      {composing && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.composeBox, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            <TextInput
              style={[styles.composeInput, { color: c.text }]}
              placeholder={t('compose_placeholder')}
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />
            <View style={styles.composeActions}>
              <TouchableOpacity onPress={() => { setComposing(false); setText('') }}>
                <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.teal : c.bgInput }]}
                onPress={handlePost}
                disabled={!text.trim()}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('compose_publish')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {!isLoggedIn && (
        <View style={[styles.upgradeBox, { backgroundColor: colors.tealGlow }]}>
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 10 }}>
            {t('upgrade_prompt')}
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.teal }]}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={communityFeed}
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
          <View style={{ alignItems: 'center', padding: 40 }}>
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
  headerTitle: { fontSize: 22, fontWeight: '700' },
  composeBtn: { margin: 16, padding: 14, borderRadius: 14, alignItems: 'center' },
  composeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  composeBox: { margin: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  composeInput: { fontSize: 15, minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  sendBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  upgradeBox: { margin: 16, borderRadius: 14, padding: 20 },
  loginBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, alignSelf: 'center' },
})
