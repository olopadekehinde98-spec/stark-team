import { useEffect, useRef, useState } from 'react'
import {
  BackHandler, Platform, StatusBar, StyleSheet,
  Text, ToastAndroid, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

const APP_URL  = 'https://starkteam.info'
const API_BASE = 'https://starkteam.info'
const NAVY     = '#0F1C2E'
const GOLD     = '#D4A017'

// Show notifications even when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
})

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'Stark Team',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       GOLD,
      sound:            'default',
      showBadge:        true,
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return null

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) return null

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  return token
}

async function sendTokenToServer(token: string) {
  try {
    await fetch(`${API_BASE}/api/push/register-expo-token`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({
        token,
        device: `${Platform.OS} ${Device.modelName ?? ''}`.trim(),
      }),
    })
  } catch { /* best-effort */ }
}

export default function App() {
  const webviewRef   = useRef<WebView>(null)
  const canGoBackRef = useRef(false)         // ref so back handler always has latest value
  const lastBackTime = useRef(0)             // for double-tap-to-exit
  const [navUrl,     setNavUrl]    = useState(APP_URL)
  const [error,      setError]     = useState(false)
  const [loading,    setLoading]   = useState(true)

  // Register push token on mount
  useEffect(() => {
    let active = true
    ;(async () => {
      const token = await registerForPushNotificationsAsync()
      if (!token || !active) return
      await sendTokenToServer(token)
      // Retry after 6s in case auth session wasn't ready
      setTimeout(() => { if (active) sendTokenToServer(token) }, 6000)
    })()
    return () => { active = false }
  }, [])

  // Navigate WebView when a notification is tapped
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(res => {
      const url = res.notification.request.content.data?.url as string | undefined
      if (url) {
        const full = url.startsWith('http') ? url : `${APP_URL}${url}`
        setNavUrl(full)
        setError(false)
      }
    })
    return () => sub.remove()
  }, [])

  // Android hardware back button — double-tap to exit, otherwise navigate back
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webviewRef.current?.goBack()
        return true   // handled — don't close app
      }
      // Double-tap within 2 seconds to exit
      const now = Date.now()
      if (now - lastBackTime.current < 2000) {
        return false  // let Android close the app
      }
      lastBackTime.current = now
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
      return true     // first tap — stay in app
    })
    return () => handler.remove()
  }, [])

  // JS injected so the website knows it's running inside the native app
  const injectedJS = `
    (function() {
      window.starkTeamNative = {
        platform: '${Platform.OS}',
        reRegisterPush: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reregister' }))
        },
      };
      true;
    })();
  `

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {error ? (
        <View style={s.errorWrap}>
          <Text style={s.errorTitle}>No Connection</Text>
          <Text style={s.errorBody}>Check your internet and try again.</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => { setError(false); setLoading(true); webviewRef.current?.reload() }}
          >
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <WebView
            ref={webviewRef}
            source={{ uri: navUrl }}
            style={s.webview}

            // Keep all starkteam.info links inside the app
            onShouldStartLoadWithRequest={req => {
              const url = req.url
              if (
                url.startsWith('https://starkteam.info') ||
                url.startsWith('http://starkteam.info') ||
                url.startsWith('about:') ||
                url.startsWith('blob:')
              ) return true
              // External URLs — block (prevent leaving the app)
              return false
            }}

            onNavigationStateChange={state => {
              canGoBackRef.current = state.canGoBack
            }}

            onLoadStart={() => setLoading(true)}
            onLoadEnd={()   => setLoading(false)}
            onError={()     => { setLoading(false); setError(true) }}
            onHttpError={({ nativeEvent }) => {
              if (nativeEvent.statusCode >= 500) {
                setLoading(false); setError(true)
              }
            }}

            onMessage={msg => {
              try {
                const data = JSON.parse(msg.nativeEvent.data)
                if (data.type === 'reregister') {
                  registerForPushNotificationsAsync().then(token => {
                    if (token) sendTokenToServer(token)
                  })
                }
              } catch {}
            }}

            // Session & storage
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            javaScriptEnabled

            // Performance
            cacheEnabled
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            setSupportMultipleWindows={false}

            // Media
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            pullToRefreshEnabled
            injectedJavaScriptBeforeContentLoaded={injectedJS}
          />

          {/* Loading overlay — shown while page is loading */}
          {loading && (
            <View style={s.loadingOverlay}>
              <View style={s.loadingCard}>
                <ActivityIndicator size="large" color={GOLD} />
                <Text style={s.loadingText}>Loading Stark Team…</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: NAVY },
  webview: { flex: 1, backgroundColor: NAVY },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: NAVY,
  },
  loadingCard: {
    alignItems: 'center', gap: 16,
  },
  loadingText: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600',
  },

  errorWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: NAVY },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  errorBody:  { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retryBtn:   { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, backgroundColor: GOLD },
  retryTxt:   { fontSize: 15, fontWeight: '700', color: NAVY },
})
