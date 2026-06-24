import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'
import { demoUsers } from '../data/demo'
import PostCard from '../components/PostCard'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

type ProfileTab = 'posts' | 'comments' | 'photos' | 'videos'

interface PhotoViewerProps {
  visible: boolean
  onClose: () => void
  label: string
  initials: string
  bgColor: string
  isOwner: boolean
  changeLabel: string
  downloadLabel: string
  type: 'avatar' | 'cover'
  imageUri?: string | null
  onPickCamera: () => void
  onPickGallery: () => void
}

function PhotoViewerModal({ visible, onClose, label, initials, bgColor, isOwner, changeLabel, downloadLabel, type, imageUri, onPickCamera, onPickGallery }: PhotoViewerProps) {
  const { t, theme } = useApp()
  const c = getTheme(theme)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pStyles.modalOverlay}>
        <TouchableOpacity style={pStyles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[pStyles.modalContent, { backgroundColor: c.bgSecondary }]}>
          <View style={pStyles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: c.textMuted, fontSize: 28 }}>X</Text>
            </TouchableOpacity>
          </View>

          {type === 'avatar' ? (
            imageUri ? (
              <Image source={{ uri: imageUri }} style={pStyles.modalAvatarImg} />
            ) : (
              <View style={[pStyles.modalAvatar, { backgroundColor: bgColor }]}>
                <Text style={pStyles.modalAvatarText}>{initials}</Text>
              </View>
            )
          ) : (
            imageUri ? (
              <Image source={{ uri: imageUri }} style={pStyles.modalCoverImg} />
            ) : (
              <View style={[pStyles.modalCover, { backgroundColor: bgColor }]} />
            )
          )}

          <View style={pStyles.modalActions}>
            {isOwner && (
              <TouchableOpacity
                style={[pStyles.modalBtn, { backgroundColor: colors.teal }]}
                onPress={() => setPickerOpen(true)}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{changeLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[pStyles.modalBtn, { backgroundColor: c.bgInput }]}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{downloadLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={pStyles.pickerOverlay} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={[pStyles.pickerSheet, { backgroundColor: c.bgSecondary }]}>
            <TouchableOpacity
              style={[pStyles.pickerOption, { borderBottomColor: c.border }]}
              onPress={() => { setPickerOpen(false); onPickCamera() }}
            >
              <Text style={[pStyles.pickerIcon, { color: c.text }]}>C</Text>
              <Text style={[pStyles.pickerLabel, { color: c.text }]}>{t('picker_camera')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pStyles.pickerOption}
              onPress={() => { setPickerOpen(false); onPickGallery() }}
            >
              <Text style={[pStyles.pickerIcon, { color: c.text }]}>G</Text>
              <Text style={[pStyles.pickerLabel, { color: c.text }]}>{t('picker_gallery')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pStyles.pickerCancel, { backgroundColor: c.bgInput }]}
              onPress={() => setPickerOpen(false)}
            >
              <Text style={{ color: c.textMuted, fontWeight: '600', fontSize: 16 }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  )
}

export default function ProfileScreen({ route, navigation }: any) {
  const { t, theme, user: currentUser, allPosts = [], comments = [], loginDemo } = useApp()
  const c = getTheme(theme)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [avatarModal, setAvatarModal] = useState(false)
  const [coverModal, setCoverModal] = useState(false)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [coverUri, setCoverUri] = useState<string | null>(null)

  const pickImage = async (source: 'camera' | 'gallery', target: 'avatar' | 'cover') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') return
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: target === 'avatar' ? [1, 1] : [16, 9] })
      if (!result.canceled && result.assets[0]) {
        if (target === 'avatar') setAvatarUri(result.assets[0].uri)
        else setCoverUri(result.assets[0].uri)
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') return
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: target === 'avatar' ? [1, 1] : [16, 9] })
      if (!result.canceled && result.assets[0]) {
        if (target === 'avatar') setAvatarUri(result.assets[0].uri)
        else setCoverUri(result.assets[0].uri)
      }
    }
  }

  const userId = route?.params?.userId
  const profileUser = userId ? demoUsers.find(u => u.id === userId) || currentUser : currentUser
  const isLoggedIn = !!currentUser
  const isOwner = !userId || userId === currentUser?.id

  if (!profileUser) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🏔</Text>
          <Text style={[styles.welcomeTitle, { color: c.text }]}>{t('welcome')}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {t('upgrade_prompt')}
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.teal }]}
            onPress={loginDemo}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const initials = getInitials(profileUser.display_name)
  const userPosts = allPosts.filter(p => p.user_id === profileUser.id)
  const userComments = comments.filter(cm => cm.user_id === profileUser.id)

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: t('profile_posts') },
    { key: 'comments', label: t('profile_comments') },
    { key: 'photos', label: t('profile_photos') },
    { key: 'videos', label: t('profile_videos') },
  ]

  const headerComponent = (
    <View>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setCoverModal(true)}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverArea, { backgroundColor: colors.tealDark }]} />
        )}
        {isOwner && (
          <TouchableOpacity style={styles.coverChangeBtn} onPress={() => setCoverModal(true)}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{t('profile_change_cover')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {navigation.canGoBack() && (
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <View style={styles.backCircle}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>←</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.profileInfo, { backgroundColor: c.bg }]}>
        <View style={styles.avatarRow}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setAvatarModal(true)}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: c.bg }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.teal, borderColor: c.bg }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity style={[styles.editBtn, { borderColor: c.border }]}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{t('profile_edit')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.followBtn, { backgroundColor: colors.teal }]}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('follow')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.displayName, { color: c.text }]}>{profileUser.display_name}</Text>
        <Text style={{ color: c.textMuted, fontSize: 14, marginTop: 2 }}>@{profileUser.username}</Text>

        {profileUser.bio ? (
          <Text style={[styles.bio, { color: c.text }]}>{profileUser.bio}</Text>
        ) : null}

        {(profileUser.country || profileUser.city) && (
          <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 6 }}>
            📍 {[profileUser.city, profileUser.country].filter(Boolean).join(', ')}
          </Text>
        )}

        <View style={styles.statsRow}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
            {profileUser.following_count}{' '}
            <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_following')}</Text>
          </Text>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: '700', marginLeft: 20 }}>
            {profileUser.followers_count}{' '}
            <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_followers')}</Text>
          </Text>
        </View>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: c.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? colors.teal : c.textMuted },
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderTabContent = () => {
    if (activeTab === 'posts') {
      return userPosts.length === 0
        ? [{ id: '__empty_posts', _empty: true }]
        : userPosts
    }
    if (activeTab === 'comments') {
      return userComments.length === 0
        ? [{ id: '__empty_comments', _empty: true }]
        : userComments
    }
    return [{ id: `__empty_${activeTab}`, _empty: true }]
  }

  const data = renderTabContent() as any[]

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }) => {
          if (item._empty) {
            const msg = activeTab === 'posts' ? t('no_posts')
              : activeTab === 'comments' ? t('no_comments')
              : activeTab === 'photos' ? t('no_photos')
              : t('no_videos')
            const icon = activeTab === 'posts' ? '📝'
              : activeTab === 'comments' ? '💬'
              : activeTab === 'photos' ? '📷'
              : '🎬'
            return (
              <View style={styles.emptyTab}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>{icon}</Text>
                <Text style={{ color: c.textMuted, fontSize: 15 }}>{msg}</Text>
              </View>
            )
          }
          if (activeTab === 'posts') {
            return (
              <PostCard
                post={item}
                onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              />
            )
          }
          if (activeTab === 'comments') {
            return (
              <TouchableOpacity
                style={[styles.commentItem, { borderBottomColor: c.border }]}
                activeOpacity={0.7}
                onPress={() => item.post_id ? navigation.navigate('PostDetail', { postId: item.post_id }) : undefined}
              >
                <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 4 }}>
                  💬 {t('comment')}
                </Text>
                <Text style={{ color: c.text, fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
              </TouchableOpacity>
            )
          }
          return null
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <PhotoViewerModal
        visible={avatarModal}
        onClose={() => setAvatarModal(false)}
        label={profileUser.display_name}
        initials={initials}
        bgColor={colors.teal}
        isOwner={isOwner}
        changeLabel={t('profile_change_photo')}
        downloadLabel={t('photo_download')}
        type="avatar"
        imageUri={avatarUri}
        onPickCamera={() => pickImage('camera', 'avatar')}
        onPickGallery={() => pickImage('gallery', 'avatar')}
      />

      <PhotoViewerModal
        visible={coverModal}
        onClose={() => setCoverModal(false)}
        label={profileUser.display_name}
        initials={initials}
        bgColor={colors.tealDark}
        isOwner={isOwner}
        changeLabel={t('profile_change_cover')}
        downloadLabel={t('photo_download')}
        type="cover"
        imageUri={coverUri}
        onPickCamera={() => pickImage('camera', 'cover')}
        onPickGallery={() => pickImage('gallery', 'cover')}
      />
    </View>
  )
}

const { width } = Dimensions.get('window')

const pStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalContent: { width: width * 0.9, borderRadius: 16, overflow: 'hidden' },
  modalHeader: { padding: 16, alignItems: 'flex-end' },
  modalAvatar: { width: 200, height: 200, borderRadius: 100, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  modalAvatarImg: { width: 200, height: 200, borderRadius: 100, alignSelf: 'center', marginBottom: 24 },
  modalAvatarText: { color: '#fff', fontWeight: '800', fontSize: 72 },
  modalCover: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  modalCoverImg: { width: '100%', height: 180 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 20 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 16 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderBottomWidth: 1, gap: 16 },
  pickerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(13,148,136,0.15)', textAlign: 'center', lineHeight: 32, fontSize: 15, fontWeight: '700', overflow: 'hidden' },
  pickerLabel: { fontSize: 17, fontWeight: '500' },
  pickerCancel: { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverArea: { height: 150, alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: 150 },
  coverChangeBtn: { position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  backBtnAbsolute: { position: 'absolute', top: 48, left: 12, zIndex: 10 },
  backCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  profileInfo: { paddingHorizontal: 16, paddingBottom: 4 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 30 },
  editBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 8 },
  followBtn: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 8 },
  displayName: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  statsRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 36, height: 3, borderRadius: 2, backgroundColor: colors.teal },
  commentItem: { padding: 16, borderBottomWidth: 1 },
  emptyTab: { alignItems: 'center', padding: 50 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  authBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
})
