import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { AppLanguage, Theme } from '../types'
import { colors, getTheme } from '../styles/theme'

const languageNames: { code: AppLanguage; name: string }[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'az', name: 'Azerbaycanca' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'ky', name: 'Кыргызча' },
  { code: 'uz', name: "O'zbekcha" },
  { code: 'tk', name: 'Türkmençe' },
]

export default function SettingsScreen({ navigation }: any) {
  const { t, theme, setTheme, language, setLanguage } = useApp()
  const c = getTheme(theme)

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('settings_title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t('theme')}</Text>
        <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {(['dark', 'light'] as Theme[]).map(th => (
            <TouchableOpacity
              key={th}
              style={[styles.option, { borderBottomColor: c.border }]}
              onPress={() => setTheme(th)}
            >
              <Text style={[styles.optionText, { color: c.text }]}>
                {th === 'dark' ? '🌙 ' : '☀ '}{t(`theme_${th}`)}
              </Text>
              {theme === th && <Text style={{ color: colors.teal, fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t('language')}</Text>
        <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          {languageNames.map(({ code, name }) => (
            <TouchableOpacity
              key={code}
              style={[styles.option, { borderBottomColor: c.border }]}
              onPress={() => setLanguage(code)}
            >
              <Text style={[styles.optionText, { color: c.text }]}>{name}</Text>
              {language === code && <Text style={{ color: colors.teal, fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>{t('notifications')}</Text>
        <View style={[styles.section, { backgroundColor: c.bgCard, borderColor: c.border }]}>
          <View style={[styles.option, { borderBottomColor: c.border }]}>
            <Text style={[styles.optionText, { color: c.text }]}>{t('daily_quote')}</Text>
            <Text style={{ color: colors.teal, fontSize: 14 }}>✓</Text>
          </View>
          <View style={[styles.option, { borderBottomColor: c.border }]}>
            <Text style={[styles.optionText, { color: c.text }]}>{t('daily_history')}</Text>
            <Text style={{ color: colors.teal, fontSize: 14 }}>✓</Text>
          </View>
          <View style={[styles.option, { borderBottomColor: c.border }]}>
            <Text style={[styles.optionText, { color: c.text }]}>{t('daily_personality')}</Text>
            <Text style={{ color: colors.teal, fontSize: 14 }}>✓</Text>
          </View>
          <View style={[styles.option, { borderBottomColor: c.border }]}>
            <Text style={[styles.optionText, { color: c.text }]}>{t('daily_news')}</Text>
            <Text style={{ color: colors.teal, fontSize: 14 }}>✓</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  section: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  optionText: { fontSize: 15 },
})
