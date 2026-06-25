import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { getMyProfile, updateMyProfile } from '@/services/profile';

function cleanDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split('/');

  if (parts.length !== 3) return null;

  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];

  if (!month || !day || !year || year.length !== 4) return null;

  return `${year}-${month}-${day}`;
}

function getProgress(week: string, days: string) {
  const weekNumber = Math.max(1, Math.min(40, Number(week) || 1));
  const dayNumber = Math.max(0, Math.min(6, Number(days) || 0));
  const pregnancyDay = Math.min(280, Math.max(0, (weekNumber - 1) * 7 + dayNumber));

  return Math.round((pregnancyDay / 280) * 100);
}

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [babyNickname, setBabyNickname] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [pregnancyDays, setPregnancyDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const entrance = useRef(new Animated.Value(0)).current;

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const profile = await getMyProfile();

      setFullName(profile.full_name || '');
      setBabyNickname(profile.baby_nickname || '');
      setDueDate(profile.due_date || '');
      setPregnancyWeek(String(profile.pregnancy_week ?? 24));
      setPregnancyDays(String(profile.pregnancy_days ?? 0));
    } catch (error) {
      console.log('Edit profile load error:', error);
      Alert.alert('Profile unavailable', 'We could not load your profile right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const progress = getProgress(pregnancyWeek, pregnancyDays);
  const previewName = fullName.trim() || 'Mama';
  const previewBaby = babyNickname.trim() || 'Peanut';

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

  const saveProfile = async () => {
    try {
      setSaving(true);

      const nextDueDate = cleanDate(dueDate);

      if (dueDate.trim() && !nextDueDate) {
        Alert.alert('Invalid date', 'Use yyyy-mm-dd or mm/dd/yyyy for due date.');
        return;
      }

      const nextWeek = Math.max(1, Math.min(40, Number(pregnancyWeek) || 1));
      const nextDays = Math.max(0, Math.min(6, Number(pregnancyDays) || 0));

      await updateMyProfile({
        full_name: previewName,
        username: previewName,
        baby_nickname: previewBaby,
        due_date: nextDueDate,
        pregnancy_week: nextWeek,
        pregnancy_days: nextDays,
      });

      Alert.alert('Profile saved', 'Your profile has been updated.', [
        {
          text: 'View Profile',
          onPress: () => router.replace('/(tabs)/profile' as never),
        },
      ]);
    } catch (error) {
      console.log('Profile save error:', error);
      Alert.alert('Save failed', 'We could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen bottomSpace={44}>
      <Header title="Edit Profile" back />

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#CE6F79" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <Animated.View style={animatedStyle}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="person-circle-outline" size={38} color="#fff" />
            </View>

            <Text style={styles.eyebrow}>PROFILE SETUP</Text>
            <Text style={styles.title}>Personalize your Preggy journey</Text>
            <Text style={styles.subtitle}>
              Update your name, baby nickname, due date, and pregnancy progress.
            </Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewAvatar}>
              <Text style={styles.previewInitial}>{previewName.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
              <Text style={styles.previewName}>{previewName}</Text>
              <Text style={styles.previewCopy}>♡ {previewBaby} • {pregnancyWeek || '24'}w {pregnancyDays || '0'}d</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Field
              icon="person-outline"
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
            />

            <Field
              icon="heart-outline"
              label="Baby nickname"
              value={babyNickname}
              onChangeText={setBabyNickname}
              placeholder="Peanut"
            />

            <Field
              icon="calendar-outline"
              label="Due date"
              helper="Use yyyy-mm-dd or mm/dd/yyyy"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="2027-03-18"
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <View>
                  <Text style={styles.progressLabel}>PREGNANCY PROGRESS</Text>
                  <Text style={styles.progressTitle}>{progress}% complete</Text>
                </View>

                <View style={styles.weekBadge}>
                  <Text style={styles.weekBadgeText}>{pregnancyWeek || '24'}w</Text>
                </View>
              </View>

              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress}%` }]} />
              </View>

              <View style={styles.two}>
                <Field
                  icon="analytics-outline"
                  label="Week"
                  value={pregnancyWeek}
                  onChangeText={setPregnancyWeek}
                  placeholder="24"
                  keyboardType="number-pad"
                  compact
                />

                <Field
                  icon="calendar-number-outline"
                  label="Days"
                  value={pregnancyDays}
                  onChangeText={setPregnancyDays}
                  placeholder="0"
                  keyboardType="number-pad"
                  compact
                />
              </View>
            </View>

            <View style={styles.noteCard}>
              <Ionicons name="shield-checkmark-outline" size={21} color="#75595E" />
              <Text style={styles.noteText}>
                These details help personalize your dashboard, timeline, growth screen, and daily guidance.
              </Text>
            </View>

            <AnimatedPressable
              onPress={saveProfile}
              disabled={saving}
              style={[styles.saveButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={styles.saveText}>Save profile</Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

function Field({
  icon,
  label,
  helper,
  compact = false,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  helper?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation';
  compact?: boolean;
}) {
  return (
    <View style={[styles.field, compact && styles.compactField]}>
      <View style={styles.fieldTop}>
        <View style={styles.fieldIcon}>
          <Ionicons name={icon} size={19} color="#CE6F79" />
        </View>

        <View>
          <Text style={styles.label}>{label}</Text>
          {helper ? <Text style={styles.helper}>{helper}</Text> : null}
        </View>
      </View>

      <TextInput
        {...props}
        placeholderTextColor="#A98C93"
        style={styles.input}
      />
    </View>
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
    borderRadius: 34,
    padding: 24,
    minHeight: 255,
    justifyContent: 'center',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    color: '#fff',
    fontSize: 32,
    lineHeight: 37,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  previewCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  previewAvatar: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitial: {
    ...type.title,
    color: '#CE6F79',
    fontSize: 28,
  },
  previewLabel: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  previewName: {
    ...type.title,
    color: colors.ink,
    fontSize: 24,
    marginTop: 3,
  },
  previewCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    fontWeight: '800',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    padding: 20,
    marginTop: 16,
  },
  field: {
    marginBottom: 17,
  },
  compactField: {
    flex: 1,
    marginBottom: 0,
  },
  fieldTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.small,
    color: colors.ink,
    fontWeight: '900',
  },
  helper: {
    ...type.tiny,
    color: colors.text,
    marginTop: 1,
    fontWeight: '800',
  },
  input: {
    minHeight: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    color: colors.ink,
    ...type.body,
  },
  progressCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    marginBottom: 17,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  progressLabel: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  progressTitle: {
    ...type.title,
    color: colors.ink,
    fontSize: 24,
    marginTop: 4,
  },
  weekBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
    color: '#fff',
    fontSize: 17,
  },
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    marginTop: 16,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CE6F79',
  },
  two: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  noteCard: {
    backgroundColor: '#FFF0F1',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 17,
  },
  noteText: {
    ...type.small,
    color: '#6E555A',
    lineHeight: 20,
    flex: 1,
    fontWeight: '700',
  },
  saveButton: {
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.68,
  },
  saveText: {
    ...type.bodyStrong,
    color: '#fff',
  },
});
