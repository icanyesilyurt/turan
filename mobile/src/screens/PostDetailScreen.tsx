import React, { useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function PostDetailScreen({ route, navigation }: any) {
  const { postId } = route.params
  const { t, theme, user, isLoggedIn, allPosts = [], comments, setComments } = useApp()
  const c = getTheme(theme)
  const [commentText, setCommentText] = useState('')

  const post = allPosts.find(p => p.id === postId)
  const postComments = (comments || []).filter(cm => cm.post_id === postId)

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: c.textMuted }}>{t('no_posts')}</Text>
        </View>
      </View>
    )
  }

  const canComment = isLoggedIn && user && (user.membership_status === 'member' || user.membership_status === 'admin')

  const handleComment = () => {
    if (!commentText.trim() || !user) return
    setComments(prev => [...prev, {
      id: `cm${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      user,
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    }])
    setCommentText('')
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <PostCard post={post} />

        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: c.text }]}>
            {t('comments_title')} ({postComments.length})
          </Text>

          {postComments.map(cm => (
            <View key={cm.id} style={[styles.commentItem, { borderBottomColor: c.border }]}>
              <View style={[styles.commentAvatar, { backgroundColor: colors.teal }]}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                  {cm.user ? getInitials(cm.user.display_name) : '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                  {cm.user?.display_name}
                  <Text style={{ fontWeight: '400', color: c.textMuted }}> @{cm.user?.username}</Text>
                </Text>
                <Text style={{ fontSize: 14, color: c.text, marginTop: 4, lineHeight: 20 }}>{cm.text}</Text>
              </View>
            </View>
          ))}

          {postComments.length === 0 && (
            <Text style={{ color: c.textMuted, fontSize: 14, textAlign: 'center', padding: 20 }}>
              {t('no_posts')}
            </Text>
          )}
        </View>
      </ScrollView>

      {canComment && (
        <View style={[styles.commentInput, { backgroundColor: c.bgSecondary, borderTopColor: c.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: c.bgInput, color: c.text }]}
            placeholder={t('write_comment')}
            placeholderTextColor={c.textMuted}
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.teal : c.bgInput }]}
            onPress={handleComment}
            disabled={!commentText.trim()}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  commentsSection: { padding: 16 },
  commentsTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  commentItem: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  commentInput: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderTopWidth: 1, paddingBottom: 30 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
