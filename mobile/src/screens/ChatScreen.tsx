import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Keyboard } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getMessages, sendMessage, getOrCreateConversation, markConversationRead } from '../services/messageService'
import { DirectMessage, User } from '../types'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId: initialConvId, otherUser, otherUserId } = route.params
  const { t, theme, refreshUnreadDmCount } = useApp()
  const { profile } = useAuth()
  const c = getTheme(theme)
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConvId ?? null)
  const flatListRef = useRef<FlatList>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false))
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  const displayName = otherUser?.display_name ?? ''

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false)
      return
    }
    try {
      const data = await getMessages(conversationId)
      setMessages(data)
      if (profile) {
        markConversationRead(conversationId, profile.id).then(() => refreshUnreadDmCount()).catch(() => {})
      }
    } catch {}
    setLoading(false)
  }, [conversationId, profile?.id])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (conversationId && profile) {
        markConversationRead(conversationId, profile.id)
          .then(() => refreshUnreadDmCount())
          .catch(() => {})
      }
    })
    return unsub
  }, [navigation, conversationId, profile?.id, refreshUnreadDmCount])

  useEffect(() => {
    if (!conversationId && !initialConvId && profile && otherUserId) {
      getOrCreateConversation(profile.id, otherUserId)
        .then(id => setConversationId(id))
        .catch(() => setLoading(false))
    }
  }, [profile?.id, otherUserId])

  const handleSend = async () => {
    if (!text.trim() || !profile) return
    const trimmed = text.trim()

    let convId = conversationId
    if (!convId) {
      if (!otherUserId) return
      try {
        convId = await getOrCreateConversation(profile.id, otherUserId)
        setConversationId(convId)
      } catch { return }
    }

    const optimistic: DirectMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: convId,
      from_user_id: profile.id,
      text: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100)

    setSending(true)
    try {
      const real = await sendMessage(convId, profile.id, trimmed)
      setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m))
    } catch (err: any) {
      console.error('[ChatScreen] sendMessage error:', err?.message ?? err)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    }
    setSending(false)
  }

  const isMine = (fromId: string) => fromId === profile?.id

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          const uid = otherUser?.id ?? otherUserId
          if (uid) navigation.navigate('Profile', { userId: uid })
        }}>
          <Text style={[styles.headerName, { color: c.text }]}>{displayName}</Text>
        </TouchableOpacity>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              isMine(item.from_user_id) ? styles.bubbleMine : styles.bubbleTheirs,
              {
                backgroundColor: isMine(item.from_user_id) ? colors.teal : c.bgCard,
              }
            ]}>
              <Text style={[
                styles.bubbleText,
                { color: isMine(item.from_user_id) ? '#fff' : c.text }
              ]}>
                {item.text}
              </Text>
              <Text style={[
                styles.bubbleTime,
                { color: isMine(item.from_user_id) ? 'rgba(255,255,255,0.6)' : c.textMuted }
              ]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>{t('messages_empty')}</Text>
            </View>
          }
        />
      )}

      <View style={[styles.inputBar, { backgroundColor: c.bgSecondary, borderTopColor: c.border, paddingBottom: keyboardVisible ? 12 : 95 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: c.bgInput, color: c.text }]}
          placeholder={t('messages_placeholder')}
          placeholderTextColor={c.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.teal : c.bgInput }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerName: { fontSize: 17, fontWeight: '600' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 8 },
  bubbleMine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1, paddingBottom: 95 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
