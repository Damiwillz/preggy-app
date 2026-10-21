import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
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

type ComfortOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
};

type ComfortProfile = {
  environment: string[];
  support: string[];
  avoid: string[];
  safePerson: string;
  reassurance: string;
  extraNotes: string;
  updatedAt: number | null;
};

const STORAGE_KEY = 'preggy:comfort-profile';

const environmentOptions: ComfortOption[] = [
  {
    id: 'dim-lights',
    icon: 'sunny-outline',
    title: 'Dim lighting',
    copy: 'Soft, warm light instead of bright overhead lighting.',
  },
  {
    id: 'quiet-room',
    icon: 'volume-low-outline',
    title: 'A quiet room',
    copy: 'Less noise and fewer conversations around me.',
  },
  {
    id: 'calm-music',
    icon: 'musical-notes-outline',
    title: 'Calm music',
    copy: 'Gentle music or familiar sounds help me settle.',
  },
  {
    id: 'cool-room',
    icon: 'snow-outline',
    title: 'A cool room',
    copy: 'Fresh air, a fan, or a cooler temperature.',
  },
];

const supportOptions: ComfortOption[] = [
  {
    id: 'explain-first',
    icon: 'chatbubble-outline',
    title: 'Explain things first',
    copy: 'Tell me what will happen before doing it.',
  },
  {
    id: 'ask-before-touch',
    icon: 'hand-left-outline',
    title: 'Ask before touching',
    copy: 'Check with me before examinations or physical support.',
  },
  {
    id: 'one-voice',
    icon: 'person-outline',
    title: 'One calm voice',
    copy: 'One person speaking clearly helps me focus.',
  },
  {
    id: 'breathing',
    icon: 'leaf-outline',
    title: 'Breathing reminders',
    copy: 'Guide me back to slow, steady breathing.',
  },
];

const avoidOptions: ComfortOption[] = [
  {
    id: 'surprise-touch',
    icon: 'alert-circle-outline',
    title: 'Unexpected touch',
    copy: 'Do not touch or reposition me without warning.',
  },
  {
    id: 'loud-voices',
    icon: 'volume-high-outline',
    title: 'Loud voices',
    copy: 'Keep communication calm and measured.',
  },
  {
    id: 'many-questions',
    icon: 'help-circle-outline',
    title: 'Too many questions',
    copy: 'Give me time to understand and respond.',
  },
  {
    id: 'unplanned-visitors',
    icon: 'people-outline',
    title: 'Unplanned visitors',
    copy: 'Ask before allowing anyone into my space.',
  },
];

const emptyProfile: ComfortProfile = {
  environment: [],
  support: [],
  avoid: [],
  safePerson: '',
  reassurance: '',
  extraNotes: '',
  updatedAt: null,
};

function parseProfile(raw: string | null): ComfortProfile {
  try {
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      ...emptyProfile,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return emptyProfile;
  }
}

function selectedTitles(
  selectedIds: string[],
  options: ComfortOption[]
) {
  return options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.title);
}

function ChoiceSection({
  eyebrow,
  title,
  copy,
  options,
  selected,
  onToggle,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  options: ComfortOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionEyebrow,
          { color: palette.accent },
        ]}
      >
        {eyebrow}
      </Text>

      <Text
        style={[
          styles.sectionTitle,
          { color: palette.ink },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.sectionCopy,
          { color: palette.text },
        ]}
      >
        {copy}
      </Text>

      <View style={styles.optionList}>
        {options.map((option) => {
          const active = selected.includes(option.id);

          return (
            <AnimatedPressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={[
                styles.optionCard,
                {
                  backgroundColor: active
                    ? palette.accentSoft
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor: active
                      ? palette.accent
                      : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={21}
                  color={
                    active
                      ? palette.onAccent
                      : palette.accent
                  }
                />
              </View>

              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    { color: palette.ink },
                  ]}
                >
                  {option.title}
                </Text>

                <Text
                  style={[
                    styles.optionCopy,
                    { color: palette.text },
                  ]}
                >
                  {option.copy}
                </Text>
              </View>

              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: active
                      ? palette.accent
                      : 'transparent',
                    borderColor: active
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                {active ? (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={palette.onAccent}
                  />
                ) : null}
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ComfortProfileScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] =
    useState<ComfortProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setProfile(parseProfile(saved)))
      .catch((error) => {
        console.log('Comfort profile load error:', error);
      });
  }, []);

  function toggleChoice(
    field: 'environment' | 'support' | 'avoid',
    id: string
  ) {
    setProfile((current) => {
      const active = current[field].includes(id);

      return {
        ...current,
        [field]: active
          ? current[field].filter((item) => item !== id)
          : [...current[field], id],
      };
    });
  }

  async function persistProfile() {
    const next: ComfortProfile = {
      ...profile,
      safePerson: profile.safePerson.trim(),
      reassurance: profile.reassurance.trim(),
      extraNotes: profile.extraNotes.trim(),
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    setProfile(next);
    return next;
  }

  async function saveProfile() {
    setSaving(true);

    try {
      await persistProfile();

      Alert.alert(
        'Comfort profile saved',
        'Your preferences are saved on this device.'
      );
    } catch (error) {
      console.log('Comfort profile save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function shareProfile() {
    if (selectedCount === 0) {
      Alert.alert(
        'Add your preferences first',
        'Choose at least one comfort preference or add a personal note.'
      );
      return;
    }

    setSaving(true);

    try {
      const saved = await persistProfile();

      const environment = selectedTitles(
        saved.environment,
        environmentOptions
      );

      const support = selectedTitles(
        saved.support,
        supportOptions
      );

      const avoid = selectedTitles(
        saved.avoid,
        avoidOptions
      );

      const lines = [
        'My Comfort Profile',
        '',
        'These preferences help me feel safer, calmer, and more supported during care.',
      ];

      if (environment.length) {
        lines.push('');
        lines.push('My preferred environment:');
        environment.forEach((item) => lines.push(`• ${item}`));
      }

      if (support.length) {
        lines.push('');
        lines.push('What helps me:');
        support.forEach((item) => lines.push(`• ${item}`));
      }

      if (avoid.length) {
        lines.push('');
        lines.push('Please avoid:');
        avoid.forEach((item) => lines.push(`• ${item}`));
      }

      if (saved.safePerson) {
        lines.push('');
        lines.push(`My safe person: ${saved.safePerson}`);
      }

      if (saved.reassurance) {
        lines.push('');
        lines.push(
          `A helpful phrase: “${saved.reassurance}”`
        );
      }

      if (saved.extraNotes) {
        lines.push('');
        lines.push(`Additional notes: ${saved.extraNotes}`);
      }

      await Share.share({
        title: 'My Comfort Profile',
        message: lines.join('\n'),
      });
    } catch (error) {
      console.log('Comfort profile share error:', error);
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = useMemo(
    () =>
      profile.environment.length +
      profile.support.length +
      profile.avoid.length +
      (profile.safePerson.trim() ? 1 : 0) +
      (profile.reassurance.trim() ? 1 : 0) +
      (profile.extraNotes.trim() ? 1 : 0),
    [profile]
  );

  return (
    <Screen bottomSpace={110}>
      <Header title="Comfort Profile" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="heart-circle-outline"
              size={29}
              color={palette.onAccent}
            />
          </View>

          <View style={styles.preferenceCount}>
            <Text style={styles.preferenceValue}>
              {selectedCount}
            </Text>
            <Text style={styles.preferenceLabel}>
              preferences
            </Text>
          </View>
        </View>

        <Text style={styles.heroEyebrow}>
          CARE THAT FEELS SAFE
        </Text>

        <Text style={styles.heroTitle}>
          Help people support you well.
        </Text>

        <Text style={styles.heroCopy}>
          Record what helps you feel calm, respected, and
          understood during care.
        </Text>
      </View>

      <ChoiceSection
        eyebrow="YOUR SPACE"
        title="Preferred environment"
        copy="Choose the surroundings that help your body settle."
        options={environmentOptions}
        selected={profile.environment}
        onToggle={(id) =>
          toggleChoice('environment', id)
        }
      />

      <ChoiceSection
        eyebrow="YOUR SUPPORT"
        title="What helps you"
        copy="Choose how your partner or care team can support you."
        options={supportOptions}
        selected={profile.support}
        onToggle={(id) =>
          toggleChoice('support', id)
        }
      />

      <ChoiceSection
        eyebrow="YOUR BOUNDARIES"
        title="Things to avoid"
        copy="Choose anything that may make care feel more difficult."
        options={avoidOptions}
        selected={profile.avoid}
        onToggle={(id) => toggleChoice('avoid', id)}
      />

      <View
        style={[
          styles.personalCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionEyebrow,
            { color: palette.accent },
          ]}
        >
          PERSONAL SUPPORT
        </Text>

        <Text
          style={[
            styles.personalTitle,
            { color: palette.ink },
          ]}
        >
          Add what is personal to you
        </Text>

        <Text
          style={[
            styles.label,
            { color: palette.text },
          ]}
        >
          My safe person
        </Text>

        <View
          style={[
            styles.inputShell,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={palette.accent}
          />

          <TextInput
            value={profile.safePerson}
            onChangeText={(value) =>
              setProfile((current) => ({
                ...current,
                safePerson: value,
              }))
            }
            placeholder="Name and relationship"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              { color: palette.ink },
            ]}
          />
        </View>

        <Text
          style={[
            styles.label,
            { color: palette.text },
          ]}
        >
          A phrase that reassures me
        </Text>

        <View
          style={[
            styles.inputShell,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color={palette.accent}
          />

          <TextInput
            value={profile.reassurance}
            onChangeText={(value) =>
              setProfile((current) => ({
                ...current,
                reassurance: value,
              }))
            }
            placeholder="Example: You are safe. Breathe slowly."
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              { color: palette.ink },
            ]}
          />
        </View>

        <Text
          style={[
            styles.label,
            { color: palette.text },
          ]}
        >
          Additional notes
        </Text>

        <TextInput
          value={profile.extraNotes}
          onChangeText={(value) =>
            setProfile((current) => ({
              ...current,
              extraNotes: value,
            }))
          }
          placeholder="Anything else your partner or care team should know"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.noteInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable
          disabled={saving}
          onPress={() => void saveProfile()}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
            saving && styles.disabled,
          ]}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color={palette.onAccent}
          />

          <Text
            style={[
              styles.saveText,
              { color: palette.onAccent },
            ]}
          >
            Save
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          disabled={saving}
          onPress={() => void shareProfile()}
          style={[
            styles.shareButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
            saving && styles.disabled,
          ]}
        >
          <Ionicons
            name="share-social-outline"
            size={20}
            color={palette.accent}
          />

          <Text
            style={[
              styles.shareText,
              { color: palette.accent },
            ]}
          >
            Share profile
          </Text>
        </AnimatedPressable>
      </View>

      {profile.updatedAt ? (
        <Text
          style={[
            styles.savedText,
            { color: palette.muted },
          ]}
        >
          Last saved{' '}
          {new Date(profile.updatedAt).toLocaleString()}
        </Text>
      ) : null}

      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={palette.accent}
        />

        <Text
          style={[
            styles.noteText,
            { color: palette.text },
          ]}
        >
          You can update this profile whenever your needs
          or preferences change.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 21,
    marginTop: 12,
    marginBottom: 27,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceCount: {
    minWidth: 77,
    minHeight: 53,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
  },
  preferenceLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.74)',
  },
  heroEyebrow: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.3,
    marginTop: 25,
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 36,
    marginTop: 5,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 22,
    marginTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionEyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 5,
    marginBottom: 13,
  },
  optionList: {
    gap: 10,
  },
  optionCard: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 23,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...type.bodyStrong,
  },
  optionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
  },
  personalTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 28,
    marginTop: 2,
    marginBottom: 14,
  },
  label: {
    ...type.small,
    marginTop: 11,
    marginBottom: 7,
  },
  inputShell: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 54,
  },
  noteInput: {
    ...type.body,
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    minHeight: 57,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  shareButton: {
    flex: 1.4,
    minHeight: 57,
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveText: {
    ...type.bodyStrong,
  },
  shareText: {
    ...type.bodyStrong,
  },
  disabled: {
    opacity: 0.6,
  },
  savedText: {
    ...type.tiny,
    textAlign: 'center',
    marginTop: 11,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 20,
  },
});
