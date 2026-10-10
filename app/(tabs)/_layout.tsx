import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import {
  CalculatorIcon,
  GrowthIcon,
  HomeIcon,
  ProfileIcon,
  TipsIcon,
} from '@/components/ui/icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/AppThemeContext';

const icons: Record<
  string,
  React.ComponentType<{
    size?: number;
    color?: string;
  }>
> = {
  home: HomeIcon,
  calculator: CalculatorIcon,
  growth: GrowthIcon,
  tips: TipsIcon,
  profile: ProfileIcon,
};

export default function TabLayout() {
  const { session, loading, isGuest } = useAuth();
  const { palette } = useAppTheme();

  useEffect(() => {
    if (!loading && !session && !isGuest) {
      router.replace('/auth/log-in');
    }
  }, [isGuest, loading, session]);

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: palette.canvas },
        ]}
      >
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  if (!session && !isGuest) {
    return null;
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name];

        return {
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: Platform.OS === 'ios' ? 16 : 12,
            height: 72,
            paddingTop: 8,
            paddingBottom: 9,
            paddingHorizontal: 7,
            backgroundColor: palette.tab,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: palette.line,
            borderRadius: 25,
            shadowColor: palette.ink,
            shadowOpacity: palette.isDark ? 0.26 : 0.1,
            shadowRadius: 24,
            shadowOffset: {
              width: 0,
              height: 10,
            },
            elevation: 12,
          },
          tabBarItemStyle: {
            borderRadius: 18,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '800',
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) =>
            Icon ? (
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: focused
                      ? palette.accentSoft
                      : 'transparent',
                  },
                ]}
              >
                <Icon
                  color={focused ? palette.accent : color}
                  size={20}
                />
              </View>
            ) : null,
        };
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="calculator"
        options={{ title: 'Due Date' }}
      />

      <Tabs.Screen
        name="growth"
        options={{ title: 'Growth' }}
      />

      <Tabs.Screen
        name="tips"
        options={{ title: 'Learn' }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />

      <Tabs.Screen
        name="appointments"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="log"
        options={{ href: null }}
      />
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
    width: 41,
    height: 31,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
