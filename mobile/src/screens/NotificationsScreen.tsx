import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import { AppNotification } from '../types'

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

const notifIcons: Record<AppNotification['type'], string> = {
  official: '📢',
  like: '❤',
  comment: '💬',
  follow: '👤',
  repost: '🔄',
  dm: '✉',
}

export default function NotificationsScreen({ navigation }: any) {
  const { t, theme, notifications } = useApp()
  const c = getTheme(theme)

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('tab_notifications')}</Text>
      </View>

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
              else if (item.from_user) navigation.navigate('Profile', { userId: item.from_user.id })
            }}
          >
            <View style={styles.notifLeft}>
              <Text style={styles.notifIcon}>{notifIcons[item.type]}</Text>
              {item.from_user && (
                <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
                  <Text style={styles.avatarText}>{getInitials(item.from_user.display_name)}</Text>
                </View>
              )}
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  notifItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, gap: 12 },
  notifLeft: { alignItems: 'center', gap: 6 },
  notifIcon: { fontSize: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  notifContent: { flex: 1, justifyContent: 'center' },
  notifBody: { fontSize: 14, lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'center' },
  emptyState: { alignItems: 'center', padding: 60 },
})
