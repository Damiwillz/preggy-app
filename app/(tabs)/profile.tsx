import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppSwitch } from '@/components/ui/AppSwitch';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { signOut } from '@/services/auth';
import { getMyProfile, type UserProfile } from '@/services/profile';

const fallbackAvatar = require('../../assets/images/profile-avatar.jpg');

function Row({
  icon,
  label,
  detail,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color="#735D62" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>

      <View style={styles.rowAction}>
        {right ?? <Ionicons name="chevron-forward" size={20} color="#8A7E7E" />}
      </View>
    </AnimatedPressable>
  );
}

function formatDueDate(value?: string | null) {
  if (!value) return 'Not set';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const { palette, mode, accentColor } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const scheme = useColorScheme() ?? 'light';

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const nextProfile = await getMyProfile();
      setProfile(nextProfile);
    } catch {
      Alert.alert('Profile unavailable', 'We could not load your profile right now.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const displayName = profile?.full_name || 'Sarah Miller';
  const firstName = displayName.split(' ')[0] || 'Sarah';
  const week = profile?.pregnancy_week ?? 24;
  const days = profile?.pregnancy_days ?? 0;
  const nickname = profile?.baby_nickname || 'Peanut';
  const dueDate = formatDueDate(profile?.due_date);

  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : fallbackAvatar;

  const pregnancyLabel = days > 0 ? `${week} Weeks, ${days} Days Pregnant` : `${week} Weeks Pregnant`;

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/log-in');
    } catch {
      Alert.alert('Logout failed', 'Please try again.');
    }
  };

  return (
    <Screen bottomSpace={105}>
      <Header />

      <View style={styles.profile}>
        <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />

        <View style={styles.profileText}>
          <Text style={styles.name}>{loadingProfile ? 'Loading...' : displayName}</Text>
          <Text style={styles.pregnant}>♡ {pregnancyLabel}</Text>
        </View>
      </View>

      <View style={styles.two}>
        <View style={styles.info}>
          <Text style={styles.infoLabel}>DUE DATE</Text>
          <Text style={styles.infoValue}>{dueDate}</Text>
          <View style={styles.line} />
        </View>

        <View style={[styles.info, { backgroundColor: colors.softSurface }]}>
          <Text style={styles.infoLabel}>NICKNAME</Text>
          <Text style={styles.infoValue}>{nickname}</Text>
          <Text style={{ fontSize: 18, marginTop: 6 }}>👶</Text>
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.rowIcon}>
          <Ionicons name="calendar-outline" size={22} color="#735D62" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Pregnancy Progress</Text>
          <Text style={styles.rowDetail}>Your profile is synced securely</Text>
        </View>

        <Text style={styles.percent}>{week}w</Text>
      </View>

      <Text style={styles.section}>GENERAL SETTINGS</Text>

      <View style={styles.card}>
        <Row
          icon="person-circle-outline"
          label="Edit profile"
          detail="Name, baby nickname and due date"
          onPress={() => router.push('/edit-profile' as never)}
        />

        <Row
          icon="notifications-outline"
          label="Notification settings"
          detail="Manage appointment and medication reminders"
          onPress={() => router.push('/reminders' as never)}
        />

        <Row
          icon="lock-closed-outline"
          label="Data privacy"
          onPress={() => router.push('/privacy')}
        />

        <Row
          icon="moon-outline"
          label="Appearance"
          detail={`${scheme === 'dark' ? 'Dark' : 'Light'} Mode active`}
          onPress={() => router.push('/appearance')}
          right={<Text style={styles.change}>Change</Text>}
        />
      </View>

      <Text style={styles.section}>SUPPORT</Text>

      <View style={styles.card}>
        <Row
          icon="sparkles-outline"
          label="Chat with Preggy AI"
          onPress={() => router.push('/ai-chat')}
        />

        <Row icon="help-circle-outline" label="Help & FAQ" />

        <Row
          icon="medkit-outline"
          label="Medical Disclaimer"
          detail="Preggy is not medical advice"
          onPress={() => router.push('/legal/medical-disclaimer' as never)}
        />

        <Row
          icon="log-out-outline"
          label={`Log out ${firstName}`}
          onPress={handleLogout}
          right={<View />}
        />
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightBadge}>DAILY INSIGHT</Text>
        <Text style={styles.insightTitle}>{nickname} is now the size of a grapefruit!</Text>
        <Text style={styles.insightCopy}>
          Their hearing is becoming more acute, they can now hear your heartbeat and voice clearly.
        </Text>

        <AnimatedPressable
          onPress={() => Alert.alert('Daily Insight', 'More weekly insight content is coming next.')}
          style={styles.learn}
        >
          <Text style={styles.learnText}>Learn more</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFE7E8',
  },
  name: {
    ...type.title,
    fontSize: 29,
    color: colors.ink,
  },
  pregnant: {
    ...type.body,
    color: colors.text,
  },
  two: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  info: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
  },
  infoLabel: {
    ...type.section,
    color: '#6E5C60',
  },
  infoValue: {
    ...type.title,
    fontSize: 22,
    color: colors.ink,
    marginTop: 7,
  },
  line: {
    height: 3,
    borderRadius: 3,
    backgroundColor: '#8B7378',
    marginTop: 8,
    width: '70%',
  },
  progress: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 17,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percent: {
    ...type.body,
    fontSize: 20,
    color: '#614D53',
  },
  section: {
    ...type.section,
    color: '#6B565B',
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
  },
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E9E6',
    paddingVertical: 7,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  rowAction: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F9EEEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  rowDetail: {
    ...type.small,
    color: colors.text,
  },
  change: {
    ...type.body,
    color: '#725F64',
    backgroundColor: '#EFE6E1',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
  },
  insight: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: '#2C1609',
    padding: 24,
    overflow: 'hidden',
  },
  insightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE3DC',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 15,
    ...type.tiny,
    color: '#4F342A',
  },
  insightTitle: {
    ...type.title,
    fontSize: 26,
    color: '#fff',
    marginTop: 10,
  },
  insightCopy: {
    ...type.body,
    color: '#E9DBD5',
    marginTop: 8,
  },
  learn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 16,
  },
  learnText: {
    ...type.bodyStrong,
    color: '#4B3028',
  },
});