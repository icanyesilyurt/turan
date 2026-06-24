import React, { useState, useRef } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import { Conversation } from '../types'

export default function ChatScreen({ route, navigation }: any) {
  const conversation: Conversation = route.params.conversation
  const { t, theme, user, messages, setMessages } = useApp()
  const c = getTheme(theme)
  const [text, setText] = useState('')
  const flatListRef = useRef<FlatList>(null)

  const chatMessages = messages
    .filter(m =>
      (m.from_user_id === user?.id && m.to_user_id === conversation.other_user.id) ||
      (m.from_user_id === conversation.other_user.id && m.to_user_id === user?.id)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const handleSend = () => {
    if (!text.trim() || !user) return
    const newMsg = {
      id: `dm${Date.now()}`,
      from_user_id: user.id,
      to_user_id: conversation.other_user.id,
      text: text.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, newMsg])
    setText('')
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100)
  }

  const isMine = (fromId: string) => fromId === user?.id

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
        <Text style={[styles.headerName, { color: c.text }]}>{conversation.other_user.display_name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={chatMessages}
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
      />

      <View style={[styles.inputBar, { backgroundColor: c.bgSecondary, borderTopColor: c.border }]}>
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
          disabled={!text.trim()}
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
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1, paddingBottom: 30 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
