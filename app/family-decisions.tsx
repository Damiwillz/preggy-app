import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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

type DecisionCategory =
  | 'Birth'
  | 'Baby care'
  | 'Home'
  | 'Family';

type DecisionStatus = 'Exploring' | 'Decided';

type FamilyDecision = {
  id: string;
  title: string;
  category: DecisionCategory;
  notes: string;
  status: DecisionStatus;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:family-decisions';

const categories: DecisionCategory[] = [
  'Birth',
  'Baby care',
  'Home',
  'Family',
];

const categoryIcons: Record<
  DecisionCategory,
  keyof typeof Ionicons.glyphMap
> = {
  Birth: 'heart-outline',
  'Baby care': 'happy-outline',
  Home: 'home-outline',
  Family: 'people-outline',
};

function parseDecisions(raw: string | null): FamilyDecision[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? (parsed as FamilyDecision[])
      : [];
  } catch {
    return [];
  }
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function FamilyDecisionsScreen() {
  const { palette } = useAppTheme();

  const [decisions, setDecisions] = useState<FamilyDecision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] =
    useState<DecisionCategory>('Birth');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setDecisions(parseDecisions(saved)))
      .catch((error) => {
        console.log('Family decisions load error:', error);
      });
  }, []);

  async function saveDecisions(next: FamilyDecision[]) {
    setDecisions(next);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.log('Family decisions save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again.'
      );
    }
  }

  async function addDecision() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert(
        'Add a decision',
        'Enter what your family is deciding.'
      );
      return;
    }

    const next: FamilyDecision[] = [
      {
        id: String(Date.now()),
        title: cleanTitle,
        category,
        notes: notes.trim(),
        status: 'Exploring',
        createdAt: Date.now(),
      },
      ...decisions,
    ];

    await saveDecisions(next);

    setTitle('');
    setNotes('');
    setCategory('Birth');
    setShowForm(false);
  }

  async function toggleStatus(id: string) {
    const next: FamilyDecision[] = decisions.map((decision) =>
      decision.id === id
        ? {
            ...decision,
            status:
              decision.status === 'Decided'
                ? 'Exploring'
                : 'Decided',
          }
        : decision
    );

    await saveDecisions(next);
  }

  function deleteDecision(id: string) {
    Alert.alert(
      'Delete this decision?',
      'This family decision and its notes will be removed.',
      [
        {
          text: 'Keep it',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void saveDecisions(
              decisions.filter(
                (decision) => decision.id !== id
              )
            );
          },
        },
      ]
    );
  }

  const decidedCount = useMemo(
    () =>
      decisions.filter(
        (decision) => decision.status === 'Decided'
      ).length,
    [decisions]
  );

  const exploringCount = decisions.length - decidedCount;

  return (
    <Screen bottomSpace={100}>
      <Header title="Family Decisions" back />

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
              name="git-branch-outline"
              size={27}
              color={palette.onAccent}
            />
          </View>

          <AnimatedPressable
            onPress={() =>
              setShowForm((current) => !current)
            }
            style={styles.addButton}
          >
            <Ionicons
              name={showForm ? 'close' : 'add'}
              size={20}
              color={palette.onAccent}
            />

            <Text
              style={[
                styles.addButtonText,
                { color: palette.onAccent },
              ]}
            >
              {showForm ? 'Close' : 'New'}
            </Text>
          </AnimatedPressable>
        </View>

        <Text
          style={[
            styles.eyebrow,
            { color: palette.onAccent },
          ]}
        >
          SHARED CLARITY
        </Text>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          Make important choices together.
        </Text>

        <Text style={styles.heroCopy}>
          Save what you are considering, why it matters,
          and what your family finally decides.
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {exploringCount}
            </Text>
            <Text style={styles.statLabel}>
              Exploring
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {decidedCount}
            </Text>
            <Text style={styles.statLabel}>
              Decided
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {decisions.length}
            </Text>
            <Text style={styles.statLabel}>
              Total
            </Text>
          </View>
        </View>
      </View>

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
          <Text
            style={[
              styles.formEyebrow,
              { color: palette.accent },
            ]}
          >
            NEW DECISION
          </Text>

          <Text
            style={[
              styles.formTitle,
              { color: palette.ink },
            ]}
          >
            What are you deciding?
          </Text>

          <Text
            style={[
              styles.label,
              { color: palette.text },
            ]}
          >
            Decision
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: Who visits after birth?"
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

          <Text
            style={[
              styles.label,
              { color: palette.text },
            ]}
          >
            Category
          </Text>

          <View style={styles.categoryRow}>
            {categories.map((item) => {
              const active = category === item;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryButton,
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
                  <Ionicons
                    name={categoryIcons[item]}
                    size={16}
                    color={
                      active
                        ? palette.onAccent
                        : palette.accent
                    }
                  />

                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: active
                          ? palette.onAccent
                          : palette.ink,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text
            style={[
              styles.label,
              { color: palette.text },
            ]}
          >
            Thoughts and reasons
          </Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Options, concerns, preferences, and anything you want to remember"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: palette.canvas,
                borderColor: palette.line,
                color: palette.ink,
              },
            ]}
          />

          <AnimatedPressable
            onPress={() => void addDecision()}
            style={[
              styles.saveButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: palette.onAccent },
              ]}
            >
              Save decision
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={palette.onAccent}
            />
          </AnimatedPressable>
        </View>
      ) : null}

      <View style={styles.sectionHeading}>
        <View>
          <Text
            style={[
              styles.sectionEyebrow,
              { color: palette.accent },
            ]}
          >
            DECISION BOARD
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: palette.ink },
            ]}
          >
            Your family choices
          </Text>
        </View>
      </View>

      {decisions.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="git-branch-outline"
              size={30}
              color={palette.accent}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              { color: palette.ink },
            ]}
          >
            No decisions yet
          </Text>

          <Text
            style={[
              styles.emptyCopy,
              { color: palette.text },
            ]}
          >
            Add a choice your family wants to discuss,
            compare, or remember.
          </Text>

          <AnimatedPressable
            onPress={() => setShowForm(true)}
            style={[
              styles.emptyButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons
              name="add"
              size={19}
              color={palette.onAccent}
            />
            <Text
              style={[
                styles.emptyButtonText,
                { color: palette.onAccent },
              ]}
            >
              Add first decision
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.list}>
          {decisions.map((decision) => {
            const decided = decision.status === 'Decided';

            return (
              <View
                key={decision.id}
                style={[
                  styles.decisionCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: decided
                      ? palette.success
                      : palette.line,
                  },
                ]}
              >
                <View style={styles.decisionTop}>
                  <View
                    style={[
                      styles.decisionIcon,
                      {
                        backgroundColor:
                          palette.accentSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        categoryIcons[decision.category]
                      }
                      size={21}
                      color={palette.accent}
                    />
                  </View>

                  <View style={styles.decisionContent}>
                    <Text
                      style={[
                        styles.decisionCategory,
                        { color: palette.accent },
                      ]}
                    >
                      {decision.category.toUpperCase()}
                    </Text>

                    <Text
                      style={[
                        styles.decisionTitle,
                        { color: palette.ink },
                      ]}
                    >
                      {decision.title}
                    </Text>
                  </View>

                  <AnimatedPressable
                    onPress={() =>
                      deleteDecision(decision.id)
                    }
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={palette.muted}
                    />
                  </AnimatedPressable>
                </View>

                {decision.notes ? (
                  <Text
                    style={[
                      styles.decisionNotes,
                      { color: palette.text },
                    ]}
                  >
                    {decision.notes}
                  </Text>
                ) : null}

                <View style={styles.decisionFooter}>
                  <Text
                    style={[
                      styles.dateText,
                      { color: palette.muted },
                    ]}
                  >
                    Added {formatDate(decision.createdAt)}
                  </Text>

                  <AnimatedPressable
                    onPress={() =>
                      void toggleStatus(decision.id)
                    }
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: decided
                          ? palette.success
                          : palette.accentSoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        decided
                          ? 'checkmark-circle'
                          : 'time-outline'
                      }
                      size={17}
                      color={
                        decided
                          ? '#FFFFFF'
                          : palette.accent
                      }
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: decided
                            ? '#FFFFFF'
                            : palette.accent,
                        },
                      ]}
                    >
                      {decision.status}
                    </Text>
                  </AnimatedPressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View
        style={[
          styles.tipCard,
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
            styles.tipText,
            { color: palette.text },
          ]}
        >
          It is okay to revisit a decision when your needs,
          information, or circumstances change.
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
    marginBottom: 18,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    minHeight: 42,
    borderRadius: 17,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: {
    ...type.small,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.3,
    marginTop: 25,
  },
  heroTitle: {
    ...type.title,
    fontSize: 29,
    lineHeight: 35,
    marginTop: 5,
    maxWidth: 315,
  },
  heroCopy: {
    ...type.small,
    color: 'rgba(255,255,255,0.83)',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 320,
  },
  stats: {
    minHeight: 74,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    paddingHorizontal: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 25,
  },
  statLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 23,
  },
  formEyebrow: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  formTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 28,
    marginTop: 3,
    marginBottom: 14,
  },
  label: {
    ...type.small,
    marginTop: 10,
    marginBottom: 7,
  },
  input: {
    ...type.body,
    minHeight: 55,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 112,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    ...type.small,
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 19,
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    ...type.bodyStrong,
  },
  sectionHeading: {
    marginBottom: 12,
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
  emptyCard: {
    minHeight: 275,
    borderWidth: 1,
    borderRadius: 28,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 14,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 5,
    maxWidth: 280,
  },
  emptyButton: {
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  emptyButtonText: {
    ...type.small,
  },
  list: {
    gap: 11,
  },
  decisionCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 16,
  },
  decisionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  decisionIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionContent: {
    flex: 1,
  },
  decisionCategory: {
    ...type.tiny,
    letterSpacing: 1,
  },
  decisionTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
    marginTop: 3,
  },
  deleteButton: {
    padding: 5,
  },
  decisionNotes: {
    ...type.small,
    lineHeight: 20,
    marginTop: 13,
  },
  decisionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dateText: {
    ...type.tiny,
  },
  statusButton: {
    minHeight: 36,
    borderRadius: 14,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    ...type.tiny,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 22,
  },
  tipText: {
    ...type.small,
    flex: 1,
    lineHeight: 20,
  },
});
