import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { signOut } from '@/services/auth';
import { getMyProfile, type UserProfile } from '@/services/profile';
import { supabase } from '@/lib/supabase';

type ProfileAction = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route?: string;
  danger?: boolean;
  onPress?: () => void;
};

function getInitials(name?: string | null) {
  if (!name) return 'M';

  const parts = name.split(' ').filter(Boolean);

  if (parts.length === 0) return 'M';

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const { palette, mode, accentColor } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadProfile() {
    const [profileData, userResult] = await Promise.all([
      getMyProfile(),
      supabase.auth.getUser(),
    ]);

    setProfile(profileData);
    setEmail(userResult.data.user?.email ?? '');
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      loadProfile()
        .catch((error) => {
          console.log('Profile load error:', error);
          Alert.alert('Profile', 'Could not load your profile.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out of Preggy?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);

          try {
            await signOut();
            router.replace('/auth/log-in' as never);
          } catch (error) {
            console.log('Logout error:', error);
            Alert.alert('Log out', 'Could not log out. Please try again.');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  const actions: ProfileAction[] = [
    {
      icon: 'person-circle-outline',
      title: 'Edit profile',
      copy: 'Name, baby nickname, due date, week and day',
      route: '/edit-profile',
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      copy: 'Medication and appointment reminders',
      route: '/reminders',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Data Privacy',
      copy: 'Privacy controls, biometric lock and data export',
      route: '/privacy',
    },
    {
      icon: 'color-palette-outline',
      title: 'Appearance',
      copy: `${mode} mode • ${accentColor} accent`,
      route: '/appearance',
    },
    {
      icon: 'sparkles-outline',
      title: 'Preggy AI',
      copy: 'Ask questions about pregnancy wellness',
      route: '/ai-chat',
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      copy: 'Get answers and contact support',
      route: '/support',
    },
    {
      icon: 'log-out-outline',
      title: 'Log out',
      copy: 'Sign out of your account',
      danger: true,
      onPress: handleLogout,
    },
  ];

  return (
    <Screen bottomSpace={120}>
      <Header />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>ACCOUNT</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Manage your pregnancy profile, privacy, reminders, and app preferences.
        </Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.text }]}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.avatarWrap, { backgroundColor: palette.accentSoft }]}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.initials, { color: palette.accent }]}>{getInitials(profile?.full_name)}</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: palette.ink }]}>
                {profile?.full_name || 'Mama'}
              </Text>

              <Text style={[styles.email, { color: palette.text }]}>
                {email || profile?.username || 'Preggy account'}
              </Text>

              <View style={styles.profileMeta}>
                <View style={[styles.metaPill, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name="heart" size={14} color={palette.accent} />
                  <Text style={[styles.metaText, { color: palette.accent }]}>
                    {profile?.baby_nickname || 'Baby'}
                  </Text>
                </View>

                <View style={[styles.metaPill, { backgroundColor: palette.softSurface }]}>
                  <Ionicons name="calendar" size={14} color={palette.muted} />
                  <Text style={[styles.metaText, { color: palette.text }]}>
                    Week {profile?.pregnancy_week ?? 24}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={[styles.statsCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <ProfileStat label="Baby" value={profile?.baby_nickname || 'Baby'} />
        <View style={[styles.statDivider, { backgroundColor: palette.line }]} />
        <ProfileStat label="Week" value={`${profile?.pregnancy_week ?? 24}`} />
        <View style={[styles.statDivider, { backgroundColor: palette.line }]} />
        <ProfileStat label="Day" value={`${profile?.pregnancy_days ?? 0}`} />
      </View>

      <View style={styles.actions}>
        {actions.map((action) => (
          <AnimatedPressable
            key={action.title}
            onPress={() => {
              if (action.onPress) {
                action.onPress();
                return;
              }

              if (action.route) {
                router.push(action.route as never);
              }
            }}
            disabled={loggingOut}
            style={[
              styles.actionRow,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                opacity: loggingOut && action.danger ? 0.6 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: action.danger ? palette.danger + '22' : palette.accentSoft,
                },
              ]}
            >
              {loggingOut && action.danger ? (
                <ActivityIndicator color={palette.danger} />
              ) : (
                <Ionicons
                  name={action.icon}
                  size={24}
                  color={action.danger ? palette.danger : palette.accent}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: action.danger ? palette.danger : palette.ink }]}>
                {action.title}
              </Text>
              <Text style={[styles.actionCopy, { color: palette.text }]}>{action.copy}</Text>
            </View>

            {!action.danger && <Ionicons name="chevron-forward" size={22} color={palette.muted} />}
          </AnimatedPressable>
        ))}
      </View>

      <Text style={[styles.version, { color: palette.muted }]}>Preggy App • Live Supabase build</Text>
    </Screen>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: palette.ink }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 22,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 31,
    marginTop: 3,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 7,
  },
  profileCard: {
    minHeight: 132,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    ...type.title,
    fontSize: 30,
  },
  name: {
    ...type.bodyStrong,
    fontSize: 22,
  },
  email: {
    ...type.small,
    marginTop: 4,
  },
  profileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...type.tiny,
    fontWeight: '900',
  },
  statsCard: {
    minHeight: 88,
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  statLabel: {
    ...type.tiny,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 42,
  },
  actions: {
    gap: 12,
  },
  actionRow: {
    minHeight: 82,
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  actionCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 4,
  },
  version: {
    ...type.tiny,
    textAlign: 'center',
    marginTop: 22,
  },
});
