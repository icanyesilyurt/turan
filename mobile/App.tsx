import React, { useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { AppProvider } from './src/context/AppContext'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'
import AuthScreen from './src/screens/AuthScreen'

function AppContent() {
  const navRef = useRef<NavigationContainerRef<any>>(null)
  const { session, loading, guestMode } = useAuth()

  if (loading) return null
  if (!session && !guestMode) return <AuthScreen />

  return (
    <AppProvider>
      <NavigationContainer
        ref={navRef}
        onReady={() => { (global as any).__turanNavRef = navRef.current }}
      >
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
