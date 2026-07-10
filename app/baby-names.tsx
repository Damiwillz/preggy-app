import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type BabyName = {
  id: string;
  name: string;
  meaning: string;
  tag: 'Girl' | 'Boy' | 'Neutral';
  favorite: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:baby-names';

const tags = ['Girl', 'Boy', 'Neutral'] as const;

export default function BabyNamesScreen() {
  const { palette } = useAppTheme();

  const [names, setNames] = useState<BabyName[]>([]);
  const [name, setName] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tag, setTag] = useState<BabyName['tag']>('Neutral');

  const favoriteCount = useMemo(() => names.filter((item) => item.favorite).length, [names]);

  useEffect(() => {
    async function loadNames() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setNames(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Baby names load error:', error);
      }
    }

    void loadNames();
  }, []);

  async function saveNames(next: BabyName[]) {
    setNames(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Baby names save error:', error);
    }
  }

  async function addName() {
    const cleanName = name.trim();
    const cleanMeaning = meaning.trim();

    if (!cleanName) {
      Alert.alert('Add a name', 'Type a baby name before saving.');
      return;
    }

    const next: BabyName[] = [
      {
        id: String(Date.now()),
        name: cleanName,
        meaning: cleanMeaning,
        tag,
        favorite: false,
        createdAt: Date.now(),
      },
      ...names,
    ];

    setName('');
    setMeaning('');
    setTag('Neutral');
    await saveNames(next);
  }

  async function toggleFavorite(id: string) {
    const next = names.map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );

    await saveNames(next);
  }

  async function deleteName(id: string) {
    const next = names.filter((item) => item.id !== id);
    await saveNames(next);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BABY IDEAS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Baby Names</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Save name ideas, meanings, and favorite the ones that feel special.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="heart-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>NAME SHORTLIST</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {names.length} saved • {favoriteCount} favorite
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              Keep a soft list of names you love.
            </Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW NAME</Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Baby name"
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

          <TextInput
            value={meaning}
            onChangeText={setMeaning}
            placeholder="Meaning or note"
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

          <View style={styles.tagRow}>
            {tags.map((item) => {
              const active = item === tag;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setTag(item)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={addName}
            style={[styles.addButton, { backgroundColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save name</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>SAVED NAMES</Text>

          {names.length ? (
            <View style={styles.nameList}>
              {names.map((item) => (
                <View
                  key={item.id}
                  style={[styles.nameItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <AnimatedPressable
                    onPress={() => toggleFavorite(item.id)}
                    style={[
                      styles.favoriteButton,
                      { backgroundColor: item.favorite ? palette.accentSoft : palette.surface },
                    ]}
                  >
                    <Ionicons
                      name={item.favorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={item.favorite ? palette.accent : palette.muted}
                    />
                  </AnimatedPressable>

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameTop}>
                      <Text style={[styles.nameText, { color: palette.ink }]}>{item.name}</Text>
                      <View style={[styles.nameTag, { backgroundColor: palette.accentSoft }]}>
                        <Text style={[styles.nameTagText, { color: palette.accent }]}>{item.tag}</Text>
                      </View>
                    </View>

                    <Text style={[styles.meaningText, { color: palette.text }]}>
                      {item.meaning || 'No meaning added'}
                    </Text>
                  </View>

                  <AnimatedPressable onPress={() => deleteName(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No baby names saved yet.
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
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  formCard: {
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
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...type.bodyStrong,
    fontSize: 15,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  tagChip: {
    minHeight: 40,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    ...type.tiny,
    fontWeight: '900',
  },
  addButton: {
    minHeight: 52,
    borderRadius: 20,
    marginTop: 13,
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
  nameList: {
    gap: 10,
    marginTop: 14,
  },
  nameItem: {
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nameText: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  nameTag: {
    minHeight: 25,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  nameTagText: {
    ...type.tiny,
    fontWeight: '900',
  },
  meaningText: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
    fontWeight: '800',
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
    marginTop: 14,
    fontWeight: '800',
  },
});
