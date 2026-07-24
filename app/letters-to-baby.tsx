import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BabyLetter = {
  id: string;
  week: number;
  title: string;
  body: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:letters-to-baby';

const prompts = [
  'Today I felt you move and it made me think...',
  'One thing I cannot wait to tell you is...',
  'This week, I hope you know...',
  'Your family is getting ready for you by...',
];

function parseLetters(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BabyLetter[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value: number) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LettersToBabyScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [letters, setLetters] = useState<BabyLetter[]>([]);
  const [week, setWeek] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    async function loadLetters() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setLetters(parseLetters(saved));
      } catch (error) {
        console.log('Letters load error:', error);
      }
    }

    void loadLetters();
  }, []);

  async function saveLetters(nextLetters: BabyLetter[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextLetters));
    } catch (error) {
      console.log('Letters save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function usePrompt(prompt: string) {
    if (!body.trim()) {
      setBody(prompt);
      return;
    }

    setBody(`${body.trim()}\n\n${prompt}`);
  }

  function saveLetter() {
    const cleanWeek = Number(week.replace(/[^0-9]/g, ''));
    const cleanTitle = title.trim() || `Week ${cleanWeek} letter`;
    const cleanBody = body.trim();

    if (!Number.isFinite(cleanWeek) || cleanWeek < 1 || cleanWeek > 42) {
      Alert.alert('Add week number', 'Enter a pregnancy week between 1 and 42.');
      return;
    }

    if (!cleanBody) {
      Alert.alert('Write a letter', 'Type a short note before saving.');
      return;
    }

    const nextLetter: BabyLetter = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      week: cleanWeek,
      title: cleanTitle,
      body: cleanBody,
      createdAt: Date.now(),
    };

    const nextLetters = [nextLetter, ...letters];

    setLetters(nextLetters);
    void saveLetters(nextLetters);

    setWeek('');
    setTitle('');
    setBody('');
  }

  function deleteLetter(letterId: string) {
    Alert.alert('Delete letter?', 'This will remove the letter from your memories.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const nextLetters = letters.filter((letter) => letter.id !== letterId);
          setLetters(nextLetters);
          void saveLetters(nextLetters);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Letters to Baby" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="mail-outline" size={26} color={palette.accent} />
        </View>

        <Text style={styles.eyebrow}>MEMORIES</Text>
        <Text style={styles.title}>Letters to baby</Text>
        <Text style={styles.copy}>Write little notes your baby can read someday. One week, one memory at a time.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{letters.length}</Text>
          <Text style={styles.summaryLabel}>letters</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{letters[0] ? `Week ${letters[0].week}` : '--'}</Text>
          <Text style={styles.summaryLabel}>latest</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Write a new letter</Text>

        <TextInput
          value={week}
          onChangeText={setWeek}
          placeholder="Pregnancy week, example 24"
          placeholderTextColor={palette.muted}
          keyboardType="number-pad"
          style={styles.input}
        />

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title, optional"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Dear baby..."
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.input, styles.letterInput]}
        />

        <Text style={styles.promptLabel}>Need a gentle start?</Text>

        <View style={styles.promptList}>
          {prompts.map((prompt) => (
            <AnimatedPressable key={prompt} onPress={() => usePrompt(prompt)} style={styles.promptChip}>
              <Text style={styles.promptText}>{prompt}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <AnimatedPressable onPress={saveLetter} style={styles.primaryButton}>
          <Ionicons name="add-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Save letter</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionLabel}>SAVED LETTERS</Text>

      {letters.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="heart-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No letters yet</Text>
          <Text style={styles.emptyCopy}>Write your first note above and save it here.</Text>
        </View>
      ) : (
        letters.map((letter) => (
          <View key={letter.id} style={styles.letterCard}>
            <View style={styles.letterTop}>
              <View style={styles.letterIcon}>
                <Ionicons name="mail-open-outline" size={20} color={palette.accent} />
              </View>

              <View style={styles.letterInfo}>
                <Text style={styles.letterTitle}>{letter.title}</Text>
                <Text style={styles.letterMeta}>
                  Week {letter.week} • {formatDate(letter.createdAt)}
                </Text>
              </View>

              <AnimatedPressable onPress={() => deleteLetter(letter.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={18} color={palette.muted} />
              </AnimatedPressable>
            </View>

            <Text style={styles.letterBody}>{letter.body}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}

type AppPalette = ReturnType<typeof useAppTheme>['palette'];

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    hero: {
      borderRadius: 30,
      padding: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginTop: 12,
      marginBottom: 14,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
      marginBottom: 16,
    },
    eyebrow: {
      ...type.section,
      color: palette.accent,
      marginBottom: 4,
    },
    title: {
      ...type.title,
      color: palette.ink,
    },
    copy: {
      ...type.body,
      color: palette.text,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.accentSoft,
      borderWidth: 1,
      borderColor: palette.line,
    },
    summaryValue: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 20,
    },
    summaryLabel: {
      ...type.tiny,
      color: palette.text,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    card: {
      borderRadius: 28,
      padding: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 16,
    },
    cardTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginBottom: 12,
      fontSize: 18,
    },
    input: {
      ...type.body,
      color: palette.ink,
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: palette.canvas,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    letterInput: {
      minHeight: 160,
      paddingTop: 14,
      textAlignVertical: 'top',
    },
    promptLabel: {
      ...type.tiny,
      color: palette.text,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    promptList: {
      gap: 8,
      marginBottom: 14,
    },
    promptChip: {
      borderRadius: 18,
      padding: 12,
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.line,
    },
    promptText: {
      ...type.small,
      color: palette.text,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 20,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonText: {
      ...type.bodyStrong,
      color: palette.onAccent,
    },
    sectionLabel: {
      ...type.section,
      color: palette.accent,
      marginBottom: 10,
      marginTop: 4,
    },
    emptyCard: {
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    emptyTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginTop: 12,
    },
    emptyCopy: {
      ...type.small,
      color: palette.text,
      textAlign: 'center',
      marginTop: 4,
    },
    letterCard: {
      borderRadius: 26,
      padding: 15,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 12,
    },
    letterTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    letterIcon: {
      width: 42,
      height: 42,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
    },
    letterInfo: {
      flex: 1,
    },
    letterTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 17,
    },
    letterMeta: {
      ...type.tiny,
      color: palette.text,
      marginTop: 3,
      textTransform: 'uppercase',
    },
    deleteButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.canvas,
    },
    letterBody: {
      ...type.body,
      color: palette.text,
    },
  });
}
