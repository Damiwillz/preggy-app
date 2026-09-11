import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TextInput, View, type DimensionValue } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type PrepChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

type AppointmentPrep = {
  visitType: string;
  visitDate: string;
  provider: string;
  location: string;
  questions: string;
  symptoms: string;
  medications: string;
  notes: string;
  checklist: PrepChecklistItem[];
  updatedAt: number | null;
};

const STORAGE_KEY = 'preggy:appointment-prep';

const visitTypes = ['Routine', 'Ultrasound', 'Blood test', 'Specialist', 'Birth plan', 'Other'];

const starterChecklist: PrepChecklistItem[] = [
  { id: 'questions', title: 'Write questions I want to ask', done: false },
  { id: 'symptoms', title: 'Add symptoms or changes to mention', done: false },
  { id: 'meds', title: 'Review medications and vitamins', done: false },
  { id: 'records', title: 'Bring documents, scan notes, or test results', done: false },
  { id: 'next', title: 'Ask what to do before the next visit', done: false },
];

const emptyPrep: AppointmentPrep = {
  visitType: 'Routine',
  visitDate: '',
  provider: '',
  location: '',
  questions: '',
  symptoms: '',
  medications: '',
  notes: '',
  checklist: starterChecklist,
  updatedAt: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function percentWidth(value: number): DimensionValue {
  return (String(clamp(value, 0, 100)) + '%') as DimensionValue;
}

function formatUpdatedAt(value: number | null) {
  if (!value) return 'Not saved yet';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeChecklist(items: unknown): PrepChecklistItem[] {
  if (!Array.isArray(items)) return starterChecklist;

  return starterChecklist.map((starter) => {
    const saved = items.find((item) => item && typeof item === 'object' && item.id === starter.id);

    return {
      ...starter,
      done: Boolean(saved && saved.done),
    };
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
        styles.choiceChip,
        {
          backgroundColor: active ? palette.accent : palette.surface,
          borderColor: active ? palette.accent : palette.line,
        },
      ]}
    >
      <Text style={[styles.choiceText, { color: active ? palette.onAccent : palette.ink }]}>{label}</Text>
    </AnimatedPressable>
  );
}

function FieldCard({
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
    <View style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.fieldTop}>
        <View style={[styles.fieldIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={21} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldTitle, { color: palette.ink }]}>{title}</Text>
          <Text style={[styles.fieldCopy, { color: palette.text }]}>{copy}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

export default function AppointmentPrepScreen() {
  const { palette } = useAppTheme();

  const [visitType, setVisitType] = useState(emptyPrep.visitType);
  const [visitDate, setVisitDate] = useState('');
  const [provider, setProvider] = useState('');
  const [location, setLocation] = useState('');
  const [questions, setQuestions] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<PrepChecklistItem[]>(starterChecklist);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPrep() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : emptyPrep;
        const next = parsed && typeof parsed === 'object' ? { ...emptyPrep, ...parsed } : emptyPrep;

        setVisitType(next.visitType || 'Routine');
        setVisitDate(next.visitDate || '');
        setProvider(next.provider || '');
        setLocation(next.location || '');
        setQuestions(next.questions || '');
        setSymptoms(next.symptoms || '');
        setMedications(next.medications || '');
        setNotes(next.notes || '');
        setChecklist(normalizeChecklist(next.checklist));
        setUpdatedAt(next.updatedAt || null);
      } catch (error) {
        console.log('Appointment prep load error:', error);
      }
    }

    void loadPrep();
  }, []);

  const completion = useMemo(() => {
    const filledFields = [
      visitType,
      visitDate,
      provider,
      location,
      questions,
      symptoms,
      medications,
      notes,
    ].filter((item) => item.trim().length > 0).length;

    const checked = checklist.filter((item) => item.done).length;
    const total = 8 + checklist.length;

    return Math.round(((filledFields + checked) / total) * 100);
  }, [checklist, location, medications, notes, provider, questions, symptoms, visitDate, visitType]);

  function buildPrep(): AppointmentPrep {
    return {
      visitType: visitType.trim() || 'Routine',
      visitDate: visitDate.trim(),
      provider: provider.trim(),
      location: location.trim(),
      questions: questions.trim(),
      symptoms: symptoms.trim(),
      medications: medications.trim(),
      notes: notes.trim(),
      checklist,
      updatedAt: Date.now(),
    };
  }

  async function savePrep(showAlert = true) {
    setSaving(true);

    try {
      const next = buildPrep();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUpdatedAt(next.updatedAt);

      if (showAlert) {
        Alert.alert('Saved', 'Your appointment prep is ready.');
      }
    } catch (error) {
      console.log('Appointment prep save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function toggleChecklist(id: string) {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  async function sharePrep() {
    const checkedLines = checklist
      .map((item) => (item.done ? '✓ ' : '○ ') + item.title)
      .join('\n');

    const message = [
      'Preggy Appointment Prep',
      '',
      'Visit type: ' + (visitType || 'Not set'),
      'Date/time: ' + (visitDate || 'Not set'),
      'Provider: ' + (provider || 'Not set'),
      'Location: ' + (location || 'Not set'),
      '',
      'Questions to ask:',
      questions || 'Not saved',
      '',
      'Symptoms or changes to mention:',
      symptoms || 'Not saved',
      '',
      'Medications or vitamins:',
      medications || 'Not saved',
      '',
      'Notes:',
      notes || 'Not saved',
      '',
      'Checklist:',
      checkedLines,
    ].join('\n');

    try {
      await savePrep(false);
      await Share.share({
        title: 'Preggy Appointment Prep',
        message,
      });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  }

  function clearPrep() {
    Alert.alert('Clear appointment prep?', 'This will remove the saved notes on this screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setVisitType('Routine');
          setVisitDate('');
          setProvider('');
          setLocation('');
          setQuestions('');
          setSymptoms('');
          setMedications('');
          setNotes('');
          setChecklist(starterChecklist);
          setUpdatedAt(null);

          AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
            console.log('Appointment prep clear error:', error);
          });
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={130}>
      <Header title="" back />

      <View style={styles.top}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>APPOINTMENT PREP</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Go in prepared</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Save questions, symptoms, medications, and notes before your next visit.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>PREP SCORE</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>{completion}% ready</Text>
            <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
              Last saved: {formatUpdatedAt(updatedAt)}
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="clipboard-outline" size={35} color={palette.onAccent} />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: percentWidth(completion), backgroundColor: palette.onAccent }]} />
        </View>
      </View>

      <FieldCard icon="calendar-outline" title="Visit details" copy="Type, date, provider, and location.">
        <View style={styles.choiceWrap}>
          {visitTypes.map((item) => (
            <ChoiceChip
              key={item}
              label={item}
              active={visitType === item}
              onPress={() => setVisitType(item)}
            />
          ))}
        </View>

        <TextInput
          value={visitDate}
          onChangeText={setVisitDate}
          placeholder="Date or time, e.g. Sep 18 at 10:00 AM"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />

        <TextInput
          value={provider}
          onChangeText={setProvider}
          placeholder="Doctor, midwife, or clinic"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />

        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Location"
          placeholderTextColor={palette.muted}
          style={[styles.input, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />
      </FieldCard>

      <FieldCard icon="help-circle-outline" title="Questions to ask" copy="Anything you do not want to forget.">
        <TextInput
          value={questions}
          onChangeText={setQuestions}
          placeholder="Example: What should I watch for this week?"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[styles.textArea, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />
      </FieldCard>

      <FieldCard icon="pulse-outline" title="Symptoms to mention" copy="Changes, discomfort, mood, sleep, or movement notes.">
        <TextInput
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder="Write symptoms or changes you want to discuss"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[styles.textArea, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />
      </FieldCard>

      <FieldCard icon="medkit-outline" title="Medications and vitamins" copy="List what you take or want to ask about.">
        <TextInput
          value={medications}
          onChangeText={setMedications}
          placeholder="Prenatal vitamins, medication names, dosage, questions"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[styles.textArea, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />
      </FieldCard>

      <View style={[styles.checkCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.sectionLabel, { color: palette.accent }]}>VISIT CHECKLIST</Text>

        {checklist.map((item) => (
          <AnimatedPressable
            key={item.id}
            onPress={() => toggleChecklist(item.id)}
            style={[styles.checkRow, { backgroundColor: palette.canvas, borderColor: palette.line }]}
          >
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={23}
              color={item.done ? palette.accent : palette.muted}
            />
            <Text style={[styles.checkText, { color: item.done ? palette.ink : palette.text }]}>{item.title}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <FieldCard icon="document-text-outline" title="Extra notes" copy="Anything personal you want to remember.">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Write extra notes here"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[styles.textArea, { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink }]}
        />
      </FieldCard>

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={() => savePrep(true)}
          disabled={saving}
          style={[styles.primaryButton, { backgroundColor: palette.accent, opacity: saving ? 0.72 : 1 }]}
        >
          <Ionicons name="save-outline" size={19} color={palette.onAccent} />
          <Text style={[styles.primaryText, { color: palette.onAccent }]}>
            {saving ? 'Saving...' : 'Save prep'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={sharePrep}
          style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="share-social-outline" size={19} color={palette.accent} />
          <Text style={[styles.secondaryText, { color: palette.accent }]}>Share</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.bottomRow}>
        <AnimatedPressable
          onPress={() => router.push('/doctor-visit-pack' as never)}
          style={[styles.linkButton, { backgroundColor: palette.accentSoft }]}
        >
          <Ionicons name="folder-open-outline" size={18} color={palette.accent} />
          <Text style={[styles.linkText, { color: palette.accent }]}>Open visit pack</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={clearPrep}
          style={[styles.linkButton, { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1 }]}
        >
          <Ionicons name="trash-outline" size={18} color={palette.muted} />
          <Text style={[styles.linkText, { color: palette.muted }]}>Clear</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 18,
    marginBottom: 16,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 7,
  },
  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroLabel: {
    ...type.section,
    opacity: 0.84,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 38,
    lineHeight: 44,
    marginTop: 4,
  },
  heroCopy: {
    ...type.small,
    marginTop: 5,
    opacity: 0.9,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.26)',
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  fieldCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  fieldTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 13,
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  fieldCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 2,
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 12,
  },
  choiceChip: {
    minHeight: 38,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    ...type.tiny,
    fontWeight: '900',
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 10,
    ...type.small,
  },
  textArea: {
    minHeight: 124,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 13,
    ...type.small,
    lineHeight: 21,
  },
  checkCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 12,
  },
  checkRow: {
    minHeight: 60,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 21,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    minWidth: 112,
    minHeight: 56,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    ...type.small,
    fontWeight: '900',
  },
  secondaryText: {
    ...type.small,
    fontWeight: '900',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  linkText: {
    ...type.tiny,
    fontWeight: '900',
  },
});
