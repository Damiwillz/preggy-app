import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BirthPlan = {
  supportPerson: string;
  birthPlace: string;
  painRelief: string;
  labourPreference: string;
  feedingPreference: string;
  notes: string;
};

const STORAGE_KEY = 'preggy:birth-plan';

const defaultPlan: BirthPlan = {
  supportPerson: '',
  birthPlace: '',
  painRelief: '',
  labourPreference: '',
  feedingPreference: '',
  notes: '',
};

export default function BirthPlanScreen() {
  const { palette } = useAppTheme();

  const [plan, setPlan] = useState<BirthPlan>(defaultPlan);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setPlan({ ...defaultPlan, ...JSON.parse(saved) });
        }
      } catch (error) {
        console.log('Birth plan load error:', error);
      }
    }

    void loadPlan();
  }, []);

  function updateField(key: keyof BirthPlan, value: string) {
    setPlan((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function savePlan() {
    setSaving(true);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      Alert.alert('Saved', 'Your birth plan has been saved.');
    } catch (error) {
      console.log('Birth plan save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function clearPlan() {
    Alert.alert('Clear birth plan?', 'This will remove the saved birth plan on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setPlan(defaultPlan);
          } catch (error) {
            console.log('Birth plan clear error:', error);
          }
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BIRTH PREPARATION</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Birth Plan</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Keep your preferences and notes in one calm place.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroLabel, { color: palette.onAccent }]}>YOUR PREFERENCES</Text>
              <Text style={[styles.heroTitle, { color: palette.onAccent }]}>Plan gently, stay flexible</Text>
            </View>

            <View style={styles.heroIcon}>
              <Ionicons name="document-text-outline" size={30} color={palette.onAccent} />
            </View>
          </View>

          <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
            Share this with your care team and update it as your needs change.
          </Text>
        </View>

        <PlanField
          label="Support person"
          placeholder="Partner, family member, doula..."
          value={plan.supportPerson}
          onChangeText={(value) => updateField('supportPerson', value)}
        />

        <PlanField
          label="Preferred birth place"
          placeholder="Hospital, birth centre, home..."
          value={plan.birthPlace}
          onChangeText={(value) => updateField('birthPlace', value)}
        />

        <PlanField
          label="Pain relief preferences"
          placeholder="Breathing, epidural, gas and air, massage..."
          value={plan.painRelief}
          onChangeText={(value) => updateField('painRelief', value)}
          multiline
        />

        <PlanField
          label="Labour preferences"
          placeholder="Movement, music, lighting, positions..."
          value={plan.labourPreference}
          onChangeText={(value) => updateField('labourPreference', value)}
          multiline
        />

        <PlanField
          label="Feeding preference"
          placeholder="Breastfeeding, formula, combination..."
          value={plan.feedingPreference}
          onChangeText={(value) => updateField('feedingPreference', value)}
        />

        <PlanField
          label="Extra notes"
          placeholder="Anything your care team should know..."
          value={plan.notes}
          onChangeText={(value) => updateField('notes', value)}
          multiline
        />

        <View style={styles.actions}>
          <AnimatedPressable
            onPress={clearPlan}
            style={[styles.secondaryButton, { backgroundColor: palette.canvas, borderColor: palette.line }]}
          >
            <Ionicons name="trash-outline" size={19} color={palette.ink} />
            <Text style={[styles.secondaryButtonText, { color: palette.ink }]}>Clear</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={savePlan}
            style={[styles.primaryButton, { backgroundColor: palette.accent, borderColor: palette.accent }]}
          >
            <Ionicons name="save-outline" size={19} color={palette.onAccent} />
            <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>
              {saving ? 'Saving...' : 'Save plan'}
            </Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={24} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            This is a personal planning tool, not medical advice. Your care team may recommend changes based on your health and baby’s needs.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PlanField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Text style={[styles.fieldLabel, { color: palette.accent }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            color: palette.ink,
            backgroundColor: palette.canvas,
            borderColor: palette.line,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 170,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  heroTitle: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
    marginTop: 6,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.92,
  },
  fieldCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 13,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    ...type.bodyStrong,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 112,
    paddingTop: 14,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  noteCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
});
