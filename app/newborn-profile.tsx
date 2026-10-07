import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type FeedingPreference =
  | 'Breastfeeding'
  | 'Bottle'
  | 'Combination'
  | 'Not decided';

type NewbornProfile = {
  babyName: string;
  birthDate: string;
  birthWeight: string;
  feedingPreference: FeedingPreference;
  createdAt: number;
};

const PROFILE_KEY = 'preggy:newborn-profile';
const MODE_KEY = 'preggy:app-mode';

const feedingOptions: FeedingPreference[] = [
  'Breastfeeding',
  'Bottle',
  'Combination',
  'Not decided',
];

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime());
}

function formatDate(value: string) {
  if (!validDate(value)) return value;

  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NewbornProfileScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<NewbornProfile | null>(null);
  const [newbornMode, setNewbornMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthWeight, setBirthWeight] = useState('');
  const [feedingPreference, setFeedingPreference] =
    useState<FeedingPreference>('Not decided');

  useEffect(() => {
    async function loadProfile() {
      try {
        const values = await AsyncStorage.multiGet([
          PROFILE_KEY,
          MODE_KEY,
        ]);

        const savedProfile = values[0]?.[1];
        const savedMode = values[1]?.[1];

        if (savedProfile) {
          const parsed = JSON.parse(savedProfile) as NewbornProfile;

          setProfile(parsed);
          setBabyName(parsed.babyName);
          setBirthDate(parsed.birthDate);
          setBirthWeight(parsed.birthWeight);
          setFeedingPreference(parsed.feedingPreference);
        } else {
          setShowForm(true);
        }

        setNewbornMode(savedMode === 'newborn');
      } catch (error) {
        console.log('Newborn profile load error:', error);
      } finally {
        setLoaded(true);
      }
    }

    void loadProfile();
  }, []);

  async function saveProfile() {
    const cleanName = babyName.trim();
    const cleanDate = birthDate.trim();

    if (!cleanName) {
      Alert.alert('Add baby’s name', 'Enter baby’s name before continuing.');
      return;
    }

    if (!validDate(cleanDate)) {
      Alert.alert('Check the birth date', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    const nextProfile: NewbornProfile = {
      babyName: cleanName,
      birthDate: cleanDate,
      birthWeight: birthWeight.trim(),
      feedingPreference,
      createdAt: profile?.createdAt ?? Date.now(),
    };

    try {
      await AsyncStorage.multiSet([
        [PROFILE_KEY, JSON.stringify(nextProfile)],
        [MODE_KEY, 'newborn'],
      ]);

      setProfile(nextProfile);
      setNewbornMode(true);
      setShowForm(false);

      Alert.alert(
        'Newborn Mode is ready',
        `${cleanName}’s profile has been saved.`,
        [
          {
            text: 'Open dashboard',
            onPress: () => router.replace('/newborn-dashboard' as never),
          },
        ]
      );
    } catch (error) {
      console.log('Newborn profile save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  async function activateNewbornMode() {
    if (!profile) {
      setShowForm(true);
      return;
    }

    try {
      await AsyncStorage.setItem(MODE_KEY, 'newborn');
      setNewbornMode(true);
    } catch (error) {
      console.log('Activate Newborn Mode error:', error);
    }
  }

  function pauseNewbornMode() {
    Alert.alert(
      'Switch back to Pregnancy Mode?',
      'Your newborn profile will remain saved and can be activated again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch mode',
          onPress: () => {
            void AsyncStorage.setItem(MODE_KEY, 'pregnancy')
              .then(() => setNewbornMode(false))
              .catch((error) => {
                console.log('Pause Newborn Mode error:', error);
              });
          },
        },
      ]
    );
  }

  function editProfile() {
    if (profile) {
      setBabyName(profile.babyName);
      setBirthDate(profile.birthDate);
      setBirthWeight(profile.birthWeight);
      setFeedingPreference(profile.feedingPreference);
    }

    setShowForm(true);
  }

  if (!loaded) {
    return (
      <Screen>
        <Header title="" back />
        <Text style={[styles.loading, { color: palette.text }]}>
          Loading Newborn Mode...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={140}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          AFTER BABY ARRIVES
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Newborn Mode
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Continue your journey with feeding, diaper, sleep, growth, and daily
          newborn tracking.
        </Text>
      </View>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: newbornMode
              ? palette.accent
              : palette.surface,
            borderColor: newbornMode
              ? palette.accent
              : palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.heroIcon,
            {
              backgroundColor: newbornMode
                ? '#FFFFFF'
                : palette.accentSoft,
            },
          ]}
        >
          <Ionicons
            name="happy-outline"
            size={31}
            color={palette.accent}
          />
        </View>

        <Text
          style={[
            styles.heroLabel,
            {
              color: newbornMode
                ? 'rgba(255,255,255,0.82)'
                : palette.accent,
            },
          ]}
        >
          {newbornMode ? 'NEWBORN MODE ACTIVE' : 'NEWBORN MODE'}
        </Text>

        <Text
          style={[
            styles.heroTitle,
            { color: newbornMode ? '#FFFFFF' : palette.ink },
          ]}
        >
          {profile?.babyName || 'Meet your little one'}
        </Text>

        <Text
          style={[
            styles.heroCopy,
            {
              color: newbornMode
                ? 'rgba(255,255,255,0.86)'
                : palette.text,
            },
          ]}
        >
          {profile
            ? `Born ${formatDate(profile.birthDate)}`
            : 'Create a baby profile to begin newborn tracking.'}
        </Text>

        {profile?.birthWeight ? (
          <View
            style={[
              styles.weightBadge,
              {
                backgroundColor: newbornMode
                  ? 'rgba(255,255,255,0.17)'
                  : palette.accentSoft,
              },
            ]}
          >
            <Ionicons
              name="scale-outline"
              size={17}
              color={newbornMode ? '#FFFFFF' : palette.accent}
            />

            <Text
              style={[
                styles.weightText,
                {
                  color: newbornMode ? '#FFFFFF' : palette.ink,
                },
              ]}
            >
              Birth weight: {profile.birthWeight}
            </Text>
          </View>
        ) : null}
      </View>

      {profile && !showForm ? (
        <>
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View style={styles.profileHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: palette.accent }]}>
                  BABY PROFILE
                </Text>

                <Text style={[styles.profileName, { color: palette.ink }]}>
                  {profile.babyName}
                </Text>
              </View>

              <AnimatedPressable
                onPress={editProfile}
                style={[
                  styles.editButton,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={palette.accent}
                />
              </AnimatedPressable>
            </View>

            <View style={styles.detailsGrid}>
              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: palette.canvas,
                    borderColor: palette.line,
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={palette.accent}
                />

                <Text style={[styles.detailLabel, { color: palette.muted }]}>
                  BIRTH DATE
                </Text>

                <Text style={[styles.detailValue, { color: palette.ink }]}>
                  {formatDate(profile.birthDate)}
                </Text>
              </View>

              <View
                style={[
                  styles.detailCard,
                  {
                    backgroundColor: palette.canvas,
                    borderColor: palette.line,
                  },
                ]}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={20}
                  color={palette.accent}
                />

                <Text style={[styles.detailLabel, { color: palette.muted }]}>
                  FEEDING
                </Text>

                <Text style={[styles.detailValue, { color: palette.ink }]}>
                  {profile.feedingPreference}
                </Text>
              </View>
            </View>
          </View>

          {newbornMode ? (
            <>
              <AnimatedPressable
                onPress={() => router.push('/newborn-dashboard' as never)}
                style={[
                  styles.primaryButton,
                  { backgroundColor: palette.accent },
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                  Open Newborn Dashboard
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
              onPress={pauseNewbornMode}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal-outline"
                size={20}
                color={palette.text}
              />

              <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                Switch to Pregnancy Mode
              </Text>
            </AnimatedPressable>
            </>
          ) : (
            <AnimatedPressable
              onPress={() => void activateNewbornMode()}
              style={[
                styles.primaryButton,
                { backgroundColor: palette.accent },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Activate Newborn Mode
              </Text>
            </AnimatedPressable>
          )}
        </>
      ) : null}

      {showForm ? (
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View style={styles.formHeader}>
            <View>
              <Text style={[styles.sectionLabel, { color: palette.accent }]}>
                {profile ? 'EDIT PROFILE' : 'CREATE PROFILE'}
              </Text>

              <Text style={[styles.formTitle, { color: palette.ink }]}>
                Baby’s details
              </Text>
            </View>

            {profile ? (
              <AnimatedPressable
                onPress={() => setShowForm(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: palette.canvas },
                ]}
              >
                <Ionicons name="close" size={20} color={palette.text} />
              </AnimatedPressable>
            ) : null}
          </View>

          <Text style={[styles.label, { color: palette.text }]}>
            Baby’s name
          </Text>

          <TextInput
            value={babyName}
            onChangeText={setBabyName}
            placeholder="Enter baby’s name"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text }]}>
            Birth date
          </Text>

          <TextInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text }]}>
            Birth weight
          </Text>

          <TextInput
            value={birthWeight}
            onChangeText={setBirthWeight}
            placeholder="Example: 3.2 kg"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text }]}>
            Feeding preference
          </Text>

          <View style={styles.feedingOptions}>
            {feedingOptions.map((option) => {
              const active = feedingPreference === option;

              return (
                <AnimatedPressable
                  key={option}
                  onPress={() => setFeedingPreference(option)}
                  style={[
                    styles.feedingButton,
                    {
                      backgroundColor: active
                        ? palette.accent
                        : palette.canvas,
                      borderColor: active
                        ? palette.accent
                        : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.feedingText,
                      { color: active ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    {option}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={() => void saveProfile()}
            style={[
              styles.primaryButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />

            <Text style={styles.primaryButtonText}>
              Save and activate
            </Text>
          </AnimatedPressable>
        </View>
      ) : null}

      <View
        style={[
          styles.nextCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={23}
          color={palette.accent}
        />

        <View style={styles.nextContent}>
          <Text style={[styles.nextTitle, { color: palette.ink }]}>
            Coming next
          </Text>

          <Text style={[styles.nextCopy, { color: palette.text }]}>
            After the profile is ready, we’ll add the newborn dashboard,
            feeding tracker, diaper tracker, and sleep tracker.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...type.body,
    textAlign: 'center',
    marginTop: 30,
  },
  heading: {
    marginTop: 4,
    marginBottom: 20,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 5,
  },
  title: {
    ...type.hero,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 29,
    padding: 21,
    marginBottom: 20,
  },
  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroLabel: {
    ...type.section,
  },
  heroTitle: {
    ...type.title,
    marginTop: 5,
  },
  heroCopy: {
    ...type.body,
    marginTop: 5,
  },
  weightBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 16,
  },
  weightText: {
    ...type.small,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    ...type.section,
  },
  profileName: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },
  editButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailCard: {
    flex: 1,
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
  },
  detailLabel: {
    ...type.tiny,
    marginTop: 12,
  },
  detailValue: {
    ...type.small,
    marginTop: 3,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.small,
    marginTop: 14,
    marginBottom: 7,
  },
  input: {
    ...type.body,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  feedingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedingButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  feedingText: {
    ...type.small,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 18,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 15,
    marginBottom: 16,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    marginTop: 5,
  },
  nextContent: {
    flex: 1,
  },
  nextTitle: {
    ...type.bodyStrong,
  },
  nextCopy: {
    ...type.small,
    marginTop: 3,
  },
});
