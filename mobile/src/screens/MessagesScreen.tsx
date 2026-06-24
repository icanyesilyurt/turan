import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'

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
  const { t, theme, isLoggedIn, conversations } = useApp()
  const c = getTheme(theme)

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

      {conversations.length === 0 ? (
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
              onPress={() => navigation.navigate('Chat', { conversation: item })}
            >
              <View style={[styles.avatar, item.unread_count > 0 && styles.avatarUnread]}>
                <Text style={styles.avatarText}>{getInitials(item.other_user.display_name)}</Text>
              </View>
              <View style={styles.convContent}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: c.text }]}>{item.other_user.display_name}</Text>
                  <Text style={[styles.convTime, { color: c.textMuted }]}>{timeAgo(item.last_message_at)}</Text>
                </View>
                <Text
                  style={[styles.convMsg, { color: item.unread_count > 0 ? c.text : c.textMuted }]}
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
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
  convItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  avatarUnread: { borderWidth: 2, borderColor: colors.tealLight },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName: { fontSize: 16, fontWeight: '600' },
  convTime: { fontSize: 12 },
  convMsg: { fontSize: 14 },
  badge: { backgroundColor: colors.teal, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
