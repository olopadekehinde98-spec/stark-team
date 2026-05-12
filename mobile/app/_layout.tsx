import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/lib/auth'

SplashScreen.preventAutoHideAsync()

function NavGuard() {
  const { session, loading } = useAuth()
  const segments  = useSegments()
  const router    = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) router.replace('/(auth)/login')
    else if (session && inAuth) router.replace('/(tabs)')
  }, [session, loading, segments])

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync()
  }, [loading])

  return <Slot />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavGuard />
    </AuthProvider>
  )
}
