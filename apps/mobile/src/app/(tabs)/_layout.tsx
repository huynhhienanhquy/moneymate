import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.muted,
      tabBarStyle: { display: 'none' },
      tabBarLabelStyle: { fontSize: 10, paddingBottom: 9, fontWeight: '700' },
      tabBarItemStyle: { borderRadius: 16, marginHorizontal: 2 }
    }}>
      <Tabs.Screen name="index" options={{ title: 'Tổng quan', tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? 'view-dashboard' : 'view-dashboard-outline'} size={23} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title: 'Giao dịch', tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? 'receipt-text' : 'receipt-text-outline'} size={23} color={color} /> }} />
      <Tabs.Screen name="budgets" options={{ title: 'Ngân sách', tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? 'piggy-bank' : 'piggy-bank-outline'} size={23} color={color} /> }} />
      <Tabs.Screen name="advisor" options={{ title: 'AI', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="creation" size={24} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'Thêm', tabBarIcon: ({ color, focused }) => <MaterialCommunityIcons name={focused ? 'dots-grid' : 'dots-grid'} size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
