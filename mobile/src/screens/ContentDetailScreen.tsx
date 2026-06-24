import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'

export default function ContentDetailScreen({ route, navigation }: any) {
  const item = route.params?.item
  const { t, theme } = useApp()
  const c = getTheme(theme)

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: c.textMuted }}>{t('no_content')}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {item.category_id && (
          <View style={[styles.badge, { backgroundColor: colors.tealGlow }]}>
            <Text style={[styles.badgeText, { color: colors.teal }]}>{item.category_id}</Text>
          </View>
        )}
        <Text style={[styles.title, { color: c.text }]}>{item.title || ''}</Text>
        {item.published_at && (
          <Text style={[styles.date, { color: c.textMuted }]}>
            {new Date(item.published_at).toLocaleDateString('tr-TR')}
          </Text>
        )}
        <Text style={[styles.content, { color: c.textSecondary }]}>{item.content || item.text || ''}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  scroll: { padding: 20 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 32, marginBottom: 8 },
  date: { fontSize: 13, marginBottom: 20 },
  content: { fontSize: 16, lineHeight: 28 },
})
