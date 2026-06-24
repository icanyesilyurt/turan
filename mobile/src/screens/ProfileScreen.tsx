import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import {
  getProfileById,
  uploadAvatar,
  uploadCover,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowCounts,
  createFollowNotification,
} from '../services/profileService'
import { getProfilePosts } from '../services/postService'
import { Profile, User } from '../types'
import PostCard from '../components/PostCard'
import EditProfileModal from '../components/EditProfileModal'
import FollowListModal from '../components/FollowListModal'

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
  uploading?: boolean
  onChangePhoto: () => void
}

function PhotoViewerModal({
  visible,
  onClose,
  initials,
  bgColor,
  isOwner,
  changeLabel,
  downloadLabel,
  type,
  imageUri,
  uploading,
  onChangePhoto,
}: PhotoViewerProps) {
  const { theme } = useApp()
  const c = getTheme(theme)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
                onPress={onChangePhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{changeLabel}</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[pStyles.modalBtn, { backgroundColor: c.bgInput }]}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{downloadLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function ProfileScreen({ route, navigation }: any) {
  const { t, theme, user: currentUser, comments = [], postsVersion } = useApp()
  const { profile: currentProfile, requireAuth, refreshProfile } = useAuth()
  const c = getTheme(theme)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [avatarModal, setAvatarModal] = useState(false)
  const [coverModal, setCoverModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [selectedPhotoType, setSelectedPhotoType] = useState<'avatar' | 'cover' | null>(null)
  const [uploadingTarget, setUploadingTarget] = useState<'avatar' | 'cover' | null>(null)
  const [remoteProfile, setRemoteProfile] = useState<Profile | null>(null)
  const [remoteLoading, setRemoteLoading] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 })
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [followListVisible, setFollowListVisible] = useState(false)
  const [followListTab, setFollowListTab] = useState<'following' | 'followers'>('followers')
  const [userPosts, setUserPosts] = useState<import('../types').CommunityPost[]>([])

  const showPermissionAlert = (
    messageKey: 'camera_permission_message' | 'gallery_permission_message',
    canAskAgain: boolean,
  ) => {
    if (canAskAgain) {
      Alert.alert(t('permission_required'), t(messageKey))
      return
    }

    Alert.alert(
      t('permission_required'),
      t(messageKey),
      [
        { text: t('permission_cancel'), style: 'cancel' },
        {
          text: t('open_settings'),
          onPress: () => {
            void Linking.openSettings()
          },
        },
      ],
    )
  }

  const pickImage = async (source: 'camera' | 'gallery', target: 'avatar' | 'cover') => {
    setPickerLoading(true)
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync(false)

      console.log('[ProfileImagePicker] permission status', {
        source,
        status: permission.status,
        granted: permission.granted,
        canAskAgain: permission.canAskAgain,
      })

      if (!permission.granted) {
        showPermissionAlert(
          source === 'camera' ? 'camera_permission_message' : 'gallery_permission_message',
          permission.canAskAgain,
        )
        return
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: target === 'avatar' || Platform.OS === 'android',
        aspect: target === 'avatar' ? [1, 1] : [3, 1],
      }

      console.log('[ProfileImagePicker] picker çağrılıyor', { source, target })
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options)

      console.log('[ProfileImagePicker] picker sonucu', {
        source,
        target,
        canceled: result.canceled,
        assetCount: result.canceled ? 0 : result.assets.length,
        hasBase64: result.canceled ? false : Boolean(result.assets[0]?.base64),
        mimeType: result.canceled ? undefined : result.assets[0]?.mimeType,
      })

      if (result.canceled) return

      const asset = result.assets[0]
      if (!asset?.base64) {
        throw new Error(t('image_upload_error'))
      }

      console.log('[ProfileImagePicker] upload başlıyor', {
        target,
        mimeType: asset.mimeType ?? 'image/jpeg',
      })
      setUploadingTarget(target)

      if (target === 'avatar') {
        await uploadAvatar(asset.base64, asset.mimeType ?? 'image/jpeg')
      } else {
        await uploadCover(asset.base64, asset.mimeType ?? 'image/jpeg')
      }

      await refreshProfile()
      setAvatarModal(false)
      setCoverModal(false)
      Alert.alert(t('image_upload_success'))
    } catch (error: any) {
      console.error('[ProfileImagePicker] akış hatası', error)
      Alert.alert(t('image_upload_error'), error?.message || t('image_upload_error'))
    } finally {
      setAvatarModal(false)
      setCoverModal(false)
      setSelectedPhotoType(null)
      setPickerLoading(false)
      setUploadingTarget(null)
    }
  }

  const openPhotoSourceMenu = (target: 'avatar' | 'cover') => {
    setSelectedPhotoType(target)
    setAvatarModal(false)
    setCoverModal(false)

    setTimeout(() => {
      Alert.alert(
        target === 'avatar' ? t('profile_change_photo') : t('profile_change_cover'),
        undefined,
        [
          {
            text: t('picker_camera'),
            onPress: () => {
              console.log('[ProfileImagePicker] kamera butonuna basıldı')
              void pickImage('camera', target)
            },
          },
          {
            text: t('picker_gallery'),
            onPress: () => {
              console.log('[ProfileImagePicker] galeri butonuna basıldı')
              void pickImage('gallery', target)
            },
          },
          {
            text: t('permission_cancel'),
            style: 'cancel',
            onPress: () => {
              setSelectedPhotoType(null)
              setPickerLoading(false)
              setUploadingTarget(null)
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            setSelectedPhotoType(null)
            setPickerLoading(false)
            setUploadingTarget(null)
          },
        },
      )
    }, 500)
  }

  const userId = route?.params?.userId

  React.useEffect(() => {
    let active = true

    if (!userId || userId === currentProfile?.id) {
      setRemoteProfile(null)
      return
    }

    setRemoteProfile(null)
    setRemoteLoading(true)
    getProfileById(userId)
      .then(profile => {
        if (active) setRemoteProfile(profile)
      })
      .catch(error => {
        console.warn(
          'Unable to load profile:',
          error instanceof Error ? error.message : error,
        )
      })
      .finally(() => {
        if (active) setRemoteLoading(false)
      })

    return () => {
      active = false
    }
  }, [currentProfile?.id, userId])

  const targetProfileId = userId || currentProfile?.id

  React.useEffect(() => {
    if (!targetProfileId) return
    let active = true

    getFollowCounts(targetProfileId)
      .then(counts => { if (active) setFollowCounts(counts) })
      .catch(() => {})

    if (currentProfile && targetProfileId !== currentProfile.id) {
      isFollowing(targetProfileId)
        .then(val => { if (active) setFollowing(val) })
        .catch(() => {})
    }

    return () => { active = false }
  }, [targetProfileId, currentProfile?.id])

  React.useEffect(() => {
    if (!targetProfileId) return
    let active = true
    getProfilePosts(targetProfileId)
      .then(data => { if (active) setUserPosts(data) })
      .catch(() => {})
    return () => { active = false }
  }, [targetProfileId, postsVersion])

  const handleFollowToggle = async () => {
    if (!currentProfile) { requireAuth(); return }
    if (!targetProfileId || followLoading) return

    console.log('[handleFollowToggle] start:', {
      currentProfileId: currentProfile.id,
      targetProfileId,
      currentlyFollowing: following,
    })

    setFollowLoading(true)
    try {
      if (following) {
        await unfollowUser(targetProfileId)
        setFollowing(false)
        setFollowCounts(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }))
      } else {
        await followUser(targetProfileId)
        setFollowing(true)
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }))
        createFollowNotification(currentProfile.id, targetProfileId, currentProfile.username)
      }
    } catch (err: any) {
      console.error('[handleFollowToggle] error:', err)
      Alert.alert(
        t('image_upload_error'),
        err?.message || String(err),
      )
    } finally {
      setFollowLoading(false)
    }
  }

  const profileToUser = (profile: Profile): User => ({
    id: profile.id,
    email: profile.id === currentUser?.id ? currentUser.email : '',
    display_name: profile.display_name,
    username: profile.username,
    country: profile.country ?? '',
    city: profile.city ?? '',
    bio: profile.bio,
    avatar_url: profile.avatar_url ?? '',
    cover_url: profile.cover_url ?? '',
    app_language: profile.app_language,
    theme,
    membership_status: profile.membership_status,
    created_at: profile.created_at,
    followers_count: followCounts.followers,
    following_count: followCounts.following,
  })

  const profileUser = userId
    ? userId === currentProfile?.id && currentProfile
      ? profileToUser(currentProfile)
      : remoteProfile
        ? profileToUser(remoteProfile)
        : null
    : currentProfile
      ? profileToUser(currentProfile)
      : null
  const isOwner = !!currentProfile && (!userId || userId === currentProfile.id)

  if (remoteLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </View>
    )
  }

  if (!profileUser) {
    if (userId) {
      return (
        <View style={[styles.container, { backgroundColor: c.bg }]}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
              <View style={styles.backCircle}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>←</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.emptyState}>
            <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('no_content')}</Text>
          </View>
        </View>
      )
    }
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.welcomeTitle, { color: c.text }]}>{t('welcome')}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {t('upgrade_prompt')}
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.teal }]}
            onPress={() => requireAuth()}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const initials = getInitials(profileUser.display_name)
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
        {profileUser.cover_url ? (
          <Image source={{ uri: profileUser.cover_url }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverArea, { backgroundColor: colors.tealDark }]} />
        )}
        {isOwner && (
          <TouchableOpacity style={styles.coverChangeBtn} onPress={() => setCoverModal(true)}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{t('profile_change_cover')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <View style={styles.topBar}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
            <View style={styles.backCircle}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>←</Text>
            </View>
          </TouchableOpacity>
        )}
        {!isOwner && (
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.topActionCircle}
              onPress={() => Alert.alert(t('coming_soon'))}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topActionCircle}
              onPress={() => setMoreMenuOpen(true)}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>...</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.profileInfo, { backgroundColor: c.bg }]}>
        <View style={styles.avatarRow}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setAvatarModal(true)}>
            {profileUser.avatar_url ? (
              <Image source={{ uri: profileUser.avatar_url }} style={[styles.avatar, { borderColor: c.bg }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.teal, borderColor: c.bg }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          {isOwner ? (
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: c.border }]}
              onPress={() => setEditModal(true)}
            >
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{t('profile_edit')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.followBtn,
                {
                  backgroundColor: following ? 'transparent' : colors.teal,
                  borderWidth: following ? 1.5 : 0,
                  borderColor: following ? c.border : undefined,
                },
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={following ? c.text : '#fff'} />
              ) : (
                <Text style={{ color: following ? c.text : '#fff', fontWeight: '600', fontSize: 14 }}>
                  {following ? t('unfollow') : t('follow')}
                </Text>
              )}
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
          <TouchableOpacity onPress={() => { setFollowListTab('following'); setFollowListVisible(true) }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
              {profileUser.following_count}{' '}
              <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_following')}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setFollowListTab('followers'); setFollowListVisible(true) }} style={{ marginLeft: 20 }}>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
              {profileUser.followers_count}{' '}
              <Text style={{ color: c.textMuted, fontWeight: '400' }}>{t('profile_followers')}</Text>
            </Text>
          </TouchableOpacity>
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
        imageUri={profileUser.avatar_url}
        uploading={
          selectedPhotoType === 'avatar'
          && (pickerLoading || uploadingTarget === 'avatar')
        }
        onChangePhoto={() => openPhotoSourceMenu('avatar')}
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
        imageUri={profileUser.cover_url}
        uploading={
          selectedPhotoType === 'cover'
          && (pickerLoading || uploadingTarget === 'cover')
        }
        onChangePhoto={() => openPhotoSourceMenu('cover')}
      />

      {currentProfile && (
        <EditProfileModal
          visible={editModal}
          profile={currentProfile}
          onClose={() => setEditModal(false)}
        />
      )}

      {targetProfileId && (
        <FollowListModal
          visible={followListVisible}
          onClose={() => setFollowListVisible(false)}
          profileId={targetProfileId}
          initialTab={followListTab}
          onProfilePress={(uid) => navigation.push('Profile', { userId: uid })}
        />
      )}

      <Modal
        visible={moreMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreMenuOpen(false)}
      >
        <TouchableOpacity
          style={pStyles.moreOverlay}
          activeOpacity={1}
          onPress={() => setMoreMenuOpen(false)}
        >
          <View style={[pStyles.moreSheet, { backgroundColor: c.bgSecondary }]}>
            {[
              { key: 'notif_toggle', label: t('menu_notifications') },
              { key: 'share', label: t('menu_share_profile') },
              { key: 'block', label: t('menu_block') },
              { key: 'report', label: t('menu_report') },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  pStyles.moreOption,
                  i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
                onPress={() => {
                  setMoreMenuOpen(false)
                  Alert.alert(t('coming_soon'))
                }}
              >
                <Text
                  style={{
                    color: item.key === 'block' || item.key === 'report' ? colors.red : c.text,
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[pStyles.moreCancel, { backgroundColor: c.bgInput }]}
              onPress={() => setMoreMenuOpen(false)}
            >
              <Text style={{ color: c.textMuted, fontWeight: '600', fontSize: 16 }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  moreOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  moreSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: 16 },
  moreOption: { paddingVertical: 18, paddingHorizontal: 24 },
  moreCancel: { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverArea: { height: 165, alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: 165, resizeMode: 'cover' },
  coverChangeBtn: { position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingHorizontal: 12 },
  topRightActions: { flexDirection: 'row', gap: 8 },
  topActionCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  backBtnAbsolute: {},
  backCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  profileInfo: { paddingHorizontal: 16, paddingBottom: 4 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -52 },
  avatar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 36 },
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
