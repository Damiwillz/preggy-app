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
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
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
        <Animated.View style={[styles.heroCard, heroAnimatedStyle]}>
          <View style={styles.heroTop}>
            <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />

            <View style={styles.editPill}>
              <Ionicons name="expand-outline" size={17} color="#fff" />
              <Text style={styles.editPillText}>Details</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>MY PROFILE</Text>
          <Text style={styles.name}>{loadingProfile ? 'Loading...' : displayName}</Text>
          <Text style={styles.pregnant}>♡ {pregnancyLabel}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>BABY</Text>
              <Text style={styles.heroStatValue}>{nickname}</Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>DUE DATE</Text>
              <Text style={styles.heroStatValue}>{dueDate}</Text>
            </View>
          </View>
        </Animated.View>
      </AnimatedPressable>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View style={styles.progressIcon}>
            <Ionicons name="calendar-outline" size={23} color="#CE6F79" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.progressLabel}>Pregnancy progress</Text>
            <Text style={styles.progressTitle}>{progress}% complete</Text>
            <Text style={styles.progressCopy}>Your profile is synced securely.</Text>
          </View>

          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>{week}w</Text>
          </View>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
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
          detail="Privacy controls and account deletion"
          onPress={() => router.push('/privacy' as never)}
        />

        <Row
          icon="moon-outline"
          label="Appearance"
          detail={`${scheme === 'dark' ? 'Dark' : 'Light'} mode active`}
          onPress={() => router.push('/appearance' as never)}
          right={<Text style={styles.change}>Change</Text>}
        />
      </View>

      <Text style={styles.section}>SUPPORT & SAFETY</Text>

      <View style={styles.card}>
        <Row
          icon="sparkles-outline"
          label="Chat with Preggy AI"
          detail="Ask pregnancy and app questions"
          onPress={() => router.push('/ai-chat' as never)}
        />

        <Row
          icon="help-circle-outline"
          label="Help & FAQ"
          detail="Common questions and guidance"
          onPress={() => Alert.alert('Help & FAQ', 'Help content is coming next.')}
        />

        <Row
          icon="medkit-outline"
          label="Medical Disclaimer"
          detail="Preggy is not medical advice"
          onPress={() => router.push('/legal/medical-disclaimer' as never)}
        />

        <Row
          icon="mail-outline"
          label="Contact Support"
          detail="Get help or send feedback"
          onPress={() => router.push('/support/contact' as never)}
        />

        <Row
          icon="heart-outline"
          label="About Preggy"
          detail="Version, purpose and app information"
          onPress={() => router.push('/support/about' as never)}
        />
      </View>

      <View style={styles.insight}>
        <View style={styles.insightTop}>
          <Text style={styles.insightBadge}>DAILY INSIGHT</Text>
          <Text style={styles.insightEmoji}>👶</Text>
        </View>

        <Text style={styles.insightTitle}>{nickname} is growing every day</Text>
        <Text style={styles.insightCopy}>
          Keep logging your symptoms, appointments, and routines so Preggy can help you stay organized.
        </Text>

        <AnimatedPressable
          onPress={() => router.push('/(tabs)/growth' as never)}
          style={styles.learn}
        >
          <Text style={styles.learnText}>View growth</Text>
          <Ionicons name="arrow-forward" size={18} color="#4B3028" />
        </AnimatedPressable>
      </View>

      <AnimatedPressable onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={21} color="#B84D57" />
        <Text style={styles.logoutText}>Log out {firstName}</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 12,
    backgroundColor: '#CE6F79',
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
    color: '#fff',
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
    color: '#fff',
    marginTop: 6,
  },
  pregnant: {
    ...type.bodyStrong,
    color: '#FFF4F5',
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
    color: '#fff',
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
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
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
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    ...type.section,
    color: '#CE6F79',
  },
  progressTitle: {
    ...type.title,
    color: colors.ink,
    fontSize: 24,
    marginTop: 3,
  },
  progressCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    fontWeight: '800',
  },
  weekBadge: {
    width: 56,
    height: 56,
    borderRadius: 21,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
    color: '#CE6F79',
    fontSize: 17,
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    overflow: 'hidden',
    marginTop: 16,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CE6F79',
  },
  section: {
    ...type.section,
    color: '#6B565B',
    marginTop: 22,
    marginBottom: 9,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    overflow: 'hidden',
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E9E6',
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
    backgroundColor: '#FFF0F1',
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
    marginTop: 2,
  },
  change: {
    ...type.small,
    color: '#725F64',
    backgroundColor: '#EFE6E1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    fontWeight: '900',
  },
  insight: {
    marginTop: 18,
    borderRadius: 30,
    backgroundColor: '#2C1609',
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
    backgroundColor: '#FFE3DC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    ...type.tiny,
    color: '#4F342A',
    fontWeight: '900',
  },
  insightEmoji: {
    fontSize: 28,
  },
  insightTitle: {
    ...type.title,
    fontSize: 27,
    color: '#fff',
    marginTop: 13,
  },
  insightCopy: {
    ...type.body,
    color: '#E9DBD5',
    marginTop: 8,
    lineHeight: 23,
  },
  learn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
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
    color: '#4B3028',
  },
  logoutButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 22,
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#F1C9CD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  logoutText: {
    ...type.bodyStrong,
    color: '#B84D57',
  },
});
