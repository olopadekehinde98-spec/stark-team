import { Stack } from 'expo-router'
import { C } from '@/lib/colors'

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.navy },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Screen name="index"         options={{ title: 'More'          }} />
      <Stack.Screen name="profile"       options={{ title: 'Profile'       }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="team"          options={{ title: 'Team'          }} />
      <Stack.Screen name="recognition"   options={{ title: 'Recognition'   }} />
      <Stack.Screen name="settings"      options={{ title: 'Settings'      }} />
    </Stack>
  )
}
