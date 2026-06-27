import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image, Alert, Modal, Pressable } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getConversations, deleteConversation } from '../services/messageService'
import { Conversation } from '../types'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`
  return `${Math.floor(diff / 86400)}g`
}

export default function MessagesScreen({ navigation }: any) {
  const { t, theme, isLoggedIn, refreshUnreadDmCount } = useApp()
  const { profile } = useAuth()
  const c = getTheme(theme)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [menuConvId, setMenuConvId] = useState<string | null>(null)

  const loadConversations = useCallback(async (showLoader = true) => {
    if (!profile) return
    if (showLoader) setLoading(true)
    try {
      const data = await getConversations(profile.id)
      setConversations(data)
    } catch {}
    setLoading(false)
    setRefreshing(false)
  }, [profile?.id])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadConversations(false)
      refreshUnreadDmCount()
    })
    return unsub
  }, [navigation, loadConversations, refreshUnreadDmCount])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadConversations(false)
  }, [loadConversations])

  const handleDelete = (convId: string) => {
    setMenuConvId(null)
    Alert.alert(
      t('dm_delete_title'),
      t('dm_delete_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('dm_delete_button'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(convId)
              setConversations(prev => prev.filter(c => c.id !== convId))
              refreshUnreadDmCount()
            } catch (err: any) {
              Alert.alert('Hata', err?.message || 'Sohbet silinemedi')
            }
          },
        },
      ],
    )
  }

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>{t('messages_title')}</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✉</Text>
          <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>{t('upgrade_prompt')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('messages_title')}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✉</Text>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('messages_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.convItem, { borderBottomColor: c.border }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat', { conversationId: item.id, otherUser: item.other_user })}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Profile', { userId: item.other_user.id })}
              >
                {item.other_user.avatar_url ? (
                  <Image source={{ uri: item.other_user.avatar_url }} style={[styles.avatarImage, item.unread_count > 0 && styles.avatarUnread]} />
                ) : (
                  <View style={[styles.avatar, item.unread_count > 0 && styles.avatarUnread]}>
                    <Text style={styles.avatarText}>{getInitials(item.other_user.display_name)}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.convContent}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: c.text }]}>{item.other_user.display_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.convTime, { color: c.textMuted }]}>{timeAgo(item.last_message_at)}</Text>
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => setMenuConvId(item.id)}
                    >
                      <Text style={{ color: c.textMuted, fontSize: 18, fontWeight: '700', lineHeight: 18 }}>···</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text
                  style={[styles.convMsg, { color: item.unread_count > 0 ? c.text : c.textMuted, fontWeight: item.unread_count > 0 ? '600' : '400' }]}
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.teal}
              colors={[colors.teal]}
            />
          }
        />
      )}

      <Modal
        visible={menuConvId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuConvId(null)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuConvId(null)}>
          <View style={[styles.menuBox, { backgroundColor: c.bgSecondary, borderColor: c.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => menuConvId && handleDelete(menuConvId)}
            >
              <Text style={{ color: colors.red, fontSize: 16, fontWeight: '600' }}>
                {t('dm_delete_button')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}
              onPress={() => setMenuConvId(null)}
            >
              <Text style={{ color: c.textMuted, fontSize: 16 }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarUnread: { borderWidth: 2, borderColor: colors.tealLight },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { fontSize: 16, fontWeight: '600', flex: 1 },
  convTime: { fontSize: 12 },
  convMsg: { fontSize: 14 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuBox: { width: 260, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuItem: { paddingVertical: 16, alignItems: 'center' },
})
