import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.starkteam.app',
  appName: 'Stark Team',
  webDir: 'out',

  // Loads the live production URL instead of bundled files.
  // This keeps all server-side features (API routes, auth, etc.) working.
  server: {
    url: 'https://stark-team.vercel.app',
    cleartext: false,
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0F1C2E',
  },

  android: {
    allowMixedContent: false,
    backgroundColor: '#0F1C2E',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F1C2E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F1C2E',
    },
  },
}

export default config
