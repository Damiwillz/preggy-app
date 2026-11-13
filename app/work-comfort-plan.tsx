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

type WorkNeed = {
  id: string;
  title: string;
  copy: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type SavedWorkPlan = {
  workplace: string;
  contact: string;
  startDate: string;
  selectedNeeds: string[];
  note: string;
  savedAt: string;
};

const STORAGE_KEY = 'preggy:work-comfort-plan';

const workNeeds: WorkNeed[] = [
  {
    id: 'breaks',
    title: 'Flexible breaks',
    copy: 'Short breaks for rest, hydration or movement.',
    icon: 'time-outline',
  },
  {
    id: 'seating',
    title: 'Supportive seating',
    copy: 'A suitable chair, footrest or seated duties.',
    icon: 'desktop-outline',
  },
  {
    id: 'remote',
    title: 'Remote work days',
    copy: 'Work from home when symptoms or travel are difficult.',
    icon: 'home-outline',
  },
  {
    id: 'hours',
    title: 'Adjusted hours',
    copy: 'Temporary changes to start, finish or shift times.',
    icon: 'calendar-outline',
  },
  {
    id: 'standing',
    title: 'Reduced standing',
    copy: 'Limit long periods of standing without rest.',
    icon: 'body-outline',
  },
  {
    id: 'lifting',
    title: 'Lifting support',
    copy: 'Avoid or receive help with heavy lifting.',
    icon: 'fitness-outline',
  },
  {
    id: 'restroom',
    title: 'Restroom access',
    copy: 'Easy access without unnecessary delay.',
    icon: 'walk-outline',
  },
  {
    id: 'appointments',
    title: 'Appointment flexibility',
    copy: 'Time for antenatal visits and recommended tests.',
    icon: 'medical-outline',
  },
];

export default function WorkComfortPlanScreen() {
  const { palette } = useAppTheme();

  const [workplace, setWorkplace] = useState('');
  const [contact, setContact] = useState('');
  const [startDate, setStartDate] = useState('');
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const selectedItems = useMemo(
    () =>
      workNeeds.filter((item) =>
        selectedNeeds.includes(item.id)
      ),
    [selectedNeeds]
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;

        const saved = JSON.parse(value) as SavedWorkPlan;

        setWorkplace(saved.workplace ?? '');
        setContact(saved.contact ?? '');
        setStartDate(saved.startDate ?? '');
        setSelectedNeeds(
          Array.isArray(saved.selectedNeeds)
            ? saved.selectedNeeds
            : []
        );
        setNote(saved.note ?? '');
        setSavedAt(saved.savedAt ?? null);
      })
      .catch((error) => {
        console.log('Work Comfort Plan load error:', error);
      });
  }, []);

  function toggleNeed(id: string) {
    setSelectedNeeds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function savePlan(showMessage = true) {
    if (!selectedNeeds.length) {
      Alert.alert(
        'Choose a workplace need',
        'Select at least one adjustment for your plan.'
      );
      return false;
    }

    const now = new Date().toISOString();

    const plan: SavedWorkPlan = {
      workplace: workplace.trim(),
      contact: contact.trim(),
      startDate: startDate.trim(),
      selectedNeeds,
      note: note.trim(),
      savedAt: now,
    };

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(plan)
      );

      setSavedAt(now);

      if (showMessage) {
        Alert.alert(
          'Work plan saved',
          'Your workplace comfort plan is stored privately on this phone.'
        );
      }

      return true;
    } catch (error) {
      console.log('Work Comfort Plan save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again in a moment.'
      );
      return false;
    }
  }

  async function shareRequest() {
    if (!selectedNeeds.length) {
      Alert.alert(
        'Choose a workplace need',
        'Select what you would like to request first.'
      );
      return;
    }

    await savePlan(false);

    const greeting = contact.trim()
      ? 'Hello ' + contact.trim() + ','
      : 'Hello,';

    const lines = [
      greeting,
      '',
      'I would like to discuss some temporary workplace adjustments to support me during my pregnancy.',
      '',
      'The adjustments I would like us to consider are:',
      ...selectedItems.map(
        (item) => '• ' + item.title + ' — ' + item.copy
      ),
      startDate.trim() ? '' : null,
      startDate.trim()
        ? 'Preferred start date: ' + startDate.trim()
        : null,
      note.trim() ? '' : null,
      note.trim() ? 'Additional context: ' + note.trim() : null,
      '',
      'I would appreciate the opportunity to discuss what is practical and agree on a suitable plan together.',
      '',
      'Thank you.',
    ].filter(Boolean) as string[];

    await Share.share({
      title: 'Pregnancy workplace adjustment request',
      message: lines.join('\n'),
    });
  }

  return (
    <Screen bottomSpace={80}>
      <Header title="Work Comfort Plan" back />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.accent },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name="briefcase-outline"
              size={31}
              color={palette.onAccent}
            />
          </View>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: palette.onAccent },
            ]}
          >
            <Text
              style={[
                styles.countValue,
                { color: palette.accent },
              ]}
            >
              {selectedNeeds.length}
            </Text>
            <Text
              style={[
                styles.countLabel,
                { color: palette.accent },
              ]}
            >
              selected
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Make work fit this season.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          Prepare a clear, respectful request for temporary workplace support during pregnancy.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.stepLabel, { color: palette.accent }]}>
          WORK DETAILS
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Who is this plan for?
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          These details are optional and stay on your phone.
        </Text>

        <TextInput
          value={workplace}
          onChangeText={setWorkplace}
          placeholder="Workplace or company"
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

        <TextInput
          value={contact}
          onChangeText={setContact}
          placeholder="Manager or HR contact name"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            styles.spacedInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="Preferred start date"
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            styles.spacedInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.stepLabel, { color: palette.accent }]}>
          YOUR NEEDS
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          What would make work safer and easier?
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Choose every adjustment you want to discuss.
        </Text>

        <View style={styles.needList}>
          {workNeeds.map((item) => {
            const selected = selectedNeeds.includes(item.id);

            return (
              <AnimatedPressable
                key={item.id}
                onPress={() => toggleNeed(item.id)}
                style={[
                  styles.needItem,
                  {
                    backgroundColor: selected
                      ? palette.accentSoft
                      : palette.canvas,
                    borderColor: selected
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.needIcon,
                    {
                      backgroundColor: selected
                        ? palette.accent
                        : palette.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      selected
                        ? palette.onAccent
                        : palette.muted
                    }
                  />
                </View>

                <View style={styles.needContent}>
                  <Text
                    style={[
                      styles.needTitle,
                      { color: palette.ink },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.needCopy,
                      { color: palette.text },
                    ]}
                  >
                    {item.copy}
                  </Text>
                </View>

                <Ionicons
                  name={
                    selected
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={22}
                  color={
                    selected
                      ? palette.accent
                      : palette.muted
                  }
                />
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.stepLabel, { color: palette.accent }]}>
          ADD CONTEXT
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          Anything else to explain?
        </Text>
        <Text style={[styles.sectionCopy, { color: palette.text }]}>
          Add helpful context without including more health information than you want to share.
        </Text>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Example: My symptoms are more difficult during long standing shifts..."
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

      {selectedItems.length > 0 ? (
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.line,
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <View>
              <Text style={[styles.stepLabel, { color: palette.accent }]}>
                REQUEST PREVIEW
              </Text>
              <Text style={[styles.previewTitle, { color: palette.ink }]}>
                Your selected adjustments
              </Text>
            </View>

            <View
              style={[
                styles.previewIcon,
                { backgroundColor: palette.accent },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={21}
                color={palette.onAccent}
              />
            </View>
          </View>

          {selectedItems.map((item) => (
            <View key={item.id} style={styles.previewRow}>
              <Ionicons
                name="checkmark-circle"
                size={19}
                color={palette.accent}
              />
              <Text
                style={[
                  styles.previewText,
                  { color: palette.text },
                ]}
              >
                {item.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={() => savePlan()}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="save-outline"
            size={21}
            color={palette.accent}
          />
          <Text
            style={[
              styles.secondaryButtonText,
              { color: palette.ink },
            ]}
          >
            Save privately
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={shareRequest}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="share-outline"
            size={21}
            color={palette.onAccent}
          />
          <Text
            style={[
              styles.primaryButtonText,
              { color: palette.onAccent },
            ]}
          >
            Create and share request
          </Text>
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.infoNote,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={palette.accent}
        />
        <Text style={[styles.infoText, { color: palette.text }]}>
          This tool creates a conversation draft. Workplace rights and required documentation vary by location and employer.
        </Text>
      </View>

      {savedAt ? (
        <Text style={[styles.savedText, { color: palette.muted }]}>
          Last saved {new Date(savedAt).toLocaleString()}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 15,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 68,
    minHeight: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countValue: {
    ...type.title,
    fontSize: 21,
    lineHeight: 23,
  },
  countLabel: {
    ...type.tiny,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 40,
  },
  heroCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.88,
  },
  card: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 15,
  },
  stepLabel: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 3,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 15,
  },
  input: {
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 15,
    ...type.body,
  },
  spacedInput: {
    marginTop: 10,
  },
  needList: {
    gap: 9,
  },
  needItem: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 21,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  needIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needContent: {
    flex: 1,
    marginHorizontal: 11,
  },
  needTitle: {
    ...type.bodyStrong,
  },
  needCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 3,
  },
  noteInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    ...type.body,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 15,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  previewTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 3,
  },
  previewIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  previewText: {
    ...type.small,
    flex: 1,
  },
  actions: {
    gap: 10,
  },
  secondaryButton: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  infoNote: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    ...type.small,
    lineHeight: 19,
    flex: 1,
  },
  savedText: {
    ...type.tiny,
    textAlign: 'center',
    marginTop: 13,
  },
});
