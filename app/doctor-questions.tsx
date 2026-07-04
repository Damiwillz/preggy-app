import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type DoctorQuestion = {
  id: string;
  text: string;
  answered: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:doctor-questions';

export default function DoctorQuestionsScreen() {
  const { palette } = useAppTheme();

  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [draft, setDraft] = useState('');

  const answeredCount = useMemo(
    () => questions.filter((question) => question.answered).length,
    [questions]
  );

  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  useEffect(() => {
    async function loadQuestions() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        setQuestions(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Doctor questions load error:', error);
      }
    }

    void loadQuestions();
  }, []);

  async function saveQuestions(next: DoctorQuestion[]) {
    setQuestions(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Doctor questions save error:', error);
    }
  }

  async function addQuestion() {
    const clean = draft.trim();

    if (!clean) {
      Alert.alert('Add a question', 'Type a question before adding it.');
      return;
    }

    const next: DoctorQuestion[] = [
      {
        id: String(Date.now()),
        text: clean,
        answered: false,
        createdAt: Date.now(),
      },
      ...questions,
    ];

    setDraft('');
    await saveQuestions(next);
  }

  async function toggleAnswered(id: string) {
    const next = questions.map((question) =>
      question.id === id
        ? {
            ...question,
            answered: !question.answered,
          }
        : question
    );

    await saveQuestions(next);
  }

  async function deleteQuestion(id: string) {
    const next = questions.filter((question) => question.id !== id);
    await saveQuestions(next);
  }

  async function clearAnswered() {
    const next = questions.filter((question) => !question.answered);
    await saveQuestions(next);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>APPOINTMENT PREP</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Questions for Doctor</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Save questions before your next visit so you do not forget what to ask.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: palette.onAccent }]}>QUESTION LIST</Text>
              <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
                {answeredCount}/{questions.length} answered
              </Text>
            </View>

            <View style={styles.heroIcon}>
              <Ionicons name="chatbubbles-outline" size={31} color={palette.onAccent} />
            </View>
          </View>

          <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
            {questions.length ? `${progress}% of your questions marked answered.` : 'Add your first question below.'}
          </Text>

          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={[styles.inputCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW QUESTION</Text>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="What should I ask at my next appointment?"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <AnimatedPressable
            onPress={addQuestion}
            style={[styles.addButton, { backgroundColor: palette.accent, borderColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Add question</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.listHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>SAVED QUESTIONS</Text>
              <Text style={[styles.listTitle, { color: palette.ink }]}>
                {questions.length} total
              </Text>
            </View>

            <AnimatedPressable
              onPress={clearAnswered}
              style={[styles.clearButton, { backgroundColor: palette.accentSoft }]}
            >
              <Text style={[styles.clearText, { color: palette.accent }]}>Clear answered</Text>
            </AnimatedPressable>
          </View>

          {questions.length ? (
            <View style={styles.questionList}>
              {questions.map((question) => (
                <View
                  key={question.id}
                  style={[
                    styles.questionItem,
                    {
                      backgroundColor: question.answered ? palette.accentSoft : palette.canvas,
                      borderColor: question.answered ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <AnimatedPressable
                    onPress={() => toggleAnswered(question.id)}
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: question.answered ? palette.accent : palette.surface,
                        borderColor: question.answered ? palette.accent : palette.line,
                      },
                    ]}
                  >
                    <Ionicons
                      name={question.answered ? 'checkmark' : 'ellipse-outline'}
                      size={18}
                      color={question.answered ? palette.onAccent : palette.accent}
                    />
                  </AnimatedPressable>

                  <Text
                    style={[
                      styles.questionText,
                      {
                        color: palette.ink,
                        textDecorationLine: question.answered ? 'line-through' : 'none',
                        opacity: question.answered ? 0.75 : 1,
                      },
                    ]}
                  >
                    {question.text}
                  </Text>

                  <AnimatedPressable
                    onPress={() => deleteQuestion(question.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No questions saved yet.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
    minHeight: 174,
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
    fontSize: 32,
    lineHeight: 38,
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
  heroTrack: {
    height: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    marginTop: 12,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  inputCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 112,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...type.tiny,
    fontWeight: '900',
  },
  questionList: {
    marginTop: 16,
    gap: 10,
  },
  questionItem: {
    minHeight: 66,
    borderRadius: 20,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    flex: 1,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 16,
    fontWeight: '800',
  },
});
