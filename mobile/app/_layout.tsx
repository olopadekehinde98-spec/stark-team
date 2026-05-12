import { useEffect, useRef } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '@/lib/auth'

SplashScreen.preventAutoHideAsync()

function NavGuard() {
  const { session, loading } = useAuth()
  const router    = useRouter()
  const segments  = useSegments()
  const segRef    = useRef(segments)
  segRef.current  = segments

  // Only re-run when auth state changes, NOT on every navigation
  useEffect(() => {
    if (loading) return
    const inAuth = segRef.current[0] === '(auth)'
    if (!session && !inAuth) router.replace('/(auth)/login')
    else if (session && inAuth) router.replace('/(tabs)')
  }, [session, loading])

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
