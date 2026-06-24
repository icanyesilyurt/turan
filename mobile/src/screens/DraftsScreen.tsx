import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function DraftsScreen({ navigation }: any) {
  const { t, theme, drafts, removeDraft } = useApp()
  const c = getTheme(theme)

  const handleDelete = (id: string) => {
    Alert.alert(
      t('compose_discard'),
      '',
      [
        { text: t('compose_dismiss'), style: 'cancel' },
        { text: t('compose_discard'), style: 'destructive', onPress: () => removeDraft(id) },
      ],
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { backgroundColor: c.bgSecondary, borderBottomColor: c.border }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.teal, fontSize: 16, fontWeight: '600' }}>← {t('back')}</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: c.text }]}>{t('drafts_title')}</Text>
        <View style={{ width: 50 }} />
      </View>

      {drafts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>{t('drafts_empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.draftItem, { borderBottomColor: c.border }]}>
              <TouchableOpacity style={styles.draftContent} activeOpacity={0.7}>
                <Text style={[styles.draftText, { color: c.text }]} numberOfLines={3}>
                  {item.text}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>
                  {timeAgo(item.created_at)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={{ color: colors.red, fontSize: 18 }}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  draftItem: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  draftContent: { flex: 1, padding: 16 },
  draftText: { fontSize: 15, lineHeight: 22 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 20 },
})
