import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { getMyProfile, type UserProfile } from '@/services/profile';

const fallbackAvatar = require('../../assets/images/profile-avatar.jpg');

function formatDueDate(value?: string | null) {
  if (!value) return 'Not set';

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getProgress(week: number, days: number) {
  const pregnancyDay = Math.min(280, Math.max(0, (week - 1) * 7 + days));
  return Math.round((pregnancyDay / 280) * 100);
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={22} color="#CE6F79" />
      </View>

      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function ProfileDetailsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const entrance = useRef(new Animated.Value(0)).current;

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const nextProfile = await getMyProfile();
      setProfile(nextProfile);
    } catch {
      Alert.alert('Profile unavailable', 'We could not load your full profile right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const displayName = profile?.full_name || 'Sarah Miller';
  const username = profile?.username || displayName.split(' ')[0] || 'Sarah';
  const week = profile?.pregnancy_week ?? 24;
  const days = profile?.pregnancy_days ?? 0;
  const nickname = profile?.baby_nickname || 'Peanut';
  const dueDate = formatDueDate(profile?.due_date);
  const progress = getProgress(week, days);
  const pregnancyLabel = days > 0 ? `${week} weeks, ${days} days pregnant` : `${week} weeks pregnant`;

  const avatarSource: ImageSourcePropType = profile?.avatar_url
    ? { uri: profile.avatar_url }
    : fallbackAvatar;

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  };

  return (
    <Screen bottomSpace={44}>
      <Header title="Full Profile" back />

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#CE6F79" />
          <Text style={styles.loadingText}>Loading full profile...</Text>
        </View>
      ) : (
        <Animated.View style={animatedStyle}>
          <View style={styles.hero}>
            <View style={styles.glowCircle} />

            <Image source={avatarSource} style={styles.bigAvatar} resizeMode="cover" />

            <Text style={styles.eyebrow}>FULL PROFILE</Text>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.username}>@{username}</Text>

            <View style={styles.pregnancyPill}>
              <Ionicons name="heart" size={17} color="#fff" />
              <Text style={styles.pregnancyPillText}>{pregnancyLabel}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressLabel}>Pregnancy progress</Text>
                <Text style={styles.progressTitle}>{progress}% complete</Text>
              </View>

              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>{week}w</Text>
              </View>
            </View>

            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress}%` }]} />
            </View>

            <View style={styles.progressFooter}>
              <Text style={styles.progressMini}>Week 1</Text>
              <Text style={styles.progressMini}>Week 40</Text>
            </View>
          </View>

          <Text style={styles.section}>PROFILE DETAILS</Text>

          <View style={styles.grid}>
            <DetailCard icon="person-outline" label="Full name" value={displayName} />
            <DetailCard icon="at-outline" label="Username" value={`@${username}`} />
            <DetailCard icon="heart-outline" label="Baby nickname" value={nickname} />
            <DetailCard icon="calendar-outline" label="Due date" value={dueDate} />
            <DetailCard icon="analytics-outline" label="Pregnancy stage" value={`${week}w ${days}d`} />
            <DetailCard icon="shield-checkmark-outline" label="Profile status" value="Synced securely" />
          </View>

          <View style={styles.noteCard}>
            <View style={styles.noteIcon}>
              <Ionicons name="sparkles-outline" size={23} color="#CE6F79" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.noteTitle}>Preggy uses this profile to personalize your dashboard</Text>
              <Text style={styles.noteCopy}>
                Your due date, baby nickname, and pregnancy stage help update your timeline, growth screen, and daily guidance.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <AnimatedPressable onPress={() => router.push('/edit-profile' as never)} style={styles.primaryButton}>
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Edit profile</Text>
            </AnimatedPressable>

            <AnimatedPressable onPress={() => router.back()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    minHeight: 240,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
  },
  loadingText: {
    ...type.small,
    color: colors.text,
  },
  hero: {
    marginTop: 16,
    backgroundColor: '#CE6F79',
    borderRadius: 36,
    padding: 26,
    minHeight: 390,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bigAvatar: {
    width: 150,
    height: 150,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.58)',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 22,
  },
  name: {
    ...type.title,
    fontSize: 36,
    lineHeight: 42,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  username: {
    ...type.bodyStrong,
    color: '#FFF4F5',
    marginTop: 4,
  },
  pregnancyPill: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pregnancyPillText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  progressCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  progressLabel: {
    ...type.section,
    color: '#CE6F79',
  },
  progressTitle: {
    ...type.title,
    fontSize: 26,
    color: colors.ink,
    marginTop: 4,
  },
  weekBadge: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
    color: '#CE6F79',
    fontSize: 18,
  },
  track: {
    height: 13,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    overflow: 'hidden',
    marginTop: 18,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CE6F79',
  },
  progressFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMini: {
    ...type.tiny,
    color: colors.muted,
    fontWeight: '900',
  },
  section: {
    ...type.section,
    color: '#6B565B',
    marginTop: 24,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    minHeight: 145,
  },
  detailIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 13,
  },
  detailValue: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 5,
    lineHeight: 21,
  },
  noteCard: {
    marginTop: 16,
    backgroundColor: '#FFF0F1',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 14,
  },
  noteIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    lineHeight: 21,
  },
  noteCopy: {
    ...type.small,
    color: colors.text,
    lineHeight: 20,
    marginTop: 4,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1.25,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...type.bodyStrong,
    color: colors.plum,
  },
});
