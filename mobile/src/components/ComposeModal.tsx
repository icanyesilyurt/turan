import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { createPost } from '../services/postService'

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  visible: boolean
  onClose: () => void
  initialText?: string
}

export default function ComposeModal({ visible, onClose, initialText }: Props) {
  const { t, theme, user, addDraft, incrementPostsVersion } = useApp()
  const { profile: currentProfile } = useAuth()
  const c = getTheme(theme)
  const [text, setText] = useState(initialText || '')
  const [mediaUris, setMediaUris] = useState<string[]>([])
  const [pickerMenu, setPickerMenu] = useState(false)

  const hasContent = text.trim().length > 0 || mediaUris.length > 0

  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    if (!hasContent || !currentProfile || publishing) return
    setPublishing(true)
    try {
      await createPost(currentProfile.id, text)
      incrementPostsVersion()
      setText('')
      setMediaUris([])
      onClose()
    } catch (err: any) {
      Alert.alert(t('image_upload_error'), err?.message || String(err))
    } finally {
      setPublishing(false)
    }
  }

  const handleClose = () => {
    if (!hasContent) {
      setText('')
      setMediaUris([])
      onClose()
      return
    }
    Alert.alert(
      t('compose_close_title'),
      '',
      [
        {
          text: t('compose_discard'),
          style: 'destructive',
          onPress: () => { setText(''); setMediaUris([]); onClose() },
        },
        {
          text: t('compose_save_draft'),
          onPress: () => { addDraft(text); setText(''); setMediaUris([]); onClose() },
        },
        {
          text: t('compose_dismiss'),
          style: 'cancel',
        },
      ],
    )
  }

  const pickFromGallery = async () => {
    setPickerMenu(false)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    })
    if (!result.canceled && result.assets) {
      setMediaUris(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4))
    }
  }

  const pickFromCamera = async () => {
    setPickerMenu(false)
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    })
    if (!result.canceled && result.assets) {
      setMediaUris(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4))
    }
  }

  const removeMedia = (index: number) => {
    setMediaUris(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: c.bgSecondary }]}>
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: c.textMuted }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ color: c.textMuted, fontSize: 16, fontWeight: '600' }}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.publishBtn, { backgroundColor: hasContent ? colors.teal : c.bgInput }]}
              onPress={handlePublish}
              disabled={!hasContent}
            >
              <Text style={{ color: hasContent ? '#fff' : c.textMuted, fontWeight: '700', fontSize: 15 }}>
                {t('compose_publish')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {user && (
              currentProfile?.avatar_url ? (
                <Image
                  source={{ uri: currentProfile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.teal }]}>
                  <Text style={styles.avatarText}>
                    {getInitials(currentProfile?.display_name ?? user.display_name)}
                  </Text>
                </View>
              )
            )}
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder={t('compose_placeholder')}
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {mediaUris.length > 0 && (
            <View style={styles.mediaRow}>
              {mediaUris.map((uri, i) => (
                <View key={i} style={styles.mediaThumb}>
                  <Image source={{ uri }} style={styles.mediaImage} />
                  <TouchableOpacity style={styles.mediaRemove} onPress={() => removeMedia(i)}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomRow}>
            <Text style={{ color: text.length > 450 ? colors.red : c.textMuted, fontSize: 12 }}>
              {text.length}/500
            </Text>
          </View>

          <View style={[styles.toolbar, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: c.bgInput }]}
              onPress={() => setPickerMenu(true)}
            >
              <Text style={{ color: colors.teal, fontSize: 15, fontWeight: '600' }}>
                {t('compose_add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={pickerMenu} transparent animationType="fade" onRequestClose={() => setPickerMenu(false)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPickerMenu(false)}>
            <View style={[styles.pickerSheet, { backgroundColor: c.bgSecondary }]}>
              <TouchableOpacity style={[styles.pickerOption, { borderBottomColor: c.border }]} onPress={pickFromCamera}>
                <Text style={[styles.pickerIcon, { color: c.text }]}>C</Text>
                <Text style={[styles.pickerLabel, { color: c.text }]}>{t('picker_camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerOption, { borderBottomColor: c.border }]} onPress={pickFromGallery}>
                <Text style={[styles.pickerIcon, { color: c.text }]}>G</Text>
                <Text style={[styles.pickerLabel, { color: c.text }]}>{t('picker_gallery')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerOption} onPress={() => setPickerMenu(false)}>
                <Text style={[styles.pickerIcon, { color: c.text }]}>F</Text>
                <Text style={[styles.pickerLabel, { color: c.text }]}>{t('picker_file')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerCancel, { backgroundColor: c.bgInput }]}
                onPress={() => setPickerMenu(false)}
              >
                <Text style={{ color: c.textMuted, fontWeight: '600', fontSize: 16 }}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const { height, width } = Dimensions.get('window')

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: height * 0.6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: { alignItems: 'center', paddingVertical: 10 },
  handleBar: { width: 40, height: 4, borderRadius: 2, opacity: 0.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  publishBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  body: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20, resizeMode: 'cover' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  input: { flex: 1, fontSize: 17, lineHeight: 24, minHeight: 70, maxHeight: 120 },
  mediaRow: { flexDirection: 'row', paddingHorizontal: 68, gap: 8, flexWrap: 'wrap' },
  mediaThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%' },
  mediaRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  bottomRow: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 4 },
  toolbar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 16 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderBottomWidth: 1, gap: 16 },
  pickerIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(13,148,136,0.15)', textAlign: 'center', lineHeight: 32, fontSize: 15, fontWeight: '700', overflow: 'hidden' },
  pickerLabel: { fontSize: 17, fontWeight: '500' },
  pickerCancel: { marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
})
