import { Tabs } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { useAppTheme } from '@/theme';

/**
 * Define the authenticated tab navigator and its shared screen options.
 *
 * Use it as an Expo Router entry point so navigation resolves the correct application screen.
 * @returns The rendered tabs layout interface.
 */
export default function TabsLayout() {
  const { theme } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 10, paddingBottom: 9, fontWeight: '700' },
        tabBarItemStyle: { borderRadius: 16, marginHorizontal: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          /**
           * Tab bar icon for layout.
           *
           * Use it as an Expo Router entry point so navigation resolves the correct application screen.
           * @param props - The properties that configure this React component.
           * @returns The resulting layout value for the caller.
           */
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Giao dịch',
          /**
           * Tab bar icon for layout.
           *
           * Use it as an Expo Router entry point so navigation resolves the correct application screen.
           * @param props - The properties that configure this React component.
           * @returns The resulting layout value for the caller.
           */
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'receipt-text' : 'receipt-text-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Ngân sách',
          /**
           * Tab bar icon for layout.
           *
           * Use it as an Expo Router entry point so navigation resolves the correct application screen.
           * @param props - The properties that configure this React component.
           * @returns The resulting layout value for the caller.
           */
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'piggy-bank' : 'piggy-bank-outline'}
              size={23}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="advisor"
        options={{
          title: 'AI',
          /**
           * Tab bar icon for layout.
           *
           * Use it as an Expo Router entry point so navigation resolves the correct application screen.
           * @param props - The properties that configure this React component.
           * @returns The resulting layout value for the caller.
           */
          tabBarIcon: ({ color }) => (
            <AppIcon name="creation" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Thêm',
          /**
           * Tab bar icon for layout.
           *
           * Use it as an Expo Router entry point so navigation resolves the correct application screen.
           * @param props - The properties that configure this React component.
           * @returns The resulting layout value for the caller.
           */
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name={focused ? 'dots-grid' : 'dots-grid'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
