import { useEffect, useRef, useState } from 'react'
import {
  BackHandler, Platform, StatusBar, StyleSheet,
  Text, ToastAndroid, TouchableOpacity, View, ActivityIndicator, Image,
} from 'react-native'
import { WebView } from 'react-native-webview'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

const APP_URL = 'https://starkteam.info'
const NAVY    = '#0F1C2E'
const GOLD    = '#D4A017'

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

async function getExpoPushToken(): Promise<string | null> {
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

export default function App() {
  const webviewRef      = useRef<WebView>(null)
  const canGoBackRef    = useRef(false)
  const lastBackTime    = useRef(0)
  const expoPushToken   = useRef<string | null>(null)  // token obtained from Expo
  const webviewReady    = useRef(false)                // true once onLoadEnd fires

  const [navUrl,  setNavUrl]  = useState(APP_URL)
  const [error,   setError]   = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Get Expo push token on mount (does NOT call any server — just Expo SDK) ─
  useEffect(() => {
    getExpoPushToken().then(token => {
      if (!token) return
      expoPushToken.current = token
      // If WebView already finished loading, inject immediately
      if (webviewReady.current) injectTokenRegistration(token)
    })
  }, [])

  // ── Inject the token into the WebView so it registers with session cookies ──
  function injectTokenRegistration(token: string) {
    const device = `${Platform.OS} ${Device.modelName ?? ''}`.trim()
    // Language: plain JS injected into the page.
    // Uses the page's own fetch() which has the session cookie — no 401.
    // Retries up to 10 times with 3-second gaps (handles case where user is
    // still on the login page when the app first opens).
    const js = `
      (function() {
        var token  = ${JSON.stringify(token)};
        var device = ${JSON.stringify(device)};
        var attempts = 0;
        function register() {
          attempts++;
          fetch('/api/push/register-expo-token', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, device: device }),
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if ((data.error === 'Unauthorized' || data.error === 'Forbidden') && attempts < 10) {
              setTimeout(register, 3000);
            }
          })
          .catch(function() {
            if (attempts < 10) setTimeout(register, 3000);
          });
        }
        register();
        true;
      })();
      true;
    `
    webviewRef.current?.injectJavaScript(js)
  }

  // ── Navigate WebView when a notification is tapped ─────────────────────────
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

  // ── Android back button — double-tap to exit ────────────────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webviewRef.current?.goBack()
        return true
      }
      const now = Date.now()
      if (now - lastBackTime.current < 2000) return false
      lastBackTime.current = now
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT)
      return true
    })
    return () => handler.remove()
  }, [])

  // ── JS injected before page content loads ──────────────────────────────────
  // Tells the website it's running inside the native app, and exposes a hook
  // so the site can trigger push re-registration if needed.
  const injectedJSBeforeLoad = `
    (function() {
      window.starkTeamNative = {
        platform: '${Platform.OS}',
        reRegisterPush: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reregister' }));
        },
      };
      true;
    })();
    true;
  `

  function handleLoadEnd() {
    setLoading(false)
    webviewReady.current = true
    // Register push token now that the page has session cookies available
    if (expoPushToken.current) {
      injectTokenRegistration(expoPushToken.current)
    }
  }

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
              return (
                url.startsWith('https://starkteam.info') ||
                url.startsWith('http://starkteam.info') ||
                url.startsWith('about:') ||
                url.startsWith('blob:')
              )
            }}

            onNavigationStateChange={state => {
              canGoBackRef.current = state.canGoBack
            }}

            onLoadStart={() => { setLoading(true); webviewReady.current = false }}
            onLoadEnd={handleLoadEnd}
            onError={() => { setLoading(false); setError(true) }}
            onHttpError={({ nativeEvent }) => {
              if (nativeEvent.statusCode >= 500) { setLoading(false); setError(true) }
            }}

            onMessage={msg => {
              try {
                const data = JSON.parse(msg.nativeEvent.data)
                if (data.type === 'reregister') {
                  // Website requested a push re-register — get fresh token and inject
                  getExpoPushToken().then(token => {
                    if (token) {
                      expoPushToken.current = token
                      injectTokenRegistration(token)
                    }
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
            applicationNameForUserAgent="StarkTeamApp/1.0"

            // Media
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            pullToRefreshEnabled
            injectedJavaScriptBeforeContentLoaded={injectedJSBeforeLoad}
          />

          {/* Branded splash — shown while page is loading */}
          {loading && (
            <View style={s.loadingOverlay}>
              <Image
                source={require('./assets/icon.png')}
                style={s.splashLogo}
                resizeMode="contain"
              />
              <Text style={s.splashTitle}>Stark Team</Text>
              <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 32 }} />
              <Text style={s.loadingText}>Loading…</Text>
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
  splashLogo: {
    width: 90, height: 90, borderRadius: 18, marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5,
  },
  loadingText: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 10,
  },

  errorWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: NAVY },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  errorBody:  { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retryBtn:   { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, backgroundColor: GOLD },
  retryTxt:   { fontSize: 15, fontWeight: '700', color: NAVY },
})
