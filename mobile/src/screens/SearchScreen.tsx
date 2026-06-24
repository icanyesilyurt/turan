import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { colors, getTheme } from '../styles/theme'
import { searchProfiles } from '../services/profileService'
import { Profile } from '../types'

const MAX_HISTORY = 10

function getHistoryKey(userId: string | null): string {
  return `turan:recent-searches:${userId ?? 'guest'}`
}

interface SearchHistoryItem {
  id: string
  display_name: string
  username: string
  avatar_url: string | null
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SearchScreen({ navigation }: any) {
  const { t, theme } = useApp()
  const { profile: currentProfile } = useAuth()
  const c = getTheme(theme)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = getHistoryKey(currentProfile?.id ?? null)

  useEffect(() => {
    loadHistory()
  }, [storageKey])

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey)
      if (raw) setHistory(JSON.parse(raw))
      else setHistory([])
    } catch {}
  }

  const saveHistory = async (items: SearchHistoryItem[]) => {
    setHistory(items)
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(items))
    } catch {}
  }

  const addToHistory = useCallback(
    (profile: Profile) => {
      const item: SearchHistoryItem = {
        id: profile.id,
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
      }
      const filtered = history.filter(h => h.id !== profile.id)
      const next = [item, ...filtered].slice(0, MAX_HISTORY)
      saveHistory(next)
    },
    [history],
  )

  const removeFromHistory = useCallback(
    (id: string) => {
      const next = history.filter(h => h.id !== id)
      saveHistory(next)
    },
    [history],
  )

  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const profiles = await searchProfiles(trimmed)
        setResults(profiles)
      } catch (err) {
        console.warn('Search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleProfilePress = (profile: Profile) => {
    addToHistory(profile)
    navigation.navigate('Profile', { userId: profile.id })
  }

  const handleHistoryPress = (item: SearchHistoryItem) => {
    navigation.navigate('Profile', { userId: item.id })
  }

  const showResults = query.trim().length >= 2

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: c.bgSecondary, borderBottomColor: c.border },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: c.bgInput }]}>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={c.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: '600' }}>
                X
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!showResults ? (
        history.length > 0 ? (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>
                {t('recent_searches')}
              </Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={{ color: colors.teal, fontSize: 14, fontWeight: '600' }}>
                  {t('clear_all')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {history.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => handleHistoryPress(item)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={styles.historyRemove}
                    onPress={() => removeFromHistory(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700' }}>
                      X
                    </Text>
                  </TouchableOpacity>
                  {item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={styles.historyAvatar}
                    />
                  ) : (
                    <View style={[styles.historyAvatarFallback, { backgroundColor: colors.teal }]}>
                      <Text style={styles.historyAvatarText}>
                        {getInitials(item.display_name)}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[styles.historyName, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {item.display_name}
                  </Text>
                  <Text
                    style={{ color: c.textMuted, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    @{item.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={{ color: c.textMuted, fontSize: 14 }}>
              {t('no_search_history')}
            </Text>
          </View>
        )
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <Text style={[styles.resultHeader, { color: c.textMuted }]}>
              {t('search_users')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.userItem, { borderBottomColor: c.border }]}
              onPress={() => handleProfilePress(item)}
            >
              {item.avatar_url ? (
                <Image
                  source={{ uri: item.avatar_url }}
                  style={styles.userAvatarImg}
                />
              ) : (
                <View style={[styles.userAvatar, { backgroundColor: colors.teal }]}>
                  <Text style={styles.userAvatarText}>
                    {getInitials(item.display_name)}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text
                  style={[styles.userName, { color: c.text }]}
                  numberOfLines={1}
                >
                  {item.display_name}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ color: c.textMuted, fontSize: 15 }}>
            {t('no_content')}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, height: 40 },
  historySection: { paddingTop: 20 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  historyScroll: { paddingHorizontal: 12, gap: 4 },
  historyCard: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  historyRemove: {
    position: 'absolute',
    top: 6,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  historyAvatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 6 },
  historyAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  historyAvatarText: { color: '#fff', fontWeight: '700', fontSize: 20 },
  historyName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  resultHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 16,
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  userAvatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
})
