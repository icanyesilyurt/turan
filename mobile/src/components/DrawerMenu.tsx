import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { getFollowCounts } from '../services/profileService'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  visible: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
}

export default function DrawerMenu({ visible, onClose, onNavigate }: Props) {
  const {
    t,
    theme,
    user,
    isLoggedIn,
    drafts,
    language,
    setLanguage,
  } = useApp()
  const { logout, requireAuth, profile: currentProfile } = useAuth()
  const c = getTheme(theme)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })

  useEffect(() => {
    if (!currentProfile) return
    getFollowCounts(currentProfile.id)
      .then(setCounts)
      .catch(() => {})
  }, [currentProfile?.id, visible])

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
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => { onNavigate('Profile'); onClose() }}
            >
              {currentProfile?.avatar_url ? (
                <Image
                  source={{ uri: currentProfile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
                  <Text style={styles.avatarText}>{getInitials(user.display_name)}</Text>
                </View>
              )}
              <Text style={[styles.displayName, { color: c.text }]}>
                {currentProfile?.display_name ?? user.display_name}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 14 }}>
                @{currentProfile?.username ?? user.username}
              </Text>
              <View style={styles.statsRow}>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
                  {counts.following} <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_following')}</Text>
                </Text>
                <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginLeft: 16 }}>
                  {counts.followers} <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_followers')}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.guestAuth}>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.teal }]}
                onPress={() => { requireAuth('login'); onClose() }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t('login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.registerBtn, { borderColor: colors.teal }]}
                onPress={() => { requireAuth('register'); onClose() }}
              >
                <Text style={{ color: colors.teal, fontWeight: '700', fontSize: 16 }}>{t('register')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isLoggedIn ? (
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
        ) : (
          <View style={styles.guestLanguageSection}>
            <Text style={[styles.guestSectionTitle, { color: c.textMuted }]}>{t('language')}</Text>
            <View style={styles.languageGrid}>
              {(['tr', 'az', 'kk', 'ky', 'uz', 'tk'] as const).map(code => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageBtn,
                    {
                      borderColor: language === code ? colors.teal : c.border,
                      backgroundColor: language === code ? colors.tealGlow : c.bgInput,
                    },
                  ]}
                  onPress={() => setLanguage(code)}
                >
                  <Text style={{ color: language === code ? colors.teal : c.text, fontWeight: '600' }}>
                    {code.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isLoggedIn && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderTopColor: c.border }]}
            onPress={() => { void logout(); onClose() }}
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
  avatarImage: { width: 50, height: 50, borderRadius: 25, marginBottom: 12, resizeMode: 'cover' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  displayName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  loginBtn: { paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  guestAuth: { gap: 10 },
  registerBtn: { paddingVertical: 11, borderRadius: 24, alignItems: 'center', borderWidth: 1.5 },
  menuSection: { paddingTop: 8 },
  guestLanguageSection: { padding: 20 },
  guestSectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageBtn: { minWidth: 52, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 20 },
  menuLabel: { fontSize: 17, fontWeight: '500', flex: 1 },
  menuBadge: { backgroundColor: colors.teal, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  menuBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 20, borderTopWidth: 1, marginTop: 'auto' },
})
