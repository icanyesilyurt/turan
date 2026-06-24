import React, { useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { AppProvider } from './src/context/AppContext'
import AppNavigator from './src/navigation/AppNavigator'

export default function App() {
  const navRef = useRef<NavigationContainerRef<any>>(null)

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
