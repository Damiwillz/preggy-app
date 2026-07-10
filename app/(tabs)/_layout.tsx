import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Tabs, router } from 'expo-router';

import { HomeIcon, CalculatorIcon, GrowthIcon, TipsIcon, ProfileIcon } from '@/components/ui/icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/AppThemeContext';

const icons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  home: HomeIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
  tips: TipsIcon,
  profile: ProfileIcon,
};

export default function TabLayout() {
  const { session, loading } = useAuth();
  const { palette } = useAppTheme();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth/log-in');
    }
  }, [loading, session]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.canvas }]}>
        <ActivityIndicator color={palette.accent} />
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
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: {
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            height: 76,
            paddingTop: 10,
            paddingBottom: 12,
            paddingHorizontal: 8,
            backgroundColor: palette.tab,
            borderTopWidth: 0,
            borderRadius: 28,
            shadowColor: palette.ink,
            shadowOpacity: palette.isDark ? 0.22 : 0.1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          },
          tabBarItemStyle: {
            borderRadius: 22,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '900',
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) =>
            Icon ? (
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: focused ? palette.accentSoft : 'transparent',
                    borderColor: focused ? palette.line : 'transparent',
                  },
                ]}
              >
                <Icon color={focused ? palette.accent : color} size={21} />
              </View>
            ) : null,
        };
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="calculator" options={{ title: 'Due Date' }} />
      <Tabs.Screen name="growth" options={{ title: 'Growth' }} />
      <Tabs.Screen name="tips" options={{ title: 'Tips' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="log" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 42,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
