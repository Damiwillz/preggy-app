import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ChecklistCategory = 'Visit' | 'Hospital' | 'Baby' | 'Personal';

type DocumentItem = {
  id: string;
  title: string;
  copy: string;
  category: ChecklistCategory;
  done: boolean;
  custom?: boolean;
  createdAt?: number;
};

const STORAGE_KEY = 'preggy:documents-checklist';

const categories: Array<ChecklistCategory | 'All'> = ['All', 'Visit', 'Hospital', 'Baby', 'Personal'];

const defaultDocuments: DocumentItem[] = [
  { id: 'photo-id', title: 'Photo ID', copy: 'Passport, driver license, or national ID.', category: 'Personal', done: false },
  { id: 'insurance', title: 'Insurance details', copy: 'Insurance card, policy number, or payment info.', category: 'Personal', done: false },
  { id: 'prenatal-records', title: 'Prenatal records', copy: 'Recent notes, scans, blood work, or test results.', category: 'Visit', done: false },
  { id: 'medication-list', title: 'Medication list', copy: 'Current medicines, vitamins, dosage, and allergies.', category: 'Visit', done: false },
  { id: 'doctor-questions', title: 'Doctor questions', copy: 'Questions you want to ask at your next appointment.', category: 'Visit', done: false },
  { id: 'birth-plan', title: 'Birth plan', copy: 'Labor preferences, support person, and delivery wishes.', category: 'Hospital', done: false },
  { id: 'hospital-forms', title: 'Hospital forms', copy: 'Registration forms, consent forms, and contact details.', category: 'Hospital', done: false },
  { id: 'emergency-contacts', title: 'Emergency contacts', copy: 'Partner, family, doctor, hospital, and backup numbers.', category: 'Hospital', done: false },
  { id: 'baby-id', title: 'Baby paperwork', copy: 'Birth certificate notes, pediatrician info, and baby details.', category: 'Baby', done: false },
  { id: 'going-home', title: 'Going-home details', copy: 'Car seat info, baby outfit, and discharge instructions.', category: 'Baby', done: false },
];

function mergeSavedItems(savedItems: DocumentItem[]) {
  const savedById = new Map(savedItems.map((item) => [item.id, item]));

  const mergedDefaults = defaultDocuments.map((item) => {
    const saved = savedById.get(item.id);

    return {
      ...item,
      done: saved?.done ?? false,
    };
  });

  const customItems = savedItems.filter((item) => item.custom);

  return [...mergedDefaults, ...customItems];
}

function parseItems(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as DocumentItem[]) : [];
  } catch {
    return [];
  }
}

export default function DocumentsChecklistScreen() {
  const { palette } = useAppTheme();

  const [items, setItems] = useState<DocumentItem[]>(defaultDocuments);
  const [activeCategory, setActiveCategory] = useState<ChecklistCategory | 'All'>('All');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setItems(mergeSavedItems(parseItems(saved)));
      } catch (error) {
        console.log('Documents checklist load error:', error);
      }
    }

    void loadItems();
  }, []);

  const completeCount = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((completeCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;

    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const categoryCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((counts, category) => {
      counts[category] = category === 'All'
        ? items.length
        : items.filter((item) => item.category === category).length;

      return counts;
    }, {});
  }, [items]);

  async function saveItems(next: DocumentItem[]) {
    setItems(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Documents checklist save error:', error);
    }
  }

  async function toggleItem(id: string) {
    const next = items.map((item) =>
      item.id === id
        ? {
            ...item,
            done: !item.done,
          }
        : item
    );

    await saveItems(next);
  }

  async function addCustomItem() {
    const clean = draft.trim();

    if (!clean) {
      Alert.alert('Add document', 'Type the document name first.');
      return;
    }

    const next: DocumentItem[] = [
      ...items,
      {
        id: 'custom-' + Date.now(),
        title: clean,
        copy: 'Custom document to keep ready.',
        category: 'Personal',
        done: false,
        custom: true,
        createdAt: Date.now(),
      },
    ];

    setDraft('');
    await saveItems(next);
  }

  async function deleteCustomItem(id: string) {
    const next = items.filter((item) => item.id !== id);
    await saveItems(next);
  }

  function resetChecklist() {
    Alert.alert('Reset checklist?', 'This will uncheck every document.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void saveItems(items.map((item) => ({ ...item, done: false })));
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>PLANNING</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Documents Checklist</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Keep important papers ready for visits, hospital, and baby paperwork.
        </Text>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.accentRail, { backgroundColor: palette.accent }]} />

        <View style={styles.progressTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>READY STATUS</Text>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>
              {completeCount}/{items.length} ready
            </Text>
            <Text style={[styles.progressCopy, { color: palette.text }]}>
              {items.length - completeCount} document{items.length - completeCount === 1 ? '' : 's'} left to prepare.
            </Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percentValue, { color: palette.accent }]}>{progress}%</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: progress + '%', backgroundColor: palette.accent }]} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={() => router.push('/birth-plan' as never)}
          style={[styles.actionButton, { backgroundColor: palette.accent }]}
        >
          <Ionicons name="document-text-outline" size={18} color={palette.onAccent} />
          <Text style={[styles.actionButtonText, { color: palette.onAccent }]}>Birth plan</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/hospital-info' as never)}
          style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="business-outline" size={18} color={palette.accent} />
          <Text style={[styles.secondaryButtonText, { color: palette.ink }]}>Hospital</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.addCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.cardLabel, { color: palette.accent }]}>ADD YOUR OWN</Text>

        <View style={[styles.inputWrap, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Example: lab result printout"
            placeholderTextColor={palette.muted}
            style={[styles.input, { color: palette.ink }]}
          />

          <AnimatedPressable onPress={addCustomItem} style={[styles.addButton, { backgroundColor: palette.accent }]}>
            <Ionicons name="add" size={18} color={palette.onAccent} />
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {categories.map((category) => {
          const active = activeCategory === category;

          return (
            <AnimatedPressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? palette.accent : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: active ? palette.onAccent : palette.ink }]}>
                {category}
              </Text>
              <Text style={[styles.categoryCount, { color: active ? palette.onAccent : palette.muted }]}>
                {categoryCounts[category]}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.listHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>CHECKLIST</Text>
            <Text style={[styles.listTitle, { color: palette.ink }]}>
              {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
            </Text>
          </View>

          <AnimatedPressable onPress={resetChecklist} style={[styles.resetButton, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.resetText, { color: palette.accent }]}>Reset</Text>
          </AnimatedPressable>
        </View>

        {filteredItems.map((item, index) => (
          <DocumentRow
            key={item.id}
            item={item}
            last={index === filteredItems.length - 1}
            onToggle={() => toggleItem(item.id)}
            onDelete={() => deleteCustomItem(item.id)}
          />
        ))}
      </View>
    </Screen>
  );
}

function DocumentRow({
  item,
  last,
  onToggle,
  onDelete,
}: {
  item: DocumentItem;
  last: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.documentRow, { borderBottomColor: last ? 'transparent' : palette.line }]}>
      <AnimatedPressable
        onPress={onToggle}
        style={[
          styles.checkButton,
          {
            backgroundColor: item.done ? palette.accent : palette.canvas,
            borderColor: item.done ? palette.accent : palette.line,
          },
        ]}
      >
        <Ionicons
          name={item.done ? 'checkmark' : 'ellipse-outline'}
          size={18}
          color={item.done ? palette.onAccent : palette.accent}
        />
      </AnimatedPressable>

      <AnimatedPressable onPress={onToggle} style={styles.documentBody}>
        <Text style={[styles.documentTitle, { color: palette.ink }]}>{item.title}</Text>
        <Text style={[styles.documentCopy, { color: palette.text }]} numberOfLines={2}>
          {item.copy}
        </Text>
      </AnimatedPressable>

      <View style={[styles.badge, { backgroundColor: palette.accentSoft }]}>
        <Text style={[styles.badgeText, { color: palette.accent }]}>{item.category}</Text>
      </View>

      {item.custom ? (
        <AnimatedPressable onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={palette.danger} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 10,
    marginBottom: 14,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  progressTitle: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
    marginTop: 3,
  },
  progressCopy: {
    ...type.small,
    marginTop: 2,
  },
  percentBadge: {
    width: 66,
    height: 66,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentValue: {
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  track: {
    height: 9,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 15,
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  addCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
  },
  inputWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 10,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 52,
    ...type.body,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 8,
    paddingRight: 8,
    marginBottom: 12,
  },
  categoryChip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  categoryText: {
    ...type.small,
    fontWeight: '900',
  },
  categoryCount: {
    ...type.tiny,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 15,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },
  resetButton: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    ...type.small,
    fontWeight: '900',
  },
  documentRow: {
    minHeight: 78,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
  },
  documentTitle: {
    ...type.bodyStrong,
  },
  documentCopy: {
    ...type.small,
    marginTop: 1,
  },
  badge: {
    minHeight: 28,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.tiny,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
