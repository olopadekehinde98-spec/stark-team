import { Stack } from 'expo-router'
import { C } from '@/lib/colors'

export default function ActivitiesLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: C.navy }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="index"  options={{ title: 'Activities'      }} />
      <Stack.Screen name="submit" options={{ title: 'Submit Activity' }} />
    </Stack>
  )
}
