import { Stack } from 'expo-router'
import { C } from '@/lib/colors'

export default function GoalsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: C.navy }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' }, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="index"  options={{ title: 'Goals'       }} />
      <Stack.Screen name="create" options={{ title: 'Create Goal' }} />
    </Stack>
  )
}
