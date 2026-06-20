import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, router } from 'expo-router';

import { colors } from '@/constants/colors';
import { HomeIcon, CalculatorIcon, GrowthIcon, TipsIcon, ProfileIcon } from '@/components/ui/icons';
import { useAuth } from '@/context/AuthContext';

const icons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  home: HomeIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
  tips: TipsIcon,
  profile: ProfileIcon,
};

export default function TabLayout() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth/log-in');
    }
  }, [loading, session]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.plum} />
      </View>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name];

        return {
          headerShown: false,
          tabBarActiveTintColor: colors.plum,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            height: 86,
            paddingTop: 8,
            paddingBottom: 22,
            backgroundColor: colors.tab,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => (Icon ? <Icon color={color} size={size} /> : null),
        };
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="calculator" options={{ title: 'Calculator' }} />
      <Tabs.Screen name="growth" options={{ title: 'Growth' }} />
      <Tabs.Screen name="tips" options={{ title: 'Tips' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="log" options={{ href: null }} />
    </Tabs>
  );
}