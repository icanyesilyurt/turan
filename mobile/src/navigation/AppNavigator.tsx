import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
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

function SearchStack() {
  const { theme } = useApp()
  const c = getTheme(theme)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  )
}

function NotificationsStack() {
  const { theme } = useApp()
  const c = getTheme(theme)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  )
}

function MessagesStack() {
  const { theme } = useApp()
  const c = getTheme(theme)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
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
  const { t, theme, unreadNotifCount, unreadDmCount, isLoggedIn, tabBarVisible, fabVisible, setTabBarVisible } = useApp()
  const c = getTheme(theme)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)

  const tabBarTranslateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(tabBarTranslateY, {
      toValue: tabBarVisible ? 0 : 100,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [tabBarVisible])

  const fabTranslateY = tabBarTranslateY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 180],
  })

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
        tabBar={(props) => (
          <Animated.View style={[styles.tabBarWrapper, {
            transform: [{ translateY: tabBarTranslateY }],
          }]}>
            <View style={[styles.tabBarInner, {
              backgroundColor: c.bgSecondary,
              borderTopColor: c.border,
            }]}>
              {props.state.routes.map((route, index) => {
                const isFocused = props.state.index === index
                const color = isFocused ? colors.teal : c.textMuted
                const label = (props.descriptors[route.key].options.tabBarLabel as string) || route.name
                const badge = route.name === 'MessagesTab' && unreadDmCount > 0 ? unreadDmCount
                  : route.name === 'NotificationsTab' && unreadNotifCount > 0 ? unreadNotifCount
                  : undefined

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => {
                      setTabBarVisible(true)
                      const event = props.navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                      })
                      if (!isFocused && !event.defaultPrevented) {
                        props.navigation.navigate(route.name)
                      }
                    }}
                    onLongPress={() => {
                      props.navigation.emit({ type: 'tabLongPress', target: route.key })
                    }}
                    style={styles.tabBarItem}
                  >
                    <View>
                      <Text style={{ fontSize: 22, color }}>{tabIcons[route.name]}</Text>
                      {badge !== undefined && (
                        <View style={styles.tabBadge}>
                          <Text style={styles.tabBadgeText}>{badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.tabBarLabel, { color }]}>{label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </Animated.View>
        )}
      >
        <Tab.Screen name="HomeTab" options={{ tabBarLabel: t('tab_home') }}>
          {() => (
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
              <Stack.Screen name="HomeMain">
                {(props) => <HomeScreen {...props} onOpenDrawer={() => setDrawerOpen(true)} />}
              </Stack.Screen>
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
              <Stack.Screen name="CommentDetail" component={CommentDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
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

      {isLoggedIn && fabVisible && (
        <Animated.View style={[styles.fab, { transform: [{ translateY: fabTranslateY }] }]}>
          <TouchableOpacity
            style={styles.fabInner}
            activeOpacity={0.85}
            onPress={() => setComposeOpen(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </Animated.View>
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
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  tabBarInner: {
    height: 85,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 28,
    paddingTop: 8,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: colors.teal,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.teal,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 32,
  },
})
