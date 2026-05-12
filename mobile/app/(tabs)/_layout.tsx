import { Tabs } from 'expo-router'
import { C } from '@/lib/colors'
import { Text } from 'react-native'

function Icon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Activities: '📋', Goals: '🎯', Leaderboard: '🏆', More: '⋯',
  }
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{icons[label]}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:    { backgroundColor: C.navy },
        headerTintColor: '#fff',
        headerTitleStyle:{ fontWeight: '700' },
        tabBarStyle:    { backgroundColor: C.navy, borderTopColor: 'rgba(255,255,255,0.1)', height: 70, paddingBottom: 8 },
        tabBarActiveTintColor:   C.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"       options={{ title: 'Home',        tabBarIcon: ({ focused }) => <Icon label="Home"        focused={focused} /> }} />
      <Tabs.Screen name="activities"  options={{ title: 'Activities',  tabBarIcon: ({ focused }) => <Icon label="Activities"  focused={focused} /> }} />
      <Tabs.Screen name="goals"       options={{ title: 'Goals',       tabBarIcon: ({ focused }) => <Icon label="Goals"       focused={focused} /> }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard', tabBarIcon: ({ focused }) => <Icon label="Leaderboard" focused={focused} /> }} />
      <Tabs.Screen name="more"        options={{ title: 'More',        tabBarIcon: ({ focused }) => <Icon label="More"        focused={focused} /> }} />
    </Tabs>
  )
}
