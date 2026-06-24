import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { AuthScreenMode, useAuth } from '../context/AuthContext'
import { colors } from '../styles/theme'
import { AppLanguage } from '../types'

const languages: { code: AppLanguage; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'az', label: 'Azerbaycanca' },
  { code: 'kk', label: 'Қазақша' },
  { code: 'ky', label: 'Кыргызча' },
  { code: 'uz', label: "O'zbekcha" },
  { code: 'tk', label: 'Türkmençe' },
]

export default function AuthScreen() {
  const { login, register, exploreAsGuest, authScreenMode } = useAuth()
  const [mode, setMode] = useState<AuthScreenMode>(authScreenMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('tr')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre zorunludur.')
      return
    }

    if (mode === 'register' && (!displayName.trim() || !username.trim())) {
      Alert.alert('Eksik bilgi', 'Görünen ad ve kullanıcı adı zorunludur.')
      return
    }

    setSubmitting(true)

    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await register({
            email,
            password,
            displayName,
            username,
            country,
            city,
            appLanguage,
          })

      if (result.error) {
        Alert.alert(
          mode === 'login' ? 'Giriş yapılamadı' : 'Kayıt tamamlanamadı',
          result.error.message,
        )
        return
      }

      if (mode === 'register' && !result.data.session) {
        Alert.alert(
          'E-postanızı kontrol edin',
          'Hesabınızı kullanmadan önce doğrulama bağlantısını açmanız gerekebilir.',
        )
        setMode('login')
      }
    } catch (error) {
      Alert.alert(
        'Bağlantı hatası',
        error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>TURAN</Text>
        <Text style={styles.subtitle}>Türk dünyasını keşfet, paylaş ve bağlan.</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
              Giriş Yap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
              Kayıt Ol
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Field
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {mode === 'register' && (
            <>
              <Field label="Görünen ad" value={displayName} onChangeText={setDisplayName} />
              <Field
                label="Kullanıcı adı"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Field label="Ülke" value={country} onChangeText={setCountry} />
              <Field label="Şehir" value={city} onChangeText={setCity} />

              <Text style={styles.label}>Uygulama dili</Text>
              <View style={styles.languageGrid}>
                {languages.map(language => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageButton,
                      appLanguage === language.code && styles.languageButtonActive,
                    ]}
                    onPress={() => setAppLanguage(language.code)}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        appLanguage === language.code && styles.languageTextActive,
                      ]}
                    >
                      {language.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.disabledButton]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={exploreAsGuest}>
            <Text style={styles.guestButtonText}>Kayıt olmadan keşfet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface FieldProps {
  label: string
  value: string
  onChangeText: (value: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'sentences'
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#64748b"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 54 },
  logo: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },
  subtitle: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  modeRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 14, padding: 4, marginBottom: 20 },
  modeButton: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.teal },
  modeText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  form: { gap: 14 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageButton: {
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  languageButtonActive: { borderColor: colors.teal, backgroundColor: 'rgba(13,148,136,0.16)' },
  languageText: { color: '#94a3b8', fontSize: 13 },
  languageTextActive: { color: '#5eead4', fontWeight: '600' },
  primaryButton: {
    backgroundColor: colors.teal,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guestButton: { alignItems: 'center', paddingVertical: 12 },
  guestButtonText: { color: '#5eead4', fontSize: 15, fontWeight: '600' },
})
