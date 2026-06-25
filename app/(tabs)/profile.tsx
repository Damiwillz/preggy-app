import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
  palette,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  palette: ReturnType<typeof useAppTheme>['palette'];
}) {
  return (
    <AnimatedPressable onPress={onPress} style={[styles.row, { borderBottomColor: palette.line }]}>
      <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={22} color={palette.accentStrong} />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.ink }]}>{label}</Text>
        {detail ? <Text style={[styles.rowDetail, { color: palette.text }]}>{detail}</Text> : null}
      </View>

      <View style={styles.rowAction}>
        {right ?? <Ionicons name="chevron-forward" size={20} color={palette.muted} />}
      </View>
    </AnimatedPressable>
  );
}

function formatDueDate(value?: string | null) {
  if (!value) return 'Not set';

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getProgress(week: number, days: number) {
  const pregnancyDay = Math.min(280, Math.max(0, (week - 1) * 7 + days));
  return Math.round((pregnancyDay / 280) * 100);
}

export default function ProfileScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [openingDetails, setOpeningDetails] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [heroAnim]);

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
  const progress = getProgress(week, days);

  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : fallbackAvatar;

  const pregnancyLabel = days > 0 ? `${week} weeks, ${days} days pregnant` : `${week} weeks pregnant`;

  function openProfileDetails() {
    if (openingDetails) return;

    setOpeningDetails(true);
    flipAnim.setValue(0);

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 720,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setOpeningDetails(false);
        return;
      }

      router.push('/profile/details' as never);

      setTimeout(() => {
        flipAnim.setValue(0);
        setOpeningDetails(false);
      }, 450);
    });
  }

  const heroAnimatedStyle = {
    opacity: heroAnim,
    backfaceVisibility: 'hidden' as const,
    transform: [
      {
        translateY: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: heroAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
      { perspective: 1400 },
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

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

      <AnimatedPressable onPress={openProfileDetails} disabled={openingDetails}>
        <Animated.View style={[styles.heroCard, heroAnimatedStyle, { backgroundColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />

            <View style={styles.editPill}>
              <Ionicons name="expand-outline" size={17} color={palette.onAccent} />
              <Text style={[styles.editPillText, { color: palette.onAccent }]}>Details</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>MY PROFILE</Text>
          <Text style={[styles.name, { color: palette.onAccent }]}>
            {loadingProfile ? 'Loading...' : displayName}
          </Text>
          <Text style={[styles.pregnant, { color: palette.onAccent }]}>♡ {pregnancyLabel}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>BABY</Text>
              <Text style={[styles.heroStatValue, { color: palette.onAccent }]}>{nickname}</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>DUE DATE</Text>
              <Text style={[styles.heroStatValue, { color: palette.onAccent }]}>{dueDate}</Text>
            </View>
          </View>
        </Animated.View>
      </AnimatedPressable>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.progressTop}>
          <View style={[styles.progressIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="calendar-outline" size={23} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.progressLabel, { color: palette.accent }]}>Pregnancy progress</Text>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>{progress}% complete</Text>
            <Text style={[styles.progressCopy, { color: palette.text }]}>Your profile is synced securely.</Text>
          </View>

          <View style={[styles.weekBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.weekBadgeText, { color: palette.accent }]}>{week}w</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${progress}%`, backgroundColor: palette.accent }]} />
        </View>
      </View>

      <Text style={[styles.section, { color: palette.text }]}>GENERAL SETTINGS</Text>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Row
          palette={palette}
          icon="person-circle-outline"
          label="Edit profile"
          detail="Name, baby nickname and due date"
          onPress={() => router.push('/edit-profile' as never)}
        />

        <Row
          palette={palette}
          icon="notifications-outline"
          label="Notification settings"
          detail="Manage appointment and medication reminders"
          onPress={() => router.push('/reminders' as never)}
        />

        <Row
          palette={palette}
          icon="lock-closed-outline"
          label="Data privacy"
          detail="Privacy controls and account deletion"
          onPress={() => router.push('/privacy' as never)}
        />

        <Row
          palette={palette}
          icon="moon-outline"
          label="Appearance"
          detail={`${scheme === 'dark' ? 'Dark' : 'Light'} mode active`}
          onPress={() => router.push('/appearance' as never)}
          right={<Text style={[styles.change, { color: palette.accentStrong, backgroundColor: palette.softSurface }]}>Change</Text>}
        />
      </View>

      <Text style={[styles.section, { color: palette.text }]}>SUPPORT & SAFETY</Text>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Row
          palette={palette}
          icon="sparkles-outline"
          label="Chat with Preggy AI"
          detail="Ask pregnancy and app questions"
          onPress={() => router.push('/ai-chat' as never)}
        />

        <Row
          palette={palette}
          icon="help-circle-outline"
          label="Help & FAQ"
          detail="Common questions and guidance"
          onPress={() => Alert.alert('Help & FAQ', 'Help content is coming next.')}
        />

        <Row
          palette={palette}
          icon="medkit-outline"
          label="Medical Disclaimer"
          detail="Preggy is not medical advice"
          onPress={() => router.push('/legal/medical-disclaimer' as never)}
        />

        <Row
          palette={palette}
          icon="mail-outline"
          label="Contact Support"
          detail="Get help or send feedback"
          onPress={() => router.push('/support/contact' as never)}
        />

        <Row
          palette={palette}
          icon="heart-outline"
          label="About Preggy"
          detail="Version, purpose and app information"
          onPress={() => router.push('/support/about' as never)}
        />
      </View>

      <View style={[styles.insight, { backgroundColor: palette.accentStrong }]}>
        <View style={styles.insightTop}>
          <Text style={[styles.insightBadge, { backgroundColor: palette.accentSoft, color: palette.accentStrong }]}>
            DAILY INSIGHT
          </Text>
          <Text style={styles.insightEmoji}>👶</Text>
        </View>

        <Text style={[styles.insightTitle, { color: palette.onAccent }]}>{nickname} is growing every day</Text>
        <Text style={[styles.insightCopy, { color: palette.onAccent }]}>
          Keep logging your symptoms, appointments, and routines so Preggy can help you stay organized.
        </Text>

        <AnimatedPressable
          onPress={() => router.push('/(tabs)/growth' as never)}
          style={[styles.learn, { backgroundColor: palette.surface }]}
        >
          <Text style={[styles.learnText, { color: palette.accentStrong }]}>View growth</Text>
          <Ionicons name="arrow-forward" size={18} color={palette.accentStrong} />
        </AnimatedPressable>
      </View>

      <AnimatedPressable
        onPress={handleLogout}
        style={[styles.logoutButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
      >
        <Ionicons name="log-out-outline" size={21} color={palette.danger} />
        <Text style={[styles.logoutText, { color: palette.danger }]}>Log out {firstName}</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 12,
    borderRadius: 30,
    padding: 20,
    minHeight: 260,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  editPill: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editPillText: {
    ...type.small,
    fontWeight: '900',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 17,
  },
  name: {
    ...type.title,
    fontSize: 30,
    lineHeight: 35,
    marginTop: 6,
  },
  pregnant: {
    ...type.bodyStrong,
    marginTop: 6,
    fontSize: 15,
  },
  heroStats: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  heroStatValue: {
    ...type.bodyStrong,
    marginTop: 5,
  },
  heroDivider: {
    width: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.26)',
    marginHorizontal: 14,
  },
  progressCard: {
    marginTop: 16,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#2A151B',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  progressTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  progressIcon: {
    width: 54,
    height: 54,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    ...type.section,
  },
  progressTitle: {
    ...type.title,
    fontSize: 24,
    marginTop: 3,
  },
  progressCopy: {
    ...type.small,
    marginTop: 3,
    fontWeight: '800',
  },
  weekBadge: {
    width: 56,
    height: 56,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  track: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 16,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  section: {
    ...type.section,
    marginTop: 22,
    marginBottom: 9,
  },
  card: {
    borderRadius: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  rowAction: {
    minWidth: 56,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...type.bodyStrong,
  },
  rowDetail: {
    ...type.small,
    marginTop: 2,
  },
  change: {
    ...type.small,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    fontWeight: '900',
  },
  insight: {
    marginTop: 18,
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
  },
  insightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    ...type.tiny,
    fontWeight: '900',
  },
  insightEmoji: {
    fontSize: 28,
  },
  insightTitle: {
    ...type.title,
    fontSize: 27,
    marginTop: 13,
  },
  insightCopy: {
    ...type.body,
    marginTop: 8,
    lineHeight: 23,
  },
  learn: {
    alignSelf: 'flex-start',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learnText: {
    ...type.bodyStrong,
  },
  logoutButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    ...type.bodyStrong,
  },
});
