import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BirthPreferences = {
  birthSetting: string;
  supportPeople: string;
  comfort: string[];
  painRelief: string;
  feeding: string;
  goldenHour: string;
  notes: string;
  updatedAt: number | null;
};

const STORAGE_KEY = 'preggy:birth-preferences';

const defaultPreferences: BirthPreferences = {
  birthSetting: '',
  supportPeople: '',
  comfort: [],
  painRelief: '',
  feeding: '',
  goldenHour: '',
  notes: '',
  updatedAt: null,
};

const birthSettingOptions = ['Hospital', 'Birth center', 'Home', 'Not sure'];
const comfortOptions = ['Dim lights', 'Music', 'Movement', 'Breathing', 'Massage', 'Water', 'Quiet room'];
const painOptions = ['Decide in moment', 'Natural comfort', 'Epidural open', 'Gas/air open', 'Ask care team'];
const feedingOptions = ['Breastfeeding', 'Formula', 'Combination', 'Decide later'];
const goldenHourOptions = ['Yes, if possible', 'Ask first', 'Not sure'];

function percentWidth(value: number) {
  return `${Math.min(Math.max(value, 0), 100)}%` as `${number}%`;
}

function formatUpdatedAt(value: number | null) {
  if (!value) return 'Not saved yet';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? palette.accent : palette.canvas,
          borderColor: active ? palette.accent : palette.line,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? palette.onAccent : palette.ink }]}>{label}</Text>
    </AnimatedPressable>
  );
}

function PreferenceSection({
  icon,
  title,
  copy,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.sectionTop}>
        <View style={[styles.sectionIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={21} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>{title}</Text>
          <Text style={[styles.sectionCopy, { color: palette.text }]}>{copy}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

export default function BirthPreferencesScreen() {
  const { palette } = useAppTheme();

  const [preferences, setPreferences] = useState<BirthPreferences>(defaultPreferences);
  const [saving, setSaving] = useState(false);

  const completion = useMemo(() => {
    const filled = [
      preferences.birthSetting,
      preferences.supportPeople,
      preferences.comfort.length ? 'comfort' : '',
      preferences.painRelief,
      preferences.feeding,
      preferences.goldenHour,
      preferences.notes,
    ].filter((item) => String(item).trim().length > 0).length;

    return Math.round((filled / 7) * 100);
  }, [preferences]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === 'object') {
          setPreferences({
            ...defaultPreferences,
            ...parsed,
            comfort: Array.isArray(parsed.comfort) ? parsed.comfort : [],
          });
        }
      } catch (error) {
        console.log('Birth preferences load error:', error);
      }
    }

    void loadPreferences();
  }, []);

  function updateField<Key extends keyof BirthPreferences>(key: Key, value: BirthPreferences[Key]) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleComfort(option: string) {
    setPreferences((current) => {
      const active = current.comfort.includes(option);
      const nextComfort = active
        ? current.comfort.filter((item) => item !== option)
        : [...current.comfort, option];

      return {
        ...current,
        comfort: nextComfort,
      };
    });
  }

  async function savePreferences() {
    setSaving(true);

    try {
      const nextPreferences = {
        ...preferences,
        updatedAt: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
      setPreferences(nextPreferences);

      Alert.alert('Saved', 'Your birth preferences have been saved.');
    } catch (error) {
      console.log('Birth preferences save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function sharePreferences() {
    const message = [
      'My Preggy Birth Preferences',
      '',
      `Birth setting: ${preferences.birthSetting || 'Not set'}`,
      `Support people: ${preferences.supportPeople || 'Not set'}`,
      `Comfort: ${preferences.comfort.length ? preferences.comfort.join(', ') : 'Not set'}`,
      `Pain relief: ${preferences.painRelief || 'Not set'}`,
      `Feeding: ${preferences.feeding || 'Not set'}`,
      `Golden hour: ${preferences.goldenHour || 'Not set'}`,
      `Notes: ${preferences.notes || 'None'}`,
      '',
      'These are personal preferences and can change. Please discuss them with the care team.',
    ].join('\n');

    await Share.share({
      title: 'My Birth Preferences',
      message,
    });
  }

  async function clearPreferences() {
    Alert.alert('Clear preferences?', 'This will remove your saved birth preferences from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setPreferences(defaultPreferences);
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={90}>
      <Header title="Birth Preferences" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.hero, { backgroundColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: palette.onAccent }]}>
              <Ionicons name="heart-outline" size={31} color={palette.accent} />
            </View>

            <View style={[styles.percentBadge, { backgroundColor: palette.onAccent }]}>
              <Text style={[styles.percentText, { color: palette.accent }]}>{completion}%</Text>
            </View>
          </View>

          <Text style={[styles.eyebrow, { color: palette.onAccent }]}>BIRTH PREPARATION</Text>
          <Text style={[styles.title, { color: palette.onAccent }]}>My Birth Preferences</Text>
          <Text style={[styles.subtitle, { color: palette.onAccent }]}>
            Save the things you want your care team to know: support, comfort, feeding, and first moments with baby.
          </Text>

          <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
            <View style={[styles.fill, { width: percentWidth(completion), backgroundColor: palette.onAccent }]} />
          </View>

          <Text style={[styles.updated, { color: palette.onAccent }]}>
            Updated {formatUpdatedAt(preferences.updatedAt)}
          </Text>
        </View>

        <PreferenceSection
          icon="business-outline"
          title="Preferred birth setting"
          copy="Where would you prefer to give birth?"
        >
          <View style={styles.chipWrap}>
            {birthSettingOptions.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                active={preferences.birthSetting === option}
                onPress={() => updateField('birthSetting', option)}
              />
            ))}
          </View>
        </PreferenceSection>

        <PreferenceSection
          icon="people-outline"
          title="Support people"
          copy="Who do you want nearby or contacted?"
        >
          <TextInput
            value={preferences.supportPeople}
            onChangeText={(value) => updateField('supportPeople', value)}
            placeholder="Partner, doula, family member..."
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                backgroundColor: palette.canvas,
                borderColor: palette.line,
                color: palette.ink,
              },
            ]}
          />
        </PreferenceSection>

        <PreferenceSection
          icon="leaf-outline"
          title="Comfort preferences"
          copy="Choose anything that may help you feel calm."
        >
          <View style={styles.chipWrap}>
            {comfortOptions.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                active={preferences.comfort.includes(option)}
                onPress={() => toggleComfort(option)}
              />
            ))}
          </View>
        </PreferenceSection>

        <PreferenceSection
          icon="sparkles-outline"
          title="Pain comfort"
          copy="Save your current preference. You can change this anytime."
        >
          <View style={styles.chipWrap}>
            {painOptions.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                active={preferences.painRelief === option}
                onPress={() => updateField('painRelief', option)}
              />
            ))}
          </View>
        </PreferenceSection>

        <PreferenceSection
          icon="restaurant-outline"
          title="Feeding preference"
          copy="What would you like to try first?"
        >
          <View style={styles.chipWrap}>
            {feedingOptions.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                active={preferences.feeding === option}
                onPress={() => updateField('feeding', option)}
              />
            ))}
          </View>
        </PreferenceSection>

        <PreferenceSection
          icon="heart-circle-outline"
          title="Golden hour"
          copy="Your preference for first cuddles and skin-to-skin."
        >
          <View style={styles.chipWrap}>
            {goldenHourOptions.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                active={preferences.goldenHour === option}
                onPress={() => updateField('goldenHour', option)}
              />
            ))}
          </View>
        </PreferenceSection>

        <PreferenceSection
          icon="document-text-outline"
          title="Notes for care team"
          copy="Add anything personal or important."
        >
          <TextInput
            value={preferences.notes}
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Anything your care team should know..."
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
        </PreferenceSection>

        <View style={styles.actions}>
          <AnimatedPressable
            onPress={clearPreferences}
            style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Ionicons name="trash-outline" size={19} color={palette.ink} />
            <Text style={[styles.secondaryText, { color: palette.ink }]}>Clear</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={sharePreferences}
            style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Ionicons name="share-outline" size={19} color={palette.ink} />
            <Text style={[styles.secondaryText, { color: palette.ink }]}>Share</Text>
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          onPress={savePreferences}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: palette.accent }]}
        >
          <Ionicons name="save-outline" size={20} color={palette.onAccent} />
          <Text style={[styles.saveText, { color: palette.onAccent }]}>
            {saving ? 'Saving...' : 'Save preferences'}
          </Text>
        </AnimatedPressable>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteCopy, { color: palette.text }]}>
            Birth can change quickly. These preferences are a guide to discuss with your care team, not medical instructions.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 24,
    marginTop: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBadge: {
    minWidth: 72,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  percentText: {
    ...type.bodyStrong,
    fontSize: 20,
  },
  eyebrow: {
    ...type.small,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.82,
    marginTop: 20,
  },
  title: {
    ...type.title,
    fontSize: 34,
    lineHeight: 38,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
    opacity: 0.88,
  },
  track: {
    height: 9,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 22,
  },
  fill: {
    height: '100%',
    borderRadius: 20,
  },
  updated: {
    ...type.tiny,
    marginTop: 11,
    opacity: 0.8,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 16,
    marginBottom: 12,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 2,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    minHeight: 42,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...type.small,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    ...type.body,
  },
  noteInput: {
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    padding: 15,
    ...type.body,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: {
    ...type.bodyStrong,
  },
  saveButton: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  saveText: {
    ...type.bodyStrong,
  },
  noteCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  noteCopy: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
});
