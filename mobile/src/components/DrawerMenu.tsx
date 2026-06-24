import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  visible: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
}

export default function DrawerMenu({ visible, onClose, onNavigate }: Props) {
  const { t, theme, user, isLoggedIn, drafts, loginDemo, logoutDemo } = useApp()
  const c = getTheme(theme)

  if (!visible) return null

  const menuItems = [
    { key: 'Profile', icon: '👤', label: t('drawer_profile') },
    { key: 'Saved', icon: '🔖', label: t('drawer_saved') },
    { key: 'Drafts', icon: '📝', label: t('drawer_drafts'), badge: drafts.length > 0 ? drafts.length : undefined },
    { key: 'Settings', icon: '⚙', label: t('drawer_settings') },
  ]

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: c.bgSecondary }]}>
        <View style={[styles.profileSection, { borderBottomColor: c.border }]}>
          {isLoggedIn && user ? (
            <>
              <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
                <Text style={styles.avatarText}>{getInitials(user.display_name)}</Text>
              </View>
              <Text style={[styles.displayName, { color: c.text }]}>{user.display_name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>@{user.username}</Text>
              <View style={styles.statsRow}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
                  {user.following_count} <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_following')}</Text>
                </Text>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginLeft: 16 }}>
                  {user.followers_count} <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_followers')}</Text>
                </Text>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.teal }]}
              onPress={() => { loginDemo(); onClose() }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('login')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => { onNavigate(item.key); onClose() }}
            >
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
              {item.badge !== undefined && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderTopColor: c.border }]}
            onPress={() => { logoutDemo(); onClose() }}
          >
            <Text style={{ fontSize: 22 }}>🚪</Text>
            <Text style={[styles.menuLabel, { color: colors.red }]}>{t('drawer_logout')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.78, paddingTop: 60 },
  profileSection: { padding: 20, borderBottomWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  displayName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  loginBtn: { paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  menuSection: { paddingTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 20 },
  menuLabel: { fontSize: 17, fontWeight: '500', flex: 1 },
  menuBadge: { backgroundColor: colors.teal, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  menuBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: 1, marginTop: 'auto' },
})
