import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import { getFollowers, getFollowing } from '../services/profileService'
import { Profile } from '../types'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

type Tab = 'following' | 'followers'

interface Props {
  visible: boolean
  onClose: () => void
  profileId: string
  initialTab: Tab
  onProfilePress: (userId: string) => void
}

export default function FollowListModal({
  visible,
  onClose,
  profileId,
  initialTab,
  onProfilePress,
}: Props) {
  const { t, theme } = useApp()
  const c = getTheme(theme)
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [followersList, setFollowersList] = useState<Profile[]>([])
  const [followingList, setFollowingList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!visible || !profileId) return
    setLoading(true)
    Promise.all([
      getFollowers(profileId),
      getFollowing(profileId),
    ])
      .then(([followers, following]) => {
        setFollowersList(followers)
        setFollowingList(following)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible, profileId])

  const data = activeTab === 'followers' ? followersList : followingList

  const renderItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: c.border }]}
      activeOpacity={0.7}
      onPress={() => {
        onClose()
        onProfilePress(item.id)
      }}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.teal }]}>
          <Text style={styles.avatarText}>{getInitials(item.display_name)}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          {item.display_name}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={1}>
          @{item.username}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '600' }}>X</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { borderBottomColor: c.border }]}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'following' ? colors.teal : c.textMuted }]}>
              {t('profile_following')}
            </Text>
            {activeTab === 'following' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('followers')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'followers' ? colors.teal : c.textMuted }]}>
              {t('profile_followers')}
            </Text>
            {activeTab === 'followers' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={{ color: c.textMuted, fontSize: 15 }}>
                  {activeTab === 'followers' ? t('no_followers') : t('no_following')}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  )
}

const { width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 60, height: 3, borderRadius: 2, backgroundColor: colors.teal },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 200 },
})
