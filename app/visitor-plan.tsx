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

type VisitorRule = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
};

type VisitorPlan = {
  selectedRules: string[];
  quietHours: string;
  personalNote: string;
  updatedAt: number | null;
};

const STORAGE_KEY = 'preggy:visitor-plan';

const rules: VisitorRule[] = [
  {
    id: 'ask-first',
    icon: 'chatbubble-outline',
    title: 'Please ask before visiting',
    copy: 'Wait for confirmation before travelling or arriving.',
  },
  {
    id: 'stay-home-sick',
    icon: 'thermometer-outline',
    title: 'Stay home when unwell',
    copy: 'Reschedule if you have a cough, fever, cold, or infection.',
  },
  {
    id: 'wash-hands',
    icon: 'water-outline',
    title: 'Wash hands first',
    copy: 'Clean hands before touching or holding the baby.',
  },
  {
    id: 'no-kissing',
    icon: 'shield-checkmark-outline',
    title: 'Please do not kiss baby',
    copy: 'Help reduce exposure to common viruses and infections.',
  },
  {
    id: 'short-visits',
    icon: 'time-outline',
    title: 'Keep visits short',
    copy: 'Short visits protect rest, recovery, and feeding time.',
  },
  {
    id: 'help-over-hosting',
    icon: 'heart-outline',
    title: 'Help instead of hosting',
    copy: 'Practical support is more helpful than expecting to be hosted.',
  },
];

const emptyPlan: VisitorPlan = {
  selectedRules: [],
  quietHours: '',
  personalNote: '',
  updatedAt: null,
};

function parsePlan(raw: string | null): VisitorPlan {
  try {
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      ...emptyPlan,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return emptyPlan;
  }
}

export default function VisitorPlanScreen() {
  const { palette } = useAppTheme();

  const [plan, setPlan] = useState<VisitorPlan>(emptyPlan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setPlan(parsePlan(saved)))
      .catch((error) => {
        console.log('Visitor plan load error:', error);
      });
  }, []);

  function toggleRule(id: string) {
    setPlan((current) => {
      const selected = current.selectedRules.includes(id);

      return {
        ...current,
        selectedRules: selected
          ? current.selectedRules.filter((item) => item !== id)
          : [...current.selectedRules, id],
      };
    });
  }

  async function persistPlan() {
    const next: VisitorPlan = {
      ...plan,
      quietHours: plan.quietHours.trim(),
      personalNote: plan.personalNote.trim(),
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    setPlan(next);
    return next;
  }

  async function savePlan() {
    setSaving(true);

    try {
      await persistPlan();

      Alert.alert(
        'Visitor plan saved',
        'Your boundaries are saved on this device.'
      );
    } catch (error) {
      console.log('Visitor plan save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function sharePlan() {
    if (
      plan.selectedRules.length === 0 &&
      !plan.quietHours.trim() &&
      !plan.personalNote.trim()
    ) {
      Alert.alert(
        'Create your plan first',
        'Choose at least one boundary or add a personal note.'
      );
      return;
    }

    setSaving(true);

    try {
      const saved = await persistPlan();

      const selected = rules.filter((rule) =>
        saved.selectedRules.includes(rule.id)
      );

      const lines = [
        'Our Visitor Plan',
        '',
        'Thank you for supporting our growing family. These boundaries will help us protect recovery, bonding, feeding, and rest.',
        '',
      ];

      if (selected.length) {
        lines.push('Our visiting boundaries:');

        selected.forEach((rule) => {
          lines.push(`• ${rule.title}`);
        });
      }

      if (saved.quietHours) {
        lines.push('');
        lines.push(`Quiet hours: ${saved.quietHours}`);
      }

      if (saved.personalNote) {
        lines.push('');
        lines.push(saved.personalNote);
      }

      lines.push('');
      lines.push('Thank you for understanding and supporting us.');

      await Share.share({
        title: 'Our Visitor Plan',
        message: lines.join('\n'),
      });
    } catch (error) {
      console.log('Visitor plan share error:', error);
      Alert.alert(
        'Could not share',
        'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={100}>
      <Header title="Visitor Plan" back />

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
              name="people-outline"
              size={28}
              color={palette.onAccent}
            />
          </View>

          <View style={styles.ruleCount}>
            <Text style={styles.ruleCountValue}>
              {plan.selectedRules.length}
            </Text>
            <Text style={styles.ruleCountLabel}>
              selected
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.eyebrow,
            { color: palette.onAccent },
          ]}
        >
          PROTECT YOUR PEACE
        </Text>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Visits that feel supportive.
        </Text>

        <Text style={styles.heroCopy}>
          Set clear, kind boundaries for recovery,
          bonding, feeding, and rest.
        </Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text
          style={[
            styles.sectionEyebrow,
            { color: palette.accent },
          ]}
        >
          VISITING BOUNDARIES
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: palette.ink },
          ]}
        >
          Choose what matters
        </Text>

        <Text
          style={[
            styles.sectionCopy,
            { color: palette.text },
          ]}
        >
          Tap any rule to include it in your shared plan.
        </Text>
      </View>

      <View style={styles.ruleList}>
        {rules.map((rule) => {
          const selected =
            plan.selectedRules.includes(rule.id);

          return (
            <AnimatedPressable
              key={rule.id}
              onPress={() => toggleRule(rule.id)}
              style={[
                styles.ruleCard,
                {
                  backgroundColor: selected
                    ? palette.accentSoft
                    : palette.surface,
                  borderColor: selected
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.ruleIcon,
                  {
                    backgroundColor: selected
                      ? palette.accent
                      : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={rule.icon}
                  size={21}
                  color={
                    selected
                      ? palette.onAccent
                      : palette.accent
                  }
                />
              </View>

              <View style={styles.ruleContent}>
                <Text
                  style={[
                    styles.ruleTitle,
                    { color: palette.ink },
                  ]}
                >
                  {rule.title}
                </Text>

                <Text
                  style={[
                    styles.ruleCopy,
                    { color: palette.text },
                  ]}
                >
                  {rule.copy}
                </Text>
              </View>

              <View
                style={[
                  styles.selectCircle,
                  {
                    backgroundColor: selected
                      ? palette.accent
                      : 'transparent',
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                {selected ? (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={palette.onAccent}
                  />
                ) : null}
              </View>
            </AnimatedPressable>
          );
        })}
      </View>

      <View
        style={[
          styles.detailsCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text
          style={[
            styles.detailsEyebrow,
            { color: palette.accent },
          ]}
        >
          PERSONAL DETAILS
        </Text>

        <Text
          style={[
            styles.detailsTitle,
            { color: palette.ink },
          ]}
        >
          Make the plan yours
        </Text>

        <Text
          style={[
            styles.label,
            { color: palette.text },
          ]}
        >
          Quiet hours
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
            name="moon-outline"
            size={20}
            color={palette.accent}
          />

          <TextInput
            value={plan.quietHours}
            onChangeText={(value) =>
              setPlan((current) => ({
                ...current,
                quietHours: value,
              }))
            }
            placeholder="Example: 7 PM to 10 AM"
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
          Personal message
        </Text>

        <TextInput
          value={plan.personalNote}
          onChangeText={(value) =>
            setPlan((current) => ({
              ...current,
              personalNote: value,
            }))
          }
          placeholder="Add a warm message for family and friends"
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
          onPress={() => void savePlan()}
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
          onPress={() => void sharePlan()}
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
            Share plan
          </Text>
        </AnimatedPressable>
      </View>

      {plan.updatedAt ? (
        <Text
          style={[
            styles.savedText,
            { color: palette.muted },
          ]}
        >
          Last saved{' '}
          {new Date(plan.updatedAt).toLocaleString()}
        </Text>
      ) : null}

      <View
        style={[
          styles.kindnessCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="heart-outline"
          size={22}
          color={palette.accent}
        />

        <Text
          style={[
            styles.kindnessText,
            { color: palette.text },
          ]}
        >
          Clear boundaries are not unkind. They help your
          family recover and adjust safely.
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
    marginBottom: 25,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCount: {
    minWidth: 65,
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleCountValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 22,
  },
  ruleCountLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.74)',
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.3,
    marginTop: 24,
  },
  heroTitle: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 5,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 315,
  },
  sectionHeading: {
    marginBottom: 13,
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
    marginTop: 4,
  },
  ruleList: {
    gap: 10,
  },
  ruleCard: {
    minHeight: 94,
    borderRadius: 23,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    ...type.bodyStrong,
  },
  ruleCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  selectCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginTop: 24,
  },
  detailsEyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  detailsTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 28,
    marginTop: 2,
    marginBottom: 15,
  },
  label: {
    ...type.small,
    marginTop: 10,
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
    minHeight: 110,
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
    flex: 1.3,
    minHeight: 57,
    borderRadius: 20,
    borderWidth: 1,
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
  kindnessCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 22,
  },
  kindnessText: {
    ...type.small,
    flex: 1,
    lineHeight: 20,
  },
});
