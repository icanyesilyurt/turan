import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  checkUsernameAvailable,
  updateMyProfile,
} from '../services/profileService'
import { colors, getTheme } from '../styles/theme'
import { AppLanguage, Profile } from '../types'

interface Props {
  visible: boolean
  profile: Profile
  onClose: () => void
}

const languageCodes: AppLanguage[] = ['tr', 'az', 'kk', 'ky', 'uz', 'tk']

export default function EditProfileModal({ visible, profile, onClose }: Props) {
  const { t, theme, setLanguage } = useApp()
  const { refreshProfile } = useAuth()
  const c = getTheme(theme)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio)
  const [country, setCountry] = useState(profile.country ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(profile.app_language)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visible) return

    setDisplayName(profile.display_name)
    setUsername(profile.username)
    setBio(profile.bio)
    setCountry(profile.country ?? '')
    setCity(profile.city ?? '')
    setAppLanguage(profile.app_language)
  }, [profile, visible])

  const saveProfile = async () => {
    const normalizedUsername = username.trim()

    if (!displayName.trim() || !/^[A-Za-z0-9_]{3,20}$/.test(normalizedUsername)) {
      Alert.alert(t('profile_update_error'), t('username_rules'))
      return
    }

    setSaving(true)

    try {
      const available = await checkUsernameAvailable(normalizedUsername, profile.id)
      if (!available) {
        Alert.alert(t('profile_update_error'), t('username_taken'))
        return
      }

      await updateMyProfile({
        display_name: displayName.trim(),
        username: normalizedUsername,
        bio: bio.trim(),
        country: country.trim() || null,
        city: city.trim() || null,
        app_language: appLanguage,
      })
      await refreshProfile()
      setLanguage(appLanguage)
      onClose()
      Alert.alert(t('profile_update_success'))
    } catch (error: any) {
      const message = error?.code === '23505'
        ? t('username_taken')
        : error?.message || t('profile_update_error')
      Alert.alert(t('profile_update_error'), message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={{ color: c.textMuted, fontSize: 16 }}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text }]}>{t('profile_edit')}</Text>
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.teal} />
            ) : (
              <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '700' }}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ProfileField label={t('display_name')} value={displayName} onChangeText={setDisplayName} />
          <ProfileField
            label={t('username')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            maxLength={20}
          />
          <Text style={[styles.hint, { color: c.textMuted }]}>{t('username_rules')}</Text>
          <ProfileField
            label={t('bio')}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={240}
          />
          <ProfileField label={t('country')} value={country} onChangeText={setCountry} />
          <ProfileField label={t('city')} value={city} onChangeText={setCity} />

          <Text style={[styles.label, { color: c.textSecondary }]}>{t('language')}</Text>
          <View style={styles.languageGrid}>
            {languageCodes.map(code => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.languageButton,
                  {
                    borderColor: appLanguage === code ? colors.teal : c.border,
                    backgroundColor: appLanguage === code ? colors.tealGlow : c.bgInput,
                  },
                ]}
                onPress={() => setAppLanguage(code)}
              >
                <Text style={{ color: appLanguage === code ? colors.teal : c.text, fontWeight: '600' }}>
                  {code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

interface FieldProps {
  label: string
  value: string
  onChangeText: (value: string) => void
  multiline?: boolean
  autoCapitalize?: 'none' | 'sentences'
  maxLength?: number
}

function ProfileField({
  label,
  value,
  onChangeText,
  multiline,
  autoCapitalize = 'sentences',
  maxLength,
}: FieldProps) {
  const { theme } = useApp()
  const c = getTheme(theme)

  return (
    <View>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          { color: c.text, backgroundColor: c.bgInput, borderColor: c.border },
        ]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={c.textMuted}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  multilineInput: { minHeight: 100 },
  hint: { fontSize: 12, lineHeight: 17, marginTop: -9 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageButton: { minWidth: 52, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
})
