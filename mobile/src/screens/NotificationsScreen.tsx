import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getNotifications, markNotificationsRead } from '../services/profileService'
import { Profile } from '../types'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const notifBadgeIcons: Record<string, string> = {
  follow: '👤',
  like: '❤️',
  comment: '💬',
  repost: '🔄',
  save: '🔖',
  official: '📢',
  dm: '✉️',
}

interface NotifRow {
  id: string
  type: string
  body: string
  is_read: boolean
  from_user_id: string | null
  post_id: string | null
  created_at: string
  from_profile: Profile | null
}

export default function NotificationsScreen({ navigation }: any) {
  const { t, theme, refreshUnreadCount } = useApp()
  const { profile } = useAuth()
  const c = getTheme(theme)
  const [notifications, setNotifications] = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    if (!profile) { setLoading(false); return }
    try {
      const data = await getNotifications(profile.id)
      setNotifications(data as NotifRow[])
    } catch {}
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  useFocusEffect(
    useCallback(() => {
      if (!profile) return
      loadNotifications()
      markNotificationsRead(profile.id).then(() => refreshUnreadCount())
    }, [profile?.id])
  )

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('tab_notifications')}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notifItem,
                { borderBottomColor: c.border },
                !item.is_read && { backgroundColor: c.bgSecondary },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.post_id) navigation.navigate('PostDetail', { postId: item.post_id })
                else if (item.from_profile) navigation.navigate('Profile', { userId: item.from_profile.id })
              }}
            >
              <View style={styles.avatarWrapper}>
                {item.from_profile ? (
                  item.from_profile.avatar_url ? (
                    <Image source={{ uri: item.from_profile.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
                      <Text style={styles.avatarText}>{getInitials(item.from_profile.display_name)}</Text>
                    </View>
                  )
                ) : (
                  <View style={[styles.avatar, { backgroundColor: c.bgInput }]}>
                    <Text style={{ fontSize: 18 }}>🔔</Text>
                  </View>
                )}
                <View style={[styles.typeBadge, { backgroundColor: c.bg, borderColor: c.bg }]}>
                  <Text style={styles.typeBadgeIcon}>{notifBadgeIcons[item.type] ?? '🔔'}</Text>
                </View>
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifBody, { color: c.text }]}>{item.body}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>
                  {timeAgo(item.created_at)}
                </Text>
              </View>
              {!item.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
              <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('no_content')}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  notifItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, gap: 12, alignItems: 'center' },
  avatarWrapper: { width: 48, height: 48, position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  typeBadge: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  typeBadgeIcon: { fontSize: 10 },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifBody: { fontSize: 14, lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'center' },
  emptyState: { alignItems: 'center', padding: 60 },
})
