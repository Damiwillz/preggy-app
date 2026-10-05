import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type AnnouncementStyle = 'Classic' | 'Soft' | 'Minimal';

type AnnouncementDraft = {
  babyName: string;
  birthDate: string;
  birthTime: string;
  weight: string;
  length: string;
  message: string;
  design: AnnouncementStyle;
};

const STORAGE_KEY = 'preggy:birth-announcement';

const designs: AnnouncementStyle[] = ['Classic', 'Soft', 'Minimal'];

const emptyDraft: AnnouncementDraft = {
  babyName: '',
  birthDate: '',
  birthTime: '',
  weight: '',
  length: '',
  message: 'Our hearts are full. Welcome to the world, little one.',
  design: 'Classic',
};

export default function BirthAnnouncementScreen() {
  const { palette } = useAppTheme();

  const [draft, setDraft] = useState<AnnouncementDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          setDraft({
            ...emptyDraft,
            ...(JSON.parse(saved) as Partial<AnnouncementDraft>),
          });
        }
      } catch (error) {
        console.log('Birth announcement load error:', error);
      } finally {
        setLoaded(true);
      }
    }

    void loadDraft();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(
      (error) => {
        console.log('Birth announcement save error:', error);
      }
    );
  }, [draft, loaded]);

  function updateDraft<Key extends keyof AnnouncementDraft>(
    key: Key,
    value: AnnouncementDraft[Key]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function shareAnnouncement() {
    const name = draft.babyName.trim();

    if (!name) {
      Alert.alert(
        'Add baby’s name',
        'Enter the baby’s name before sharing the announcement.'
      );
      return;
    }

    const details = [
      draft.birthDate.trim(),
      draft.birthTime.trim(),
      draft.weight.trim() ? `Weight: ${draft.weight.trim()}` : '',
      draft.length.trim() ? `Length: ${draft.length.trim()}` : '',
    ].filter(Boolean);

    const message = [
      `Welcome, ${name}!`,
      details.join(' • '),
      draft.message.trim(),
      'Made with Preggy',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await Share.share({
        title: `Welcome ${name}`,
        message,
      });
    } catch (error) {
      console.log('Birth announcement share error:', error);
      Alert.alert('Could not share', 'Please try again in a moment.');
    }
  }

  function clearDraft() {
    Alert.alert(
      'Clear announcement?',
      'The information in this announcement will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setDraft(emptyDraft),
        },
      ]
    );
  }

  const previewBackground =
    draft.design === 'Classic'
      ? palette.accent
      : draft.design === 'Soft'
        ? palette.accentSoft
        : palette.surface;

  const previewText =
    draft.design === 'Classic' ? '#FFFFFF' : palette.ink;

  const previewSecondary =
    draft.design === 'Classic'
      ? 'rgba(255,255,255,0.82)'
      : palette.text;

  if (!loaded) {
    return (
      <Screen>
        <Header title="" back />
        <Text style={[styles.loading, { color: palette.text }]}>
          Loading announcement...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={140}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          BABY MEMORIES
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Birth Announcement
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Create a beautiful announcement and share the happy news with your
          family and friends.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        LIVE PREVIEW
      </Text>

      <View
        style={[
          styles.previewCard,
          {
            backgroundColor: previewBackground,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.previewIcon,
            {
              backgroundColor:
                draft.design === 'Classic'
                  ? 'rgba(255,255,255,0.18)'
                  : palette.canvas,
            },
          ]}
        >
          <Ionicons
            name="heart"
            size={27}
            color={
              draft.design === 'Classic' ? '#FFFFFF' : palette.accent
            }
          />
        </View>

        <Text style={[styles.welcomeText, { color: previewSecondary }]}>
          WELCOME TO THE WORLD
        </Text>

        <Text style={[styles.babyName, { color: previewText }]}>
          {draft.babyName.trim() || 'Baby Name'}
        </Text>

        {draft.birthDate || draft.birthTime ? (
          <Text style={[styles.birthDetails, { color: previewSecondary }]}>
            {[draft.birthDate, draft.birthTime].filter(Boolean).join(' • ')}
          </Text>
        ) : (
          <Text style={[styles.birthDetails, { color: previewSecondary }]}>
            Birth date • Birth time
          </Text>
        )}

        {draft.weight || draft.length ? (
          <View style={styles.measurementRow}>
            {draft.weight ? (
              <View
                style={[
                  styles.measurement,
                  {
                    backgroundColor:
                      draft.design === 'Classic'
                        ? 'rgba(255,255,255,0.15)'
                        : palette.canvas,
                  },
                ]}
              >
                <Text
                  style={[styles.measurementLabel, { color: previewSecondary }]}
                >
                  WEIGHT
                </Text>
                <Text
                  style={[styles.measurementValue, { color: previewText }]}
                >
                  {draft.weight}
                </Text>
              </View>
            ) : null}

            {draft.length ? (
              <View
                style={[
                  styles.measurement,
                  {
                    backgroundColor:
                      draft.design === 'Classic'
                        ? 'rgba(255,255,255,0.15)'
                        : palette.canvas,
                  },
                ]}
              >
                <Text
                  style={[styles.measurementLabel, { color: previewSecondary }]}
                >
                  LENGTH
                </Text>
                <Text
                  style={[styles.measurementValue, { color: previewText }]}
                >
                  {draft.length}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.previewMessage, { color: previewSecondary }]}>
          {draft.message.trim() ||
            'Our hearts are full. Welcome to the world, little one.'}
        </Text>

        <View style={styles.madeWithRow}>
          <Ionicons
            name="sparkles-outline"
            size={14}
            color={previewSecondary}
          />
          <Text style={[styles.madeWithText, { color: previewSecondary }]}>
            Made with Preggy
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        CARD STYLE
      </Text>

      <View style={styles.designRow}>
        {designs.map((item) => {
          const active = draft.design === item;

          return (
            <AnimatedPressable
              key={item}
              onPress={() => updateDraft('design', item)}
              style={[
                styles.designButton,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Ionicons
                name={
                  item === 'Classic'
                    ? 'heart-outline'
                    : item === 'Soft'
                      ? 'flower-outline'
                      : 'remove-outline'
                }
                size={18}
                color={active ? '#FFFFFF' : palette.accent}
              />

              <Text
                style={[
                  styles.designText,
                  { color: active ? '#FFFFFF' : palette.ink },
                ]}
              >
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View
        style={[
          styles.formCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.formTitle, { color: palette.ink }]}>
          Baby’s details
        </Text>

        <Text style={[styles.label, { color: palette.text }]}>
          Baby’s name
        </Text>

        <TextInput
          value={draft.babyName}
          onChangeText={(value) => updateDraft('babyName', value)}
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

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={[styles.label, { color: palette.text }]}>
              Birth date
            </Text>

            <TextInput
              value={draft.birthDate}
              onChangeText={(value) => updateDraft('birthDate', value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.muted}
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
          </View>

          <View style={styles.column}>
            <Text style={[styles.label, { color: palette.text }]}>
              Birth time
            </Text>

            <TextInput
              value={draft.birthTime}
              onChangeText={(value) => updateDraft('birthTime', value)}
              placeholder="10:30 AM"
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
          </View>
        </View>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={[styles.label, { color: palette.text }]}>
              Weight
            </Text>

            <TextInput
              value={draft.weight}
              onChangeText={(value) => updateDraft('weight', value)}
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
          </View>

          <View style={styles.column}>
            <Text style={[styles.label, { color: palette.text }]}>
              Length
            </Text>

            <TextInput
              value={draft.length}
              onChangeText={(value) => updateDraft('length', value)}
              placeholder="Example: 50 cm"
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
          </View>
        </View>

        <Text style={[styles.label, { color: palette.text }]}>
          Announcement message
        </Text>

        <TextInput
          value={draft.message}
          onChangeText={(value) => updateDraft('message', value)}
          placeholder="Write a special message"
          placeholderTextColor={palette.muted}
          multiline
          style={[
            styles.input,
            styles.messageInput,
            {
              color: palette.ink,
              backgroundColor: palette.canvas,
              borderColor: palette.line,
            },
          ]}
        />
      </View>

      <AnimatedPressable
        onPress={() => void shareAnnouncement()}
        style={[
          styles.shareButton,
          { backgroundColor: palette.accent },
        ]}
      >
        <Ionicons name="share-outline" size={21} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Share announcement</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={clearDraft}
        style={[
          styles.clearButton,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons name="refresh-outline" size={19} color={palette.muted} />
        <Text style={[styles.clearButtonText, { color: palette.text }]}>
          Clear announcement
        </Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...type.body,
    marginTop: 30,
    textAlign: 'center',
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
  sectionLabel: {
    ...type.section,
    marginBottom: 10,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  welcomeText: {
    ...type.section,
    textAlign: 'center',
  },
  babyName: {
    ...type.hero,
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
    marginTop: 6,
  },
  birthDetails: {
    ...type.body,
    textAlign: 'center',
    marginTop: 6,
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  measurement: {
    minWidth: 110,
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 11,
    alignItems: 'center',
  },
  measurementLabel: {
    ...type.tiny,
  },
  measurementValue: {
    ...type.bodyStrong,
    marginTop: 2,
  },
  previewMessage: {
    ...type.body,
    textAlign: 'center',
    marginTop: 20,
  },
  madeWithRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },
  madeWithText: {
    ...type.tiny,
  },
  designRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  designButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  designText: {
    ...type.small,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 16,
  },
  formTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 5,
  },
  label: {
    ...type.small,
    marginTop: 13,
    marginBottom: 7,
  },
  input: {
    ...type.body,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  shareButton: {
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  shareButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  clearButtonText: {
    ...type.small,
  },
});
