import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useApp } from '../context/AppContext'
import { colors, getTheme } from '../styles/theme'

import HomeScreen from '../screens/HomeScreen'
import SearchScreen from '../screens/SearchScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import MessagesScreen from '../screens/MessagesScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SavedScreen from '../screens/SavedScreen'
import SettingsScreen from '../screens/SettingsScreen'
import PostDetailScreen from '../screens/PostDetailScreen'
import CommentDetailScreen from '../screens/CommentDetailScreen'
import ChatScreen from '../screens/ChatScreen'
import DraftsScreen from '../screens/DraftsScreen'
import DrawerMenu from '../components/DrawerMenu'
import ComposeModal from '../components/ComposeModal'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function HomeStack({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain">
        {(props) => <HomeScreen {...props} onOpenDrawer={onOpenDrawer} />}
      </Stack.Screen>
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  )
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  )
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  )
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  )
}

const tabIcons: Record<string, string> = {
  HomeTab: '🏠',
  SearchTab: '🔍',
  NotificationsTab: '🔔',
  MessagesTab: '✉',
}

export default function AppNavigator() {
  const { t, theme, conversations, unreadNotifCount, isLoggedIn } = useApp()
  const c = getTheme(theme)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unread_count, 0)

  const handleDrawerNavigate = (screen: string, navigation: any) => {
    if (screen === 'Profile') {
      navigation.navigate('HomeTab', { screen: 'Profile', params: {} })
    } else if (screen === 'Saved') {
      navigation.navigate('HomeTab', { screen: 'Saved' })
    } else if (screen === 'Settings') {
      navigation.navigate('HomeTab', { screen: 'Settings' })
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: c.bgSecondary,
            borderTopColor: c.border,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 28,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: c.textMuted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>{tabIcons[route.name]}</Text>
          ),
          tabBarBadge:
            route.name === 'MessagesTab' && totalUnread > 0 ? totalUnread
            : route.name === 'NotificationsTab' && unreadNotifCount > 0 ? unreadNotifCount
            : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.teal, color: '#fff', fontSize: 11 },
        })}
      >
        <Tab.Screen name="HomeTab" options={{ tabBarLabel: t('tab_home') }}>
          {() => (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="HomeMain">
                {(props) => <HomeScreen {...props} onOpenDrawer={() => setDrawerOpen(true)} />}
              </Stack.Screen>
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
              <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Saved" component={SavedScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Drafts" component={DraftsScreen} />
            </Stack.Navigator>
          )}
        </Tab.Screen>
        <Tab.Screen name="SearchTab" component={SearchStack} options={{ tabBarLabel: t('tab_search') }} />
        {isLoggedIn && (
          <>
            <Tab.Screen name="NotificationsTab" component={NotificationsStack} options={{ tabBarLabel: t('tab_notifications') }} />
            <Tab.Screen name="MessagesTab" component={MessagesStack} options={{ tabBarLabel: t('tab_messages') }} />
          </>
        )}
      </Tab.Navigator>

      {isLoggedIn && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setComposeOpen(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(screen) => {
          setDrawerOpen(false)
          const nav = (global as any).__turanNavRef
          if (nav) {
            if (screen === 'Profile') {
              nav.navigate('HomeTab', { screen: 'Profile', params: {} })
            } else if (screen === 'Saved') {
              nav.navigate('HomeTab', { screen: 'Saved' })
            } else if (screen === 'Settings') {
              nav.navigate('HomeTab', { screen: 'Settings' })
            } else if (screen === 'Drafts') {
              nav.navigate('HomeTab', { screen: 'Drafts' })
            }
          }
        }}
      />

      <ComposeModal
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 32,
  },
})
